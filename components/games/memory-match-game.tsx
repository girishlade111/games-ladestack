"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Clock,
  Target,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Eye,
  Shuffle,
  Snowflake,
  Flame,
  HelpCircle,
  BarChart2,
  Grid,
  Layers,
  Award,
  CheckCircle2,
  Crown,
  RefreshCw
} from "lucide-react"

interface MemoryMatchGameProps {
  onBack?: () => void
  themeColor?: string
}

// ---------------------------------------------------------------------------
// TYPES & CONFIGS
// ---------------------------------------------------------------------------

type GameMode = "classic" | "speed" | "peek" | "chaos"
type Difficulty = "beginner" | "standard" | "expert" | "master" | "grandmaster"
type ThemeId = "arcade" | "cyber" | "fantasy" | "space" | "animals"

interface CardSymbol {
  icon: string
  label: string
}

interface CardItem {
  id: number
  pairId: number
  symbol: CardSymbol
  isFlipped: boolean
  isMatched: boolean
  isHighlighted: boolean
  isPeeking: boolean
}

interface DifficultyConfig {
  name: string
  pairs: number
  rows: number
  cols: number
  timeLimit: number // for speed mode or timer countdown
  peekDuration: number // seconds to view in peek mode
  flipDelay: number // delay before auto flipping unmatched cards
  description: string
  badge: string
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    name: "Beginner",
    pairs: 6,
    rows: 3,
    cols: 4,
    timeLimit: 120,
    peekDuration: 5,
    flipDelay: 1200,
    description: "3x4 Grid • 6 Pairs • Relaxed Memory Practice",
    badge: "Easy",
  },
  standard: {
    name: "Standard",
    pairs: 8,
    rows: 4,
    cols: 4,
    timeLimit: 90,
    peekDuration: 4,
    flipDelay: 1000,
    description: "4x4 Grid • 8 Pairs • Balanced Challenge",
    badge: "Medium",
  },
  expert: {
    name: "Expert",
    pairs: 10,
    rows: 4,
    cols: 5,
    timeLimit: 75,
    peekDuration: 3,
    flipDelay: 800,
    description: "4x5 Grid • 10 Pairs • High Focus Required",
    badge: "Hard",
  },
  master: {
    name: "Master",
    pairs: 12,
    rows: 4,
    cols: 6,
    timeLimit: 60,
    peekDuration: 3,
    flipDelay: 700,
    description: "4x6 Grid • 12 Pairs • Pro Memory Challenge",
    badge: "Insane",
  },
  grandmaster: {
    name: "Grandmaster",
    pairs: 15,
    rows: 5,
    cols: 6,
    timeLimit: 60,
    peekDuration: 2,
    flipDelay: 600,
    description: "5x6 Grid • 15 Pairs • Extreme Mind Test",
    badge: "Master",
  },
}

interface ModeConfig {
  name: string
  icon: React.ReactNode
  description: string
  color: string
}

const GAME_MODES: Record<GameMode, ModeConfig> = {
  classic: {
    name: "Classic Match",
    icon: <Grid className="w-5 h-5 text-emerald-400" />,
    description: "Match all card pairs with minimal moves & time.",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  },
  speed: {
    name: "Speed Rush",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    description: "Race against the clock! +5s bonus time for every match.",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
  },
  peek: {
    name: "Peek & Memorize",
    icon: <Eye className="w-5 h-5 text-cyan-400" />,
    description: "Cards revealed briefly at the start! Memorize fast before they flip.",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
  },
  chaos: {
    name: "Chaos Mode",
    icon: <Shuffle className="w-5 h-5 text-purple-400" />,
    description: "Beware! Unmatched cards shuffle positions every 3 miss-matches.",
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
  },
}

interface ThemeConfig {
  name: string
  color: string
  bgGlow: string
  symbols: CardSymbol[]
}

