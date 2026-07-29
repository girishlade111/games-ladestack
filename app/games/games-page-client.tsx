"use client"

import { useState, useMemo, memo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { gameRegistry, categories } from "@/lib/game-registry"
import { getIcon } from "@/lib/icons"
import type { GameMeta } from "@/lib/types"
import { Search, Play, Star, Grid3X3, List } from "lucide-react"

const GameCard = memo(function GameCard({ game }: { game: GameMeta }) {
  const Icon = getIcon(game.icon)
  return (
    <Link href={`/games/${game.id}`} className="group block h-full">
      <div className="relative overflow-hidden rounded-xl border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-6 h-full flex flex-col">
        {game.isNew && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full z-10">
            NEW
          </div>
        )}
        <div className={`w-12 h-12 rounded-xl ${game.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">{game.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{game.category}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{game.description}</p>
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {game.difficulty && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {game.difficulty}
              </span>
            )}
            {game.avgPlayTime && <span>{game.avgPlayTime}</span>}
          </div>
          <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  )
})

export default function GamesPageClient() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "All"
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredGames = useMemo(() => {
    let result = selectedCategory === "All" ? gameRegistry : gameRegistry.filter((g) => g.category === selectedCategory)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query) ||
          (g.tags || []).some((t) => t.toLowerCase().includes(query))
      )
    }
    return result
  }, [selectedCategory, searchQuery])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Game Library</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Browse our collection of {gameRegistry.length}+ free browser games across {categories.filter((c) => c.id !== "All").length} categories.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[240px]"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No games found matching your criteria.</p>
          <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "flex flex-col gap-3"
        }>
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {filteredGames.length > 0 && (
        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            Showing {filteredGames.length} of {gameRegistry.length} games
          </p>
        </div>
      )}
    </div>
  )
}
