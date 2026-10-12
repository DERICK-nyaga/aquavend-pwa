import axios from 'axios'

const customerApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/customer',
})

export function setCustomerToken(token: string) {
  customerApi.defaults.headers.common['Authorization'] = `Bearer ${token}`
  localStorage.setItem('customer_token', token)
}

const saved = localStorage.getItem('customer_token')
if (saved) setCustomerToken(saved)

customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customer_token')
      delete customerApi.defaults.headers.common['Authorization']
 
      if (!window.location.pathname.startsWith('/customer/login')) {
        window.location.href = '/customer/login'
      }
    }
    return Promise.reject(error)
  }
)
 

export default customerApi