const THEMES: Record<ThemeId, ThemeConfig> = {
  arcade: {
    name: "Arcade Emojis",
    color: "from-pink-500 to-rose-500",
    bgGlow: "rgba(236, 72, 153, 0.15)",
    symbols: [
      { icon: "🎮", label: "Gamepad" },
      { icon: "👾", label: "Alien" },
      { icon: "🎲", label: "Dice" },
      { icon: "🎯", label: "Bullseye" },
      { icon: "🎪", label: "Circus" },
      { icon: "🎨", label: "Palette" },
      { icon: "🎭", label: "Theater" },
      { icon: "🎸", label: "Guitar" },
      { icon: "🎺", label: "Trumpet" },
      { icon: "🎻", label: "Violin" },
      { icon: "🎹", label: "Piano" },
      { icon: "🎤", label: "Mic" },
      { icon: "🎧", label: "Headphones" },
      { icon: "🎬", label: "Clapper" },
      { icon: "🏆", label: "Trophy" },
      { icon: "🔮", label: "Crystal" },
    ],
  },
  cyber: {
    name: "Cyber Neon",
    color: "from-cyan-500 to-blue-600",
    bgGlow: "rgba(6, 182, 212, 0.15)",
    symbols: [
      { icon: "⚡", label: "Lightning" },
      { icon: "🤖", label: "Robot" },
      { icon: "🌐", label: "Network" },
      { icon: "💾", label: "Disk" },
      { icon: "🛰️", label: "Satellite" },
      { icon: "🧬", label: "DNA" },
      { icon: "🔋", label: "Battery" },
      { icon: "🛸", label: "UFO" },
      { icon: "📡", label: "Radar" },
      { icon: "🔬", label: "Scope" },
      { icon: "⚙️", label: "Gear" },
      { icon: "🔑", label: "Key" },
      { icon: "💻", label: "Laptop" },
      { icon: "🕹️", label: "Joystick" },
      { icon: "📱", label: "Phone" },
      { icon: "📟", label: "Pager" },
    ],
  },
  fantasy: {
    name: "Fantasy Quest",
    color: "from-amber-500 to-yellow-600",
    bgGlow: "rgba(245, 158, 11, 0.15)",
    symbols: [
      { icon: "🐉", label: "Dragon" },
      { icon: "⚔️", label: "Swords" },
      { icon: "💎", label: "Gem" },
      { icon: "👑", label: "Crown" },
      { icon: "🪄", label: "Wand" },
      { icon: "🛡️", label: "Shield" },
      { icon: "🧪", label: "Potion" },
      { icon: "📜", label: "Scroll" },
      { icon: "🏰", label: "Castle" },
      { icon: "💍", label: "Ring" },
      { icon: "🕯️", label: "Candle" },
      { icon: "🗝️", label: "Key" },
      { icon: "🦄", label: "Unicorn" },
      { icon: "🪙", label: "Coin" },
      { icon: "🏹", label: "Bow" },
      { icon: "🔮", label: "Orb" },
    ],
  },
  space: {
    name: "Space Cosmos",
    color: "from-indigo-500 to-purple-600",
    bgGlow: "rgba(99, 102, 241, 0.15)",
    symbols: [
      { icon: "🚀", label: "Rocket" },
      { icon: "🪐", label: "Saturn" },
      { icon: "👨‍🚀", label: "Astronaut" },
      { icon: "☄️", label: "Comet" },
      { icon: "🌟", label: "Star" },
      { icon: "🌌", label: "Galaxy" },
      { icon: "🔭", label: "Telescope" },
      { icon: "🌕", label: "Moon" },
      { icon: "☀️", label: "Sun text" },
      { icon: "🛸", label: "Alien Ship" },
      { icon: "🌍", label: "Earth" },
      { icon: "🌠", label: "Meteor" },
      { icon: "🛰️", label: "Station" },
      { icon: "👽", label: "Alien" },
      { icon: "💥", label: "Supernova" },
      { icon: "✨", label: "Sparkles" },
    ],
  },
  animals: {
    name: "Cute Animals",
    color: "from-emerald-500 to-green-600",
    bgGlow: "rgba(16, 185, 129, 0.15)",
    symbols: [
      { icon: "🐼", label: "Panda" },
      { icon: "🦊", label: "Fox" },
      { icon: "🦉", label: "Owl" },
      { icon: "🦁", label: "Lion" },
      { icon: "🐯", label: "Tiger" },
      { icon: "🐨", label: "Koala" },
      { icon: "🐸", label: "Frog" },
      { icon: "🐧", label: "Penguin" },
      { icon: "🐙", label: "Octopus" },
      { icon: "🦩", label: "Flamingo" },
      { icon: "🐬", label: "Dolphin" },
      { icon: "🦋", label: "Butterfly" },
      { icon: "🐝", label: "Bee" },
      { icon: "🦔", label: "Hedgehog" },
      { icon: "🦥", label: "Sloth" },
      { icon: "🦦", label: "Otter" },
    ],
  },
}

interface HighScoreStats {
  bestTime: number // seconds
  fewestMoves: number
  highScore: number
  totalWins: number
  totalGames: number
}

interface FloatingParticle {
  id: number
  x: number
  y: number
  text: string
  color: string
}

// ---------------------------------------------------------------------------
// AUDIO SYNTHESIZER
// ---------------------------------------------------------------------------

