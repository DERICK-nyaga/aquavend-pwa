import Dexie, { type Table } from 'dexie'

export interface PendingSale {
  id?: number
  stationId: number
  customerId?: number
  items: { productId: number; quantity: number; unitPrice: number }[]
  totalAmount: number
  createdAt: string
  synced: boolean
}

class AquavendDB extends Dexie {
  pendingSales!: Table<PendingSale>

  constructor() {
    super('aquavend')
    this.version(1).stores({
      pendingSales: '++id, synced, createdAt'
    })
  }
}

export const db = new AquavendDB()