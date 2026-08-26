'use client'

import { useIsMobile } from '@/hooks/use-mobile'
import { useCustomerCart } from '@/stores/customer-cart'
import { Utensils, ShoppingCart, Receipt, ClipboardList } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type View = 'menu' | 'cart' | 'checkout' | 'track' | 'bill'

interface MobileBottomNavProps {
  currentView: View
  onViewChange: (view: View) => void
  placedOrderId: string | null
  onOpenCart: () => void
}

const navItems = [
  { 
    id: 'menu' as View, 
    label: 'Menu', 
    icon: Utensils,
    showAlways: true 
  },
  { 
    id: 'cart' as View, 
    label: 'Cart', 
    icon: ShoppingCart,
    showAlways: true 
  },
  { 
    id: 'track' as View, 
    label: 'Orders', 
    icon: ClipboardList,
    requiresOrder: true 
  },
  { 
    id: 'bill' as View, 
    label: 'Bill', 
    icon: Receipt,
    requiresOrder: true 
  },
]

export function MobileBottomNav({ 
  currentView, 
  onViewChange,
  placedOrderId,
  onOpenCart 
}: MobileBottomNavProps) {
  const isMobile = useIsMobile()
  const cartItems = useCustomerCart((s) => s.items)
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Don't render on desktop or if mobile detection hasn't completed
  if (!isMobile) return null

  const handleNavClick = (viewId: View) => {
    if (viewId === 'cart') {
      onOpenCart()
      return
    }
    
    if (viewId === 'track' || viewId === 'bill') {
      if (!placedOrderId) return
    }
    
    onViewChange(viewId)
    
    // Update URL hash for bookmarking
    if (viewId === 'menu') {
      window.location.hash = ''
    } else {
      window.location.hash = viewId
    }
  }

  const visibleItems = navItems.filter(item => {
    if (item.showAlways) return true
    if (item.requiresOrder) return !!placedOrderId
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Safe area padding for notched devices */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/60 supports-[backdrop-filter]:bg-white/70">
        <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            const isDisabled = item.requiresOrder && !placedOrderId
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                disabled={isDisabled}
                className={cn(
                  "relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500",
                  isActive && "text-orange-600",
                  !isActive && !isDisabled && "text-gray-500 hover:text-gray-700 active:text-gray-800",
                  isDisabled && "text-gray-300 cursor-not-allowed"
                )}
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-orange-600"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* Icon with badge */}
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-transform duration-200",
                      isActive && "scale-110",
                      !isActive && "scale-100"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  {/* Cart badge */}
                  {item.id === 'cart' && cartItemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                    >
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </motion.span>
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "mt-1 text-[10px] font-medium leading-tight",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                
                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="mt-0.5 h-1 w-1 rounded-full bg-orange-600"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
