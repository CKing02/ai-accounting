import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/localDB'
import { useAccountsStore } from './accounts'

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const loading = ref(false)

  // 本月收入/支出统计
  const monthlyStats = computed(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthRecords = records.value.filter(r => r.date >= startOfMonth)

    const income = monthRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)

    const expense = monthRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)

    return { income, expense, balance: income - expense }
  })

  // 按类目统计支出
  const expenseByCategory = computed(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthRecords = records.value.filter(
      r => r.type === 'expense' && r.date >= startOfMonth
    )

    const categoryMap = {}
    monthRecords.forEach(r => {
      if (!categoryMap[r.category]) {
        categoryMap[r.category] = 0
      }
      categoryMap[r.category] += r.amount
    })
    return categoryMap
  })

  // 加载所有记录
  async function loadRecords() {
    loading.value = true
    try {
      records.value = await db.records.orderBy('date').reverse().toArray()
    } finally {
      loading.value = false
    }
  }

  // 添加记录
  async function addRecord(record) {
    const accountsStore = useAccountsStore()
    const newRecord = {
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const id = await db.records.add(newRecord)
    newRecord.id = id
    records.value.unshift(newRecord)

    // 更新账户余额
    await accountsStore.updateBalance(record.accountId, record.amount, record.type)
    await accountsStore.loadAccounts()

    return newRecord
  }

  // 更新记录
  async function updateRecord(id, updates) {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await db.records.update(id, updatedData)
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      records.value[index] = { ...records.value[index], ...updatedData }
    }
  }

  // 删除记录
  async function deleteRecord(id) {
    const record = records.value.find(r => r.id === id)
    if (record) {
      const accountsStore = useAccountsStore()
      await db.records.delete(id)
      records.value = records.value.filter(r => r.id !== id)
      // 恢复账户余额
      await accountsStore.updateBalance(
        record.accountId,
        record.amount,
        record.type === 'income' ? 'expense' : 'income'
      )
      await accountsStore.loadAccounts()
    }
  }

  // 按日期范围筛选
  function getRecordsByDateRange(startDate, endDate) {
    return records.value.filter(r => r.date >= startDate && r.date <= endDate)
  }

  return {
    records,
    loading,
    monthlyStats,
    expenseByCategory,
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDateRange
  }
})
