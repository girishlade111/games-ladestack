"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw, ArrowUp, ArrowDown } from "lucide-react"

const SUITS = ["♠", "♥", "♦", "♣"] as const
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const

interface Card {
  rank: string
  suit: string
  value: number
}

function freshDeck(): Card[] {
  const deck: Card[] = []
  SUITS.forEach((suit) => RANKS.forEach((rank, i) => deck.push({ rank, suit, value: i + 2 })))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function CardFace({ card, size = "lg" }: { card: Card | null; size?: "lg" | "sm" }) {
  const dims = size === "lg" ? "w-24 h-36 text-4xl" : "w-16 h-24 text-2xl"
  if (!card) {
    return (
      <div className={`${dims} rounded-xl border-2 border-white/40 bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center`}>
        <span className="text-white/70 text-sm">?</span>
      </div>
    )
  }
  const red = card.suit === "♥" || card.suit === "♦"
  return (
    <div className={`${dims} rounded-xl border bg-white shadow-md flex flex-col items-center justify-center`}>
      <span className={`font-bold ${red ? "text-red-600" : "text-neutral-900"}`}>{card.rank}</span>
      <span className={red ? "text-red-600" : "text-neutral-900"}>{card.suit}</span>
    </div>
  )
}

export default function HiLoGame({ themeColor = "#15803d" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [deck, setDeck] = useState<Card[]>([])
  const [current, setCurrent] = useState<Card | null>(null)
  const [revealed, setRevealed] = useState<Card | null>(null)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [message, setMessage] = useState("")

  const start = useCallback(() => {
    const d = freshDeck()
    setCurrent(d[0])
    setDeck(d.slice(1))
    setRevealed(null)
    setStreak(0)
    setScore(0)
    setMessage("Will the next card be higher or lower?")
    setPhase("playing")
  }, [])

  const guess = useCallback(
    (higher: boolean) => {
      if (phase !== "playing" || !current || deck.length === 0) return

      const next = deck[0]
      setRevealed(next)

      // Equal ranks count as a push - the streak survives but scores nothing.
      if (next.value === current.value) {
        setMessage(`Push — both ${current.rank}. Streak intact.`)
      } else {
        const correct = higher ? next.value > current.value : next.value < current.value
        if (correct) {
          const s = streak + 1
          setStreak(s)
          setScore((v) => v + 10 * s)
          setMessage(`Correct! ${s} in a row.`)
        } else {
          setPhase("over")
          setBest((b) => Math.max(b, score))
          setMessage(`Wrong — it was ${next.rank}${next.suit}.`)
          return
        }
      }

      // Advance to the revealed card after a beat so the player sees it.
      setTimeout(() => {
        setCurrent(next)
        setRevealed(null)
        setDeck((d) => {
          const rest = d.slice(1)
          if (rest.length === 0) {
            setPhase("over")
            setBest((b) => Math.max(b, score))
            setMessage("Deck exhausted — you cleared it!")
          }
          return rest
        })
      }, 900)
    },
    [phase, current, deck, streak, score]
  )

  const locked = revealed !== null

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🃏</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Hi-Lo</h2>
          <p className="text-muted-foreground mb-2">
            Guess whether the next card is higher or lower. Each correct call in a row is worth more — one wrong call ends it.
          </p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best score: {best}</p>}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium">Score: {score}</span>
            <span className="text-sm text-muted-foreground">Streak: {streak}</span>
            <span className="text-sm text-muted-foreground">Deck: {deck.length}</span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <CardFace card={current} />
              <div className="text-xs text-muted-foreground mt-2">Current</div>
            </div>
            <div className="text-center">
              <CardFace card={revealed} size="sm" />
              <div className="text-xs text-muted-foreground mt-2">Next</div>
            </div>
          </div>

          <div className="text-center text-sm font-medium mb-6 h-5">{message}</div>

          {phase === "playing" ? (
            <div className="flex gap-3 justify-center">
              <Button onClick={() => guess(true)} disabled={locked} style={{ backgroundColor: themeColor }} size="lg" className="w-32">
                <ArrowUp className="w-4 h-4 mr-2" />
                Higher
              </Button>
              <Button onClick={() => guess(false)} disabled={locked} variant="outline" size="lg" className="w-32">
                <ArrowDown className="w-4 h-4 mr-2" />
                Lower
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-lg font-bold mb-1">Final score: {score}</div>
              <div className="text-sm text-muted-foreground mb-4">Longest streak: {streak}</div>
              <Button onClick={start} style={{ backgroundColor: themeColor }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
