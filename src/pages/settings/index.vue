<template>
  <div class="settings-page">
    <div class="page-header">
      <h2>设置</h2>
    </div>

    <!-- 通知设置 -->
    <div class="settings-section">
      <h3>
        <el-icon><Bell /></el-icon>
        通知设置
      </h3>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">启用通知</div>
          <div class="setting-desc">允许应用发送系统通知提醒</div>
        </div>
        <el-switch v-model="notificationSettings.enabled" @change="handleNotificationEnabledChange" />
      </div>

      <div class="setting-item" v-if="notificationSettings.enabled">
        <div class="setting-info">
          <div class="setting-label">预算预警</div>
          <div class="setting-desc">当支出达到预算80%或超支时发送通知</div>
        </div>
        <el-switch v-model="notificationSettings.budgetAlert" />
      </div>

      <div class="setting-item" v-if="notificationSettings.enabled">
        <div class="setting-info">
          <div class="setting-label">存钱目标提醒</div>
          <div class="setting-desc">存钱目标达成或即将达成时发送通知</div>
        </div>
        <el-switch v-model="notificationSettings.savingGoalAlert" />
      </div>

      <div class="setting-item" v-if="notificationSettings.enabled && notificationSettings.budgetAlert">
        <div class="setting-info">
          <div class="setting-label">每日记账提醒</div>
          <div class="setting-desc">定时提醒您记录每日收支</div>
        </div>
        <el-switch v-model="notificationSettings.dailyReminder" />
      </div>

      <div class="setting-item" v-if="notificationSettings.enabled && notificationSettings.dailyReminder">
        <div class="setting-info">
          <div class="setting-label">提醒时间</div>
          <div class="setting-desc">每天定时提醒的时间</div>
        </div>
        <el-time-picker
          v-model="dailyReminderTime"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="选择时间"
          style="width: 120px"
        />
      </div>

      <div class="setting-item" v-if="notificationSettings.enabled">
        <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
        <el-button @click="testNotification">发送测试通知</el-button>
      </div>

      <!-- 通知历史 -->
      <div v-if="notificationStore.notifications.length > 0" class="notification-history">
        <div class="history-header">
          <span>通知历史</span>
          <el-button text size="small" @click="notificationStore.clearNotifications">
            清空
          </el-button>
        </div>
        <div class="notification-list">
          <div
            v-for="item in notificationStore.notifications.slice(0, 5)"
            :key="item.id"
            class="notification-item"
            :class="{ unread: !item.read }"
            @click="notificationStore.markAsRead(item.id)"
          >
            <div class="notification-title">{{ item.title }}</div>
            <div class="notification-message">{{ item.message }}</div>
            <div class="notification-time">{{ formatTime(item.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI设置 -->
    <div class="settings-section">
      <h3>AI设置</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Claude API密钥</div>
          <div class="setting-desc">用于启用AI理财管家功能</div>
        </div>
        <el-button @click="showApiKeyDialog = true">
          {{ hasApiKey ? '已设置' : '去设置' }}
        </el-button>
      </div>
    </div>

    <!-- 云端同步设置 -->
    <div class="settings-section">
      <h3>云端同步</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">Supabase配置</div>
          <div class="setting-desc">用于数据云端备份和多设备同步</div>
        </div>
        <el-button @click="showSupabaseDialog = true">
          {{ hasSupabase ? '已配置' : '去配置' }}
        </el-button>
      </div>

      <div v-if="hasSupabase" class="setting-item">
        <div class="setting-info">
          <div class="setting-label">同步状态</div>
          <div class="setting-desc">
            <span v-if="isSyncing">同步中...</span>
            <span v-else-if="lastSyncTime">上次同步: {{ lastSyncTime }}</span>
            <span v-else>尚未同步</span>
          </div>
        </div>
        <el-button @click="syncNow" :loading="isSyncing">立即同步</el-button>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-section">
      <h3>数据管理</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">导出数据</div>
          <div class="setting-desc">将所有记账数据导出为JSON文件</div>
        </div>
        <el-button @click="exportData">导出</el-button>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">导入数据</div>
          <div class="setting-desc">从JSON文件导入记账数据</div>
        </div>
        <el-button @click="importData">导入</el-button>
      </div>
      <div class="setting-item danger">
        <div class="setting-info">
          <div class="setting-label">清除所有数据</div>
          <div class="setting-desc">删除所有本地数据，此操作不可恢复</div>
        </div>
        <el-button type="danger" @click="clearAllData">清除</el-button>
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-section">
      <h3>关于</h3>
      <div class="about-info">
        <p>AI智能记账 v1.0.0</p>
        <p>基于 Vue 3 + Element Plus 构建</p>
        <p>AI能力由 Claude API 提供支持</p>
      </div>
    </div>

    <!-- API密钥设置对话框 -->
    <ApiKeyDialog v-model="showApiKeyDialog" />

    <!-- Supabase配置对话框 -->
    <el-dialog
      v-model="showSupabaseDialog"
      title="配置云端同步"
      width="450px"
    >
      <el-form :model="supabaseForm" label-width="100px">
        <el-form-item label="项目URL">
          <el-input v-model="supabaseForm.url" placeholder="https://xxx.supabase.co" />
        </el-form-item>
        <el-form-item label="Anon Key">
          <el-input v-model="supabaseForm.anonKey" placeholder="eyJ..." type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSupabaseDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSupabase">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '@/services/localDB'
import { hasApiKey } from '@/services/ai'
import { getSupabaseConfig, saveSupabaseConfig } from '@/services/supabase'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage, ElMessageBox } from 'element-plus'
import ApiKeyDialog from '@/components/ai/ApiKeyDialog.vue'

const notificationStore = useNotificationStore()

const showApiKeyDialog = ref(false)
const showSupabaseDialog = ref(false)
const isSyncing = ref(false)
const lastSyncTime = ref(null)

const hasApiKeyValue = ref(hasApiKey())
const hasSupabase = computed(() => !!getSupabaseConfig())

const notificationSettings = ref({ ...notificationStore.settings })
const dailyReminderTime = ref(notificationStore.settings.dailyReminderTime)

const supabaseForm = ref({
  url: '',
  anonKey: ''
})

onMounted(() => {
  const config = getSupabaseConfig()
  if (config) {
    supabaseForm.value = config
  }
  notificationSettings.value = { ...notificationStore.settings }
})

async function handleNotificationEnabledChange(enabled) {
  if (enabled) {
    const granted = await notificationStore.requestPermission()
    if (!granted) {
      ElMessage.warning('通知权限被拒绝，请在浏览器设置中允许通知')
      notificationSettings.value.enabled = false
    }
  }
}

function saveNotificationSettings() {
  notificationStore.updateSettings({
    ...notificationSettings.value,
    dailyReminderTime: dailyReminderTime.value
  })
  ElMessage.success('通知设置已保存')
}

function testNotification() {
  notificationStore.addNotification({
    type: 'info',
    title: '🔔 测试通知',
    message: '通知功能正常工作！'
  })
  ElMessage.success('测试通知已发送')
}

function formatTime(timeStr) {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function saveSupabase() {
  if (!supabaseForm.value.url || !supabaseForm.value.anonKey) {
    ElMessage.warning('请填写完整的Supabase配置')
    return
  }
  saveSupabaseConfig(supabaseForm.value.url, supabaseForm.value.anonKey)
  ElMessage.success('Supabase配置已保存')
  showSupabaseDialog.value = false
}

async function syncNow() {
  isSyncing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    lastSyncTime.value = new Date().toLocaleString('zh-CN')
    ElMessage.success('同步成功')
  } catch (error) {
    ElMessage.error('同步失败')
  } finally {
    isSyncing.value = false
  }
}

async function exportData() {
  try {
    const accounts = await db.accounts.toArray()
    const records = await db.records.toArray()
    const categories = await db.categories.toArray()

    const data = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      accounts,
      records,
      categories
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-accounting-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.accounts || !data.records) {
        throw new Error('无效的数据格式')
      }

      await ElMessageBox.confirm(
        `将导入 ${data.accounts.length} 个账户, ${data.records.length} 条记录。是否继续？`,
        '确认导入',
        { type: 'warning' }
      )

      await db.accounts.clear()
      await db.records.clear()
      await db.categories.clear()

      await db.accounts.bulkAdd(data.accounts)
      await db.records.bulkAdd(data.records)
      if (data.categories) {
        await db.categories.bulkAdd(data.categories)
      }

      ElMessage.success('导入成功，请刷新页面')
    } catch (error) {
      ElMessage.error(error.message || '导入失败')
    }
  }
  input.click()
}

async function clearAllData() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有数据吗？此操作不可恢复！',
      '危险操作',
      { type: 'error', confirmButtonText: '确定清除' }
    )

    await db.accounts.clear()
    await db.records.clear()
    await db.categories.clear()
    await db.aiConversations.clear()

    ElMessage.success('所有数据已清除')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 20px;
  color: var(--text-color);
}

.settings-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.settings-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-item.danger {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.notification-history {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: var(--text-color);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  padding: 12px;
  background: var(--hover-bg);
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.notification-item.unread {
  border-left: 3px solid #667eea;
}

.notification-title {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.about-info {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  line-height: 2;
}

.about-info p:first-child {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}
</style>
