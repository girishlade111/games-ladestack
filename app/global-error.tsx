'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center font-sans">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Application Error</h2>
          <p className="text-gray-600 mb-6 text-sm max-w-md">
            {error?.message || 'A critical error occurred while rendering the application.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
