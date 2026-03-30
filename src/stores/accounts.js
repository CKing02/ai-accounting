import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/localDB'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref([])
  const loading = ref(false)

  // 计算总余额
  const totalBalance = computed(() => {
    return accounts.value.reduce((sum, acc) => sum + acc.balance, 0)
  })

  // 加载所有账户
  async function loadAccounts() {
    loading.value = true
    try {
      accounts.value = await db.accounts.orderBy('createdAt').toArray()
    } finally {
      loading.value = false
    }
  }

  // 添加账户
  async function addAccount(account) {
    const newAccount = {
      ...account,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const id = await db.accounts.add(newAccount)
    newAccount.id = id
    accounts.value.push(newAccount)
    return newAccount
  }

  // 更新账户
  async function updateAccount(id, updates) {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await db.accounts.update(id, updatedData)
    const index = accounts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...updatedData }
    }
  }

  // 删除账户
  async function deleteAccount(id) {
    await db.accounts.delete(id)
    accounts.value = accounts.value.filter(a => a.id !== id)
  }

  // 更新账户余额
  async function updateBalance(id, amount, type) {
    const account = accounts.value.find(a => a.id === id)
    if (account) {
      const newBalance = type === 'income'
        ? account.balance + amount
        : account.balance - amount
      await updateAccount(id, { balance: newBalance })
    }
  }

  return {
    accounts,
    loading,
    totalBalance,
    loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    updateBalance
  }
})
