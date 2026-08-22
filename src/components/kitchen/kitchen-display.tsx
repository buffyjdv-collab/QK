'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VegBadge } from '@/components/restaurant/veg-badge'
import { LoadingSpinner, EmptyState } from '@/components/restaurant/loading-states'
import { useAdminOrders, useUpdateOrderStatus, api } from '@/hooks/api'
import { useSocketEvent } from '@/hooks/use-socket'
import { useQueryClient } from '@tanstack/react-query'
import { ChefHat, Search, AlarmClock, CheckCircle2, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const COLUMN_STATUS = {
  NEW: ['NEW'],
  PREPARING: ['ACCEPTED', 'PREPARING'],
  READY: ['READY'],
}

export function KitchenDisplay() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const { data, isLoading, refetch } = useAdminOrders({ status: 'NEW' })
  const { data: prep, refetch: refetchPrep } = useAdminOrders({ status: 'PREPARING' })
  const { data: ready, refetch: refetchReady } = useAdminOrders({ status: 'READY' })
  const updateStatus = useUpdateOrderStatus()

  // Real-time — invalidate on any order event
  useSocketEvent('order:new', () => {
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    playBeep()
  })
  useSocketEvent('order:updated', () => qc.invalidateQueries({ queryKey: ['admin-orders'] }))
  useSocketEvent('order:statusChanged', () => qc.invalidateQueries({ queryKey: ['admin-orders'] }))

  const newOrders = filterOrders(data?.orders || [], filter)
  const prepOrders = filterOrders([...(prep?.orders || [])], filter)
  const readyOrders = filterOrders(ready?.orders || [], filter)

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            <h1 className="text-lg font-bold">Kitchen Display</h1>
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
              {newOrders.length} new · {prepOrders.length} cooking · {readyOrders.length} ready
            </span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter by table or order #"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 lg:grid-cols-3">
        <KanbanColumn
          title="New"
          accent="text-blue-400"
          orders={newOrders}
          loading={isLoading}
          actionLabel="Start preparing"
          actionStatus="PREPARING"
          onAction={(o) =>
            updateStatus.mutateAsync({ id: o.id, status: 'PREPARING' }).catch((e) =>
              toast.error(e.message || 'Failed'),
            )
          }
        />
        <KanbanColumn
          title="Preparing"
          accent="text-orange-400"
          orders={prepOrders}
          loading={false}
          actionLabel="Mark ready"
          actionStatus="READY"
          onAction={(o) =>
            updateStatus.mutateAsync({ id: o.id, status: 'READY' }).catch((e) =>
              toast.error(e.message || 'Failed'),
            )
          }
        />
        <KanbanColumn
          title="Ready to serve"
          accent="text-green-400"
          orders={readyOrders}
          loading={false}
          actionLabel="Mark served"
          actionStatus="SERVED"
          onAction={(o) =>
            updateStatus.mutateAsync({ id: o.id, status: 'SERVED' }).catch((e) =>
              toast.error(e.message || 'Failed'),
            )
          }
        />
      </div>
    </div>
  )
}

function KanbanColumn({
  title,
  accent,
  orders,
  loading,
  actionLabel,
  actionStatus,
  onAction,
}: {
  title: string
  accent: string
  orders: any[]
  loading: boolean
  actionLabel: string
  actionStatus: string
  onAction: (o: any) => void
}) {
  return (
    <div className="flex flex-col rounded-xl bg-slate-800/50">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <h2 className={`text-sm font-bold uppercase tracking-wide ${accent}`}>{title}</h2>
        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
          {orders.length}
        </span>
      </div>
      <div className="max-h-[calc(100vh-160px)] space-y-2 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
            No orders
          </div>
        ) : (
          <AnimatePresence>
            {orders.map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <KitchenOrderCard order={o} actionLabel={actionLabel} onAction={() => onAction(o)} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function KitchenOrderCard({
  order,
  actionLabel,
  onAction,
}: {
  order: any
  actionLabel: string
  onAction: () => void
}) {
  const minutes = Math.floor(
    (Date.now() - new Date(order.placedAt).getTime()) / 60000,
  )
  const timeColor =
    minutes < 10
      ? 'text-green-400'
      : minutes < 20
      ? 'text-amber-400'
      : 'text-red-400'

  return (
    <div className="rounded-lg bg-slate-800 p-3 shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-2xl font-black leading-tight">
            {order.table?.number}
          </p>
          <p className="text-xs text-slate-400">{order.orderNumber}</p>
        </div>
        <div className={cn('flex items-center gap-1 text-sm font-bold', timeColor)}>
          <AlarmClock className="h-4 w-4" />
          {minutes}m
        </div>
      </div>

      <div className="space-y-1.5 border-t border-slate-700 pt-2">
        {order.items?.map((it: any) => (
          <div key={it.id} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="font-bold text-orange-400">{it.quantity}×</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <VegBadge isVeg={it.isVeg} />
                  <span className="font-semibold">{it.menuItemName}</span>
                </div>
                {it.variantName && (
                  <p className="text-xs text-slate-400">Size: {it.variantName}</p>
                )}
                {it.modifiers?.length > 0 && (
                  <p className="text-xs text-slate-400">
                    + {it.modifiers.map((m: any) => m.modifierName).join(', ')}
                  </p>
                )}
                {it.notes && (
                  <p className="mt-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs italic text-amber-300">
                    ⚠ {it.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        size="sm"
        className={cn(
          'mt-3 w-full',
          actionLabel.includes('Start') && 'bg-orange-600 text-white hover:bg-orange-700',
          actionLabel.includes('ready') && 'bg-green-600 text-white hover:bg-green-700',
          actionLabel.includes('served') && 'bg-purple-600 text-white hover:bg-purple-700',
        )}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  )
}

function filterOrders(orders: any[], filter: string): any[] {
  if (!filter) return orders
  const f = filter.toLowerCase()
  return orders.filter(
    (o) =>
      o.orderNumber?.toLowerCase().includes(f) ||
      o.table?.number?.toLowerCase().includes(f),
  )
}

let audioCtx: AudioContext | null = null
function playBeep() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const ctx = audioCtx
    ;[880, 1100, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.value = 0.08
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.12)
    })
  } catch {
    // ignore
  }
}
