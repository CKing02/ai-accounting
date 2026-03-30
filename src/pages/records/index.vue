<template>
  <div class="records-page">
    <div class="page-header">
      <h2>记账记录</h2>
      <el-button type="primary" @click="showAddDialog('income')">
        <el-icon><Plus /></el-icon> 记收入
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="类型" clearable style="width: 120px">
        <el-option label="收入" value="income" />
        <el-option label="支出" value="expense" />
      </el-select>
      <el-select v-model="filterAccount" placeholder="账户" clearable style="width: 150px">
        <el-option
          v-for="acc in accounts"
          :key="acc.id"
          :label="acc.name"
          :value="acc.id"
        />
      </el-select>
      <el-date-picker
        v-model="filterDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px"
      />
    </div>

    <!-- 记录列表 -->
    <div class="records-list">
      <div v-if="filteredRecords.length === 0" class="empty-state">
        <el-empty description="暂无记录" />
      </div>

      <div
        v-for="(group, date) in groupedRecords"
        :key="date"
        class="record-group"
      >
        <div class="date-header">
          <span class="date">{{ formatDate(date) }}</span>
          <span class="expense-sum">支出: ¥{{ group.expense.toFixed(2) }}</span>
          <span class="income-sum">收入: ¥{{ group.income.toFixed(2) }}</span>
        </div>

        <div
          v-for="record in group.records"
          :key="record.id"
          class="record-item"
        >
          <div class="record-icon" :class="record.type">
            <el-icon><ArrowUp v-if="record.type === 'income'" /><ArrowDown v-else /></el-icon>
          </div>
          <div class="record-info">
            <div class="record-category">{{ record.category }}</div>
            <div class="record-desc">{{ record.description || '无备注' }}</div>
            <div class="record-account">{{ getAccountName(record.accountId) }}</div>
          </div>
          <div class="record-amount" :class="record.type">
            {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
          </div>
          <div class="record-actions">
            <el-button text size="small" @click="handleEdit(record)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button text size="small" type="danger" @click="handleDelete(record.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <AddRecordDialog
      v-model="dialogVisible"
      :type="dialogType"
      :record="editingRecord"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecordsStore } from '@/stores/records'
import { useAccountsStore } from '@/stores/accounts'
import { ElMessage, ElMessageBox } from 'element-plus'
import AddRecordDialog from '@/components/common/AddRecordDialog.vue'

const recordsStore = useRecordsStore()
const accountsStore = useAccountsStore()

const dialogVisible = ref(false)
const dialogType = ref('expense')
const editingRecord = ref(null)

const filterType = ref('')
const filterAccount = ref('')
const filterDateRange = ref([])

const accounts = computed(() => accountsStore.accounts)
const records = computed(() => recordsStore.records)

const filteredRecords = computed(() => {
  return records.value.filter(record => {
    if (filterType.value && record.type !== filterType.value) return false
    if (filterAccount.value && record.accountId !== filterAccount.value) return false
    if (filterDateRange.value.length === 2) {
      const recordDate = record.date.split('T')[0]
      if (recordDate < filterDateRange.value[0] || recordDate > filterDateRange.value[1]) {
        return false
      }
    }
    return true
  })
})

const groupedRecords = computed(() => {
  const groups = {}
  filteredRecords.value.forEach(record => {
    const date = record.date.split('T')[0]
    if (!groups[date]) {
      groups[date] = { records: [], income: 0, expense: 0 }
    }
    groups[date].records.push(record)
    if (record.type === 'income') {
      groups[date].income += record.amount
    } else {
      groups[date].expense += record.amount
    }
  })
  return groups
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) return '今天'
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天'

  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
}

function getAccountName(accountId) {
  const account = accounts.value.find(a => a.id === accountId)
  return account ? account.name : '未知账户'
}

function showAddDialog(type) {
  editingRecord.value = null
  dialogType.value = type
  dialogVisible.value = true
}

function handleEdit(record) {
  editingRecord.value = { ...record }
  dialogType.value = record.type
  dialogVisible.value = true
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      type: 'warning'
    })
    await recordsStore.deleteRecord(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

function handleDialogSuccess() {
  // 刷新数据
}
</script>

<style scoped>
.records-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 20px;
  color: #333;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.records-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.empty-state {
  padding: 60px 0;
}

.record-group {
  border-bottom: 1px solid #f0f0f0;
}

.record-group:last-child {
  border-bottom: none;
}

.date-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.date-header .date {
  font-weight: 500;
  color: #333;
}

.date-header .expense-sum {
  color: #eb3349;
  font-size: 14px;
}

.date-header .income-sum {
  color: #38ef7d;
  font-size: 14px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.record-icon.income {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.record-icon.expense {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-category {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.record-desc {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-account {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.record-amount {
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.record-amount.income {
  color: #38ef7d;
}

.record-amount.expense {
  color: #eb3349;
}

.record-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
</style>
