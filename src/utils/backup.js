import JSZip from 'jszip'
import db from '../db'
import { logImport } from './importLog'
import { compressImageBlob } from './image'

// —— 常量 ——
const BACKUP_META_ID = 'import_backup_meta'
const LEGACY_BACKUP_ID = 'last_import_backup'
const BACKUP_TABLES = ['dishCategory', 'ingredientCategory', 'dish', 'ingredient']
// 批次务必保持较小：菜品含 Base64 图片时，批次越大内存峰值越高（安卓 WebView 堆小，易 OOM）
const BATCH_SIZE = 10

function base64ToBlob(base64Data, contentType) {
  const byteCharacters = atob(base64Data)
  const byteArrays = []
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }
  return new Blob(byteArrays, { type: contentType })
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function formatTimestampForFilename(ts) {
  const date = new Date(ts)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}${m}${d}_${h}${min}`
}

// 让出主线程，给 UI 一帧渲染机会，避免长时间霸占导致页面假死
function yieldToUI() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// 分批写入，每批之间让出主线程
async function bulkAddInBatches(table, items, size = BATCH_SIZE) {
  for (let i = 0; i < items.length; i += size) {
    await table.bulkAdd(items.slice(i, i + size))
    await yieldToUI()
  }
}

// —— 导入前备份（v2：分片流式存储）——
// 旧实现把全部数据（含所有图片 base64）打包成单条巨型记录一次性 put，
// 结构化克隆时内存瞬间翻倍，大库直接把安卓 WebView 顶爆（OOM 闪退）。
// v2 改为每条记录独立存储，流式游标逐批写入，内存峰值 = 一个批次大小。
async function createImportBackup() {
  await db.backup.clear()
  await db.backup.put({ id: BACKUP_META_ID, table: 'meta', createdAt: Date.now() })

  for (const tableName of BACKUP_TABLES) {
    let batch = []
    await db[tableName].each(item => {
      batch.push({ id: `${tableName}:${item.id}`, table: tableName, data: item })
      if (batch.length >= BATCH_SIZE) {
        const toPut = batch
        batch = []
        return db.backup.bulkPut(toPut)
      }
    })
    if (batch.length > 0) {
      await db.backup.bulkPut(batch)
    }
    batch = null
    await yieldToUI()
  }
}

export async function exportData() {
  const dishCategories = await db.dishCategory.toArray()
  const ingredientCategories = await db.ingredientCategory.toArray()
  const dishes = await db.dish.toArray()
  const ingredients = await db.ingredient.toArray()

  const dishesForExport = dishes.map(dish => ({ ...dish }))
  dishes.length = 0

  const zip = new JSZip()
  const imagesFolder = zip.folder('images')

  for (const dish of dishesForExport) {
    if (dish.imageData && typeof dish.imageData === 'string') {
      const match = dish.imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.*)$/)
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
        const base64Content = match[2]
        const contentType = `image/${match[1]}`
        const blob = base64ToBlob(base64Content, contentType)
        const imagePath = `images/${dish.id}.${ext}`
        imagesFolder.file(`${dish.id}.${ext}`, blob)
        delete dish.imageData
        dish.imagePath = imagePath
      }
    }
  }

  const dataJson = {
    app: 'personal_menu',
    version: 1,
    exportedAt: Date.now(),
    dishCategories,
    ingredientCategories,
    dishes: dishesForExport,
    ingredients
  }

  zip.file('data.json', JSON.stringify(dataJson, null, 2))

  const zipBlob = await zip.generateAsync({ type: 'blob' })

  const filename = `menu_backup_${formatTimestampForFilename(dataJson.exportedAt)}.zip`
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 把 zip 中图片转回 base64 并写入一条菜品记录；超过 1MB 的旧大图自动压缩，
// 让存量大数据在导入一次后"瘦身"，后续导出/导入的内存与存储压力大幅下降
async function restoreDishImage(zip, dish) {
  if (dish.imagePath) {
    const imageFile = zip.file(dish.imagePath)
    if (imageFile) {
      const imageBytes = await imageFile.async('uint8array')
      // JSZip 解出的 Blob 不带 MIME，需按扩展名补上，否则 data URL 会变成 application/octet-stream
      const ext = dish.imagePath.split('.').pop().toLowerCase()
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
      const blob = new Blob([imageBytes], { type: mime })
      if (blob.size > 1024 * 1024) {
        const beforeMB = Math.round(blob.size / 10485.76) / 100
        dish.imageData = await compressImageBlob(blob)
        const afterKB = dish.imageData ? Math.round(dish.imageData.length / 1024) : 0
        logImport({ stage: 'image-compressed', id: dish.id, fromMB: beforeMB, toKB: afterKB })
      } else {
        dish.imageData = await blobToBase64(blob)
      }
    }
    delete dish.imagePath
  }
}

// onProgress(done, total, stage) 用于 UI 显示导入进度
export async function importData(file, onProgress) {
  logImport({ stage: 'import-start', fileMB: Math.round(file.size / 10485.76) / 100 })

  const zip = await JSZip.loadAsync(file)
  const dataJsonFile = zip.file('data.json')
  if (!dataJsonFile) {
    throw new Error('无效的备份文件：缺少 data.json')
  }

  const dataJsonStr = await dataJsonFile.async('string')
  logImport({ stage: 'zip-loaded', jsonMB: Math.round(dataJsonStr.length / 10485.76) / 100 })
  const data = JSON.parse(dataJsonStr)

  if (data.app !== 'personal_menu') {
    throw new Error('无效的备份文件：app 字段不匹配')
  }
  if (typeof data.version !== 'number' || data.version > 1) {
    throw new Error(`不支持的备份版本：${data.version}`)
  }

  // 1. 先分片备份当前数据（写入失败则不破坏现有库）
  if (onProgress) onProgress(0, 0, '正在备份当前数据...')
  await createImportBackup()
  logImport({ stage: 'backup-done' })

  // 2. 清空业务表（此后逐批写入；若中途异常，可通过「恢复上次备份」回滚）
  await db.dishCategory.clear()
  await db.dish.clear()
  await db.ingredientCategory.clear()
  await db.ingredient.clear()
  logImport({ stage: 'tables-cleared' })

  // 3. 文本数据（分类、食材）分批写入
  if (onProgress) onProgress(0, 0, '正在写入分类与食材...')
  await bulkAddInBatches(db.dishCategory, data.dishCategories || [])
  await bulkAddInBatches(db.ingredientCategory, data.ingredientCategories || [])
  await bulkAddInBatches(db.ingredient, data.ingredients || [])
  logImport({ stage: 'categories-ingredients-done' })

  // 4. 菜品分批「转图片 → 写库」交替进行：
  //    每批只持有本批图片的 base64，写完即释放，不再让全部图片同时驻留内存
  const dishes = data.dishes || []
  const total = dishes.length
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = dishes.slice(i, i + BATCH_SIZE).map(d => ({ ...d }))
    for (const dish of batch) {
      await restoreDishImage(zip, dish)
    }
    await db.dish.bulkAdd(batch)
    batch.length = 0
    if (onProgress) onProgress(Math.min(i + BATCH_SIZE, total), total)
    logImport({ stage: 'dishes-batch', done: Math.min(i + BATCH_SIZE, total), total })
    await yieldToUI()
  }

  logImport({ stage: 'import-done' })
  return { success: true, message: '导入成功' }
}

export async function restoreFromBackup() {
  const meta = await db.backup.get(BACKUP_META_ID)

  // 兼容旧版（v1）单条巨记录格式的备份
  if (!meta) {
    const legacy = await db.backup.get(LEGACY_BACKUP_ID)
    if (!legacy) {
      throw new Error('没有可恢复的备份')
    }
    return restoreLegacyBackup(legacy.data)
  }

  // v2：流式读回分片备份，逐批写回业务表，避免全量数据一次性载入内存
  for (const tableName of BACKUP_TABLES) {
    await db[tableName].clear()
    let batch = []
    await db.backup.filter(row => row.table === tableName).each(row => {
      batch.push(row.data)
      if (batch.length >= BATCH_SIZE) {
        const toAdd = batch
        batch = []
        return db[tableName].bulkAdd(toAdd)
      }
    })
    if (batch.length > 0) {
      await db[tableName].bulkAdd(batch)
    }
    batch = null
    await yieldToUI()
  }

  return { success: true, message: '恢复成功' }
}

async function restoreLegacyBackup(data) {
  await db.transaction(
    'rw',
    db.dishCategory,
    db.dish,
    db.ingredientCategory,
    db.ingredient,
    async () => {
      await db.dishCategory.clear()
      await db.dish.clear()
      await db.ingredientCategory.clear()
      await db.ingredient.clear()

      if (data.dishCategories && data.dishCategories.length > 0) {
        await db.dishCategory.bulkAdd(data.dishCategories)
      }

      if (data.ingredientCategories && data.ingredientCategories.length > 0) {
        await db.ingredientCategory.bulkAdd(data.ingredientCategories)
      }

      if (data.dishes && data.dishes.length > 0) {
        await db.dish.bulkAdd(data.dishes)
      }

      if (data.ingredients && data.ingredients.length > 0) {
        await db.ingredient.bulkAdd(data.ingredients)
      }
    }
  )

  return { success: true, message: '恢复成功' }
}
