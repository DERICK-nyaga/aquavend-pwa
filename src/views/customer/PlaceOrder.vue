<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import customerApi from '@/lib/customerApi'
import NotificationBell from '@/components/NotificationBell.vue'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const products = ref<any[]>([])
const stations = ref<any[]>([])
const cart = ref<{ product_id: number; quantity: number; name: string; price: number }[]>([])
const stationId = ref<number | null>(null)
const paymentMethod = ref<'cash' | 'wallet'>('cash')
const placing = ref(false)
const loading = ref(true)
const error = ref('')
const success = ref<any>(null)
const shortfalls = ref<any[]>([])

// Quote & Loyalty Toast
const quote = ref<any>(null)
const quoting = ref(false)
const toastMessage = ref('')

// Delivery location
const deliveryNote = ref('')
const locationError = ref('')
const capturingLocation = ref(false)

async function refreshQuote() {
  if (cart.value.length === 0) {
    quote.value = null
    return
  }

  quoting.value = true
  try {
    const res = await customerApi.post('/cart/quote', {
      items: cart.value.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
    })
    quote.value = res.data
  } catch {
    quote.value = null
  } finally {
    quoting.value = false
  }
}

// Live-update quote whenever cart changes
watch(cart, refreshQuote, { deep: true })

onMounted(async () => {
  try {
    const [productsRes, stationsRes] = await Promise.all([
      customerApi.get('/products'),
      customerApi.get('/stations'),
    ])
    products.value = productsRes.data.data
    stations.value = stationsRes.data.data
    if (stations.value.length) stationId.value = stations.value[0].id
  } finally {
    loading.value = false
  }
})

function qtyInCart(productId: number) {
  return cart.value.find(i => i.product_id === productId)?.quantity ?? 0
}

function totalItems() {
  return cart.value.reduce((sum, i) => sum + i.quantity, 0)
}

function addToCart(product: any) {
  const existing = cart.value.find(i => i.product_id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product_id: product.id, quantity: 1, name: product.display_name, price: product.price })
  }
}

function increaseQty(productId: number) {
  const item = cart.value.find(i => i.product_id === productId)
  if (item) item.quantity++
}

function decreaseQty(productId: number) {
  const item = cart.value.find(i => i.product_id === productId)
  if (!item) return

  if (item.quantity <= 1) {
    removeFromCart(productId)
  } else {
    item.quantity--
  }
}

function removeFromCart(productId: number) {
  cart.value = cart.value.filter(i => i.product_id !== productId)
}

const total = () => {
  if (quote.value?.final_total !== undefined) {
    return quote.value.final_total
  }
  return cart.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

function getLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      locationError.value = 'Location not supported on this device — order will be placed without it.'
      resolve(null)
      return
    }
    capturingLocation.value = true
    navigator.geolocation.getCurrentPosition(
      (position) => {
        capturingLocation.value = false
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
      (err) => {
        capturingLocation.value = false
        locationError.value = err.code === err.PERMISSION_DENIED
          ? 'Location permission denied — order will be placed without delivery coordinates.'
          : 'Could not get your location — order will be placed without it.'
        resolve(null)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  })
}

function showLoyaltyToast(message: string) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, 4000)
}

async function sendLocalNotification(discountAmount: number) {
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready
    registration.showNotification('Discount Applied!', {
      body: `Order placed! KES ${discountAmount} loyalty discount was applied.`,
      icon: '/pwa-192x192.png',
    })
  }
}

