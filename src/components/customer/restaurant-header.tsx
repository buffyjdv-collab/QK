'use client'

import { UtensilsCrossed, Search, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import type { RestaurantInfo, TableInfo } from './types'
import { useCustomerCart } from '@/stores/customer-cart'

export function RestaurantHeader({
  restaurant,
  table,
  onBackToMenu,
}: {
  restaurant: RestaurantInfo
  table: TableInfo
  onBackToMenu: () => void
}) {
  const itemCount = useCustomerCart((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0),
  )

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 border-b border-orange-100 bg-white/95 backdrop-blur"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: restaurant.primaryColor }}
      />
      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 py-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white"
          style={{ backgroundColor: restaurant.primaryColor }}
        >
          {restaurant.logo ? (
             
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <UtensilsCrossed className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-bold text-slate-900">
              {restaurant.name}
            </h1>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: restaurant.accentColor }}
            >
              Table {table.number}
            </span>
          </div>
          {restaurant.tagline && (
            <p className="truncate text-xs text-muted-foreground">
              {restaurant.tagline}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Open {restaurant.openingTime}–{restaurant.closingTime}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Search menu"
        >
          <Search className="h-5 w-5" />
        </Button>
        {itemCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Cart"
            onClick={onBackToMenu}
          >
            <ShoppingBag className="h-5 w-5" />
          </Button>
        )}
      </div>
    </motion.header>
  )
}
