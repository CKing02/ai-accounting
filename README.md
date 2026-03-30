# AI智能记账

AI赋能的智能记账Web应用，支持云端同步、PWA离线使用、移动端App打包。

## 功能特性

- ✅ 记账功能 - 账户管理、收支记录、类目管理
- ✅ 数据可视化 - 仪表盘、消费报告、ECharts图表
- ✅ AI理财管家 - Claude API智能对话、智能记账、消费分析
- ✅ 本地存储 - IndexedDB离线存储
- ✅ 云端同步 - Supabase云端备份（可选）
- ✅ PWA支持 - 可添加到主屏幕、离线使用
- ✅ 移动端App - 通过Capacitor打包iOS/Android应用

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

## 移动端开发

### 前置要求

- iOS: Xcode 14+, CocoaPods
- Android: Android Studio, Gradle 8+

### 构建步骤

```bash
# 1. 构建Web应用
npm run build

# 2. 添加平台
npx cap add ios
# 或
npx cap add android

# 3. 同步Web资源到原生项目
npx cap sync

# 4. 打开原生IDE进行构建
npx cap open ios
# 或
npx cap open android
```

## PWA使用

访问应用后，浏览器会提示"添加到主屏幕"，或通过以下方式手动添加：
- Chrome: 菜单 → 添加到主屏幕
- Safari: 分享按钮 → 添加到主屏幕

## AI功能配置

1. 访问 [Anthropic Console](https://console.anthropic.com/) 注册账号
2. 创建API Key
3. 在应用「设置」页面配置API密钥

## 技术栈

- Vue 3 + Vite
- Element Plus
- Pinia
- ECharts
- Dexie.js (IndexedDB)
- Supabase
- Claude API
- Vite PWA
- Capacitor

## 目录结构

```
ai-accounting/
├── src/
│   ├── components/     # 组件
│   ├── pages/         # 页面
│   ├── stores/        # Pinia状态
│   ├── services/      # 服务层
│   └── router/        # 路由
├── public/            # 静态资源
├── capacitor.config.json  # Capacitor配置
└── vite.config.js     # Vite配置
```

## 许可证

MIT
