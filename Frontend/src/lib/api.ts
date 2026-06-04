// Run: npm install axios
import axios from 'axios'
import { config } from './config'

// Public API instance (for landing page — branches, services)
export const publicApi = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

// Admin API instance (for admin panel — authenticated)
export const adminApi = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every admin request
adminApi.interceptors.request.use((requestConfig: any) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    if (requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }
  }
  return requestConfig
})

// Handle auth errors globally
adminApi.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)
