"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { gameRegistry } from "@/lib/game-registry"
import GameLogo from "@/components/game-logo"
import { Search } from "lucide-react"

export default function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)

  const filteredGames = searchQuery
    ? gameRegistry.filter(
        (g) =>
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (g.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : []

  const clearPendingClose = () => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const selectGame = (gameId: string) => {
    router.push(`/games/${gameId}`)
    setSearchQuery("")
    setSearchOpen(false)
  }

  const dropdownId = "search-bar-results"
  const showResults = Boolean(searchOpen && searchQuery && filteredGames.length > 0)

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="search"
        role="combobox"
        aria-label="Search games"
        aria-expanded={showResults}
        aria-controls={dropdownId}
        aria-autocomplete="list"
        placeholder="Search games..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          clearPendingClose()
          setSearchOpen(true)
        }}
        onBlur={() => {
          clearPendingClose()
          closeTimeoutRef.current = setTimeout(() => setSearchOpen(false), 200)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filteredGames.length > 0) {
            e.preventDefault()
            selectGame(filteredGames[0].id)
          } else if (e.key === "Escape") {
            setSearchOpen(false)
          }
        }}
        className="w-[200px] lg:w-[280px] pl-9 bg-muted/50 border-transparent focus:border-border"
      />
      {showResults && (
        <div
          id={dropdownId}
          ref={resultsRef}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full mt-1 w-full bg-popover border rounded-lg shadow-lg overflow-hidden z-50"
        >
          {filteredGames.map((game, index) => (
            <div
              key={game.id}
              role="option"
              aria-selected={index === 0}
              tabIndex={-1}
            >
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-accent flex items-center gap-3 text-sm transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectGame(game.id)}
              >
                <GameLogo gameId={game.id} size={32} rounded="rounded-md" />
                <div>
                  <div className="font-medium text-foreground">{game.title}</div>
                  <div className="text-xs text-muted-foreground">{game.category}</div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
