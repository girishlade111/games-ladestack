"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

type Suit = "hearts" | "diamonds" | "clubs" | "spades"
interface CardT { suit: Suit; rank: number }

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const SUIT_SYMBOLS: Record<Suit, string> = { hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663", spades: "\u2660" }
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

type HandRank = "High Card" | "Pair" | "Two Pair" | "Three of a Kind" | "Straight" | "Flush" | "Full House" | "Four of a Kind" | "Straight Flush" | "Royal Flush"

interface HandResult { rank: HandRank; score: number; name: string }

function createDeck(): CardT[] { const d: CardT[] = []; for (const suit of SUITS) for (let r = 1; r <= 13; r++) d.push({ suit, rank: r }); return d.sort(() => Math.random() - 0.5) }

function evaluateHand(cards: CardT[]): HandResult {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank)
  const isFlush = sorted.every(c => c.suit === sorted[0].suit)
  const ranks = sorted.map(c => c.rank)
  const isStraight = ranks[0] - ranks[4] === 4 || (ranks[0] === 13 && ranks[1] === 4 && ranks[2] === 3 && ranks[3] === 2 && ranks[4] === 1)
  const counts: Record<number, number> = {}
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1
  const vals = Object.entries(counts).sort((a, b) => b[1] - a[1] || parseInt(b[0]) - parseInt(a[0]))
  const isRoyal = isStraight && isFlush && sorted[0].rank === 13

  if (isRoyal) return { rank: "Royal Flush", score: 9, name: "Royal Flush" }
  if (isStraight && isFlush) return { rank: "Straight Flush", score: 8, name: "Straight Flush" }
  if (vals[0][1] === 4) return { rank: "Four of a Kind", score: 7, name: "Four of a Kind" }
  if (vals[0][1] === 3 && vals[1][1] === 2) return { rank: "Full House", score: 6, name: "Full House" }
  if (isFlush) return { rank: "Flush", score: 5, name: "Flush" }
  if (isStraight) return { rank: "Straight", score: 4, name: "Straight" }
  if (vals[0][1] === 3) return { rank: "Three of a Kind", score: 3, name: "Three of a Kind" }
  if (vals[0][1] === 2 && vals[1][1] === 2) return { rank: "Two Pair", score: 2, name: "Two Pair" }
  if (vals[0][1] === 2) return { rank: "Pair", score: 1, name: "Pair" }
  return { rank: "High Card", score: 0, name: `High Card ${RANKS[sorted[0].rank - 1]}` }
}

function renderCard(c: CardT, i: number) {
  const red = c.suit === "hearts" || c.suit === "diamonds"
  return (
    <div key={i} className={`w-14 h-20 sm:w-16 sm:h-24 rounded-md bg-white dark:bg-gray-800 border shadow flex flex-col justify-between p-1.5 ${red ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
      <div className="text-xs font-bold">{RANKS[c.rank - 1]}<br/>{SUIT_SYMBOLS[c.suit]}</div>
      <div className="text-lg self-center">{SUIT_SYMBOLS[c.suit]}</div>
    </div>
  )
}

export default function PokerGame({ themeColor = "#7c3aed" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "draw" | "result">("menu")
  const [deck, setDeck] = useState<CardT[]>([])
  const [hand, setHand] = useState<CardT[]>([])
  const [held, setHeld] = useState<boolean[]>([])
  const [result, setResult] = useState<HandResult | null>(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [drawsLeft, setDrawsLeft] = useState(1)

  const startGame = useCallback(() => {
    const d = createDeck()
    setDeck(d); setHand(d.slice(0, 5)); setHeld([false, false, false, false, false]); setResult(null); setDrawsLeft(1); setPhase("draw")
  }, [])

  const toggleHold = (i: number) => { const nh = [...held]; nh[i] = !nh[i]; setHeld(nh) }

  const draw = useCallback(() => {
    const d = [...deck]
    const nh = hand.map((c, i) => held[i] ? c : d.pop()!)
    setHand(nh); setDeck(d); setHeld([false, false, false, false, false]); setDrawsLeft(0)
    const r = evaluateHand(nh); setResult(r); setPhase("result")
    const pointValue = r.score
    const ns = score + pointValue * 10 + 10
    setScore(ns)
    if (ns > bestScore) setBestScore(ns)
  }, [deck, hand, held, score, bestScore])

  const newHand = useCallback(() => {
    if (score + 10 > bestScore) setBestScore(score + 10)
    const d = createDeck()
    setDeck(d); setHand(d.slice(0, 5)); setHeld([false, false, false, false, false]); setResult(null); setDrawsLeft(1); setPhase("draw")
  }, [score, bestScore])

  const aiHand = deck.length >= 5 ? evaluateHand(deck.slice(5, 10)) : null

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl text-white font-bold">P</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Video Poker</h2>
          <p className="text-muted-foreground mb-4">5-card draw — hold cards and draw to make the best hand</p>
          <p className="text-xs text-muted-foreground mb-2">Royal Flush: 100 pts | Straight Flush: 90 | Four of a Kind: 80 | Full House: 70</p>
          <p className="text-xs text-muted-foreground mb-2">Flush: 60 | Straight: 50 | Three of a Kind: 40 | Two Pair: 30 | Pair: 20 | High Card: 10</p>
          {bestScore > 0 && <p className="text-sm text-muted-foreground mb-6">Best: {bestScore}</p>}
          {score > 0 && <p className="text-sm font-semibold mb-6">Score: {score}</p>}
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Deal New Hand</Button>
        </div>
      )}

      {(phase === "draw" || phase === "result") && (
        <div className="py-4 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">Score: {score}</span>
            {bestScore > 0 && <span className="text-xs text-muted-foreground">Best: {bestScore}</span>}
            <Button variant="ghost" size="sm" onClick={startGame}><RotateCcw className="w-3.5 h-3.5 mr-1" />New</Button>
          </div>
          <div className="flex justify-center gap-2 mb-4 flex-wrap">{hand.map((c, i) => (
            <div key={i} className="flex flex-col items-center cursor-pointer" onClick={phase === "draw" ? () => toggleHold(i) : undefined}>
              {renderCard(c, i)}
              {phase === "draw" && <span className={`text-xs mt-1 font-semibold ${held[i] ? "text-yellow-500" : "text-gray-400"}`}>{held[i] ? "HELD" : "Hold?"}</span>}
            </div>
          ))}</div>
          {phase === "draw" && (
            <div className="text-center"><Button onClick={draw} style={{ backgroundColor: themeColor }} size="lg">Draw Cards</Button></div>
          )}
          {phase === "result" && result && (
            <div className="text-center">
              <div className={`text-xl font-bold mb-2 ${result.score >= 5 ? "text-yellow-500" : result.score >= 3 ? "text-green-500" : "text-muted-foreground"}`}>{result.name}</div>
              <p className="text-sm text-muted-foreground mb-4">+{result.score * 10 + 10} points</p>
              <Button onClick={newHand} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Next Hand</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
