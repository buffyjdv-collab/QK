'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
import { useAdminReports, api } from '@/hooks/api'
import { LoadingSpinner, EmptyState } from '@/components/restaurant/loading-states'
import { formatINR } from '@/components/restaurant/price'
import { IndianRupee, ShoppingBag, TrendingUp, Receipt, Download, Calendar } from 'lucide-react'
import { toast } from 'sonner'

const PIE_COLORS = ['#EA580C', '#16A34A', '#9333EA', '#0EA5E9', '#F59E0B']

export function ReportsManager() {
  const [range, setRange] = useState('7d')
  const { data, isLoading, error } = useAdminReports(range)

  const handleExport = () => {
    // Trigger CSV download
    const from = data?.from?.slice(0, 10)
    const to = data?.to?.slice(0, 10)
    window.open(`/api/admin/reports/export?from=${from}&to=${to}&format=csv`, '_blank')
    toast.success('CSV export ready')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
    )
  }
  if (error) {
    return (
      <div className="p-4">
        <EmptyState title="Couldn't load reports" description={(error as Error).message} />
      </div>
    )
  }
  if (!data) return null

  const kpis = [
    { label: 'Total sales', value: formatINR(data.totalSales), icon: IndianRupee, tint: 'bg-orange-100 text-orange-700' },
    { label: 'Orders', value: data.orderCount, icon: ShoppingBag, tint: 'bg-amber-100 text-amber-700' },
    { label: 'Avg order value', value: formatINR(data.aov), icon: TrendingUp, tint: 'bg-green-100 text-green-700' },
    { label: 'Tax collected', value: formatINR(data.taxCollected), icon: Receipt, tint: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(data.from).toLocaleDateString('en-IN')} →{' '}
            {new Date(data.to).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-bold">{k.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: any) => formatINR(v)}
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#EA580C"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Category sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {data.categorySales.length === 0 ? (
                <EmptyState title="No sales in this period" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categorySales} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v: any) => formatINR(v)} />
                    <Bar dataKey="revenue" fill="#EA580C" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment method breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentMethodBreakdown}
                    dataKey="total"
                    nameKey="method"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {data.paymentMethodBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatINR(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peak hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(h) => `${h}:00`}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: any) => [`${v} orders`, 'Orders']}
                  labelFormatter={(h) => `${h}:00 – ${h}:59`}
                />
                <Bar dataKey="orders" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Best-selling items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Best-selling items</CardTitle>
        </CardHeader>
        <CardContent>
          {data.bestSellingItems.length === 0 ? (
            <EmptyState title="No item sales in this period" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Item</th>
                    <th className="py-2 pr-2">Quantity sold</th>
                    <th className="py-2 pr-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestSellingItems.map((it: any, idx: number) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">{idx + 1}</td>
                      <td className="py-2 pr-2 font-medium">{it.name}</td>
                      <td className="py-2 pr-2">{it.quantity}</td>
                      <td className="py-2 pr-2 font-semibold">{formatINR(it.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
