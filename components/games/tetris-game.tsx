"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ArrowDownToLine,
  Layers,
  Flame,
  Clock,
  ShieldAlert,
} from "lucide-react"

// --- Game Constants & Configuration ---
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const BLOCK_SIZE = 30
const BOARD_CANVAS_WIDTH = BOARD_WIDTH * BLOCK_SIZE
const BOARD_CANVAS_HEIGHT = BOARD_HEIGHT * BLOCK_SIZE

export type Difficulty = "easy" | "medium" | "hard" | "insane"
export type GameMode = "marathon" | "sprint" | "zen"
export type ThemeKey = "cyberpunk" | "synthwave" | "matrix" | "arcade"

interface DifficultyConfig {
  name: string
  speed: number // ms per drop tick at level 1
  lockDelay: number // ms before locking on ground
  scoreMult: number
  color: string
  badgeBg: string
  description: string
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: "Beginner",
    speed: 800,
    lockDelay: 700,
    scoreMult: 1.0,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    description: "Relaxed drop speed & generous lock delay. Perfect for learning.",
  },
  medium: {
    name: "Standard",
    speed: 500,
    lockDelay: 500,
    scoreMult: 1.5,
    color: "text-blue-400",
    badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    description: "Classic Tetris speed curve and balanced scoring bonus.",
  },
  hard: {
    name: "Expert",
    speed: 250,
    lockDelay: 350,
    scoreMult: 2.0,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    description: "Fast drop rates & shorter reaction times for seasoned players.",
  },
  insane: {
    name: "Master",
    speed: 100,
    lockDelay: 250,
    scoreMult: 3.0,
    color: "text-rose-400",
    badgeBg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    description: "Ultra-lightning speed! Lightning reflexes and instant decisions required.",
  },
}

interface ThemeConfig {
  name: string
  bg: string
  boardBg: string
  gridColor: string
  borderColor: string
  cardBg: string
  accentColor: string
}

const THEME_CONFIG: Record<ThemeKey, ThemeConfig> = {
  cyberpunk: {
    name: "Cyberpunk",
    bg: "from-slate-950 via-purple-950/40 to-slate-950",
    boardBg: "#0b0f19",
    gridColor: "rgba(0, 240, 255, 0.07)",
    borderColor: "#00f0ff",
    cardBg: "bg-slate-900/80 border-cyan-500/30 backdrop-blur-md",
    accentColor: "#00f0ff",
  },
  synthwave: {
    name: "Synthwave",
    bg: "from-slate-950 via-fuchsia-950/40 to-indigo-950",
    boardBg: "#120a21",
    gridColor: "rgba(236, 72, 153, 0.08)",
    borderColor: "#ec4899",
    cardBg: "bg-slate-900/80 border-fuchsia-500/30 backdrop-blur-md",
    accentColor: "#ec4899",
  },
  matrix: {
    name: "Matrix",
    bg: "from-zinc-950 via-emerald-950/30 to-zinc-950",
    boardBg: "#05110a",
    gridColor: "rgba(34, 197, 94, 0.08)",
    borderColor: "#22c55e",
    cardBg: "bg-zinc-900/80 border-emerald-500/30 backdrop-blur-md",
    accentColor: "#22c55e",
  },
  arcade: {
    name: "Retro Arcade",
    bg: "from-neutral-950 via-neutral-900 to-neutral-950",
    boardBg: "#000000",
    gridColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "#a855f7",
    cardBg: "bg-neutral-900/90 border-purple-500/30 backdrop-blur-md",
    accentColor: "#a855f7",
  },
}

// Tetromino Definitions (SRS System)
export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z"

interface TetrominoDef {
  shape: number[][]
  color: string
  glowColor: string
}

const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00f0f0", // Cyan
    glowColor: "rgba(0, 240, 240, 0.6)",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#3b82f6", // Blue
    glowColor: "rgba(59, 130, 246, 0.6)",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#f97316", // Orange
    glowColor: "rgba(249, 115, 22, 0.6)",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#eab308", // Yellow
    glowColor: "rgba(234, 179, 8, 0.6)",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#22c55e", // Green
    glowColor: "rgba(34, 197, 94, 0.6)",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#a855f7", // Purple
    glowColor: "rgba(168, 85, 247, 0.6)",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#ef4444", // Red
    glowColor: "rgba(239, 68, 68, 0.6)",
  },
}

// SRS Wall Kick Offset Tables
const WALL_KICK_JLSTZ: Record<string, number[][]> = {
  "0-1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1-0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1-2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2-1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2-3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3-2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3-0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0-3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
}

