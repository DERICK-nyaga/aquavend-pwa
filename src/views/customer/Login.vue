<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import customerApi, { setCustomerToken } from '@/lib/customerApi'

const router = useRouter()
const phone = ref('')
const otp = ref('')
const step = ref<'phone' | 'otp'>('phone')
const loading = ref(false)
const error = ref('')

async function requestOtp() {
  error.value = ''
  loading.value = true
  try {
    await customerApi.post('/otp/request', { phone: phone.value })
    step.value = 'otp'
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to send code'
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  error.value = ''
  loading.value = true
  try {
    const res = await customerApi.post('/otp/verify', { phone: phone.value, otp: otp.value })
    setCustomerToken(res.data.token)
    router.push('/customer/products')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Invalid code'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width:360px; margin:3rem auto; padding:1.5rem; border:1px solid #e2e8f0; border-radius:10px;">
    <h1 style="font-size:1.3rem; color:#0369a1; margin-bottom:1rem;">Aquavend — Customer Login</h1>

    <p v-if="error" style="color:#dc2626; font-size:0.9rem;">{{ error }}</p>

    <div v-if="step === 'phone'">
      <label>Phone Number</label>
      <input v-model="phone" type="text" placeholder="0712345678" style="width:100%; padding:0.6rem; margin:0.5rem 0 1rem; border:1px solid #cbd5e1; border-radius:6px;" />
      <button @click="requestOtp" :disabled="loading" style="width:100%; padding:0.7rem; background:#0ea5e9; color:#fff; border:none; border-radius:6px;">
        {{ loading ? 'Sending...' : 'Send OTP' }}
      </button>
    </div>

    <div v-else>
      <p style="font-size:0.85rem; color:#64748b; margin-bottom:0.5rem;">
        Code sent to {{ phone }}. Check <code>storage/logs/laravel.log</code> on the backend to see it (SMS not yet connected).
      </p>
      <label>Enter OTP</label>
      <input v-model="otp" type="text" maxlength="6" style="width:100%; padding:0.6rem; margin:0.5rem 0 1rem; border:1px solid #cbd5e1; border-radius:6px;" />
      <button @click="verifyOtp" :disabled="loading" style="width:100%; padding:0.7rem; background:#0ea5e9; color:#fff; border:none; border-radius:6px;">
        {{ loading ? 'Verifying...' : 'Verify & Login' }}
      </button>

      <p style="margin-top:1rem; font-size:0.9rem; text-align:center;">
        New here? <router-link to="/customer/register">Create an account</router-link>
      </p>
    </div>
  </div>
</template>