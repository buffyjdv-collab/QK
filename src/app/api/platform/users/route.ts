import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/** List all users across all tenants. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireSuperAdmin(session)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const search = url.searchParams.get('search') || ''
  const role = url.searchParams.get('role')

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (role) where.role = role

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      phone: true,
      restaurantId: true,
      restaurant: { select: { id: true, name: true, slug: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json({ success: true, data: users })
}
