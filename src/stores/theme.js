import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const THEME_KEY = 'ai_accounting_theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  // 初始化主题
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      // 检测系统偏好
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  // 切换主题
  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  // 设置主题
  function setTheme(dark) {
    isDark.value = dark
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    applyTheme()
  }

  // 应用主题到HTML
  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
    setTheme
  }
})
