<template>
  <div class="accounts-page">
    <div class="page-header">
      <h2>账户管理</h2>
      <el-button type="primary" @click="showDialog('add')">
        <el-icon><Plus /></el-icon> 添加账户
      </el-button>
    </div>

    <!-- 账户卡片列表 -->
    <el-row :gutter="20">
      <el-col
        v-for="account in accounts"
        :key="account.id"
        :span="8"
      >
        <div class="account-card" :style="{ borderLeftColor: account.color }">
          <div class="account-header">
            <div class="account-icon" :style="{ background: account.color }">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="account-actions">
              <el-button
                text
                size="small"
                @click="showDialog('edit', account)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button
                text
                size="small"
                type="danger"
                @click="handleDelete(account.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="account-name">{{ account.name }}</div>
          <div class="account-balance">¥{{ account.balance.toFixed(2) }}</div>
          <div class="account-type">{{ accountTypeText(account.type) }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加账户' : '编辑账户'"
      width="400px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="form.name" placeholder="如：现金、支付宝" />
        </el-form-item>
        <el-form-item label="账户类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="现金" value="cash" />
            <el-option label="银行卡" value="bank" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wechat" />
            <el-option label="信用卡" value="credit" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
        <el-form-item label="初始余额" prop="balance">
          <el-input-number
            v-model="form.balance"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { ElMessage, ElMessageBox } from 'element-plus'

const accountsStore = useAccountsStore()

const dialogVisible = ref(false)
const dialogType = ref('add')
const submitting = ref(false)
const formRef = ref(null)

const accounts = computed(() => accountsStore.accounts)

const form = ref({
  name: '',
  type: 'cash',
  color: '#3498DB',
  balance: 0
})

const rules = {
  name: [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择账户类型', trigger: 'change' }]
}

function accountTypeText(type) {
  const map = {
    cash: '现金',
    bank: '银行卡',
    alipay: '支付宝',
    wechat: '微信',
    credit: '信用卡',
    other: '其他'
  }
  return map[type] || '其他'
}

function showDialog(type, account = null) {
  dialogType.value = type
  if (type === 'edit' && account) {
    form.value = { ...account }
  } else {
    form.value = {
      name: '',
      type: 'cash',
      color: '#3498DB',
      balance: 0
    }
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (dialogType.value === 'add') {
      await accountsStore.addAccount(form.value)
      ElMessage.success('添加成功')
    } else {
      await accountsStore.updateAccount(form.value.id, form.value)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除这个账户吗？', '提示', {
      type: 'warning'
    })
    await accountsStore.deleteAccount(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.accounts-page {
  max-width: 1200px;
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

.account-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.account-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.account-actions {
  display: flex;
  gap: 4px;
}

.account-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.account-balance {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.account-type {
  font-size: 12px;
  color: #999;
}
</style>
