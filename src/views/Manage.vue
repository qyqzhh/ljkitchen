<template>
  <div class="manage-page">
    <header class="page-header">
      <div class="header-bg">
        <svg class="header-svg" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="manageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#9d8ec9;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#7a6aa8;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="140" fill="url(#manageGrad)" />
          <circle cx="50" cy="30" r="20" fill="rgba(255,255,255,0.1)" />
          <circle cx="350" cy="50" r="30" fill="rgba(255,255,255,0.08)" />
          <text x="200" y="60" text-anchor="middle" font-size="40" fill="rgba(255,255,255,0.9)">⚙️</text>
        </svg>
      </div>
      <div class="header-content">
        <div class="kitchen-card">
          <div class="kitchen-icon">
            <span class="icon-emoji">🍳</span>
          </div>
          <div class="kitchen-info">
            <div class="level-badge">Lv.{{ appStore.kitchenLevel }}</div>
            <h2 class="kitchen-name">{{ appStore.kitchenName }}</h2>
          </div>
        </div>
      </div>
    </header>

    <div class="content">
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-icon">🍽️</div>
          <div class="stat-info">
            <div class="stat-value">{{ dishStore.dishCount }}</div>
            <div class="stat-label">道菜品</div>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon">📂</div>
          <div class="stat-info">
            <div class="stat-value">{{ dishStore.categories.length }}</div>
            <div class="stat-label">个分类</div>
          </div>
        </div>
      </div>

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
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".zip"
      class="file-input"
      @change="onFileSelected"
    />

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../components/TabBar.vue'
import { useAppStore } from '../stores/app'
import { useDishStore } from '../stores/dish'
import { exportData, importData, restoreFromBackup } from '../utils/backup'

const router = useRouter()
const appStore = useAppStore()
const dishStore = useDishStore()
const fileInput = ref(null)

function goToDishManage() {
  router.push('/manage/dishes')
}

function goToCategoryManage() {
  router.push('/manage/categories')
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
    try {
      await importData(file)
      alert('导入成功')
      window.location.reload()
    } catch (err) {
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
  try {
    await restoreFromBackup()
    alert('恢复成功')
    window.location.reload()
  } catch (err) {
    console.error(err)
    alert('恢复失败：' + err.message)
  }
}

onMounted(async () => {
  await dishStore.loadCategories()
  await dishStore.loadDishes()
})
</script>

<style scoped>
.manage-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.page-header {
  position: relative;
  flex-shrink: 0;
}

.header-bg {
  width: 100%;
  height: 140px;
  overflow: hidden;
}

.header-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.header-content {
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  padding: 0 16px;
}

.kitchen-card {
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.kitchen-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0ecf7 0%, #e8e2f2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 28px;
}

.kitchen-info {
  flex: 1;
}

.level-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  margin-bottom: 6px;
}

.kitchen-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 56px 16px 16px;
  padding-bottom: 76px;
}

.stats-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: var(--border-color);
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
</style>
