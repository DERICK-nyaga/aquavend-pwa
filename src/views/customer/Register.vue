<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import customerApi, { setCustomerToken } from '@/lib/customerApi'

const router = useRouter()

const name = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref('')

async function register() {
  error.value = ''
  loading.value = true

  try {
    const res = await customerApi.post('/register', {
      name: name.value,
      phone: phone.value,
      email: email.value || undefined,
      password: password.value || undefined,
      password_confirmation: password.value ? passwordConfirmation.value : undefined,
    })

    setCustomerToken(res.data.token)
    router.push('/customer/products')
  } catch (e: any) {
    const errors = e.response?.data?.errors
    error.value = errors
      ? Object.values(errors).flat().join(' ')
      : e.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width:380px; margin:3rem auto; padding:1.5rem; border:1px solid #e2e8f0; border-radius:10px;">
    <h1 style="font-size:1.3rem; color:#0369a1; margin-bottom:1rem;">Create Your Aquavend Account</h1>

    <p v-if="error" style="color:#dc2626; font-size:0.9rem; margin-bottom:0.75rem;">{{ error }}</p>

    <label>Full Name</label>
    <input v-model="name" type="text" required style="width:100%; padding:0.6rem; margin:0.3rem 0 1rem; border:1px solid #cbd5e1; border-radius:6px;" />

    <label>Phone Number</label>
    <input v-model="phone" type="text" placeholder="0712345678" required style="width:100%; padding:0.6rem; margin:0.3rem 0 1rem; border:1px solid #cbd5e1; border-radius:6px;" />

    <label>Email (optional)</label>
    <input v-model="email" type="email" style="width:100%; padding:0.6rem; margin:0.3rem 0 1rem; border:1px solid #cbd5e1; border-radius:6px;" />

    <label>Password (optional — leave blank to always use OTP login instead)</label>
    <input v-model="password" type="password" style="width:100%; padding:0.6rem; margin:0.3rem 0 1rem; border:1px solid #cbd5e1; border-radius:6px;" />

    <div v-if="password">
      <label>Confirm Password</label>
      <input v-model="passwordConfirmation" type="password" style="width:100%; padding:0.6rem; margin:0.3rem 0 1rem; border:1px solid #cbd5e1; border-radius:6px;" />
    </div>

    <button @click="register" :disabled="loading" style="width:100%; padding:0.7rem; background:#0ea5e9; color:#fff; border:none; border-radius:6px;">
      {{ loading ? 'Creating account...' : 'Register' }}
    </button>

    <p style="margin-top:1rem; font-size:0.9rem; text-align:center;">
      Already have an account? <router-link to="/customer/login">Log in</router-link>
    </p>
  </div>
</template>