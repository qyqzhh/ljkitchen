<template>
  <div class="dish-detail-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">菜品详情</div>
      <button class="edit-btn" @click="goEdit">
        <span class="edit-icon">✏️</span>
      </button>
    </div>

    <div v-if="dish" class="dish-content">
      <div class="dish-image-wrapper">
        <img v-if="dish.imageData" :src="dish.imageData" alt="菜品图片" class="dish-image" />
        <div v-else class="dish-image-placeholder">
          <span class="placeholder-icon">🍽️</span>
        </div>
      </div>

      <div class="dish-info">
        <h1 class="dish-name">{{ dish.name }}</h1>

        <div class="dish-rating">
          <div class="stars">
            <span v-for="n in 5" :key="n" class="star" :class="getStarClass(n)">
              <span class="star-bg">☆</span>
              <span class="star-fill" :style="getStarFillStyle(n)">★</span>
            </span>
          </div>
          <span class="rating-text">{{ dish.rating.toFixed(1) }}</span>
        </div>

        <div class="category-tags">
          <span v-for="cat in categories" :key="cat.id" class="category-tag">
            {{ cat.name }}
          </span>
        </div>
      </div>

      <div class="review-section">
        <h3 class="section-title">评价</h3>
        <div class="review-content">
          <p v-if="dish.review">{{ dish.review }}</p>
          <p v-else class="no-review">暂无评价</p>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDishStore } from '../stores/dish'

const route = useRoute()
const router = useRouter()
const dishStore = useDishStore()

const dish = ref(null)
const categories = ref([])

function getStarClass(n) {
  const rating = dish.value?.rating || 0
  if (rating >= n) return 'full'
  if (rating >= n - 0.5) return 'half'
  return 'empty'
}

function getStarFillStyle(n) {
  const rating = dish.value?.rating || 0
  const diff = rating - (n - 1)
  if (diff >= 1) return { width: '100%' }
  if (diff > 0) return { width: `${diff * 100}%` }
  return { width: '0%' }
}

async function loadDish() {
  const id = route.params.id
  if (!id) return
  dish.value = await dishStore.getDishById(id)
  if (dish.value && dish.value.categoryIds) {
    categories.value = await dishStore.getCategoriesByIds(dish.value.categoryIds)
  }
}

function goBack() {
  router.back()
}

function goEdit() {
  if (dish.value) {
    router.push(`/dish/edit/${dish.value.id}`)
  }
}

onMounted(() => {
  loadDish()
})
</script>

<style scoped>
.dish-detail-page {
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

.back-btn,
.edit-btn {
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

.dish-content {
  flex: 1;
  overflow-y: auto;
}

.dish-image-wrapper {
  width: 100%;
  height: 280px;
  background-color: #fff;
  overflow: hidden;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0ecf7 0%, #e8e2f2 100%);
}

.placeholder-icon {
  font-size: 80px;
  opacity: 0.5;
}

.dish-info {
  background-color: #fff;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.dish-name {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.dish-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  position: relative;
  font-size: 20px;
  line-height: 1;
  width: 20px;
  height: 20px;
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

.rating-text {
  font-size: 16px;
  font-weight: 600;
  color: #ffc107;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  padding: 4px 12px;
  background-color: #f0ecf7;
  color: var(--primary-color);
  font-size: 13px;
  border-radius: 12px;
}

.review-section {
  background-color: #fff;
  padding: 20px 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.review-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.no-review {
  color: var(--text-light);
  font-style: italic;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
}
</style>
