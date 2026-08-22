'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAdminOrders, api } from '@/hooks/api'
import { useQueryClient } from '@tanstack/react-query'
import { OrderStatusBadge } from '@/components/restaurant/order-status-badge'
import { PaymentStatusBadge } from '@/components/restaurant/payment-status-badge'
import { Price, formatINR } from '@/components/restaurant/price'
import { LoadingSpinner, EmptyState, ButtonWithLoading } from '@/components/restaurant/loading-states'
import { Receipt, Printer, CheckCircle2, FileText } from 'lucide-react'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'SERVED', label: 'Awaiting payment' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'READY', label: 'Ready (not yet served)' },
]

export function BillingManager() {
  const [filter, setFilter] = useState('SERVED')
  const { data, isLoading } = useAdminOrders({ status: filter })
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<any | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [paidOpen, setPaidOpen] = useState(false)
  const [payMethod, setPayMethod] = useState('COUNTER')

  const handleGenerateInvoice = async (orderId: string) => {
    try {
      const inv = await api(`/api/admin/billing/${orderId}/invoice`, { method: 'POST' })
      setInvoice(inv)
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Invoice generated')
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  const handleViewInvoice = async (orderId: string) => {
    try {
      const r = await api<{ order: any; invoice: any }>(`/api/admin/billing/${orderId}/invoice`)
      setInvoice(r.invoice)
      setInvoiceOpen(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  const handleMarkCompleted = async (orderId: string) => {
    try {
      await api(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast.success('Order completed')
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">Generate invoices and mark payments.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
      ) : !data?.orders?.length ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="No orders to bill"
          description={`No orders in status "${filter}".`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.orders.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Table {o.table?.number} · placed{' '}
                      {new Date(o.placedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Price amount={o.grandTotal} size="lg" />
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleViewInvoice(o.id)}>
                      <FileText className="mr-1 h-3 w-3" /> View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleGenerateInvoice(o.id)}>
                      <Receipt className="mr-1 h-3 w-3" /> Invoice
                    </Button>
                    {o.status === 'SERVED' && (
                      <Button
                        size="sm"
                        className="bg-orange-600 text-white hover:bg-orange-700"
                        onClick={() => handleMarkCompleted(o.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invoice viewer */}
      <Sheet open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice</SheetTitle>
            <SheetDescription>{invoice?.invoiceNumber}</SheetDescription>
          </SheetHeader>
          {invoice && (
            <div className="space-y-3 px-4 pb-8">
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-bold">{invoice.restaurantName}</p>
                <p className="text-muted-foreground">{invoice.restaurantAddress}</p>
                {invoice.restaurantGst && <p className="text-xs">GST: {invoice.restaurantGst}</p>}
                <p className="text-xs">Tel: {invoice.restaurantPhone}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <Row label="Invoice #" value={invoice.invoiceNumber} />
                <Row label="Order #" value={invoice.orderNumber} />
                <Row label="Table" value={invoice.tableNumber} />
                <Row
                  label="Issued"
                  value={new Date(invoice.issuedAt).toLocaleString('en-IN')}
                />
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <Row label="Subtotal" value={formatINR(invoice.subtotal)} />
                <Row label="Tax" value={formatINR(invoice.taxAmount)} />
                {invoice.serviceCharge > 0 && (
                  <Row label="Service" value={formatINR(invoice.serviceCharge)} />
                )}
                <div className="flex items-center justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatINR(invoice.grandTotal)}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const w = window.open('', '_blank')
                  if (w) {
                    w.document.write(`
                      <html><head><title>${invoice.invoiceNumber}</title></head><body>
                      <h2>${invoice.restaurantName}</h2>
                      <p>${invoice.restaurantAddress}</p>
                      <p>GST: ${invoice.restaurantGst || '—'}</p>
                      <hr/>
                      <p>Invoice: ${invoice.invoiceNumber}</p>
                      <p>Order: ${invoice.orderNumber} · Table ${invoice.tableNumber}</p>
                      <p>Issued: ${new Date(invoice.issuedAt).toLocaleString('en-IN')}</p>
                      <hr/>
                      <table style="width:100%;text-align:right"><tr><td style="text-align:left">Subtotal</td><td>${formatINR(invoice.subtotal)}</td></tr>
                      <tr><td style="text-align:left">Tax</td><td>${formatINR(invoice.taxAmount)}</td></tr>
                      ${invoice.serviceCharge > 0 ? `<tr><td style="text-align:left">Service</td><td>${formatINR(invoice.serviceCharge)}</td></tr>` : ''}
                      <tr><td style="text-align:left"><b>Total</b></td><td><b>${formatINR(invoice.grandTotal)}</b></td></tr></table>
                      </body></html>
                    `)
                    w.print()
                  }
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}
