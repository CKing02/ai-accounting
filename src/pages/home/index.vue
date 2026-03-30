<template>
  <div class="home-page">
    <!-- 欢迎卡片 -->
    <div class="welcome-card">
      <div class="welcome-text">
        <h2>欢迎回来！</h2>
        <p>{{ greeting }}</p>
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

    <!-- 预算和目标 -->
    <el-row :gutter="20" class="section-row" v-if="budgetEnabled">
      <el-col :span="12">
        <BudgetCard
          title="本月支出预算"
          :current-amount="monthlyStats.expense"
          :target-amount="budgetSettings.monthlyExpenseLimit"
          type="expense"
          :show-actions="true"
          @edit="showBudgetDialog"
          @aiSuggest="askAIBudget"
        />
      </el-col>
      <el-col :span="12">
        <BudgetCard
          title="存钱目标"
          :current-amount="savingProgress"
          :target-amount="savingGoal"
          type="saving"
          :show-actions="true"
          @edit="showSavingDialog"
          @aiSuggest="askAISaving"
        />
      </el-col>
    </el-row>

    <!-- 总资产和账户 -->
    <el-row :gutter="20" class="section-row">
      <el-col :span="12">
        <div class="card total-assets">
          <div class="card-header">
            <h3>总资产</h3>
            <el-button text size="small" @click="$router.push('/accounts')">管理</el-button>
          </div>
          <div class="card-content">
            <div class="total-amount" :class="{ negative: totalBalance < 0 }">
              ¥{{ totalBalance.toFixed(2) }}
            </div>
            <div class="assets-list">
              <div
                v-for="account in accounts.slice(0, 4)"
                :key="account.id"
                class="assets-item"
              >
                <div class="assets-name">
                  <el-icon><component :is="account.icon || 'Wallet'" /></el-icon>
                  {{ account.name }}
                </div>
                <div class="assets-balance">¥{{ account.balance.toFixed(2) }}</div>
              </div>
              <div v-if="accounts.length > 4" class="more-link" @click="$router.push('/accounts')">
                查看全部 {{ accounts.length }} 个账户
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card recent-records">
          <div class="card-header">
            <h3>最近记录</h3>
            <el-button text size="small" @click="$router.push('/records')">查看全部</el-button>
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

    <!-- AI理财助手快捷入口 -->
    <div class="ai-entry-card" @click="$router.push('/ai')">
      <div class="ai-icon">
        <el-icon size="32"><MagicStick /></el-icon>
      </div>
      <div class="ai-content">
        <h4>AI理财管家</h4>
        <p>智能规划用钱、存钱、生钱</p>
      </div>
      <el-icon class="ai-arrow"><ArrowRight /></el-icon>
    </div>

    <!-- 添加记录对话框 -->
    <AddRecordDialog
      v-model="addDialogVisible"
      :type="addDialogType"
      @success="handleAddSuccess"
    />

    <!-- 预算设置对话框 -->
    <el-dialog v-model="budgetDialogVisible" title="设置预算" width="400px">
      <el-form :model="budgetForm" label-width="100px">
        <el-form-item label="每月支出上限">
          <el-input-number
            v-model="budgetForm.monthlyExpenseLimit"
            :min="0"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="存钱目标">
          <el-input-number
            v-model="budgetForm.savingGoal"
            :min="0"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="budgetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBudget">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountsStore } from '@/stores/accounts'
import { useRecordsStore } from '@/stores/records'
import { ElMessage } from 'element-plus'
import AddRecordDialog from '@/components/common/AddRecordDialog.vue'
import BudgetCard from '@/components/common/BudgetCard.vue'

const router = useRouter()
const accountsStore = useAccountsStore()
const recordsStore = useRecordsStore()

const addDialogVisible = ref(false)
const addDialogType = ref('expense')
const budgetDialogVisible = ref(false)

const budgetSettings = ref({
  monthlyExpenseLimit: 5000,
  savingGoal: 10000
})

const budgetForm = ref({
  monthlyExpenseLimit: 5000,
  savingGoal: 10000
})

const budgetEnabled = computed(() => budgetSettings.value.monthlyExpenseLimit > 0)
const savingProgress = computed(() => Math.max(0, accountsStore.totalBalance))
const savingGoal = computed(() => budgetSettings.value.savingGoal)

const accounts = computed(() => accountsStore.accounts)
const totalBalance = computed(() => accountsStore.totalBalance)
const monthlyStats = computed(() => recordsStore.monthlyStats)
const recentRecords = computed(() => recordsStore.records.slice(0, 5))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好，注意休息！'
  if (hour < 9) return '早上好，新的一天开始！'
  if (hour < 12) return '上午好，工作顺利！'
  if (hour < 14) return '中午好，记得吃午饭！'
  if (hour < 18) return '下午好，继续加油！'
  if (hour < 22) return '晚上好，辛苦了！'
  return '夜深了，早点休息！'
})

onMounted(() => {
  loadBudgetSettings()
})

function loadBudgetSettings() {
  const saved = localStorage.getItem('budget_settings')
  if (saved) {
    budgetSettings.value = JSON.parse(saved)
  }
  budgetForm.value = { ...budgetSettings.value }
}

function showAddDialog(type) {
  addDialogType.value = type
  addDialogVisible.value = true
}

function showBudgetDialog() {
  budgetForm.value = { ...budgetSettings.value }
  budgetDialogVisible.value = true
}

function showSavingDialog() {
  budgetForm.value = { ...budgetSettings.value }
  budgetDialogVisible.value = true
}

function saveBudget() {
  budgetSettings.value = { ...budgetForm.value }
  localStorage.setItem('budget_settings', JSON.stringify(budgetSettings.value))
  budgetDialogVisible.value = false
  ElMessage.success('预算设置已保存')
}

function askAIBudget() {
  router.push('/ai')
}

function askAISaving() {
  router.push('/ai')
}

function handleAddSuccess() {
  // 刷新数据
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

.section-row {
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
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

.total-amount.negative {
  color: #eb3349;
}

.assets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  font-size: 14px;
}

.assets-balance {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.more-link {
  color: #667eea;
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
  cursor: pointer;
}

.more-link:hover {
  text-decoration: underline;
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
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
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
  margin-bottom: 2px;
  font-size: 14px;
}

.record-desc {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-amount {
  font-weight: 500;
  font-size: 15px;
  flex-shrink: 0;
}

.record-amount.income {
  color: #38ef7d;
}

.record-amount.expense {
  color: #eb3349;
}

.ai-entry-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-entry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.ai-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-content {
  flex: 1;
}

.ai-content h4 {
  margin: 0 0 4px;
  font-size: 18px;
}

.ai-content p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.ai-arrow {
  font-size: 20px;
}
</style>
