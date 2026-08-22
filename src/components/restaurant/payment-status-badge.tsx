import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/lib/types'

const MAP: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pending',
    className:
      'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  PROCESSING: {
    label: 'Processing',
    className:
      'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  PAID: {
    label: 'Paid',
    className:
      'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
  },
  FAILED: {
    label: 'Failed',
    className:
      'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  },
  REFUNDED: {
    label: 'Refunded',
    className:
      'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus | string
  className?: string
}) {
  const cfg = MAP[status as PaymentStatus] || {
    label: status,
    className: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', cfg.className, className)}
    >
      {cfg.label}
    </Badge>
  )
}
