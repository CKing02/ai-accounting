<template>
  <div class="home-page">
    <!-- 欢迎卡片 -->
    <div class="welcome-card">
      <div class="welcome-text">
        <h2>欢迎回来！</h2>
        <p>今天是美好的一天，记得记录每一笔收支</p>
      </div>
      <div class="quick-add">
        <el-button type="primary" @click="showAddDialog('income')" size="large">
          <el-icon><Plus /></el-icon> 记收入
        </el-button>
        <el-button type="danger" @click="showAddDialog('expense')" size="large">
          <el-icon><Minus /></el-icon> 记支出
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <div class="stat-card income">
          <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">本月收入</div>
            <div class="stat-value">¥{{ monthlyStats.income.toFixed(2) }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card expense">
          <div class="stat-icon"><el-icon><Bottom /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">本月支出</div>
            <div class="stat-value">¥{{ monthlyStats.expense.toFixed(2) }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card balance">
          <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">本月结余</div>
            <div class="stat-value" :class="{ negative: monthlyStats.balance < 0 }">
              ¥{{ monthlyStats.balance.toFixed(2) }}
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 总资产和账户 -->
    <el-row :gutter="20" class="section-row">
      <el-col :span="12">
        <div class="card total-assets">
          <div class="card-header">
            <h3>总资产</h3>
          </div>
          <div class="card-content">
            <div class="total-amount">¥{{ totalBalance.toFixed(2) }}</div>
            <div class="assets-list">
              <div
                v-for="account in accounts"
                :key="account.id"
                class="assets-item"
              >
                <div class="assets-name">
                  <el-icon><component :is="account.icon || 'Wallet'" /></el-icon>
                  {{ account.name }}
                </div>
                <div class="assets-balance">¥{{ account.balance.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card recent-records">
          <div class="card-header">
            <h3>最近记录</h3>
            <el-button text @click="$router.push('/records')">查看全部</el-button>
          </div>
          <div class="card-content">
            <div v-if="recentRecords.length === 0" class="empty-tip">
              暂无记录，赶快记一笔吧！
            </div>
            <div
              v-for="record in recentRecords"
              :key="record.id"
              class="record-item"
            >
              <div class="record-icon" :class="record.type">
                <el-icon><ArrowUp v-if="record.type === 'income'" /><ArrowDown v-else /></el-icon>
              </div>
              <div class="record-info">
                <div class="record-category">{{ record.category }}</div>
                <div class="record-desc">{{ record.description || '无备注' }}</div>
              </div>
              <div class="record-amount" :class="record.type">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 添加记录对话框 -->
    <AddRecordDialog
      v-model="addDialogVisible"
      :type="addDialogType"
      @success="handleAddSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { useRecordsStore } from '@/stores/records'
import AddRecordDialog from '@/components/common/AddRecordDialog.vue'

const accountsStore = useAccountsStore()
const recordsStore = useRecordsStore()

const addDialogVisible = ref(false)
const addDialogType = ref('expense')

const accounts = computed(() => accountsStore.accounts)
const totalBalance = computed(() => accountsStore.totalBalance)
const monthlyStats = computed(() => recordsStore.monthlyStats)
const recentRecords = computed(() => recordsStore.records.slice(0, 5))

function showAddDialog(type) {
  addDialogType.value = type
  addDialogVisible.value = true
}

function handleAddSuccess() {
  // 记录添加成功后的回调
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 30px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.welcome-text h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.welcome-text p {
  opacity: 0.9;
}

.quick-add {
  display: flex;
  gap: 12px;
}

.quick-add .el-button {
  padding: 12px 24px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-card.income .stat-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-card.expense .stat-icon {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-card.balance .stat-icon {
  background: linear-gradient(135deg, #4776e6 0%, #8e54e9 100%);
}

.stat-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-value.negative {
  color: #eb3349;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  color: #333;
}

.total-amount {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.assets-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assets-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.assets-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.assets-balance {
  font-weight: 500;
  color: #333;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.record-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
}

.record-icon.income {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.record-icon.expense {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.record-info {
  flex: 1;
}

.record-category {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.record-desc {
  font-size: 12px;
  color: #999;
}

.record-amount {
  font-weight: 500;
  font-size: 16px;
}

.record-amount.income {
  color: #38ef7d;
}

.record-amount.expense {
  color: #eb3349;
}
</style>
