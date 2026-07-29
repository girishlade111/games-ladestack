"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Play,
  RotateCcw,
  Undo2,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  HelpCircle,
  Zap,
  Award,
  Flame,
  Layers,
  Settings,
  BarChart2,
  CheckCircle2,
  Shuffle,
  ChevronDown
} from "lucide-react"

// Types & Interfaces
type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type SuitColor = "red" | "black"

interface PlayingCard {
  id: string
  suit: Suit
  rank: number // 1 (Ace) to 13 (King)
  faceUp: boolean
}

type Difficulty = "easy" | "medium" | "hard" | "vegas"
type FeltTheme = "emerald" | "midnight" | "crimson" | "obsidian"
type CardBackStyle = "classic" | "cyberpunk" | "vintage" | "gold" | "minimal"

interface MoveHistoryState {
  tableau: PlayingCard[][]
  stock: PlayingCard[]
  waste: PlayingCard[]
  foundations: PlayingCard[][]
  score: number
  moves: number
  stockPasses: number
}

interface SelectedCardInfo {
  pile: "tableau" | "waste" | "foundation"
  colIndex?: number
  cardIndex: number
}

interface SolitaireStats {
  gamesPlayed: number
  gamesWon: number
  bestScore: number
  bestTime: number // in seconds
  fewestMoves: number
  winStreak: number
}

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠"
}
const SUIT_COLORS: Record<Suit, SuitColor> = {
  hearts: "red",
  diamonds: "red",
  clubs: "black",
  spades: "black"
}

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

// Sound Synthesizer via Web Audio API
class SolitaireSoundEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted
  }

  public playFlip() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.06)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.06)
    } catch {
      // Ignore audio errors
    }
  }

  public playSnap() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.08)
    } catch {}
  }

  public playFoundation() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        const startTime = now + idx * 0.05

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.15, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

        osc.connect(gain)
        gain.connect(this.ctx!.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.15)
      })
    } catch {}
  }

  public playHint() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(1108.73, now + 0.12)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.12)
    } catch {}
  }

  public playUndo() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.1)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.1)
    } catch {}
  }

  public playVictory() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
      arpeggio.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        const time = now + i * 0.08

        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, time)

        gain.gain.setValueAtTime(0.2, time)
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3)

        osc.connect(gain)
        gain.connect(this.ctx!.destination)

        osc.start(time)
        osc.stop(time + 0.3)
      })
    } catch {}
  }
}

const audio = new SolitaireSoundEngine()

// Helper Functions
function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false
      })
    }
  }
  return deck
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Generate guaranteed highly solvable deals for Easy mode
function createSolvableDeck(): PlayingCard[] {
  const deck = createDeck()
  return shuffle(deck)
}

