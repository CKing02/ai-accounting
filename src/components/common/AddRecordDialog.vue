<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="账户" prop="accountId">
        <el-select v-model="form.accountId" placeholder="请选择账户" style="width: 100%">
          <el-option
            v-for="account in accounts"
            :key="account.id"
            :label="account.name"
            :value="account.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :precision="2"
          :controls="false"
          placeholder="请输入金额"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="类目" prop="category">
        <el-select v-model="form.category" placeholder="请选择类目" style="width: 100%">
          <el-option
            v-for="cat in currentCategories"
            :key="cat.name"
            :label="cat.name"
            :value="cat.name"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="添加备注..."
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useRecordsStore } from '@/stores/records'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  type: {
    type: String,
    default: 'expense'
  },
  record: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()
const recordsStore = useRecordsStore()

const formRef = ref(null)
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.record)
const dialogTitle = computed(() => {
  if (isEdit.value) return '编辑记录'
  return props.type === 'income' ? '记收入' : '记支出'
})

const accounts = computed(() => accountsStore.accounts)
const currentCategories = computed(() =>
  props.type === 'income'
    ? categoriesStore.incomeCategories()
    : categoriesStore.expenseCategories()
)

const form = ref({
  accountId: null,
  amount: null,
  category: '',
  date: new Date().toISOString().split('T')[0],
  description: ''
})

const rules = {
  accountId: [{ required: true, message: '请选择账户', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  category: [{ required: true, message: '请选择类目', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// 初始化/重置表单
function initForm() {
  if (isEdit.value) {
    form.value = {
      accountId: props.record.accountId,
      amount: props.record.amount,
      category: props.record.category,
      date: props.record.date.split('T')[0],
      description: props.record.description || ''
    }
  } else {
    form.value = {
      accountId: accounts.value[0]?.id || null,
      amount: null,
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    }
  }
}

watch(visible, (val) => {
  if (val) {
    initForm()
  }
})

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await recordsStore.updateRecord(props.record.id, {
        ...form.value,
        type: props.type
      })
      ElMessage.success('更新成功')
    } else {
      await recordsStore.addRecord({
        ...form.value,
        type: props.type
      })
      ElMessage.success('记录成功')
    }
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  visible.value = false
}
</script>
