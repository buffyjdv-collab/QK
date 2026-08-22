'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminServiceRequests, api } from '@/hooks/api'
import { useQueryClient } from '@tanstack/react-query'
import { BellRing, Droplets, Trash2, Receipt, Hand, CheckCircle2 } from 'lucide-react'
import { LoadingSpinner, EmptyState } from '@/components/restaurant/loading-states'
import { toast } from 'sonner'

const TYPE_ICON: Record<string, any> = {
  CALL_WAITER: BellRing,
  REQUEST_BILL: Receipt,
  WATER: Droplets,
  CLEANUP: Trash2,
  CUSTOM: Hand,
}

const STATUS_TINT: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACKNOWLEDGED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

export function ServiceRequestsWidget({ defaultStatus = 'PENDING' }: { defaultStatus?: string }) {
  const [status, setStatus] = useState(defaultStatus)
  const { data, isLoading } = useAdminServiceRequests(status)
  const qc = useQueryClient()

  const handleUpdate = async (id: string, newStatus: string) => {
    try {
      await api(`/api/admin/service-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      qc.invalidateQueries({ queryKey: ['admin-service-requests'] })
      toast.success(newStatus === 'COMPLETED' ? 'Marked completed' : 'Acknowledged')
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Service requests</CardTitle>
        <div className="flex gap-1">
          {['PENDING', 'ACKNOWLEDGED', 'COMPLETED'].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? 'default' : 'ghost'}
              onClick={() => setStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : !data?.length ? (
          <EmptyState title={`No ${status.toLowerCase()} requests`} />
        ) : (
          <div className="space-y-2">
            {data.map((r: any) => {
              const Icon = TYPE_ICON[r.type] || Hand
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold capitalize">
                        {r.type.replace('_', ' ').toLowerCase()}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TINT[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Table {r.table?.number}
                      {r.order ? ` · ${r.order.orderNumber}` : ''}
                      {' · '}
                      {new Date(r.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {r.notes && (
                      <p className="text-xs italic text-muted-foreground">“{r.notes}”</p>
                    )}
                  </div>
                  {r.status !== 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleUpdate(
                          r.id,
                          r.status === 'PENDING' ? 'ACKNOWLEDGED' : 'COMPLETED',
                        )
                      }
                    >
                      {r.status === 'PENDING' ? 'Acknowledge' : 'Complete'}
                    </Button>
                  )}
                  {r.status === 'COMPLETED' && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
