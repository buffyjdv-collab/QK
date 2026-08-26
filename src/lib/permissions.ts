// Client-safe permission utilities
// This file contains ONLY data/constants - no server-side imports

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<string, string[]> = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'KITCHEN_STAFF', 'WAITER', 'CASHIER'],
  RESTAURANT_OWNER: ['RESTAURANT_OWNER', 'MANAGER', 'KITCHEN_STAFF', 'WAITER', 'CASHIER'],
  MANAGER: ['MANAGER', 'KITCHEN_STAFF', 'WAITER', 'CASHIER'],
  KITCHEN_STAFF: ['KITCHEN_STAFF'],
  WAITER: ['WAITER'],
  CASHIER: ['CASHIER'],
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  RESTAURANT_OWNER: 'Restaurant Owner',
  MANAGER: 'Manager',
  KITCHEN_STAFF: 'Kitchen Staff',
  WAITER: 'Waiter',
  CASHIER: 'Cashier',
}

// Permission matrix: which roles can access which feature areas
export const PERMISSIONS: Record<string, string[]> = {
  // Admin/dashboard access
  'dashboard.view': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'CASHIER'],
  // Menu management
  'menu.create': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER'],
  'menu.update': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER'],
  'menu.delete': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER'],
  // Table & QR management
  'tables.manage': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER'],
  // Order management
  'orders.view': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'KITCHEN_STAFF', 'WAITER', 'CASHIER'],
  'orders.update_status': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'KITCHEN_STAFF', 'WAITER'],
  'orders.cancel': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'CASHIER'],
  // Kitchen display
  'kitchen.view': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'KITCHEN_STAFF'],
  // Waiter
  'waiter.view': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER'],
  // Billing & payments
  'billing.manage': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'CASHIER'],
  'payments.verify': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'CASHIER'],
  // Reports
  'reports.view': ['SUPER_ADMIN', 'RESTAURANT_OWNER', 'MANAGER', 'CASHIER'],
  // Staff management
  'staff.manage': ['SUPER_ADMIN', 'RESTAURANT_OWNER'],
  // Restaurant settings
  'settings.manage': ['SUPER_ADMIN', 'RESTAURANT_OWNER'],
  // Multi-restaurant management (super admin only)
  'restaurants.manage': ['SUPER_ADMIN'],
}

export function hasPermission(role: string, permission: string): boolean {
  const allowed = PERMISSIONS[permission]
  if (!allowed) return false
  return allowed.includes(role)
}

export function canAccessRole(actorRole: string, targetRole: string): boolean {
  const allowed = ROLE_HIERARCHY[actorRole] || []
  return allowed.includes(targetRole)
}
