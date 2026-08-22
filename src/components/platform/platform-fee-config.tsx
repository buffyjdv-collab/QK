'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Percent,
  IndianRupee,
  Calendar,
  Layers,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  TrendingUp,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatINR } from '@/lib/format'

interface FeeConfig {
  id: string | null
  feeType: 'PERCENTAGE' | 'FIXED_PER_ORDER' | 'MONTHLY_SUBSCRIPTION' | 'HYBRID'
  percentageRate: number
  fixedAmount: number      // paise
  monthlyAmount: number    // paise
  appliesTo: 'FOOD_SUBTOTAL' | 'DISCOUNTED_SUBTOTAL' | 'TOTAL_EXCLUDING_TAX' | 'TOTAL_INCLUDING_TAX'
  minimumFee: number       // paise
  maximumFee: number | null // paise
  payer: 'RESTAURANT' | 'CUSTOMER' | 'SPLIT'
  customerSplitPct: number
  active: boolean
  description: string
}

const FEE_TYPE_INFO = {
  PERCENTAGE: { label: 'Percentage', desc: 'Charge a % of each order', icon: Percent },
  FIXED_PER_ORDER: { label: 'Fixed per order', desc: 'Flat fee per order', icon: IndianRupee },
  MONTHLY_SUBSCRIPTION: { label: 'Monthly subscription', desc: 'Flat monthly fee, no per-order charge', icon: Calendar },
  HYBRID: { label: 'Hybrid', desc: 'Percentage + fixed per order', icon: Layers },
}

const APPLIES_TO_INFO = {
  FOOD_SUBTOTAL: 'Food subtotal (before discounts)',
  DISCOUNTED_SUBTOTAL: 'Discounted subtotal (after discounts, before tax)',
  TOTAL_EXCLUDING_TAX: 'Total excluding tax (subtotal - discount + service charge)',
  TOTAL_INCLUDING_TAX: 'Total including tax (full grand total)',
}

const PAYER_INFO = {
  RESTAURANT: 'Restaurant pays — fee deducted from restaurant payout',
  CUSTOMER: 'Customer pays — fee added on top of order total',
  SPLIT: 'Split — customer & restaurant each pay a portion',
}

