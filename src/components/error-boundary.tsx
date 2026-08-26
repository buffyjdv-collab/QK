'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ErrorBoundary] Client error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-600">
            A client-side error occurred while loading the application.
            This could be due to a temporary issue or misconfiguration.
          </p>
          
          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 text-left">
              <summary className="cursor-pointer text-xs font-mono text-red-600 hover:text-red-800">
                Error Details
              </summary>
              <pre className="mt-2 rounded-lg bg-red-50 p-3 text-xs overflow-auto max-h-40">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="space-y-2">
          <Button
            onClick={reset}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go Home
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          If this persists, please check your environment variables and database connection.
        </p>
      </div>
    </div>
  )
}
