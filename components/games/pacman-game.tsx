"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  BarChart2,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Flame,
  Award,
  Star,
  Info,
  Check,
  X,
  RefreshCw
} from "lucide-react"

// ----------------------------------------------------
// TYPES & CONSTANTS
// ----------------------------------------------------
export type Difficulty = "casual" | "classic" | "hard" | "nightmare"
export type ThemeKey = "neonCyber" | "arcade80s" | "synthwave" | "matrix"

interface Direction {
  x: number
  y: number
}

const DIR_NONE: Direction = { x: 0, y: 0 }
const DIR_UP: Direction = { x: 0, y: -1 }
const DIR_DOWN: Direction = { x: 0, y: 1 }
const DIR_LEFT: Direction = { x: -1, y: 0 }
const DIR_RIGHT: Direction = { x: 1, y: 0 }

const GRID_COLS = 28
const GRID_ROWS = 31

// 1: Wall, 2: Dot, 3: Power Pellet, 0: Empty, 4: Ghost House Pen, 5: Ghost Gate
const INITIAL_MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
]

// Difficulty Settings Configuration
const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    name: string
    ghostSpeed: number
    scaredTime: number // seconds
    randomness: number
    lives: number
    description: string
    color: string
  }
> = {
  casual: {
    name: "Casual",
    ghostSpeed: 0.75,
    scaredTime: 10,
    randomness: 0.35,
    lives: 5,
    description: "Slower ghosts, long scared timer & extra lives for relaxed play.",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
  },
  classic: {
    name: "Classic",
    ghostSpeed: 0.88,
    scaredTime: 7,
    randomness: 0.15,
    lives: 3,
    description: "Authentic 1980 arcade speed & ghost AI behavior.",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/40"
  },
  hard: {
    name: "Speed Arcade",
    ghostSpeed: 1.0,
    scaredTime: 4,
    randomness: 0.05,
    lives: 3,
    description: "Full speed ghosts, shorter frightened window & tight tracking.",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/40"
  },
  nightmare: {
    name: "Nightmare",
    ghostSpeed: 1.1,
    scaredTime: 2.5,
    randomness: 0.0,
    lives: 2,
    description: "Blazing ghost speed, minimal scared window & relentless chase AI.",
    color: "bg-rose-500/20 text-rose-400 border-rose-500/40"
  }
}

// Visual Themes
const THEME_CONFIG: Record<
  ThemeKey,
  {
    name: string
    bg: string
    wallBorder: string
    wallFill: string
    dotColor: string
    powerColor: string
    pacmanColor: string
    gridColor: string
  }
> = {
  neonCyber: {
    name: "Neon Cyber",
    bg: "#090a16",
    wallBorder: "#00f0ff",
    wallFill: "#0b1836",
    dotColor: "#ff007f",
    powerColor: "#facc15",
    pacmanColor: "#facc15",
    gridColor: "rgba(0, 240, 255, 0.05)"
  },
  arcade80s: {
    name: "1980 Classic",
    bg: "#000000",
    wallBorder: "#2121ff",
    wallFill: "#000044",
    dotColor: "#ffb8ae",
    powerColor: "#ffff00",
    pacmanColor: "#ffff00",
    gridColor: "transparent"
  },
  synthwave: {
    name: "Synthwave",
    bg: "#110620",
    wallBorder: "#ff00a0",
    wallFill: "#2a003f",
    dotColor: "#00ffff",
    powerColor: "#ffea00",
    pacmanColor: "#ffea00",
    gridColor: "rgba(255, 0, 160, 0.08)"
  },
  matrix: {
    name: "Matrix Emerald",
    bg: "#03120b",
    wallBorder: "#00ff66",
    wallFill: "#06301b",
    dotColor: "#88ffb3",
    powerColor: "#ffffff",
    pacmanColor: "#00ff66",
    gridColor: "rgba(0, 255, 102, 0.05)"
  }
}

// Fruit Types by Level
interface FruitInfo {
  name: string
  points: number
  color: string
  symbol: string
}
const FRUIT_LIST: FruitInfo[] = [
  { name: "Cherry", points: 100, color: "#ef4444", symbol: "🍒" },
  { name: "Strawberry", points: 300, color: "#f43f5e", symbol: "🍓" },
  { name: "Orange", points: 500, color: "#f97316", symbol: "🍊" },
  { name: "Apple", points: 700, color: "#22c55e", symbol: "🍎" },
  { name: "Melon", points: 1000, color: "#10b981", symbol: "🍈" },
  { name: "Galaxian", points: 2000, color: "#eab308", symbol: "👾" },
  { name: "Bell", points: 3000, color: "#eab308", symbol: "🔔" },
  { name: "Key", points: 5000, color: "#3b82f6", symbol: "🔑" }
]

// Ghost Entity Type
interface Ghost {
  id: number
  name: string
  color: string
  x: number
  y: number
  dir: Direction
  nextDir: Direction
  homeX: number
  homeY: number
  scatterTile: { x: number; y: number }
  state: "home" | "exiting" | "normal" | "frightened" | "eaten"
  exitTimer: number
}

// Particle Effect System
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  maxLife: number
}

interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
  maxLife: number
}

interface HighScoreRecord {
  highScore: number
  highestLevel: number
  gamesPlayed: number
  ghostsEaten: number
  dotsEaten: number
}

// ----------------------------------------------------
// WEB AUDIO SYNTHESIZER
// ----------------------------------------------------
class SoundSynth {
  private ctx: AudioContext | null = null
  public muted: boolean = false

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

  playMunch(highPitch: boolean = false) {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "triangle"
    const startFreq = highPitch ? 440 : 260
    const endFreq = highPitch ? 220 : 130
    const now = this.ctx.currentTime

    osc.frequency.setValueAtTime(startFreq, now)
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.06)
  }

  playPowerPellet() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sawtooth"
    const now = this.ctx.currentTime

    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  playEatGhost() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const frequencies = [400, 600, 800, 1200]
    frequencies.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "square"
      const startTime = now + idx * 0.05

      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.1, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.06)
    })
  }

  playFruitEat() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const freqs = [523.25, 659.25, 783.99, 1046.5]
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      const startTime = now + idx * 0.07

      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.12, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.1)
    })
  }

  playDeath() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sawtooth"

    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.8)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.8)
  }

  playExtraLife() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const freqs = [440, 880, 1760]
    freqs.forEach((f, i) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "triangle"
      const t = now + i * 0.08
      osc.frequency.setValueAtTime(f, t)
      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(t)
      osc.stop(t + 0.12)
    })
  }

  playWin() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
    notes.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "square"
      const startTime = now + idx * 0.1

      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.12, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.2)
    })
  }
}

