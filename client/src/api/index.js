import axios from 'axios'
import { ElMessage } from 'element-plus'

// API 基础地址：开发环境用 /api（Vite proxy），生产环境用环境变量
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 文件资源基础地址：用于拼接上传文件的完整 URL
export const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 补全文件 URL（后端返回的 /files/xxx 在生产环境需要拼接域名）
export function resolveFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return FILE_BASE_URL + url
}

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

// 请求拦截器：携带 token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.error || '请求失败'
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      ElMessage.error('登录已过期，请重新登录')
      window.location.hash = '#/home'
    } else {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  }
)

// 用户相关 API
export const authApi = {
  login: data => request.post('/login', data),
  register: data => request.post('/register', data),
  getMe: () => request.get('/me'),
  updateProfile: data => request.put('/profile', data),
  updateNotifications: data => request.put('/notifications', data),
  updatePassword: data => request.put('/password', data)
}

// 积分相关 API
export const creditApi = {
  getBalance: () => request.get('/credits/balance'),
  getLogs: () => request.get('/credits/logs'),
  recharge: data => request.post('/credits/recharge', data)
}

// 模型相关 API
export const modelApi = {
  getModels: () => request.get('/models')
}

// 任务相关 API
export const taskApi = {
  create: data => request.post('/tasks', data),
  list: params => request.get('/tasks', { params }),
  get: id => request.get(`/tasks/${id}`)
}

// 作品相关 API
export const workApi = {
  list: params => request.get('/works', { params }),
  mine: () => request.get('/works/mine'),
  create: data => request.post('/works', data)
}

// API Key 相关
export const apiKeyApi = {
  list: () => request.get('/api-keys'),
  create: data => request.post('/api-keys', data),
  disable: id => request.put(`/api-keys/${id}/disable`),
  remove: id => request.delete(`/api-keys/${id}`)
}

// 上传
export const uploadApi = {
  upload: file => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default request
