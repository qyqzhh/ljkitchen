<template>
  <div class="category-manage-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">食材类别管理</div>
      <div class="nav-placeholder"></div>
    </div>

    <div class="content">
      <div class="category-list">
        <div
          v-for="category in fridgeStore.categories"
          :key="category.id"
          class="category-item"
        >
          <div class="category-info">
            <span v-if="editingId !== category.id" class="category-name">
              {{ category.name }}
            </span>
            <input
              v-else
              v-model="editName"
              class="edit-input"
              @keyup.enter="saveEdit(category.id)"
              @blur="saveEdit(category.id)"
              ref="editInput"
            />
          </div>
          <div class="category-actions">
            <button class="action-btn edit-btn" @click="startEdit(category)">
              编辑
            </button>
            <button class="action-btn delete-btn" @click="handleDelete(category)">
              删除
            </button>
          </div>
        </div>
      </div>

      <div v-if="fridgeStore.categories.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无分类</div>
      </div>
    </div>

    <div class="bottom-bar">
      <button class="add-btn" @click="showAddModal = true">
        <span class="btn-icon">+</span>
        <span class="btn-text">新增类别</span>
      </button>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">新增类别</h3>
          <button class="modal-close" @click="showAddModal = false">✕</button>
        </div>
        <div class="modal-body">
          <input
            v-model="newCategoryName"
            class="form-input"
            placeholder="请输入类别名称"
            @keyup.enter="handleAdd"
          />
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showAddModal = false">取消</button>
          <button class="confirm-btn" @click="handleAdd" :disabled="!newCategoryName.trim()">
            确定
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content confirm-modal">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
        </div>
        <div class="modal-body">
          <p v-if="deleteError">{{ deleteError }}</p>
          <p v-else>确定要删除"{{ deletingCategory?.name }}"吗？</p>
        </div>
        <div class="modal-footer confirm-footer">
          <button class="cancel-btn" @click="showDeleteConfirm = false">取消</button>
          <button v-if="!deleteError" class="confirm-delete-btn" @click="confirmDelete">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFridgeStore } from '../stores/fridge'

const router = useRouter()
const fridgeStore = useFridgeStore()

const showAddModal = ref(false)
const newCategoryName = ref('')
const editingId = ref(null)
const editName = ref('')
const editInput = ref(null)
const showDeleteConfirm = ref(false)
const deletingCategory = ref(null)
const deleteError = ref('')

function goBack() {
  router.back()
}

async function handleAdd() {
  if (!newCategoryName.value.trim()) return
  try {
    await fridgeStore.addCategory(newCategoryName.value.trim())
    newCategoryName.value = ''
    showAddModal.value = false
  } catch (e) {
    console.error('添加失败:', e)
    alert('添加失败，请重试')
  }
}

function startEdit(category) {
  editingId.value = category.id
  editName.value = category.name
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
      editInput.value.select()
    }
  })
}

async function saveEdit(id) {
  if (!editName.value.trim()) {
    editingId.value = null
    return
  }
  try {
    await fridgeStore.updateCategory(id, { name: editName.value.trim() })
  } catch (e) {
    console.error('修改失败:', e)
    alert('修改失败，请重试')
  }
  editingId.value = null
}

function handleDelete(category) {
  deletingCategory.value = category
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  try {
    await fridgeStore.deleteCategory(deletingCategory.value.id)
    showDeleteConfirm.value = false
    deletingCategory.value = null
  } catch (e) {
    deleteError.value = e.message || '删除失败'
  }
}

onMounted(async () => {
  await fridgeStore.loadCategories()
})
</script>

<style scoped>
.category-manage-page {
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
  padding: 12px;
  padding-bottom: 100px;
}

.category-list {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.category-item:last-child {
  border-bottom: none;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 15px;
  color: var(--text-color);
}

.edit-input {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--primary-color);
  border-radius: 6px;
  font-size: 15px;
  outline: none;
}

.category-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.edit-btn {
  background-color: #f0ecf7;
  color: var(--primary-color);
}

.delete-btn {
  background-color: #fff1f0;
  color: var(--danger-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  color: var(--text-light);
  font-size: 14px;
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

.modal-close {
  font-size: 20px;
  color: var(--text-light);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
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

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  height: 40px;
  background-color: #f5f5f5;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

.confirm-btn {
  flex: 1;
  height: 40px;
  background-color: var(--primary-color);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

.confirm-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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
