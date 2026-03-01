import axios from 'axios'

// ─── Instância base para nosso backend ─────────────────────────────
export const api = axios.create({
    baseURL: '/api',
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
