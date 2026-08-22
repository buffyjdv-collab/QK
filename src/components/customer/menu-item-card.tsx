'use client'

import { Plus, Star, Flame } from 'lucide-react'
import { VegBadge } from '@/components/restaurant/veg-badge'
import { Price, formatINR } from '@/components/restaurant/price'
import { cn } from '@/lib/utils'
import type { MenuItemWithRelations } from './types'
import { useCustomerCart } from '@/stores/customer-cart'

export function MenuSection({
  item,
  onSelect,
}: {
  item: MenuItemWithRelations
  onSelect: () => void
}) {
  const items = useCustomerCart((s) => s.items)
  const inCartQty = items
    .filter((i) => i.menuItemId === item.id)
    .reduce((n, i) => n + i.quantity, 0)

  const variantFrom = item.variants.length
    ? Math.min(
        ...item.variants.map((v) => item.basePrice + v.priceModifier),
      )
    : item.basePrice

  return (
    <div
      role="button"
      tabIndex={item.soldOut ? -1 : 0}
      onClick={item.soldOut ? undefined : onSelect}
      onKeyDown={(e) => {
        if (item.soldOut) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-2xl border border-orange-100 bg-white p-3 text-left transition-all hover:border-orange-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400',
        item.soldOut && 'pointer-events-none opacity-60',
      )}
    >
      {/* Left content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <VegBadge isVeg={item.isVeg} />
          {item.isSpicy && (
            <span className="inline-flex items-center text-orange-600" title="Spicy">
              <Flame className="h-3.5 w-3.5" />
            </span>
          )}
          {item.isFeatured && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              Featured
            </span>
          )}
        </div>
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <Price amount={variantFrom} size="sm" />
          {item.variants.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {variantFrom < item.basePrice ? 'from' : '+'} variants
            </span>
          )}
        </div>
      </div>

      {/* Right image + add */}
      <div className="relative shrink-0">
        <div className="h-20 w-20 overflow-hidden rounded-xl bg-orange-50 sm:h-24 sm:w-24">
          {item.image ? (
             <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              🍽️
            </div>
          )}
        </div>
        {item.soldOut ? (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
            Sold out
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white shadow-md transition-transform hover:scale-110"
            aria-label={`Add ${item.name} to cart`}
          >
            {inCartQty > 0 ? (
              <span className="text-xs font-bold">{inCartQty}</span>
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Convenience export
export { formatINR }
