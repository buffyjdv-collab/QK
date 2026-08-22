'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Users,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Loader2,
  Activity,
  IndianRupee,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatINR } from '@/lib/format'

interface PlatformMetrics {
  tenants: {
    total: number
    active: number
    suspended: number
    trialing: number
    byPlan: Record<string, number>
  }
  orders: { today: number; last30Days: number }
  revenue: { gmvLast30Days: number }
  users: { total: number }
  tables: { total: number }
  trends: { ordersLast14Days: { date: string; orders: number }[] }
  topTenants: { id: string; name: string; slug: string; plan: string; city?: string; revenue: number }[]
  paymentMethodBreakdown: Record<string, number>
  generatedAt: string
}

async function fetchMetrics(): Promise<PlatformMetrics> {
  const res = await fetch('/api/platform/metrics', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load metrics')
  const json = await res.json()
  return json.data
}

export function PlatformDashboard({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load platform metrics.</p>
      </div>
    )
  }

  const chartData = data.trends.ordersLast14Days.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    orders: d.orders,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">
            Multi-tenant SaaS metrics across all restaurants
          </p>
        </div>
        <Button onClick={() => onNavigate?.('platform-restaurants')}>
          <Building2 className="mr-2 h-4 w-4" />
          Manage tenants
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Building2 className="h-5 w-5" />}
          label="Total tenants"
          value={data.tenants.total.toString()}
          subtitle={`${data.tenants.active} active · ${data.tenants.trialing} trialing · ${data.tenants.suspended} suspended`}
          tone="orange"
        />
        <KpiCard
          icon={<IndianRupee className="h-5 w-5" />}
          label="GMV (30d)"
          value={formatINR(data.revenue.gmvLast30Days)}
          subtitle="Gross merchandise volume, paid orders"
          tone="green"
        />
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Orders today"
          value={data.orders.today.toString()}
          subtitle={`${data.orders.last30Days} orders in last 30 days`}
          tone="blue"
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Total users"
          value={data.users.total.toString()}
          subtitle={`${data.tables.total} tables deployed`}
          tone="purple"
        />
      </div>

      {/* Plan distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-orange-600" />
            Plan distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE'] as const).map((plan) => {
              const count = data.tenants.byPlan[plan] || 0
              const total = data.tenants.total || 1
              const pct = Math.round((count / total) * 100)
              const tone =
                plan === 'TRIAL'
                  ? 'bg-slate-100 text-slate-700'
                  : plan === 'STARTER'
                  ? 'bg-amber-100 text-amber-700'
                  : plan === 'PRO'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-emerald-100 text-emerald-700'
              return (
                <div key={plan} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {plan}
                    </span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${tone.split(' ')[0]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{pct}% of tenants</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Orders trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            Orders — last 14 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#EA580C"
                  strokeWidth={2}
                  fill="url(#ordersGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Top tenants by revenue (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topTenants.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No paid orders in the last 30 days yet.
            </p>
          ) : (
            <div className="space-y-2">
              {data.topTenants.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => onNavigate?.('platform-restaurants')}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.city || '—'} · {t.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{t.plan}</Badge>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatINR(t.revenue)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment methods (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.paymentMethodBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              Object.entries(data.paymentMethodBreakdown).map(([method, count]) => (
                <div
                  key={method}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {method}
                  </span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
