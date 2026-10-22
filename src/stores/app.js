import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'ljkitchen_app_config'

export const useAppStore = defineStore('app', () => {
  const kitchenName = ref('我的厨房')
  const kitchenLevel = ref(1)
  const dishLimit = ref(60)
  const categoryLimit = ref(10)
  const budgetLimit = ref(null)
  const expireWarningDays = ref(3)
  const themeColor = ref('#8b7ab8')

  function loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const config = JSON.parse(saved)
        if (config.kitchenName !== undefined) kitchenName.value = config.kitchenName
        if (config.kitchenLevel !== undefined) kitchenLevel.value = config.kitchenLevel
        if (config.dishLimit !== undefined) dishLimit.value = config.dishLimit
        if (config.categoryLimit !== undefined) categoryLimit.value = config.categoryLimit
        if (config.budgetLimit !== undefined) budgetLimit.value = config.budgetLimit
        if (config.expireWarningDays !== undefined) expireWarningDays.value = config.expireWarningDays
        if (config.themeColor !== undefined) themeColor.value = config.themeColor
      }
    } catch (e) {
      console.error('加载配置失败:', e)
    }
  }

  function saveConfig() {
    try {
      const config = {
        kitchenName: kitchenName.value,
        kitchenLevel: kitchenLevel.value,
        dishLimit: dishLimit.value,
        categoryLimit: categoryLimit.value,
        budgetLimit: budgetLimit.value,
        expireWarningDays: expireWarningDays.value,
        themeColor: themeColor.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (e) {
      console.error('保存配置失败:', e)
    }
  }

  function setKitchenName(name) {
    kitchenName.value = name
    saveConfig()
  }

  function setKitchenLevel(level) {
    kitchenLevel.value = level
    saveConfig()
  }

  function setDishLimit(limit) {
    dishLimit.value = limit
    saveConfig()
  }

  function setCategoryLimit(limit) {
    categoryLimit.value = limit
    saveConfig()
  }

  function setBudgetLimit(limit) {
    budgetLimit.value = limit
    saveConfig()
  }

  function setExpireWarningDays(days) {
    expireWarningDays.value = days
    saveConfig()
  }

  function setThemeColor(color) {
    themeColor.value = color
    saveConfig()
  }

  function resetConfig() {
    kitchenName.value = '我的厨房'
    kitchenLevel.value = 1
    dishLimit.value = 60
    categoryLimit.value = 10
    budgetLimit.value = null
    expireWarningDays.value = 3
    themeColor.value = '#8b7ab8'
    saveConfig()
  }

  return {
    kitchenName,
    kitchenLevel,
    dishLimit,
    categoryLimit,
    budgetLimit,
    expireWarningDays,
    themeColor,
    loadConfig,
    saveConfig,
    setKitchenName,
    setKitchenLevel,
    setDishLimit,
    setCategoryLimit,
    setBudgetLimit,
    setExpireWarningDays,
    setThemeColor,
    resetConfig
  }
})
