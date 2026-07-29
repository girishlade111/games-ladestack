"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, RotateCcw, Undo2 } from "lucide-react"

type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type Card = { suit: Suit; rank: number; faceUp: boolean; id: string }

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const SUIT_SYMBOLS: Record<Suit, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }
const SUIT_COLORS: Record<Suit, string> = { hearts: "text-red-500", diamonds: "text-red-500", clubs: "text-gray-700 dark:text-gray-300", spades: "text-gray-700 dark:text-gray-300" }
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, faceUp: false, id: `${suit}-${rank}` })
    }
  }
  return shuffle(deck)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TABLEAU_COLS = 7

export default function SolitaireGame({ themeColor = "#1d4ed8" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won">("menu")
  const [tableau, setTableau] = useState<Card[][]>([])
  const [stock, setStock] = useState<Card[]>([])
  const [waste, setWaste] = useState<Card[]>([])
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []])
  const [selectedCard, setSelectedCard] = useState<{ pile: "tableau" | "waste" | "foundation"; colIndex?: number; cardIndex: number } | null>(null)
  const [moves, setMoves] = useState(0)
  const [bestMoves, setBestMoves] = useState(0)

  const canPlaceOnTableau = (card: Card, target: Card | undefined) => {
    if (!target) return card.rank === 13
    const isRed = (s: Suit) => s === "hearts" || s === "diamonds"
    return isRed(card.suit) !== isRed(target.suit) && card.rank === target.rank - 1
  }

  const canPlaceOnFoundation = (card: Card, foundation: Card[]) => {
    if (foundation.length === 0) return card.rank === 1
    const top = foundation[foundation.length - 1]
    return card.suit === top.suit && card.rank === top.rank + 1
  }

  const startGame = useCallback(() => {
    const deck = createDeck()
    const t: Card[][] = Array.from({ length: TABLEAU_COLS }, () => [])
    let cardIndex = 0
    for (let col = 0; col < TABLEAU_COLS; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[cardIndex++]
        card.faceUp = row === col
        t[col].push(card)
      }
    }
    setTableau(t)
    setStock(deck.slice(cardIndex).map((c) => ({ ...c, faceUp: false })))
    setWaste([])
    setFoundations([[], [], [], []])
    setSelectedCard(null)
    setMoves(0)
    setPhase("playing")
  }, [])

  const drawFromStock = () => {
    if (stock.length === 0) {
      if (waste.length === 0) return
      setStock(waste.reverse().map((c) => ({ ...c, faceUp: false })))
      setWaste([])
      return
    }
    const newStock = [...stock]
    const drawn = newStock.pop()!
    drawn.faceUp = true
    setStock(newStock)
    setWaste([...waste, drawn])
    setSelectedCard(null)
  }

  const handleCardClick = (pile: "tableau" | "waste" | "foundation", colIndex: number | undefined, cardIndex: number) => {
    if (selectedCard) {
      const { pile: fromPile, colIndex: fromCol, cardIndex: fromIdx } = selectedCard
      let fromCards: Card[]
      let toCards: Card[]

      if (fromPile === pile && fromCol === colIndex && fromIdx === cardIndex) {
        setSelectedCard(null)
        return
      }

      if (fromPile === "tableau") fromCards = tableau[fromCol!]
      else if (fromPile === "waste") fromCards = waste
      else return

      const movingCard = fromCards[fromIdx]

      if (pile === "tableau" && colIndex !== undefined) {
        toCards = tableau[colIndex]
        const target = toCards[toCards.length - 1]
        if (canPlaceOnTableau(movingCard, target)) {
          const newTableau = tableau.map((col) => [...col])
          const newFromPile = [...fromCards]
          const moved = newFromPile.splice(fromIdx)
          const newToPile = [...toCards, ...moved]
          if (fromPile === "tableau") {
            newTableau[fromCol!] = newFromPile
            if (newFromPile.length > 0) newFromPile[newFromPile.length - 1].faceUp = true
            newTableau[colIndex] = newToPile
          }
          setTableau(newTableau)
          if (fromPile === "waste") setWaste(newFromPile)
          setSelectedCard(null)
          setMoves((m) => m + 1)
          checkWin(newTableau, foundations, stock)
        }
        return
      }

      if (pile === "foundation" && colIndex !== undefined) {
        if (fromIdx !== fromCards.length - 1) return
        if (fromCards.length === 0) return
        const foundation = [...foundations[colIndex]]
        if (canPlaceOnFoundation(movingCard, foundation)) {
          foundation.push({ ...movingCard, faceUp: true })
          const newFoundations = foundations.map((f, i) => (i === colIndex ? foundation : [...f]))
          const newFromPile = fromCards.slice(0, -1)
          const newTableau = tableau.map((col) => [...col])
          if (fromPile === "tableau") {
            newTableau[fromCol!] = newFromPile
            if (newFromPile.length > 0) newFromPile[newFromPile.length - 1].faceUp = true
          }
          setTableau(newTableau)
          setFoundations(newFoundations)
          if (fromPile === "waste") setWaste(newFromPile)
          setSelectedCard(null)
          setMoves((m) => m + 1)
          checkWin(newTableau, newFoundations, stock)
        }
        return
      }
    } else {
      let cards: Card[]
      if (pile === "tableau" && colIndex !== undefined) cards = tableau[colIndex]
      else if (pile === "waste") cards = waste
      else return

      if (cards.length === 0 || !cards[cardIndex].faceUp) return
      setSelectedCard({ pile, colIndex, cardIndex })
    }
  }

  const checkWin = (t: Card[][], f: Card[][], s: Card[]) => {
    const totalFoundationCards = f.reduce((sum, pile) => sum + pile.length, 0)
    if (totalFoundationCards === 52) {
      try {
        const best = parseInt(localStorage.getItem("solitaire-best") || "0")
        if (best === 0 || moves + 1 < best) {
          localStorage.setItem("solitaire-best", (moves + 1).toString())
          setBestMoves(moves + 1)
        }
      } catch {}
      setPhase("won")
    }
  }

  const renderCard = (card: Card, pile: "tableau" | "waste" | "foundation", colIndex: number | undefined, cardIndex: number) => {
    const isSelected = selectedCard &&
      selectedCard.pile === pile &&
      selectedCard.colIndex === colIndex &&
      selectedCard.cardIndex === cardIndex

    if (!card.faceUp) {
      return (
        <div
          className={`w-14 h-20 sm:w-16 sm:h-24 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 shadow cursor-pointer ${isSelected ? "ring-2 ring-yellow-400" : ""}`}
          onClick={() => handleCardClick(pile, colIndex, cardIndex)}
        >
          <div className="w-full h-full rounded-sm m-0.5 border border-blue-300/30 bg-blue-700/50" />
        </div>
      )
    }

    const isRed = card.suit === "hearts" || card.suit === "diamonds"
    return (
      <div
        className={`w-14 h-20 sm:w-16 sm:h-24 rounded-md bg-white dark:bg-gray-800 border shadow flex flex-col justify-between p-1.5 cursor-pointer hover:shadow-md transition-shadow ${isSelected ? "ring-2 ring-yellow-400 -translate-y-1" : ""}`}
        onClick={() => handleCardClick(pile, colIndex, cardIndex)}
      >
        <div className={`text-xs font-bold ${isRed ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
          {RANKS[card.rank - 1]}
          <br />
          {SUIT_SYMBOLS[card.suit]}
        </div>
        <div className={`text-lg self-center ${isRed ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Solitaire</h2>
          <p className="text-muted-foreground mb-4">Stack cards by suit from Ace to King</p>
          {bestMoves > 0 && <p className="text-sm text-muted-foreground mb-4">Best: {bestMoves} moves</p>}
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            New Game
          </Button>
        </div>
      )}

      {phase === "playing" && (
        <div className="w-full max-w-4xl py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Moves: {moves}</span>
            <Button variant="ghost" size="sm" onClick={() => { startGame() }}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          {/* Top row: Stock, Waste, Foundations */}
          <div className="flex gap-4 mb-6">
            <div className="flex gap-2">
              <div className="relative" onClick={drawFromStock}>
                {stock.length > 0 ? (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 shadow cursor-pointer hover:shadow-md">
                    <div className="w-full h-full rounded-sm m-0.5 border border-blue-300/30 bg-blue-700/50" />
                  </div>
                ) : (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-md border-2 border-dashed border-muted-foreground/30 cursor-pointer" />
                )}
              </div>
              <div className="relative">
                {waste.length > 0 ? (
                  renderCard(waste[waste.length - 1], "waste", undefined, waste.length - 1)
                ) : (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-md border-2 border-dashed border-muted-foreground/30" />
                )}
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex gap-2">
              {foundations.map((foundation, i) => (
                <div key={i} onClick={() => {
                  if (foundation.length > 0) {
                    handleCardClick("foundation", i, foundation.length - 1)
                  }
                }}>
                  {foundation.length > 0 ? (
                    renderCard(foundation[foundation.length - 1], "foundation", i, foundation.length - 1)
                  ) : (
                    <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <span className="text-3xl text-muted-foreground/40">{SUIT_SYMBOLS[SUITS[i]]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tableau */}
          <div className="flex gap-2 justify-center">
            {tableau.map((column, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-[2px] items-center min-w-[56px] sm:min-w-[64px]">
                {column.map((card, cardIdx) => (
                  <div
                    key={card.id}
                    style={{
                      marginTop: cardIdx === 0 ? "0" : card.faceUp ? "-22px" : "-10px",
                    }}
                  >
                    {renderCard(card, "tableau", colIdx, cardIdx)}
                  </div>
                ))}
                {column.length === 0 && (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-md border-2 border-dashed border-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "won" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-muted-foreground mb-2">You completed Solitaire in {moves} moves!</p>
          {bestMoves > 0 && <p className="text-sm text-muted-foreground mb-6">Best: {bestMoves} moves</p>}
          <div className="flex gap-3 justify-center">
            <Button onClick={startGame} style={{ backgroundColor: themeColor }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
