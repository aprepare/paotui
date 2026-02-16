import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router/index'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器：附加 admin JWT
api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// 响应拦截器：处理 401/403
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      const auth = useAuthStore()
      auth.logout()
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

export default api
