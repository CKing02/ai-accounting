<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <el-icon size="24"><Coin /></el-icon>
        <span v-show="!isCollapse">AI记账</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        class="sidebar-menu"
        :background-color="sidebarBg"
        :text-color="sidebarText"
        :active-text-color="sidebarActiveText"
      >
        <el-menu-item index="/home">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><List /></el-icon>
          <template #title>记账</template>
        </el-menu-item>
        <el-menu-item index="/accounts">
          <el-icon><Wallet /></el-icon>
          <template #title>账户</template>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>报告</template>
        </el-menu-item>
        <el-menu-item index="/budget">
          <el-icon><WalletFilled /></el-icon>
          <template #title>预算</template>
        </el-menu-item>
        <el-menu-item index="/ai">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>AI管家</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon size="20" @click="isCollapse = !isCollapse" class="collapse-btn">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <span class="date">{{ currentDate }}</span>
          <el-tooltip :content="themeStore.isDark ? '切换亮色模式' : '切换深色模式'" placement="bottom">
            <el-button text circle @click="themeStore.toggleTheme" class="theme-btn">
              <el-icon size="20">
                <Moon v-if="!themeStore.isDark" />
                <Sunny v-else />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { Sunny, Moon } from '@element-plus/icons-vue'

const route = useRoute()
const themeStore = useThemeStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 侧边栏颜色
const sidebarBg = computed(() => themeStore.isDark ? '#1a1a2e' : 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)')
const sidebarText = computed(() => 'rgba(255, 255, 255, 0.7)')
const sidebarActiveText = computed(() => '#fff')

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  background: transparent !important;
}

.sidebar-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  background: var(--header-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.collapse-btn {
  cursor: pointer;
  color: var(--text-color);
}

.collapse-btn:hover {
  color: #667eea;
}

.date {
  color: var(--text-color);
  font-size: 14px;
  margin-right: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.theme-btn {
  color: var(--text-color);
}

.theme-btn:hover {
  color: #667eea;
}

.main-content {
  background: var(--bg-color);
  padding: 20px;
}
</style>
