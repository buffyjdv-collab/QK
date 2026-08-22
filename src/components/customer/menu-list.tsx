'use client'

import { motion } from 'framer-motion'
import { MenuSection } from './menu-item-card'
import type { MenuItemWithRelations } from './types'

interface MenuListProps {
  categories: Array<{ id: string; name: string; icon?: string | null; description?: string | null }>
  items: MenuItemWithRelations[]
  onSelectItem: (id: string) => void
}

export function MenuList({ categories, items, onSelectItem }: MenuListProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-4">
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category?.id === cat.id)
        if (catItems.length === 0) return null
        return (
          <section key={cat.id} id={`cat-${cat.id}`} className="mb-8 scroll-mt-32">
            <div className="mb-3 flex items-center gap-2">
              {cat.icon && <span className="text-2xl">{cat.icon}</span>}
              <h2 className="text-lg font-bold text-slate-900">{cat.name}</h2>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                {catItems.length}
              </span>
            </div>
            {cat.description && (
              <p className="mb-3 text-sm text-muted-foreground">{cat.description}</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {catItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                >
                  <MenuSection item={item} onSelect={() => onSelectItem(item.id)} />
                </motion.div>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
