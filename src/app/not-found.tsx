import Link from 'next/link'
import { QrCode, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
          <QrCode className="h-10 w-10 text-orange-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">404</h1>
          <h2 className="text-xl font-semibold text-slate-700">Page Not Found</h2>
          <p className="text-sm text-slate-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          QR Dine — Restaurant Quick-Order Platform
        </p>
      </div>
    </div>
  )
}
