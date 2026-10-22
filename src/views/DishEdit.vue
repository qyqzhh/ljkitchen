<template>
  <div class="dish-edit-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">{{ isEditMode ? '编辑菜品' : '添加菜品' }}</div>
      <div class="nav-placeholder"></div>
    </div>

    <div class="edit-form">
      <div class="form-section">
        <div class="form-item image-item">
          <label class="form-label">菜品图片</label>
          <div class="image-uploader" @click="triggerImageInput">
            <img v-if="formData.imageData" :src="formData.imageData" alt="菜品图片" class="preview-image" />
            <div v-else class="upload-placeholder">
              <span class="upload-icon">📷</span>
              <span class="upload-text">点击添加图片</span>
            </div>
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              class="file-input"
              @change="handleImageChange"
            />
          </div>
          <button v-if="formData.imageData" class="remove-image-btn" @click="removeImage">
            移除图片
          </button>
        </div>
      </div>

      <div class="form-section">
        <div class="form-item">
          <label class="form-label">菜名 <span class="required">*</span></label>
          <input
            type="text"
            v-model="formData.name"
            class="form-input"
            placeholder="请输入菜名"
          />
        </div>

        <div class="form-item">
          <label class="form-label">分类 <span class="required">*</span></label>
          <div class="category-selector" @click="showCategoryModal = true">
            <div v-if="selectedCategories.length > 0" class="selected-categories">
              <span v-for="cat in selectedCategories" :key="cat.id" class="selected-tag">
                {{ cat.name }}
              </span>
            </div>
            <div v-else class="selector-placeholder">请选择分类（至少1个）</div>
            <span class="selector-arrow">›</span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">星级评分</label>
          <div class="rating-selector">
            <div class="stars">
              <span
                v-for="n in 5"
                :key="n"
                class="star"
                @click="setRating(n)"
                @mousemove="handleStarMove($event, n)"
                @mouseleave="hoverRating = null"
              >
                <span class="star-bg">☆</span>
                <span
                  class="star-fill"
                  :style="getStarFillStyle(n)"
                >★</span>
              </span>
            </div>
            <span class="rating-value">{{ formData.rating.toFixed(1) }}</span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">评价</label>
          <textarea
            v-model="formData.review"
            class="form-textarea"
            placeholder="写下你的评价..."
            rows="4"
          ></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button class="save-btn" @click="handleSave" :disabled="!canSave">
          保存
        </button>
        <button v-if="isEditMode" class="delete-btn" @click="handleDelete">
          删除菜品
        </button>
      </div>
    </div>

    <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">选择分类</h3>
          <button class="modal-close" @click="showCategoryModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div
            v-for="cat in dishStore.categories"
            :key="cat.id"
            class="category-option"
            @click="toggleCategory(cat.id)"
          >
            <span class="category-name">{{ cat.name }}</span>
            <span class="check-icon" :class="{ checked: formData.categoryIds.includes(cat.id) }">
              {{ formData.categoryIds.includes(cat.id) ? '✓' : '' }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-confirm" @click="showCategoryModal = false">确定</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content confirm-modal">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
        </div>
        <div class="modal-body">
          <p>确定要删除这道菜品吗？删除后无法恢复。</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDishStore } from '../stores/dish'

const route = useRoute()
const router = useRouter()
const dishStore = useDishStore()

const imageInput = ref(null)
const showCategoryModal = ref(false)
const showDeleteConfirm = ref(false)
const hoverRating = ref(null)

const isEditMode = computed(() => !!route.params.id)

const formData = ref({
  name: '',
  rating: 0,
  review: '',
  imageData: null,
  categoryIds: []
})

const selectedCategories = computed(() => {
  return dishStore.categories.filter(cat => formData.value.categoryIds.includes(cat.id))
})

const canSave = computed(() => {
  return formData.value.name.trim() && formData.value.categoryIds.length > 0
})

function getStarFillStyle(n) {
  const rating = hoverRating.value !== null ? hoverRating.value : formData.value.rating
  const diff = rating - (n - 1)
  if (diff >= 1) return { width: '100%' }
  if (diff > 0) return { width: `${diff * 100}%` }
  return { width: '0%' }
}

function setRating(n) {
  formData.value.rating = n
}

