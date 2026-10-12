<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import customerApi from '@/lib/customerApi'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const name = ref('')
const phone = ref('')
const notificationsEnabled = ref(true)
const loading = ref(true)
const savingPref = ref(false)
const loggingOut = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const res = await customerApi.get('/me')
    name.value = res.data.name
    phone.value = res.data.phone
    notificationsEnabled.value = !!res.data.notifications_enabled
  } finally {
    loading.value = false
  }
})

async function togglePreference() {
  const next = !notificationsEnabled.value
  savingPref.value = true
  error.value = ''
  try {
    await customerApi.post('/notifications/preference', { enabled: next })
    notificationsEnabled.value = next
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not update preference'
  } finally {
    savingPref.value = false
  }
}

async function logout() {
  loggingOut.value = true
  try {
    await customerApi.post('/logout')
  } catch (e) {
    // Even if the request fails, clear the local session so the user isn't stuck.
  }
  localStorage.removeItem('customer_token')
  delete customerApi.defaults.headers.common['Authorization']
  router.push('/customer/login')
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
        <h1 class="page-title">Profile</h1>

        <div v-if="loading" class="state-message">Loading account…</div>

        <template v-else>
          <div class="info-card">
            <div class="avatar">{{ name.charAt(0).toUpperCase() }}</div>
            <div class="info-text">
              <span class="info-name">{{ name }}</span>
              <span class="info-phone">{{ phone }}</span>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Preferences</h2>
            <div class="pref-row">
              <div class="pref-text">
                <span class="pref-label">Push notifications</span>
                <span class="pref-sub">Restock alerts, order updates</span>
              </div>
              <button
                type="button"
                :class="['toggle', { on: notificationsEnabled }]"
                :disabled="savingPref"
                @click="togglePreference"
                :aria-pressed="notificationsEnabled"
                aria-label="Toggle push notifications"
              >
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>

          <p v-if="error" class="alert alert-error">{{ error }}</p>

          <button class="btn-logout" :disabled="loggingOut" @click="logout">
            {{ loggingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </template>
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
  --mist: #eff7f9;
  --surface: #ffffff;
  --border: #dcebef;
  --coral: #e63946;
  --coral-bg: #fdecee;

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

.state-message { padding: 1.5rem 0; text-align: center; color: var(--muted); font-size: 0.9rem; }

.info-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem;
  background: var(--mist);
  border-radius: 14px;
  margin-bottom: 1.5rem;
}
.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--ocean);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.info-text { display: flex; flex-direction: column; gap: 0.15rem; }
.info-name { font-weight: 600; font-size: 1rem; }
.info-phone { font-size: 0.85rem; color: var(--muted); }

.section { margin-bottom: 1.5rem; }
.section-title { font-size: 0.85rem; font-weight: 600; color: var(--muted); margin: 0 0 0.6rem; }

.pref-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border);
}
.pref-text { display: flex; flex-direction: column; gap: 0.15rem; }
.pref-label { font-size: 0.9rem; font-weight: 500; }
.pref-sub { font-size: 0.78rem; color: var(--muted); }

.toggle {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: none;
  background: var(--border);
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease;
}
.toggle.on { background: var(--wave); }
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}
.toggle.on .toggle-knob { transform: translateX(18px); }
.toggle:focus-visible { outline: 2px solid var(--wave); outline-offset: 2px; }

.alert { border-radius: 10px; padding: 0.8rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
.alert-error { background: var(--coral-bg); color: var(--coral); }

.btn-logout {
  width: 100%;
  padding: 0.8rem;
  border-radius: 10px;
  border: 1.5px solid var(--coral);
  background: transparent;
  color: var(--coral);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.btn-logout:hover:not(:disabled) { background: var(--coral); color: #fff; }
.btn-logout:disabled { opacity: 0.6; cursor: not-allowed; }

@media (prefers-reduced-motion: reduce) {
  .toggle, .toggle-knob, .btn-logout { transition: none !important; }
}
</style>