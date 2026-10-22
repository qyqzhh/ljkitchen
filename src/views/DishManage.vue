<template>
  <div class="dish-manage-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">菜品管理</div>
      <div class="nav-placeholder"></div>
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

    <div class="category-tabs">
      <div
        class="category-tab"
        :class="{ active: !dishStore.currentCategoryId }"
        @click="dishStore.setCurrentCategory(null)"
      >
        全部
      </div>
      <div
        v-for="cat in dishStore.categories"
        :key="cat.id"
        class="category-tab"
        :class="{ active: dishStore.currentCategoryId === cat.id }"
        @click="dishStore.setCurrentCategory(cat.id)"
      >
        {{ cat.name }}
      </div>
    </div>

    <div class="dish-list">
      <div
        v-for="dish in dishStore.dishes"
        :key="dish.id"
        class="dish-item"
      >
        <div class="dish-content" @click="goToEdit(dish.id)">
          <div class="dish-thumb">
            <img v-if="dish.imageData" :src="dish.imageData" alt="菜品图片" class="thumb-image" />
            <div v-else class="thumb-placeholder">
              <span class="thumb-icon">🍽️</span>
            </div>
          </div>
          <div class="dish-info">
            <h3 class="dish-name">{{ dish.name }}</h3>
            <div class="dish-tags">
              <span v-for="cat in getDishCategories(dish.categoryIds)" :key="cat.id" class="category-tag">
                {{ cat.name }}
              </span>
            </div>
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
        <button class="delete-btn" @click="handleDelete(dish)">
          <span class="delete-icon">🗑️</span>
        </button>
      </div>

      <div v-if="dishStore.dishes.length === 0" class="empty-state">
        <div class="empty-icon">🍽️</div>
        <div class="empty-text">暂无菜品</div>
        <div class="empty-hint">点击下方按钮添加菜品</div>
      </div>
    </div>

    <div class="bottom-bar">
      <button class="add-btn" @click="goToAdd">
        <span class="btn-icon">+</span>
        <span class="btn-text">新增菜品</span>
      </button>
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content confirm-modal">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
        </div>
        <div class="modal-body">
          <p>确定要删除"{{ deletingDish?.name }}"吗？删除后无法恢复。</p>
        </div>
        <div class="modal-footer confirm-footer">
          <button class="cancel-btn" @click="showDeleteConfirm = false">取消</button>
          <button class="confirm-delete-btn" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDishStore } from '../stores/dish'

const router = useRouter()
const dishStore = useDishStore()
const searchInput = ref('')
const showDeleteConfirm = ref(false)
const deletingDish = ref(null)

function handleSearch() {
  dishStore.setSearchKeyword(searchInput.value)
}

function getDishCategories(categoryIds) {
  if (!categoryIds || categoryIds.length === 0) return []
  return dishStore.categories.filter(c => categoryIds.includes(c.id))
}

function getStarFillStyle(rating, n) {
  const diff = rating - (n - 1)
  if (diff >= 1) return { width: '100%' }
  if (diff > 0) return { width: `${diff * 100}%` }
  return { width: '0%' }
}

function goToAdd() {
  router.push('/dish/edit')
}

function goToEdit(id) {
  router.push(`/dish/edit/${id}`)
}

function handleDelete(dish) {
  deletingDish.value = dish
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  try {
    await dishStore.deleteDish(deletingDish.value.id)
    showDeleteConfirm.value = false
    deletingDish.value = null
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败，请重试')
  }
}

function goBack() {
  router.back()
}

onMounted(async () => {
  await dishStore.loadCategories()
  await dishStore.loadDishes()
})
</script>

<style scoped>
.dish-manage-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
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

.search-section {
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f5f5f5;
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
  outline: none;
  font-size: 14px;
  color: var(--text-color);
}

.search-bar input::placeholder {
  color: var(--text-light);
}

.category-tabs {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background-color: #fff;
  overflow-x: auto;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  background-color: #f5f5f5;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-tab.active {
  color: #fff;
  background-color: var(--primary-color);
}

.dish-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  padding-bottom: 100px;
}

.dish-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.dish-content {
  flex: 1;
  display: flex;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
}

.dish-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
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
  font-size: 24px;
  opacity: 0.6;
}

.dish-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dish-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.category-tag {
  padding: 1px 6px;
  background-color: #f0ecf7;
  color: var(--primary-color);
  font-size: 11px;
  border-radius: 8px;
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
  font-size: 12px;
  line-height: 1;
  width: 12px;
  height: 12px;
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
  font-size: 12px;
  font-weight: 500;
  color: #ffc107;
}

.delete-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff1f0;
  border-radius: 50%;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-btn:active {
  background-color: #ffccc7;
}

.delete-icon {
  font-size: 16px;
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
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 768px;
  margin: 0 auto;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background-color: #fff;
  border-top: 1px solid var(--border-color);
  z-index: 99;
}

.add-btn {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #9d8ec9 0%, #7a6aa8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  border-radius: 22px;
  border: none;
  cursor: pointer;
}

.btn-icon {
  font-size: 20px;
  font-weight: 300;
  line-height: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 360px;
  background-color: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}

.confirm-modal .modal-body {
  text-align: center;
  padding: 24px 20px;
}

.confirm-modal .modal-body p {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
}

.confirm-footer {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  height: 44px;
  background-color: #f5f5f5;
  color: var(--text-color);
  font-size: 15px;
  font-weight: 500;
  border-radius: 22px;
  border: none;
  cursor: pointer;
}

.confirm-delete-btn {
  flex: 1;
  height: 44px;
  background-color: var(--danger-color);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  border-radius: 22px;
  border: none;
  cursor: pointer;
}
</style>
