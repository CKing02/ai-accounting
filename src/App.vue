<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { initDB } from '@/services/localDB'
import { useAccountsStore } from '@/stores/accounts'
import { useRecordsStore } from '@/stores/records'
import { useCategoriesStore } from '@/stores/categories'

const accountsStore = useAccountsStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()

onMounted(async () => {
  // 初始化数据库
  await initDB()
  // 加载数据
  await Promise.all([
    accountsStore.loadAccounts(),
    recordsStore.loadRecords(),
    categoriesStore.loadCategories()
  ])
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>
