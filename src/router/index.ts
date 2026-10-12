import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/customer/Login.vue'
import Register from '@/views/customer/Register.vue'
import Products from '@/views/customer/Products.vue'
import Wallet from '@/views/customer/Wallet.vue'
import Profile from '@/views/customer/Profile.vue'
import OrderHistory from '@/views/customer/OrderHistory.vue'
import CheckoutView from '@/views/customer/CheckoutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
  { path: '/', redirect: '/customer/login' },
  { path: '/customer/login', component: Login },
  { path: '/customer/register', component: Register },
  { path: '/customer/products', component: Products },
  { path: '/customer/orders', component: OrderHistory },
  { path: '/customer/wallet', component: Wallet },
  { path: '/customer/profile', component: Profile },
  {path: '/customer/checkout', name: 'Checkout', component: CheckoutView },
  ],
})

export default router