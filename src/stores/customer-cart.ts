'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/lib/types'

interface CustomerCartState {
  items: CartItem[]
  restaurantId: string | null
  tableId: string | null

  setScope: (restaurantId: string, tableId: string) => void
  addItem: (item: CartItem) => void
  removeItem: (lineKey: string) => void
  updateQuantity: (lineKey: string, qty: number) => void
  clear: () => void
  setItems: (items: CartItem[]) => void

  totals: (taxRate: number, serviceChargeRate: number) => {
    subtotal: number
    taxAmount: number
    serviceCharge: number
    grandTotal: number
    itemCount: number
  }
}

// Each cart item is uniquely identified by menuItemId + variantId + sorted modifierIds + notes
export function lineKeyOf(item: {
  menuItemId: string
  variantId?: string
  modifierIds: string[]
  notes?: string
}): string {
  const modKey = [...(item.modifierIds || [])].sort().join('|')
  return `${item.menuItemId}::${item.variantId || ''}::${modKey}::${item.notes || ''}`
}

export const useCustomerCart = create<CustomerCartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      tableId: null,

      setScope: (restaurantId, tableId) => {
        const s = get()
        if (s.restaurantId !== restaurantId || s.tableId !== tableId) {
          set({ restaurantId, tableId, items: [] })
        }
      },

      addItem: (item) => {
        const key = lineKeyOf(item)
        const existing = get().items.find((i) => lineKeyOf(i) === key)
        if (existing) {
          set({
            items: get().items.map((i) =>
              lineKeyOf(i) === key
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          })
        } else {
          set({ items: [...get().items, item] })
        }
      },

      removeItem: (lineKey) =>
        set({ items: get().items.filter((i) => lineKeyOf(i) !== lineKey) }),

      updateQuantity: (lineKey, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => lineKeyOf(i) !== lineKey) })
          return
        }
        set({
          items: get().items.map((i) =>
            lineKeyOf(i) === lineKey ? { ...i, quantity: qty } : i,
          ),
        })
      },

      clear: () => set({ items: [] }),
      setItems: (items) => set({ items }),

      totals: (taxRate, serviceChargeRate) => {
        const items = get().items
        const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
        const taxAmount = +(subtotal * taxRate).toFixed(2)
        const serviceCharge = +(subtotal * serviceChargeRate).toFixed(2)
        const grandTotal = +(subtotal + taxAmount + serviceCharge).toFixed(2)
        const itemCount = items.reduce((s, i) => s + i.quantity, 0)
        return { subtotal, taxAmount, serviceCharge, grandTotal, itemCount }
      },
    }),
    {
      name: 'qr-dine-cart',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
