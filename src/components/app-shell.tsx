'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from './sidebar'
import { Menu as MenuIcon, BellRing, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Lazy load components to prevent initial bundle size issues
const Dashboard = lazy(() => import('./admin/dashboard').then(m => ({ default: m.Dashboard })))
const OrdersManager = lazy(() => import('./admin/orders-manager').then(m => ({ default: m.OrdersManager })))
const MenuManager = lazy(() => import('./admin/menu-manager').then(m => ({ default: m.MenuManager })))
const ModifierGroupsManager = lazy(() => import('./admin/modifier-groups-manager').then(m => ({ default: m.ModifierGroupsManager })))
const TablesManager = lazy(() => import('./admin/tables-manager').then(m => ({ default: m.TablesManager })))
const ReportsManager = lazy(() => import('./admin/reports-manager').then(m => ({ default: m.ReportsManager })))
const SettingsManager = lazy(() => import('./admin/settings-manager').then(m => ({ default: m.SettingsManager })))
const StaffManager = lazy(() => import('./admin/staff-manager').then(m => ({ default: m.StaffManager })))
const BillingManager = lazy(() => import('./admin/billing-manager').then(m => ({ default: m.BillingManager })))
const KitchenDisplay = lazy(() => import('./kitchen/kitchen-display').then(m => ({ default: m.KitchenDisplay })))
const WaiterDashboard = lazy(() => import('./waiter/waiter-dashboard').then(m => ({ default: m.WaiterDashboard })))
const ServiceRequestsWidget = lazy(() => import('./admin/service-requests-widget').then(m => ({ default: m.ServiceRequestsWidget })))
const PlatformDashboard = lazy(() => import('./platform/platform-dashboard').then(m => ({ default: m.PlatformDashboard })))
const PlatformRestaurantsManager = lazy(() => import('./platform/platform-restaurants-manager').then(m => ({ default: m.PlatformRestaurantsManager })))
const PlatformUsersManager = lazy(() => import('./platform/platform-users-manager').then(m => ({ default: m.PlatformUsersManager })))
const PlatformFeeConfig = lazy(() => import('./platform/platform-fee-config').then(m => ({ default: m.PlatformFeeConfig })))
const PlatformFeesCollected = lazy(() => import('./platform/platform-fees-collected').then(m => ({ default: m.PlatformFeesCollected })))

// Loading fallback for lazy components
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}

