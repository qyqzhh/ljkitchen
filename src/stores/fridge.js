import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../db'
import { generateUUID } from '../utils/uuid'
import { calcRemainingDays, getExpiryStatus } from '../utils/date'

const DEFAULT_CATEGORIES = [
  { name: '蔬菜' },
  { name: '肉类' },
  { name: '水果' },
  { name: '调料' },
  { name: '主食' },
  { name: '饮品' }
]

export const useFridgeStore = defineStore('fridge', () => {
  const categories = ref([])
  const ingredients = ref([])
  const currentStatusFilter = ref(null)
  const searchKeyword = ref('')
  const isInitialized = ref(false)

  const ingredientCount = computed(() => ingredients.value.length)

  const freshIngredients = computed(() =>
    ingredients.value.filter(i => getIngredientStatus(i) === 'fresh')
  )

  const expiringIngredients = computed(() =>
    ingredients.value.filter(i => getIngredientStatus(i) === 'expiring')
  )

  const expiredIngredients = computed(() =>
    ingredients.value.filter(i => getIngredientStatus(i) === 'expired')
  )

  const freshCount = computed(() => freshIngredients.value.length)
  const expiringCount = computed(() => expiringIngredients.value.length)
  const expiredCount = computed(() => expiredIngredients.value.length)

  const filteredIngredients = computed(() => {
    let result = ingredients.value
    if (currentStatusFilter.value) {
      result = result.filter(i => getIngredientStatus(i) === currentStatusFilter.value)
    }
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(i => i.name.toLowerCase().includes(keyword))
    }
    return result
  })

  function getIngredientStatus(ingredient) {
    const remainingDays = calcRemainingDays(
      ingredient.productionDate,
      ingredient.shelfLife,
      ingredient.shelfLifeUnit
    )
    return getExpiryStatus(remainingDays)
  }

  function getIngredientRemainingDays(ingredient) {
    return calcRemainingDays(
      ingredient.productionDate,
      ingredient.shelfLife,
      ingredient.shelfLifeUnit
    )
  }

  async function initDefaultCategories() {
    const count = await db.ingredientCategory.count()
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await db.ingredientCategory.add({
          id: generateUUID(),
          name: cat.name
        })
      }
    }
  }

  async function initSeedData() {
    const count = await db.ingredient.count()
    if (count === 0) {
      const cats = await db.ingredientCategory.toArray()
      const vegCat = cats.find(c => c.name === '蔬菜')
      const meatCat = cats.find(c => c.name === '肉类')
      const fruitCat = cats.find(c => c.name === '水果')
      const drinkCat = cats.find(c => c.name === '饮品')

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)
      const twoWeeksAgo = new Date(today)
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const sampleIngredients = [
        {
          name: '西红柿',
          categoryId: vegCat ? vegCat.id : null,
          productionDate: formatDateISO(twoDaysAgo),
          shelfLife: 7,
          shelfLifeUnit: 'day',
          quantity: '500g',
          note: '新鲜饱满'
        },
        {
          name: '鸡胸肉',
          categoryId: meatCat ? meatCat.id : null,
          productionDate: formatDateISO(yesterday),
          shelfLife: 3,
          shelfLifeUnit: 'day',
          quantity: '2块',
          note: '记得尽快食用'
        },
        {
          name: '苹果',
          categoryId: fruitCat ? fruitCat.id : null,
          productionDate: formatDateISO(lastWeek),
          shelfLife: 2,
          shelfLifeUnit: 'week',
          quantity: '6个',
          note: ''
        },
        {
          name: '牛奶',
          categoryId: drinkCat ? drinkCat.id : null,
          productionDate: formatDateISO(twoWeeksAgo),
          shelfLife: 7,
          shelfLifeUnit: 'day',
          quantity: '1盒',
          note: '快过期了'
        }
      ]

      for (const item of sampleIngredients) {
        await db.ingredient.add({
          id: generateUUID(),
          ...item,
          createdAt: new Date().toISOString()
        })
      }
    }
  }

  function formatDateISO(date) {
    return date.toISOString().split('T')[0]
  }

  async function initialize() {
    if (isInitialized.value) return
    await initDefaultCategories()
    await initSeedData()
    isInitialized.value = true
  }

  async function loadCategories() {
    await initialize()
    categories.value = await db.ingredientCategory.toArray()
  }

  async function loadIngredients() {
    await initialize()
    let result = await db.ingredient.orderBy('createdAt').reverse().toArray()
    ingredients.value = result
  }

  async function addCategory(name) {
    const category = {
      id: generateUUID(),
      name
    }
    await db.ingredientCategory.add(category)
    await loadCategories()
    return category
  }

  async function updateCategory(id, updates) {
    await db.ingredientCategory.update(id, updates)
    await loadCategories()
  }

  async function deleteCategory(id) {
    const ingredientsWithCategory = await db.ingredient.where('categoryId').equals(id).count()
    if (ingredientsWithCategory > 0) {
      throw new Error('该分类下还有食材，无法删除')
    }
    await db.ingredientCategory.delete(id)
    await loadCategories()
  }

  async function addIngredient(ingredientData) {
    const ingredient = {
      id: generateUUID(),
      name: ingredientData.name,
      categoryId: ingredientData.categoryId || null,
      productionDate: ingredientData.productionDate || null,
      shelfLife: ingredientData.shelfLife || null,
      shelfLifeUnit: ingredientData.shelfLifeUnit || 'day',
      quantity: ingredientData.quantity || '',
      note: ingredientData.note || '',
      createdAt: new Date().toISOString()
    }
    await db.ingredient.add(ingredient)
    await loadIngredients()
    return ingredient
  }

  async function updateIngredient(id, updates) {
    await db.ingredient.update(id, updates)
    await loadIngredients()
  }

  async function deleteIngredient(id) {
    await db.ingredient.delete(id)
    await loadIngredients()
  }

  async function getIngredientById(id) {
    return await db.ingredient.get(id)
  }

  async function getCategoryById(id) {
    return await db.ingredientCategory.get(id)
  }

  function setStatusFilter(status) {
    currentStatusFilter.value = status
  }

  function setSearchKeyword(keyword) {
    searchKeyword.value = keyword
  }

  return {
    categories,
    ingredients,
    currentStatusFilter,
    searchKeyword,
    isInitialized,
    ingredientCount,
    freshIngredients,
    expiringIngredients,
    expiredIngredients,
    freshCount,
    expiringCount,
    expiredCount,
    filteredIngredients,
    initialize,
    loadCategories,
    loadIngredients,
    addCategory,
    updateCategory,
    deleteCategory,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientById,
    getCategoryById,
    getIngredientStatus,
    getIngredientRemainingDays,
    setStatusFilter,
    setSearchKeyword
  }
})
