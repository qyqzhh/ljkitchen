<template>
  <div class="toolbox-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">百宝箱</div>
      <div class="nav-placeholder"></div>
    </div>

    <div class="content">
      <div class="menu-section">
        <div class="menu-item" @click="goToCommuteCost">
          <div class="menu-icon">🚇</div>
          <div class="menu-content">
            <div class="menu-title">通勤费用计算</div>
            <div class="menu-desc">计算每月地铁 + 公交通勤费用</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.back()
}

function goToCommuteCost() {
  router.push('/toolbox/commute-cost')
}
</script>

<style scoped>
.toolbox-page {
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
</style>
