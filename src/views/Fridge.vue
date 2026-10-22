<template>
  <div class="fridge-page">
    <header class="page-header">
      <div class="header-title">厨房冰箱</div>
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchInput"
          placeholder="搜索食材..."
          @input="handleSearch"
        />
      </div>
    </header>

    <div class="status-tabs">
      <div
        class="status-tab"
        :class="{ active: !fridgeStore.currentStatusFilter }"
        @click="fridgeStore.setStatusFilter(null)"
      >
        <span class="status-dot all"></span>
        <span class="status-label">全部</span>
        <span class="status-count">({{ fridgeStore.ingredientCount }})</span>
      </div>
      <div
        class="status-tab"
        :class="{ active: fridgeStore.currentStatusFilter === 'fresh' }"
        @click="fridgeStore.setStatusFilter('fresh')"
      >
        <span class="status-dot fresh"></span>
        <span class="status-label">新鲜</span>
        <span class="status-count">({{ fridgeStore.freshCount }})</span>
      </div>
      <div
        class="status-tab"
        :class="{ active: fridgeStore.currentStatusFilter === 'expiring' }"
        @click="fridgeStore.setStatusFilter('expiring')"
      >
        <span class="status-dot expiring"></span>
        <span class="status-label">快过期</span>
        <span class="status-count">({{ fridgeStore.expiringCount }})</span>
      </div>
      <div
        class="status-tab"
        :class="{ active: fridgeStore.currentStatusFilter === 'expired' }"
        @click="fridgeStore.setStatusFilter('expired')"
      >
        <span class="status-dot expired"></span>
        <span class="status-label">已过期</span>
        <span class="status-count">({{ fridgeStore.expiredCount }})</span>
      </div>
    </div>

    <div class="ingredient-list">
      <div
        v-for="ingredient in fridgeStore.filteredIngredients"
        :key="ingredient.id"
        class="ingredient-card"
        @click="goToEdit(ingredient.id)"
      >
        <div class="ingredient-main">
          <div class="ingredient-header">
            <h3 class="ingredient-name">{{ ingredient.name }}</h3>
            <span
              class="expiry-badge"
              :class="getExpiryStatusClass(ingredient)"
            >
              {{ getExpiryBadgeText(ingredient) }}
            </span>
          </div>
          <div class="ingredient-tags">
            <span v-if="getCategoryName(ingredient.categoryId)" class="category-tag">
              {{ getCategoryName(ingredient.categoryId) }}
            </span>
            <span v-if="ingredient.quantity" class="quantity-tag">
              {{ ingredient.quantity }}
            </span>
          </div>
          <div v-if="ingredient.productionDate" class="ingredient-date">
            生产日期：{{ ingredient.productionDate }}
          </div>
          <div v-if="ingredient.note" class="ingredient-note">
            {{ ingredient.note }}
          </div>
        </div>
      </div>

      <div v-if="fridgeStore.filteredIngredients.length === 0" class="empty-state">
        <div class="empty-icon">🥬</div>
        <div class="empty-text">暂无食材</div>
        <div class="empty-hint">点击下方按钮添加食材</div>
      </div>
    </div>

    <div class="bottom-bar">
      <button class="category-btn" @click="goToCategories">
        <span class="btn-icon">📋</span>
        <span class="btn-text">类别管理</span>
      </button>
      <button class="add-btn" @click="goToAdd">
        <span class="btn-icon">+</span>
        <span class="btn-text">添加食材</span>
      </button>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../components/TabBar.vue'
import { useFridgeStore } from '../stores/fridge'

const router = useRouter()
const fridgeStore = useFridgeStore()
const searchInput = ref('')

function handleSearch() {
  fridgeStore.setSearchKeyword(searchInput.value)
}

function getCategoryName(categoryId) {
  if (!categoryId) return ''
  const cat = fridgeStore.categories.find(c => c.id === categoryId)
  return cat ? cat.name : ''
}

function getExpiryStatusClass(ingredient) {
  return fridgeStore.getIngredientStatus(ingredient)
}

function getExpiryBadgeText(ingredient) {
  const status = fridgeStore.getIngredientStatus(ingredient)
  const days = fridgeStore.getIngredientRemainingDays(ingredient)
  if (status === 'expired') {
    return '已过期'
  }
  if (status === 'expiring') {
    return '快过期'
  }
  if (status === 'fresh') {
    if (days !== null) {
      return `还剩${days}天`
    }
    return '新鲜'
  }
  return '未设置'
}

function goToAdd() {
  router.push('/ingredient/edit')
}

function goToEdit(id) {
  router.push(`/ingredient/edit/${id}`)
}

function goToCategories() {
  router.push('/ingredient/categories')
}

onMounted(async () => {
  await fridgeStore.loadCategories()
  await fridgeStore.loadIngredients()
})
</script>

<style scoped>
.fridge-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.page-header {
  background: linear-gradient(135deg, #9d8ec9 0%, #7a6aa8 100%);
  color: #fff;
  padding: 16px;
  padding-top: calc(16px + env(safe-area-inset-top));
  flex-shrink: 0;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 8px 16px;
}

.search-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  outline: none;
  font-size: 14px;
}

.search-bar input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.status-tabs {
  display: flex;
  background-color: #fff;
  padding: 10px 8px;
  gap: 4px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
}

.status-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-tab.active {
  background-color: #f0ecf7;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.all {
  background: linear-gradient(135deg, #52c41a, #faad14, #ff4d4f);
}

.status-dot.fresh {
  background-color: var(--success-color);
}

.status-dot.expiring {
  background-color: var(--warning-color);
}

.status-dot.expired {
  background-color: var(--danger-color);
}

.status-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.status-tab.active .status-label {
  color: var(--primary-color);
}

.status-count {
  font-size: 11px;
  color: var(--text-light);
}

.ingredient-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  padding-bottom: 140px;
}

.ingredient-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ingredient-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.ingredient-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ingredient-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
}

.expiry-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 12px;
  flex-shrink: 0;
}

.expiry-badge.fresh {
  background-color: #e8f5e9;
  color: var(--success-color);
}

.expiry-badge.expiring {
  background-color: #fff3e0;
  color: var(--warning-color);
}

.expiry-badge.expired {
  background-color: #ffebee;
  color: var(--danger-color);
}

.expiry-badge.unknown {
  background-color: #f0f0f0;
  color: var(--text-secondary);
}

.ingredient-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.category-tag {
  padding: 2px 8px;
  background-color: #f0ecf7;
  color: var(--primary-color);
  font-size: 12px;
  border-radius: 10px;
}

.quantity-tag {
  padding: 2px 8px;
  background-color: #f5f5f5;
  color: var(--text-secondary);
  font-size: 12px;
  border-radius: 10px;
}

.ingredient-date {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.ingredient-note {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
}

.empty-hint {
  color: var(--text-light);
  font-size: 13px;
}

.bottom-bar {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid var(--border-color);
  z-index: 99;
}

.category-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #f5f5f5;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  border-radius: 22px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-btn:active {
  background-color: #e8e8e8;
}

.add-btn {
  flex: 1.5;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #9d8ec9 0%, #7a6aa8 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  border-radius: 22px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-btn:active {
  opacity: 0.9;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.add-btn .btn-icon {
  font-size: 20px;
  font-weight: 300;
}
</style>
