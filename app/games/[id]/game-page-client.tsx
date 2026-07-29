"use client"

import { use, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { getGameById, gameRegistry } from "@/lib/game-registry"
import GameIcon from "@/components/game-icon"
import { getGameComponent, isValidGameId } from "@/lib/game-loader"
import { ArrowLeft, Keyboard, MousePointerClick, Star, Clock, Users } from "lucide-react"

const RelatedGames = dynamic(() => import("./related-games"), {
  loading: () => <div className="border-t bg-muted/20 h-40 animate-pulse" />,
})

function GameLoading({ title }: { title?: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">{title ? `Loading ${title}...` : "Loading game..."}</p>
    </div>
  )
}

export default function GamePageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const game = getGameById(id)

  if (!game || !isValidGameId(id)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Game Not Found</h1>
        <p className="text-muted-foreground mb-8">The game you are looking for does not exist.</p>
        <Link href="/games">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>
    )
  }

  const GameComp = getGameComponent(id)

  const relatedGames = gameRegistry
    .filter((g) => g.id !== id && g.category === game.category)
    .slice(0, 6)
    .map((g) => ({ id: g.id, color: g.color, title: g.title }))

  return (
    <div className="flex flex-col">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className={`w-10 h-10 rounded-lg ${game.color} flex items-center justify-center text-white shrink-0`}>
                <GameIcon gameId={game.id} size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{game.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{game.category}</span>
                  {game.difficulty && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{game.difficulty}</span>}
                  {game.avgPlayTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{game.avgPlayTime}</span>}
                  {game.playerCount && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{game.playerCount}</span>}
                </div>
              </div>
            </div>
          </div>
          {game.controls && game.controls.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Controls:</span>
              {game.controls.map((control) => (
                <span key={control} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs text-foreground">
                  {(control.includes("Key") || control.includes("Arrow") || control.includes("Space")) ? <Keyboard className="w-3 h-3" /> : (control.includes("Click") || control.includes("Tap")) ? <MousePointerClick className="w-3 h-3" /> : null}
                  {control}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 py-6">
        <Suspense fallback={<GameLoading title={game.title} />}>
          <GameComp />
        </Suspense>
      </div>
      {relatedGames.length > 0 && (
        <Suspense fallback={<div className="border-t bg-muted/20 h-40 animate-pulse" />}>
          <RelatedGames data={{ games: relatedGames }} />
        </Suspense>
      )}
    </div>
  )
}
