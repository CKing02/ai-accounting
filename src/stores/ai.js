import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/localDB'

export const useAIStore = defineStore('ai', () => {
  const conversations = ref([])
  const loading = ref(false)

  // 加载对话历史
  async function loadConversations() {
    loading.value = true
    try {
      conversations.value = await db.aiConversations.orderBy('createdAt').toArray()
    } finally {
      loading.value = false
    }
  }

  // 添加对话消息
  async function addMessage(role, content, recordData = null) {
    const message = {
      role,
      content,
      recordData,
      createdAt: new Date().toISOString()
    }
    const id = await db.aiConversations.add(message)
    message.id = id
    conversations.value.push(message)
    return message
  }

  // 清空对话历史
  async function clearHistory() {
    await db.aiConversations.clear()
    conversations.value = []
  }

  return {
    conversations,
    loading,
    loadConversations,
    addMessage,
    clearHistory
  }
})
