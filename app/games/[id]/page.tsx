import { Suspense } from "react"
import GamePageClient from "./game-page-client"
import { gameRegistry } from "@/lib/game-registry"

export function generateStaticParams() {
  return gameRegistry.map((game) => ({
    id: game.id,
  }))
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <GamePageClient params={params} />
    </Suspense>
  )
}

function GameSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-9 bg-muted rounded-md" />
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="w-32 h-6 bg-muted rounded" />
              <div className="w-48 h-4 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 py-6">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    </div>
  )
}