class AudioSynth {
  private ctx: AudioContext | null = null
  public enabled: boolean = true

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.ctx = new AudioContextClass()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
  }

  playFlip() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(320, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.08)

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.08)
  }

  playMatch(streakMultiplier: number = 1) {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const baseFreq = 523.25 * Math.pow(1.06, streakMultiplier - 1) // C5 base with octave boost on streak
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]

    notes.forEach((freq, i) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06)

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.06 + 0.18)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(this.ctx.currentTime + i * 0.06)
      osc.stop(this.ctx.currentTime + i * 0.06 + 0.18)
    })
  }

  playMismatch() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(220, this.ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.18)

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.18)
  }

  playPowerup() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(400, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25)

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.25)
  }

  playVictory() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const arpeggio = [523.25, 659.25, 783.99, 1046.5]
    arpeggio.forEach((freq, i) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.1)

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.1 + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(this.ctx.currentTime + i * 0.1)
      osc.stop(this.ctx.currentTime + i * 0.1 + 0.3)
    })
  }

  playTick() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(800, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.04)
  }
}

const audioSynth = new AudioSynth()

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function MemoryMatchGame({ onBack }: MemoryMatchGameProps) {
  // Game Setup State
  const [difficulty, setDifficulty] = useState<Difficulty>("standard")
  const [gameMode, setGameMode] = useState<GameMode>("classic")
  const [activeTheme, setActiveTheme] = useState<ThemeId>("arcade")
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Game Play State
  const [cards, setCards] = useState<CardItem[]>([])
  const [flippedCardIds, setFlippedCardIds] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [mismatches, setMismatches] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(90)
  const [peekCountdown, setPeekCountdown] = useState<number | null>(null)

  // System Flags
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLocked, setIsLocked] = useState(false) // lock inputs during animations/peeking
  const [showStartModal, setShowStartModal] = useState(true)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false)
  const [gameOutcome, setGameOutcome] = useState<"win" | "timeup">("win")

  // Power-Ups State
  const [scanPowerups, setScanPowerups] = useState(2)
  const [magnetPowerups, setMagnetPowerups] = useState(1)
  const [freezePowerups, setFreezePowerups] = useState(1)
  const [isFrozen, setIsFrozen] = useState(false)

  // Visual Effects State
  const [particles, setParticles] = useState<FloatingParticle[]>([])
  const [comboBanner, setComboBanner] = useState<string | null>(null)

  // High Scores State
  const [stats, setStats] = useState<Record<string, HighScoreStats>>({})

  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const freezeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const comboBannerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync sound enable state with synth
  useEffect(() => {
    audioSynth.enabled = soundEnabled
  }, [soundEnabled])

  // Load High Scores & Stats from localStorage
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem("memory_match_stats_v1")
      if (storedStats) {
        setStats(JSON.parse(storedStats))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Save Stats to LocalStorage
  const saveStats = useCallback(
    (newStats: Record<string, HighScoreStats>) => {
      setStats(newStats)
      try {
        localStorage.setItem("memory_match_stats_v1", JSON.stringify(newStats))
      } catch {
        // Ignore storage errors
      }
    },
    []
  )

  // Trigger floating particles
  const spawnParticles = (text: string, color: string) => {
    const newParticle: FloatingParticle = {
      id: Date.now() + Math.random(),
      x: Math.floor(Math.random() * 60) + 20, // percentage position
      y: Math.floor(Math.random() * 30) + 40,
      text,
      color,
    }
    setParticles((prev) => [...prev, newParticle])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id))
    }, 1200)
  }

  // Initialize Game Board
  const initializeGame = useCallback(() => {
    const diffConfig = DIFFICULTIES[difficulty]
    const themeConfig = THEMES[activeTheme]

    // Select pairs from theme
    const selectedSymbols = themeConfig.symbols.slice(0, diffConfig.pairs)

    // Build pairs
    const cardList: CardItem[] = []
    let idCounter = 0

    selectedSymbols.forEach((sym, pairIdx) => {
      // Card 1
      cardList.push({
        id: idCounter++,
        pairId: pairIdx,
        symbol: sym,
        isFlipped: false,
        isMatched: false,
        isHighlighted: false,
        isPeeking: false,
      })
      // Card 2
      cardList.push({
        id: idCounter++,
        pairId: pairIdx,
        symbol: sym,
        isFlipped: false,
        isMatched: false,
        isHighlighted: false,
        isPeeking: false,
      })
    })

    // Shuffle cards
    cardList.sort(() => Math.random() - 0.5)

    setCards(cardList)
    setFlippedCardIds([])
    setMatchedPairs(0)
    setMoves(0)
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setMismatches(0)
    setTimeElapsed(0)
    setTimeRemaining(diffConfig.timeLimit)
    setIsPlaying(false)
    setIsPaused(false)
    setIsLocked(false)
    setShowEndModal(false)
    setIsFrozen(false)

    // Reset powerups per level
    setScanPowerups(difficulty === "beginner" ? 3 : difficulty === "standard" ? 2 : 1)
    setMagnetPowerups(difficulty === "beginner" ? 2 : 1)
    setFreezePowerups(gameMode === "speed" ? 2 : 1)
  }, [difficulty, activeTheme, gameMode])

  // Handle Start Button Click
  const handleStartGame = () => {
    initializeGame()
    setShowStartModal(false)
    setIsPlaying(true)

    // Peek Mode logic: reveal all cards at start
    if (gameMode === "peek") {
      const peekTime = DIFFICULTIES[difficulty].peekDuration
      setIsLocked(true)
      setPeekCountdown(peekTime)

      // Set all cards to peeking state
      setCards((prev) => prev.map((c) => ({ ...c, isPeeking: true })))

      const peekInterval = setInterval(() => {
        setPeekCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(peekInterval)
            setCards((cList) => cList.map((c) => ({ ...c, isPeeking: false })))
            setIsLocked(false)
            return null
          }
          audioSynth.playTick()
          return prev - 1
        })
      }, 1000)
    }
  }

  // Timer Tick Interval
  useEffect(() => {
    if (isPlaying && !isPaused && !isLocked && peekCountdown === null) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)

        if (gameMode === "speed") {
          if (!isFrozen) {
            setTimeRemaining((prev) => {
              if (prev <= 1) {
                // Game Over - Time Up!
                if (timerRef.current) clearInterval(timerRef.current)
                setIsPlaying(false)
                setGameOutcome("timeup")
                setShowEndModal(true)
                audioSynth.playMismatch()
                return 0
              }
              if (prev <= 10) {
                audioSynth.playTick()
              }
              return prev - 1
            })
          }
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, isPaused, isLocked, peekCountdown, gameMode, isFrozen])

  // Victory Handler
  const handleVictory = useCallback(() => {
    setIsPlaying(false)
    setGameOutcome("win")
    setShowEndModal(true)
    audioSynth.playVictory()

    // Calculate final score
    const timeBonus = Math.max(0, 300 - timeElapsed) * 10
    const moveBonus = Math.max(0, 50 - moves) * 20
    const streakBonus = maxStreak * 150
    const finalScore = Math.max(100, score + timeBonus + moveBonus + streakBonus)
    setScore(finalScore)

    // Key for storage: mode_difficulty
    const key = `${gameMode}_${difficulty}`
    const currentDiffStats = stats[key] || {
      bestTime: 9999,
      fewestMoves: 9999,
      highScore: 0,
      totalWins: 0,
      totalGames: 0,
    }

    const updatedStats: HighScoreStats = {
      bestTime: Math.min(currentDiffStats.bestTime, timeElapsed),
      fewestMoves: Math.min(currentDiffStats.fewestMoves, moves),
      highScore: Math.max(currentDiffStats.highScore, finalScore),
      totalWins: currentDiffStats.totalWins + 1,
      totalGames: currentDiffStats.totalGames + 1,
    }

    saveStats({
      ...stats,
      [key]: updatedStats,
    })
  }, [timeElapsed, moves, maxStreak, score, gameMode, difficulty, stats, saveStats])

  // Check Win Condition
  useEffect(() => {
    const targetPairs = DIFFICULTIES[difficulty].pairs
    if (matchedPairs === targetPairs && targetPairs > 0 && isPlaying) {
      handleVictory()
    }
  }, [matchedPairs, difficulty, isPlaying, handleVictory])

  // Card Flip Click Handler
  const handleCardClick = (cardId: number) => {
    if (!isPlaying || isPaused || isLocked) return

    const targetCard = cards.find((c) => c.id === cardId)
    if (!targetCard || targetCard.isFlipped || targetCard.isMatched || targetCard.isPeeking) return

    // Play flip sound
    audioSynth.playFlip()

    // If 1 card is already flipped, we flip second
    if (flippedCardIds.length === 0) {
      setFlippedCardIds([cardId])
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))
    } else if (flippedCardIds.length === 1) {
      const firstId = flippedCardIds[0]
      if (firstId === cardId) return // clicked same card

      setFlippedCardIds([firstId, cardId])
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))
      setMoves((prev) => prev + 1)
      setIsLocked(true)

      const firstCard = cards.find((c) => c.id === firstId)
      const secondCard = targetCard

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // MATCH FOUND!
        const newStreak = streak + 1
        setStreak(newStreak)
        setMaxStreak((prev) => Math.max(prev, newStreak))

        const streakBonus = newStreak * 50
        setScore((prev) => prev + 100 + streakBonus)

        audioSynth.playMatch(newStreak)

        if (newStreak >= 2) {
          const comboText = newStreak >= 4 ? `${newStreak}x MEGA COMBO!` : `${newStreak}x STREAK!`
          setComboBanner(comboText)
          spawnParticles(comboText, "#38bdf8")

          if (comboBannerTimeoutRef.current) clearTimeout(comboBannerTimeoutRef.current)
          comboBannerTimeoutRef.current = setTimeout(() => setComboBanner(null), 1500)
        }

        // Add bonus time in Speed mode
        if (gameMode === "speed") {
          setTimeRemaining((prev) => prev + 5)
          spawnParticles("+5s Bonus!", "#10b981")
        }

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === cardId ? { ...c, isMatched: true, isFlipped: true } : c))
          )
          setMatchedPairs((prev) => prev + 1)
          setFlippedCardIds([])
          setIsLocked(false)
        }, 400)
      } else {
        // MISMATCH!
        setStreak(0)
        const newMismatches = mismatches + 1
        setMismatches(newMismatches)

        audioSynth.playMismatch()

        // Chaos Mode shuffling logic after 3 mismatches
        const shouldShuffle = gameMode === "chaos" && newMismatches > 0 && newMismatches % 3 === 0

        const flipDelay = DIFFICULTIES[difficulty].flipDelay

        setTimeout(() => {
          setCards((prev) => {
            const nextCards = prev.map((c) =>
              c.id === firstId || c.id === cardId ? { ...c, isFlipped: false } : c
            )

            if (shouldShuffle) {
              spawnParticles("CHAOS SHUFFLE!", "#c084fc")
              audioSynth.playPowerup()

              // Extract unmatched cards and shuffle their positions
              const unmatched = nextCards.filter((c) => !c.isMatched)
              const matched = nextCards.filter((c) => c.isMatched)
              unmatched.sort(() => Math.random() - 0.5)

              return [...matched, ...unmatched]
            }

            return nextCards
          })

          setFlippedCardIds([])
          setIsLocked(false)
        }, flipDelay)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // POWER-UP ACTIONS
  // ---------------------------------------------------------------------------

  // Powerup 1: Scan Peek (Flash all unmatched cards for 1.5s)
  const handleUseScan = () => {
    if (scanPowerups <= 0 || !isPlaying || isPaused || isLocked) return
    setScanPowerups((prev) => prev - 1)
    setIsLocked(true)
    audioSynth.playPowerup()
    spawnParticles("RADAR SCAN!", "#38bdf8")

    setCards((prev) => prev.map((c) => (!c.isMatched ? { ...c, isPeeking: true } : c)))

    setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isPeeking: false })))
      setIsLocked(false)
    }, 1500)
  }

  // Powerup 2: Magnet Auto-Match (Instantly find & match 1 hidden pair)
  const handleUseMagnet = () => {
    if (magnetPowerups <= 0 || !isPlaying || isPaused || isLocked) return

    // Find an unmatched pair
    const unmatchedCards = cards.filter((c) => !c.isMatched)
    if (unmatchedCards.length < 2) return

    const targetPairId = unmatchedCards[0].pairId

    setMagnetPowerups((prev) => prev - 1)
    setIsLocked(true)
    audioSynth.playPowerup()
    spawnParticles("MAGNET MATCH!", "#f59e0b")

    // Highlight pair first
    setCards((prev) =>
      prev.map((c) => (c.pairId === targetPairId ? { ...c, isHighlighted: true, isFlipped: true } : c))
    )

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => (c.pairId === targetPairId ? { ...c, isMatched: true, isHighlighted: false } : c))
      )
      setMatchedPairs((prev) => prev + 1)
      setScore((prev) => prev + 150)
      setIsLocked(false)
    }, 800)
  }

  // Powerup 3: Time Freeze (Freeze timer for 10s)
  const handleUseFreeze = () => {
    if (freezePowerups <= 0 || !isPlaying || isPaused || isLocked || isFrozen) return
    setFreezePowerups((prev) => prev - 1)
    setIsFrozen(true)
    audioSynth.playPowerup()
    spawnParticles("TIME FREEZE!", "#06b6d4")

    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current)
    freezeTimerRef.current = setTimeout(() => {
      setIsFrozen(false)
    }, 10000)
  }

  // Powerup 4: Board Reshuffle (Shuffle remaining unmatched cards)
  const handleUseReshuffle = () => {
    if (!isPlaying || isPaused || isLocked) return
    setIsLocked(true)
    audioSynth.playPowerup()
    spawnParticles("SHUFFLE BOARD!", "#a855f7")

    setCards((prev) => {
      const unmatched = prev.filter((c) => !c.isMatched)
      const matched = prev.filter((c) => c.isMatched)
      unmatched.sort(() => Math.random() - 0.5)
      return [...matched, ...unmatched]
    })

    setTimeout(() => {
      setIsLocked(false)
    }, 400)
  }

  // Format Seconds MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins}:${s < 10 ? "0" : ""}${s}`
  }

  // Rating Stars
  const getRatingStars = () => {
    const totalPairs = DIFFICULTIES[difficulty].pairs
    const perfectMoves = totalPairs
    const ratio = moves / perfectMoves

    if (ratio <= 1.3) return 3
    if (ratio <= 1.8) return 2
    return 1
  }

  const { cols } = DIFFICULTIES[difficulty]
  const currentDiffKey = `${gameMode}_${difficulty}`
  const currentStats = stats[currentDiffKey]

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-between select-none relative overflow-hidden font-sans"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 20%, ${THEMES[activeTheme].bgGlow}, transparent 70%)`,
      }}
    >
      {/* Floating Particles Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute font-extrabold text-xl animate-bounce transition-all duration-1000"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              color: p.color,
              textShadow: "0 0 12px rgba(255,255,255,0.8)",
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* Floating Combo Banner */}
      {comboBanner && (
        <div className="absolute top-20 z-50 pointer-events-none animate-pulse">
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white px-6 py-2 rounded-full font-black text-lg shadow-2xl tracking-wider border border-white/40 uppercase">
            {comboBanner}
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-4 mb-4 z-10">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dashboard
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            MEMORY <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">MATCH</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-slate-300 w-9 h-9"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </Button>

          <Button
            onClick={() => setShowStatsModal(true)}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-slate-300 w-9 h-9"
          >
            <BarChart2 className="w-4 h-4 text-cyan-400" />
          </Button>

          <Button
            onClick={() => setShowHowToPlayModal(true)}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-slate-300 w-9 h-9"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </Button>

          <Button
            onClick={() => setShowStartModal(true)}
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold border-0 shadow-lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </header>

      {/* TOP DASHBOARD & STATS BAR */}
      {!showStartModal && (
        <div className="w-full max-w-4xl bg-slate-900/70 border border-slate-800 backdrop-blur-md rounded-2xl p-4 mb-4 shadow-xl grid grid-cols-2 md:grid-cols-5 gap-4 items-center z-10 text-center">
          {/* Time Display */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {gameMode === "speed" ? "Time Left" : "Elapsed"}
            </span>
            <span
              className={`font-mono text-xl font-bold ${
                gameMode === "speed" && timeRemaining <= 10 ? "text-rose-500 animate-pulse" : "text-cyan-300"
              }`}
            >
              {gameMode === "speed" ? formatTime(timeRemaining) : formatTime(timeElapsed)}
            </span>
          </div>

          {/* Moves Display */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              Moves
            </span>
            <span className="font-mono text-xl font-bold text-purple-300">{moves}</span>
          </div>

          {/* Matches Progress */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Matched
            </span>
            <span className="font-mono text-xl font-bold text-amber-300">
              {matchedPairs} / {DIFFICULTIES[difficulty].pairs}
            </span>
          </div>

          {/* Score & Streak */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Streak / Score
            </span>
            <span className="font-mono text-xl font-bold text-orange-300">
              {streak > 1 ? `${streak}x | ` : ""}
              {score}
            </span>
          </div>

          {/* Pause / Resume */}
          <div className="flex items-center justify-center col-span-2 md:col-span-1">
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="outline"
              size="sm"
              className="w-full bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200"
            >
              {isPaused ? <Play className="w-4 h-4 mr-1 text-emerald-400" /> : <Pause className="w-4 h-4 mr-1 text-amber-400" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
        </div>
      )}

      {/* PEEK COUNTDOWN OVERLAY */}
      {peekCountdown !== null && (
        <div className="mb-4 text-center z-10 animate-pulse">
          <span className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-6 py-2 rounded-full font-bold text-base">
            👁️ MEMORIZE CARDS! Flipping in {peekCountdown}s...
          </span>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-start overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center max-w-sm my-auto w-full shadow-2xl">
            <Pause className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-white mb-2">Game Paused</h2>
            <p className="text-slate-400 text-sm mb-6">Take a breath, test your memory when ready!</p>
            <Button
              onClick={() => setIsPaused(false)}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-xl"
            >
              Resume Game
            </Button>
          </div>
        </div>
      )}

      {/* GAME BOARD GRID */}
      {!showStartModal && (
        <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center my-auto z-10">
          <div
            className="grid gap-2 md:gap-3.5 w-full max-w-3xl mx-auto p-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {cards.map((card) => {
              const isFaceUp = card.isFlipped || card.isMatched || card.isPeeking

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`
                    aspect-[3/4] relative cursor-pointer select-none perspective-1000
                    transition-all duration-300 hover:scale-[1.03] active:scale-95
                    ${card.isMatched ? "opacity-75" : ""}
                  `}
                >
                  <div
                    className={`
                      w-full h-full rounded-xl transition-all duration-500 transform-style-3d shadow-xl
                      ${isFaceUp ? "rotate-y-180" : ""}
                    `}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFaceUp ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* BACK FACE (Hidden card) */}
                    <div
                      className={`
                        absolute inset-0 rounded-xl border flex flex-col items-center justify-center
                        backface-hidden shadow-inner overflow-hidden
                        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/80
                        hover:border-pink-500/50 hover:shadow-pink-500/10 transition-colors
                      `}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      {/* Metallic Grid Back Pattern */}
                      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-slate-600/50 bg-slate-800/80 flex items-center justify-center shadow-md relative z-10">
                        <Sparkles className="w-5 h-5 text-slate-400 opacity-60" />
                      </div>
                    </div>

                    {/* FRONT FACE (Revealed symbol) */}
                    <div
                      className={`
                        absolute inset-0 rounded-xl border flex flex-col items-center justify-center
                        backface-hidden shadow-2xl p-2
                        ${
                          card.isMatched
                            ? "bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-500/60 shadow-emerald-500/20"
                            : card.isHighlighted
                            ? "bg-gradient-to-br from-amber-950/90 to-slate-900 border-amber-400 shadow-amber-400/30"
                            : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-600"
                        }
                      `}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <span className="text-3xl md:text-5xl drop-shadow-md mb-1">{card.symbol.icon}</span>
                      <span className="text-[10px] md:text-xs font-semibold text-slate-400 truncate max-w-full">
                        {card.symbol.label}
                      </span>

                      {card.isMatched && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* POWER-UP CONTROL BAR */}
      {!showStartModal && (
        <div className="w-full max-w-3xl bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mt-4 backdrop-blur-md flex items-center justify-around gap-2 z-10">
          <Button
            onClick={handleUseScan}
            disabled={scanPowerups <= 0 || isLocked}
            variant="outline"
            size="sm"
            className="flex-1 bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-cyan-300 disabled:opacity-40"
          >
            <Eye className="w-4 h-4 mr-1 text-cyan-400" />
            Scan Peek ({scanPowerups})
          </Button>

          <Button
            onClick={handleUseMagnet}
            disabled={magnetPowerups <= 0 || isLocked}
            variant="outline"
            size="sm"
            className="flex-1 bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-amber-300 disabled:opacity-40"
          >
            <Zap className="w-4 h-4 mr-1 text-amber-400" />
            Auto Match ({magnetPowerups})
          </Button>

          {gameMode === "speed" && (
            <Button
              onClick={handleUseFreeze}
              disabled={freezePowerups <= 0 || isFrozen || isLocked}
              variant="outline"
              size="sm"
              className="flex-1 bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-sky-300 disabled:opacity-40"
            >
              <Snowflake className="w-4 h-4 mr-1 text-sky-400" />
              Freeze ({freezePowerups})
            </Button>
          )}

          <Button
            onClick={handleUseReshuffle}
            disabled={isLocked}
            variant="outline"
            size="sm"
            className="flex-1 bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-purple-300 disabled:opacity-40"
          >
            <RefreshCw className="w-4 h-4 mr-1 text-purple-400" />
            Shuffle
          </Button>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: START / NEW GAME SETUP */}
      {/* --------------------------------------------------------------------------- */}
      {showStartModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="bg-slate-900 border-slate-800 p-6 max-w-2xl w-full rounded-3xl shadow-2xl text-slate-100 my-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-xl">
                <Layers className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">MEMORY MATCH PRO</h2>
              <p className="text-slate-400 text-sm">Configure your challenge & start training your brain</p>
            </div>

            {/* SECTION 1: DIFFICULTY LEVEL */}
            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                1. Select Difficulty Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diffKey) => {
                  const dConfig = DIFFICULTIES[diffKey]
                  const isSelected = difficulty === diffKey
                  return (
                    <button
                      key={diffKey}
                      onClick={() => setDifficulty(diffKey)}
                      className={`
                        p-2.5 rounded-xl border text-left transition-all text-xs font-medium flex flex-col justify-between
                        ${
                          isSelected
                            ? "bg-gradient-to-b from-pink-500/20 to-purple-500/10 border-pink-500 text-white shadow-lg"
                            : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                        }
                      `}
                    >
                      <span className="font-bold text-sm block mb-0.5">{dConfig.name}</span>
                      <span className="text-[10px] text-slate-400">{dConfig.rows}x{dConfig.cols} ({dConfig.pairs} pairs)</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SECTION 2: GAME MODES */}
            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                2. Select Game Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(Object.keys(GAME_MODES) as GameMode[]).map((modeKey) => {
                  const mConfig = GAME_MODES[modeKey]
                  const isSelected = gameMode === modeKey
                  return (
                    <button
                      key={modeKey}
                      onClick={() => setGameMode(modeKey)}
                      className={`
                        p-3 rounded-xl border text-left transition-all flex items-start gap-3
                        ${
                          isSelected
                            ? `bg-gradient-to-r ${mConfig.color} border-pink-500 text-white shadow-md`
                            : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                        }
                      `}
                    >
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/50 mt-0.5">
                        {mConfig.icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{mConfig.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{mConfig.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SECTION 3: CARD THEME */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                3. Select Card Theme
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {(Object.keys(THEMES) as ThemeId[]).map((tKey) => {
                  const tConfig = THEMES[tKey]
                  const isSelected = activeTheme === tKey
                  return (
                    <button
                      key={tKey}
                      onClick={() => setActiveTheme(tKey)}
                      className={`
                        p-2.5 rounded-xl border text-center transition-all text-xs font-medium
                        ${
                          isSelected
                            ? "bg-slate-800 border-pink-500 text-white shadow-md ring-1 ring-pink-500/50"
                            : "bg-slate-800/40 border-slate-700/80 text-slate-400 hover:bg-slate-800"
                        }
                      `}
                    >
                      <div className="text-xl mb-1">{tConfig.symbols[0].icon} {tConfig.symbols[1].icon}</div>
                      <div className="font-bold truncate">{tConfig.name}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* START BUTTON */}
            <Button
              onClick={handleStartGame}
              className="w-full py-4 text-base font-black tracking-wide uppercase bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-2xl shadow-xl transition-all hover:scale-[1.01]"
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> Start Game
            </Button>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: GAME OVER / VICTORY SUMMARY */}
      {/* --------------------------------------------------------------------------- */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 p-8 max-w-md w-full rounded-3xl shadow-2xl text-center text-slate-100">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mx-auto mb-4 shadow-xl animate-bounce">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>

            <h2 className="text-3xl font-black text-white mb-1">
              {gameOutcome === "win" ? "VICTORY!" : "TIME'S UP!"}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Completed <span className="text-pink-400 font-bold capitalize">{difficulty}</span> ({gameMode} mode)
            </p>

            {/* STAR RATING */}
            {gameOutcome === "win" && (
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3].map((star) => (
                  <Crown
                    key={star}
                    className={`w-8 h-8 ${
                      star <= getRatingStars() ? "text-amber-400 fill-amber-400 drop-shadow-md" : "text-slate-700"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* STATS BREAKDOWN TABLE */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-xs block">Final Score</span>
                <span className="text-xl font-bold text-amber-400 font-mono">{score}</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-xs block">Time Taken</span>
                <span className="text-xl font-bold text-cyan-400 font-mono">{formatTime(timeElapsed)}</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-xs block">Total Moves</span>
                <span className="text-xl font-bold text-purple-400 font-mono">{moves}</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-xs block">Max Streak</span>
                <span className="text-xl font-bold text-orange-400 font-mono">{maxStreak}x</span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowEndModal(false)
                  initializeGame()
                  setIsPlaying(true)
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Play Again
              </Button>
              <Button
                onClick={() => {
                  setShowEndModal(false)
                  setShowStartModal(true)
                }}
                variant="outline"
                className="flex-1 py-3 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 font-bold rounded-xl"
              >
                New Level
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: HIGH SCORES & STATS */}
      {/* --------------------------------------------------------------------------- */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 p-6 max-w-lg w-full rounded-3xl shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" /> Performance Statistics
              </h3>
              <Button
                onClick={() => setShowStatsModal(false)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {currentStats ? (
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-slate-400">High Score</span>
                  <span className="font-bold text-amber-400 font-mono text-base">{currentStats.highScore}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-slate-400">Best Time</span>
                  <span className="font-bold text-cyan-400 font-mono text-base">
                    {currentStats.bestTime < 9999 ? formatTime(currentStats.bestTime) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-slate-400">Fewest Moves</span>
                  <span className="font-bold text-purple-400 font-mono text-base">
                    {currentStats.fewestMoves < 9999 ? currentStats.fewestMoves : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-slate-400">Total Games Won / Played</span>
                  <span className="font-bold text-emerald-400 font-mono text-base">
                    {currentStats.totalWins} / {currentStats.totalGames}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 text-sm">
                No recorded stats for {gameMode} mode on {difficulty} level yet. Play a game to record stats!
              </div>
            )}

            <Button
              onClick={() => setShowStatsModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: HOW TO PLAY */}
      {/* --------------------------------------------------------------------------- */}
      {showHowToPlayModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 p-6 max-w-lg w-full rounded-3xl shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" /> How to Play Memory Match
              </h3>
              <Button
                onClick={() => setShowHowToPlayModal(false)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            <ul className="space-y-3 text-sm text-slate-300 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">•</span>
                <span>Click cards to flip them face up and reveal their hidden symbols.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">•</span>
                <span>Find and match all twin card pairs on the board with the fewest moves possible.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">•</span>
                <span>
                  <strong>Streak Multipliers:</strong> Chain back-to-back correct matches to earn 2x, 3x, 4x streak bonuses!
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">•</span>
                <span>
                  <strong>Tactical Power-Ups:</strong> Use Scan Peek to briefly reveal cards, Magnet Match to auto-find a pair, or Time Freeze to halt the clock.
                </span>
              </li>
            </ul>

            <Button
              onClick={() => setShowHowToPlayModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl"
            >
              Got It!
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