const WALL_KICK_I: Record<string, number[][]> = {
  "0-1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1-0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1-2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2-1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2-3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3-2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3-0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0-3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
}

interface Piece {
  type: TetrominoType
  shape: number[][]
  x: number
  y: number
  rotation: number // 0, 1, 2, 3
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  alpha: number
  life: number
  maxLife: number
}

interface FloatingText {
  id: number
  x: number
  y: number
  text: string
  color: string
  alpha: number
  vy: number
  life: number
}

// Audio Synthesizer Engine using Web Audio API
class AudioSynthesizer {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false

  constructor() {
    // Lazy audio context creation on user interaction
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
  }

  public playMove() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(280, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.05)
    } catch {}
  }

  public playRotate() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(320, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.08)
    } catch {}
  }

  public playHardDrop() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.12)
    } catch {}
  }

  public playLineClear(lines: number) {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return
    try {
      const freqs = lines >= 4 ? [440, 554.37, 659.25, 880] : lines === 3 ? [392, 493.88, 587.33] : lines === 2 ? [349.23, 440] : [261.63]
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06)
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.25)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(this.ctx.currentTime + idx * 0.06)
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.25)
      })
    } catch {}
  }

  public playTSpin() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(440, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.15)
    } catch {}
  }

  public playLevelUp() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08)
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.2)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(this.ctx.currentTime + i * 0.08)
        osc.stop(this.ctx.currentTime + i * 0.08 + 0.2)
      })
    } catch {}
  }

  public playGameOver() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(300, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.6)
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.6)
    } catch {}
  }
}

const audioSynth = new AudioSynthesizer()

