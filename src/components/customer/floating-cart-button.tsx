'use client'

import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCustomerCart } from '@/stores/customer-cart'
import { useCustomerMenu } from '@/hooks/api'

export function FloatingCartButton({ onClick }: { onClick: () => void }) {
  const items = useCustomerCart((s) => s.items)
  const totals = useCustomerCart((s) => s.totals)
  const table = new URLSearchParams(window.location.search).get('table')
  const { data } = useCustomerMenu(table)
  const r = data?.restaurant
  const t = r ? totals(r.taxRate, r.serviceChargeRate) : null

  if (items.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4"
      >
        <button
          onClick={onClick}
          className="flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-orange-600 px-5 py-3 text-white shadow-xl shadow-orange-600/30 transition-transform hover:scale-[1.01]"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-orange-600">
                {t?.itemCount || 0}
              </span>
            </div>
            <span className="font-semibold">View cart</span>
          </div>
          <span className="font-bold">₹{(t?.grandTotal || 0).toFixed(0)}</span>
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