async function fetchConfig(): Promise<FeeConfig> {
  const res = await fetch('/api/platform/fee-config', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load fee config')
  const json = await res.json()
  return json.data
}

export function PlatformFeeConfig() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['platform-fee-config'],
    queryFn: fetchConfig,
  })

  const [form, setForm] = useState<FeeConfig | null>(null)
  const [saving, setSaving] = useState(false)

  // Sync form when data loads
  if (data && !form) setForm(data)

  if (isLoading || !form) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
      </div>
    )
  }

  const update = <K extends keyof FeeConfig>(k: K, v: FeeConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/platform/fee-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to save')
      } else {
        toast.success('Platform fee config updated')
        qc.invalidateQueries({ queryKey: ['platform-fee-config'] })
        if (json.data) setForm({ ...form, ...json.data, description: json.description })
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const paiseToRupees = (p: number) => (p / 100).toString()
  const rupeesToPaise = (s: string) => Math.round(parseFloat(s || '0') * 100)

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Fee Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Configure how the platform charges restaurants for each transaction
        </p>
      </div>

      {/* Current config summary */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
              <Percent className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Current configuration</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{form.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Fee Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.entries(FEE_TYPE_INFO) as [keyof typeof FEE_TYPE_INFO, typeof FEE_TYPE_INFO[keyof typeof FEE_TYPE_INFO]][]).map(([key, info]) => {
              const Icon = info.icon
              const selected = form.feeType === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => update('feeType', key)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                    selected ? 'border-orange-600 bg-orange-50 shadow-sm' : 'border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <Icon className={`mt-0.5 h-5 w-5 ${selected ? 'text-orange-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-sm font-semibold">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <Separator className="my-4" />

          {/* Conditional fields based on fee type */}
          {form.feeType === 'PERCENTAGE' && (
            <div>
              <Label>Percentage rate (%)</Label>
              <div className="relative mt-1">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.percentageRate}
                  onChange={(e) => update('percentageRate', parseFloat(e.target.value || '0'))}
                  className="pl-9"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">e.g. 0.5 means 0.5% per order</p>
            </div>
          )}

          {form.feeType === 'FIXED_PER_ORDER' && (
            <div>
              <Label>Fixed amount per order (₹)</Label>
              <div className="relative mt-1">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={paiseToRupees(form.fixedAmount)}
                  onChange={(e) => update('fixedAmount', rupeesToPaise(e.target.value))}
                  className="pl-9"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">e.g. ₹5.00 charged per order, regardless of order size</p>
            </div>
          )}

          {form.feeType === 'MONTHLY_SUBSCRIPTION' && (
            <div>
              <Label>Monthly subscription amount (₹)</Label>
              <div className="relative mt-1">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={paiseToRupees(form.monthlyAmount)}
                  onChange={(e) => update('monthlyAmount', rupeesToPaise(e.target.value))}
                  className="pl-9"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Billed monthly per restaurant. No per-order fee is charged at checkout.
              </p>
            </div>
          )}

          {form.feeType === 'HYBRID' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Percentage rate (%)</Label>
                <div className="relative mt-1">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.percentageRate}
                    onChange={(e) => update('percentageRate', parseFloat(e.target.value || '0'))}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Fixed amount per order (₹)</Label>
                <div className="relative mt-1">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={paiseToRupees(form.fixedAmount)}
                    onChange={(e) => update('fixedAmount', rupeesToPaise(e.target.value))}
                    className="pl-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Both charges apply: fee = (base × %) + fixed amount
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applies To + Caps */}
      {form.feeType !== 'MONTHLY_SUBSCRIPTION' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Fee applies to</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Base for fee calculation</Label>
              <Select value={form.appliesTo} onValueChange={(v: any) => update('appliesTo', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(APPLIES_TO_INFO).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Minimum fee per order (₹)</Label>
                <div className="relative mt-1">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={paiseToRupees(form.minimumFee)}
                    onChange={(e) => update('minimumFee', rupeesToPaise(e.target.value))}
                    className="pl-9"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Fee will never be less than this amount</p>
              </div>
              <div>
                <Label>Maximum fee per order (₹) <span className="text-muted-foreground">(optional)</span></Label>
                <div className="relative mt-1">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={form.maximumFee ? paiseToRupees(form.maximumFee) : ''}
                    onChange={(e) => update('maximumFee', e.target.value ? rupeesToPaise(e.target.value) : null)}
                    placeholder="No cap"
                    className="pl-9"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Fee will never exceed this amount (blank = unlimited)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Who Pays */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{form.feeType === 'MONTHLY_SUBSCRIPTION' ? '2' : '3'}. Who pays the fee?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={form.payer} onValueChange={(v: any) => update('payer', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="RESTAURANT">Restaurant pays</SelectItem>
              <SelectItem value="CUSTOMER">Customer pays</SelectItem>
              <SelectItem value="SPLIT">Split between both</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{PAYER_INFO[form.payer]}</p>

          {form.payer === 'SPLIT' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Label>Customer portion (%)</Label>
              <div className="relative mt-1">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.customerSplitPct}
                  onChange={(e) => update('customerSplitPct', parseFloat(e.target.value || '0'))}
                  className="pl-9"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Customer pays {form.customerSplitPct}% of the fee; restaurant pays {100 - form.customerSplitPct}%.
              </p>
            </div>
          )}

          {form.payer === 'CUSTOMER' && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>Customer pays</strong> mode adds the fee on top of the order total at checkout.
                The customer sees it as a separate line item in their cart and invoice.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="text-base text-white">Live preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-xs text-slate-400">{form.description}</p>
          <Separator className="bg-slate-700" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Example orders</p>
            {[500, 1000, 2500].map((subtotal) => {
              // Recompute fee inline (mirror of platform-fee.ts)
              const base =
                form.appliesTo === 'FOOD_SUBTOTAL' ? subtotal :
                form.appliesTo === 'DISCOUNTED_SUBTOTAL' ? subtotal :
                form.appliesTo === 'TOTAL_EXCLUDING_TAX' ? subtotal * 1.05 :
                subtotal * 1.05 * 1.05  // including 5% tax
              const pct = (base * form.percentageRate) / 100
              const fixed = form.fixedAmount / 100
              let fee = form.feeType === 'PERCENTAGE' ? pct :
                        form.feeType === 'FIXED_PER_ORDER' ? fixed :
                        form.feeType === 'HYBRID' ? pct + fixed : 0
              fee = Math.max(fee, form.minimumFee / 100)
              if (form.maximumFee) fee = Math.min(fee, form.maximumFee / 100)
              return (
                <div key={subtotal} className="flex items-center justify-between">
                  <span className="text-slate-300">Order ₹{subtotal}</span>
                  <span className="font-mono text-emerald-400">fee = ₹{fee.toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-end gap-2 rounded-lg border bg-white p-3 shadow-lg">
        <Button
          variant="outline"
          onClick={() => data && setForm(data)}
          disabled={saving}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={save} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save configuration
        </Button>
      </div>
    </div>
  )
}