function handleStarMove(event, n) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percent = x / rect.width
  if (percent <= 0.5) {
    hoverRating.value = n - 0.5
  } else {
    hoverRating.value = n
  }
}

function triggerImageInput() {
  imageInput.value?.click()
}

function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.imageData = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  formData.value.imageData = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function toggleCategory(catId) {
  const index = formData.value.categoryIds.indexOf(catId)
  if (index > -1) {
    formData.value.categoryIds.splice(index, 1)
  } else {
    formData.value.categoryIds.push(catId)
  }
}

async function handleSave() {
  if (!canSave.value) return

  try {
    if (isEditMode.value) {
      await dishStore.updateDish(route.params.id, {
        name: formData.value.name.trim(),
        rating: formData.value.rating,
        review: formData.value.review,
        imageData: formData.value.imageData,
        categoryIds: formData.value.categoryIds
      })
    } else {
      await dishStore.addDish({
        name: formData.value.name.trim(),
        rating: formData.value.rating,
        review: formData.value.review,
        imageData: formData.value.imageData,
        categoryIds: formData.value.categoryIds
      })
    }
    router.back()
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败，请重试')
  }
}

function handleDelete() {
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  try {
    await dishStore.deleteDish(route.params.id)
    showDeleteConfirm.value = false
    router.replace('/')
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败，请重试')
  }
}

function goBack() {
  router.back()
}

async function loadDish() {
  if (!isEditMode.value) return
  const dish = await dishStore.getDishById(route.params.id)
  if (dish) {
    formData.value = {
      name: dish.name || '',
      rating: dish.rating || 0,
      review: dish.review || '',
      imageData: dish.imageData || null,
      categoryIds: dish.categoryIds || []
    }
  }
}

onMounted(async () => {
  await dishStore.loadCategories()
  await loadDish()
})
</script>

<style scoped>
.dish-edit-page {
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

.edit-form {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.form-section {
  background-color: #fff;
  margin-bottom: 12px;
}

.form-item {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 10px;
}

.required {
  color: var(--danger-color);
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--primary-color);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  resize: none;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: var(--primary-color);
}

.image-item {
  text-align: center;
}

.image-uploader {
  width: 100%;
  height: 200px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s;
}

.image-uploader:hover {
  border-color: var(--primary-color);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-light);
}

.upload-icon {
  font-size: 40px;
}

.upload-text {
  font-size: 14px;
}

.file-input {
  display: none;
}

.remove-image-btn {
  margin-top: 12px;
  padding: 8px 20px;
  color: var(--danger-color);
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}

.category-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.category-selector:hover {
  border-color: var(--primary-color);
}

.selected-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.selected-tag {
  padding: 2px 10px;
  background-color: #f0ecf7;
  color: var(--primary-color);
  font-size: 13px;
  border-radius: 10px;
}

.selector-placeholder {
  color: var(--text-light);
  font-size: 14px;
}

.selector-arrow {
  font-size: 18px;
  color: var(--text-light);
  margin-left: 8px;
}

.rating-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stars {
  display: flex;
  gap: 4px;
}

.star {
  position: relative;
  font-size: 28px;
  line-height: 1;
  width: 28px;
  height: 28px;
  cursor: pointer;
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

.rating-value {
  font-size: 16px;
  font-weight: 600;
  color: #ffc107;
}

.form-actions {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-btn {
  width: 100%;
  height: 48px;
  background-color: var(--primary-color);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.save-btn:not(:disabled):hover {
  background-color: var(--primary-dark);
}

.delete-btn {
  width: 100%;
  height: 48px;
  background-color: #fff;
  color: var(--danger-color);
  font-size: 16px;
  font-weight: 500;
  border-radius: 24px;
  border: 1px solid var(--danger-color);
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #fff1f0;
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

.modal-close {
  font-size: 20px;
  color: var(--text-light);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-body {
  padding: 16px 20px;
  max-height: 300px;
  overflow-y: auto;
}

.category-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.category-option:last-child {
  border-bottom: none;
}

.category-name {
  font-size: 15px;
  color: var(--text-color);
}

.check-icon {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: transparent;
  transition: all 0.2s;
}

.check-icon.checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
}

.modal-confirm {
  width: 100%;
  height: 44px;
  background-color: var(--primary-color);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  border-radius: 22px;
  border: none;
  cursor: pointer;
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
