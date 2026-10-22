import JSZip from 'jszip'
import db from '../db'

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

export async function exportData() {
  const dishCategories = await db.dishCategory.toArray()
  const ingredientCategories = await db.ingredientCategory.toArray()
  const dishes = await db.dish.toArray()
  const ingredients = await db.ingredient.toArray()

  const dishesForExport = dishes.map(dish => ({ ...dish }))

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

export async function importData(file) {
  const zip = await JSZip.loadAsync(file)
  const dataJsonFile = zip.file('data.json')
  if (!dataJsonFile) {
    throw new Error('无效的备份文件：缺少 data.json')
  }

  const dataJsonStr = await dataJsonFile.async('string')
  const data = JSON.parse(dataJsonStr)

  if (data.app !== 'personal_menu') {
    throw new Error('无效的备份文件：app 字段不匹配')
  }
  if (typeof data.version !== 'number' || data.version > 1) {
    throw new Error(`不支持的备份版本：${data.version}`)
  }

  const currentDishCategories = await db.dishCategory.toArray()
  const currentIngredientCategories = await db.ingredientCategory.toArray()
  const currentDishes = await db.dish.toArray()
  const currentIngredients = await db.ingredient.toArray()

  const backupData = {
    dishCategories: currentDishCategories,
    ingredientCategories: currentIngredientCategories,
    dishes: currentDishes,
    ingredients: currentIngredients
  }

  await db.backup.put({
    id: 'last_import_backup',
    data: backupData,
    createdAt: Date.now()
  })

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

      const dishesToImport = data.dishes ? data.dishes.map(d => ({ ...d })) : []

      for (const dish of dishesToImport) {
        if (dish.imagePath) {
          const imageFile = zip.file(dish.imagePath)
          if (imageFile) {
            const imageBlob = await imageFile.async('blob')
            const base64 = await blobToBase64(imageBlob)
            dish.imageData = base64
          }
          delete dish.imagePath
        }
      }

      if (dishesToImport.length > 0) {
        await db.dish.bulkAdd(dishesToImport)
      }

      if (data.ingredients && data.ingredients.length > 0) {
        await db.ingredient.bulkAdd(data.ingredients)
      }
    }
  )

  return { success: true, message: '导入成功' }
}

export async function restoreFromBackup() {
  const backup = await db.backup.get('last_import_backup')
  if (!backup) {
    throw new Error('没有可恢复的备份')
  }

  const data = backup.data

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
