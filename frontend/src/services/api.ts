import axios from 'axios'

// ─── Instância base para nosso backend ─────────────────────────────
let API_URL = import.meta.env.VITE_API_URL || 'https://appinvestsmart-production.up.railway.app'

// Ensure protocol is present to avoid relative path issues in production
if (API_URL && !API_URL.startsWith('http')) {
    API_URL = `https://${API_URL}`
}

export const api = axios.create({
    baseURL: API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('investsmart_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('investsmart_token')
        }
        return Promise.reject(error)
    }
)

// ─── Instância para BRAPI (via backend proxy) ───────────────────────
export const brapiApi = axios.create({
    baseURL: 'https://brapi.dev/api',
    timeout: 8000,
})

brapiApi.interceptors.request.use((config) => {
    const token = import.meta.env.VITE_BRAPI_TOKEN
    if (token) config.params = { ...(config.params || {}), token }
    return config
})

export default api
