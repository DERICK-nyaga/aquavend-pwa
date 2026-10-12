import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

// After login, store the token and attach it to every request
export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  localStorage.setItem('token', token)
}

// Restore token on app reload
const savedToken = localStorage.getItem('token')
if (savedToken) setAuthToken(savedToken)

export default api