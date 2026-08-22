import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CustomerApp } from '@/components/customer/customer-app'
import { LandingPage } from '@/components/landing-page'
import { AppShell } from '@/components/app-shell'

interface HomePageProps {
  searchParams: Promise<{ table?: string }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const sp = await searchParams
  const tableToken = sp.table

  // Customer flow — no auth required
  if (tableToken) {
    return <CustomerApp token={tableToken} />
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return <LandingPage />
  }

  return <AppShell />
}
