"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const SUITS = ["♠", "♥", "♦", "♣"] as const
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const

interface Card {
  rank: string
  suit: string
}

function freshDeck(): Card[] {
  const deck: Card[] = []
  SUITS.forEach((suit) => RANKS.forEach((rank) => deck.push({ rank, suit })))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/** Eights are wild; otherwise match the active suit or the rank on the pile. */
function playable(card: Card, top: Card, activeSuit: string): boolean {
  return card.rank === "8" || card.suit === activeSuit || card.rank === top.rank
}

function isRed(suit: string) {
  return suit === "♥" || suit === "♦"
}

function CardFace({ card, onClick, disabled, dim }: { card: Card; onClick?: () => void; disabled?: boolean; dim?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-14 h-20 shrink-0 rounded-lg border bg-white shadow-sm flex flex-col items-center justify-center transition-transform ${
        disabled ? "" : "hover:-translate-y-2 cursor-pointer"
      } ${dim ? "opacity-40" : ""}`}
    >
      <span className={`text-lg font-bold ${isRed(card.suit) ? "text-red-600" : "text-neutral-900"}`}>{card.rank}</span>
      <span className={`text-lg ${isRed(card.suit) ? "text-red-600" : "text-neutral-900"}`}>{card.suit}</span>
    </button>
  )
}

export default function CrazyEightsGame({ themeColor = "#6d28d9" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "suit" | "over">("menu")
  const [deck, setDeck] = useState<Card[]>([])
  const [hand, setHand] = useState<Card[]>([])
  const [aiHand, setAiHand] = useState<Card[]>([])
  const [pile, setPile] = useState<Card[]>([])
  const [activeSuit, setActiveSuit] = useState("")
  const [turn, setTurn] = useState<"you" | "ai">("you")
  const [message, setMessage] = useState("")
  const [record, setRecord] = useState({ wins: 0, losses: 0 })

  const start = useCallback(() => {
    const d = freshDeck()
    // Ensure the starting discard isn't a wild eight.
    let startIdx = d.findIndex((c) => c.rank !== "8")
    if (startIdx === -1) startIdx = 0
    const first = d.splice(startIdx, 1)[0]

    setHand(d.slice(0, 7))
    setAiHand(d.slice(7, 14))
    setDeck(d.slice(14))
    setPile([first])
    setActiveSuit(first.suit)
    setTurn("you")
    setMessage("Match the suit or rank, or play an 8 to change suit")
    setPhase("playing")
  }, [])

  const top = pile[pile.length - 1]

  const finish = useCallback((youWon: boolean) => {
    setPhase("over")
    setMessage(youWon ? "You emptied your hand — you win!" : "AI played its last card")
    setRecord((r) => ({ wins: r.wins + (youWon ? 1 : 0), losses: r.losses + (youWon ? 0 : 1) }))
  }, [])

  const playCard = useCallback(
    (index: number) => {
      if (phase !== "playing" || turn !== "you") return
      const card = hand[index]
      if (!playable(card, top, activeSuit)) return

      const nextHand = hand.filter((_, i) => i !== index)
      setHand(nextHand)
      setPile((p) => [...p, card])

      if (nextHand.length === 0) {
        setActiveSuit(card.suit)
        finish(true)
        return
      }

      if (card.rank === "8") {
        // Player picks the new suit before play continues.
        setPhase("suit")
        setMessage("You played an 8 — choose the next suit")
        return
      }

      setActiveSuit(card.suit)
      setTurn("ai")
    },
    [phase, turn, hand, top, activeSuit, finish]
  )

  const chooseSuit = useCallback((suit: string) => {
    setActiveSuit(suit)
    setPhase("playing")
    setMessage(`Suit is now ${suit}`)
    setTurn("ai")
  }, [])

  const drawCard = useCallback(() => {
    if (phase !== "playing" || turn !== "you") return
    if (deck.length === 0) {
      setMessage("Deck is empty — turn passes")
      setTurn("ai")
      return
    }
    setHand((h) => [...h, deck[0]])
    setDeck((d) => d.slice(1))
    setMessage("You drew a card")
    setTurn("ai")
  }, [phase, turn, deck])

  // AI turn: play the first legal card, preferring to keep eights in reserve.
  useEffect(() => {
    if (phase !== "playing" || turn !== "ai") return
    const timer = setTimeout(() => {
      const legal = aiHand.map((c, i) => ({ c, i })).filter(({ c }) => playable(c, top, activeSuit))
      const pick = legal.find(({ c }) => c.rank !== "8") ?? legal[0]

      if (!pick) {
        if (deck.length === 0) {
          setMessage("AI can't move and the deck is empty — your turn")
          setTurn("you")
          return
        }
        setAiHand((h) => [...h, deck[0]])
        setDeck((d) => d.slice(1))
        setMessage("AI drew a card")
        setTurn("you")
        return
      }

      const nextAi = aiHand.filter((_, i) => i !== pick.i)
      setAiHand(nextAi)
      setPile((p) => [...p, pick.c])

      if (nextAi.length === 0) {
        setActiveSuit(pick.c.suit)
        finish(false)
        return
      }

      if (pick.c.rank === "8") {
        // AI declares whichever suit it holds most of.
        const counts = nextAi.reduce<Record<string, number>>((acc, c) => {
          acc[c.suit] = (acc[c.suit] || 0) + 1
          return acc
        }, {})
        const best = SUITS.reduce((a, b) => ((counts[b] || 0) > (counts[a] || 0) ? b : a), SUITS[0])
        setActiveSuit(best)
        setMessage(`AI played an 8 and chose ${best}`)
      } else {
        setActiveSuit(pick.c.suit)
        setMessage(`AI played ${pick.c.rank}${pick.c.suit}`)
      }
      setTurn("you")
    }, 700)
    return () => clearTimeout(timer)
  }, [phase, turn, aiHand, top, activeSuit, deck, finish])

  const canPlayAnything = hand.some((c) => playable(c, top, activeSuit))

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">8️⃣</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Crazy Eights</h2>
          <p className="text-muted-foreground mb-2">
            Shed your hand by matching suit or rank. Any 8 is wild — play one to name the next suit.
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
        <div className="py-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">AI holds {aiHand.length}</span>
            <span className="text-sm text-muted-foreground">Deck: {deck.length}</span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          {/* AI hand, face down */}
          <div className="flex justify-center gap-1 mb-6">
            {aiHand.slice(0, 12).map((_, i) => (
              <div key={i} className="w-9 h-14 rounded-md border-2 border-white/40 bg-gradient-to-br from-violet-600 to-violet-900" />
            ))}
          </div>

          {/* Discard pile */}
          <div className="flex flex-col items-center gap-2 mb-6">
            {top && (
              <div className="w-20 h-28 rounded-xl border bg-white shadow-md flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${isRed(top.suit) ? "text-red-600" : "text-neutral-900"}`}>{top.rank}</span>
                <span className={`text-2xl ${isRed(top.suit) ? "text-red-600" : "text-neutral-900"}`}>{top.suit}</span>
              </div>
            )}
            <div className="text-sm">
              Active suit:{" "}
              <span className={`text-xl font-bold ${isRed(activeSuit) ? "text-red-500" : "text-foreground"}`}>{activeSuit}</span>
            </div>
          </div>

          <div className="text-center text-sm font-medium mb-4 h-5">{message}</div>

          {phase === "suit" && (
            <div className="flex justify-center gap-2 mb-4">
              {SUITS.map((s) => (
                <Button
                  key={s}
                  onClick={() => chooseSuit(s)}
                  variant="outline"
                  size="lg"
                  className={`text-2xl w-16 ${isRed(s) ? "text-red-500" : ""}`}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}

          {/* Player hand */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {hand.map((c, i) => {
              const ok = playable(c, top, activeSuit)
              return (
                <CardFace
                  key={`${c.rank}${c.suit}${i}`}
                  card={c}
                  dim={!ok}
                  disabled={phase !== "playing" || turn !== "you" || !ok}
                  onClick={() => playCard(i)}
                />
              )
            })}
          </div>

          {phase === "playing" && turn === "you" && (
            <div className="text-center">
              <Button onClick={drawCard} variant="outline" size="sm">
                {canPlayAnything ? "Draw instead" : "No moves — draw a card"}
              </Button>
            </div>
          )}

          {phase === "over" && (
            <div className="text-center mt-4">
              <div className="text-lg font-bold mb-4">{message}</div>
              <Button onClick={start} style={{ backgroundColor: themeColor }} size="sm">
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
