"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, RotateCcw } from "lucide-react"

type Suit = "hearts" | "diamonds" | "clubs" | "spades"
interface CardT { suit: Suit; rank: number; faceUp: boolean }

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const SUIT_SYMBOLS: Record<Suit, string> = { hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663", spades: "\u2660" }
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

function createDeck(): CardT[] {
  const deck: CardT[] = []
  for (const suit of SUITS) for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, faceUp: true })
  return deck.sort(() => Math.random() - 0.5)
}

function cardValue(c: CardT): number { if (c.rank > 10) return 10; if (c.rank === 1) return 11; return c.rank }
function handValue(cards: CardT[]): number { let sum = 0; let aces = 0; for (const c of cards) { sum += cardValue(c); if (c.rank === 1) aces++ } while (sum > 21 && aces > 0) { sum -= 10; aces-- } return sum }

function renderMiniCard(c: CardT, i: number) {
  if (!c.faceUp) return <div key={i} className="w-10 h-14 rounded bg-blue-700 border border-blue-400 flex-shrink-0" />
  const red = c.suit === "hearts" || c.suit === "diamonds"
  return <div key={i} className={`w-10 h-14 rounded bg-white border flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold ${red ? "text-red-500" : "text-gray-800"}`}>{RANKS[c.rank - 1]}<br/>{SUIT_SYMBOLS[c.suit]}</div>
}

export default function BlackjackGame({ themeColor = "#dc2626" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "stand" | "over">("menu")
  const [deck, setDeck] = useState<CardT[]>([])
  const [playerHand, setPlayerHand] = useState<CardT[]>([])
  const [dealerHand, setDealerHand] = useState<CardT[]>([])
  const [balance, setBalance] = useState(1000)
  const [bet, setBet] = useState(0)
  const [result, setResult] = useState("")
  const [stats, setStats] = useState({ wins: 0, losses: 0 })

  const startGame = useCallback(() => {
    const d = createDeck()
    const p = [d.pop()!, d.pop()!]
    const dl = [d.pop()!, { ...d.pop()!, faceUp: false }]
    setDeck(d); setPlayerHand(p); setDealerHand(dl); setPhase("playing"); setResult(""); setBet(0)
  }, [])

  const placeBet = useCallback((amount: number) => {
    if (amount > balance) return
    setBet(amount); setBalance(b => b - amount)
    const d = createDeck()
    const p = [d.pop()!, d.pop()!]
    const dl = [d.pop()!, { ...d.pop()!, faceUp: false }]
    setDeck(d); setPlayerHand(p); setDealerHand(dl); setPhase("playing"); setResult("")
  }, [balance])

  const hit = useCallback(() => {
    const d = [...deck]; const p = [...playerHand]
    p.push(d.pop()!)
    const v = handValue(p)
    if (v > 21) {
      setDealerHand(dh => dh.map(c => ({ ...c, faceUp: true })))
      setPhase("over"); setResult("Bust! You lose.")
      setStats(s => ({ ...s, losses: s.losses + 1 }))
    }
    setDeck(d); setPlayerHand(p)
  }, [deck, playerHand])

  const stand = useCallback(() => {
    const d = [...deck]; let dl = dealerHand.map(c => ({ ...c, faceUp: true }))
    while (handValue(dl) < 17) dl.push(d.pop()!)
    setDealerHand(dl); setDeck(d); setPhase("stand")
    const pv = handValue(playerHand); const dv = handValue(dl)
    if (dv > 21) { setResult("Dealer busts! You win!"); setBalance(b => b + bet * 2); setStats(s => ({ ...s, wins: s.wins + 1 })) }
    else if (dv > pv) { setResult("Dealer wins!"); setStats(s => ({ ...s, losses: s.losses + 1 })) }
    else if (pv > dv) { setResult("You win!"); setBalance(b => b + bet * 2); setStats(s => ({ ...s, wins: s.wins + 1 })) }
    else { setResult("Push - tie!"); setBalance(b => b + bet) }
    setPhase("over")
  }, [dealerHand, playerHand, bet])

  const newRound = useCallback(() => { setPhase("menu") }, [])

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md my-auto py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl text-white font-bold">21</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Blackjack</h2>
          <p className="text-muted-foreground mb-6">
            Beat the dealer without going over 21
          </p>
          <div className="flex justify-center gap-2 mb-6">
            {[10, 25, 50, 100].map(amt => (
              <Button key={amt} onClick={() => placeBet(amt)} disabled={amt > balance} variant={bet === amt ? "default" : "outline"} style={bet === amt ? { backgroundColor: themeColor } : {}} size="sm">
                ${amt}
              </Button>
            ))}
          </div>
          <div className="text-sm text-muted-foreground mb-4">Balance: ${balance}</div>
          {bet > 0 && <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Deal</Button>}
          <div className="mt-4 text-xs text-muted-foreground">Wins: {stats.wins} | Losses: {stats.losses}</div>
        </div>
      )}

      {(phase === "playing" || phase === "stand" || phase === "over") && (
        <div className="w-full max-w-lg my-auto py-4">
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Dealer ({phase !== "playing" ? handValue(dealerHand) : cardValue(dealerHand[0])}+?)</div>
            <div className="flex gap-1">{dealerHand.map((c, i) => renderMiniCard(c, i))}</div>
          </div>
          <div className="mb-6 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-semibold mb-2">You ({handValue(playerHand)})</div>
            <div className="flex gap-1">{playerHand.map((c, i) => renderMiniCard(c, i))}</div>
          </div>
          {phase === "playing" && (
            <div className="flex justify-center gap-3">
              <Button onClick={hit} style={{ backgroundColor: themeColor }} size="lg">Hit</Button>
              <Button onClick={stand} variant="outline" size="lg">Stand</Button>
            </div>
          )}
          {phase === "over" && (
            <div className="text-center">
              <div className={`text-lg font-bold mb-3 ${result.includes("win") || result.includes("busts") ? "text-green-500" : result.includes("Push") ? "text-yellow-500" : "text-red-500"}`}>{result}</div>
              <div className="text-sm text-muted-foreground mb-4">Balance: ${balance}</div>
              <div className="flex gap-3 justify-center">
                <Button onClick={newRound} style={{ backgroundColor: themeColor }}><RotateCcw className="w-4 h-4 mr-2" />New Round</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
