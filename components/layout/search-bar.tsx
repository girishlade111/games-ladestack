"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { gameRegistry } from "@/lib/game-registry"
import GameIcon from "@/components/game-icon"
import { Search } from "lucide-react"

export default function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  const filteredGames = searchQuery
    ? gameRegistry.filter(
        (g) =>
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (g.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : []

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search games..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setSearchOpen(true)}
        onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
        className="w-[200px] lg:w-[280px] pl-9 bg-muted/50 border-transparent focus:border-border"
      />
      {searchOpen && searchQuery && filteredGames.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              className="w-full text-left px-4 py-2.5 hover:bg-accent flex items-center gap-3 text-sm transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                router.push(`/games/${game.id}`)
                setSearchQuery("")
                setSearchOpen(false)
              }}
            >
              <div className={`w-8 h-8 rounded-md ${game.color} flex items-center justify-center text-white shrink-0`}>
                <GameIcon gameId={game.id} size={16} />
              </div>
              <div>
                <div className="font-medium text-foreground">{game.title}</div>
                <div className="text-xs text-muted-foreground">{game.category}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
