import { Suspense } from "react"
import GamesPageClient from "./games-page-client"

export default function GamesPage() {
  return (
    <Suspense fallback={<GamesPageSkeleton />}>
      <GamesPageClient />
    </Suspense>
  )
}

function GamesPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="text-center mb-10 space-y-3">
        <div className="w-64 h-10 bg-muted rounded mx-auto" />
        <div className="w-96 h-5 bg-muted rounded mx-auto" />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="w-20 h-9 bg-muted rounded-md" />
          ))}
        </div>
        <div className="w-[200px] h-9 bg-muted rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <div className="w-12 h-12 bg-muted rounded-xl" />
            <div className="flex justify-between">
              <div className="w-24 h-5 bg-muted rounded" />
              <div className="w-16 h-5 bg-muted rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-muted rounded" />
              <div className="w-3/4 h-4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
