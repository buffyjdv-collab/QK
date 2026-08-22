'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Table2,
  ChefHat,
  BellRing,
  Receipt,
  BarChart3,
  Users,
  Settings,
  QrCode,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { hasPermission } from '@/lib/auth'
import type { Role } from '@/lib/types'

interface NavItem {
  key: string
  label: string
  icon: any
  permission?: string
  roles?: Role[]
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, permission: 'orders.view' },
  { key: 'menu', label: 'Menu', icon: UtensilsCrossed, permission: 'menu.update' },
  { key: 'modifiers', label: 'Modifiers', icon: UtensilsCrossed, permission: 'menu.update' },
  { key: 'tables', label: 'Tables & QR', icon: Table2, permission: 'tables.manage' },
  { key: 'kitchen', label: 'Kitchen', icon: ChefHat, permission: 'kitchen.view' },
  { key: 'waiter', label: 'Waiter', icon: BellRing, permission: 'waiter.view' },
  { key: 'billing', label: 'Billing', icon: Receipt, permission: 'billing.manage' },
  { key: 'reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
  { key: 'staff', label: 'Staff', icon: Users, permission: 'staff.manage' },
  { key: 'settings', label: 'Settings', icon: Settings, permission: 'settings.manage' },
]

export function Sidebar({
  role,
  activeKey,
  restaurantName,
  userName,
  onNavigate,
}: {
  role: string
  activeKey: string
  restaurantName?: string | null
  userName?: string | null
  onNavigate?: (key: string) => void
}) {
  const visible = NAV.filter(
    (n) => !n.permission || hasPermission(role, n.permission),
  )

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
          <QrCode className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">
            {restaurantName || 'QR Dine'}
          </p>
          <p className="text-[10px] text-muted-foreground">Restaurant OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {visible.map((item) => {
          const Icon = item.icon
          const active = activeKey === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-orange-600' : 'text-slate-500')} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-2">
        <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-900">{userName || 'Signed in'}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{(role || 'staff').replace('_', ' ')}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:bg-red-50 hover:text-red-600"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
