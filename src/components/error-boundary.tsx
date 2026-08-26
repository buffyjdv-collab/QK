'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('[ErrorBoundary] Client-side error occurred:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
    })
  }, [error])

  // Determine error type for better messaging
  const isAuthError = error.message?.includes('session') || 
                      error.message?.includes('auth') ||
                      error.message?.includes('token')
  const isNetworkError = error.message?.includes('fetch') ||
                         error.message?.includes('network') ||
                         error.message?.includes('ECONNREFUSED')
  const isEnvError = error.message?.includes('DATABASE_URL') ||
                     error.message?.includes('NEXTAUTH')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        {/* Error Message */}
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Application Error
          </h2>
          <p className="text-sm text-slate-600">
            {isAuthError && 'Authentication failed. Please try signing in again.'}
            {isNetworkError && 'Network connection issue. Please check your internet.'}
            {isEnvError && 'Server configuration error. Please contact support.'}
            {!isAuthError && !isNetworkError && !isEnvError && 
              'A client-side error occurred while loading the application.'}
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="rounded-lg border border-red-200 bg-red-50">
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100">
              <Bug className="inline mr-2 h-4 w-4" />
              Technical Details
            </summary>
            <div className="px-4 pb-4 space-y-2">
              <div className="text-xs font-mono text-red-700 bg-white rounded p-2 overflow-auto max-h-40">
                <strong>Error:</strong> {error.name}<br/>
                <strong>Message:</strong> {error.message}<br/>
                {error.digest && (
                  <>
                    <strong>Digest:</strong> {error.digest}
                  </>
                )}
              </div>
              <pre className="text-xs font-mono text-red-600 bg-white rounded p-2 overflow-auto max-h-32">
                {error.stack}
              </pre>
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                // Clear any stale session data
                localStorage.clear()
                sessionStorage.clear()
                window.location.href = '/'
              }}
            >
              Sign Out & Reset
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="rounded-lg bg-blue-50 p-4 space-y-2">
          <p className="text-sm font-medium text-blue-800">
            Still seeing this error?
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Clear browser cache and cookies</li>
            <li>Try in incognito/private mode</li>
            <li>Check that environment variables are set correctly</li>
            <li>Contact support with the error details above</li>
          </ul>
        </div>

        <p className="text-xs text-center text-slate-500">
          QR Dine v1.0 • Error ID: {error.digest || 'unknown'}
        </p>
      </div>
    </div>
  )
}
