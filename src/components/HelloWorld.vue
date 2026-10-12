<script setup lang="ts">
// import { ref } from 'vue'
// import heroImg from '../assets/hero.png'
// import viteLogo from '../assets/vite.svg'
// import vueLogo from '../assets/vue.svg'
import { onMounted } from 'vue'
import { syncPendingSales } from '@/lib/sales'


// const count = ref(0)
onMounted(() => {
  if (navigator.onLine) syncPendingSales()
})
</script>
<template>
  <router-view />
</template>
