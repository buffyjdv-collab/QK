'use client'

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
  Building2,
  Globe2,
  CreditCard,
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
  /** 'platform' group is super-admin-only and shown above restaurant nav. */
  group?: 'platform' | 'restaurant'
}

const NAV: NavItem[] = [
  // Platform-level (super admin only)
  { key: 'platform-dashboard', label: 'Platform Overview', icon: Globe2, group: 'platform', permission: 'restaurants.manage' },
  { key: 'platform-restaurants', label: 'Tenants', icon: Building2, group: 'platform', permission: 'restaurants.manage' },
  { key: 'platform-users', label: 'All Users', icon: Users, group: 'platform', permission: 'restaurants.manage' },
  { key: 'platform-fees', label: 'Platform Fees', icon: CreditCard, group: 'platform', permission: 'restaurants.manage' },
  { key: 'platform-fee-config', label: 'Fee Configuration', icon: CreditCard, group: 'platform', permission: 'restaurants.manage' },
  { key: 'platform-plans', label: 'Plans & Billing', icon: CreditCard, group: 'platform', permission: 'restaurants.manage' },

  // Restaurant-level
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view', group: 'restaurant' },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, permission: 'orders.view', group: 'restaurant' },
  { key: 'menu', label: 'Menu', icon: UtensilsCrossed, permission: 'menu.update', group: 'restaurant' },
  { key: 'modifiers', label: 'Modifiers', icon: UtensilsCrossed, permission: 'menu.update', group: 'restaurant' },
  { key: 'tables', label: 'Tables & QR', icon: Table2, permission: 'tables.manage', group: 'restaurant' },
  { key: 'kitchen', label: 'Kitchen', icon: ChefHat, permission: 'kitchen.view', group: 'restaurant' },
  { key: 'waiter', label: 'Waiter', icon: BellRing, permission: 'waiter.view', group: 'restaurant' },
  { key: 'billing', label: 'Billing', icon: Receipt, permission: 'billing.manage', group: 'restaurant' },
  { key: 'reports', label: 'Reports', icon: BarChart3, permission: 'reports.view', group: 'restaurant' },
  { key: 'staff', label: 'Staff', icon: Users, permission: 'staff.manage', group: 'restaurant' },
  { key: 'settings', label: 'Settings', icon: Settings, permission: 'settings.manage', group: 'restaurant' },
]

export function Sidebar({
  role,
  activeKey,
  restaurantName,
  userName,
  onNavigate,
}: {
  role?: string | null
  activeKey: string
  restaurantName?: string | null
  userName?: string | null
  onNavigate?: (key: string) => void
}) {
  // Handle undefined/null role gracefully - show all items if no role (loading state)
  // or filter by permission if role exists
  const visible = NAV.filter(
    (n) => !n.permission || !role || hasPermission(role, n.permission),
  )
  
  // Debug: log role and visible items count
  console.log('[Sidebar] Role:', role, 'Visible items:', visible.length)
  const platformItems = visible.filter((n) => n.group === 'platform')
  const restaurantItems = visible.filter((n) => n.group === 'restaurant')
  const isPlatformView = activeKey.startsWith('platform-')

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
          <QrCode className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">
            {role === 'SUPER_ADMIN' && isPlatformView
              ? 'QR Dine Platform'
              : restaurantName || 'QR Dine'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {role === 'SUPER_ADMIN' && isPlatformView
              ? 'Super Admin Console'
              : 'Restaurant OS'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {/* Platform section */}
        {platformItems.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Platform
            </p>
            {platformItems.map((item) => (
              <NavButton key={item.key} item={item} activeKey={activeKey} onNavigate={onNavigate} />
            ))}
            <div className="my-2 border-t border-slate-100" />
            <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {role === 'SUPER_ADMIN' ? 'Tenant view' : 'Restaurant'}
            </p>
          </>
        )}

        {/* Restaurant section */}
        {restaurantItems.map((item) => (
          <NavButton key={item.key} item={item} activeKey={activeKey} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-slate-200 p-2">
        <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-900">{userName || 'Signed in'}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <RoleBadge role={role} />
          </div>
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

// Role badge component with color coding
function RoleBadge({ role }: { role?: string | null }) {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
        Loading...
      </span>
    )
  }

  const roleConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    RESTAURANT_OWNER: { label: 'Owner', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    MANAGER: { label: 'Manager', color: 'text-green-700', bgColor: 'bg-green-100' },
    KITCHEN_STAFF: { label: 'Chef', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    WAITER: { label: 'Waiter', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    CASHIER: { label: 'Cashier', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  }

  const config = roleConfig[role] || { label: role.replace('_', ' '), color: 'text-gray-700', bgColor: 'bg-gray-100' }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color} ${config.bgColor}`}>
      {config.label}
    </span>
  )
}

function NavButton({
  item,
  activeKey,
  onNavigate,
}: {
  item: NavItem
  activeKey: string
  onNavigate?: (key: string) => void
}) {
  const Icon = item.icon
  const active = activeKey === item.key
  return (
    <button
      onClick={() => onNavigate?.(item.key)}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? item.group === 'platform'
            ? 'bg-slate-900 text-white'
            : 'bg-orange-50 text-orange-700'
          : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          active
            ? item.group === 'platform'
              ? 'text-white'
              : 'text-orange-600'
            : 'text-slate-500',
        )}
      />
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  )
}
