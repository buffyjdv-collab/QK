import { cn } from '@/lib/utils'

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0'
  return inrFormatter.format(amount)
}

interface PriceProps {
  amount: number | null | undefined
  className?: string
  muted?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Price({ amount, className, muted, size = 'md' }: PriceProps) {
  const sizeCls = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  }[size]
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        sizeCls,
        muted && 'text-muted-foreground',
        className,
      )}
    >
      {formatINR(amount)}
    </span>
  )
}
