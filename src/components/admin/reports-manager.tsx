'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { LoadingSpinner, EmptyState } from '@/components/restaurant/loading-states'
import { formatINR } from '@/lib/format'
import {
  TrendingUp,
  ShoppingBag,
  PieChart as PieChartIcon,
  CreditCard,
  Download,
  Calendar as CalendarIcon,
  IndianRupee,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'

const PIE_COLORS = ['#EA580C', '#16A34A', '#9333EA', '#0EA5E9', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1']

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
]

export function ReportsManager() {
  const [range, setRange] = useState('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [tab, setTab] = useState('sales')

  const effectiveRange =
    range === 'custom' && customFrom && customTo ? 'custom' : range
  const queryString =
    range === 'custom' && customFrom && customTo
      ? `range=custom&from=${customFrom}&to=${customTo}`
      : `range=${range}`

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sales, products, categories, and payment collections
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const from = range === 'custom' ? customFrom : ''
            const to = range === 'custom' ? customTo : ''
            const params = new URLSearchParams({ range, from, to, format: 'csv' })
            window.open(`/api/admin/reports/export?${params}`, '_blank')
            toast.success('CSV export ready')
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <Label className="text-xs">Date range</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[180px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {range === 'custom' && (
            <>
              <div>
                <Label className="text-xs">From</Label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-[160px]" />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-[160px]" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="sales"><TrendingUp className="mr-2 h-4 w-4" />Sales</TabsTrigger>
          <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" />Products</TabsTrigger>
          <TabsTrigger value="categories"><PieChartIcon className="mr-2 h-4 w-4" />Categories</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="mr-2 h-4 w-4" />Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <SalesReport queryString={queryString} />
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <ProductsReport queryString={queryString} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesReport queryString={queryString} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsReport queryString={queryString} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// SALES REPORT
// ============================================================================

interface SalesRow {
  date: string
  orders: number
  grossSales: number
  discount: number
  refund: number
  netSales: number
  tax: number
  total: number
}

function SalesReport({ queryString }: { queryString: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-sales', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/sales?${queryString}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load sales report')
      const json = await res.json()
      return json.data as {
        range: string
        rows: SalesRow[]
        summary: SalesRow & { aov: number }
      }
    },
  })

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
  if (isError) return <EmptyState title="Couldn't load sales report" />

  if (!data) return null

  const chartData = data.rows.map((r) => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    total: r.total,
    net: r.netSales,
    orders: r.orders,
  }))

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total revenue" value={formatINR(data.summary.total)} icon={<IndianRupee className="h-4 w-4" />} tone="orange" />
        <KpiCard label="Orders" value={String(data.summary.orders)} icon={<ShoppingBag className="h-4 w-4" />} tone="blue" />
        <KpiCard label="Avg order value" value={formatINR(data.summary.aov)} icon={<TrendingUp className="h-4 w-4" />} tone="green" />
        <KpiCard label="Tax collected" value={formatINR(data.summary.tax)} icon={<CreditCard className="h-4 w-4" />} tone="purple" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily revenue trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(v: number) => formatINR(v)}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="net" name="Net sales" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total (with tax)" fill="#EA580C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left">
                <tr>
                  <Th>Date</Th>
                  <Th align="right">Orders</Th>
                  <Th align="right">Gross Sales</Th>
                  <Th align="right">Discount</Th>
                  <Th align="right">Refund</Th>
                  <Th align="right">Net Sales</Th>
                  <Th align="right">Tax</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.date} className="border-b last:border-0 hover:bg-slate-50">
                    <Td>{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Td>
                    <Td align="right">{r.orders}</Td>
                    <Td align="right">{formatINR(r.grossSales)}</Td>
                    <Td align="right" className="text-red-600">{r.discount > 0 ? `-${formatINR(r.discount)}` : '—'}</Td>
                    <Td align="right" className="text-red-600">{r.refund > 0 ? `-${formatINR(r.refund)}` : '—'}</Td>
                    <Td align="right" className="font-medium">{formatINR(r.netSales)}</Td>
                    <Td align="right">{formatINR(r.tax)}</Td>
                    <Td align="right" className="font-bold">{formatINR(r.total)}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 bg-orange-50 font-bold">
                <tr>
                  <Td>Total</Td>
                  <Td align="right">{data.summary.orders}</Td>
                  <Td align="right">{formatINR(data.summary.grossSales)}</Td>
                  <Td align="right" className="text-red-600">{data.summary.discount > 0 ? `-${formatINR(data.summary.discount)}` : '—'}</Td>
                  <Td align="right" className="text-red-600">{data.summary.refund > 0 ? `-${formatINR(data.summary.refund)}` : '—'}</Td>
                  <Td align="right">{formatINR(data.summary.netSales)}</Td>
                  <Td align="right">{formatINR(data.summary.tax)}</Td>
                  <Td align="right">{formatINR(data.summary.total)}</Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// PRODUCTS REPORT
// ============================================================================

interface ProductRow {
  menuItemId: string
  name: string
  image: string | null
  isVeg: boolean
  isSpicy: boolean
  categoryName: string | null
  quantity: number
  grossSales: number
  discount: number
  netSales: number
}

function ProductsReport({ queryString }: { queryString: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-products', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/products?${queryString}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load products report')
      const json = await res.json()
      return json.data as {
        range: string
        items: ProductRow[]
        topSelling: ProductRow[]
        topRevenue: ProductRow[]
        summary: { totalItems: number; totalQuantity: number; totalGrossSales: number; totalDiscount: number; totalNetSales: number }
      }
    },
  })

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
  if (isError) return <EmptyState title="Couldn't load products report" />
  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Items sold" value={String(data.summary.totalQuantity)} icon={<Package className="h-4 w-4" />} tone="orange" />
        <KpiCard label="Unique items" value={String(data.summary.totalItems)} icon={<Package className="h-4 w-4" />} tone="blue" />
        <KpiCard label="Gross sales" value={formatINR(data.summary.totalGrossSales)} icon={<IndianRupee className="h-4 w-4" />} tone="green" />
        <KpiCard label="Net sales" value={formatINR(data.summary.totalNetSales)} icon={<TrendingUp className="h-4 w-4" />} tone="purple" />
      </div>

      {/* Top rankings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🏆 Top selling (by qty)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topSelling.map((item, i) => (
                <div key={item.menuItemId} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.quantity} qty</p>
                    <p className="text-xs text-muted-foreground">{formatINR(item.netSales)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">💰 Top revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topRevenue.map((item, i) => (
                <div key={item.menuItemId} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700">{formatINR(item.netSales)}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} qty</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left">
                <tr>
                  <Th>Item</Th>
                  <Th>Category</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Gross Sales</Th>
                  <Th align="right">Discount</Th>
                  <Th align="right">Net Sales</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.menuItemId} className="border-b last:border-0 hover:bg-slate-50">
                    <Td>
                      <div className="flex items-center gap-2">
                        {item.image && <img src={item.image} alt="" className="h-8 w-8 rounded object-cover" />}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.isVeg ? '🟢 Veg' : '🔴 Non-veg'} {item.isSpicy && '· 🌶 Spicy'}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>{item.categoryName || '—'}</Td>
                    <Td align="right" className="font-medium">{item.quantity}</Td>
                    <Td align="right">{formatINR(item.grossSales)}</Td>
                    <Td align="right" className="text-red-600">{item.discount > 0 ? `-${formatINR(item.discount)}` : '—'}</Td>
                    <Td align="right" className="font-bold">{formatINR(item.netSales)}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 bg-orange-50 font-bold">
                <tr>
                  <Td>Total</Td>
                  <Td>—</Td>
                  <Td align="right">{data.summary.totalQuantity}</Td>
                  <Td align="right">{formatINR(data.summary.totalGrossSales)}</Td>
                  <Td align="right" className="text-red-600">{data.summary.totalDiscount > 0 ? `-${formatINR(data.summary.totalDiscount)}` : '—'}</Td>
                  <Td align="right">{formatINR(data.summary.totalNetSales)}</Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// CATEGORIES REPORT
// ============================================================================

interface CategoryRow {
  categoryId: string
  name: string
  icon: string | null
  quantity: number
  revenue: number
  percentage: number
}

function CategoriesReport({ queryString }: { queryString: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-categories', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/categories?${queryString}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load categories report')
      const json = await res.json()
      return json.data as {
        range: string
        categories: CategoryRow[]
        totalRevenue: number
        totalQuantity: number
      }
    },
  })

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
  if (isError) return <EmptyState title="Couldn't load categories report" />
  if (!data) return null

  const chartData = data.categories.map((c) => ({
    name: c.name,
    revenue: c.revenue,
    percentage: c.percentage,
  }))

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total revenue" value={formatINR(data.totalRevenue)} icon={<IndianRupee className="h-4 w-4" />} tone="orange" />
        <KpiCard label="Items sold" value={String(data.totalQuantity)} icon={<Package className="h-4 w-4" />} tone="green" />
        <KpiCard label="Categories" value={String(data.categories.length)} icon={<PieChartIcon className="h-4 w-4" />} tone="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e: any) => `${e.percentage}%`}
                  >
                    {chartData.map((_, i) => (
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

        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 30, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => formatINR(v)}
                  />
                  <Bar dataKey="revenue" fill="#EA580C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left">
                <tr>
                  <Th>Category</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Revenue</Th>
                  <Th align="right">Share</Th>
                  <Th>Distribution</Th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c, i) => (
                  <tr key={c.categoryId} className="border-b last:border-0 hover:bg-slate-50">
                    <Td>
                      <span className="mr-2">{c.icon}</span>
                      <span className="font-medium">{c.name}</span>
                    </Td>
                    <Td align="right">{c.quantity}</Td>
                    <Td align="right" className="font-bold">{formatINR(c.revenue)}</Td>
                    <Td align="right">
                      <Badge variant="outline" className="font-bold">
                        {c.percentage}%
                      </Badge>
                    </Td>
                    <Td>
                      <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.percentage}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 bg-orange-50 font-bold">
                <tr>
                  <Td>Total</Td>
                  <Td align="right">{data.totalQuantity}</Td>
                  <Td align="right">{formatINR(data.totalRevenue)}</Td>
                  <Td align="right">100%</Td>
                  <Td>—</Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// PAYMENTS REPORT
// ============================================================================

interface PaymentMethodRow {
  method: string
  collected: number
  pending: number
  failed: number
  refunded: number
  count: number
  total: number
}

function PaymentsReport({ queryString }: { queryString: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-payments', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/payments?${queryString}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load payments report')
      const json = await res.json()
      return json.data as {
        range: string
        byMethod: PaymentMethodRow[]
        byStatus: {
          successful: { amount: number; count: number }
          pending: { amount: number; count: number }
          failed: { amount: number; count: number }
          refunded: { amount: number; count: number }
        }
        collected: number
        pending: number
        failed: number
        refunded: number
        totalOrders: number
      }
    },
  })

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
  if (isError) return <EmptyState title="Couldn't load payments report" />
  if (!data) return null

  const methodLabels: Record<string, string> = {
    UPI: 'UPI',
    CARD: 'Card',
    CASH: 'Cash',
    COUNTER: 'Pay at Counter',
    WALLET: 'Wallet',
  }

  const statusData = [
    { name: 'Successful', value: data.byStatus.successful.amount, count: data.byStatus.successful.count, color: '#16A34A' },
    { name: 'Pending', value: data.byStatus.pending.amount, count: data.byStatus.pending.count, color: '#F59E0B' },
    { name: 'Failed', value: data.byStatus.failed.amount, count: data.byStatus.failed.count, color: '#EF4444' },
    { name: 'Refunded', value: data.byStatus.refunded.amount, count: data.byStatus.refunded.count, color: '#9333EA' },
  ]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Collected" value={formatINR(data.collected)} icon={<IndianRupee className="h-4 w-4" />} tone="green" />
        <KpiCard label="Pending" value={formatINR(data.pending)} icon={<CreditCard className="h-4 w-4" />} tone="orange" />
        <KpiCard label="Failed" value={formatINR(data.failed)} icon={<CreditCard className="h-4 w-4" />} tone="red" />
        <KpiCard label="Refunded" value={formatINR(data.refunded)} icon={<CreditCard className="h-4 w-4" />} tone="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* By Method table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment & Collection by method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.byMethod.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No payment activity in this range</p>
              ) : (
                data.byMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-semibold">{methodLabels[m.method] || m.method}</p>
                      <p className="text-xs text-muted-foreground">{m.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-700">{formatINR(m.collected)}</p>
                      {m.pending > 0 && <p className="text-[10px] text-amber-600">pending {formatINR(m.pending)}</p>}
                      {m.refunded > 0 && <p className="text-[10px] text-purple-600">refunded {formatINR(m.refunded)}</p>}
                    </div>
                  </div>
                ))
              )}
              {data.byMethod.length > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 p-3 border-2 border-emerald-200">
                  <p className="text-sm font-bold text-emerald-900">Total Collected</p>
                  <p className="text-xl font-extrabold text-emerald-700">{formatINR(data.collected)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment status breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(e: any) => e.count > 0 ? `${e.name}: ${e.count}` : ''}
                  >
                    {statusData.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => formatINR(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-auto font-bold">{formatINR(s.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full method table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left">
                <tr>
                  <Th>Method</Th>
                  <Th align="right">Transactions</Th>
                  <Th align="right">Successful</Th>
                  <Th align="right">Pending</Th>
                  <Th align="right">Failed</Th>
                  <Th align="right">Refunded</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.byMethod.map((m) => (
                  <tr key={m.method} className="border-b last:border-0 hover:bg-slate-50">
                    <Td className="font-medium">{methodLabels[m.method] || m.method}</Td>
                    <Td align="right">{m.count}</Td>
                    <Td align="right" className="font-medium text-emerald-700">{formatINR(m.collected)}</Td>
                    <Td align="right" className="text-amber-600">{m.pending > 0 ? formatINR(m.pending) : '—'}</Td>
                    <Td align="right" className="text-red-600">{m.failed > 0 ? formatINR(m.failed) : '—'}</Td>
                    <Td align="right" className="text-purple-600">{m.refunded > 0 ? formatINR(m.refunded) : '—'}</Td>
                    <Td align="right" className="font-bold">{formatINR(m.total)}</Td>
                  </tr>
                ))}
                {data.byMethod.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No payment activity in this range</td></tr>
                )}
              </tbody>
              {data.byMethod.length > 0 && (
                <tfoot className="border-t-2 bg-orange-50 font-bold">
                  <tr>
                    <Td>Total</Td>
                    <Td align="right">{data.byMethod.reduce((s, m) => s + m.count, 0)}</Td>
                    <Td align="right" className="text-emerald-700">{formatINR(data.collected)}</Td>
                    <Td align="right" className="text-amber-600">{formatINR(data.pending)}</Td>
                    <Td align="right" className="text-red-600">{formatINR(data.failed)}</Td>
                    <Td align="right" className="text-purple-600">{formatINR(data.refunded)}</Td>
                    <Td align="right">{formatINR(data.collected + data.pending + data.failed + data.refunded)}</Td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'orange' | 'green' | 'blue' | 'purple' | 'red'
}) {
  const toneClass = {
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    purple: 'bg-violet-50 text-violet-700',
    red: 'bg-red-50 text-red-700',
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

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </th>
  )
}

function Td({ children, align = 'left', className = '' }: { children: React.ReactNode; align?: 'left' | 'right'; className?: string }) {
  return (
    <td className={`px-4 py-2 ${align === 'right' ? 'text-right' : ''} ${className}`}>
      {children}
    </td>
  )
}
