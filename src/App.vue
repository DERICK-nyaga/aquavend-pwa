<script setup lang="ts">
import { onMounted } from 'vue'
import { syncPendingSales } from '@/lib/sales'

onMounted(() => {
  if (navigator.onLine) syncPendingSales()
})
</script>

<template>
  <router-view />
</template>