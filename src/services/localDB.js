import Dexie from 'dexie'

// 创建本地数据库
const db = new Dexie('AiAccountingDB')

// 定义数据库结构
db.version(1).stores({
  // 账户表
  accounts: '++id, name, type, balance, color, icon, createdAt, updatedAt',
  // 记录表（收支记录）
  records: '++id, accountId, type, amount, category, subCategory, description, date, createdAt, updatedAt',
  // 类目表
  categories: '++id, name, type, icon, color, parentId, createdAt',
  // AI对话记录表
  aiConversations: '++id, role, content, createdAt'
})

// 初始化默认类目
async function initDefaultCategories() {
  const count = await db.categories.count()
  if (count === 0) {
    // 支出类目
    const expenseCategories = [
      { name: '餐饮', type: 'expense', icon: 'Food', color: '#FF6B6B' },
      { name: '购物', type: 'expense', icon: 'Shopping', color: '#4ECDC4' },
      { name: '交通', type: 'expense', icon: 'Vehicle', color: '#45B7D1' },
      { name: '居住', type: 'expense', icon: 'House', color: '#96CEB4' },
      { name: '医疗', type: 'expense', icon: 'Medical', color: '#FFEAA7' },
      { name: '娱乐', type: 'expense', icon: 'Film', color: '#DDA0DD' },
      { name: '教育', type: 'expense', icon: 'Reading', color: '#98D8C8' },
      { name: '通讯', type: 'expense', icon: 'Phone', color: '#F7DC6F' },
      { name: '其他', type: 'expense', icon: 'More', color: '#BDC3C7' }
    ]
    // 收入类目
    const incomeCategories = [
      { name: '工资', type: 'income', icon: 'Money', color: '#27AE60' },
      { name: '奖金', type: 'income', icon: 'Tickets', color: '#2ECC71' },
      { name: '投资', type: 'income', icon: 'TrendCharts', color: '#3498DB' },
      { name: '副业', type: 'income', icon: 'Briefcase', color: '#9B59B6' },
      { name: '其他', type: 'income', icon: 'More', color: '#1ABC9C' }
    ]
    await db.categories.bulkAdd([...expenseCategories, ...incomeCategories])
  }
}

// 初始化默认账户
async function initDefaultAccount() {
  const count = await db.accounts.count()
  if (count === 0) {
    await db.accounts.add({
      name: '现金',
      type: 'cash',
      balance: 0,
      color: '#3498DB',
      icon: 'Money',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}

// 初始化数据库
export async function initDB() {
  await initDefaultCategories()
  await initDefaultAccount()
  return db
}

export { db }
