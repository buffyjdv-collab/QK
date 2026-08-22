'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminOrders, useAdminServiceRequests, api } from '@/hooks/api'
import { useSocketEvent } from '@/hooks/use-socket'
import { useQueryClient } from '@tanstack/react-query'
import { LoadingSpinner, EmptyState } from '@/components/restaurant/loading-states'
import { BellRing, Droplets, Trash2, Receipt, Hand, CheckCircle2, Utensils, Users, Clock } from 'lucide-react'
import { toast } from 'sonner'

const TYPE_ICON: Record<string, any> = {
  CALL_WAITER: BellRing,
  REQUEST_BILL: Receipt,
  WATER: Droplets,
  CLEANUP: Trash2,
  CUSTOM: Hand,
}

export function WaiterDashboard() {
  const qc = useQueryClient()
  const { data: readyOrders } = useAdminOrders({ status: 'READY' })
  const { data: servedOrders } = useAdminOrders({ status: 'SERVED' })
  const { data: pendingRequests } = useAdminServiceRequests('PENDING')
  const { data: acknowledgedRequests } = useAdminServiceRequests('ACKNOWLEDGED')

  // Real-time
  useSocketEvent('order:statusChanged', () => qc.invalidateQueries({ queryKey: ['admin-orders'] }))
  useSocketEvent('order:new', () => qc.invalidateQueries({ queryKey: ['admin-orders'] }))
  useSocketEvent('service:new', () => qc.invalidateQueries({ queryKey: ['admin-service-requests'] }))

  const handleServe = async (orderId: string) => {
    try {
      await api(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SERVED' }),
      })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order marked as served')
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  const handleServiceUpdate = async (id: string, status: string) => {
    try {
      await api(`/api/admin/service-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      qc.invalidateQueries({ queryKey: ['admin-service-requests'] })
      toast.success(status === 'COMPLETED' ? 'Marked complete' : 'Acknowledged')
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  const activeTables = new Map<string, any>()
  for (const o of [...(servedOrders?.orders || []), ...(readyOrders?.orders || [])]) {
    const k = o.table?.id
    if (k && !activeTables.has(k)) activeTables.set(k, o)
  }

  return (
    <div className="grid gap-4 p-4 lg:p-6 lg:grid-cols-3">
      {/* Active tables */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-orange-600" />
            Active tables ({activeTables.size})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeTables.size ? (
            <EmptyState title="No active tables" />
          ) : (
            <div className="space-y-2">
              {Array.from(activeTables.values()).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <div>
                    <p className="font-semibold">Table {o.table?.number}</p>
                    <p className="text-xs text-muted-foreground">{o.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-600">{o.status}</p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="mr-0.5 inline h-3 w-3" />
                      {Math.floor((Date.now() - new Date(o.placedAt).getTime()) / 60000)}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready to serve */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-4 w-4 text-green-600" />
            Ready to serve ({readyOrders?.orders?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!readyOrders?.orders?.length ? (
            <EmptyState title="Nothing ready yet" description="Orders marked ready in the kitchen will appear here." />
          ) : (
            <div className="space-y-2">
              {readyOrders.orders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 rounded-lg border bg-green-50/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <span className="text-sm font-bold">{o.table?.number}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {o._count?.items || o.items?.length || 0} items · ₹{o.grandTotal?.toFixed(0)}
                    </p>
                  </div>
                  <Button onClick={() => handleServe(o.id)} className="bg-green-600 text-white hover:bg-green-700">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Served
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service requests */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-orange-600" />
            Service requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pendingRequests?.length && !acknowledgedRequests?.length ? (
            <EmptyState title="No active requests" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {[...(pendingRequests || []), ...(acknowledgedRequests || [])].map((r: any) => {
                const Icon = TYPE_ICON[r.type] || Hand
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold capitalize">
                        {r.type.replace('_', ' ').toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Table {r.table?.number} · {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {r.notes && <p className="text-xs italic text-muted-foreground">“{r.notes}”</p>}
                    </div>
                    {r.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleServiceUpdate(r.id, 'ACKNOWLEDGED')}
                      >
                        Acknowledge
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => handleServiceUpdate(r.id, 'COMPLETED')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
