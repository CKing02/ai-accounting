<template>
  <div class="budget-page">
    <div class="page-header">
      <h2>预算管理</h2>
      <el-switch
        v-model="budget.enabled"
        active-text="启用预算"
        inactive-text="禁用预算"
        @change="handleEnabledChange"
      />
    </div>

    <!-- 预算概览 -->
    <div class="budget-overview">
      <el-card shadow="hover">
        <template #header>
          <div class="overview-header">
            <span>本月预算进度</span>
            <el-tag :type="overviewStatus.type">{{ overviewStatus.text }}</el-tag>
          </div>
        </template>
        <div class="overview-content">
          <div class="overview-amount">
            <span class="current">¥{{ currentSpent.toFixed(2) }}</span>
            <span class="separator">/</span>
            <span class="limit">¥{{ budget.monthlyLimit.toFixed(2) }}</span>
          </div>
          <el-progress
            :percentage="overviewPercentage"
            :stroke-width="20"
            :color="progressColor"
          />
          <div class="overview-hint">
            <span v-if="remaining > 0">剩余可用 ¥{{ remaining.toFixed(2) }}</span>
            <span v-else class="over">已超支 ¥{{ Math.abs(remaining).toFixed(2) }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 月度总预算设置 -->
    <div class="section">
      <h3>
        <el-icon><Wallet /></el-icon>
        月度总预算
      </h3>
      <el-card shadow="hover">
        <el-form label-width="100px">
          <el-form-item label="每月预算上限">
            <el-input-number
              v-model="form.monthlyLimit"
              :min="0"
              :precision="2"
              :controls="false"
              style="width: 200px"
            />
            <span class="form-hint">设置每月最大支出额度</span>
          </el-form-item>
          <el-form-item label="预警阈值">
            <el-slider
              v-model="form.alertThreshold"
              :min="0.5"
              :max="0.95"
              :step="0.05"
              :format-tooltip="val => `${Math.round(val * 100)}%`"
              style="width: 200px"
            />
            <span class="form-hint">达到 {{ Math.round(form.alertThreshold * 100) }}% 时提醒</span>
          </el-form-item>
        </el-form>
        <div class="card-actions">
          <el-button type="primary" @click="saveMonthlyBudget">保存设置</el-button>
        </div>
      </el-card>
    </div>

    <!-- 分类预算 -->
    <div class="section">
      <h3>
        <el-icon><FolderOpened /></el-icon>
        分类预算
      </h3>
      <el-card shadow="hover">
        <template #header>
          <div class="section-header">
            <span>为每个支出类目设置预算上限</span>
            <el-button type="primary" size="small" @click="showAddCategoryDialog">
              <el-icon><Plus /></el-icon> 添加分类预算
            </el-button>
          </div>
        </template>

        <div v-if="categoryBudgets.length === 0" class="empty-state">
          <el-empty description="暂无分类预算设置" />
        </div>

        <div v-else class="category-list">
          <div
            v-for="item in categoryBudgets"
            :key="item.category"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-name">{{ item.category }}</span>
              <span class="category-progress">
                已用 ¥{{ item.spent.toFixed(2) }} / ¥{{ item.limit.toFixed(2) }}
              </span>
            </div>
            <el-progress
              :percentage="item.percentage"
              :stroke-width="8"
              :color="item.percentage >= 100 ? '#eb3349' : item.percentage >= 80 ? '#f45c43' : '#38ef7d'"
            />
            <div class="category-actions">
              <el-button text size="small" @click="editCategoryBudget(item)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button text size="small" type="danger" @click="deleteCategoryBudget(item.category)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 存钱目标 -->
    <div class="section">
      <h3>
        <el-icon><Money /></el-icon>
        存钱目标
      </h3>
      <el-card shadow="hover">
        <el-form label-width="100px">
          <el-form-item label="目标金额">
            <el-input-number
              v-model="form.savingGoal"
              :min="0"
              :precision="2"
              :controls="false"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="目标月份">
            <el-date-picker
              v-model="form.savingGoalMonth"
              type="month"
              placeholder="选择目标月份"
              format="YYYY-MM"
              value-format="YYYY-MM"
              style="width: 200px"
            />
          </el-form-item>
        </el-form>
        <div class="saving-progress" v-if="budget.savingGoal > 0">
          <div class="saving-info">
            <span>当前进度</span>
            <span>¥{{ currentBalance.toFixed(2) }} / ¥{{ budget.savingGoal.toFixed(2) }}</span>
          </div>
          <el-progress
            :percentage="savingPercentage"
            :stroke-width="15"
            color="#667eea"
          />
          <div class="saving-hint">
            <span v-if="savingPercentage >= 100">恭喜！存钱目标已达成！</span>
            <span v-else-if="budget.savingGoalMonth">
              距离 {{ budget.savingGoalMonth }} 还剩 {{ remainingMonths }} 个月
            </span>
            <span v-else>
              每月需存 ¥{{ monthlySavingNeeded.toFixed(2) }} 才能达成目标
            </span>
          </div>
        </div>
        <div class="card-actions">
          <el-button type="primary" @click="saveSavingGoal">保存目标</el-button>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑分类预算对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="editingCategory ? '编辑分类预算' : '添加分类预算'"
      width="400px"
    >
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="类目">
          <el-select
            v-model="categoryForm.category"
            placeholder="选择类目"
            style="width: 100%"
            :disabled="!!editingCategory"
          >
            <el-option
              v-for="cat in availableCategories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算上限">
          <el-input-number
            v-model="categoryForm.limit"
            :min="0"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategoryBudget">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useRecordsStore } from '@/stores/records'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { ElMessage } from 'element-plus'

const budgetStore = useBudgetStore()
const recordsStore = useRecordsStore()
const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()

const budget = computed(() => budgetStore.budget)
const budgetEnabled = computed(() => budgetStore.budget.enabled)

const form = ref({
  monthlyLimit: 5000,
  alertThreshold: 0.8,
  savingGoal: 0,
  savingGoalMonth: null
})

const categoryDialogVisible = ref(false)
const editingCategory = ref(null)
const categoryForm = ref({
  category: '',
  limit: 0
})

// 月度支出统计
const currentSpent = computed(() => recordsStore.monthlyStats.expense)

// 预算概览状态
const overviewStatus = computed(() => {
  const alert = budgetStore.checkBudgetAlert(currentSpent.value)
  if (alert.level === 'danger') return { type: 'danger', text: '已超支' }
  if (alert.level === 'warning') return { type: 'warning', text: '预算紧张' }
  return { type: 'success', text: '正常' }
})

const overviewPercentage = computed(() => {
  if (budget.value.monthlyLimit <= 0) return 0
  return Math.min((currentSpent.value / budget.value.monthlyLimit) * 100, 100)
})

const progressColor = computed(() => {
  const pct = overviewPercentage.value
  if (pct >= 100) return '#eb3349'
  if (pct >= 80) return '#f45c43'
  return '#38ef7d'
})

const remaining = computed(() => budget.value.monthlyLimit - currentSpent.value)

// 当前余额
const currentBalance = computed(() => Math.max(0, accountsStore.totalBalance))

// 存钱目标进度
const savingPercentage = computed(() => {
  if (budget.value.savingGoal <= 0) return 0
  return Math.min((currentBalance.value / budget.value.savingGoal) * 100, 100)
})

// 剩余月份
const remainingMonths = computed(() => {
  if (!budget.value.savingGoalMonth) return 0
  const now = new Date()
  const target = new Date(budget.value.savingGoalMonth + '-01')
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  return Math.max(0, months)
})

// 每月需存
const monthlySavingNeeded = computed(() => {
  if (remainingMonths.value <= 0) return budget.value.savingGoal
  return Math.max(0, (budget.value.savingGoal - currentBalance.value) / remainingMonths.value)
})

// 分类预算列表
const categoryBudgets = computed(() => {
  const limits = budget.value.categoryLimits
  const result = []

  for (const [category, limit] of Object.entries(limits)) {
    const spent = recordsStore.expenseByCategory[category] || 0
    result.push({
      category,
      limit,
      spent,
      percentage: limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
    })
  }

  return result.sort((a, b) => b.percentage - a.percentage)
})

// 可用的类目（尚未设置预算的）
const availableCategories = computed(() => {
  const expenseCats = categoriesStore.expenseCategories().map(c => c.name)
  const setCats = Object.keys(budget.value.categoryLimits)
  return expenseCats.filter(cat => !setCats || editingCategory.value === cat)
})

onMounted(() => {
  // 初始化表单
  form.value = {
    monthlyLimit: budget.value.monthlyLimit,
    alertThreshold: budget.value.alertThreshold,
    savingGoal: budget.value.savingGoal,
    savingGoalMonth: budget.value.savingGoalMonth
  }
})

function handleEnabledChange(enabled) {
  budgetStore.setEnabled(enabled)
  ElMessage.success(enabled ? '预算管理已启用' : '预算管理已禁用')
}

function saveMonthlyBudget() {
  budgetStore.setMonthlyLimit(form.value.monthlyLimit)
  budgetStore.setAlertThreshold(form.value.alertThreshold)
  ElMessage.success('月度预算已保存')
}

function saveSavingGoal() {
  budgetStore.setSavingGoal(form.value.savingGoal, form.value.savingGoalMonth)
  ElMessage.success('存钱目标已保存')
}

function showAddCategoryDialog() {
  editingCategory.value = null
  categoryForm.value = { category: '', limit: 0 }
  categoryDialogVisible.value = true
}

function editCategoryBudget(item) {
  editingCategory.value = item.category
  categoryForm.value = { category: item.category, limit: item.limit }
  categoryDialogVisible.value = true
}

function saveCategoryBudget() {
  if (!categoryForm.value.category) {
    ElMessage.warning('请选择类目')
    return
  }
  if (categoryForm.value.limit <= 0) {
    ElMessage.warning('请输入有效的预算金额')
    return
  }

  budgetStore.setCategoryLimit(categoryForm.value.category, categoryForm.value.limit)
  categoryDialogVisible.value = false
  ElMessage.success(editingCategory.value ? '分类预算已更新' : '分类预算已添加')
}

function deleteCategoryBudget(category) {
  budgetStore.removeCategoryLimit(category)
  ElMessage.success('分类预算已删除')
}
</script>

<style scoped>
.budget-page {
  max-width: 800px;
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
  margin: 0;
}

.budget-overview {
  margin-bottom: 24px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-content {
  padding: 8px 0;
}

.overview-amount {
  text-align: center;
  margin-bottom: 16px;
}

.overview-amount .current {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.overview-amount .separator {
  font-size: 20px;
  color: #999;
  margin: 0 8px;
}

.overview-amount .limit {
  font-size: 20px;
  color: #666;
}

.overview-hint {
  text-align: center;
  margin-top: 12px;
  color: #38ef7d;
  font-size: 14px;
}

.overview-hint .over {
  color: #eb3349;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-hint {
  margin-left: 12px;
  color: #999;
  font-size: 13px;
}

.card-actions {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.empty-state {
  padding: 40px 0;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.category-info {
  grid-column: 1;
}

.category-name {
  font-weight: 500;
  color: #333;
}

.category-progress {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  display: block;
}

.category-actions {
  grid-column: 2;
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  gap: 4px;
}

.saving-progress {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.saving-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #666;
}

.saving-hint {
  margin-top: 12px;
  text-align: center;
  color: #667eea;
  font-size: 14px;
}
</style>
