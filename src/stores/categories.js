import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/localDB'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)

  // 获取支出类目
  const expenseCategories = () => categories.value.filter(c => c.type === 'expense')

  // 获取收入类目
  const incomeCategories = () => categories.value.filter(c => c.type === 'income')

  // 加载所有类目
  async function loadCategories() {
    loading.value = true
    try {
      categories.value = await db.categories.orderBy('name').toArray()
    } finally {
      loading.value = false
    }
  }

  // 添加类目
  async function addCategory(category) {
    const newCategory = {
      ...category,
      createdAt: new Date().toISOString()
    }
    const id = await db.categories.add(newCategory)
    newCategory.id = id
    categories.value.push(newCategory)
    return newCategory
  }

  // 更新类目
  async function updateCategory(id, updates) {
    await db.categories.update(id, updates)
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value[index] = { ...categories.value[index], ...updates }
    }
  }

  // 删除类目
  async function deleteCategory(id) {
    await db.categories.delete(id)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return {
    categories,
    loading,
    expenseCategories,
    incomeCategories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
