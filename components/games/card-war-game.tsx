"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

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

function CardFace({ card, hidden }: { card?: Card; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div className="w-20 h-28 rounded-lg border-2 border-white/40 bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center">
        <div className="w-12 h-20 rounded border border-white/30" />
      </div>
    )
  }
  const red = card.suit === "♥" || card.suit === "♦"
  return (
    <div className="w-20 h-28 rounded-lg border bg-white shadow flex flex-col items-center justify-center">
      <span className={`text-2xl font-bold ${red ? "text-red-600" : "text-neutral-900"}`}>{card.rank}</span>
      <span className={`text-2xl ${red ? "text-red-600" : "text-neutral-900"}`}>{card.suit}</span>
    </div>
  )
}

export default function CardWarGame({ themeColor = "#1e293b" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [playerDeck, setPlayerDeck] = useState<Card[]>([])
  const [aiDeck, setAiDeck] = useState<Card[]>([])
  const [playerCard, setPlayerCard] = useState<Card | null>(null)
  const [aiCard, setAiCard] = useState<Card | null>(null)
  const [pot, setPot] = useState<Card[]>([])
  const [message, setMessage] = useState("")
  const [rounds, setRounds] = useState(0)
  const [record, setRecord] = useState({ wins: 0, losses: 0 })

  const start = useCallback(() => {
    const deck = freshDeck()
    setPlayerDeck(deck.slice(0, 26))
    setAiDeck(deck.slice(26))
    setPlayerCard(null)
    setAiCard(null)
    setPot([])
    setRounds(0)
    setMessage("Flip a card to begin")
    setPhase("playing")
  }, [])

  const flip = useCallback(() => {
    if (phase !== "playing") return

    const p = [...playerDeck]
    const a = [...aiDeck]
    const pc = p.shift()
    const ac = a.shift()
    if (!pc || !ac) return

    setPlayerCard(pc)
    setAiCard(ac)
    setRounds((r) => r + 1)

    // Carry-over pot from previous ties is awarded with this round.
    const stake = [...pot, pc, ac]

    if (pc.value > ac.value) {
      p.push(...stake)
      setPot([])
      setMessage(`You take the round (+${stake.length} cards)`)
    } else if (ac.value > pc.value) {
      a.push(...stake)
      setPot([])
      setMessage(`AI takes the round (+${stake.length} cards)`)
    } else {
      // War: each side buries one card, and the pot rides to the next flip.
      const pBurn = p.shift()
      const aBurn = a.shift()
      setPot([...stake, ...(pBurn ? [pBurn] : []), ...(aBurn ? [aBurn] : [])])
      setMessage("WAR! The pot carries over")
    }

    setPlayerDeck(p)
    setAiDeck(a)

    if (p.length === 0 || a.length === 0) {
      setPhase("over")
      const won = p.length > a.length
      setRecord((r) => ({ wins: r.wins + (won ? 1 : 0), losses: r.losses + (won ? 0 : 1) }))
    }
  }, [phase, playerDeck, aiDeck, pot])

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">⚔️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Card War</h2>
          <p className="text-muted-foreground mb-2">
            The deck is split in two. Higher card takes both — ties declare war and the pot rides on the next flip.
          </p>
          {record.wins + record.losses > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              Record: {record.wins}W · {record.losses}L
            </p>
          )}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Deal Cards
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Your deck</div>
              <div className="text-2xl font-bold" style={{ color: themeColor }}>
                {playerDeck.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Round</div>
              <div className="text-lg font-semibold">{rounds}</div>
              {pot.length > 0 && <div className="text-xs text-amber-500 font-medium">Pot: {pot.length}</div>}
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">AI deck</div>
              <div className="text-2xl font-bold text-orange-500">{aiDeck.length}</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <CardFace card={playerCard ?? undefined} hidden={!playerCard} />
              <div className="text-xs text-muted-foreground mt-2">You</div>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">vs</div>
            <div className="text-center">
              <CardFace card={aiCard ?? undefined} hidden={!aiCard} />
              <div className="text-xs text-muted-foreground mt-2">AI</div>
            </div>
          </div>

          <div className="text-center text-sm font-medium mb-6 h-5">{message}</div>

          <div className="flex justify-center gap-3">
            {phase === "playing" ? (
              <Button onClick={flip} style={{ backgroundColor: themeColor }} size="lg">
                Flip Card
              </Button>
            ) : (
              <>
                <div className="text-center w-full">
                  <div className="text-lg font-bold mb-1">{playerDeck.length > aiDeck.length ? "You win the war!" : "AI wins the war"}</div>
                  <div className="text-sm text-muted-foreground mb-4">Decided after {rounds} rounds</div>
                  <Button onClick={start} style={{ backgroundColor: themeColor }}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
