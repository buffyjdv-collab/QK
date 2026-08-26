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
  Shield,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Key,
  Database,
  Bell,
  Palette,
  Lock,
  Monitor,
  Plug,
  FileText,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { hasPermission, PERMISSIONS, ROLE_LABELS } from '@/lib/permissions'
import type { Role } from '@/lib/types'
import { useState } from 'react'

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

// Role configuration for display
const ROLES_CONFIG = [
  { 
    role: 'SUPER_ADMIN' as Role, 
    label: 'Super Admin', 
    description: 'Full platform access',
    icon: '🛡️',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300'
  },
  { 
    role: 'RESTAURANT_OWNER' as Role, 
    label: 'Restaurant Owner', 
    description: 'Restaurant management',
    icon: '👑',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300'
  },
  { 
    role: 'MANAGER' as Role, 
    label: 'Manager', 
    description: 'Daily operations',
    icon: '📋',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300'
  },
  { 
    role: 'KITCHEN_STAFF' as Role, 
    label: 'Kitchen Staff', 
    description: 'Food preparation',
    icon: '👨‍🍳',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300'
  },
  { 
    role: 'WAITER' as Role, 
    label: 'Waiter', 
    description: 'Table service',
    icon: '🎯',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-300'
  },
  { 
    role: 'CASHIER' as Role, 
    label: 'Cashier', 
    description: 'Payments & billing',
    icon: '💰',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300'
  },
]