// Main Tetris Component
export default function TetrisGame({ onBack, themeColor }: { onBack: () => void; themeColor: string }) {
  // Game Configuration State
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameMode, setGameMode] = useState<GameMode>("marathon")
  const [theme, setTheme] = useState<ThemeKey>("cyberpunk")
  const [isMuted, setIsMuted] = useState(false)
  const [showGhost, setShowGhost] = useState(true)

  // Game Play State
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [combo, setCombo] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [sprintTime, setSprintTime] = useState(0) // ms for 40-line mode
  const [backToBack, setBackToBack] = useState(false)

  // References
  const boardCanvasRef = useRef<HTMLCanvasElement>(null)
  const holdCanvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)

  const requestRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const dropTimerRef = useRef<number>(0)
  const lockTimerRef = useRef<number | null>(null)
  const sprintTimerRef = useRef<number>(0)

  // Game Engine Internal Mutable State
  const engine = useRef({
    board: Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0)) as (string | number)[][],
    currentPiece: null as Piece | null,
    holdPieceType: null as TetrominoType | null,
    canHold: true,
    nextQueue: [] as TetrominoType[],
    bag: [] as TetrominoType[],
    score: 0,
    level: 1,
    lines: 0,
    combo: 0,
    backToBack: false,
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    screenShake: 0,
    isTSpin: false,
    lastMoveWasRotate: false,
  })

  // Load High Score on Mount
  useEffect(() => {
    const saved = localStorage.getItem(`tetris_highscore_${difficulty}_${gameMode}`)
    if (saved) setHighScore(parseInt(saved, 10))
  }, [difficulty, gameMode])

  // Save High Score
  const updateHighScore = useCallback(
    (newScore: number) => {
      setHighScore((prev) => {
        if (newScore > prev) {
          localStorage.setItem(`tetris_highscore_${difficulty}_${gameMode}`, newScore.toString())
          return newScore
        }
        return prev
      })
    },
    [difficulty, gameMode]
  )

  // 7-Bag Generator
  const generateBag = useCallback((): TetrominoType[] => {
    const types: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"]
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[types[i], types[j]] = [types[j], types[i]]
    }
    return types
  }, [])

  const getNextPieceType = useCallback((): TetrominoType => {
    if (engine.current.bag.length === 0) {
      engine.current.bag = generateBag()
    }
    return engine.current.bag.pop()!
  }, [generateBag])

  const createPiece = useCallback((type: TetrominoType): Piece => {
    const def = TETROMINOES[type]
    const shape = def.shape.map((row) => [...row])
    const x = Math.floor(BOARD_WIDTH / 2) - Math.ceil(shape[0].length / 2)
    return { type, shape, x, y: 0, rotation: 0 }
  }, [])

  // Rotation matrices
  const rotateMatrix = (matrix: number[][], dir: 1 | -1): number[][] => {
    const n = matrix.length
    const result = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0))
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (dir === 1) {
          result[x][n - 1 - y] = matrix[y][x]
        } else {
          result[n - 1 - x][y] = matrix[y][x]
        }
      }
    }
    return result
  }

  // Collision Checking
  const isValidMove = useCallback((piece: Piece, board: (string | number)[][], offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const nx = piece.x + x + offsetX
          const ny = piece.y + y + offsetY
          if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return false
          if (ny >= 0 && board[ny][nx]) return false
        }
      }
    }
    return true
  }, [])

  // Calculate Ghost Piece Position
  const getGhostY = useCallback(
    (piece: Piece, board: (string | number)[][]): number => {
      let ghostY = piece.y
      while (isValidMove(piece, board, 0, ghostY - piece.y + 1)) {
        ghostY++
      }
      return ghostY
    },
    [isValidMove]
  )

  // Check T-Spin (3-Corner Rule)
  const checkTSpin = useCallback((piece: Piece, board: (string | number)[][]): boolean => {
    if (piece.type !== "T" || !engine.current.lastMoveWasRotate) return false
    // Corners relative to 3x3 T piece center at (x+1, y+1)
    const cx = piece.x + 1
    const cy = piece.y + 1
    const corners = [
      { x: cx - 1, y: cy - 1 },
      { x: cx + 1, y: cy - 1 },
      { x: cx - 1, y: cy + 1 },
      { x: cx + 1, y: cy + 1 },
    ]
    let occupied = 0
    corners.forEach((c) => {
      if (c.x < 0 || c.x >= BOARD_WIDTH || c.y >= BOARD_HEIGHT || (c.y >= 0 && board[c.y][c.x])) {
        occupied++
      }
    })
    return occupied >= 3
  }, [])

  // Spawn Particle Explosions
  const spawnParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 4
      engine.current.particles.push({
        x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
        y: y * BLOCK_SIZE + BLOCK_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 15,
      })
    }
  }, [])

  // Floating Text Popups
  const spawnFloatingText = useCallback((text: string, color: string) => {
    engine.current.floatingTexts.push({
      id: Date.now() + Math.random(),
      x: BOARD_CANVAS_WIDTH / 2,
      y: BOARD_CANVAS_HEIGHT / 2 - 20,
      text,
      color,
      alpha: 1,
      vy: -1.2,
      life: 0,
    })
  }, [])

  // Init / Reset Game
  const initGame = useCallback(() => {
    engine.current.board = Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0))
    engine.current.bag = generateBag()
    engine.current.nextQueue = [getNextPieceType(), getNextPieceType(), getNextPieceType()]
    engine.current.currentPiece = createPiece(getNextPieceType())
    engine.current.holdPieceType = null
    engine.current.canHold = true
    engine.current.score = 0
    engine.current.level = 1
    engine.current.lines = 0
    engine.current.combo = 0
    engine.current.backToBack = false
    engine.current.particles = []
    engine.current.floatingTexts = []
    engine.current.screenShake = 0

    setScore(0)
    setLevel(1)
    setLines(0)
    setCombo(0)
    setBackToBack(false)
    setSprintTime(0)
    dropTimerRef.current = 0
    lockTimerRef.current = null
    sprintTimerRef.current = 0
  }, [generateBag, getNextPieceType, createPiece])

  const startGame = useCallback(() => {
    initGame()
    setGameState("playing")
  }, [initGame])

  // Move Piece Left/Right
  const movePiece = useCallback(
    (dx: number) => {
      const { currentPiece, board } = engine.current
      if (!currentPiece) return false
      if (isValidMove(currentPiece, board, dx, 0)) {
        currentPiece.x += dx
        engine.current.lastMoveWasRotate = false
        audioSynth.playMove()
        // Reset lock delay if piece moved
        if (lockTimerRef.current !== null) {
          lockTimerRef.current = Date.now()
        }
        return true
      }
      return false
    },
    [isValidMove]
  )

  // Rotate Piece SRS
  const rotatePiece = useCallback(
    (dir: 1 | -1) => {
      const { currentPiece, board } = engine.current
      if (!currentPiece || currentPiece.type === "O") return

      const newRotation = (currentPiece.rotation + dir + 4) % 4
      const rotatedShape = rotateMatrix(currentPiece.shape, dir)
      const kickKey = `${currentPiece.rotation}-${newRotation}`
      const kickTable = currentPiece.type === "I" ? WALL_KICK_I[kickKey] || [[0, 0]] : WALL_KICK_JLSTZ[kickKey] || [[0, 0]]

      for (const [kx, ky] of kickTable) {
        const testPiece: Piece = {
          ...currentPiece,
          shape: rotatedShape,
          rotation: newRotation,
          x: currentPiece.x + kx,
          y: currentPiece.y - ky, // Invert Y offset for canvas grid
        }
        if (isValidMove(testPiece, board)) {
          engine.current.currentPiece = testPiece
          engine.current.lastMoveWasRotate = true
          audioSynth.playRotate()
          if (lockTimerRef.current !== null) {
            lockTimerRef.current = Date.now()
          }
          return
        }
      }
    },
    [isValidMove]
  )

  // Swap Hold Piece
  const holdPiece = useCallback(() => {
    const { currentPiece, holdPieceType, canHold } = engine.current
    if (!currentPiece || !canHold) return

    audioSynth.playRotate()
    const currentType = currentPiece.type
    if (holdPieceType === null) {
      engine.current.holdPieceType = currentType
      engine.current.currentPiece = createPiece(engine.current.nextQueue.shift()!)
      engine.current.nextQueue.push(getNextPieceType())
    } else {
      engine.current.holdPieceType = currentType
      engine.current.currentPiece = createPiece(holdPieceType)
    }
    engine.current.canHold = false
  }, [createPiece, getNextPieceType])

  // Lock Piece down onto Board
  const lockPiece = useCallback(() => {
    const { currentPiece, board } = engine.current
    if (!currentPiece) return

    // Check T-Spin status before placing
    const isTSpin = checkTSpin(currentPiece, board)

    // Place block onto board array
    let placedY = 0
    currentPiece.shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          const by = currentPiece.y + y
          const bx = currentPiece.x + x
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            board[by][bx] = TETROMINOES[currentPiece.type].color
            placedY = Math.max(placedY, by)
          }
        }
      })
    })

    // Check for Cleared Lines
    let clearedLinesCount = 0
    const linesToClear: number[] = []
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (board[y].every((cell) => cell !== 0)) {
        clearedLinesCount++
        linesToClear.push(y)
      }
    }

    // Spawn Particles & Process Clears
    if (clearedLinesCount > 0) {
      linesToClear.forEach((rowIdx) => {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          spawnParticles(x, rowIdx, board[rowIdx][x] as string, 6)
        }
        board.splice(rowIdx, 1)
        board.unshift(Array(BOARD_WIDTH).fill(0))
      })

      engine.current.lines += clearedLinesCount
      engine.current.combo += 1

      // Scoring Calculations
      const diffCfg = DIFFICULTY_SETTINGS[difficulty]
      let basePoints = 0
      let label = ""

      if (isTSpin) {
        audioSynth.playTSpin()
        if (clearedLinesCount === 1) {
          basePoints = 800
          label = "T-SPIN SINGLE!"
        } else if (clearedLinesCount === 2) {
          basePoints = 1200
          label = "T-SPIN DOUBLE!"
        } else if (clearedLinesCount >= 3) {
          basePoints = 1600
          label = "T-SPIN TRIPLE!"
        }
      } else {
        audioSynth.playLineClear(clearedLinesCount)
        if (clearedLinesCount === 1) {
          basePoints = 100
          label = "SINGLE!"
        } else if (clearedLinesCount === 2) {
          basePoints = 300
          label = "DOUBLE!"
        } else if (clearedLinesCount === 3) {
          basePoints = 500
          label = "TRIPLE!"
        } else if (clearedLinesCount >= 4) {
          basePoints = 800
          label = "TETRIS!"
          engine.current.screenShake = 12
        }
      }

      // Back-to-Back Multiplier
      let b2bMultiplier = 1.0
      if (clearedLinesCount === 4 || isTSpin) {
        if (engine.current.backToBack) {
          b2bMultiplier = 1.5
          label = `B2B ${label}`
        }
        engine.current.backToBack = true
        setBackToBack(true)
      } else {
        engine.current.backToBack = false
        setBackToBack(false)
      }

      // Combo Multiplier
      const comboBonus = engine.current.combo > 1 ? (engine.current.combo - 1) * 50 : 0
      const roundScore = Math.floor((basePoints * b2bMultiplier + comboBonus) * engine.current.level * diffCfg.scoreMult)

      engine.current.score += roundScore
      if (label) spawnFloatingText(label, label.includes("TETRIS") ? "#00f0ff" : "#ec4899")

      // Level Ramp (Every 10 lines)
      const newLevel = Math.floor(engine.current.lines / 10) + 1
      if (newLevel > engine.current.level) {
        engine.current.level = newLevel
        audioSynth.playLevelUp()
        spawnFloatingText(`LEVEL ${newLevel}!`, "#eab308")
      }

      // Check Sprint Mode 40-Line Completion
      if (gameMode === "sprint" && engine.current.lines >= 40) {
        setGameState("gameOver")
        audioSynth.playLevelUp()
        updateHighScore(engine.current.score)
        return
      }
    } else {
      engine.current.combo = 0
    }

    // Sync State
    setScore(engine.current.score)
    setLines(engine.current.lines)
    setLevel(engine.current.level)
    setCombo(engine.current.combo)
    updateHighScore(engine.current.score)

    // Spawn Next Piece
    const nextType = engine.current.nextQueue.shift()!
    engine.current.nextQueue.push(getNextPieceType())
    const nextPiece = createPiece(nextType)

    engine.current.currentPiece = nextPiece
    engine.current.canHold = true
    lockTimerRef.current = null

    // Check Game Over (Spawn blocked)
    if (!isValidMove(nextPiece, board)) {
      setGameState("gameOver")
      audioSynth.playGameOver()
      updateHighScore(engine.current.score)
    }
  }, [checkTSpin, difficulty, gameMode, getNextPieceType, createPiece, isValidMove, spawnParticles, spawnFloatingText, updateHighScore])

  // Soft Drop
  const softDrop = useCallback(() => {
    const { currentPiece, board } = engine.current
    if (!currentPiece) return
    if (isValidMove(currentPiece, board, 0, 1)) {
      currentPiece.y += 1
      engine.current.score += 1
      engine.current.lastMoveWasRotate = false
      setScore(engine.current.score)
      dropTimerRef.current = 0
    } else {
      if (lockTimerRef.current === null) {
        lockTimerRef.current = Date.now()
      }
    }
  }, [isValidMove])

  // Hard Drop
  const hardDrop = useCallback(() => {
    const { currentPiece, board } = engine.current
    if (!currentPiece) return

    const ghostY = getGhostY(currentPiece, board)
    const dropDistance = ghostY - currentPiece.y

    currentPiece.y = ghostY
    engine.current.score += dropDistance * 2
    engine.current.screenShake = 6

    audioSynth.playHardDrop()

    // Spawn shockwave laser trail particles
    for (let x = 0; x < currentPiece.shape[0].length; x++) {
      spawnParticles(currentPiece.x + x, ghostY, TETROMINOES[currentPiece.type].color, 4)
    }

    lockPiece()
  }, [getGhostY, lockPiece, spawnParticles])

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault()
          movePiece(-1)
          break
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault()
          movePiece(1)
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          softDrop()
          break
        case "ArrowUp":
        case "w":
        case "W":
        case "x":
        case "X":
          e.preventDefault()
          rotatePiece(1)
          break
        case "z":
        case "Z":
        case "Control":
          e.preventDefault()
          rotatePiece(-1)
          break
        case " ":
          e.preventDefault()
          hardDrop()
          break
        case "c":
        case "C":
        case "Shift":
          e.preventDefault()
          holdPiece()
          break
        case "p":
        case "P":
        case "Escape":
          e.preventDefault()
          setGameState((prev) => (prev === "playing" ? "paused" : "playing"))
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, movePiece, softDrop, rotatePiece, hardDrop, holdPiece])

  // Render Mini Piece Preview for Hold / Next Queue
  const renderPreviewPiece = useCallback((ctx: CanvasRenderingContext2D, type: TetrominoType | null, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height)
    if (!type) return

    const def = TETROMINOES[type]
    const shape = def.shape
    const rows = shape.length
    const cols = shape[0].length

    const previewBlockSize = 22
    const offsetX = (width - cols * previewBlockSize) / 2
    const offsetY = (height - rows * previewBlockSize) / 2

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          const px = offsetX + c * previewBlockSize
          const py = offsetY + r * previewBlockSize

          ctx.fillStyle = def.color
          ctx.shadowColor = def.glowColor
          ctx.shadowBlur = 8
          ctx.fillRect(px + 1, py + 1, previewBlockSize - 2, previewBlockSize - 2)
          ctx.shadowBlur = 0

          // Inner bevel highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
          ctx.fillRect(px + 2, py + 2, previewBlockSize - 4, 3)
        }
      }
    }
  }, [])

  // Main Canvas Render Loop
  const render = useCallback(() => {
    const boardCanvas = boardCanvasRef.current
    if (!boardCanvas) return
    const ctx = boardCanvas.getContext("2d")
    if (!ctx) return

    const tConfig = THEME_CONFIG[theme]

    // Apply Screen Shake
    ctx.save()
    if (engine.current.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * engine.current.screenShake
      const shakeY = (Math.random() - 0.5) * engine.current.screenShake
      ctx.translate(shakeX, shakeY)
      engine.current.screenShake *= 0.85
      if (engine.current.screenShake < 0.2) engine.current.screenShake = 0
    }

    // Clear Board
    ctx.fillStyle = tConfig.boardBg
    ctx.fillRect(0, 0, BOARD_CANVAS_WIDTH, BOARD_CANVAS_HEIGHT)

    // Draw Grid Lines
    ctx.strokeStyle = tConfig.gridColor
    ctx.lineWidth = 1
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * BLOCK_SIZE, 0)
      ctx.lineTo(x * BLOCK_SIZE, BOARD_CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * BLOCK_SIZE)
      ctx.lineTo(BOARD_CANVAS_WIDTH, y * BLOCK_SIZE)
      ctx.stroke()
    }

    // Draw Static Board Blocks
    engine.current.board.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color !== 0) {
          const bx = x * BLOCK_SIZE
          const by = y * BLOCK_SIZE

          ctx.fillStyle = color as string
          ctx.shadowColor = color as string
          ctx.shadowBlur = 6
          ctx.fillRect(bx + 1, by + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
          ctx.shadowBlur = 0

          // Inner bevels
          ctx.fillStyle = "rgba(255, 255, 255, 0.35)"
          ctx.fillRect(bx + 2, by + 2, BLOCK_SIZE - 4, 3)
          ctx.fillStyle = "rgba(0, 0, 0, 0.25)"
          ctx.fillRect(bx + 2, by + BLOCK_SIZE - 5, BLOCK_SIZE - 4, 3)
        }
      })
    })

    const currentPiece = engine.current.currentPiece

    // Draw Ghost Piece
    if (currentPiece && showGhost && gameState === "playing") {
      const ghostY = getGhostY(currentPiece, engine.current.board)
      const def = TETROMINOES[currentPiece.type]

      currentPiece.shape.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            const gx = (currentPiece.x + c) * BLOCK_SIZE
            const gy = (ghostY + r) * BLOCK_SIZE
            ctx.strokeStyle = def.color
            ctx.lineWidth = 2
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
            ctx.fillRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4)
            ctx.strokeRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4)
          }
        })
      })
    }

    // Draw Active Piece
    if (currentPiece) {
      const def = TETROMINOES[currentPiece.type]
      currentPiece.shape.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            const px = (currentPiece.x + c) * BLOCK_SIZE
            const py = (currentPiece.y + r) * BLOCK_SIZE

            ctx.fillStyle = def.color
            ctx.shadowColor = def.glowColor
            ctx.shadowBlur = 10
            ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
            ctx.shadowBlur = 0

            // Inner Highlights
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
            ctx.fillRect(px + 3, py + 3, BLOCK_SIZE - 6, 4)
          }
        })
      })
    }

    // Update & Render Particles
    engine.current.particles.forEach((p, idx) => {
      p.x += p.vx
      p.y += p.vy
      p.life++
      p.alpha = 1 - p.life / p.maxLife

      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1.0
    })
    engine.current.particles = engine.current.particles.filter((p) => p.life < p.maxLife)

    // Update & Render Floating Text Popups
    engine.current.floatingTexts.forEach((ft) => {
      ft.y += ft.vy
      ft.life++
      ft.alpha = 1 - ft.life / 40

      ctx.font = "bold 16px sans-serif"
      ctx.fillStyle = ft.color
      ctx.shadowColor = ft.color
      ctx.shadowBlur = 10
      ctx.globalAlpha = Math.max(0, ft.alpha)
      ctx.textAlign = "center"
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1.0
    })
    engine.current.floatingTexts = engine.current.floatingTexts.filter((ft) => ft.life < 40)

    ctx.restore()

    // Render Side Panel Canvases (Hold & Next)
    if (holdCanvasRef.current) {
      const hCtx = holdCanvasRef.current.getContext("2d")
      if (hCtx) renderPreviewPiece(hCtx, engine.current.holdPieceType, 90, 80)
    }

    if (nextCanvasRef.current) {
      const nCtx = nextCanvasRef.current.getContext("2d")
      if (nCtx) {
        nCtx.clearRect(0, 0, 90, 220)
        engine.current.nextQueue.slice(0, 3).forEach((type, idx) => {
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = 90
          tempCanvas.height = 70
          const tempCtx = tempCanvas.getContext("2d")
          if (tempCtx) {
            renderPreviewPiece(tempCtx, type, 90, 70)
            nCtx.drawImage(tempCanvas, 0, idx * 72)
          }
        })
      }
    }
  }, [theme, showGhost, gameState, getGhostY, renderPreviewPiece])

  // Game Loop Ticker
  const update = useCallback(
    (time: number) => {
      if (gameState !== "playing") return

      if (!lastTimeRef.current) lastTimeRef.current = time
      const deltaTime = time - lastTimeRef.current
      lastTimeRef.current = time

      dropTimerRef.current += deltaTime

      // Sprint Timer Tracking
      if (gameMode === "sprint") {
        sprintTimerRef.current += deltaTime
        setSprintTime(Math.floor(sprintTimerRef.current / 1000))
      }

      // Calculate Gravity Drop Interval
      const diffCfg = DIFFICULTY_SETTINGS[difficulty]
      const speedRamp = Math.max(40, diffCfg.speed - (engine.current.level - 1) * 35)

      // Automatic Drop Step
      if (dropTimerRef.current >= speedRamp) {
        dropTimerRef.current = 0
        const { currentPiece, board } = engine.current
        if (currentPiece) {
          if (isValidMove(currentPiece, board, 0, 1)) {
            currentPiece.y += 1
            engine.current.lastMoveWasRotate = false
            lockTimerRef.current = null
          } else {
            if (lockTimerRef.current === null) {
              lockTimerRef.current = Date.now()
            }
          }
        }
      }

      // Handle Lock Delay Timeout
      if (lockTimerRef.current !== null) {
        const elapsed = Date.now() - lockTimerRef.current
        if (elapsed >= diffCfg.lockDelay) {
          lockPiece()
        }
      }

      render()
      requestRef.current = requestAnimationFrame(update)
    },
    [gameState, gameMode, difficulty, isValidMove, lockPiece, render]
  )

  useEffect(() => {
    if (gameState === "playing") {
      lastTimeRef.current = performance.now()
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const tConfig = THEME_CONFIG[theme]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${tConfig.bg} text-white flex flex-col items-center justify-center p-4 select-none`}>
      {/* Top Header Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <Button onClick={onBack} variant="outline" className="border-white/10 hover:bg-white/10 text-white gap-2 backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/80 border border-white/10 rounded-lg p-1 backdrop-blur-md">
            {(["cyberpunk", "synthwave", "matrix", "arcade"] as ThemeKey[]).map((tk) => (
              <button
                key={tk}
                onClick={() => setTheme(tk)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  theme === tk ? "bg-white/20 text-white font-medium shadow-sm" : "text-gray-400 hover:text-white"
                }`}
              >
                {THEME_CONFIG[tk].name}
              </button>
            ))}
          </div>

          <Button
            onClick={() => {
              setIsMuted(!isMuted)
              audioSynth.setMuted(!isMuted)
            }}
            variant="outline"
            className="border-white/10 hover:bg-white/10 text-white p-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </Button>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 relative">
        {/* Left Side Dashboard: Hold Piece & Mode info */}
        <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-44">
          <Card className={`${tConfig.cardBg} p-4 flex flex-col items-center justify-center border text-center shadow-lg`}>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Hold (C)
            </span>
            <canvas ref={holdCanvasRef} width={90} height={80} className="bg-black/40 rounded-lg border border-white/5" />
          </Card>

          <Card className={`${tConfig.cardBg} p-4 border shadow-lg space-y-3`}>
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> High Score
              </span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">{highScore}</p>
            </div>
            {gameMode === "sprint" && (
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Time (Sprint)
                </span>
                <p className="text-lg font-bold font-mono text-cyan-300 mt-1">{sprintTime}s / 40 Lines</p>
              </div>
            )}
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Streak
              </span>
              <p className="text-sm font-semibold text-purple-300 mt-1">
                {combo > 1 ? `Combo x${combo}` : backToBack ? "B2B Active!" : "None"}
              </p>
            </div>
          </Card>
        </div>

        {/* Center: Tetris Game Canvas Board */}
        <div className="relative">
          <Card className={`p-2 border-2 ${tConfig.cardBg} shadow-2xl relative overflow-hidden`} style={{ borderColor: tConfig.borderColor }}>
            <canvas ref={boardCanvasRef} width={BOARD_CANVAS_WIDTH} height={BOARD_CANVAS_HEIGHT} className="rounded-md block" />

            {/* Menu Overlay */}
            {gameState === "menu" && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-purple-400 animate-pulse" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-1">
                  TETRIS
                </h1>
                <p className="text-xs text-gray-400 mb-5">Next-Gen Modern Arcade Puzzle</p>

                {/* Difficulty Selector */}
                <div className="w-full space-y-2 mb-5">
                  <label className="text-xs text-gray-300 font-semibold uppercase tracking-wider block text-left">Difficulty Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["easy", "medium", "hard", "insane"] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                          difficulty === d ? "bg-white/15 border-cyan-400 text-white shadow-md scale-102" : "border-white/10 text-gray-400 hover:bg-white/5"
                        }`}
                      >
                        <div className={`font-semibold ${DIFFICULTY_SETTINGS[d].color}`}>{DIFFICULTY_SETTINGS[d].name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{DIFFICULTY_SETTINGS[d].description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Game Mode Selector */}
                <div className="w-full space-y-2 mb-6">
                  <label className="text-xs text-gray-300 font-semibold uppercase tracking-wider block text-left">Game Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "marathon", name: "Marathon", desc: "Endless" },
                      { id: "sprint", name: "Sprint", desc: "40 Lines" },
                      { id: "zen", name: "Zen", desc: "Relaxed" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setGameMode(m.id as GameMode)}
                        className={`p-2 rounded-lg border text-center text-xs transition-all ${
                          gameMode === m.id ? "bg-cyan-500/20 border-cyan-400 text-white font-medium" : "border-white/10 text-gray-400 hover:bg-white/5"
                        }`}
                      >
                        <div>{m.name}</div>
                        <div className="text-[9px] text-gray-400">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={startGame} size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold py-3 text-sm rounded-xl shadow-lg shadow-purple-500/20">
                  <Play className="w-4 h-4 mr-2 fill-current" /> Start Game
                </Button>
              </div>
            )}

            {/* Pause Overlay */}
            {gameState === "paused" && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
                <div className="flex flex-col gap-3 w-48">
                  <Button onClick={() => setGameState("playing")} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
                    <Play className="w-4 h-4 mr-2" /> Resume
                  </Button>
                  <Button onClick={() => setGameState("menu")} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                    Main Menu
                  </Button>
                </div>
              </div>
            )}

            {/* Game Over Overlay */}
            {gameState === "gameOver" && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <ShieldAlert className="w-12 h-12 text-rose-500 mb-2 animate-bounce" />
                <h2 className="text-3xl font-extrabold text-rose-400 mb-1">
                  {gameMode === "sprint" && engine.current.lines >= 40 ? "Sprint Completed!" : "Game Over"}
                </h2>
                <p className="text-xs text-gray-400 mb-4">{DIFFICULTY_SETTINGS[difficulty].name} &middot; {gameMode.toUpperCase()} Mode</p>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full max-w-xs mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Final Score:</span>
                    <span className="font-bold text-cyan-400 font-mono text-base">{score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Lines Cleared:</span>
                    <span className="font-semibold text-white font-mono">{lines}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Reached Level:</span>
                    <span className="font-semibold text-purple-400 font-mono">{level}</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full max-w-xs">
                  <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold">
                    <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                  </Button>
                  <Button onClick={() => setGameState("menu")} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                    Menu
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* On-Screen Mobile & Touch Control Buttons */}
          <div className="mt-4 grid grid-cols-5 gap-2 w-full">
            <Button onClick={() => movePiece(-1)} variant="outline" className="border-white/10 bg-slate-900/60 hover:bg-white/10 p-3 h-12">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button onClick={() => rotatePiece(1)} variant="outline" className="border-white/10 bg-slate-900/60 hover:bg-white/10 p-3 h-12">
              <RotateCw className="w-5 h-5 text-purple-400" />
            </Button>
            <Button onClick={() => softDrop()} variant="outline" className="border-white/10 bg-slate-900/60 hover:bg-white/10 p-3 h-12">
              <ChevronDown className="w-6 h-6" />
            </Button>
            <Button onClick={() => hardDrop()} variant="outline" className="border-white/10 bg-slate-900/60 hover:bg-white/10 p-3 h-12">
              <ArrowDownToLine className="w-5 h-5 text-cyan-400" />
            </Button>
            <Button onClick={() => movePiece(1)} variant="outline" className="border-white/10 bg-slate-900/60 hover:bg-white/10 p-3 h-12">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Right Side Dashboard: Next Queue & Gameplay Stats */}
        <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-44">
          <Card className={`${tConfig.cardBg} p-4 flex flex-col items-center justify-center border text-center shadow-lg`}>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-purple-400" /> Next Pieces
            </span>
            <canvas ref={nextCanvasRef} width={90} height={220} className="bg-black/40 rounded-lg border border-white/5" />
          </Card>

          <Card className={`${tConfig.cardBg} p-4 border shadow-lg space-y-3`}>
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Score</span>
              <p className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">{score}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] uppercase text-gray-400 font-medium">Level</span>
                <p className="text-lg font-bold font-mono text-purple-400">{level}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400 font-medium">Lines</span>
                <p className="text-lg font-bold font-mono text-emerald-400">{lines}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
              <span>Difficulty:</span>
              <span className={`font-semibold ${DIFFICULTY_SETTINGS[difficulty].color}`}>{DIFFICULTY_SETTINGS[difficulty].name}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
