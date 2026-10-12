<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import customerApi from '@/lib/customerApi'

const notifications = ref<any[]>([])
const unreadCount = ref(0)
const open = ref(false)
let pollHandle: number | undefined

async function fetchNotifications() {
  try {
    const res = await customerApi.get('/notifications')
    notifications.value = res.data.notifications
    unreadCount.value = res.data.unread_count
  } catch (e) {
    // Notifications aren't critical path — fail silently and try again next poll.
  }
}

async function markRead(id: number) {
  await customerApi.post(`/notifications/${id}/read`)
  await fetchNotifications()
}

async function markAllRead() {
  await customerApi.post('/notifications/read-all')
  await fetchNotifications()
}

function toggleDropdown() {
  open.value = !open.value
}

onMounted(() => {
  fetchNotifications()
  pollHandle = window.setInterval(fetchNotifications, 15000)
})

onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle)
})
</script>

<template>
  <div style="position:relative;">
    <button @click="toggleDropdown" style="position:relative; background:none; border:none; cursor:pointer; font-size:1.3rem; line-height:1;">
      🔔
      <span v-if="unreadCount > 0" style="position:absolute; top:-4px; right:-6px; background:#dc2626; color:#fff; border-radius:999px; font-size:0.65rem; padding:1px 5px; font-weight:700;">
        {{ unreadCount }}
      </span>
    </button>

    <div v-if="open" style="position:absolute; right:0; top:2.2rem; width:280px; max-height:340px; overflow-y:auto; background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.12); z-index:50;">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; border-bottom:1px solid #f1f5f9;">
        <strong style="font-size:0.9rem;">Notifications</strong>
        <button @click="markAllRead" style="background:none; border:none; color:#0369a1; font-size:0.75rem; cursor:pointer;">Mark all read</button>
      </div>

      <div v-if="notifications.length === 0" style="padding:1rem; color:#94a3b8; font-size:0.85rem; text-align:center;">
        No notifications yet.
      </div>

      <div
        v-for="n in notifications"
        :key="n.id"
        @click="!n.read_at && markRead(n.id)"
        :style="{
          padding: '0.6rem 0.8rem',
          borderBottom: '1px solid #f8fafc',
          cursor: n.read_at ? 'default' : 'pointer',
          background: n.read_at ? '#fff' : '#f0f9ff'
        }"
      >
        <div style="font-size:0.85rem;">{{ n.message }}</div>
        <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.2rem;">{{ new Date(n.created_at).toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>