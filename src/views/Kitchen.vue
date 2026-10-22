<template>
  <div class="kitchen-page">
    <div class="banner-section">
      <div class="banner-bg">
        <svg class="banner-svg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#9d8ec9;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#7a6aa8;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="160" fill="url(#bannerGrad)" />
          <circle cx="50" cy="30" r="20" fill="rgba(255,255,255,0.1)" />
          <circle cx="350" cy="50" r="30" fill="rgba(255,255,255,0.08)" />
          <circle cx="320" cy="120" r="15" fill="rgba(255,255,255,0.1)" />
          <text x="200" y="70" text-anchor="middle" font-size="50" fill="rgba(255,255,255,0.9)">🍳</text>
          <text x="100" y="100" font-size="24" fill="rgba(255,255,255,0.7)">🥘</text>
          <text x="300" y="110" font-size="28" fill="rgba(255,255,255,0.7)">🍲</text>
          <text x="60" y="140" font-size="20" fill="rgba(255,255,255,0.6)">🥗</text>
          <text x="340" y="145" font-size="22" fill="rgba(255,255,255,0.6)">🍜</text>
        </svg>
      </div>
      <div class="banner-content">
        <div class="kitchen-card">
          <div class="level-badge">Lv.1</div>
          <div class="kitchen-info">
            <h2 class="kitchen-name">{{ appStore.kitchenName }}</h2>
            <p class="dish-count">共 {{ dishStore.dishCount }} 道菜</p>
          </div>
        </div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchInput"
          placeholder="搜索菜品..."
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="content-wrapper">
      <aside class="sidebar">
        <div class="sidebar-scroll">
          <div
            class="category-item"
            :class="{ active: !dishStore.currentCategoryId }"
            @click="dishStore.setCurrentCategory(null)"
          >
            全部
          </div>
          <div
            v-for="category in dishStore.categories"
            :key="category.id"
            class="category-item"
            :class="{ active: dishStore.currentCategoryId === category.id }"
            @click="dishStore.setCurrentCategory(category.id)"
          >
            {{ category.name }}
          </div>
        </div>
      </aside>

      <main class="main-content">
        <div v-if="dishStore.dishes.length > 0" class="dish-list">
          <div
            v-for="dish in dishStore.dishes"
            :key="dish.id"
            class="dish-card"
            @click="goToDetail(dish.id)"
          >
            <div class="dish-thumb">
              <img v-if="dish.imageData" :src="dish.imageData" alt="菜品图片" class="thumb-image" />
              <div v-else class="thumb-placeholder">
                <span class="thumb-icon">🍽️</span>
              </div>
            </div>
            <div class="dish-info">
              <h3 class="dish-name">{{ dish.name }}</h3>
              <div class="dish-rating">
                <div class="stars">
                  <span v-for="n in 5" :key="n" class="star">
                    <span class="star-bg">☆</span>
                    <span class="star-fill" :style="getStarFillStyle(dish.rating, n)">★</span>
                  </span>
                </div>
                <span class="rating-score">{{ dish.rating.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">🍽️</div>
          <div class="empty-text">暂无菜品</div>
          <div class="empty-hint">点击右下角按钮添加你的第一道菜</div>
        </div>
      </main>
    </div>

    <button class="fab-button" @click="handleAddDish">
      <span class="fab-icon">+</span>
    </button>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../components/TabBar.vue'
import { useDishStore } from '../stores/dish'
import { useAppStore } from '../stores/app'

const router = useRouter()
const dishStore = useDishStore()
const appStore = useAppStore()
const searchInput = ref('')

function getStarFillStyle(rating, n) {
  const diff = rating - (n - 1)
  if (diff >= 1) return { width: '100%' }
  if (diff > 0) return { width: `${diff * 100}%` }
  return { width: '0%' }
}

function handleSearch() {
  dishStore.setSearchKeyword(searchInput.value)
}

function handleAddDish() {
  router.push('/dish/edit')
}

function goToDetail(id) {
  router.push(`/dish/${id}`)
}

onMounted(async () => {
  await dishStore.loadCategories()
  await dishStore.loadDishes()
})
</script>

<style scoped>
.kitchen-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.banner-section {
  position: relative;
  flex-shrink: 0;
}

.banner-bg {
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.banner-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.banner-content {
  position: absolute;
  bottom: -30px;
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

.level-badge {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  flex-shrink: 0;
}

.kitchen-info {
  flex: 1;
}

.kitchen-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.dish-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.search-section {
  padding: 46px 16px 12px;
  flex-shrink: 0;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fff;
  border-radius: 20px;
  padding: 10px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--text-color);
}

.search-bar input::placeholder {
  color: var(--text-light);
}

.content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding-bottom: 60px;
}

.sidebar {
  width: 90px;
  background-color: #fff;
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-scroll {
  height: 100%;
  overflow-y: auto;
}

.category-item {
  padding: 14px 10px;
  font-size: 13px;
  text-align: center;
  color: var(--text-secondary);
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.category-item.active {
  color: var(--primary-color);
  background-color: #f9f7fc;
  border-left-color: var(--primary-color);
  font-weight: 500;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.dish-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-card {
  display: flex;
  gap: 12px;
  background-color: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dish-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.dish-thumb {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f5f5f5;
}

.thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0ecf7 0%, #e8e2f2 100%);
}

.thumb-icon {
  font-size: 32px;
  opacity: 0.6;
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.dish-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dish-rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars {
  display: flex;
  gap: 1px;
}

.star {
  position: relative;
  font-size: 14px;
  line-height: 1;
  width: 14px;
  height: 14px;
}

.star-bg {
  position: absolute;
  top: 0;
  left: 0;
  color: #e0e0e0;
}

.star-fill {
  position: absolute;
  top: 0;
  left: 0;
  color: #ffc107;
  overflow: hidden;
  white-space: nowrap;
}

.rating-score {
  font-size: 13px;
  font-weight: 500;
  color: #ffc107;
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

.fab-button {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9d8ec9 0%, #7a6aa8 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(139, 122, 184, 0.4);
  z-index: 99;
}

.fab-icon {
  font-size: 28px;
  line-height: 1;
  font-weight: 300;
}
</style>
