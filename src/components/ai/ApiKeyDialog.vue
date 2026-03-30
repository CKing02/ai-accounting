<template>
  <el-dialog
    v-model="visible"
    title="设置API密钥"
    width="450px"
    @close="handleClose"
  >
    <div class="api-key-content">
      <el-alert
        title="如何获取API密钥？"
        type="info"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template #default>
          <p>1. 访问 <a href="https://console.anthropic.com/" target="_blank"> Anthropic Console</a></p>
          <p>2. 注册并登录账号</p>
          <p>3. 在API Keys页面创建新的API Key</p>
          <p>4. 复制密钥并粘贴到下方</p>
        </template>
      </el-alert>

      <el-form ref="formRef" :model="form" :rules="rules">
        <el-form-item prop="apiKey">
          <el-input
            v-model="form.apiKey"
            type="password"
            placeholder="请输入API密钥"
            show-password
          />
        </el-form-item>
      </el-form>

      <div v-if="currentKey" class="current-key">
        <el-icon color="#67C23A"><Check /></el-icon>
        <span>已设置API密钥</span>
        <el-button text size="small" @click="clearKey">清除</el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { setApiKey, hasApiKey } from '@/services/ai'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const saving = ref(false)
const currentKey = ref(hasApiKey())

const form = ref({
  apiKey: ''
})

const rules = {
  apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }]
}

watch(visible, (val) => {
  if (val) {
    currentKey.value = hasApiKey()
    form.value.apiKey = ''
  }
})

function handleSave() {
  if (!form.value.apiKey.trim()) {
    ElMessage.warning('请输入API密钥')
    return
  }

  setApiKey(form.value.apiKey.trim())
  ElMessage.success('API密钥已保存')
  currentKey.value = true
  handleClose()
}

function clearKey() {
  setApiKey('')
  currentKey.value = false
  form.value.apiKey = ''
}

function handleClose() {
  visible.value = false
}
</script>

<style scoped>
.api-key-content {
  padding: 8px 0;
}

.current-key {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0f9eb;
  border-radius: 8px;
  color: #67C23A;
  font-size: 14px;
}

.current-key span {
  flex: 1;
}
</style>
