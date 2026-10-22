import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../db'
import { generateUUID } from '../utils/uuid'

const DEFAULT_CATEGORIES = [
  { name: '荤菜', sort: 1 },
  { name: '素菜', sort: 2 },
  { name: '主食', sort: 3 },
  { name: '饮品', sort: 4 },
  { name: '小吃美味', sort: 5 }
]

export const useDishStore = defineStore('dish', () => {
  const categories = ref([])
  const dishes = ref([])
  const currentCategoryId = ref(null)
  const searchKeyword = ref('')
  const isInitialized = ref(false)

  const dishCount = computed(() => dishes.value.length)

  async function initDefaultCategories() {
    const count = await db.dishCategory.count()
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await db.dishCategory.add({
          id: generateUUID(),
          name: cat.name,
          sort: cat.sort
        })
      }
    }
  }

  async function initSeedData() {
    const dishCount = await db.dish.count()
    if (dishCount === 0) {
      const cats = await db.dishCategory.toArray()
      const meatCat = cats.find(c => c.name === '荤菜')
      const vegCat = cats.find(c => c.name === '素菜')
      const stapleCat = cats.find(c => c.name === '主食')
      const drinkCat = cats.find(c => c.name === '饮品')
      const snackCat = cats.find(c => c.name === '小吃美味')

      const sampleDishes = [
        {
          name: '红烧肉',
          rating: 4.5,
          review: '肥而不腻，入口即化，经典家常菜。',
          categoryIds: meatCat ? [meatCat.id] : [],
          imageData: null
        },
        {
          name: '清炒时蔬',
          rating: 4,
          review: '清爽健康，保留蔬菜的原汁原味。',
          categoryIds: vegCat ? [vegCat.id] : [],
          imageData: null
        },
        {
          name: '蛋炒饭',
          rating: 4,
          review: '粒粒分明，蛋香浓郁，简单又美味。',
          categoryIds: stapleCat ? [stapleCat.id] : [],
          imageData: null
        },
        {
          name: '冰镇柠檬茶',
          rating: 4.5,
          review: '酸甜可口，夏日解暑必备。',
          categoryIds: drinkCat ? [drinkCat.id] : [],
          imageData: null
        },
        {
          name: '香煎饺子',
          rating: 5,
          review: '外皮酥脆，内馅鲜美，一口一个停不下来。',
          categoryIds: snackCat ? [snackCat.id] : [],
          imageData: null
        }
      ]

      for (const dish of sampleDishes) {
        await db.dish.add({
          id: generateUUID(),
          ...dish,
          createdAt: new Date().toISOString()
        })
      }
    }
  }

  async function initialize() {
    if (isInitialized.value) return
    await initDefaultCategories()
    await initSeedData()
    isInitialized.value = true
  }

  async function loadCategories() {
    await initialize()
    categories.value = await db.dishCategory.orderBy('sort').toArray()
  }

  async function loadDishes() {
    await initialize()
    let query = db.dish.orderBy('createdAt').reverse()
    let result

    if (currentCategoryId.value) {
      result = await db.dish.where('categoryIds').equals(currentCategoryId.value).reverse().sortBy('createdAt')
      result = result.reverse()
    } else {
      result = await query.toArray()
    }

    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      dishes.value = result.filter(d =>
        d.name.toLowerCase().includes(keyword)
      )
    } else {
      dishes.value = result
    }
  }

  async function addCategory(name) {
    const sort = categories.value.length + 1
    const category = {
      id: generateUUID(),
      name,
      sort
    }
    await db.dishCategory.add(category)
    await loadCategories()
    return category
  }

  async function updateCategory(id, updates) {
    await db.dishCategory.update(id, updates)
    await loadCategories()
  }

  async function deleteCategory(id) {
    const dishesWithCategory = await db.dish.where('categoryIds').equals(id).count()
    if (dishesWithCategory > 0) {
      throw new Error('该分类下还有菜品，无法删除')
    }
    await db.dishCategory.delete(id)
    await loadCategories()
    if (currentCategoryId.value === id) {
      currentCategoryId.value = null
    }
    await loadDishes()
  }

  async function addDish(dishData) {
    const dish = {
      id: generateUUID(),
      name: dishData.name,
      rating: dishData.rating || 0,
      review: dishData.review || '',
      imageData: dishData.imageData || null,
      categoryIds: dishData.categoryIds || [],
      createdAt: new Date().toISOString()
    }
    await db.dish.add(dish)
    await loadDishes()
    return dish
  }

  async function updateDish(id, updates) {
    await db.dish.update(id, updates)
    await loadDishes()
  }

  async function deleteDish(id) {
    await db.dish.delete(id)
    await loadDishes()
  }

  async function getDishById(id) {
    return await db.dish.get(id)
  }

  async function getCategoriesByIds(ids) {
    if (!ids || ids.length === 0) return []
    const result = []
    for (const id of ids) {
      const cat = await db.dishCategory.get(id)
      if (cat) result.push(cat)
    }
    return result
  }

  function setCurrentCategory(categoryId) {
    currentCategoryId.value = categoryId
    loadDishes()
  }

  function setSearchKeyword(keyword) {
    searchKeyword.value = keyword
    loadDishes()
  }

  return {
    categories,
    dishes,
    currentCategoryId,
    searchKeyword,
    isInitialized,
    dishCount,
    initialize,
    loadCategories,
    loadDishes,
    addCategory,
    updateCategory,
    deleteCategory,
    addDish,
    updateDish,
    deleteDish,
    getDishById,
    getCategoriesByIds,
    setCurrentCategory,
    setSearchKeyword
  }
})
