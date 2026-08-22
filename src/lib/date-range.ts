/**
 * Shared date-range resolver for reports.
 * Supports: today | yesterday | 7d | 30d | thisMonth | lastMonth | custom
 */
export interface DateRange {
  from: Date
  to: Date
  label: string
}

export function resolveDateRange(
  range: string,
  fromStr?: string | null,
  toStr?: string | null,
): DateRange {
  const now = new Date()
  let from: Date
  let to: Date = new Date(now)
  to.setHours(23, 59, 59, 999)
  let label = range

  switch (range) {
    case 'today': {
      from = new Date(now)
      from.setHours(0, 0, 0, 0)
      label = 'Today'
      break
    }
    case 'yesterday': {
      from = new Date(now)
      from.setDate(from.getDate() - 1)
      from.setHours(0, 0, 0, 0)
      to = new Date(from)
      to.setHours(23, 59, 59, 999)
      label = 'Yesterday'
      break
    }
    case '7d': {
      from = new Date(now)
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)
      label = 'Last 7 days'
      break
    }
    case '30d': {
      from = new Date(now)
      from.setDate(from.getDate() - 29)
      from.setHours(0, 0, 0, 0)
      label = 'Last 30 days'
      break
    }
    case 'thisMonth': {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      to.setHours(23, 59, 59, 999)
      label = 'This month'
      break
    }
    case 'lastMonth': {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to = new Date(now.getFullYear(), now.getMonth(), 0)
      to.setHours(23, 59, 59, 999)
      label = 'Last month'
      break
    }
    case 'custom': {
      if (!fromStr || !toStr) {
        throw new Error('Custom range requires from & to dates')
      }
      from = new Date(fromStr)
      from.setHours(0, 0, 0, 0)
      to = new Date(toStr)
      to.setHours(23, 59, 59, 999)
      label = `${fromStr} to ${toStr}`
      break
    }
    default: {
      from = new Date(now)
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)
      label = 'Last 7 days'
    }
  }

  return { from, to, label }
}

/** Returns array of dates between from and to inclusive (YYYY-MM-DD strings). */
export function enumerateDays(from: Date, to: Date): string[] {
  const days: string[] = []
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}
