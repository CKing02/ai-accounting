/**
 * AI服务 - Claude API集成
 * 用于智能记账、消费分析、理财建议等功能
 */

import { db } from './localDB'

// Claude API配置
const API_CONFIG = {
  url: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1024
}

// API密钥管理
let apiKey = localStorage.getItem('claude_api_key') || ''

export function setApiKey(key) {
  apiKey = key
  localStorage.setItem('claude_api_key', key)
}

export function getApiKey() {
  return apiKey
}

export function hasApiKey() {
  return !!apiKey
}

// 导出获取财务上下文（供其他组件使用）
export { getFinancialContext }

// 构建系统提示词
function buildSystemPrompt() {
  return `你是用户的AI智能理财管家，名字叫"小财"。

你的职责：
1. 智能记账：用户说"花了XX元"或"收到XX元"时，自动识别为记账请求
2. 消费分析：分析用户的消费习惯，给出优化建议
3. 理财规划：帮用户制定存钱、投资计划
4. 解答疑问：回答用户关于理财的问题

记账格式识别：
- "花了100块买衣服" -> { type: "expense", amount: 100, category: "购物" }
- "今天买菜花了50" -> { type: "expense", amount: 50, category: "餐饮" }
- "收到工资5000" -> { type: "income", amount: 5000, category: "工资" }

你的回复要：
- 亲切友好，像朋友聊天
- 简洁明了，不要太长
- 多用emoji增加趣味性
- 适当给用户鼓励和建议

当前用户数据上下文：
- 本月收入：可以通过records统计获取
- 本月支出：可以通过records统计获取
- 账户余额：可以通过accounts获取`
}

// 获取用户财务上下文
async function getFinancialContext() {
  const accounts = await db.accounts.toArray()
  const records = await db.records.toArray()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const monthRecords = records.filter(r => r.date >= startOfMonth)
  const monthlyIncome = monthRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)
  const monthlyExpense = monthRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  // 按类目统计支出
  const expenseByCategory = {}
  monthRecords
    .filter(r => r.type === 'expense')
    .forEach(r => {
      expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount
    })

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance: monthlyIncome - monthlyExpense,
    expenseByCategory,
    totalAccounts: accounts.length
  }
}

// 解析用户消息中的记账意图
function parseRecordIntent(message) {
  const text = message.trim()

  // 支出匹配
  const expensePatterns = [
    /花了?(\d+(?:\.\d+)?)/i,
    /消费?(\d+(?:\.\d+)?)/i,
    /买[\u4e00-\u9fa5]+花了?(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)块/,
    /(\d+(?:\.\d+)?)元/
  ]

  for (const pattern of expensePatterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1])
      // 尝试识别类目
      let category = '其他'
      if (text.includes('吃') || text.includes('餐') || text.includes('外卖') || text.includes('菜')) {
        category = '餐饮'
      } else if (text.includes('衣') || text.includes('服') || text.includes('裤') || text.includes('鞋')) {
        category = '购物'
      } else if (text.includes('交通') || text.includes('车') || text.includes('地铁') || text.includes('公交')) {
        category = '交通'
      } else if (text.includes('住') || text.includes('房') || text.includes('租')) {
        category = '居住'
      } else if (text.includes('娱') || text.includes('乐') || text.includes('电影') || text.includes('游戏')) {
        category = '娱乐'
      } else if (text.includes('医') || text.includes('药')) {
        category = '医疗'
      } else if (text.includes('学') || text.includes('教育') || text.includes('书')) {
        category = '教育'
      } else if (text.includes('话') || text.includes('手机') || text.includes('网')) {
        category = '通讯'
      }

      return { type: 'expense', amount, category }
    }
  }

  // 收入匹配
  const incomePatterns = [
    /收到?(\d+(?:\.\d+)?)/i,
    /赚了?(\d+(?:\.\d+)?)/i,
    /收入?(\d+(?:\.\d+)?)/i,
    /工资(\d+(?:\.\d+)?)/i
  ]

  for (const pattern of incomePatterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1])
      let category = '其他'
      if (text.includes('工资')) category = '工资'
      else if (text.includes('奖金')) category = '奖金'
      else if (text.includes('投资')) category = '投资'
      else if (text.includes('副业')) category = '副业'

      return { type: 'income', amount, category }
    }
  }

  return null
}

// 发送消息到Claude API
export async function sendMessage(userMessage) {
  if (!apiKey) {
    throw new Error('请先设置API密钥')
  }

  const context = await getFinancialContext()
  const recordIntent = parseRecordIntent(userMessage)

  // 构建提示词
  let userPrompt = userMessage
  if (recordIntent) {
    userPrompt += `\n\n[系统识别：这是一笔${recordIntent.type === 'income' ? '收入' : '支出'}，金额${recordIntent.amount}元，类目${recordIntent.category}]`
  }

  // 添加财务上下文
  userPrompt += `\n\n[用户财务状况：总资产¥${context.totalBalance.toFixed(2)}，本月收入¥${context.monthlyIncome.toFixed(2)}，本月支出¥${context.monthlyExpense.toFixed(2)}，本月结余¥${context.monthlyBalance.toFixed(2)}]`

  const response = await fetch(API_CONFIG.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      max_tokens: API_CONFIG.maxTokens,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'API请求失败')
  }

  const data = await response.json()
  return {
    content: data.content[0].text,
    recordIntent
  }
}

// 生成消费报告解读
export async function generateReportAnalysis() {
  if (!apiKey) {
    throw new Error('请先设置API密钥')
  }

  const context = await getFinancialContext()

  const prompt = `
请分析以下用户月度消费数据，并给出简明扼要的报告：

财务概况：
- 本月收入：¥${context.monthlyIncome.toFixed(2)}
- 本月支出：¥${context.monthlyExpense.toFixed(2)}
- 本月结余：¥${context.monthlyBalance.toFixed(2)}

支出类目分布：
${Object.entries(context.expenseByCategory)
  .map(([cat, amount]) => `- ${cat}：¥${amount.toFixed(2)}`)
  .join('\n')}

请用友好的语气，生成一份200字左右的消费分析报告，包括：
1. 本月消费亮点
2. 需要注意的问题
3. 改进建议
`

  const response = await fetch(API_CONFIG.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      max_tokens: 1024,
      system: '你是一个专业的AI财务顾问，擅长分析消费数据并给出建议。',
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'API请求失败')
  }

  const data = await response.json()
  return data.content[0].text
}

// 生成理财建议
export async function generateFinancialAdvice(goal, targetAmount, timeline) {
  if (!apiKey) {
    throw new Error('请先设置API密钥')
  }

  const context = await getFinancialContext()

  const prompt = `
用户想要制定一个理财计划：
- 目标：${goal}
- 目标金额：¥${targetAmount.toFixed(2)}
- 实现时间：${timeline}

用户当前财务状况：
- 总资产：¥${context.totalBalance.toFixed(2)}
- 本月收入：¥${context.monthlyIncome.toFixed(2)}
- 本月支出：¥${context.monthlyExpense.toFixed(2)}
- 每月可支配收入：¥${(context.monthlyIncome - context.monthlyExpense).toFixed(2)}

请生成一份实用的理财建议计划，包括：
1. 可行性分析
2. 每月需要存多少钱
3. 具体的储蓄建议
4. 可选的投资渠道（简要）
`

  const response = await fetch(API_CONFIG.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      max_tokens: 1024,
      system: '你是一个专业的AI理财顾问，帮助用户制定可行的储蓄和投资计划。',
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'API请求失败')
  }

  const data = await response.json()
  return data.content[0].text
}
