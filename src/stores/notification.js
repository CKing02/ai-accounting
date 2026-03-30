import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const NOTIFICATION_STORAGE_KEY = 'ai_accounting_notification'

// 默认设置
const defaultSettings = {
  enabled: true,
  budgetAlert: true,        // 预算预警
  dailyReminder: false,      // 每日记账提醒
  dailyReminderTime: '20:00', // 提醒时间
  savingGoalAlert: true       // 存钱目标提醒
}

export const useNotificationStore = defineStore('notification', () => {
  const settings = ref({ ...defaultSettings })
  const notifications = ref([]) // 通知历史

  // 加载设置
  function loadSettings() {
    const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
    if (saved) {
      try {
        settings.value = { ...defaultSettings, ...JSON.parse(saved) }
      } catch {
        settings.value = { ...defaultSettings }
      }
    }
  }

  // 保存设置
  function saveSettings() {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings.value))
  }

  // 更新设置
  function updateSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  // 添加通知
  function addNotification(notification) {
    const item = {
      id: Date.now(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    }
    notifications.value.unshift(item)

    // 只保留最近50条通知
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }

    // 如果浏览器支持且用户授权，发送系统通知
    if (settings.value.enabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.svg'
        })
      } catch (e) {
        console.warn('Notification failed:', e)
      }
    }
  }

  // 标记已读
  function markAsRead(id) {
    const item = notifications.value.find(n => n.id === id)
    if (item) {
      item.read = true
    }
  }

  // 全部标记已读
  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true)
  }

  // 清空通知
  function clearNotifications() {
    notifications.value = []
  }

  // 未读数量
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  // 请求通知权限
  async function requestPermission() {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  // 检查预算预警
  function checkBudgetAlert(spent, limit, percentage) {
    if (!settings.value.budgetAlert) return null

    if (percentage >= 100) {
      addNotification({
        type: 'danger',
        title: '⚠️ 预算已超支',
        message: `本月支出已达 ¥${spent.toFixed(2)}，超过预算 ¥${(spent - limit).toFixed(2)}`
      })
      return { level: 'danger', message: '预算已超支' }
    }

    if (percentage >= 80) {
      addNotification({
        type: 'warning',
        title: '🔔 预算预警',
        message: `本月支出已达预算的 ${percentage.toFixed(0)}%，注意控制消费`
      })
      return { level: 'warning', message: '预算预警' }
    }

    return null
  }

  // 检查存钱目标进度
  function checkSavingGoal(current, goal, percentage) {
    if (!settings.value.savingGoalAlert || goal <= 0) return null

    if (percentage >= 100) {
      addNotification({
        type: 'success',
        title: '🎉 存钱目标达成',
        message: `恭喜！您已存 ¥${current.toFixed(2)}，目标达成！`
      })
      return { level: 'success', message: '目标达成' }
    }

    if (percentage >= 80) {
      addNotification({
        type: 'info',
        title: '💰 存钱进度',
        message: `存钱目标已完成 ${percentage.toFixed(0)}%，继续加油！`
      })
      return { level: 'info', message: '目标即将达成' }
    }

    return null
  }

  // 初始化
  loadSettings()

  return {
    settings,
    notifications,
    unreadCount,
    loadSettings,
    updateSettings,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestPermission,
    checkBudgetAlert,
    checkSavingGoal
  }
})
