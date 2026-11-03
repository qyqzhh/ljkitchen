<template>
  <div class="kitchen-manage-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">厨房管理</div>
      <div class="nav-placeholder"></div>
    </div>

    <div class="content">
      <div class="menu-section">
        <div class="menu-item" @click="goToDishManage">
          <div class="menu-icon">🍽️</div>
          <div class="menu-content">
            <div class="menu-title">菜品管理</div>
            <div class="menu-desc">管理所有菜品</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="menu-item" @click="goToCategoryManage">
          <div class="menu-icon">📂</div>
          <div class="menu-content">
            <div class="menu-title">菜品分类管理</div>
            <div class="menu-desc">管理菜品分类</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-item" @click="handleExport">
          <div class="menu-icon">📤</div>
          <div class="menu-content">
            <div class="menu-title">导出全部数据</div>
            <div class="menu-desc">导出为 zip 文件</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="menu-item" @click="handleImport">
          <div class="menu-icon">📥</div>
          <div class="menu-content">
            <div class="menu-title">导入数据</div>
            <div class="menu-desc">从 zip 文件导入</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="menu-item" @click="handleRestore">
          <div class="menu-icon">↩️</div>
          <div class="menu-content">
            <div class="menu-title">恢复上次备份</div>
            <div class="menu-desc">从本地备份恢复</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="menu-item" @click="goToImportLog">
          <div class="menu-icon">📋</div>
          <div class="menu-content">
            <div class="menu-title">导入日志</div>
            <div class="menu-desc">排查导入闪退问题</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".zip"
      class="file-input"
      @change="onFileSelected"
    />

    <div v-if="busyText" class="busy-overlay">
      <div class="busy-box">
        <div class="busy-spinner"></div>
        <div class="busy-text">{{ busyText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { exportData, importData, restoreFromBackup } from '../utils/backup'

const router = useRouter()
const fileInput = ref(null)
const busyText = ref('')

function goBack() {
  router.back()
}

function goToDishManage() {
  router.push('/manage/dishes')
}

function goToCategoryManage() {
  router.push('/manage/categories')
}

function goToImportLog() {
  router.push('/import-log')
}

async function handleExport() {
  try {
    await exportData()
    alert('导出成功')
  } catch (err) {
    console.error(err)
    alert('导出失败：' + err.message)
  }
}

function handleImport() {
  fileInput.value?.click()
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (file) {
    busyText.value = '正在读取备份文件...'
    try {
      await importData(file, (done, total, stage) => {
        if (stage) {
          busyText.value = stage
        } else if (total > 0) {
          busyText.value = `正在导入菜品 ${done}/${total}...`
        }
      })
      busyText.value = ''
      alert('导入成功')
      window.location.reload()
    } catch (err) {
      busyText.value = ''
      console.error(err)
      alert('导入失败：' + err.message)
    }
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleRestore() {
  if (!confirm('确定要恢复上次备份吗？当前数据将被覆盖。')) {
    return
  }
  busyText.value = '正在恢复备份...'
  try {
    await restoreFromBackup()
    busyText.value = ''
    alert('恢复成功')
    window.location.reload()
  } catch (err) {
    busyText.value = ''
    console.error(err)
    alert('恢复失败：' + err.message)
  }
}
</script>

<style scoped>
.kitchen-manage-page {
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
}

.menu-section {
  background-color: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f9f9f9;
}

.menu-icon {
  font-size: 24px;
  margin-right: 14px;
  flex-shrink: 0;
}

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.menu-desc {
  font-size: 12px;
  color: var(--text-light);
}

.menu-arrow {
  font-size: 20px;
  color: var(--text-light);
  margin-left: 8px;
}

.file-input {
  display: none;
}

.busy-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.busy-box {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
}

.busy-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e8e2f2;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: busy-spin 0.8s linear infinite;
}

@keyframes busy-spin {
  to {
    transform: rotate(360deg);
  }
}

.busy-text {
  font-size: 14px;
  color: var(--text-color);
}
</style>