// Configuration sections for super admin
const CONFIG_SECTIONS = [
  {
    key: 'general',
    label: 'General',
    icon: Settings,
    items: [
      { key: 'platform-name', label: 'Platform Name', icon: Globe2 },
      { key: 'default-currency', label: 'Currency', icon: CreditCard },
      { key: 'timezone', label: 'Timezone', icon: Monitor },
      { key: 'language', label: 'Language', icon: FileText },
    ]
  },
  {
    key: 'security',
    label: 'Security',
    icon: Lock,
    items: [
      { key: 'auth-settings', label: 'Authentication', icon: Key },
      { key: 'session-timeout', label: 'Session Timeout', icon: Shield },
      { key: 'api-keys', label: 'API Keys', icon: Key },
      { key: 'audit-log', label: 'Audit Log', icon: FileText },
    ]
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: Bell,
    items: [
      { key: 'email-settings', label: 'Email Settings', icon: Bell },
      { key: 'sms-settings', label: 'SMS Settings', icon: BellRing },
      { key: 'push-settings', label: 'Push Notifications', icon: Bell },
    ]
  },
  {
    key: 'integrations',
    label: 'Integrations',
    icon: Plug,
    items: [
      { key: 'payment-gateways', label: 'Payment Gateways', icon: CreditCard },
      { key: 'email-provider', label: 'Email Provider', icon: Plug },
      { key: 'sms-provider', label: 'SMS Provider', icon: Plug },
      { key: 'webhooks', label: 'Webhooks', icon: Plug },
    ]
  },
  {
    key: 'appearance',
    label: 'Appearance',
    icon: Palette,
    items: [
      { key: 'theme', label: 'Theme', icon: Palette },
      { key: 'logo-upload', label: 'Logo & Branding', icon: Globe2 },
      { key: 'custom-css', label: 'Custom CSS', icon: Palette },
    ]
  },
  {
    key: 'data',
    label: 'Data & Storage',
    icon: Database,
    items: [
      { key: 'backup', label: 'Backup & Restore', icon: Database },
      { key: 'export-data', label: 'Export Data', icon: FileText },
      { key: 'storage', label: 'Storage Management', icon: Database },
    ]
  },
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
  const [showRolesPanel, setShowRolesPanel] = useState(false)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [expandedConfigSection, setExpandedConfigSection] = useState<string | null>(null)

  // Handle undefined/null role gracefully - show all items if no role (loading state)
  // or filter by permission if role exists
  const visible = NAV.filter(
    (n) => !n.permission || !role || hasPermission(role, n.permission),
  )
  
  // Debug: log role and visible items count
  console.log('[Sidebar] Role:', role, 'Visible items:', visible.length)
  const platformItems = visible.filter((n) => n.group === 'platform')
  const restaurantItems = visible.filter((n) => n.group === 'restaurant')
  const isPlatformView = activeKey.startsWith('platform-') || activeKey.startsWith('roles-') || activeKey.startsWith('config-')

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-slate-200 bg-white">
      {/* Header */}
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
        {/* Platform section - Super Admin only */}
        {platformItems.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Platform
            </p>
            {platformItems.map((item) => (
              <NavButton key={item.key} item={item} activeKey={activeKey} onNavigate={onNavigate} />
            ))}
            
            {/* Super Admin: Roles & Access Section */}
            {role === 'SUPER_ADMIN' && (
              <>
                <div className="my-2 border-t border-slate-100" />
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Access Control
                </p>
                
                {/* Roles Management Button */}
                <button
                  onClick={() => setShowRolesPanel(!showRolesPanel)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    showRolesPanel 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Shield className={cn('h-4 w-4', showRolesPanel ? 'text-purple-600' : 'text-slate-500')} />
                  <span className="flex-1 text-left">Roles & Permissions</span>
                  <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                    {ROLES_CONFIG.length}
                  </span>
                  {showRolesPanel ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {/* Roles Panel - Expandable */}
                {showRolesPanel && (
                  <div className="ml-4 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    {ROLES_CONFIG.map((roleConfig) => (
                      <RoleCard 
                        key={roleConfig.role} 
                        config={roleConfig}
                        isActive={activeKey === `roles-${roleConfig.role.toLowerCase()}`}
                        onClick={() => onNavigate?.(`roles-${roleConfig.role.toLowerCase()}`)}
                      />
                    ))}
                    
                    {/* Permission Matrix Link */}
                    <button
                      onClick={() => onNavigate?.('roles-matrix')}
                      className="mt-2 flex w-full items-center gap-2 rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-xs text-slate-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      View Full Permission Matrix
                      <ChevronRight className="ml-auto h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* System Configuration Button */}
                <button
                  onClick={() => setShowConfigPanel(!showConfigPanel)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-1',
                    showConfigPanel 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Settings className={cn('h-4 w-4', showConfigPanel ? 'text-emerald-600' : 'text-slate-500')} />
                  <span className="flex-1 text-left">System Configuration</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    {CONFIG_SECTIONS.length}
                  </span>
                  {showConfigPanel ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {/* Config Panel - Expandable with Sections */}
                {showConfigPanel && (
                  <div className="ml-4 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    {CONFIG_SECTIONS.map((section) => (
                      <ConfigSection 
                        key={section.key}
                        section={section}
                        isExpanded={expandedConfigSection === section.key}
                        onToggle={() => setExpandedConfigSection(
                          expandedConfigSection === section.key ? null : section.key
                        )}
                        activeKey={activeKey}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                )}

                <div className="my-2 border-t border-slate-100" />
                <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tenant View
                </p>
              </>
            )}

            {!role?.startsWith('SUPER_ADMIN') && platformItems.length > 0 && (
              <>
                <div className="my-2 border-t border-slate-100" />
                <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Restaurant
                </p>
              </>
            )}
          </>
        )}

        {/* Restaurant section - Show if no platform items or not in platform view */}
        {(platformItems.length === 0 || !role?.startsWith('SUPER_ADMIN')) && (
          <>
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Restaurant
            </p>
          </>
        )}

        {/* Restaurant section items */}
        {restaurantItems.map((item) => (
          <NavButton key={item.key} item={item} activeKey={activeKey} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Footer - User Info */}
      <div className="border-t border-slate-200 p-2">
        <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-900">{userName || 'Signed in'}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <RoleBadge role={role} />
          </div>
          {/* Permissions Summary */}
          {role && <PermissionsList role={role} />}
          
          {/* Super Admin Quick Stats */}
          {role === 'SUPER_ADMIN' && (
            <SuperAdminStats />
          )}
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

// Role Card Component for Roles Panel
function RoleCard({ 
  config, 
  isActive, 
  onClick 
}: { 
  config: typeof ROLES_CONFIG[0]
  isActive: boolean
  onClick: () => void 
}) {
  // Count permissions for this role
  const permissionCount = Object.values(PERMISSIONS)
    .filter(roles => roles.includes(config.role))
    .length

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
        isActive 
          ? `${config.bgColor} ${config.color} border ${config.borderColor}` 
          : 'hover:bg-white'
      )}
    >
      <span className="text-sm">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', isActive ? config.color : 'text-slate-700')}>
          {config.label}
        </p>
        <p className="text-[9px] text-slate-500 truncate">{config.description}</p>
      </div>
      <span className={cn(
        'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
        isActive ? `${config.bgColor} ${config.color}` : 'bg-slate-200 text-slate-600'
      )}>
        {permissionCount}
      </span>
    </button>
  )
}

// Config Section Component
function ConfigSection({ 
  section, 
  isExpanded, 
  onToggle,
  activeKey,
  onNavigate 
}: { 
  section: typeof CONFIG_SECTIONS[0]
  isExpanded: boolean
  onToggle: () => void
  activeKey: string
  onNavigate?: (key: string) => void 
}) {
  const Icon = section.icon
  
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="flex-1 text-left">{section.label}</span>
        <span className="rounded-full bg-slate-100 px-1 py-0.5 text-[9px] text-slate-500">
          {section.items.length}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 text-slate-400" />
        ) : (
          <ChevronDown className="h-3 w-3 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-100 p-1">
          {section.items.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate?.(`config-${item.key}`)}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] transition-colors',
                activeKey === `config-${item.key}`
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <item.icon className="h-3 w-3" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="h-3 w-3 opacity-40" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Super Admin Quick Stats Component
function SuperAdminStats() {
  return (
    <div className="mt-2 border-t border-slate-200 pt-2">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-slate-600">
        <Shield className="h-3 w-3" />
        Platform Overview
      </p>
      <div className="grid grid-cols-2 gap-1">
        <div className="rounded bg-white px-1.5 py-1">
          <p className="text-[9px] text-slate-500">Total Roles</p>
          <p className="text-xs font-bold text-slate-800">{ROLES_CONFIG.length}</p>
        </div>
        <div className="rounded bg-white px-1.5 py-1">
          <p className="text-[9px] text-slate-500">Permissions</p>
          <p className="text-xs font-bold text-slate-800">{Object.keys(PERMISSIONS).length}</p>
        </div>
        <div className="rounded bg-white px-1.5 py-1">
          <p className="text-[9px] text-slate-500">Config Sections</p>
          <p className="text-xs font-bold text-slate-800">{CONFIG_SECTIONS.length}</p>
        </div>
        <div className="rounded bg-white px-1.5 py-1">
          <p className="text-[9px] text-slate-500">Config Items</p>
          <p className="text-xs font-bold text-slate-800">
            {CONFIG_SECTIONS.reduce((acc, s) => acc + s.items.length, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

// Role badge component with color coding and icon
function RoleBadge({ role }: { role?: string | null }) {
  if (!role) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
        <Shield className="h-3 w-3" />
        Loading...
      </span>
    )
  }

  const roleConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '🛡️' },
    RESTAURANT_OWNER: { label: 'Owner', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '👑' },
    MANAGER: { label: 'Manager', color: 'text-green-700', bgColor: 'bg-green-100', icon: '📋' },
    KITCHEN_STAFF: { label: 'Chef', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: '👨‍🍳' },
    WAITER: { label: 'Waiter', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: '🎯' },
    CASHIER: { label: 'Cashier', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: '💰' },
  }

  const config = roleConfig[role] || { label: role.replace('_', ' '), color: 'text-gray-700', bgColor: 'bg-gray-100', icon: '👤' }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color} ${config.bgColor}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

// Permissions list component - shows what permissions the current role has
function PermissionsList({ role }: { role: string }) {
  const [expanded, setExpanded] = useState(false)
  
  // Get all permissions that this role has access to
  const userPermissions = Object.entries(PERMISSIONS)
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([perm]) => perm)
  
  // Group permissions by category for better display
  const permissionGroups = [
    { category: 'Dashboard', permissions: userPermissions.filter(p => p.startsWith('dashboard.')) },
    { category: 'Menu', permissions: userPermissions.filter(p => p.startsWith('menu.')) },
    { category: 'Orders', permissions: userPermissions.filter(p => p.startsWith('orders.')) },
    { category: 'Tables', permissions: userPermissions.filter(p => p.startsWith('tables.')) },
    { category: 'Kitchen', permissions: userPermissions.filter(p => p.startsWith('kitchen.')) },
    { category: 'Service', permissions: userPermissions.filter(p => p.startsWith('waiter.')) },
    { category: 'Billing', permissions: userPermissions.filter(p => p.startsWith('billing.') || p.startsWith('payments.')) },
    { category: 'Reports', permissions: userPermissions.filter(p => p.startsWith('reports.')) },
    { category: 'Staff', permissions: userPermissions.filter(p => p.startsWith('staff.')) },
    { category: 'Staff', permissions: userPermissions.filter(p => p.startsWith('staff.')) },
    { category: 'Settings', permissions: userPermissions.filter(p => p.startsWith('settings.')) },
    { category: 'Platform', permissions: userPermissions.filter(p => p.startsWith('restaurants.')) },
  ].filter(g => g.permissions.length > 0)

  return (
    <div className="mt-2 border-t border-slate-200 pt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-[10px] font-medium text-slate-600 hover:text-slate-900"
      >
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {userPermissions.length} Permissions
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      
      {expanded && (
        <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1">
          {permissionGroups.map(group => (
            <div key={group.category}>
              <p className="[font-size:9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                {group.category}
              </p>
              {group.permissions.map(perm => {
                // Format permission name for display
                const displayName = perm
                  .split('.')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
                
                return (
                  <div 
                    key={perm} 
                    className="flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[9px] text-slate-600"
                    title={perm}
                  >
                    <span className="h-1 w-1 rounded-full bg-green-500" />
                    {displayName}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
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
