/**
 * 云端同步服务 - Supabase
 * 用于用户注册登录和数据云端同步
 */

import { createClient } from '@supabase/supabase-js'

// Supabase配置
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

let supabase = null
let currentUser = null

// 初始化Supabase客户端
export function initSupabase(url, anonKey) {
  if (!url || !anonKey) {
    console.warn('Supabase URL or Anon Key not provided')
    return null
  }
  supabase = createClient(url, anonKey)
  return supabase
}

// 获取客户端
export function getSupabase() {
  return supabase
}

// 获取当前用户
export async function getCurrentUser() {
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  currentUser = user
  return user
}

// 登录
export async function signIn(email, password) {
  if (!supabase) {
    throw new Error('Supabase未初始化')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new Error(error.message)
  }

  currentUser = data.user
  return data.user
}

// 注册
export async function signUp(email, password) {
  if (!supabase) {
    throw new Error('Supabase未初始化')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    throw new Error(error.message)
  }

  return data.user
}

// 登出
export async function signOut() {
  if (!supabase) return

  await supabase.auth.signOut()
  currentUser = null
}

// 同步数据到云端
export async function syncToCloud(localData) {
  if (!supabase || !currentUser) {
    throw new Error('请先登录')
  }

  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: currentUser.id,
      data: localData,
      updated_at: new Date().toISOString()
    })

  if (error) {
    throw new Error(error.message)
  }
}

// 从云端获取数据
export async function fetchFromCloud() {
  if (!supabase || !currentUser) {
    throw new Error('请先登录')
  }

  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', currentUser.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message)
  }

  return data?.data || null
}

// 监听认证状态变化
export function onAuthStateChange(callback) {
  if (!supabase) return () => {}

  return supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null
    callback(event, session)
  })
}

// 配置管理
const CONFIG_KEY = 'supabase_config'

export function saveSupabaseConfig(url, anonKey) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, anonKey }))
}

export function getSupabaseConfig() {
  const config = localStorage.getItem(CONFIG_KEY)
  return config ? JSON.parse(config) : null
}

// 初始化
export async function initCloudService() {
  const config = getSupabaseConfig()
  if (config?.url && config?.anonKey) {
    initSupabase(config.url, config.anonKey)
    await getCurrentUser()
  }
  return currentUser
}
