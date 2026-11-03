// 图片压缩工具：把大图（手机照片常达 3-8MB）压到最长边 1280px / JPEG 质量 0.8，
// 从根本上降低 IndexedDB 存储与导入导出时的内存峰值。
// GIF 会被静态化为第一帧（菜品图场景可接受）。

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = src
  })
}

// 压缩 dataURL 图片；超过 maxBytes 才压，否则原样返回
export async function compressDataUrl(dataUrl, { maxSide = 1280, quality = 0.8, maxBytes = 1024 * 1024 } = {}) {
  if (typeof dataUrl !== 'string' || dataUrl.length <= maxBytes) {
    return dataUrl
  }
  try {
    const img = await loadImage(dataUrl)
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    const ctx = canvas.getContext('2d')
    // PNG 透明背景转 JPEG 时填充白底
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } catch (e) {
    // 压缩失败时保留原图，不能因为压缩挂掉而丢数据
    return dataUrl
  }
}

// 供 DishEdit 上传时使用：File 压缩后返回 dataURL
export async function compressImageFile(file, options) {
  const dataUrl = await fileToDataUrl(file)
  return compressDataUrl(dataUrl, options)
}

// 供导入流程使用：二进制图片压缩后返回 dataURL
export async function compressImageBlob(blob, options) {
  const dataUrl = await blobToDataUrl(blob)
  return compressDataUrl(dataUrl, options)
}