export function AppShell() {
  const { data: session, status } = useSession()
  const [hash, setHash] = useState<string>('dashboard')
  const qc = useQueryClient()
  const [socketError, setSocketError] = useState(false)

  // Extract role from session with proper typing
  const role = session?.user?.role
  const restaurantName = session?.user?.restaurantName
  const userName = session?.user?.name
  
  // Debug: log session info to help troubleshoot
  console.log('[AppShell] Session status:', status, 'Role:', role, 'User:', userName)

  // Determine default view based on role - only when session is loaded
  useEffect(() => {
    // Don't set default view until session is loaded and we have a role
    if (status === 'loading' || !role) return
    
    const apply = () => {
      try {
        const h = window.location.hash.replace('#', '')
        if (h) {
          setHash(h)
        } else {
          // Default per role
          const def =
            role === 'SUPER_ADMIN'
              ? 'platform-dashboard'
              : role === 'KITCHEN_STAFF'
              ? 'kitchen'
              : role === 'WAITER'
              ? 'waiter'
              : role === 'CASHIER'
              ? 'billing'
              : 'dashboard'
          setHash(def)
          window.location.hash = def
        }
      } catch (err) {
        console.error('[AppShell] Error setting hash:', err)
      }
    }
    
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [status, role])

  // Safe socket event handler with error catching
  const useSafeSocketEvent = (event: string, handler: (payload: any) => void) => {
    useEffect(() => {
      if (socketError) return // Skip if socket has errors
      
      try {
        // Dynamic import to avoid SSR issues
        import('@/hooks/use-socket').then(({ useSocketEvent }) => {
          useSocketEvent(event, handler)
        }).catch(err => {
          console.warn('[AppShell] Socket not available:', err.message)
          setSocketError(true)
        })
      } catch (err) {
        console.warn('[AppShell] Socket error:', err)
        setSocketError(true)
      }
    }, [hash, socketError]) // eslint-disable-line react-hooks/exhaustive-deps
  }

  // Real-time event handling (with error protection)
  useSafeSocketEvent('order:new', (payload: any) => {
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    if (hash === 'kitchen' || hash === 'orders' || hash === 'dashboard') {
      playBeep()
      toast.success(`New order ${payload?.orderNumber}`, {
        description: payload?.tableNumber
          ? `Table ${payload.tableNumber}`
          : undefined,
      })
    }
  })

  useSafeSocketEvent('order:updated', () => {
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
  })

  useSafeSocketEvent('order:statusChanged', () => {
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    qc.invalidateQueries({ queryKey: ['admin-order'] })
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
  })

  useSafeSocketEvent('service:new', (payload: any) => {
    qc.invalidateQueries({ queryKey: ['admin-service-requests'] })
    toast.info(`Service request from Table ${payload?.tableNumber}`, {
      description: payload?.type?.replace('_', ' ').toLowerCase(),
    })
  })

  useSafeSocketEvent('payment:confirmed', () => {
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
  })

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // For mobile, sidebar is hidden behind a toggle
  const [mobileOpen, setMobileOpen] = useState(false)

  // Render content based on current hash with error boundary
  const renderContent = () => {
    try {
      switch (hash) {
        case 'platform-dashboard':
          return <Suspense fallback={<ComponentLoader />}><PlatformDashboard onNavigate={(k) => { window.location.hash = k; setHash(k) }} /></Suspense>
        case 'platform-restaurants':
          return <Suspense fallback={<ComponentLoader />}><PlatformRestaurantsManager /></Suspense>
        case 'platform-users':
          return <Suspense fallback={<ComponentLoader />}><PlatformUsersManager /></Suspense>
        case 'platform-fees':
          return <Suspense fallback={<ComponentLoader />}><PlatformFeesCollected /></Suspense>
        case 'platform-fee-config':
          return <Suspense fallback={<ComponentLoader />}><PlatformFeeConfig /></Suspense>
        case 'platform-plans':
          return <Suspense fallback={<ComponentLoader />}><PlatformRestaurantsManager /></Suspense>
        case 'dashboard':
          return <Suspense fallback={<ComponentLoader />}><Dashboard /></Suspense>
        case 'orders':
          return <Suspense fallback={<ComponentLoader />}><OrdersManager /></Suspense>
        case 'menu':
          return <Suspense fallback={<ComponentLoader />}><MenuManager /></Suspense>
        case 'modifiers':
          return <Suspense fallback={<ComponentLoader />}><ModifierGroupsManager /></Suspense>
        case 'tables':
          return <Suspense fallback={<ComponentLoader />}><TablesManager /></Suspense>
        case 'kitchen':
          return <Suspense fallback={<ComponentLoader />}><KitchenDisplay /></Suspense>
        case 'waiter':
          return <Suspense fallback={<ComponentLoader />}><WaiterDashboard /></Suspense>
        case 'billing':
          return <Suspense fallback={<ComponentLoader />}><BillingManager /></Suspense>
        case 'reports':
          return <Suspense fallback={<ComponentLoader />}><ReportsManager /></Suspense>
        case 'staff':
          return <Suspense fallback={<ComponentLoader />}><StaffManager /></Suspense>
        case 'settings':
          return <Suspense fallback={<ComponentLoader />}><SettingsManager /></Suspense>
        default:
          return <Suspense fallback={<ComponentLoader />}><Dashboard /></Suspense>
      }
    } catch (err) {
      console.error('[AppShell] Error rendering content:', err)
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-4">
            <p className="text-red-600 font-medium">Failed to load this section</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          role={role || null}
          activeKey={hash}
          restaurantName={restaurantName}
          userName={userName}
          onNavigate={(key) => {
            try {
              window.location.hash = key
              setHash(key)
            } catch (err) {
              console.error('[AppShell] Navigation error:', err)
            }
          }}
        />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              role={role || null}
              activeKey={hash}
              restaurantName={restaurantName}
              userName={userName}
              onNavigate={(key) => {
                try {
                  window.location.hash = key
                  setHash(key)
                  setMobileOpen(false)
                } catch (err) {
                  console.error('[AppShell] Mobile navigation error:', err)
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center justify-between border-b bg-white px-4 py-2 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <p className="text-sm font-bold">{restaurantName || 'QR Dine'}</p>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

let audioCtx: AudioContext | null = null
function playBeep() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
    }
    const ctx = audioCtx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    setTimeout(() => {
      osc.stop()
    }, 180)
  } catch {
    // Ignore audio errors silently
  }
}
