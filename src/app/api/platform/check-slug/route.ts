import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Check if a slug is available for a new restaurant. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')

  if (!slug || slug.length < 2) {
    return NextResponse.json({ success: false, error: 'Slug too short' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({
      success: true,
      data: { available: false, reason: 'Only lowercase letters, numbers, and hyphens' },
    })
  }

  const existing = await db.restaurant.findUnique({ where: { slug } })
  return NextResponse.json({
    success: true,
    data: { available: !existing, slug },
  })
}
