'use client'

import { useState } from 'react'
import { useCustomerOrder, useInitiatePayment, useVerifyPayment, api } from '@/hooks/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/restaurant/loading-states'
import { Price, formatINR } from '@/components/restaurant/price'
import { PaymentStatusBadge } from '@/components/restaurant/payment-status-badge'
import { CheckCircle2, CreditCard, Banknote, Wallet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { RestaurantInfo } from './types'

export function BillView({
  orderId,
  restaurant,
  onBackToMenu,
}: {
  orderId: string
  restaurant: RestaurantInfo
  onBackToMenu: () => void
}) {
  const { data: order, isLoading } = useCustomerOrder(orderId)
  const initiate = useInitiatePayment()
  const verify = useVerifyPayment()
  const [paying, setPaying] = useState(false)

  if (isLoading || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const invoice = order.invoices?.[0]
  const isPaid = order.paymentStatus === 'PAID'

  const handlePay = async (method: 'UPI' | 'CARD' | 'WALLET') => {
    setPaying(true)
    try {
      const init = await initiate.mutateAsync({ orderId, method })
      toast.info('Connecting to payment gateway…')
      // Simulate delay then verify
      await new Promise((r) => setTimeout(r, init.verifyInMs || 1500))
      await verify.mutateAsync({
        paymentId: init.paymentId,
        providerTxnId: init.providerTxnId,
      })
      toast.success('Payment successful! 🎉')
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const handleCounter = async () => {
    setPaying(true)
    try {
      // Use COUNTER method via init flow with method 'WALLET' for the mock,
      // then mark as paid via a dedicated endpoint (we'll re-use verify).
      // For demo simplicity, use WALLET init+verify but display as counter.
      const init = await initiate.mutateAsync({ orderId, method: 'WALLET' })
      await new Promise((r) => setTimeout(r, 800))
      await verify.mutateAsync({
        paymentId: init.paymentId,
        providerTxnId: init.providerTxnId,
      })
      toast.success('Marked as paid at counter')
    } catch (err: any) {
      toast.error(err.message || 'Could not complete')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Invoice card */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <Card className="overflow-hidden">
          <div
            className="h-2"
            style={{ backgroundColor: restaurant.primaryColor }}
          />
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {restaurant.address}
                </p>
                <p className="text-xs text-muted-foreground">
                  {restaurant.phone}
                  {restaurant.email ? ` • ${restaurant.email}` : ''}
                </p>
              </div>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between border-b border-dashed pb-2 text-xs">
              <div>
                <p>
                  <span className="text-muted-foreground">Bill #</span>{' '}
                  <span className="font-semibold">
                    {invoice?.invoiceNumber || order.orderNumber}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Order #</span>{' '}
                  {order.orderNumber}
                </p>
              </div>
              <div className="text-right">
                <p>
                  <span className="text-muted-foreground">Table</span>{' '}
                  <span className="font-semibold">{order.table?.number}</span>
                </p>
                <p className="text-muted-foreground">
                  {new Date(order.placedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1 text-sm">
              {order.items?.map((it: any) => (
                <div key={it.id} className="flex gap-2">
                  <span className="w-6 font-medium">{it.quantity}×</span>
                  <div className="flex-1">
                    <p>{it.menuItemName}</p>
                    {it.variantName && (
                      <p className="text-xs text-muted-foreground">
                        {it.variantName}
                      </p>
                    )}
                    {it.modifiers?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + {it.modifiers.map((m: any) => m.modifierName).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">{formatINR(it.totalPrice)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-1 border-t border-dashed pt-3 text-sm">
              <Row label="Subtotal" value={order.subtotal} />
              {order.taxAmount > 0 && <Row label="Taxes & GST" value={order.taxAmount} />}
              {order.serviceCharge > 0 && (
                <Row label="Service charge" value={order.serviceCharge} />
              )}
              <div className="flex items-center justify-between border-t pt-2 text-base font-bold">
                <span>Grand total</span>
                <Price amount={order.grandTotal} size="xl" />
              </div>
            </div>

            {/* GST info */}
            {restaurant.gstNumber && (
              <p className="mt-3 text-[10px] text-muted-foreground">
                GSTIN: {restaurant.gstNumber} · PAN: {restaurant.panNumber || '—'}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment options */}
      <div className="mt-5">
        {isPaid ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-lg font-bold text-green-700">Payment received</p>
              <p className="text-sm text-muted-foreground">
                Your order is now complete. Thank you for dining with {restaurant.name}!
              </p>
              <Button onClick={onBackToMenu} className="mt-2">
                Place another order
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Choose payment method
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {restaurant.acceptUpi && (
                <PaymentOption
                  icon={Wallet}
                  label="UPI"
                  sub="GPay / PhonePe / Paytm"
                  disabled={paying}
                  onClick={() => handlePay('UPI')}
                />
              )}
              {restaurant.acceptCard && (
                <PaymentOption
                  icon={CreditCard}
                  label="Card"
                  sub="Credit / Debit"
                  disabled={paying}
                  onClick={() => handlePay('CARD')}
                />
              )}
              {restaurant.acceptCounter && (
                <PaymentOption
                  icon={Banknote}
                  label="Pay at counter"
                  sub="Cash / Card"
                  disabled={paying}
                  onClick={handleCounter}
                />
              )}
            </div>
            {paying && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing payment…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-slate-700">{formatINR(value)}</span>
    </div>
  )
}

function PaymentOption({
  icon: Icon,
  label,
  sub,
  onClick,
  disabled,
}: {
  icon: any
  label: string
  sub: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      className="flex h-auto flex-col items-start gap-1 py-4"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-5 w-5 text-orange-600" />
      <div className="text-left">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Button>
  )
}
