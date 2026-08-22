'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Loader2, IndianRupee, Building2, TrendingUp, Calendar } from 'lucide-react'
import { formatINR, formatRelative } from '@/lib/format'

const PIE_COLORS = ['#EA580C', '#16A34A', '#9333EA', '#0EA5E9', '#F59E0B']
const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
]

interface FeesData {
  range: string
  from: string
  to: string
  totalCollected: number
  totalPending: number
  totalRefunded: number
  totalFees: number
  byTenant: Array<{
    restaurantId: string
    restaurantName: string
    slug: string
    plan: string
    feeCount: number
    collected: number
    pending: number
    refunded: number
    customerPaid: number
    restaurantPaid: number
  }>
  byFeeType: Array<{ feeType: string; amount: number }>
  byPayer: Array<{ payer: string; amount: number }>
  recentFees: Array<{
    id: string
    feeType: string
    feeAmount: number
    baseAmount: number
    payer: string
    status: string
    collectedAt: string | null
    createdAt: string
    restaurant: { id: string; name: string; slug: string; plan: string }
    order: { id: string; orderNumber: string; grandTotal: number }
  }>
}

async function fetchFees(range: string): Promise<FeesData> {
  const res = await fetch(`/api/platform/fees?range=${range}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load fees')
  const json = await res.json()
  return json.data
}

export function PlatformFeesCollected() {
  const [range, setRange] = useState('30d')
  const { data, isLoading } = useQuery({
    queryKey: ['platform-fees', range],
    queryFn: () => fetchFees(range),
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!data) return null

  const statusColor: Record<string, string> = {
    COLLECTED: 'bg-emerald-50 text-emerald-700',
    PENDING: 'bg-amber-50 text-amber-700',
    REFUNDED: 'bg-purple-50 text-purple-700',
    WAIVED: 'bg-slate-100 text-slate-700',
  }

  const feeTypeLabel: Record<string, string> = {
    PERCENTAGE: '%',
    FIXED_PER_ORDER: 'Fixed',
    HYBRID: 'Hybrid',
    MONTHLY_SUBSCRIPTION: 'Monthly',
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Fees Collected</h1>
          <p className="text-sm text-muted-foreground">
            Track commission revenue across all tenants
          </p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total collected" value={formatINR(data.totalCollected)} icon={<IndianRupee className="h-4 w-4" />} tone="green" />
        <KpiCard label="Pending" value={formatINR(data.totalPending)} icon={<IndianRupee className="h-4 w-4" />} tone="orange" />
        <KpiCard label="Refunded" value={formatINR(data.totalRefunded)} icon={<IndianRupee className="h-4 w-4" />} tone="purple" />
        <KpiCard label="Total fees" value={String(data.totalFees)} icon={<TrendingUp className="h-4 w-4" />} tone="blue" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fees by tenant (top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byTenant.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 30, right: 30, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v.toFixed(0)}`} />
                  <YAxis
                    type="category"
                    dataKey="restaurantName"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => formatINR(v)}
                  />
                  <Bar dataKey="collected" fill="#EA580C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By payer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byPayer}
                    dataKey="amount"
                    nameKey="payer"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e: any) => `${e.payer}`}
                  >
                    {data.byPayer.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => formatINR(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Tenant table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fees by tenant</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">Restaurant</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">Plan</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Fees</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Collected</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Pending</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Restaurant paid</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Customer paid</th>
                </tr>
              </thead>
              <tbody>
                {data.byTenant.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No fees collected in this range</td></tr>
                ) : (
                  data.byTenant.map((t) => (
                    <tr key={t.restaurantId} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{t.restaurantName}</p>
                            <p className="text-[10px] text-muted-foreground">/{t.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2"><Badge variant="outline">{t.plan}</Badge></td>
                      <td className="px-4 py-2 text-right">{t.feeCount}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">{formatINR(t.collected)}</td>
                      <td className="px-4 py-2 text-right text-amber-600">{t.pending > 0 ? formatINR(t.pending) : '—'}</td>
                      <td className="px-4 py-2 text-right">{formatINR(t.restaurantPaid)}</td>
                      <td className="px-4 py-2 text-right">{formatINR(t.customerPaid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent fees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent fee transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">Order</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">Restaurant</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Base</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Fee</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">Payer</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">When</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFees.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No recent fees</td></tr>
                ) : (
                  data.recentFees.map((f) => (
                    <tr key={f.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs">{f.order.orderNumber}</td>
                      <td className="px-4 py-2">{f.restaurant.name}</td>
                      <td className="px-4 py-2"><Badge variant="outline">{feeTypeLabel[f.feeType] || f.feeType}</Badge></td>
                      <td className="px-4 py-2 text-right">{formatINR(f.baseAmount)}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">{formatINR(f.feeAmount)}</td>
                      <td className="px-4 py-2 text-xs">{f.payer}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusColor[f.status] || 'bg-slate-100'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatRelative(f.collectedAt || f.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'orange' | 'green' | 'blue' | 'purple'
}) {
  const toneClass = {
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    purple: 'bg-violet-50 text-violet-700',
  }[tone]
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>{icon}</div>
      </CardContent>
    </Card>
  )
}
