<script setup lang="ts">
import { ref, onMounted } from 'vue'
import customerApi from '@/lib/customerApi'
import BottomNav from '@/components/BottomNav.vue'

const orders = ref<any[]>([])
const loading = ref(false)

async function loadOrders() {
  loading.value = true
  const res = await customerApi.get('/orders')
  orders.value = res.data.data
  loading.value = false
}

async function cancelOrder(id: number) {
  if (!confirm('Cancel this order?')) return
  await customerApi.post(`/orders/${id}/cancel`)
  await loadOrders()
}

function statusClass(status: string) {
  if (status === 'completed') return 'status-completed'
  if (status === 'pending') return 'status-pending'
  return 'status-other'
}

onMounted(loadOrders)
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
        <button class="icon-btn" @click="loadOrders" aria-label="Refresh orders">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4v5h5M20 20v-5h-5M4.5 9a8 8 0 0114.5-3.5M19.5 15a8 8 0 01-14.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </header>

      <main class="content">
        <h1 class="page-title">My orders</h1>

        <div v-if="loading" class="state-message">Loading orders…</div>

        <div v-else class="order-list">
          <div v-for="o in orders" :key="o.id" class="order-card">
            <div class="order-top">
              <strong class="order-id">Order #{{ o.id }}</strong>
              <span :class="['status-pill', statusClass(o.status)]">{{ o.status }}</span>
            </div>
            <div class="order-meta">
              {{ o.station?.name }} · KES {{ o.total_amount }} · {{ o.payment_method }}
            </div>
            <button v-if="o.status === 'pending'" class="btn-cancel" @click="cancelOrder(o.id)">
              Cancel order
            </button>
          </div>

          <div v-if="!orders.length" class="state-message">
            No orders yet — place your first order to see it here.
          </div>
        </div>
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
  --mint: #0aa878;
  --sun: #f4a300;

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
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.25rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 0.5rem; }
.brand-mark { width: 22px; height: 22px; color: var(--wave); }
.brand-name { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.05rem; color: var(--ocean); }

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ocean);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}
.icon-btn:hover { background: var(--mist); }
.icon-btn svg { width: 18px; height: 18px; }

.content { flex: 1; padding: 1.25rem; padding-bottom: 6rem; }

.page-title {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  color: var(--ocean);
  margin: 0.25rem 0 1.25rem;
}

.state-message {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}

.order-list { display: flex; flex-direction: column; gap: 0.85rem; }

.order-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  background: var(--surface);
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-id { font-size: 0.95rem; font-weight: 600; }

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  text-transform: capitalize;
}
.status-completed { background: #e8f9f3; color: var(--mint); }
.status-pending { background: #fff6e5; color: var(--sun); }
.status-other { background: #fdecee; color: var(--coral); }

.order-meta {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 0.4rem;
}

.btn-cancel {
  margin-top: 0.75rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: 1.5px solid var(--coral);
  background: transparent;
  color: var(--coral);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.btn-cancel:hover { background: var(--coral); color: #fff; }

@media (prefers-reduced-motion: reduce) {
  .icon-btn, .btn-cancel { transition: none !important; }
}
</style>