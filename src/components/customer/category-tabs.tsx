'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface CategoryTabsProps {
  categories: Array<{ id: string; name: string; icon?: string | null }>
  activeId: string
  onChange: (id: string) => void
}

export function CategoryTabs({ categories, activeId, onChange }: CategoryTabsProps) {
  // If no active id, default to first
  const effectiveActive = activeId || categories[0]?.id || ''

  return (
    <div className="sticky top-[68px] z-20 -mb-2 border-b border-orange-100 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-2">
        <div className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const active = c.id === effectiveActive
            return (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c.id)
                  const el = document.getElementById(`cat-${c.id}`)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
                )}
              >
                {c.icon && <span className="text-base">{c.icon}</span>}
                <span>{c.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