async function placeOrder() {
  error.value = ''
  success.value = null
  shortfalls.value = []
  locationError.value = ''

  if (!stationId.value || cart.value.length === 0) {
    error.value = 'Select a station and add at least one item.'
    return
  }

  placing.value = true
  const location = await getLocation()

  try {
    const res = await customerApi.post('/orders', {
      station_id: stationId.value,
      payment_method: paymentMethod.value,
      items: cart.value.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      delivery_latitude: location?.lat ?? null,
      delivery_longitude: location?.lng ?? null,
      delivery_address_note: deliveryNote.value || null,
    })

    success.value = res.data
    cart.value = []
    quote.value = null

    if (res.data.discount_amount > 0) {
      showLoyaltyToast(`🎉 You saved KES ${res.data.discount_amount} on this order!`)
      await sendLocalNotification(res.data.discount_amount)
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Order failed'
    shortfalls.value = e.response?.data?.shortfalls || []
  } finally {
    placing.value = false
  }
}

function adjustToMax(productId: number, maxAvailable: number) {
  const item = cart.value.find(i => i.product_id === productId)
  if (!item) return
  if (maxAvailable <= 0) {
    cart.value = cart.value.filter(i => i.product_id !== productId)
  } else {
    item.quantity = maxAvailable
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
        <div class="topbar-actions">
          <NotificationBell />
          <button class="icon-btn" @click="router.push('/customer/orders')" aria-label="My orders">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7h16M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="content">
        <h1 class="page-title">What would you like today?</h1>

        <div class="control station-control">
          <label for="station">Pickup station</label>
          <div class="select-wrap">
            <select id="station" v-model="stationId">
              <option v-for="s in stations" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <svg class="select-caret" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <div v-if="loading" class="state-message">Loading products…</div>
        <div v-else-if="!products.length" class="state-message">No products available right now.</div>

        <div v-else class="product-list">
          <div v-for="p in products" :key="p.id" class="product-row">
            <div class="product-info">
              <span class="product-name">{{ p.display_name }}</span>
              <span class="product-price">KES {{ p.price }}</span>
            </div>

            <button v-if="qtyInCart(p.id) === 0" class="btn-add" @click="addToCart(p)">
              Add
            </button>
            <div v-else class="stepper">
              <button class="stepper-btn" @click="decreaseQty(p.id)" aria-label="Remove one">−</button>
              <span class="stepper-qty">{{ qtyInCart(p.id) }}</span>
              <button class="stepper-btn" @click="increaseQty(p.id)" aria-label="Add one">+</button>
            </div>
          </div>
        </div>

        <div class="control payment-control">
          <label>Payment method</label>
          <div class="segmented">
            <button
              type="button"
              :class="['segment', { active: paymentMethod === 'cash' }]"
              @click="paymentMethod = 'cash'"
            >
              Cash on pickup
            </button>
            <button
              type="button"
              :class="['segment', { active: paymentMethod === 'wallet' }]"
              @click="paymentMethod = 'wallet'"
            >
              Wallet
            </button>
          </div>
        </div>

        <div class="control delivery-control">
          <label for="delivery-note">Delivery note (optional)</label>
          <input
            id="delivery-note"
            v-model="deliveryNote"
            type="text"
            class="text-input"
            placeholder="e.g. Blue gate, 2nd floor"
          />
          <p v-if="capturingLocation" class="hint hint-muted">📍 Getting your location…</p>
          <p v-if="locationError" class="hint hint-warning">{{ locationError }}</p>
        </div>

        <Transition name="rise">
          <p v-if="error" class="alert alert-error">{{ error }}</p>
        </Transition>

        <Transition name="rise">
          <div v-if="shortfalls.length" class="alert alert-warning">
            <p class="alert-title">We can adjust your order</p>
            <div v-for="s in shortfalls" :key="s.product_id" class="shortfall-row">
              <span>{{ s.product_name }} — max available: {{ s.max_available }}</span>
              <button class="btn-small" @click="adjustToMax(s.product_id, s.max_available)">
                {{ s.max_available > 0 ? `Set to ${s.max_available}` : 'Remove' }}
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="rise">
          <div v-if="success" class="alert alert-success">
            <p class="alert-title">Order #{{ success.id }} placed — {{ success.status }}</p>
            <p class="alert-sub">We'll notify you the moment it's confirmed.</p>
          </div>
        </Transition>

        <div class="spacer"></div>
      </main>

      <Transition name="rise">
        <div v-if="toastMessage" class="toast-loyalty">
          {{ toastMessage }}
        </div>
      </Transition>

      <div v-if="cart.length" class="summary-bar">
        <div class="summary-info">
          <span class="summary-count">{{ totalItems() }} item{{ totalItems() === 1 ? '' : 's' }}</span>
          <div class="total-group">
            <span class="summary-total">KES {{ total() }}</span>
            <span v-if="quote?.discount_amount > 0" class="summary-discount">
              (-KES {{ quote.discount_amount }} discount)
            </span>
          </div>
        </div>
        <button class="btn-primary" :disabled="placing || quoting" @click="placeOrder">
          {{ placing ? (capturingLocation ? 'Getting location…' : 'Placing order…') : 'Place order' }}
        </button>
      </div>

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
  --amber-bg: #fff6e5;
  --amber-border: #f6dfa8;
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
  position: relative;
  box-shadow: 0 0 40px rgba(11, 79, 108, 0.06);
}

@media (min-width: 480px) {
  .frame { box-shadow: 0 0 60px rgba(11, 79, 108, 0.12); }
}

/* Header */
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
.brand-name {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--ocean);
}

.topbar-actions { display: flex; align-items: center; gap: 0.5rem; }
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

/* Content */
.content {
  flex: 1;
  padding: 1.25rem;
  padding-bottom: 9rem;
}

.page-title {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  line-height: 1.25;
  color: var(--ocean);
  margin: 0.25rem 0 1.25rem;
}

.control { margin-bottom: 1.25rem; }
.control label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 0.4rem;
}

