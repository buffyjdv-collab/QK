import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SpicyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700',
        className,
      )}
      title="Spicy"
      aria-label="Spicy"
    >
      <Flame className="h-3 w-3" />
    </span>
  )
}