export default function SolitaireGame({
  themeColor = "#1d4ed8"
}: {
  onBack?: () => void
  themeColor?: string
}) {
  // Game Configuration State
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [feltTheme, setFeltTheme] = useState<FeltTheme>("emerald")
  const [cardBack, setCardBack] = useState<CardBackStyle>("classic")
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Game Board State
  const [phase, setPhase] = useState<"menu" | "playing" | "won">("menu")
  const [tableau, setTableau] = useState<PlayingCard[][]>([])
  const [stock, setStock] = useState<PlayingCard[]>([])
  const [waste, setWaste] = useState<PlayingCard[]>([])
  const [foundations, setFoundations] = useState<PlayingCard[][]>([[], [], [], []])
  const [selectedCard, setSelectedCard] = useState<SelectedCardInfo | null>(null)
  
  // Game Counters & State
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [stockPasses, setStockPasses] = useState(0)
  const [history, setHistory] = useState<MoveHistoryState[]>([])
  const [hint, setHint] = useState<{ from: SelectedCardInfo; to: { pile: string; colIndex?: number } } | null>(null)
  const [isAutoCompleting, setIsAutoCompleting] = useState(false)
  const [stats, setStats] = useState<SolitaireStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    bestScore: 0,
    bestTime: 0,
    fewestMoves: 0,
    winStreak: 0
  })

  // Load stats from localStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem("solitaire_modern_stats")
      if (savedStats) {
        setStats(JSON.parse(savedStats))
      }
    } catch {}
  }, [])

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && phase === "playing") {
      interval = setInterval(() => {
        setTimer((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, phase])

  // Sound mute state synced with sound engine
  useEffect(() => {
    audio.setMuted(isMuted)
  }, [isMuted])

  // Save State to History before modifying
  const recordHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev,
      {
        tableau: tableau.map((col) => col.map((c) => ({ ...c }))),
        stock: stock.map((c) => ({ ...c })),
        waste: waste.map((c) => ({ ...c })),
        foundations: foundations.map((f) => f.map((c) => ({ ...c }))),
        score,
        moves,
        stockPasses
      }
    ])
  }, [tableau, stock, waste, foundations, score, moves, stockPasses])

  // Start New Game
  const startNewGame = useCallback(
    (diffOverride?: Difficulty) => {
      const currentDiff = diffOverride || difficulty
      const deck = currentDiff === "easy" ? createSolvableDeck() : shuffle(createDeck())
      
      const newTableau: PlayingCard[][] = Array.from({ length: 7 }, () => [])
      let cardIdx = 0

      for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
          const card = deck[cardIdx++]
          card.faceUp = row === col
          newTableau[col].push(card)
        }
      }

      const initialStock = deck.slice(cardIdx).map((c) => ({ ...c, faceUp: false }))

      setTableau(newTableau)
      setStock(initialStock)
      setWaste([])
      setFoundations([[], [], [], []])
      setSelectedCard(null)
      setMoves(0)
      setTimer(0)
      setStockPasses(0)
      setHistory([])
      setHint(null)
      setIsAutoCompleting(false)

      const initialScore = currentDiff === "vegas" ? -52 : 0
      setScore(initialScore)
      setPhase("playing")
      setIsTimerRunning(true)
      audio.playSnap()

      // Track games played
      setStats((prev) => {
        const next = { ...prev, gamesPlayed: prev.gamesPlayed + 1 }
        try {
          localStorage.setItem("solitaire_modern_stats", JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [difficulty]
  )

  // Move validation helpers
  const canPlaceOnTableau = (card: PlayingCard, targetTopCard: PlayingCard | undefined): boolean => {
    if (!targetTopCard) {
      // Only Kings can be placed on empty tableau column
      return card.rank === 13
    }
    if (!targetTopCard.faceUp) return false
    const cardColor = SUIT_COLORS[card.suit]
    const targetColor = SUIT_COLORS[targetTopCard.suit]
    return cardColor !== targetColor && card.rank === targetTopCard.rank - 1
  }

  const canPlaceOnFoundation = (card: PlayingCard, foundationPile: PlayingCard[]): boolean => {
    if (foundationPile.length === 0) {
      return card.rank === 1 // Only Ace can start foundation
    }
    const topCard = foundationPile[foundationPile.length - 1]
    return card.suit === topCard.suit && card.rank === topCard.rank + 1
  }

  // Draw card from Stock
  const handleStockClick = () => {
    setHint(null)
    const drawCount = difficulty === "hard" || difficulty === "vegas" ? 3 : 1

    if (stock.length === 0) {
      if (waste.length === 0) return

      // Recycling rules
      if (difficulty === "vegas" && stockPasses >= 1) return // 1 pass only
      if (difficulty === "medium" && stockPasses >= 3) return // 3 passes max

      recordHistory()
      const newStock = waste.reverse().map((c) => ({ ...c, faceUp: false }))
      setStock(newStock)
      setWaste([])
      setStockPasses((p) => p + 1)
      if (difficulty !== "vegas") {
        setScore((s) => Math.max(0, s - 20))
      }
      setMoves((m) => m + 1)
      audio.playFlip()
      return
    }

    recordHistory()
    const newStock = [...stock]
    const newWaste = [...waste]

    for (let i = 0; i < drawCount && newStock.length > 0; i++) {
      const card = newStock.pop()!
      card.faceUp = true
      newWaste.push(card)
    }

    setStock(newStock)
    setWaste(newWaste)
    setSelectedCard(null)
    setMoves((m) => m + 1)
    audio.playFlip()
  }

  // Handle Card Click & Target Selection
  const handleCardClick = (
    pile: "tableau" | "waste" | "foundation",
    colIndex: number | undefined,
    cardIndex: number
  ) => {
    setHint(null)
    if (selectedCard) {
      const { pile: fromPile, colIndex: fromCol, cardIndex: fromIdx } = selectedCard

      // Deselect if same card clicked
      if (fromPile === pile && fromCol === colIndex && fromIdx === cardIndex) {
        setSelectedCard(null)
        return
      }

      let fromCards: PlayingCard[]
      if (fromPile === "tableau" && fromCol !== undefined) {
        fromCards = tableau[fromCol]
      } else if (fromPile === "waste") {
        fromCards = waste
      } else if (fromPile === "foundation" && fromCol !== undefined) {
        fromCards = foundations[fromCol]
      } else {
        setSelectedCard(null)
        return
      }

      const movingCard = fromCards[fromIdx]

      // Target is Tableau column
      if (pile === "tableau" && colIndex !== undefined) {
        const toCards = tableau[colIndex]
        const targetTop = toCards[toCards.length - 1]

        if (canPlaceOnTableau(movingCard, targetTop)) {
          recordHistory()

          const newTableau = tableau.map((col) => [...col])
          const movedStack = fromCards.slice(fromIdx)

          if (fromPile === "tableau" && fromCol !== undefined) {
            newTableau[fromCol] = fromCards.slice(0, fromIdx)
            if (newTableau[fromCol].length > 0) {
              newTableau[fromCol][newTableau[fromCol].length - 1].faceUp = true
            }
          } else if (fromPile === "waste") {
            setWaste(waste.slice(0, -1))
          } else if (fromPile === "foundation" && fromCol !== undefined) {
            const newFoundations = foundations.map((f, i) =>
              i === fromCol ? f.slice(0, -1) : [...f]
            )
            setFoundations(newFoundations)
          }

          newTableau[colIndex] = [...toCards, ...movedStack]
          setTableau(newTableau)
          setSelectedCard(null)
          setMoves((m) => m + 1)
          
          // Scoring
          if (fromPile === "waste") setScore((s) => s + 5)
          if (fromPile === "foundation") setScore((s) => Math.max(0, s - 15))

          audio.playSnap()
          checkWinState(newTableau, foundations)
          return
        }
      }

      // Target is Foundation pile
      if (pile === "foundation" && colIndex !== undefined) {
        // Can only move single top card to foundation
        if (fromIdx !== fromCards.length - 1) {
          setSelectedCard(null)
          return
        }

        const targetFoundation = foundations[colIndex]
        if (canPlaceOnFoundation(movingCard, targetFoundation)) {
          recordHistory()

          const newFoundations = foundations.map((f, i) =>
            i === colIndex ? [...f, { ...movingCard, faceUp: true }] : [...f]
          )

          if (fromPile === "tableau" && fromCol !== undefined) {
            const newTableau = tableau.map((col, i) => {
              if (i === fromCol) {
                const updated = col.slice(0, -1)
                if (updated.length > 0) updated[updated.length - 1].faceUp = true
                return updated
              }
              return [...col]
            })
            setTableau(newTableau)
          } else if (fromPile === "waste") {
            setWaste(waste.slice(0, -1))
          }

          setFoundations(newFoundations)
          setSelectedCard(null)
          setMoves((m) => m + 1)

          // Scoring
          const gain = difficulty === "vegas" ? 5 : 10
          setScore((s) => s + gain)

          audio.playFoundation()
          checkWinState(tableau, newFoundations)
          return
        }
      }

      setSelectedCard(null)
    } else {
      // Select source card
      let cards: PlayingCard[]
      if (pile === "tableau" && colIndex !== undefined) cards = tableau[colIndex]
      else if (pile === "waste") cards = waste
      else if (pile === "foundation" && colIndex !== undefined) cards = foundations[colIndex]
      else return

      if (cards.length === 0) return
      const clickedCard = cards[cardIndex]
      if (!clickedCard || !clickedCard.faceUp) return

      setSelectedCard({ pile, colIndex, cardIndex })
      audio.playFlip()
    }
  }

  // Double Click / Quick Auto Move
  const handleDoubleClick = (
    pile: "tableau" | "waste",
    colIndex: number | undefined,
    cardIndex: number
  ) => {
    setHint(null)
    let sourceCards: PlayingCard[]
    if (pile === "tableau" && colIndex !== undefined) sourceCards = tableau[colIndex]
    else if (pile === "waste") sourceCards = waste
    else return

    if (sourceCards.length === 0 || cardIndex !== sourceCards.length - 1) return
    const card = sourceCards[cardIndex]
    if (!card || !card.faceUp) return

    // Try moving to Foundations first
    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (canPlaceOnFoundation(card, foundations[fIdx])) {
        recordHistory()
        const newFoundations = foundations.map((f, i) =>
          i === fIdx ? [...f, { ...card, faceUp: true }] : [...f]
        )

        if (pile === "tableau" && colIndex !== undefined) {
          const newTableau = tableau.map((col, i) => {
            if (i === colIndex) {
              const updated = col.slice(0, -1)
              if (updated.length > 0) updated[updated.length - 1].faceUp = true
              return updated
            }
            return [...col]
          })
          setTableau(newTableau)
        } else if (pile === "waste") {
          setWaste(waste.slice(0, -1))
        }

        setFoundations(newFoundations)
        setSelectedCard(null)
        setMoves((m) => m + 1)
        setScore((s) => s + (difficulty === "vegas" ? 5 : 10))
        audio.playFoundation()
        checkWinState(tableau, newFoundations)
        return
      }
    }
  }

  // HTML5 Drag & Drop Handlers
  const handleDragStart = (
    e: React.DragEvent,
    pile: "tableau" | "waste" | "foundation",
    colIndex: number | undefined,
    cardIndex: number
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ pile, colIndex, cardIndex })
    )
    setSelectedCard({ pile, colIndex, cardIndex })
  }

  const handleDropOnTableau = (e: React.DragEvent, targetColIndex: number) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json")) as SelectedCardInfo
      handleCardClick("tableau", targetColIndex, tableau[targetColIndex].length)
    } catch {}
  }

  const handleDropOnFoundation = (e: React.DragEvent, targetFoundationIndex: number) => {
    e.preventDefault()
    try {
      handleCardClick("foundation", targetFoundationIndex, foundations[targetFoundationIndex].length)
    } catch {}
  }

  // Check Win Condition
  const checkWinState = (t: PlayingCard[][], f: PlayingCard[][]) => {
    const totalFoundationCount = f.reduce((sum, pile) => sum + pile.length, 0)
    if (totalFoundationCount === 52) {
      setIsTimerRunning(false)
      setPhase("won")
      audio.playVictory()

      setStats((prev) => {
        const next: SolitaireStats = {
          gamesPlayed: prev.gamesPlayed,
          gamesWon: prev.gamesWon + 1,
          bestScore: Math.max(prev.bestScore, score + 100),
          bestTime: prev.bestTime === 0 ? timer : Math.min(prev.bestTime, timer),
          fewestMoves: prev.fewestMoves === 0 ? moves + 1 : Math.min(prev.fewestMoves, moves + 1),
          winStreak: prev.winStreak + 1
        }
        try {
          localStorage.setItem("solitaire_modern_stats", JSON.stringify(next))
        } catch {}
        return next
      })
    }
  }

  // Undo Move
  const handleUndo = () => {
    if (history.length === 0) return
    const lastState = history[history.length - 1]
    setTableau(lastState.tableau)
    setStock(lastState.stock)
    setWaste(lastState.waste)
    setFoundations(lastState.foundations)
    setScore(lastState.score)
    setMoves(lastState.moves)
    setStockPasses(lastState.stockPasses)
    setHistory((h) => h.slice(0, -1))
    setSelectedCard(null)
    setHint(null)
    audio.playUndo()
  }

  // Smart Hint Engine
  const handleGetHint = () => {
    // 1. Check if waste card can go to foundation
    if (waste.length > 0) {
      const topWaste = waste[waste.length - 1]
      for (let fIdx = 0; fIdx < 4; fIdx++) {
        if (canPlaceOnFoundation(topWaste, foundations[fIdx])) {
          setHint({
            from: { pile: "waste", cardIndex: waste.length - 1 },
            to: { pile: "foundation", colIndex: fIdx }
          })
          audio.playHint()
          return
        }
      }
    }

    // 2. Check if tableau top card can go to foundation
    for (let cIdx = 0; cIdx < 7; cIdx++) {
      const col = tableau[cIdx]
      if (col.length > 0) {
        const topCard = col[col.length - 1]
        for (let fIdx = 0; fIdx < 4; fIdx++) {
          if (canPlaceOnFoundation(topCard, foundations[fIdx])) {
            setHint({
              from: { pile: "tableau", colIndex: cIdx, cardIndex: col.length - 1 },
              to: { pile: "foundation", colIndex: fIdx }
            })
            audio.playHint()
            return
          }
        }
      }
    }

    // 3. Check waste to tableau
    if (waste.length > 0) {
      const topWaste = waste[waste.length - 1]
      for (let cIdx = 0; cIdx < 7; cIdx++) {
        const col = tableau[cIdx]
        const targetTop = col[col.length - 1]
        if (canPlaceOnTableau(topWaste, targetTop)) {
          setHint({
            from: { pile: "waste", cardIndex: waste.length - 1 },
            to: { pile: "tableau", colIndex: cIdx }
          })
          audio.playHint()
          return
        }
      }
    }

    // 4. Check tableau to tableau (prioritize exposing hidden cards)
    for (let fromCol = 0; fromCol < 7; fromCol++) {
      const col = tableau[fromCol]
      const firstFaceUpIdx = col.findIndex((c) => c.faceUp)
      if (firstFaceUpIdx !== -1) {
        const movingCard = col[firstFaceUpIdx]
        for (let toCol = 0; toCol < 7; toCol++) {
          if (fromCol === toCol) continue
          const targetTop = tableau[toCol][tableau[toCol].length - 1]
          if (canPlaceOnTableau(movingCard, targetTop)) {
            // Don't offer moving King from empty to empty
            if (!targetTop && firstFaceUpIdx === 0) continue

            setHint({
              from: { pile: "tableau", colIndex: fromCol, cardIndex: firstFaceUpIdx },
              to: { pile: "tableau", colIndex: toCol }
            })
            audio.playHint()
            return
          }
        }
      }
    }

    // 5. Suggest drawing stock if available
    if (stock.length > 0) {
      setHint({
        from: { pile: "waste", cardIndex: 0 },
        to: { pile: "waste" }
      })
      audio.playHint()
    }
  }

  // Check if Auto-Complete is ready
  const isAutoCompleteReady = useCallback(() => {
    if (stock.length > 0 || waste.length > 0) return false
    // All cards in tableau must be face-up
    for (const col of tableau) {
      for (const card of col) {
        if (!card.faceUp) return false
      }
    }
    const foundationCount = foundations.reduce((s, p) => s + p.length, 0)
    return foundationCount < 52
  }, [stock, waste, tableau, foundations])

  // Run Auto Complete sequence
  const handleAutoComplete = async () => {
    if (isAutoCompleting) return
    setIsAutoCompleting(true)

    const currentTableau = tableau.map((col) => [...col])
    const currentFoundations = foundations.map((f) => [...f])

    while (true) {
      let movedAny = false
      for (let colIdx = 0; colIdx < 7; colIdx++) {
        const col = currentTableau[colIdx]
        if (col.length > 0) {
          const card = col[col.length - 1]
          for (let fIdx = 0; fIdx < 4; fIdx++) {
            if (canPlaceOnFoundation(card, currentFoundations[fIdx])) {
              col.pop()
              currentFoundations[fIdx].push({ ...card, faceUp: true })
              setTableau(currentTableau.map((c) => [...c]))
              setFoundations(currentFoundations.map((f) => [...f]))
              setScore((s) => s + 10)
              setMoves((m) => m + 1)
              audio.playFoundation()
              movedAny = true
              await new Promise((res) => setTimeout(res, 80))
              break
            }
          }
        }
      }
      if (!movedAny) break
    }

    setIsAutoCompleting(false)
    checkWinState(currentTableau, currentFoundations)
  }

  // Render Card Component
  const renderCardItem = (
    card: PlayingCard,
    pile: "tableau" | "waste" | "foundation",
    colIndex: number | undefined,
    cardIndex: number
  ) => {
    const isSelected =
      selectedCard &&
      selectedCard.pile === pile &&
      selectedCard.colIndex === colIndex &&
      selectedCard.cardIndex === cardIndex

    const isHintSource =
      hint &&
      hint.from.pile === pile &&
      hint.from.colIndex === colIndex &&
      hint.from.cardIndex === cardIndex

    if (!card.faceUp) {
      // Card Back Styling
      const backStyleClasses = {
        classic: "bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-900 border-indigo-400/50",
        cyberpunk: "bg-gradient-to-br from-cyan-600 via-purple-700 to-pink-600 border-cyan-400",
        vintage: "bg-gradient-to-br from-amber-900 via-red-950 to-stone-900 border-amber-500/40",
        gold: "bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700 border-yellow-300",
        minimal: "bg-neutral-800 border-neutral-600"
      }

      return (
        <div
          className={`w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 shadow-md cursor-pointer select-none relative transition-all transform hover:-translate-y-0.5 ${
            backStyleClasses[cardBack]
          }`}
          onClick={() => handleCardClick(pile, colIndex, cardIndex)}
        >
          <div className="absolute inset-1 rounded border border-white/20 flex items-center justify-center bg-black/10">
            <div className="w-4 h-4 rounded-full border border-white/30" />
          </div>
        </div>
      )
    }

    // Card Face Styling
    const isRed = card.suit === "hearts" || card.suit === "diamonds"
    const colorClass = isRed ? "text-red-600 dark:text-red-500" : "text-gray-900 dark:text-gray-100"

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, pile, colIndex, cardIndex)}
        onClick={() => handleCardClick(pile, colIndex, cardIndex)}
        onDoubleClick={() => handleDoubleClick(pile as "tableau" | "waste", colIndex, cardIndex)}
        className={`w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md flex flex-col justify-between p-1.5 cursor-pointer select-none relative transition-all duration-150 transform hover:-translate-y-1 ${
          isSelected
            ? "ring-4 ring-yellow-400 dark:ring-yellow-500 -translate-y-2 z-30 shadow-xl"
            : ""
        } ${isHintSource ? "ring-4 ring-emerald-400 animate-pulse z-30" : ""}`}
      >
        {/* Top-Left Rank & Suit */}
        <div className={`flex flex-col leading-none font-bold text-xs sm:text-sm ${colorClass}`}>
          <span>{RANKS[card.rank - 1]}</span>
          <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</span>
        </div>

        {/* Center Suit Icon / Badge */}
        <div className={`text-xl sm:text-2xl md:text-3xl self-center font-bold ${colorClass}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>

        {/* Bottom-Right Rank & Suit */}
        <div className={`flex flex-col leading-none font-bold text-xs sm:text-sm self-end rotate-180 ${colorClass}`}>
          <span>{RANKS[card.rank - 1]}</span>
          <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
      </div>
    )
  }

  // Table Felt Styling
  const feltThemesMap: Record<FeltTheme, string> = {
    emerald: "bg-gradient-to-b from-emerald-900 via-emerald-950 to-green-950 border-emerald-800/40 text-emerald-100",
    midnight: "bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 border-blue-900/40 text-blue-100",
    crimson: "bg-gradient-to-b from-rose-950 via-red-950 to-neutral-950 border-rose-900/40 text-rose-100",
    obsidian: "bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-neutral-800/40 text-amber-100"
  }

  return (
    <div className="flex flex-col items-center w-full min-h-[700px] px-2 sm:px-4 py-4 select-none">
      {/* Top Header Controls Bar */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-lg text-white">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md font-bold text-xl"
            style={{ backgroundColor: themeColor }}
          >
            ♠
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Solitaire Pro</h1>
            <span className="text-xs text-slate-400 capitalize">{difficulty} Mode</span>
          </div>
        </div>

        {/* Dynamic Stats Badges */}
        {phase === "playing" && (
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{score} pts</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>{moves} Moves</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {phase === "playing" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                onClick={handleUndo}
                disabled={history.length === 0}
                title="Undo Move"
              >
                <Undo2 className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Undo</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-300"
                onClick={handleGetHint}
                title="Get Smart Hint"
              >
                <Sparkles className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Hint</span>
              </Button>

              {isAutoCompleteReady() && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold animate-bounce"
                  onClick={handleAutoComplete}
                  disabled={isAutoCompleting}
                >
                  <CheckCircle2 className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Auto Complete</span>
                </Button>
              )}
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:bg-slate-800"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            onClick={() => startNewGame()}
          >
            <RotateCcw className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">New Game</span>
          </Button>
        </div>
      </div>

      {/* Main Game Menu View */}
      {phase === "menu" && (
        <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center backdrop-blur-lg my-auto">
          <div
            className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl text-5xl text-white font-black"
            style={{ backgroundColor: themeColor }}
          >
            ♠
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">Klondike Solitaire</h2>
          <p className="text-slate-400 mb-6 text-sm">
            Stack suits from Ace to King. Choose your preferred game mode and felt theme.
          </p>

          {/* Difficulty Selector */}
          <div className="mb-6 text-left">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Difficulty Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["easy", "medium", "hard", "vegas"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    difficulty === d
                      ? "border-blue-500 bg-blue-600/20 text-white font-bold"
                      : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <div className="text-sm capitalize">{d}</div>
                  <div className="text-[10px] text-slate-400">
                    {d === "easy" && "Draw 1 • High Win Rate"}
                    {d === "medium" && "Draw 1 • 3 Passes Max"}
                    {d === "hard" && "Draw 3 • Unlimited Passes"}
                    {d === "vegas" && "Draw 3 • Vegas Scoring"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Felt Theme & Card Back Selectors */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Felt Table
              </label>
              <select
                value={feltTheme}
                onChange={(e) => setFeltTheme(e.target.value as FeltTheme)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="emerald">Emerald Felt</option>
                <option value="midnight">Midnight Sapphire</option>
                <option value="crimson">Royal Crimson</option>
                <option value="obsidian">Dark Obsidian</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Card Back
              </label>
              <select
                value={cardBack}
                onChange={(e) => setCardBack(e.target.value as CardBackStyle)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="classic">Classic Royal</option>
                <option value="cyberpunk">Cyber Neon</option>
                <option value="vintage">Vintage Damask</option>
                <option value="gold">Gold Foil</option>
                <option value="minimal">Minimal Dark</option>
              </select>
            </div>
          </div>

          {/* Player Stats */}
          {stats.gamesPlayed > 0 && (
            <div className="grid grid-cols-3 gap-2 bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl mb-6 text-xs text-slate-300">
              <div>
                <div className="text-slate-400">Wins</div>
                <div className="font-bold text-white text-base">{stats.gamesWon}</div>
              </div>
              <div>
                <div className="text-slate-400">Best Score</div>
                <div className="font-bold text-amber-400 text-base">{stats.bestScore}</div>
              </div>
              <div>
                <div className="text-slate-400">Win Rate</div>
                <div className="font-bold text-emerald-400 text-base">
                  {Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%
                </div>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="w-full font-bold py-6 text-lg shadow-xl"
            style={{ backgroundColor: themeColor }}
            onClick={() => startNewGame()}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Playing
          </Button>
        </div>
      )}

      {/* Main Playing Board */}
      {phase === "playing" && (
        <div
          className={`w-full max-w-5xl rounded-3xl p-4 sm:p-6 shadow-2xl border flex flex-col gap-6 relative transition-colors duration-300 ${feltThemesMap[feltTheme]}`}
        >
          {/* Top Row: Stock, Waste, and 4 Foundations */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Stock & Waste Piles */}
            <div className="flex gap-2 sm:gap-3">
              {/* Stock Pile */}
              <div className="relative cursor-pointer" onClick={handleStockClick}>
                {stock.length > 0 ? (
                  renderCardItem(stock[stock.length - 1], "tableau", undefined, stock.length - 1)
                ) : (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:bg-white/5 transition-colors">
                    <RotateCcw className="w-6 h-6" />
                    <span className="text-[10px] mt-1">Recycle</span>
                  </div>
                )}
              </div>

              {/* Waste Pile */}
              <div className="relative">
                {waste.length > 0 ? (
                  renderCardItem(waste[waste.length - 1], "waste", undefined, waste.length - 1)
                ) : (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/20">
                    Waste
                  </div>
                )}
              </div>
            </div>

            {/* Foundations Piles */}
            <div className="flex gap-2 sm:gap-3">
              {foundations.map((fPile, fIdx) => {
                const isTarget =
                  selectedCard &&
                  canPlaceOnFoundation(
                    selectedCard.pile === "tableau"
                      ? tableau[selectedCard.colIndex!][selectedCard.cardIndex]
                      : waste[selectedCard.cardIndex],
                    fPile
                  )

                return (
                  <div
                    key={fIdx}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnFoundation(e, fIdx)}
                    onClick={() => {
                      if (selectedCard) {
                        handleCardClick("foundation", fIdx, fPile.length)
                      }
                    }}
                    className={`relative rounded-lg transition-all ${
                      isTarget ? "ring-4 ring-emerald-400 scale-105" : ""
                    }`}
                  >
                    {fPile.length > 0 ? (
                      renderCardItem(fPile[fPile.length - 1], "foundation", fIdx, fPile.length - 1)
                    ) : (
                      <div className="w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-2xl sm:text-3xl text-white/30 bg-black/10">
                        {SUIT_SYMBOLS[SUITS[fIdx]]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tableau Columns */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 justify-items-center min-h-[360px] pt-2">
            {tableau.map((col, colIdx) => {
              const isTarget =
                selectedCard &&
                selectedCard.pile &&
                canPlaceOnTableau(
                  selectedCard.pile === "tableau"
                    ? tableau[selectedCard.colIndex!][selectedCard.cardIndex]
                    : waste[selectedCard.cardIndex],
                  col[col.length - 1]
                )

              return (
                <div
                  key={colIdx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnTableau(e, colIdx)}
                  onClick={() => {
                    if (col.length === 0 && selectedCard) {
                      handleCardClick("tableau", colIdx, 0)
                    }
                  }}
                  className={`w-full flex flex-col items-center min-h-[140px] rounded-xl transition-all ${
                    isTarget ? "bg-emerald-400/10 ring-2 ring-emerald-400/50" : ""
                  }`}
                >
                  {col.length === 0 ? (
                    <div className="w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 border-dashed border-white/15 flex items-center justify-center text-white/20 font-bold text-lg">
                      K
                    </div>
                  ) : (
                    col.map((card, cardIdx) => (
                      <div
                        key={card.id}
                        style={{
                          marginTop: cardIdx === 0 ? "0" : card.faceUp ? "-55px" : "-65px"
                        }}
                        className="relative z-10"
                      >
                        {renderCardItem(card, "tableau", colIdx, cardIdx)}
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Game Won Modal */}
      {phase === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl text-white shadow-xl animate-bounce"
              style={{ backgroundColor: themeColor }}
            >
              🏆
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Victory!</h2>
            <p className="text-slate-400 mb-6 text-sm">
              You cleared all 52 cards and completed the Solitaire challenge!
            </p>

            <div className="grid grid-cols-3 gap-3 bg-slate-800/80 p-4 rounded-xl mb-6 text-slate-200 text-sm">
              <div>
                <div className="text-xs text-slate-400">Score</div>
                <div className="text-lg font-bold text-amber-400">{score}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Moves</div>
                <div className="text-lg font-bold text-blue-400">{moves}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Time</div>
                <div className="text-lg font-bold text-emerald-400">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-700 bg-slate-800 text-white"
                onClick={() => setPhase("menu")}
              >
                Main Menu
              </Button>
              <Button
                className="flex-1 font-bold"
                style={{ backgroundColor: themeColor }}
                onClick={() => startNewGame()}
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
