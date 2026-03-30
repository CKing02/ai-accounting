<template>
  <div class="reports-page">
    <div class="page-header">
      <h2>消费报告</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY-MM"
          value-format="YYYY-MM"
          :clearable="false"
        />
        <el-button type="primary" @click="generateAIReport" :loading="aiLoading">
          <el-icon><MagicStick /></el-icon>
          AI智能分析
        </el-button>
      </div>
    </div>

    <!-- AI分析结果 -->
    <div v-if="aiAnalysis" class="ai-analysis-card">
      <div class="ai-header">
        <div class="ai-icon">
          <el-icon size="20"><MagicStick /></el-icon>
        </div>
        <span>AI智能分析</span>
        <el-button text size="small" @click="aiAnalysis = null">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="ai-content" v-html="formatAnalysis(aiAnalysis)"></div>
    </div>

    <!-- 月度概览 -->
    <el-row :gutter="20" class="overview-row">
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

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <ExpensePieChart title="支出构成" :data="categorySummary" />
      </el-col>
      <el-col :span="12">
        <TrendLineChart
          title="收支趋势"
          :income-data="monthlyIncomeTrend"
          :expense-data="monthlyExpenseTrend"
          :labels="trendLabels"
        />
      </el-col>
    </el-row>

    <!-- 类目明细 -->
    <div class="category-detail">
      <h3>支出明细</h3>
      <el-table :data="categoryDetail" stripe max-height="300">
        <el-table-column prop="category" label="类目" width="150">
          <template #default="{ row }">
            <div class="category-cell">
              <span class="category-dot" :style="{ background: row.color }"></span>
              {{ row.category }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" align="right" sortable>
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" align="right" sortable>
          <template #default="{ row }">
            <div class="percentage-bar">
              <span class="percentage-text">{{ row.percentage.toFixed(1) }}%</span>
              <el-progress
                :percentage="row.percentage"
                :stroke-width="8"
                :show-text="false"
                :color="row.color"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="趋势" align="center" width="80">
          <template #default="{ row }">
            <div class="trend-cell" :class="{ up: row.trend > 0, down: row.trend < 0 }">
              <el-icon v-if="row.trend > 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              <span>{{ Math.abs(row.trend).toFixed(0) }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h3>快捷操作</h3>
      <div class="action-buttons">
        <el-button @click="$router.push('/ai')">
          <el-icon><ChatDotRound /></el-icon>
          询问AI管家
        </el-button>
        <el-button @click="$router.push('/records')">
          <el-icon><List /></el-icon>
          查看记账记录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecordsStore } from '@/stores/records'
import { generateReportAnalysis, hasApiKey } from '@/services/ai'
import { ElMessage } from 'element-plus'
import ExpensePieChart from '@/components/chart/ExpensePieChart.vue'
import TrendLineChart from '@/components/chart/TrendLineChart.vue'

const recordsStore = useRecordsStore()

const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const aiAnalysis = ref(null)
const aiLoading = ref(false)

// 月度统计数据
const monthlyStats = computed(() => recordsStore.monthlyStats)

// 获取月度数据
const monthData = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  return recordsStore.records.filter(r => {
    return r.date >= startDate && r.date <= endDate
  })
})

// 按类目汇总支出
const categorySummary = computed(() => {
  const summary = {}
  const colors = {
    '餐饮': '#FF6B6B', '购物': '#4ECDC4', '交通': '#45B7D1',
    '居住': '#96CEB4', '医疗': '#FFEAA7', '娱乐': '#DDA0DD',
    '教育': '#98D8C8', '通讯': '#F7DC6F', '其他': '#BDC3C7'
  }

  monthData.value
    .filter(r => r.type === 'expense')
    .forEach(r => {
      if (!summary[r.category]) {
        summary[r.category] = 0
      }
      summary[r.category] += r.amount
    })
  return summary
})

// 类目明细表格数据
const categoryDetail = computed(() => {
  const total = Object.values(categorySummary.value).reduce((sum, v) => sum + v, 0)
  const colors = {
    '餐饮': '#FF6B6B', '购物': '#4ECDC4', '交通': '#45B7D1',
    '居住': '#96CEB4', '医疗': '#FFEAA7', '娱乐': '#DDA0DD',
    '教育': '#98D8C8', '通讯': '#F7DC6F', '其他': '#BDC3C7'
  }

  return Object.entries(categorySummary.value)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: colors[category] || '#BDC3C7',
      trend: Math.random() * 30 - 15 // 模拟趋势
    }))
    .sort((a, b) => b.amount - a.amount)
})

// 趋势图数据（按日）
const trendLabels = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()
  return Array.from({ length: days }, (_, i) => `${month}-${i + 1}`)
})

const monthlyIncomeTrend = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()
  return Array.from({ length: days }, (_, day) => {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`
    return monthData.value
      .filter(r => r.type === 'income' && r.date.startsWith(dayStr))
      .reduce((sum, r) => sum + r.amount, 0)
  })
})

const monthlyExpenseTrend = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()
  return Array.from({ length: days }, (_, day) => {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`
    return monthData.value
      .filter(r => r.type === 'expense' && r.date.startsWith(dayStr))
      .reduce((sum, r) => sum + r.amount, 0)
  })
})

async function generateAIReport() {
  if (!hasApiKey()) {
    ElMessage.warning('请先设置API密钥')
    return
  }

  aiLoading.value = true
  try {
    aiAnalysis.value = await generateReportAnalysis()
  } catch (error) {
    ElMessage.error(error.message || '生成分析失败')
  } finally {
    aiLoading.value = false
  }
}

function formatAnalysis(text) {
  return text.replace(/\n/g, '<br>')
}
</script>

<style scoped>
.reports-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.ai-analysis-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  color: #fff;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-icon {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-header span {
  flex: 1;
  font-weight: 500;
}

.ai-content {
  line-height: 1.8;
  opacity: 0.95;
}

.overview-row {
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

.charts-row {
  margin-bottom: 20px;
}

.category-detail {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.category-detail h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.amount {
  font-weight: 500;
}

.percentage-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.percentage-text {
  width: 45px;
  text-align: right;
  color: #666;
  font-size: 14px;
}

.percentage-bar .el-progress {
  flex: 1;
}

.trend-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 13px;
}

.trend-cell.up {
  color: #eb3349;
}

.trend-cell.down {
  color: #38ef7d;
}

.quick-actions {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.quick-actions h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>
