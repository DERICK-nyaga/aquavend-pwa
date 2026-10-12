<script setup lang="ts">
import { ref, onMounted } from 'vue'
import customerApi from '@/lib/customerApi'
import BottomNav from '@/components/BottomNav.vue'

const balance = ref<number | null>(null)
const amount = ref<number | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const success = ref('')

const quickAmounts = [100, 500, 1000]

onMounted(async () => {
  try {
    const res = await customerApi.get('/me')
    balance.value = res.data.wallet_balance
  } finally {
    loading.value = false
  }
})

function pickAmount(value: number) {
  amount.value = value
}

async function topUp() {
  error.value = ''
  success.value = ''

  if (!amount.value || amount.value <= 0) {
    error.value = 'Enter an amount greater than zero.'
    return
  }

  submitting.value = true
  try {
    const res = await customerApi.post('/wallet/top-up', { amount: amount.value })
    balance.value = res.data.wallet_balance
    success.value = res.data.message || 'Wallet topped up.'
    amount.value = null
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Top-up failed'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="frame">
      <header class="topbar">
        <div class="brand">
          <svg class="brand-mark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 5 11.5 5 15.5C5 19.6 8.13 22 12 22C15.87 22 19 19.6 19 15.5C19 11.5 12 2 12 2Z" fill="currentColor"/>
          </svg>
          <span class="brand-name">Aquavend</span>
        </div>
      </header>

      <main class="content">
        <h1 class="page-title">Wallet</h1>

        <div class="balance-card">
          <span class="balance-label">Current balance</span>
          <span class="balance-value">
            <template v-if="loading">…</template>
            <template v-else>KES {{ balance }}</template>
          </span>
        </div>

        <div class="control">
          <label for="amount">Top up amount</label>
          <div class="quick-amounts">
            <button
              v-for="q in quickAmounts"
              :key="q"
              type="button"
              :class="['chip', { active: amount === q }]"
              @click="pickAmount(q)"
            >
              KES {{ q }}
            </button>
          </div>
          <input
            id="amount"
            v-model.number="amount"
            type="number"
            min="1"
            step="1"
            placeholder="Or enter a custom amount"
            class="text-input"
          />
        </div>

        <Transition name="rise">
          <p v-if="error" class="alert alert-error">{{ error }}</p>
        </Transition>
        <Transition name="rise">
          <p v-if="success" class="alert alert-success">{{ success }}</p>
        </Transition>

        <button class="btn-primary btn-block" :disabled="submitting" @click="topUp">
          {{ submitting ? 'Topping up…' : 'Top up wallet' }}
        </button>
      </main>

      <BottomNav />
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500;600&display=swap');

.page {
  --ink: #0b2b33;
  --muted: #5c7a83;
  --ocean: #0b4f6c;
  --wave: #06aed5;
  --wave-dark: #058dae;
  --sun: #f4a300;
  --mist: #eff7f9;
  --surface: #ffffff;
  --border: #dcebef;
  --coral: #e63946;
  --coral-bg: #fdecee;
  --mint: #0aa878;
  --mint-bg: #e8f9f3;

  min-height: 100vh;
  min-height: 100dvh;
  background: var(--mist);
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
  display: flex;
  justify-content: center;
}

.frame {
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(11, 79, 108, 0.06);
}

@media (min-width: 480px) {
  .frame { box-shadow: 0 0 60px rgba(11, 79, 108, 0.12); }
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  padding: 0.9rem 1.25rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 0.5rem; }
.brand-mark { width: 22px; height: 22px; color: var(--wave); }
.brand-name { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.05rem; color: var(--ocean); }

.content { flex: 1; padding: 1.25rem; padding-bottom: 6rem; }

.page-title {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  color: var(--ocean);
  margin: 0.25rem 0 1.25rem;
}

.balance-card {
  background: linear-gradient(135deg, var(--ocean), var(--wave));
  color: #fff;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1.5rem;
}
.balance-label { font-size: 0.8rem; opacity: 0.85; }
.balance-value { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.7rem; }

.control { margin-bottom: 1.25rem; }
.control label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.quick-amounts { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.chip {
  flex: 1;
  padding: 0.55rem 0;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--mist);
  color: var(--ocean);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.chip.active { border-color: var(--wave); background: #e3f7fb; }

.text-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--mist);
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--ink);
}
.text-input:focus-visible { outline: 2px solid var(--wave); outline-offset: 2px; }

.alert { border-radius: 10px; padding: 0.8rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
.alert-error { background: var(--coral-bg); color: var(--coral); }
.alert-success { background: var(--mint-bg); color: var(--mint); }

.btn-primary {
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  border: none;
  background: var(--wave);
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-primary:hover:not(:disabled) { background: var(--wave-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-block { width: 100%; }

.rise-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.rise-enter-from { opacity: 0; transform: translateY(6px); }

@media (prefers-reduced-motion: reduce) {
  .rise-enter-active, .chip, .btn-primary { transition: none !important; }
}
</style>