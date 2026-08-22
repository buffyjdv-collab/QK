import { cn } from '@/lib/utils'

interface VegBadgeProps {
  isVeg: boolean
  className?: string
}

/**
 * Indian convention veg / non-veg indicator.
 * Green square with green dot = veg; red square with red dot = non-veg.
 */
export function VegBadge({ isVeg, className }: VegBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded-sm border-2',
        isVeg ? 'border-green-600' : 'border-red-600',
        className,
      )}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isVeg ? 'bg-green-600' : 'bg-red-600',
        )}
      />
    </span>
  )
}