.select-wrap { position: relative; }
.select-wrap select {
  width: 100%;
  appearance: none;
  padding: 0.7rem 2.4rem 0.7rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--mist);
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--ink);
  cursor: pointer;
}
.select-caret {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--muted);
  pointer-events: none;
}

.state-message {
  padding: 1.5rem 0;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}

/* Product list */
.product-list { margin-bottom: 1.5rem; }
.product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border);
}
.product-info { display: flex; flex-direction: column; gap: 0.15rem; }
.product-name { font-size: 0.95rem; font-weight: 500; }
.product-price { font-size: 0.85rem; color: var(--sun); font-weight: 600; }

.btn-add {
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1.5px solid var(--wave);
  background: transparent;
  color: var(--wave-dark);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.btn-add:hover { background: var(--wave); color: #fff; }

.stepper {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--mist);
  border-radius: 999px;
  padding: 0.3rem 0.5rem;
}
.stepper-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: var(--surface);
  color: var(--ocean);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(11, 79, 108, 0.15);
  transition: transform 0.1s ease;
}
.stepper-btn:active { transform: scale(0.9); }
.stepper-qty { min-width: 16px; text-align: center; font-weight: 600; font-size: 0.9rem; }

/* Payment */
.segmented {
  display: flex;
  background: var(--mist);
  border-radius: 10px;
  padding: 0.25rem;
  gap: 0.25rem;
}
.segment {
  flex: 1;
  padding: 0.55rem 0.5rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.segment.active {
  background: var(--surface);
  color: var(--ocean);
  box-shadow: 0 1px 3px rgba(11, 79, 108, 0.12);
}

/* Delivery note */
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
.text-input::placeholder { color: var(--muted); }
.hint {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
}
.hint-muted { color: var(--muted); }
.hint-warning { color: var(--sun); }

/* Toast Notification */
.toast-loyalty {
  position: fixed;
  bottom: 8.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  background: var(--mint);
  color: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 4px 14px rgba(10, 168, 120, 0.35);
  white-space: nowrap;
}

/* Alerts */
.alert {
  border-radius: 10px;
  padding: 0.8rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.alert-title { font-weight: 600; margin: 0 0 0.3rem; }
.alert-sub { margin: 0; color: var(--muted); }
.alert-error { background: var(--coral-bg); color: var(--coral); }
.alert-warning { background: var(--amber-bg); border: 1px solid var(--amber-border); color: var(--ink); }
.alert-success { background: var(--mint-bg); color: var(--mint); }

.shortfall-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;
  color: var(--ink);
}
.btn-small {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: none;
  background: var(--wave);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.spacer { height: 1rem; }

/* Sticky summary / CTA */
.summary-bar {
  position: fixed;
  left: 50%;
  bottom: 4.25rem;
  transform: translateX(-50%);
  width: 100%;
  max-width: 440px;
  z-index: 25;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
}
.summary-info { display: flex; flex-direction: column; }
.summary-count { font-size: 0.75rem; color: var(--muted); }
.total-group { display: flex; flex-direction: column; }
.summary-total { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.1rem; color: var(--ocean); }
.summary-discount { font-size: 0.75rem; color: var(--mint); font-weight: 600; }

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

/* Motion */
.rise-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.rise-enter-from { opacity: 0; transform: translateY(6px); }

@media (prefers-reduced-motion: reduce) {
  .rise-enter-active, .stepper-btn, .btn-add, .icon-btn, .segment, .btn-primary {
    transition: none !important;
  }
}

/* Focus visibility */
button:focus-visible, select:focus-visible, input:focus-visible {
  outline: 2px solid var(--wave);
  outline-offset: 2px;
}
</style>