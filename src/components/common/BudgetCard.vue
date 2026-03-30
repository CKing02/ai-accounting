<template>
  <div class="budget-card">
    <div class="budget-header">
      <h4>
        <el-icon><Wallet /></el-icon>
        {{ title }}
      </h4>
      <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
    </div>

    <div class="budget-amount">
      <span class="current">¥{{ currentAmount.toFixed(2) }}</span>
      <span class="separator">/</span>
      <span class="target">¥{{ targetAmount.toFixed(2) }}</span>
    </div>

    <el-progress
      :percentage="percentage"
      :stroke-width="10"
      :color="progressColor"
      :show-text="false"
    />

    <div v-if="showActions" class="budget-actions">
      <el-button size="small" @click="$emit('edit')">
        <el-icon><Edit /></el-icon> 修改
      </el-button>
      <el-button size="small" type="primary" @click="$emit('aiSuggest')">
        <el-icon><MagicStick /></el-icon> AI建议
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '本月预算'
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  targetAmount: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    default: 'expense' // expense | saving
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'aiSuggest'])

const percentage = computed(() => {
  if (props.targetAmount <= 0) return 0
  const pct = (props.currentAmount / props.targetAmount) * 100
  return Math.min(Math.round(pct), 100)
})

const progressColor = computed(() => {
  const pct = percentage.value
  if (props.type === 'saving') {
    return pct >= 100 ? '#38ef7d' : '#667eea'
  }
  if (pct >= 100) return '#eb3349'
  if (pct >= 80) return '#f45c43'
  return '#38ef7d'
})

const statusType = computed(() => {
  const pct = percentage.value
  if (props.type === 'saving') {
    return pct >= 100 ? 'success' : 'warning'
  }
  if (pct >= 100) return 'danger'
  if (pct >= 80) return 'warning'
  return 'success'
})

const statusText = computed(() => {
  const pct = percentage.value
  if (props.type === 'saving') {
    return pct >= 100 ? '已达成' : '进行中'
  }
  if (pct >= 100) return '已超支'
  if (pct >= 80) return '接近上限'
  return '正常'
})
</script>

<style scoped>
.budget-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.budget-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
  margin: 0;
}

.budget-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.budget-amount .current {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.budget-amount .separator {
  color: #999;
}

.budget-amount .target {
  font-size: 16px;
  color: #999;
}

.budget-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
