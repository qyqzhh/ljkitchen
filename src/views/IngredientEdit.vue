<template>
  <div class="ingredient-edit-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">{{ isEditMode ? '编辑食材' : '添加食材' }}</div>
      <div class="nav-placeholder"></div>
    </div>

    <div class="edit-form">
      <div class="form-section">
        <div class="form-item">
          <label class="form-label">名称 <span class="required">*</span></label>
          <input
            type="text"
            v-model="formData.name"
            class="form-input"
            placeholder="请输入食材名称"
          />
        </div>

        <div class="form-item">
          <label class="form-label">类别 <span class="required">*</span></label>
          <div class="category-selector" @click="showCategoryModal = true">
            <div v-if="selectedCategory" class="selected-category">
              {{ selectedCategory.name }}
            </div>
            <div v-else class="selector-placeholder">请选择类别</div>
            <span class="selector-arrow">›</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-item">
          <label class="form-label">生产日期</label>
          <input
            type="date"
            v-model="formData.productionDate"
            class="form-input"
          />
        </div>

        <div class="form-item">
          <label class="form-label">保质期</label>
          <div class="shelf-life-row">
            <input
              type="number"
              v-model.number="formData.shelfLife"
              class="form-input shelf-life-input"
              placeholder="数量"
              min="0"
            />
            <select v-model="formData.shelfLifeUnit" class="form-input unit-select">
              <option value="day">天</option>
              <option value="week">周</option>
              <option value="month">月</option>
              <option value="year">年</option>
            </select>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">数量</label>
          <input
            type="text"
            v-model="formData.quantity"
            class="form-input"
            placeholder="如：500g、2个、1盒"
          />
        </div>

        <div class="form-item">
          <label class="form-label">备注</label>
          <textarea
            v-model="formData.note"
            class="form-textarea"
            placeholder="添加备注信息（不超过50字）"
            rows="3"
            maxlength="50"
          ></textarea>
          <div class="char-count">{{ formData.note.length }}/50</div>
        </div>
      </div>

      <div class="form-actions">
        <button class="save-btn" @click="handleSave" :disabled="!canSave">
          保存
        </button>
        <button v-if="isEditMode" class="delete-btn" @click="handleDelete">
          删除食材
        </button>
      </div>
    </div>

    <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">选择类别</h3>
          <button class="modal-close" @click="showCategoryModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div
            v-for="cat in fridgeStore.categories"
            :key="cat.id"
            class="category-option"
            @click="selectCategory(cat.id)"
          >
            <span class="category-name">{{ cat.name }}</span>
            <span class="check-icon" :class="{ checked: formData.categoryId === cat.id }">
              {{ formData.categoryId === cat.id ? '✓' : '' }}
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
          <p>确定要删除这个食材吗？删除后无法恢复。</p>
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
import { useFridgeStore } from '../stores/fridge'

const route = useRoute()
const router = useRouter()
const fridgeStore = useFridgeStore()

const showCategoryModal = ref(false)
const showDeleteConfirm = ref(false)

const isEditMode = computed(() => !!route.params.id)

const formData = ref({
  name: '',
  categoryId: null,
  productionDate: '',
  shelfLife: null,
  shelfLifeUnit: 'day',
  quantity: '',
  note: ''
})

const selectedCategory = computed(() => {
  if (!formData.value.categoryId) return null
  return fridgeStore.categories.find(c => c.id === formData.value.categoryId)
})

const canSave = computed(() => {
  return formData.value.name.trim() && formData.value.categoryId
})

function selectCategory(catId) {
  formData.value.categoryId = catId
  showCategoryModal.value = false
}

async function handleSave() {
  if (!canSave.value) return

  try {
    const data = {
      name: formData.value.name.trim(),
      categoryId: formData.value.categoryId,
      productionDate: formData.value.productionDate || null,
      shelfLife: formData.value.shelfLife,
      shelfLifeUnit: formData.value.shelfLifeUnit,
      quantity: formData.value.quantity.trim(),
      note: formData.value.note.trim()
    }

    if (isEditMode.value) {
      await fridgeStore.updateIngredient(route.params.id, data)
    } else {
      await fridgeStore.addIngredient(data)
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
    await fridgeStore.deleteIngredient(route.params.id)
    showDeleteConfirm.value = false
    router.replace('/fridge')
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败，请重试')
  }
}

function goBack() {
  router.back()
}

async function loadIngredient() {
  if (!isEditMode.value) return
  const ingredient = await fridgeStore.getIngredientById(route.params.id)
  if (ingredient) {
    formData.value = {
      name: ingredient.name || '',
      categoryId: ingredient.categoryId || null,
      productionDate: ingredient.productionDate || '',
      shelfLife: ingredient.shelfLife || null,
      shelfLifeUnit: ingredient.shelfLifeUnit || 'day',
      quantity: ingredient.quantity || '',
      note: ingredient.note || ''
    }
  }
}

onMounted(async () => {
  await fridgeStore.loadCategories()
  await loadIngredient()
})
</script>

<style scoped>
.ingredient-edit-page {
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
  position: relative;
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
  background-color: #fff;
  color: var(--text-color);
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

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.shelf-life-row {
  display: flex;
  gap: 10px;
}

.shelf-life-input {
  flex: 1;
}

.unit-select {
  width: 100px;
  flex-shrink: 0;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
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

.selected-category {
  color: var(--text-color);
  font-size: 14px;
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
