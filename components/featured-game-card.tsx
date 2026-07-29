"use client"

import Link from "next/link"
import GameLogo from "@/components/game-logo"
import { preloadGame } from "@/lib/game-loader"
import type { GameMeta } from "@/lib/types"
import { Play } from "lucide-react"

export default function FeaturedGameCard({ game }: { game: GameMeta }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group block h-full"
      onMouseEnter={() => preloadGame(game.id)}
      onFocus={() => preloadGame(game.id)}
    >
      <div className="relative overflow-hidden rounded-xl border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-6 h-full flex flex-col">
        {game.isNew && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full z-10">
            NEW
          </div>
        )}
        <GameLogo gameId={game.id} size={48} className="mb-4 group-hover:scale-110 transition-transform" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{game.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{game.description}</p>
        <div className="flex items-center justify-between pt-4 border-t mt-auto">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{game.category}</span>
          <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  )
}
