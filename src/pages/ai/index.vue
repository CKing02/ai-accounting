<template>
  <div class="ai-page">
    <div class="page-header">
      <h2>AI理财管家</h2>
      <div class="header-actions">
        <el-button text @click="showApiKeyDialog = true">
          <el-icon><Key /></el-icon>
          {{ hasApiKey ? '已设置密钥' : '设置API密钥' }}
        </el-button>
        <el-button text @click="clearHistory">
          <el-icon><Delete /></el-icon> 清空对话
        </el-button>
      </div>
    </div>

    <!-- 对话区域 -->
    <div class="chat-container" ref="chatContainer">
      <div v-if="conversations.length === 0" class="welcome-message">
        <div class="welcome-icon">
          <el-icon size="48"><ChatDotRound /></el-icon>
        </div>
        <h3>您好，我是您的AI理财管家</h3>
        <p>我可以帮助您：</p>
        <ul>
          <li>智能记账 - 告诉我您花了多少钱，我会帮您记录</li>
          <li>消费分析 - 分析您的消费习惯，给出建议</li>
          <li>理财规划 - 帮您制定存钱和投资计划</li>
          <li>解答疑惑 - 任何理财相关问题都可以问我</li>
        </ul>
        <div v-if="!hasApiKey" class="api-tip">
          <el-alert type="warning" :closable="false">
            <template #title>
              请先 <el-button text type="primary" @click="showApiKeyDialog = true">设置API密钥</el-button> 以启用AI功能
            </template>
          </el-alert>
        </div>
        <div class="quick-prompts">
          <el-tag
            v-for="prompt in quickPrompts"
            :key="prompt.text"
            class="prompt-tag"
            @click="sendQuickPrompt(prompt.text)"
          >
            {{ prompt.text }}
          </el-tag>
        </div>
      </div>

      <div
        v-for="(msg, index) in conversations"
        :key="index"
        class="message"
        :class="msg.role"
      >
        <div class="message-avatar">
          <el-icon v-if="msg.role === 'user'"><User /></el-icon>
          <el-icon v-else><MagicStick /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(msg.content)"></div>
          <div class="message-time">{{ formatTime(msg.createdAt) }}</div>

          <!-- 智能记账预览 -->
          <div v-if="msg.recordData && msg.role === 'assistant'" class="record-preview">
            <el-card shadow="hover">
              <template #header>
                <div class="preview-header">
                  <el-icon><Edit /></el-icon>
                  <span>识别到记账请求</span>
                </div>
              </template>
              <div class="preview-content">
                <div class="preview-item">
                  <span class="label">类型：</span>
                  <el-tag :type="msg.recordData.type === 'income' ? 'success' : 'danger'">
                    {{ msg.recordData.type === 'income' ? '收入' : '支出' }}
                  </el-tag>
                </div>
                <div class="preview-item">
                  <span class="label">金额：</span>
                  <span class="value">¥{{ msg.recordData.amount }}</span>
                </div>
                <div class="preview-item">
                  <span class="label">类目：</span>
                  <el-tag>{{ msg.recordData.category }}</el-tag>
                </div>
              </div>
              <div class="preview-actions">
                <el-button size="small" @click="editRecordData(msg.recordData)">
                  <el-icon><Edit /></el-icon> 修改
                </el-button>
                <el-button type="primary" size="small" @click="confirmAddRecord(msg.recordData)">
                  <el-icon><Check /></el-icon> 确认添加
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <div v-if="loading" class="message assistant">
        <div class="message-avatar">
          <el-icon><MagicStick /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-text loading">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 财务概览小卡片 -->
    <div v-if="showFinanceCard" class="finance-mini-card">
      <div class="mini-stat">
        <span class="mini-label">总资产</span>
        <span class="mini-value">¥{{ financeStats.totalBalance.toFixed(2) }}</span>
      </div>
      <el-divider direction="vertical" />
      <div class="mini-stat">
        <span class="mini-label">本月收入</span>
        <span class="mini-value income">¥{{ financeStats.monthlyIncome.toFixed(2) }}</span>
      </div>
      <el-divider direction="vertical" />
      <div class="mini-stat">
        <span class="mini-label">本月支出</span>
        <span class="mini-value expense">¥{{ financeStats.monthlyExpense.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-wrapper">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          placeholder="输入消息...（例如：今天花了50块买午餐）"
          @keydown.enter.ctrl="handleSend"
          @input="inputText = inputText.replace(/\n/g, '')"
        />
      </div>
      <el-button type="primary" :loading="loading" @click="handleSend" :disabled="!hasApiKey || !inputText.trim()">
        <el-icon><Promotion /></el-icon>
      </el-button>
    </div>

    <!-- 修改记录对话框 -->
    <el-dialog v-model="editDialogVisible" title="修改记录" width="400px">
      <el-form :model="editingRecord" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="editingRecord.type">
            <el-radio-button label="expense">支出</el-radio-button>
            <el-radio-button label="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="editingRecord.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类目">
          <el-select v-model="editingRecord.category" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditedRecord">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- API密钥设置对话框 -->
    <ApiKeyDialog v-model="showApiKeyDialog" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useAIStore } from '@/stores/ai'
import { useRecordsStore } from '@/stores/records'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { sendMessage, hasApiKey as checkHasApiKey, getFinancialContext } from '@/services/ai'
import { ElMessage } from 'element-plus'
import ApiKeyDialog from '@/components/ai/ApiKeyDialog.vue'

const aiStore = useAIStore()
const recordsStore = useRecordsStore()
const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()

const inputText = ref('')
const chatContainer = ref(null)
const loading = ref(false)
const showApiKeyDialog = ref(false)
const editDialogVisible = ref(false)
const editingRecord = ref({})
const financeStats = ref({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 })

const hasApiKey = ref(checkHasApiKey())
const conversations = computed(() => aiStore.conversations)
const showFinanceCard = computed(() => conversations.value.length > 0 && conversations.value.length < 5)

const categories = computed(() => {
  const cats = categoriesStore.categories.map(c => c.name)
  return [...new Set(cats)]
})

const quickPrompts = [
  { text: '帮我分析这个月的消费' },
  { text: '我想制定一个存钱计划' },
  { text: '今天花了200块买衣服' },
  { text: '我该怎么开始理财？' },
  { text: '我上月攒了多少钱？' }
]

onMounted(async () => {
  await aiStore.loadConversations()
  await refreshFinanceStats()
  // 监听API密钥变化
  watch(hasApiKey, () => {
    hasApiKey.value = checkHasApiKey()
  })
})

async function refreshFinanceStats() {
  const stats = await getFinancialContext()
  financeStats.value = stats
}

function formatTime(timeStr) {
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatMessage(content) {
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:2px 4px;border-radius:3px;">$1</code>')
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return

  await aiStore.addMessage('user', text)
  inputText.value = ''
  scrollToBottom()

  if (!hasApiKey.value) {
    await aiStore.addMessage('assistant', '请先设置API密钥才能使用AI功能。')
    scrollToBottom()
    return
  }

  loading.value = true
  try {
    const result = await sendMessage(text)
    await aiStore.addMessage('assistant', result.content, result.recordIntent || null)
    await refreshFinanceStats()
    scrollToBottom()
  } catch (error) {
    await aiStore.addMessage('assistant', `抱歉，发生了错误：${error.message}`)
    scrollToBottom()
  } finally {
    loading.value = false
  }
}

async function sendQuickPrompt(prompt) {
  inputText.value = prompt
  await handleSend()
}

function editRecordData(recordData) {
  editingRecord.value = { ...recordData }
  editDialogVisible.value = true
}

async function confirmAddRecord(recordData) {
  await doAddRecord(recordData)
  // 标记已确认
  const lastMsg = conversations.value[conversations.value.length - 1]
  if (lastMsg?.recordData) {
    lastMsg.recordData.confirmed = true
  }
}

async function submitEditedRecord() {
  await doAddRecord(editingRecord.value)
  editDialogVisible.value = false
}

async function doAddRecord(recordData) {
  const accounts = accountsStore.accounts
  if (accounts.length === 0) {
    ElMessage.warning('请先添加账户')
    return
  }

  try {
    await recordsStore.addRecord({
      accountId: accounts[0].id,
      amount: recordData.amount,
      category: recordData.category,
      type: recordData.type,
      date: new Date().toISOString().split('T')[0],
      description: '通过AI管家添加'
    })
    await accountsStore.loadAccounts()
    await refreshFinanceStats()
    ElMessage.success('记录已添加！')
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

async function clearHistory() {
  await aiStore.clearHistory()
  ElMessage.success('对话已清空')
}
</script>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 20px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #fff;
}

.welcome-message h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 12px;
}

.welcome-message p {
  color: #666;
  margin-bottom: 12px;
}

.welcome-message ul {
  text-align: left;
  list-style: none;
  padding: 0 20px;
  margin-bottom: 24px;
}

.welcome-message li {
  padding: 8px 0;
  color: #555;
}

.api-tip {
  margin-bottom: 20px;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.prompt-tag {
  cursor: pointer;
  padding: 10px 16px;
  font-size: 14px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.message.assistant .message-avatar {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
}

.message-content {
  max-width: 75%;
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  text-align: left;
}

.message.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.message.assistant .message-text {
  background: #f5f7fa;
  color: #333;
}

.record-preview {
  margin-top: 12px;
  text-align: left;
}

.record-preview :deep(.el-card) {
  border: 1px solid #e4e7ed;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667eea;
  font-weight: 500;
}

.preview-content {
  padding: 12px 0;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.preview-item .label {
  color: #666;
  width: 50px;
}

.preview-item .value {
  font-weight: 500;
  color: #333;
}

.preview-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.message.user .message-time {
  text-align: right;
}

.message-text.loading {
  display: flex;
  gap: 4px;
  padding: 16px 20px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.finance-mini-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
}

.mini-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.mini-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.mini-value.income {
  color: #38ef7d;
}

.mini-value.expense {
  color: #eb3349;
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  flex: 1;
}

.input-area .el-textarea :deep(textarea) {
  border: none;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  resize: none;
}

.input-area .el-button {
  height: 68px;
  width: 68px;
  border-radius: 8px;
}
</style>
