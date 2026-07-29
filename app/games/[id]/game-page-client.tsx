"use client"

import { use, Suspense, useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { getGameById, gameRegistry } from "@/lib/game-registry"
import GameLogo from "@/components/game-logo"
import { getGameComponent, isValidGameId } from "@/lib/game-loader"
import { ArrowLeft, Keyboard, MousePointerClick, Star, Clock, Users, Maximize, Minimize } from "lucide-react"

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
  const stageRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Request the browser's native fullscreen so the game fills the whole display.
  // If the browser refuses (or the API is missing) the CSS overlay below still
  // gives a full-viewport experience, so the button never becomes a dead end.
  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true)
    const el = stageRef.current
    if (el && !document.fullscreenElement) {
      void el.requestFullscreen?.().catch(() => {})
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false)
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  // Esc leaves native fullscreen on its own - mirror that back into our state.
  useEffect(() => {
    const syncFullscreen = () => {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener("fullscreenchange", syncFullscreen)
    return () => document.removeEventListener("fullscreenchange", syncFullscreen)
  }, [])

  // Fallback for the CSS-only overlay, where no fullscreenchange event fires.
  useEffect(() => {
    if (!isFullscreen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) exitFullscreen()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isFullscreen, exitFullscreen])

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
      {!isFullscreen && (
        <div className="border-b bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <GameLogo gameId={game.id} size={40} className="shrink-0" />
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
              <Button onClick={enterFullscreen} className="shrink-0" title="Play this game in full screen">
                <Maximize className="w-4 h-4 mr-2" />
                Full Screen Game View
              </Button>
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
      )}

      {/* The stage stays mounted in both modes so toggling never restarts the game. */}
      <div
        ref={stageRef}
        className={isFullscreen ? "fixed inset-0 z-[60] bg-background overflow-auto" : "flex-1 py-6"}
      >
        {isFullscreen && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-2.5 border-b bg-background/85 backdrop-blur">
            <div className="flex items-center gap-3 min-w-0">
              <GameLogo gameId={game.id} size={28} rounded="rounded-lg" className="shrink-0" />
              <span className="font-semibold truncate">{game.title}</span>
              <span className="hidden sm:inline text-xs text-muted-foreground">Full Screen Game View</span>
            </div>
            <Button variant="outline" size="sm" onClick={exitFullscreen} className="shrink-0" title="Exit full screen (Esc)">
              <Minimize className="w-4 h-4 mr-2" />
              Exit Full Screen Game View
            </Button>
          </div>
        )}
        <Suspense fallback={<GameLoading title={game.title} />}>
          <GameComp onBack={() => router.back()} themeColor={game.themeColor} />
        </Suspense>
      </div>

      {!isFullscreen && relatedGames.length > 0 && (
        <Suspense fallback={<div className="border-t bg-muted/20 h-40 animate-pulse" />}>
          <RelatedGames data={{ games: relatedGames }} />
        </Suspense>
      )}
    </div>
  )
}
