import { db, type PendingSale } from './db'
import api from './api'

export async function recordSale(sale: Omit<PendingSale, 'id' | 'synced'>) {
  if (navigator.onLine) {
    await api.post('/api/transactions', sale)
  } else {
    await db.pendingSales.add({ ...sale, synced: false })
  }
}

export async function syncPendingSales() {
  const unsynced = await db.pendingSales.where('synced').equals(0).toArray()
  for (const sale of unsynced) {
    try {
      await api.post('/api/transactions', sale)
      await db.pendingSales.update(sale.id!, { synced: true })
    } catch (e) {
      console.warn('Sync failed, will retry', e)
    }
  }
}

window.addEventListener('online', syncPendingSales)