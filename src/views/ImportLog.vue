<template>
  <div class="import-log-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">导入日志</div>
      <div class="nav-placeholder"></div>
    </div>

    <div class="content">
      <div class="tip-card">
        导入闪退后重新打开 App，查看这里的最后几条记录即可定位崩溃阶段（OOM 崩溃时最后一条的内存占用通常接近上限）。
      </div>

      <div class="actions">
        <button class="action-btn" @click="copyLog">复制全部日志</button>
        <button class="action-btn danger" @click="handleClear">清空日志</button>
      </div>

      <div v-if="logs.length === 0" class="empty">暂无日志</div>

      <div v-else class="log-list">
        <div v-for="(item, idx) in logs" :key="idx" class="log-item">
          <div class="log-head">
            <span class="log-stage" :class="{ warn: item.stage === 'global-error' || item.stage === 'unhandled-rejection' }">
              {{ item.stage }}
            </span>
            <span class="log-time">{{ formatTime(item.t) }}</span>
          </div>
          <div class="log-detail">
            <span v-if="item.heapMB !== null && item.heapMB !== undefined" class="log-heap" :class="{ danger: item.limitMB && item.heapMB / item.limitMB > 0.7 }">
              内存 {{ item.heapMB }}MB{{ item.limitMB ? ` / 上限 ${item.limitMB}MB` : '' }}
            </span>
            <span v-for="(val, key) in extraFields(item)" :key="key" class="log-field">
              {{ key }}: {{ val }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getImportLog, clearImportLog } from '../utils/importLog'

const router = useRouter()
const logs = ref(getImportLog().slice().reverse())

const KNOWN = new Set(['t', 'heapMB', 'limitMB', 'stage'])

function extraFields(item) {
  const out = {}
  for (const key of Object.keys(item)) {
    if (!KNOWN.has(key)) out[key] = item[key]
  }
  return out
}

function formatTime(t) {
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function copyLog() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(getImportLog(), null, 2))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请截图页面内容')
  }
}

function handleClear() {
  if (confirm('确定清空日志吗？')) {
    clearImportLog()
    logs.value = []
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.import-log-page {
  width: 100%;
  height: 100%;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-color);
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}

.nav-placeholder {
  width: 36px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 40px;
}

.tip-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.action-btn {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  border: none;
  background-color: var(--primary-color);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.action-btn.danger {
  background-color: #fff;
  color: var(--danger-color);
  border: 1px solid var(--border-color);
}

.empty {
  text-align: center;
  color: var(--text-light);
  font-size: 14px;
  padding: 40px 0;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  background-color: #fff;
  border-radius: 10px;
  padding: 10px 14px;
}

.log-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-stage {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
}

.log-stage.warn {
  color: var(--danger-color);
}

.log-time {
  font-size: 12px;
  color: var(--text-light);
}

.log-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.log-heap {
  color: var(--text-secondary);
}

.log-heap.danger {
  color: var(--danger-color);
  font-weight: 600;
}
</style>
