import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 本地存储键名
const BUDGET_STORAGE_KEY = 'ai_accounting_budget'

// 默认预算配置
const defaultBudget = {
  enabled: true,
  monthlyLimit: 5000,
  categoryLimits: {}, // { categoryName: limitAmount }
  alertThreshold: 0.8, // 80%时提醒
  savingGoal: 0,
  savingGoalMonth: null // 目标月份
}

export const useBudgetStore = defineStore('budget', () => {
  const budget = ref({ ...defaultBudget })

  // 加载预算设置
  function loadBudget() {
    const saved = localStorage.getItem(BUDGET_STORAGE_KEY)
    if (saved) {
      try {
        budget.value = { ...defaultBudget, ...JSON.parse(saved) }
      } catch {
        budget.value = { ...defaultBudget }
      }
    }
  }

  // 保存预算设置
  function saveBudget() {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budget.value))
  }

  // 更新月度总预算
  function setMonthlyLimit(limit) {
    budget.value.monthlyLimit = limit
    saveBudget()
  }

  // 设置分类预算
  function setCategoryLimit(category, limit) {
    if (limit > 0) {
      budget.value.categoryLimits[category] = limit
    } else {
      delete budget.value.categoryLimits[category]
    }
    saveBudget()
  }

  // 删除分类预算
  function removeCategoryLimit(category) {
    delete budget.value.categoryLimits[category]
    saveBudget()
  }

  // 设置存钱目标
  function setSavingGoal(amount, targetMonth = null) {
    budget.value.savingGoal = amount
    budget.value.savingGoalMonth = targetMonth
    saveBudget()
  }

  // 设置预警阈值
  function setAlertThreshold(threshold) {
    budget.value.alertThreshold = threshold
    saveBudget()
  }

  // 启用/禁用预算
  function setEnabled(enabled) {
    budget.value.enabled = enabled
    saveBudget()
  }

  // 计算某分类的预算使用百分比
  function getCategoryUsage(category, spent) {
    const limit = budget.value.categoryLimits[category]
    if (!limit || limit <= 0) return null
    return Math.min((spent / limit) * 100, 100)
  }

  // 检查是否超过预算
  function checkBudgetAlert(spent) {
    if (!budget.value.enabled) return null

    const percentage = budget.value.monthlyLimit > 0
      ? (spent / budget.value.monthlyLimit) * 100
      : 0

    if (percentage >= 100) {
      return { level: 'danger', message: '已超支！', percentage }
    } else if (percentage >= budget.value.alertThreshold * 100) {
      return { level: 'warning', message: '预算已用完', percentage }
    }
    return { level: 'normal', message: '正常', percentage }
  }

  // 检查分类预算
  function checkCategoryAlert(category, spent) {
    const limit = budget.value.categoryLimits[category]
    if (!limit || limit <= 0) return null

    const percentage = (spent / limit) * 100
    if (percentage >= 100) {
      return { level: 'danger', message: `${category}已超支`, percentage }
    } else if (percentage >= 80) {
      return { level: 'warning', message: `${category}接近上限`, percentage }
    }
    return { level: 'normal', message: '正常', percentage }
  }

  // 初始化
  loadBudget()

  return {
    budget,
    loadBudget,
    saveBudget,
    setMonthlyLimit,
    setCategoryLimit,
    removeCategoryLimit,
    setSavingGoal,
    setAlertThreshold,
    setEnabled,
    getCategoryUsage,
    checkBudgetAlert,
    checkCategoryAlert
  }
})
