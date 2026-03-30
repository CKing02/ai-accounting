<template>
  <div class="settings-page">
    <div class="page-header">
      <h2>设置</h2>
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
import { ref, computed, onMounted } from 'vue'
import { db } from '@/services/localDB'
import { hasApiKey } from '@/services/ai'
import { getSupabaseConfig, saveSupabaseConfig } from '@/services/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'
import ApiKeyDialog from '@/components/ai/ApiKeyDialog.vue'

const showApiKeyDialog = ref(false)
const showSupabaseDialog = ref(false)
const isSyncing = ref(false)
const lastSyncTime = ref(null)

const hasApiKeyValue = ref(hasApiKey())
const hasSupabase = computed(() => !!getSupabaseConfig())

const supabaseForm = ref({
  url: '',
  anonKey: ''
})

onMounted(() => {
  const config = getSupabaseConfig()
  if (config) {
    supabaseForm.value = config
  }
})

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
    // 模拟同步
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

      // 导入数据
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
  color: #333;
}

.settings-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.settings-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-item.danger {
  border-bottom: none;
}

.setting-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 13px;
  color: #999;
}

.about-info {
  text-align: center;
  padding: 20px;
  color: #666;
  line-height: 2;
}

.about-info p:first-child {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
</style>
