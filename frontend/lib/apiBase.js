const DEV_BASE_URL = 'http://localhost:5000'

const envBase = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_API_URL
  : undefined

const rawBase = envBase && envBase.trim().length > 0
  ? envBase.trim()
  : (process.env.NODE_ENV === 'development' ? DEV_BASE_URL : '')

const API_BASE_URL = rawBase ? rawBase.replace(/\/+$/, '') : ''

export const API_BASE = API_BASE_URL

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) return normalizedPath
  return `${API_BASE_URL}${normalizedPath}`
}

export const getBrowserBaseUrl = () => {
  if (API_BASE_URL) return API_BASE_URL
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '')
  }
  return ''
}

export const getSocketBase = () => {
  const browserBase = getBrowserBaseUrl()
  return browserBase || undefined
}

export default API_BASE_URL
