// 导入诊断日志：环形存储在 localStorage，用于排查安卓端导入闪退。
// OOM 类崩溃时 JS 进程直接被杀，catch 不到；靠每个关键节点采样 JS 堆内存，
// 崩溃后重开 App 从「管理 → 导入日志」页即可看到崩在哪个阶段、内存涨到了多少。
// 另有全局 JS 错误 / Promise 异常钩子（见 main.js），可捕获 QuotaExceededError 等非 OOM 异常。

const LOG_KEY = 'ljk_import_log'
const MAX_ENTRIES = 300

function sampleMemory() {
  // Chromium 专有 API，安卓 WebView 支持；不支持时返回 null
  const mem = window.performance && performance.memory
  if (!mem) return { heapMB: null, limitMB: null }
  return {
    heapMB: Math.round(mem.usedJSHeapSize / 1048576),
    limitMB: Math.round(mem.jsHeapSizeLimit / 1048576)
  }
}

export function logImport(entry) {
  try {
    const arr = JSON.parse(localStorage.getItem(LOG_KEY) || '[]')
    arr.push({ t: Date.now(), ...sampleMemory(), ...entry })
    if (arr.length > MAX_ENTRIES) {
      arr.splice(0, arr.length - MAX_ENTRIES)
    }
    localStorage.setItem(LOG_KEY, JSON.stringify(arr))
  } catch (e) {
    // 日志写入失败不影响主流程
  }
}

export function getImportLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]')
  } catch (e) {
    return []
  }
}

export function clearImportLog() {
  localStorage.removeItem(LOG_KEY)
}

export function setupGlobalErrorLog() {
  window.addEventListener('error', e => {
    logImport({
      stage: 'global-error',
      message: String(e.message || '').slice(0, 200),
      where: `${(e.filename || '').split('/').pop()}:${e.lineno}`
    })
  })
  window.addEventListener('unhandledrejection', e => {
    const reason = e.reason
    logImport({
      stage: 'unhandled-rejection',
      message: String((reason && reason.message) || reason || '').slice(0, 200)
    })
  })
}
