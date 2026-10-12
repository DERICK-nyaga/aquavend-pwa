<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'Order', path: '/customer/products', icon: 'order' },
  { label: 'Orders', path: '/customer/orders', icon: 'orders' },
  { label: 'Wallet', path: '/customer/wallet', icon: 'wallet' },
  { label: 'Profile', path: '/customer/profile', icon: 'profile' },
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.path"
      type="button"
      :class="['nav-tab', { active: isActive(tab.path) }]"
      @click="router.push(tab.path)"
    >
      <svg v-if="tab.icon === 'order'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C12 2 5 11.5 5 15.5C5 19.6 8.13 22 12 22C15.87 22 19 19.6 19 15.5C19 11.5 12 2 12 2Z" fill="currentColor"/>
      </svg>
      <svg v-else-if="tab.icon === 'orders'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7h16M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <svg v-else-if="tab.icon === 'wallet'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/>
        <path d="M3 10h18" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/>
        <path d="M4.5 20c1.5-3.5 5-5 7.5-5s6 1.5 7.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
/* Keep --nav-height in sync with the offset used in Products.vue's .summary-bar */
.bottom-nav {
  --nav-height: 4.25rem;
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 440px;
  z-index: 30;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: var(--nav-height);
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-top: 1px solid #dcebef;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #5c7a83;
  padding: 0.3rem 0.6rem;
  border-radius: 10px;
  transition: color 0.15s ease, background 0.15s ease;
}
.nav-tab svg { width: 20px; height: 20px; }
.nav-tab span { font-size: 0.68rem; font-weight: 600; font-family: 'Inter', system-ui, sans-serif; }

.nav-tab.active { color: #06aed5; }

.nav-tab:focus-visible {
  outline: 2px solid #06aed5;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-tab { transition: none; }
}
</style>