const audioSynth = new SoundSynth()

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export default function PacmanGame({
  onBack,
  themeColor = "#facc15"
}: {
  onBack?: () => void
  themeColor?: string
}) {
  // Navigation & Screen States
  const [phase, setPhase] = useState<"menu" | "playing" | "paused" | "gameover" | "won">("menu")
  const [difficulty, setDifficulty] = useState<Difficulty>("classic")
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("neonCyber")
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Game Metrics & HUD
  const [score, setScore] = useState<number>(0)
  const [highScore, setHighScore] = useState<number>(0)
  const [level, setLevel] = useState<number>(1)
  const [lives, setLives] = useState<number>(3)
  const [ghostCombo, setGhostCombo] = useState<number>(1)
  const [activeFruit, setActiveFruit] = useState<FruitInfo | null>(null)

  // Stats Modal & How to Play Modal
  const [showStats, setShowStats] = useState<boolean>(false)
  const [showRules, setShowRules] = useState<boolean>(false)
  const [statsRecord, setStatsRecord] = useState<HighScoreRecord>({
    highScore: 0,
    highestLevel: 1,
    gamesPlayed: 0,
    ghostsEaten: 0,
    dotsEaten: 0
  })

  // Canvas & Mutable Game Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameId = useRef<number>(0)
  const phaseRef = useRef<"menu" | "playing" | "paused" | "gameover" | "won">("menu")

  // Pac-Man position (in grid tile coordinates float e.g. 13.5, 23.0)
  const pacmanRef = useRef({
    x: 13.5,
    y: 23.0,
    dir: DIR_NONE as Direction,
    nextDir: DIR_NONE as Direction,
    mouthAngle: 0.2,
    mouthOpening: true
  })

  // Ghosts State Ref
  const ghostsRef = useRef<Ghost[]>([])

  // Maze state copy
  const mazeRef = useRef<number[][]>([])
  const dotsRemainingRef = useRef<number>(0)
  const totalDotsCountRef = useRef<number>(0)

  // Timing & Frightened Timers
  const scaredTimerRef = useRef<number>(0)
  const modeTimerRef = useRef<number>(0)
  const isScatterRef = useRef<boolean>(true)
  const fruitTimerRef = useRef<number>(0)
  const munchToggleRef = useRef<boolean>(false)

  // Particle & Floating Text systems
  const particlesRef = useRef<Particle[]>([])
  const floatingTextsRef = useRef<FloatingText[]>([])

  // Stat Counters for current session
  const ghostsEatenSessionRef = useRef<number>(0)
  const dotsEatenSessionRef = useRef<number>(0)

  // Sync state ref
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Load High Score and Stats from localStorage on Mount
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(`pacman_stats_${difficulty}`)
      if (savedStats) {
        const parsed: HighScoreRecord = JSON.parse(savedStats)
        setStatsRecord(parsed)
        setHighScore(parsed.highScore || 0)
      } else {
        const legacyBest = localStorage.getItem("pacman-best")
        const best = legacyBest ? parseInt(legacyBest, 10) : 0
        const initRec: HighScoreRecord = {
          highScore: best,
          highestLevel: 1,
          gamesPlayed: 0,
          ghostsEaten: 0,
          dotsEaten: 0
        }
        setStatsRecord(initRec)
        setHighScore(best)
      }
    } catch {
      // Fallback if localStorage fails
    }
  }, [difficulty])

  // Update persistent stats
  const saveStats = useCallback(
    (newScore: number, finalLevel: number, ghostsCount: number, dotsCount: number) => {
      try {
        const currentKey = `pacman_stats_${difficulty}`
        const raw = localStorage.getItem(currentKey)
        let rec: HighScoreRecord = {
          highScore: 0,
          highestLevel: 1,
          gamesPlayed: 0,
          ghostsEaten: 0,
          dotsEaten: 0
        }
        if (raw) {
          rec = JSON.parse(raw)
        }
        const updated: HighScoreRecord = {
          highScore: Math.max(rec.highScore, newScore),
          highestLevel: Math.max(rec.highestLevel, finalLevel),
          gamesPlayed: rec.gamesPlayed + 1,
          ghostsEaten: rec.ghostsEaten + ghostsCount,
          dotsEaten: rec.dotsEaten + dotsCount
        }
        localStorage.setItem(currentKey, JSON.stringify(updated))
        localStorage.setItem("pacman-best", String(updated.highScore))
        setStatsRecord(updated)
        setHighScore(updated.highScore)
      } catch {
        // Safe fallback
      }
    },
    [difficulty]
  )

  // Sound Mute Toggle
  const toggleMute = () => {
    const nextState = !isMuted
    setIsMuted(nextState)
    audioSynth.muted = nextState
  }

  // ----------------------------------------------------
  // GHOST INITIALIZATION
  // ----------------------------------------------------
  const createGhosts = useCallback((): Ghost[] => {
    return [
      {
        id: 0,
        name: "Blinky",
        color: "#ff0033", // Red
        x: 13.5,
        y: 11.0,
        dir: DIR_LEFT,
        nextDir: DIR_LEFT,
        homeX: 13.5,
        homeY: 11.0,
        scatterTile: { x: 26, y: 0 },
        state: "normal",
        exitTimer: 0
      },
      {
        id: 1,
        name: "Pinky",
        color: "#ffb8ff", // Pink
        x: 13.5,
        y: 14.0,
        dir: DIR_UP,
        nextDir: DIR_UP,
        homeX: 13.5,
        homeY: 14.0,
        scatterTile: { x: 1, y: 0 },
        state: "home",
        exitTimer: 60
      },
      {
        id: 2,
        name: "Inky",
        color: "#00ffff", // Cyan
        x: 11.5,
        y: 14.0,
        dir: DIR_UP,
        nextDir: DIR_UP,
        homeX: 11.5,
        homeY: 14.0,
        scatterTile: { x: 26, y: 30 },
        state: "home",
        exitTimer: 180
      },
      {
        id: 3,
        name: "Clyde",
        color: "#ffb852", // Orange
        x: 15.5,
        y: 14.0,
        dir: DIR_UP,
        nextDir: DIR_UP,
        homeX: 15.5,
        homeY: 14.0,
        scatterTile: { x: 1, y: 30 },
        state: "home",
        exitTimer: 300
      }
    ]
  }, [])

  // ----------------------------------------------------
  // GAME RESET / INITIALIZATION
  // ----------------------------------------------------
  const initGameSession = useCallback(
    (resetLevel: boolean = true) => {
      // Copy initial maze layout
      const gridCopy = INITIAL_MAZE.map((row) => [...row])
      mazeRef.current = gridCopy

      let dotsCount = 0
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (gridCopy[r][c] === 2 || gridCopy[r][c] === 3) {
            dotsCount++
          }
        }
      }
      dotsRemainingRef.current = dotsCount
      totalDotsCountRef.current = dotsCount

      // Reset Pac-Man
      pacmanRef.current = {
        x: 13.5,
        y: 23.0,
        dir: DIR_NONE,
        nextDir: DIR_NONE,
        mouthAngle: 0.2,
        mouthOpening: true
      }

      ghostsRef.current = createGhosts()
      particlesRef.current = []
      floatingTextsRef.current = []
      scaredTimerRef.current = 0
      modeTimerRef.current = 0
      isScatterRef.current = true
      fruitTimerRef.current = 0
      setActiveFruit(null)
      setGhostCombo(1)

      if (resetLevel) {
        setScore(0)
        setLevel(1)
        setLives(DIFFICULTY_CONFIG[difficulty].lives)
        ghostsEatenSessionRef.current = 0
        dotsEatenSessionRef.current = 0
      }
    },
    [createGhosts, difficulty]
  )

  const resetPositionsOnly = useCallback(() => {
    pacmanRef.current = {
      x: 13.5,
      y: 23.0,
      dir: DIR_NONE,
      nextDir: DIR_NONE,
      mouthAngle: 0.2,
      mouthOpening: true
    }
    ghostsRef.current = createGhosts()
    scaredTimerRef.current = 0
    modeTimerRef.current = 0
    isScatterRef.current = true
    setGhostCombo(1)
  }, [createGhosts])

  // Spawn Particle Effects
  const spawnParticles = (x: number, y: number, color: string, count: number = 8, speedMult: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (Math.random() * 2 + 1) * speedMult
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 20 + 20
      })
    }
  }

  // Spawn Floating Text (+200, Fruit points, etc.)
  const spawnFloatingText = (x: number, y: number, text: string, color: string = "#facc15") => {
    floatingTextsRef.current.push({
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 45
    })
  }

  // ----------------------------------------------------
  // GRID COLLISION & MOVEMENT HELPERS
  // ----------------------------------------------------
  const isTileWalkable = (row: number, col: number, isGhost: boolean = false, isEaten: boolean = false): boolean => {
    // Warp Tunnels out of bounds horizontally
    if ((col < 0 || col >= GRID_COLS) && row === 14) return true
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false

    const tile = mazeRef.current[row][col]
    if (tile === 1) return false // Wall
    if (tile === 5) {
      // Ghost Gate: accessible if ghost is exiting or eaten
      return isGhost || isEaten
    }
    return true
  }

  const isAtCenterOfTile = (x: number, y: number, tolerance: number = 0.08): boolean => {
    const colCenter = Math.floor(x) + 0.5
    const rowCenter = Math.floor(y) + 0.5
    return Math.abs(x - colCenter) < tolerance && Math.abs(y - rowCenter) < tolerance
  }

  const canEntityMoveInDir = (
    x: number,
    y: number,
    dir: Direction,
    isGhost: boolean = false,
    isEaten: boolean = false
  ): boolean => {
    if (dir.x === 0 && dir.y === 0) return true
    const nextX = x + dir.x * 0.4
    const nextY = y + dir.y * 0.4

    // Handle horizontal Warp Tunnel wrap
    if (Math.floor(nextY) === 14) {
      if (nextX < 0 || nextX >= GRID_COLS) return true
    }

    const checkCol = Math.floor(nextX)
    const checkRow = Math.floor(nextY)
    return isTileWalkable(checkRow, checkCol, isGhost, isEaten)
  }

  // ----------------------------------------------------
  // GHOST AI PERSONALITIES & TARGETING
  // ----------------------------------------------------
  const getGhostTargetTile = (ghost: Ghost, pacman: typeof pacmanRef.current): { x: number; y: number } => {
    // Return to Ghost House if eaten
    if (ghost.state === "eaten") {
      return { x: 13.5, y: 14.0 }
    }

    // Frightened ghosts move randomly (handled separately)
    if (ghost.state === "frightened") {
      return { x: Math.floor(Math.random() * GRID_COLS), y: Math.floor(Math.random() * GRID_ROWS) }
    }

    // Scatter mode: target home corner
    if (isScatterRef.current) {
      return ghost.scatterTile
    }

    // Chase Mode: Distinct personalities!
    const pCol = Math.floor(pacman.x)
    const pRow = Math.floor(pacman.y)

    switch (ghost.id) {
      case 0: // Blinky (Red - Direct Chase)
        return { x: pCol, y: pRow }

      case 1: // Pinky (Pink - Ambush 4 tiles ahead)
        return {
          x: pCol + pacman.dir.x * 4,
          y: pRow + pacman.dir.y * 4
        }

      case 2: // Inky (Cyan - Flanking vector off Blinky)
        {
          const blinky = ghostsRef.current[0]
          const pivotX = pCol + pacman.dir.x * 2
          const pivotY = pRow + pacman.dir.y * 2
          const bCol = Math.floor(blinky.x)
          const bRow = Math.floor(blinky.y)
          const vecX = pivotX - bCol
          const vecY = pivotY - bRow
          return { x: pivotX + vecX, y: pivotY + vecY }
        }

      case 3: // Clyde (Orange - Shy, targets Pac-Man when > 8 tiles, else retreats)
        {
          const dist = Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y)
          if (dist > 8) {
            return { x: pCol, y: pRow }
          } else {
            return ghost.scatterTile
          }
        }

      default:
        return { x: pCol, y: pRow }
    }
  }

  // Choose best direction for Ghost at tile intersection
  const chooseGhostDirection = (ghost: Ghost, speed: number) => {
    const p = pacmanRef.current
    const isCentered = isAtCenterOfTile(ghost.x, ghost.y, speed * 0.5)

    if (!isCentered) return

    // Standard grid coordinates
    const curCol = Math.floor(ghost.x)
    const curRow = Math.floor(ghost.y)

    // Ghost House Exit Logic
    if (ghost.state === "home") {
      ghost.exitTimer--
      if (ghost.exitTimer <= 0) {
        ghost.state = "exiting"
      } else {
        // Bounce up/down inside house
        if (ghost.y <= 13.5) ghost.dir = DIR_DOWN
        else if (ghost.y >= 14.5) ghost.dir = DIR_UP
        return
      }
    }

    if (ghost.state === "exiting") {
      // Move to center column (13.5) then up to gate (11.0)
      if (Math.abs(ghost.x - 13.5) > 0.1) {
        ghost.dir = ghost.x < 13.5 ? DIR_RIGHT : DIR_LEFT
      } else {
        ghost.x = 13.5
        ghost.dir = DIR_UP
        if (ghost.y <= 11.0) {
          ghost.y = 11.0
          ghost.state = "normal"
          ghost.dir = DIR_LEFT
        }
      }
      return
    }

    // If Eaten and reached Ghost House entrance
    if (ghost.state === "eaten") {
      if (Math.abs(ghost.x - 13.5) < 0.3 && Math.abs(ghost.y - 11.0) < 0.3) {
        ghost.state = "exiting"
        ghost.dir = DIR_DOWN
        return
      }
    }

    // Available direction choices (Ghosts cannot reverse 180 deg unless state changes)
    const possibleDirs: Direction[] = [DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT].filter((d) => {
      // Prevent 180 turn
      if (d.x === -ghost.dir.x && d.y === -ghost.dir.y) return false
      const nx = curCol + d.x
      const ny = curRow + d.y
      return isTileWalkable(ny, nx, true, ghost.state === "eaten")
    })

    if (possibleDirs.length === 0) {
      // Allow reverse if trapped
      ghost.dir = { x: -ghost.dir.x, y: -ghost.dir.y }
      return
    }

    // If Frightened: random direction choice
    if (ghost.state === "frightened") {
      const randDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)]
      ghost.dir = randDir
      return
    }

    // Otherwise: Calculate distance to target tile for each candidate direction
    const target = getGhostTargetTile(ghost, p)
    let bestDir = possibleDirs[0]
    let minDist = Infinity

    for (const d of possibleDirs) {
      const nextCol = curCol + d.x
      const nextRow = curRow + d.y
      const dist = Math.hypot(nextCol - target.x, nextRow - target.y)
      if (dist < minDist) {
        minDist = dist
        bestDir = d
      }
    }

    ghost.dir = bestDir
  }

  // ----------------------------------------------------
  // MAIN GAME LOOP (TICK & RENDER)
  // ----------------------------------------------------
  const gameLoop = useCallback(() => {
    if (phaseRef.current !== "playing") {
      animFrameId.current = requestAnimationFrame(gameLoop)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      animFrameId.current = requestAnimationFrame(gameLoop)
      return
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      animFrameId.current = requestAnimationFrame(gameLoop)
      return
    }

    const cfg = DIFFICULTY_CONFIG[difficulty]
    const theme = THEME_CONFIG[activeTheme]

    // Base Speeds (Tiles per frame)
    const pacmanBaseSpeed = 0.11
    const ghostBaseSpeed = 0.09 * cfg.ghostSpeed * (1 + (level - 1) * 0.05)

    // --------------------------------------------------
    // 1. UPDATE PAC-MAN MOVEMENT & QUEUED DIRECTION
    // --------------------------------------------------
    const p = pacmanRef.current
    const tileSize = canvas.width / GRID_COLS

    // Attempt queued pre-turn direction if valid
    if (p.nextDir.x !== 0 || p.nextDir.y !== 0) {
      if (canEntityMoveInDir(p.x, p.y, p.nextDir)) {
        // Snap to center when turning per-axis
        if (p.nextDir.x !== 0 && p.dir.y !== 0) p.y = Math.floor(p.y) + 0.5
        if (p.nextDir.y !== 0 && p.dir.x !== 0) p.x = Math.floor(p.x) + 0.5
        p.dir = { ...p.nextDir }
      }
    }

    // Move Pac-Man if direction is pathable
    if (canEntityMoveInDir(p.x, p.y, p.dir)) {
      p.x += p.dir.x * pacmanBaseSpeed
      p.y += p.dir.y * pacmanBaseSpeed

      // Horizontal Warp Tunnel Wrap
      if (Math.floor(p.y) === 14) {
        if (p.x < -0.5) p.x = GRID_COLS - 0.5
        else if (p.x >= GRID_COLS - 0.5) p.x = -0.5
      }

      // Mouth Chomping Animation
      if (p.mouthOpening) {
        p.mouthAngle += 0.04
        if (p.mouthAngle >= 0.45) p.mouthOpening = false
      } else {
        p.mouthAngle -= 0.04
        if (p.mouthAngle <= 0.05) p.mouthOpening = true
      }
    }

    // --------------------------------------------------
    // 2. DOT & POWER PELLET CONSUMPTION
    // --------------------------------------------------
    const pCol = Math.floor(p.x)
    const pRow = Math.floor(p.y)

    if (pRow >= 0 && pRow < GRID_ROWS && pCol >= 0 && pCol < GRID_COLS) {
      const tile = mazeRef.current[pRow][pCol]

      if (tile === 2) {
        // Regular Dot
        mazeRef.current[pRow][pCol] = 0
        dotsRemainingRef.current--
        dotsEatenSessionRef.current++
        setScore((prev) => prev + 10)

        munchToggleRef.current = !munchToggleRef.current
        audioSynth.playMunch(munchToggleRef.current)

        // Sparkle particles
        spawnParticles((pCol + 0.5) * tileSize, (pRow + 0.5) * tileSize, theme.dotColor, 3, 0.5)

        // Trigger Fruit Spawn at dot thresholds (70 & 170 dots eaten)
        const eatenCount = totalDotsCountRef.current - dotsRemainingRef.current
        if (eatenCount === 70 || eatenCount === 170) {
          const fruitIdx = Math.min(level - 1, FRUIT_LIST.length - 1)
          setActiveFruit(FRUIT_LIST[fruitIdx])
          fruitTimerRef.current = 450 // ~7.5 seconds
        }
      } else if (tile === 3) {
        // Power Pellet!
        mazeRef.current[pRow][pCol] = 0
        dotsRemainingRef.current--
        dotsEatenSessionRef.current++
        setScore((prev) => prev + 50)
        audioSynth.playPowerPellet()

        // Trigger Frightened State for active ghosts
        scaredTimerRef.current = Math.floor(cfg.scaredTime * 60)
        setGhostCombo(1)
        ghostsRef.current.forEach((g) => {
          if (g.state === "normal") {
            g.state = "frightened"
            // Reverse direction on frightened trigger
            g.dir = { x: -g.dir.x, y: -g.dir.y }
          }
        })

        spawnParticles((pCol + 0.5) * tileSize, (pRow + 0.5) * tileSize, theme.powerColor, 12, 1.2)
      }
    }

    // --------------------------------------------------
    // 3. FRUIT BONUS CONSUMPTION & TIMERS
    // --------------------------------------------------
    if (activeFruit) {
      fruitTimerRef.current--
      if (fruitTimerRef.current <= 0) {
        setActiveFruit(null)
      } else {
        // Check Pac-Man collision with Fruit (Tile 13.5, 17.5)
        if (Math.hypot(p.x - 13.5, p.y - 17.5) < 0.8) {
          const fruitPts = activeFruit.points
          setScore((prev) => prev + fruitPts)
          audioSynth.playFruitEat()
          spawnFloatingText(13.5 * tileSize, 17.5 * tileSize, `+${fruitPts}`, activeFruit.color)
          spawnParticles(13.5 * tileSize, 17.5 * tileSize, activeFruit.color, 16, 1.5)
          setActiveFruit(null)
        }
      }
    }

    // --------------------------------------------------
    // 4. TIMERS (SCATTER / CHASE & FRIGHTENED MODE)
    // --------------------------------------------------
    if (scaredTimerRef.current > 0) {
      scaredTimerRef.current--
      if (scaredTimerRef.current <= 0) {
        ghostsRef.current.forEach((g) => {
          if (g.state === "frightened") {
            g.state = "normal"
          }
        })
      }
    } else {
      // Alternate Scatter (7s = 420 frames) vs Chase (20s = 1200 frames)
      modeTimerRef.current++
      if (isScatterRef.current && modeTimerRef.current > 420) {
        isScatterRef.current = false
        modeTimerRef.current = 0
      } else if (!isScatterRef.current && modeTimerRef.current > 1200) {
        isScatterRef.current = true
        modeTimerRef.current = 0
      }
    }

    // --------------------------------------------------
    // 5. UPDATE GHOST MOVEMENT & AI
    // --------------------------------------------------
    ghostsRef.current.forEach((ghost) => {
      let currentSpeed = ghostBaseSpeed
      if (ghost.state === "frightened") currentSpeed *= 0.6
      if (ghost.state === "eaten") currentSpeed *= 1.8

      chooseGhostDirection(ghost, currentSpeed)

      ghost.x += ghost.dir.x * currentSpeed
      ghost.y += ghost.dir.y * currentSpeed

      // Horizontal Warp Tunnel Wrap
      if (Math.floor(ghost.y) === 14) {
        if (ghost.x < -0.5) ghost.x = GRID_COLS - 0.5
        else if (ghost.x >= GRID_COLS - 0.5) ghost.x = -0.5
      }

      // --------------------------------------------------
      // 6. GHOST & PAC-MAN COLLISION DETECT
      // --------------------------------------------------
      const distToPacman = Math.hypot(p.x - ghost.x, p.y - ghost.y)
      if (distToPacman < 0.75) {
        if (ghost.state === "frightened") {
          // Eat Ghost!
          ghost.state = "eaten"
          ghostsEatenSessionRef.current++
          const eatPoints = 200 * ghostCombo
          setScore((prev) => prev + eatPoints)
          setGhostCombo((prev) => prev * 2)

          audioSynth.playEatGhost()
          spawnFloatingText(ghost.x * tileSize, ghost.y * tileSize, `+${eatPoints}`, "#38bdf8")
          spawnParticles(ghost.x * tileSize, ghost.y * tileSize, ghost.color, 16, 1.5)
        } else if (ghost.state === "normal") {
          // Pac-Man Dies!
          audioSynth.playDeath()
          spawnParticles(p.x * tileSize, p.y * tileSize, theme.pacmanColor, 28, 2.0)

          setLives((prevLives) => {
            const nextLives = prevLives - 1
            if (nextLives <= 0) {
              // Game Over
              setPhase("gameover")
              saveStats(score, level, ghostsEatenSessionRef.current, dotsEatenSessionRef.current)
            } else {
              resetPositionsOnly()
            }
            return nextLives
          })
        }
      }
    })

    // --------------------------------------------------
    // 7. CHECK LEVEL CLEAR / WIN
    // --------------------------------------------------
    if (dotsRemainingRef.current <= 0) {
      audioSynth.playWin()
      const nextLvl = level + 1
      setLevel(nextLvl)
      saveStats(score, nextLvl, ghostsEatenSessionRef.current, dotsEatenSessionRef.current)
      initGameSession(false) // Advance level keeping score & lives
      return
    }

    // --------------------------------------------------
    // 8. RENDER CANVAS GRAPHICS
    // --------------------------------------------------
    ctx.fillStyle = theme.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Optional background grid lines for cyber feel
    if (theme.gridColor !== "transparent") {
      ctx.strokeStyle = theme.gridColor
      ctx.lineWidth = 1
      for (let c = 0; c <= GRID_COLS; c++) {
        ctx.beginPath()
        ctx.moveTo(c * tileSize, 0)
        ctx.lineTo(c * tileSize, canvas.height)
        ctx.stroke()
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        ctx.beginPath()
        ctx.moveTo(0, r * tileSize)
        ctx.lineTo(canvas.width, r * tileSize)
        ctx.stroke()
      }
    }

    // Render Maze Walls & Dots
    const m = mazeRef.current
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = m[r][c]
        const cx = c * tileSize
        const cy = r * tileSize

        if (cell === 1) {
          // Maze Wall
          ctx.fillStyle = theme.wallFill
          ctx.fillRect(cx + 1, cy + 1, tileSize - 2, tileSize - 2)

          ctx.strokeStyle = theme.wallBorder
          ctx.lineWidth = 2
          ctx.strokeRect(cx + 1, cy + 1, tileSize - 2, tileSize - 2)
        } else if (cell === 5) {
          // Ghost House Gate
          ctx.fillStyle = "#f472b6"
          ctx.fillRect(cx, cy + tileSize * 0.4, tileSize, tileSize * 0.2)
        } else if (cell === 2) {
          // Regular Dot
          ctx.fillStyle = theme.dotColor
          ctx.beginPath()
          ctx.arc(cx + tileSize / 2, cy + tileSize / 2, tileSize * 0.15, 0, Math.PI * 2)
          ctx.fill()
        } else if (cell === 3) {
          // Power Pellet (Pulsating)
          const pulse = Math.sin(Date.now() * 0.008) * 0.1 + 0.35
          ctx.fillStyle = theme.powerColor
          ctx.beginPath()
          ctx.arc(cx + tileSize / 2, cy + tileSize / 2, tileSize * pulse, 0, Math.PI * 2)
          ctx.fill()
          // Inner glow
          ctx.fillStyle = "#ffffff"
          ctx.beginPath()
          ctx.arc(cx + tileSize / 2, cy + tileSize / 2, tileSize * pulse * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Render Bonus Fruit
    if (activeFruit) {
      const fx = 13.5 * tileSize
      const fy = 17.5 * tileSize
      ctx.font = `${tileSize * 1.2}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(activeFruit.symbol, fx, fy)
    }

    // Render Ghosts
    ghostsRef.current.forEach((g) => {
      const gx = g.x * tileSize
      const gy = g.y * tileSize
      const radius = tileSize * 0.45

      if (g.state === "eaten") {
        // Just floating eyes returning to ghost house
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(gx - 4, gy - 2, 4, 0, Math.PI * 2)
        ctx.arc(gx + 4, gy - 2, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#0284c7"
        ctx.beginPath()
        ctx.arc(gx - 4 + g.dir.x * 2, gy - 2 + g.dir.y * 2, 2, 0, Math.PI * 2)
        ctx.arc(gx + 4 + g.dir.x * 2, gy - 2 + g.dir.y * 2, 2, 0, Math.PI * 2)
        ctx.fill()
        return
      }

      // Ghost Color (Blue/White wobbling when frightened)
      let gColor = g.color
      if (g.state === "frightened") {
        const isExpiring = scaredTimerRef.current < 120 && Math.floor(scaredTimerRef.current / 15) % 2 === 0
        gColor = isExpiring ? "#ffffff" : "#1d4ed8" // White or Blue
      }

      // Draw Ghost Body & Skirt Waves
      ctx.fillStyle = gColor
      ctx.beginPath()
      ctx.arc(gx, gy - 2, radius, Math.PI, 0, false)
      ctx.lineTo(gx + radius, gy + radius - 4)

      // 3 bottom skirt ripples
      const skirtW = (radius * 2) / 3
      ctx.quadraticCurveTo(gx + radius - skirtW * 0.5, gy + radius + 2, gx + radius - skirtW, gy + radius - 4)
      ctx.quadraticCurveTo(gx - skirtW * 0.5, gy + radius + 2, gx - skirtW, gy + radius - 4)
      ctx.quadraticCurveTo(gx - radius + skirtW * 0.5, gy + radius + 2, gx - radius, gy + radius - 4)
      ctx.closePath()
      ctx.fill()

      if (g.state === "frightened") {
        // Scared Eyes & Wavy Mouth
        ctx.fillStyle = "#ffedd5"
        ctx.beginPath()
        ctx.arc(gx - 4, gy - 4, 2, 0, Math.PI * 2)
        ctx.arc(gx + 4, gy - 4, 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = "#ffedd5"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(gx - 6, gy + 3)
        ctx.lineTo(gx - 3, gy + 1)
        ctx.lineTo(gx, gy + 3)
        ctx.lineTo(gx + 3, gy + 1)
        ctx.lineTo(gx + 6, gy + 3)
        ctx.stroke()
      } else {
        // Normal Eyes & Pupil facing movement direction
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(gx - 4, gy - 3, 4, 0, Math.PI * 2)
        ctx.arc(gx + 4, gy - 3, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#09090b"
        ctx.beginPath()
        ctx.arc(gx - 4 + g.dir.x * 2, gy - 3 + g.dir.y * 2, 2, 0, Math.PI * 2)
        ctx.arc(gx + 4 + g.dir.x * 2, gy - 3 + g.dir.y * 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Render Pac-Man
    const px = p.x * tileSize
    const py = p.y * tileSize
    const pradius = tileSize * 0.46

    // Calculate facing angle in radians
    let angle = 0
    if (p.dir.x === 1) angle = 0
    else if (p.dir.x === -1) angle = Math.PI
    else if (p.dir.y === 1) angle = Math.PI / 2
    else if (p.dir.y === -1) angle = (Math.PI * 3) / 2

    ctx.fillStyle = theme.pacmanColor
    ctx.beginPath()
    ctx.arc(px, py, pradius, angle + p.mouthAngle, angle + Math.PI * 2 - p.mouthAngle)
    ctx.lineTo(px, py)
    ctx.closePath()
    ctx.fill()

    // Render Particles
    particlesRef.current.forEach((pt, idx) => {
      pt.x += pt.vx
      pt.y += pt.vy
      pt.life++
      const alpha = 1 - pt.life / pt.maxLife

      ctx.fillStyle = pt.color
      ctx.globalAlpha = Math.max(0, alpha)
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1.0

      if (pt.life >= pt.maxLife) {
        particlesRef.current.splice(idx, 1)
      }
    })

    // Render Floating Text
    floatingTextsRef.current.forEach((ft, idx) => {
      ft.y -= 0.6
      ft.life++
      const alpha = 1 - ft.life / ft.maxLife

      ctx.font = "bold 14px sans-serif"
      ctx.fillStyle = ft.color
      ctx.globalAlpha = Math.max(0, alpha)
      ctx.textAlign = "center"
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.globalAlpha = 1.0

      if (ft.life >= ft.maxLife) {
        floatingTextsRef.current.splice(idx, 1)
      }
    })

    animFrameId.current = requestAnimationFrame(gameLoop)
  }, [activeFruit, activeTheme, createGhosts, difficulty, initGameSession, level, resetPositionsOnly, saveStats, score])

  // ----------------------------------------------------
  // EFFECT: RUN ANIMATION LOOP
  // ----------------------------------------------------
  useEffect(() => {
    animFrameId.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrameId.current)
  }, [gameLoop])

  // ----------------------------------------------------
  // EFFECT: KEYBOARD EVENT LISTENER
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== "playing" && phaseRef.current !== "paused") return

      const keyMap: Record<string, Direction> = {
        ArrowUp: DIR_UP,
        KeyW: DIR_UP,
        ArrowDown: DIR_DOWN,
        KeyS: DIR_DOWN,
        ArrowLeft: DIR_LEFT,
        KeyA: DIR_LEFT,
        ArrowRight: DIR_RIGHT,
        KeyD: DIR_RIGHT
      }

      if (keyMap[e.code] || keyMap[e.key]) {
        e.preventDefault()
        pacmanRef.current.nextDir = keyMap[e.code] || keyMap[e.key]
      }

      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        e.preventDefault()
        setPhase((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Action handlers
  const handleStartGame = () => {
    initGameSession(true)
    setPhase("playing")
  }

  const handleSetDirection = (dir: Direction) => {
    pacmanRef.current.nextDir = dir
  }

  // Current difficulty config
  const activeDifficultyCfg = DIFFICULTY_CONFIG[difficulty]

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 flex flex-col items-center gap-4 select-none min-h-[600px]">
      {/* Top Header / Navigation Bar */}
      <div className="w-full flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl hover:bg-accent/60">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span style={{ color: themeColor }}>PAC-MAN</span>
              <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
                Arcade Reborn
              </span>
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Navigate the maze, eat pellets, and outsmart Blinky, Pinky, Inky & Clyde!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRules(true)}
            className="rounded-xl border-primary/20 hover:bg-primary/10"
          >
            <HelpCircle className="w-4 h-4 mr-1.5 text-primary" />
            <span className="hidden sm:inline">Guide</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(true)}
            className="rounded-xl border-primary/20 hover:bg-primary/10"
          >
            <BarChart2 className="w-4 h-4 mr-1.5 text-primary" />
            <span className="hidden sm:inline">Stats</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleMute} className="rounded-xl">
            {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
          </Button>
        </div>
      </div>

      {/* Main Game Screen Router */}
      {phase === "menu" && (
        <Card className="w-full max-w-xl p-6 sm:p-8 bg-card/60 backdrop-blur-md border-border/60 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-6 my-auto">
          {/* Animated Pac-Man Mascot Icon */}
          <div className="relative group cursor-pointer">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-105"
              style={{ backgroundColor: themeColor, boxShadow: `0 0 30px ${themeColor}66` }}
            >
              <svg className="w-14 h-14 text-black fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5v-4l-3.5 2 3.5 2zm2 0l3.5-2-3.5-2v4z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-rose-500 text-white font-bold text-xs rounded-full shadow">
              PRO
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black tracking-tight mb-1">PAC-MAN CHOP</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Choose your difficulty level, visual theme, and dive into authentic arcade action!
            </p>
          </div>

          {/* Difficulty Selector */}
          <div className="w-full text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Difficulty Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => {
                const conf = DIFFICULTY_CONFIG[key]
                const isSelected = difficulty === key
                return (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? `${conf.color} ring-2 ring-primary/40 font-bold scale-[1.02]`
                        : "border-border/60 hover:bg-accent/40 text-muted-foreground"
                    }`}
                  >
                    <div className="text-sm font-semibold">{conf.name}</div>
                    <div className="text-[10px] opacity-80 mt-1">{conf.lives} Lives</div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">{activeDifficultyCfg.description}</p>
          </div>

          {/* Theme Selector */}
          <div className="w-full text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Visual Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(THEME_CONFIG) as ThemeKey[]).map((tKey) => {
                const tConf = THEME_CONFIG[tKey]
                const isSel = activeTheme === tKey
                return (
                  <button
                    key={tKey}
                    onClick={() => setActiveTheme(tKey)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      isSel
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                        : "border-border/60 hover:bg-accent/40 text-muted-foreground"
                    }`}
                  >
                    {tConf.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* High Score Banner */}
          {highScore > 0 && (
            <div className="w-full bg-accent/40 rounded-2xl p-3 flex items-center justify-between border border-border/40">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Best Score ({activeDifficultyCfg.name})
              </span>
              <span className="text-base font-black text-amber-400">{highScore.toLocaleString()}</span>
            </div>
          )}

          {/* Start Action */}
          <Button
            onClick={handleStartGame}
            size="lg"
            className="w-full rounded-2xl py-6 text-lg font-bold shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: themeColor, color: "#000" }}
          >
            <Play className="w-6 h-6 mr-2 fill-current" />
            START GAME
          </Button>
        </Card>
      )}

      {/* Playing & Paused Screen */}
      {(phase === "playing" || phase === "paused") && (
        <div className="w-full flex flex-col items-center gap-3">
          {/* HUD Bar */}
          <div className="w-full max-w-[480px] bg-card/70 backdrop-blur border border-border/60 rounded-2xl p-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">SCORE</div>
                <div className="text-lg font-black tracking-tight" style={{ color: themeColor }}>
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="border-l border-border/40 pl-4">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">HIGH SCORE</div>
                <div className="text-sm font-bold text-amber-400">{highScore.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider text-center">
                  LEVEL
                </div>
                <div className="text-sm font-bold text-primary text-center">LVL {level}</div>
              </div>

              {/* Lives Indicators */}
              <div className="border-l border-border/40 pl-4 flex flex-col items-end">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">LIVES</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setPhase((prev) => (prev === "playing" ? "paused" : "playing"))}
                className="rounded-xl ml-1"
              >
                {phase === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl bg-black">
            <canvas
              ref={canvasRef}
              width={420}
              height={465}
              className="block max-w-full h-auto"
            />

            {/* Pause Overlay */}
            {phase === "paused" && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
                <h3 className="text-3xl font-black text-white tracking-wider">GAME PAUSED</h3>
                <p className="text-sm text-muted-foreground">Press 'P' or click resume to return to the maze.</p>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setPhase("playing")}
                    size="lg"
                    className="rounded-2xl font-bold"
                    style={{ backgroundColor: themeColor, color: "#000" }}
                  >
                    Resume
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPhase("menu")}
                    size="lg"
                    className="rounded-2xl border-white/20 text-white"
                  >
                    Main Menu
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile / Touch On-Screen D-Pad */}
          <div className="flex sm:hidden flex-col items-center gap-1 mt-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSetDirection(DIR_UP)}
              className="w-12 h-12 rounded-2xl bg-card border-border/80 active:scale-90"
            >
              <ChevronUp className="w-6 h-6 text-primary" />
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSetDirection(DIR_LEFT)}
                className="w-12 h-12 rounded-2xl bg-card border-border/80 active:scale-90"
              >
                <ChevronLeft className="w-6 h-6 text-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSetDirection(DIR_DOWN)}
                className="w-12 h-12 rounded-2xl bg-card border-border/80 active:scale-90"
              >
                <ChevronDown className="w-6 h-6 text-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSetDirection(DIR_RIGHT)}
                className="w-12 h-12 rounded-2xl bg-card border-border/80 active:scale-90"
              >
                <ChevronRight className="w-6 h-6 text-primary" />
              </Button>
            </div>
          </div>

          {/* Controls Footer Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span>
              Use <kbd className="px-1.5 py-0.5 bg-accent rounded text-[10px] font-mono border">Arrow Keys</kbd> or{" "}
              <kbd className="px-1.5 py-0.5 bg-accent rounded text-[10px] font-mono border">WASD</kbd> to move
            </span>
            <span>•</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-accent rounded text-[10px] font-mono border">P</kbd> to Pause
            </span>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {phase === "gameover" && (
        <Card className="w-full max-w-md p-6 sm:p-8 bg-card/80 backdrop-blur-md border-border/60 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-6 my-auto">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center">
            <X className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-rose-500 mb-1">GAME OVER</h2>
            <p className="text-sm text-muted-foreground">Pac-Man lost all lives in the maze!</p>
          </div>

          {/* Stats Summary */}
          <div className="w-full bg-accent/40 rounded-2xl p-4 flex flex-col gap-2 border border-border/40">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Final Score</span>
              <span className="font-black text-lg" style={{ color: themeColor }}>
                {score.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Highest Level</span>
              <span className="font-bold text-primary">Level {level}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">High Score ({activeDifficultyCfg.name})</span>
              <span className="font-bold text-amber-400">{highScore.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex gap-3">
            <Button
              onClick={handleStartGame}
              size="lg"
              className="flex-1 rounded-2xl font-bold py-6"
              style={{ backgroundColor: themeColor, color: "#000" }}
            >
              <RotateCcw className="w-5 h-5 mr-2" /> Play Again
            </Button>
            <Button
              variant="outline"
              onClick={() => setPhase("menu")}
              size="lg"
              className="rounded-2xl border-border/60"
            >
              Menu
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Drawer / Modal */}
      {showStats && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-card border-border/60 rounded-3xl shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Career Statistics ({activeDifficultyCfg.name})</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowStats(false)} className="rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-accent/40 rounded-2xl border border-border/40">
                <div className="text-xs text-muted-foreground font-semibold">High Score</div>
                <div className="text-xl font-black text-amber-400 mt-1">{statsRecord.highScore.toLocaleString()}</div>
              </div>

              <div className="p-4 bg-accent/40 rounded-2xl border border-border/40">
                <div className="text-xs text-muted-foreground font-semibold">Highest Level</div>
                <div className="text-xl font-black text-primary mt-1">Level {statsRecord.highestLevel}</div>
              </div>

              <div className="p-4 bg-accent/40 rounded-2xl border border-border/40">
                <div className="text-xs text-muted-foreground font-semibold">Games Played</div>
                <div className="text-xl font-black text-foreground mt-1">{statsRecord.gamesPlayed}</div>
              </div>

              <div className="p-4 bg-accent/40 rounded-2xl border border-border/40">
                <div className="text-xs text-muted-foreground font-semibold">Ghosts Eaten</div>
                <div className="text-xl font-black text-rose-400 mt-1">{statsRecord.ghostsEaten}</div>
              </div>
            </div>

            <Button onClick={() => setShowStats(false)} className="w-full rounded-2xl font-bold">
              Close Statistics
            </Button>
          </Card>
        </div>
      )}

      {/* Guide / How to Play Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-card border-border/60 rounded-3xl shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">How to Play Pac-Man</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowRules(false)} className="rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs shrink-0">
                  01
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-0.5">Eat all Pac-Dots</h4>
                  <p>Guide Pac-Man through the maze to eat every dot (+10 pts). Clear the entire maze to level up!</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  02
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-0.5">Power Pellets & Ghost Chasing</h4>
                  <p>
                    Eat glowing Power Pellets (+50 pts) to temporarily turn ghosts vulnerable (blue). Chomp scared ghosts
                    for huge exponential combo scores (+200, +400, +800, +1600 pts)!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-400/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                  03
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-0.5">Know Your Ghost AI Personalities</h4>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>
                      <span className="text-rose-400 font-bold">Blinky (Red):</span> Direct chase - relentlessly tracks
                      Pac-Man.
                    </li>
                    <li>
                      <span className="text-pink-400 font-bold">Pinky (Pink):</span> Ambush - aims 4 tiles ahead of your path.
                    </li>
                    <li>
                      <span className="text-cyan-400 font-bold">Inky (Cyan):</span> Flanker - uses vector logic to surround you.
                    </li>
                    <li>
                      <span className="text-amber-400 font-bold">Clyde (Orange):</span> Shy - chases when far, retreats when close.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  04
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-0.5">Warp Tunnels & Fruit Rewards</h4>
                  <p>
                    Use the side Warp Tunnels on row 15 for instant escape! Catch bonus fruits (+100 to +5000 pts) that spawn
                    below the ghost house.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowRules(false)} className="w-full rounded-2xl font-bold mt-2">
              Got It, Let's Play!
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
