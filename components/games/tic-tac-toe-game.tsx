"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Grid3X3,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Lightbulb,
  Clock,
  Flame,
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  HelpCircle,
  Play,
  Pause,
  Undo2,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings2,
  User,
  Bot,
  Swords,
  Layers,
  Sparkle
} from "lucide-react"

// ----------------------------------------------------
// TYPES & CONSTANTS
// ----------------------------------------------------
export type BoardSize = "3x3" | "4x4" | "5x5"
export type GameVariant = "classic" | "quantum" | "misere"
export type GameMode = "vs-ai" | "vs-player" | "ai-vs-ai"
export type AIDifficulty = "easy" | "medium" | "hard" | "unbeatable"
export type PlayerSymbol = "X" | "O"
export type CellValue = PlayerSymbol | null

export type SymbolThemeKey = "classic" | "cyber" | "nature" | "arcade" | "elements"
export type VisualThemeKey = "cyber" | "midnight" | "emerald" | "retro"

interface SymbolTheme {
  name: string
  xSymbol: string
  oSymbol: string
  xColor: string
  oColor: string
  xGlow: string
  oGlow: string
}

const SYMBOL_THEMES: Record<SymbolThemeKey, SymbolTheme> = {
  classic: {
    name: "Classic Neon",
    xSymbol: "❌",
    oSymbol: "⭕",
    xColor: "text-rose-500",
    oColor: "text-cyan-400",
    xGlow: "shadow-rose-500/50",
    oGlow: "shadow-cyan-400/50"
  },
  cyber: {
    name: "Cyber Pulse",
    xSymbol: "⚡",
    oSymbol: "🔮",
    xColor: "text-amber-400",
    oColor: "text-purple-400",
    xGlow: "shadow-amber-400/50",
    oGlow: "shadow-purple-400/50"
  },
  nature: {
    name: "Sakura & Leaf",
    xSymbol: "🌸",
    oSymbol: "🍃",
    xColor: "text-pink-400",
    oColor: "text-emerald-400",
    xGlow: "shadow-pink-400/50",
    oGlow: "shadow-emerald-400/50"
  },
  arcade: {
    name: "Sword & Shield",
    xSymbol: "⚔️",
    oSymbol: "🛡️",
    xColor: "text-blue-400",
    oColor: "text-yellow-400",
    xGlow: "shadow-blue-400/50",
    oGlow: "shadow-yellow-400/50"
  },
  elements: {
    name: "Fire & Frost",
    xSymbol: "🔥",
    oSymbol: "❄️",
    xColor: "text-orange-500",
    oColor: "text-sky-300",
    xGlow: "shadow-orange-500/50",
    oGlow: "shadow-sky-300/50"
  }
}

interface VisualTheme {
  name: string
  bg: string
  cardBg: string
  accent: string
  gridBorder: string
  cellBg: string
  cellHover: string
}

const VISUAL_THEMES: Record<VisualThemeKey, VisualTheme> = {
  cyber: {
    name: "Cyber Dark",
    bg: "from-slate-950 via-slate-900 to-indigo-950",
    cardBg: "bg-slate-900/80 border-slate-800",
    accent: "from-cyan-500 to-indigo-500",
    gridBorder: "border-slate-700/60",
    cellBg: "bg-slate-900/90 hover:bg-slate-800/90",
    cellHover: "hover:border-cyan-500/50"
  },
  midnight: {
    name: "Midnight Slate",
    bg: "from-gray-950 via-zinc-900 to-slate-950",
    cardBg: "bg-zinc-900/80 border-zinc-800",
    accent: "from-purple-500 to-pink-500",
    gridBorder: "border-zinc-800",
    cellBg: "bg-zinc-900/90 hover:bg-zinc-800/90",
    cellHover: "hover:border-purple-500/50"
  },
  emerald: {
    name: "Emerald Deep",
    bg: "from-emerald-950 via-teal-950 to-slate-950",
    cardBg: "bg-teal-950/80 border-teal-800/60",
    accent: "from-emerald-400 to-teal-500",
    gridBorder: "border-teal-800/50",
    cellBg: "bg-teal-900/40 hover:bg-teal-800/50",
    cellHover: "hover:border-emerald-400/50"
  },
  retro: {
    name: "Retro Glow",
    bg: "from-zinc-950 via-purple-950 to-zinc-950",
    cardBg: "bg-zinc-900/90 border-purple-900/40",
    accent: "from-amber-400 to-rose-500",
    gridBorder: "border-purple-900/60",
    cellBg: "bg-purple-950/40 hover:bg-purple-900/50",
    cellHover: "hover:border-amber-400/50"
  }
}

interface MoveHistoryRecord {
  player: PlayerSymbol
  index: number
  boardState: CellValue[]
  timestamp: number
}

interface GameStats {
  played: number
  xWins: number
  oWins: number
  ties: number
  currentStreak: number
  bestStreak: number
}

interface TicTacToeGameProps {
  onBack?: () => void
  themeColor?: string
}

// ----------------------------------------------------
// WEB AUDIO SYNTHESIZER
// ----------------------------------------------------
class SoundEngine {
  private ctx: AudioContext | null = null

  private init() {
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

  playXSound(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08) // A5

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.15)
  }

  playOSound(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(440, this.ctx.currentTime) // A4
    osc.frequency.exponentialRampToValueAtTime(329.63, this.ctx.currentTime + 0.12) // E4

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.18)
  }

  playWinSound(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08)

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(this.ctx.currentTime + idx * 0.08)
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.3)
    })
  }

  playLoseSound(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const notes = [400, 350, 300, 250]
    notes.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09)

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.25)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(this.ctx.currentTime + idx * 0.09)
      osc.stop(this.ctx.currentTime + idx * 0.09 + 0.25)
    })
  }

  playDrawSound(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(440, this.ctx.currentTime)
    osc.frequency.setValueAtTime(440, this.ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.3)
  }

  playHintSound(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.2)
  }

  playUndoSound(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(600, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.15)
  }

  playClick(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(800, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.04)
  }
}

const sounds = new SoundEngine()

// ----------------------------------------------------
// WINNING LINE CALCULATOR HELPER
// ----------------------------------------------------
function getBoardDimension(boardSize: BoardSize): number {
  switch (boardSize) {
    case "3x3":
      return 3
    case "4x4":
      return 4
    case "5x5":
      return 5
  }
}

function getWinConditionLength(boardSize: BoardSize): number {
  return boardSize === "3x3" ? 3 : 4
}

function generateWinningLines(boardSize: BoardSize): number[][] {
  const n = getBoardDimension(boardSize)
  const reqLen = getWinConditionLength(boardSize)
  const lines: number[][] = []

  // Horizontal lines
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n - reqLen; c++) {
      const line: number[] = []
      for (let k = 0; k < reqLen; k++) {
        line.push(r * n + (c + k))
      }
      lines.push(line)
    }
  }

  // Vertical lines
  for (let c = 0; c < n; c++) {
    for (let r = 0; r <= n - reqLen; r++) {
      const line: number[] = []
      for (let k = 0; k < reqLen; k++) {
        line.push((r + k) * n + c)
      }
      lines.push(line)
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r <= n - reqLen; r++) {
    for (let c = 0; c <= n - reqLen; c++) {
      const line: number[] = []
      for (let k = 0; k < reqLen; k++) {
        line.push((r + k) * n + (c + k))
      }
      lines.push(line)
    }
  }

  // Diagonal Down-Left
  for (let r = 0; r <= n - reqLen; r++) {
    for (let c = reqLen - 1; c < n; c++) {
      const line: number[] = []
      for (let k = 0; k < reqLen; k++) {
        line.push((r + k) * n + (c - k))
      }
      lines.push(line)
    }
  }

  return lines
}

function checkWinnerOnBoard(
  board: CellValue[],
  boardSize: BoardSize,
  variant: GameVariant
): { winner: PlayerSymbol | "tie" | null; line: number[] | null } {
  const lines = generateWinningLines(boardSize)

  for (const line of lines) {
    const firstSymbol = board[line[0]]
    if (firstSymbol && line.every((idx) => board[idx] === firstSymbol)) {
      if (variant === "misere") {
        // In Misere mode, forming the winning line loses the game!
        const loser = firstSymbol
        const winner = loser === "X" ? "O" : "X"
        return { winner, line }
      }
      return { winner: firstSymbol, line }
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "tie", line: null }
  }

  return { winner: null, line: null }
}

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export default function TicTacToeGame({ onBack }: TicTacToeGameProps) {
  // Settings & Configuration
  const [boardSize, setBoardSize] = useState<BoardSize>("3x3")
  const [variant, setVariant] = useState<GameVariant>("classic")
  const [mode, setMode] = useState<GameMode>("vs-ai")
  const [difficulty, setDifficulty] = useState<AIDifficulty>("unbeatable")
  const [symbolThemeKey, setSymbolThemeKey] = useState<SymbolThemeKey>("classic")
  const [visualThemeKey, setVisualThemeKey] = useState<VisualThemeKey>("cyber")
  const [timerDuration, setTimerDuration] = useState<number>(0) // 0 = off, 5, 10, 15s
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const humanPlayer: PlayerSymbol = "X"

  // Game Engine State
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSymbol>("X")
  const [winner, setWinner] = useState<PlayerSymbol | "tie" | null>(null)
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  const [history, setHistory] = useState<MoveHistoryRecord[]>([])
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [hintIndex, setHintIndex] = useState<number | null>(null)
  const [hintReason, setHintReason] = useState<string | null>(null)
  const spectatorSpeed = 800 // ms between AI moves

  // Replay State
  const [replayStep, setReplayStep] = useState<number>(-1)
  const [isReplaying, setIsReplaying] = useState<boolean>(false)

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0)

  // Persistent Statistics
  const [stats, setStats] = useState<GameStats>({
    played: 0,
    xWins: 0,
    oWins: 0,
    ties: 0,
    currentStreak: 0,
    bestStreak: 0
  })

  // Modal Flags
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false)

  // Canvas Confetti Ref
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const activeSymbolTheme = SYMBOL_THEMES[symbolThemeKey]
  const activeVisualTheme = VISUAL_THEMES[visualThemeKey]
  const boardDim = getBoardDimension(boardSize)
  const maxQuantumMarks = 3

  // Load saved options & stats from localStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem("tictactoe_stats_v2")
      if (savedStats) setStats(JSON.parse(savedStats))

      const savedMute = localStorage.getItem("tictactoe_muted")
      if (savedMute) setIsMuted(JSON.parse(savedMute))

      const savedSymbol = localStorage.getItem("tictactoe_symbol") as SymbolThemeKey
      if (savedSymbol && SYMBOL_THEMES[savedSymbol]) setSymbolThemeKey(savedSymbol)

      const savedVisual = localStorage.getItem("tictactoe_visual") as VisualThemeKey
      if (savedVisual && VISUAL_THEMES[savedVisual]) setVisualThemeKey(savedVisual)
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Save stats
  const updateStats = useCallback((res: PlayerSymbol | "tie") => {
    setStats((prev) => {
      const newPlayed = prev.played + 1
      let newX = prev.xWins
      let newO = prev.oWins
      let newTies = prev.ties
      let streak = prev.currentStreak

      if (res === "X") {
        newX++
        streak = streak >= 0 ? streak + 1 : 1
      } else if (res === "O") {
        newO++
        streak = streak <= 0 ? streak - 1 : -1
      } else {
        newTies++
      }

      const best = Math.max(prev.bestStreak, Math.abs(streak))
      const updated = {
        played: newPlayed,
        xWins: newX,
        oWins: newO,
        ties: newTies,
        currentStreak: streak,
        bestStreak: best
      }

      try {
        localStorage.setItem("tictactoe_stats_v2", JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }

      return updated
    })
  }, [])

  // Confetti Animation Engine
  const triggerConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      rotation: number
      rSpeed: number
      opacity: number
    }> = []

    const colors = ["#38bdf8", "#f43f5e", "#a855f7", "#f59e0b", "#10b981", "#ec4899"]

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 50,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 16,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1
      })
    }

    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > 2500) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.25 // Gravity
        p.rotation += p.rSpeed
        p.opacity = Math.max(0, 1 - elapsed / 2500)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  // ----------------------------------------------------
  // MINIMAX AI ALGORITHM & HEURISTICS
  // ----------------------------------------------------
  const evaluateBoardHeuristic = useCallback(
    (b: CellValue[], bSize: BoardSize, varType: GameVariant): number => {
      const { winner: win } = checkWinnerOnBoard(b, bSize, varType)
      if (win === "O") return 100
      if (win === "X") return -100
      if (win === "tie") return 0

      // Heuristic evaluation for open threats
      const lines = generateWinningLines(bSize)
      let score = 0

      for (const line of lines) {
        let oCount = 0
        let xCount = 0
        for (const idx of line) {
          if (b[idx] === "O") oCount++
          else if (b[idx] === "X") xCount++
        }

        if (oCount > 0 && xCount === 0) {
          score += Math.pow(10, oCount)
        } else if (xCount > 0 && oCount === 0) {
          score -= Math.pow(10, xCount)
        }
      }

      return score
    },
    []
  )

  const minimax = useCallback(
    (
      currentBoard: CellValue[],
      depth: number,
      maxDepth: number,
      isMaximizing: boolean,
      alpha: number,
      beta: number,
      bSize: BoardSize,
      varType: GameVariant
    ): number => {
      const { winner: win } = checkWinnerOnBoard(currentBoard, bSize, varType)

      if (win === "O") return 100 - depth
      if (win === "X") return depth - 100
      if (win === "tie") return 0
      if (depth >= maxDepth) return evaluateBoardHeuristic(currentBoard, bSize, varType)

      const n = getBoardDimension(bSize)
      const availableMoves: number[] = []
      for (let i = 0; i < n * n; i++) {
        if (currentBoard[i] === null) availableMoves.push(i)
      }

      if (isMaximizing) {
        let maxEval = -Infinity
        for (const move of availableMoves) {
          currentBoard[move] = "O"
          const evalScore = minimax(
            currentBoard,
            depth + 1,
            maxDepth,
            false,
            alpha,
            beta,
            bSize,
            varType
          )
          currentBoard[move] = null
          maxEval = Math.max(maxEval, evalScore)
          alpha = Math.max(alpha, evalScore)
          if (beta <= alpha) break
        }
        return maxEval
      } else {
        let minEval = Infinity
        for (const move of availableMoves) {
          currentBoard[move] = "X"
          const evalScore = minimax(
            currentBoard,
            depth + 1,
            maxDepth,
            true,
            alpha,
            beta,
            bSize,
            varType
          )
          currentBoard[move] = null
          minEval = Math.min(minEval, evalScore)
          beta = Math.min(beta, evalScore)
          if (beta <= alpha) break
        }
        return minEval
      }
    },
    [evaluateBoardHeuristic]
  )

  const calculateBestAIMove = useCallback(
    (
      currentBoard: CellValue[],
      aiPlayer: PlayerSymbol,
      diff: AIDifficulty,
      bSize: BoardSize,
      varType: GameVariant,
      currHistory: MoveHistoryRecord[]
    ): { bestMove: number; reason: string } => {
      const n = getBoardDimension(bSize)
      const totalCells = n * n
      const availableIndices: number[] = []

      for (let i = 0; i < totalCells; i++) {
        if (currentBoard[i] === null) availableIndices.push(i)
      }

      if (availableIndices.length === 0) return { bestMove: -1, reason: "No available moves" }

      const opponent = aiPlayer === "O" ? "X" : "O"

      // Easy Difficulty: 75% random, 25% smart
      if (diff === "easy" && Math.random() < 0.75) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
        return { bestMove: randomIndex, reason: "Exploring random strategy" }
      }

      // Check instant win move
      for (const idx of availableIndices) {
        const tempBoard = [...currentBoard]

        // Handle Quantum Vanishing rule for AI test move
        if (varType === "quantum") {
          const playerMoves = currHistory.filter((h) => h.player === aiPlayer)
          if (playerMoves.length >= maxQuantumMarks) {
            tempBoard[playerMoves[playerMoves.length - maxQuantumMarks].index] = null
          }
        }

        tempBoard[idx] = aiPlayer
        const { winner: win } = checkWinnerOnBoard(tempBoard, bSize, varType)
        if (win === aiPlayer) {
          return { bestMove: idx, reason: "Securing winning alignment!" }
        }
      }

      // Check instant block move
      for (const idx of availableIndices) {
        const tempBoard = [...currentBoard]

        if (varType === "quantum") {
          const opponentMoves = currHistory.filter((h) => h.player === opponent)
          if (opponentMoves.length >= maxQuantumMarks) {
            tempBoard[opponentMoves[opponentMoves.length - maxQuantumMarks].index] = null
          }
        }

        tempBoard[idx] = opponent
        const { winner: win } = checkWinnerOnBoard(tempBoard, bSize, varType)
        if (win === opponent || (varType === "misere" && win === aiPlayer)) {
          return { bestMove: idx, reason: "Blocking opponent's winning threat!" }
        }
      }

      // Medium Difficulty: 50% chance of random choice after checking wins/blocks
      if (diff === "medium" && Math.random() < 0.5) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
        return { bestMove: randomIndex, reason: "Taking tactical position" }
      }

      // Depth limit for Minimax optimization
      let maxDepth = 9
      if (bSize === "4x4") maxDepth = 4
      if (bSize === "5x5") maxDepth = 3
      if (diff === "hard") maxDepth = Math.min(maxDepth, 3)

      let bestScore = aiPlayer === "O" ? -Infinity : Infinity
      let bestMove = availableIndices[0]

      for (const idx of availableIndices) {
        const tempBoard = [...currentBoard]

        if (varType === "quantum") {
          const playerMoves = currHistory.filter((h) => h.player === aiPlayer)
          if (playerMoves.length >= maxQuantumMarks) {
            tempBoard[playerMoves[playerMoves.length - maxQuantumMarks].index] = null
          }
        }

        tempBoard[idx] = aiPlayer
        const score = minimax(
          tempBoard,
          0,
          maxDepth,
          aiPlayer === "X",
          -Infinity,
          Infinity,
          bSize,
          varType
        )

        if (aiPlayer === "O" && score > bestScore) {
          bestScore = score
          bestMove = idx
        } else if (aiPlayer === "X" && score < bestScore) {
          bestScore = score
          bestMove = idx
        }
      }

      return { bestMove, reason: "Executing optimal strategic calculation" }
    },
    [minimax]
  )

  // ----------------------------------------------------
  // GAME ACTIONS & FLOW
  // ----------------------------------------------------
  const startNewGame = useCallback(() => {
    sounds.playClick(isMuted)
    const n = getBoardDimension(boardSize)
    const emptyBoard = Array(n * n).fill(null)

    setBoard(emptyBoard)
    setCurrentPlayer("X")
    setWinner(null)
    setWinningLine(null)
    setHistory([])
    setHintIndex(null)
    setHintReason(null)
    setIsThinking(false)
    setIsReplaying(false)
    setReplayStep(-1)
    setGameState("playing")

    if (timerDuration > 0) {
      setTimeLeft(timerDuration)
    }
  }, [boardSize, timerDuration, isMuted])

  const handleGameOver = useCallback(
    (winRes: PlayerSymbol | "tie", line: number[] | null) => {
      setWinner(winRes)
      setWinningLine(line)
      setGameState("gameOver")
      updateStats(winRes)

      if (winRes === "tie") {
        sounds.playDrawSound(isMuted)
      } else if (mode === "vs-ai") {
        if (winRes === humanPlayer) {
          sounds.playWinSound(isMuted)
          triggerConfetti()
        } else {
          sounds.playLoseSound(isMuted)
        }
      } else {
        sounds.playWinSound(isMuted)
        triggerConfetti()
      }
    },
    [updateStats, mode, humanPlayer, isMuted, triggerConfetti]
  )

  const makeMove = useCallback(
    (index: number) => {
      if (gameState !== "playing" || board[index] !== null || winner !== null || isThinking) return

      sounds.playClick(isMuted)
      if (currentPlayer === "X") sounds.playXSound(isMuted)
      else sounds.playOSound(isMuted)

      const nextBoard = [...board]

      // Handle Quantum Vanishing mode
      if (variant === "quantum") {
        const playerMoves = history.filter((h) => h.player === currentPlayer)
        if (playerMoves.length >= maxQuantumMarks) {
          const oldestIndex = playerMoves[playerMoves.length - maxQuantumMarks].index
          nextBoard[oldestIndex] = null
        }
      }

      nextBoard[index] = currentPlayer
      const newHistoryItem: MoveHistoryRecord = {
        player: currentPlayer,
        index,
        boardState: [...nextBoard],
        timestamp: Date.now()
      }

      const updatedHistory = [...history, newHistoryItem]
      setBoard(nextBoard)
      setHistory(updatedHistory)
      setHintIndex(null)
      setHintReason(null)

      // Reset turn timer
      if (timerDuration > 0) setTimeLeft(timerDuration)

      // Check win condition
      const { winner: winRes, line } = checkWinnerOnBoard(nextBoard, boardSize, variant)
      if (winRes) {
        handleGameOver(winRes, line)
        return
      }

      const nextPlayer: PlayerSymbol = currentPlayer === "X" ? "O" : "X"
      setCurrentPlayer(nextPlayer)
    },
    [
      gameState,
      board,
      winner,
      isThinking,
      isMuted,
      currentPlayer,
      variant,
      history,
      timerDuration,
      boardSize,
      handleGameOver
    ]
  )

  // AI Turn Execution Effect
  useEffect(() => {
    if (gameState !== "playing" || winner !== null || isThinking) return

    const isAITurn =
      (mode === "vs-ai" && currentPlayer !== humanPlayer) || mode === "ai-vs-ai"

    if (!isAITurn) return

    setIsThinking(true)
    const delay = mode === "ai-vs-ai" ? spectatorSpeed : 450

    const timer = setTimeout(() => {
      const { bestMove } = calculateBestAIMove(
        board,
        currentPlayer,
        difficulty,
        boardSize,
        variant,
        history
      )

      if (bestMove !== -1) {
        makeMove(bestMove)
      }
      setIsThinking(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [
    gameState,
    currentPlayer,
    humanPlayer,
    mode,
    winner,
    isThinking,
    board,
    difficulty,
    boardSize,
    variant,
    history,
    spectatorSpeed,
    calculateBestAIMove,
    makeMove
  ])

  // Turn Timer Effect
  useEffect(() => {
    if (gameState !== "playing" || timerDuration === 0 || winner !== null || isThinking) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired! Switch turn automatically or forfeit move randomly
          const available: number[] = []
          board.forEach((cell, idx) => {
            if (cell === null) available.push(idx)
          })
          if (available.length > 0) {
            const randomPick = available[Math.floor(Math.random() * available.length)]
            makeMove(randomPick)
          }
          return timerDuration
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState, timerDuration, winner, isThinking, board, makeMove])

  // Strategic Hint Generator
  const generateHint = useCallback(() => {
    if (gameState !== "playing" || winner !== null || isThinking) return
    sounds.playHintSound(isMuted)

    const { bestMove, reason } = calculateBestAIMove(
      board,
      currentPlayer,
      "unbeatable",
      boardSize,
      variant,
      history
    )

    if (bestMove !== -1) {
      setHintIndex(bestMove)
      setHintReason(reason)
    }
  }, [
    gameState,
    winner,
    isThinking,
    isMuted,
    board,
    currentPlayer,
    boardSize,
    variant,
    history,
    calculateBestAIMove
  ])

  // Undo Move (VS Player or VS AI)
  const undoLastMove = useCallback(() => {
    if (history.length === 0 || winner !== null || isThinking) return
    sounds.playUndoSound(isMuted)

    let stepsToUndo = 1
    if (mode === "vs-ai" && history.length >= 2) {
      stepsToUndo = 2
    }

    const newHistory = history.slice(0, history.length - stepsToUndo)
    setHistory(newHistory)

    const n = getBoardDimension(boardSize)
    if (newHistory.length === 0) {
      setBoard(Array(n * n).fill(null))
      setCurrentPlayer("X")
    } else {
      const lastState = newHistory[newHistory.length - 1]
      setBoard([...lastState.boardState])
      setCurrentPlayer(lastState.player === "X" ? "O" : "X")
    }

    setHintIndex(null)
    setHintReason(null)
  }, [history, winner, isThinking, isMuted, mode, boardSize])

  // Replay Navigation Controls
  const startReplay = useCallback(() => {
    if (history.length === 0) return
    setIsReplaying(true)
    setReplayStep(history.length - 1)
  }, [history])

  const stepReplay = useCallback(
    (direction: "prev" | "next") => {
      if (!isReplaying || history.length === 0) return
      sounds.playClick(isMuted)

      let target = direction === "prev" ? replayStep - 1 : replayStep + 1
      target = Math.max(0, Math.min(history.length - 1, target))

      setReplayStep(target)
      setBoard([...history[target].boardState])
    },
    [isReplaying, history, replayStep, isMuted]
  )

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing") {
        if (e.key === "u" || e.key === "U") undoLastMove()
        if (e.key === "h" || e.key === "H") generateHint()
        if (e.key === "r" || e.key === "R") startNewGame()
      } else if (gameState === "gameOver") {
        if (e.key === "Enter" || e.key === " ") startNewGame()
        if (e.key === "Escape") setGameState("menu")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, undoLastMove, generateHint, startNewGame])

  // ----------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------
  const renderCellContent = (value: CellValue, index: number) => {
    if (!value) {
      if (hintIndex === index) {
        return (
          <div className="w-full h-full flex items-center justify-center animate-pulse text-amber-400 opacity-80">
            <Sparkles className="w-6 h-6" />
          </div>
        )
      }
      return null
    }

    const isX = value === "X"
    const symbolStr = isX ? activeSymbolTheme.xSymbol : activeSymbolTheme.oSymbol
    const colorClass = isX ? activeSymbolTheme.xColor : activeSymbolTheme.oColor
    const glowClass = isX ? activeSymbolTheme.xGlow : activeSymbolTheme.oGlow
    const isWinningCell = winningLine?.includes(index)

    // Quantum vanishing preview
    let isVanishingNext = false
    if (variant === "quantum" && history.length >= maxQuantumMarks * 2) {
      const activePlayerMoves = history.filter((h) => h.player === value)
      if (
        activePlayerMoves.length >= maxQuantumMarks &&
        activePlayerMoves[activePlayerMoves.length - maxQuantumMarks].index === index
      ) {
        isVanishingNext = true
      }
    }

    return (
      <div
        className={`w-full h-full flex items-center justify-center text-3xl md:text-5xl font-extrabold select-none transition-all duration-300 transform scale-100 animate-in zoom-in-50 ${colorClass} ${
          isWinningCell ? `scale-110 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]` : ""
        } ${isVanishingNext ? "opacity-35 animate-pulse" : ""}`}
      >
        <span className={`drop-shadow-lg ${glowClass}`}>{symbolStr}</span>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${activeVisualTheme.bg} text-slate-100 flex flex-col items-center justify-between p-4 md:p-6 transition-colors duration-500 font-sans relative overflow-hidden`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Canvas Confetti */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* TOP BAR NAVIGATION */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 gap-2 mb-2">
        <Button
          onClick={onBack ? onBack : () => setGameState("menu")}
          variant="outline"
          className="bg-slate-900/60 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white backdrop-blur-md text-xs md:text-sm px-3 py-1.5 h-auto flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-cyan-400" />
            <span>TIC TAC TOE</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="outline"
            size="icon"
            className="bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-md w-9 h-9"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </Button>

          <Button
            onClick={() => setShowStatsModal(true)}
            variant="outline"
            size="icon"
            className="bg-slate-900/60 border-slate-700/80 text-amber-400 hover:bg-slate-800 hover:text-amber-300 backdrop-blur-md w-9 h-9"
            title="Statistics"
          >
            <Trophy className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => setShowSettingsModal(true)}
            variant="outline"
            size="icon"
            className="bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-md w-9 h-9"
            title="Settings & Themes"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => setShowHelpModal(true)}
            variant="outline"
            size="icon"
            className="bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-md w-9 h-9"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center z-10 my-2">
        {gameState === "menu" ? (
          /* MAIN MENU SCREEN */
          <Card className={`w-full max-w-xl p-6 md:p-8 backdrop-blur-xl ${activeVisualTheme.cardBg} shadow-2xl border flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300`}>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 mb-2">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Choose Game Mode
              </h2>
              <p className="text-sm text-slate-400">
                Experience Classic Tic Tac Toe reimagined with AI, Quantum Rules & Custom Grids
              </p>
            </div>

            {/* Game Options Selectors */}
            <div className="space-y-4">
              {/* Versus Mode Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Select Game Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMode("vs-ai")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                      mode === "vs-ai"
                        ? "bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Bot className="w-5 h-5 text-cyan-400" />
                    <span>VS Computer</span>
                  </button>

                  <button
                    onClick={() => setMode("vs-player")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                      mode === "vs-player"
                        ? "bg-purple-500/20 border-purple-400 text-white shadow-lg shadow-purple-500/20"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <User className="w-5 h-5 text-purple-400" />
                    <span>Pass & Play</span>
                  </button>

                  <button
                    onClick={() => setMode("ai-vs-ai")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                      mode === "ai-vs-ai"
                        ? "bg-pink-500/20 border-pink-400 text-white shadow-lg shadow-pink-500/20"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Swords className="w-5 h-5 text-pink-400" />
                    <span>AI Spectator</span>
                  </button>
                </div>
              </div>

              {/* Board Size Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Grid Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["3x3", "4x4", "5x5"] as BoardSize[]).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setBoardSize(sz)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                        boardSize === sz
                          ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {sz} {sz === "3x3" ? "(Classic)" : sz === "4x4" ? "(4 in row)" : "(5x5 Grid)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule Variant Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Rule Variant
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setVariant("classic")}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${
                      variant === "classic"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold">Classic</span>
                    <span className="text-[10px] text-slate-400">Standard lines</span>
                  </button>

                  <button
                    onClick={() => setVariant("quantum")}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${
                      variant === "quantum"
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold">Quantum</span>
                    <span className="text-[10px] text-slate-400">Oldest vanishes</span>
                  </button>

                  <button
                    onClick={() => setVariant("misere")}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${
                      variant === "misere"
                        ? "bg-rose-500/20 border-rose-400 text-rose-300"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold">Misère</span>
                    <span className="text-[10px] text-slate-400">Avoid 3-in-a-row</span>
                  </button>
                </div>
              </div>

              {/* AI Difficulty Selector (When mode is vs-ai or ai-vs-ai) */}
              {mode !== "vs-player" && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    AI Difficulty Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["easy", "medium", "hard", "unbeatable"] as AIDifficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-2 px-1 rounded-lg border text-xs font-semibold capitalize transition-all ${
                          difficulty === d
                            ? "bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400 text-white shadow-md"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Start Game Button */}
            <Button
              onClick={startNewGame}
              className="w-full py-6 text-base font-bold bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:via-indigo-400 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 mr-2 fill-white" />
              START GAME
            </Button>
          </Card>
        ) : (
          /* PLAYING / GAME OVER SCREEN */
          <div className="w-full flex flex-col items-center gap-4">
            {/* MATCH HEADER SCOREBOARD */}
            <Card className={`w-full max-w-lg p-4 backdrop-blur-xl ${activeVisualTheme.cardBg} border shadow-xl flex items-center justify-between gap-4`}>
              {/* Player X Info */}
              <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                currentPlayer === "X" && gameState === "playing"
                  ? "bg-slate-800/90 border border-cyan-400/50 shadow-md shadow-cyan-500/10 scale-105"
                  : "opacity-80"
              }`}>
                <div className="w-10 h-10 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center text-2xl font-black">
                  {activeSymbolTheme.xSymbol}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-300">
                    {mode === "vs-ai" ? (humanPlayer === "X" ? "Player (You)" : "AI Bot") : "Player X"}
                  </div>
                  <div className="text-lg font-black text-cyan-400">{stats.xWins} W</div>
                </div>
              </div>

              {/* Center Turn Status or Timer */}
              <div className="flex flex-col items-center text-center">
                {timerDuration > 0 && gameState === "playing" && (
                  <div className="relative w-10 h-10 flex items-center justify-center mb-1">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-cyan-400 transition-all duration-1000"
                        fill="transparent"
                        strokeDasharray={100}
                        strokeDashoffset={100 - (timeLeft / timerDuration) * 100}
                      />
                    </svg>
                    <span className="absolute text-xs font-extrabold">{timeLeft}</span>
                  </div>
                )}

                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {gameState === "gameOver"
                    ? "Game Over"
                    : isThinking
                    ? "AI Thinking..."
                    : `${currentPlayer}'s Turn`}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {boardSize} • {variant}
                </div>
              </div>

              {/* Player O Info */}
              <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                currentPlayer === "O" && gameState === "playing"
                  ? "bg-slate-800/90 border border-purple-400/50 shadow-md shadow-purple-500/10 scale-105"
                  : "opacity-80"
              }`}>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-300">
                    {mode === "vs-ai" ? ((humanPlayer as PlayerSymbol) === "O" ? "Player (You)" : "AI Bot") : "Player O"}
                  </div>
                  <div className="text-lg font-black text-purple-400">{stats.oWins} W</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center text-2xl font-black">
                  {activeSymbolTheme.oSymbol}
                </div>
              </div>
            </Card>

            {/* GAME BOARD GRID */}
            <div className="relative">
              <div
                className={`grid gap-2.5 md:gap-3 p-3 md:p-4 rounded-2xl bg-slate-950/90 border ${activeVisualTheme.gridBorder} shadow-2xl backdrop-blur-2xl transition-all`}
                style={{
                  gridTemplateColumns: `repeat(${boardDim}, minmax(0, 1fr))`,
                  width: boardDim === 3 ? "min(90vw, 360px)" : boardDim === 4 ? "min(90vw, 420px)" : "min(90vw, 460px)",
                  height: boardDim === 3 ? "min(90vw, 360px)" : boardDim === 4 ? "min(90vw, 420px)" : "min(90vw, 460px)"
                }}
              >
                {board.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => makeMove(idx)}
                    disabled={gameState !== "playing" || cell !== null || isThinking}
                    className={`relative rounded-xl border flex items-center justify-center transition-all duration-200 aspect-square ${
                      activeVisualTheme.cellBg
                    } ${
                      cell === null && gameState === "playing" && !isThinking
                        ? `${activeVisualTheme.cellHover} hover:scale-[0.98] cursor-pointer`
                        : "cursor-default"
                    } ${
                      winningLine?.includes(idx)
                        ? "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30"
                        : "border-slate-800/80"
                    } ${hintIndex === idx ? "border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/30" : ""}`}
                  >
                    {renderCellContent(cell, idx)}
                  </button>
                ))}
              </div>

              {/* OVERLAY BANNER FOR GAME OVER */}
              {gameState === "gameOver" && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-start overflow-y-auto p-6 text-center animate-in fade-in zoom-in-95 duration-300 z-20">
                  <div className="p-3 rounded-full bg-slate-900 border border-slate-700 mb-3 shadow-xl">
                    {winner === "tie" ? (
                      <Sparkle className="w-8 h-8 text-slate-400" />
                    ) : (
                      <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
                    )}
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black text-white mb-1">
                    {winner === "tie"
                      ? "IT'S A DRAW!"
                      : winner === humanPlayer && mode === "vs-ai"
                      ? "VICTORY IS YOURS! 🎉"
                      : winner === "X"
                      ? "PLAYER X WINS!"
                      : "PLAYER O WINS!"}
                  </h3>

                  <p className="text-xs text-slate-400 mb-5 max-w-xs">
                    {winner === "tie"
                      ? "Equally matched tactical battle!"
                      : variant === "misere"
                      ? `Forced line completion! ${winner} claimed victory!`
                      : `Conquered the ${boardSize} grid!`}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      onClick={startNewGame}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 text-xs md:text-sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Play Again
                    </Button>

                    <Button
                      onClick={startReplay}
                      variant="outline"
                      className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs md:text-sm px-4 py-2.5 rounded-xl"
                    >
                      <Eye className="w-4 h-4 mr-1.5 text-purple-400" />
                      Replay Match
                    </Button>

                    <Button
                      onClick={() => setGameState("menu")}
                      variant="outline"
                      className="bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs md:text-sm px-4 py-2.5 rounded-xl"
                    >
                      Main Menu
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* HINT REASON TOOLTIP */}
            {hintReason && gameState === "playing" && (
              <div className="w-full max-w-md my-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{hintReason}</span>
              </div>
            )}

            {/* GAME ACTION BUTTONS */}
            <div className="flex items-center gap-3 mt-1">
              {mode !== "ai-vs-ai" && (
                <Button
                  onClick={undoLastMove}
                  disabled={history.length === 0 || gameState !== "playing" || isThinking}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 text-xs gap-1.5 rounded-lg"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </Button>
              )}

              {mode !== "ai-vs-ai" && (
                <Button
                  onClick={generateHint}
                  disabled={gameState !== "playing" || isThinking}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-800 hover:text-amber-300 disabled:opacity-40 text-xs gap-1.5 rounded-lg"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Strategic Hint</span>
                </Button>
              )}

              <Button
                onClick={startNewGame}
                variant="outline"
                size="sm"
                className="bg-slate-900/60 border-slate-800 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300 text-xs gap-1.5 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* REPLAY CONTROL FOOTER (WHEN REPLAYING) */}
      {isReplaying && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md my-auto p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 z-40">
          <div className="text-xs font-bold text-slate-300">
            Step {replayStep + 1} / {history.length}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => stepReplay("prev")}
              disabled={replayStep <= 0}
              size="icon"
              variant="outline"
              className="w-8 h-8 bg-slate-800 border-slate-700 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => stepReplay("next")}
              disabled={replayStep >= history.length - 1}
              size="icon"
              variant="outline"
              className="w-8 h-8 bg-slate-800 border-slate-700 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={() => setIsReplaying(false)}
            size="sm"
            variant="ghost"
            className="text-xs text-slate-400 hover:text-white"
          >
            Close Replay
          </Button>
        </div>
      )}

      {/* STATS MODAL */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-800 text-slate-100 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-lg">
                <Trophy className="w-5 h-5" />
                <span>Match Statistics</span>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-2xl font-black text-white">{stats.played}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Played</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-2xl font-black text-cyan-400">{stats.xWins}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Player X Wins</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-2xl font-black text-purple-400">{stats.oWins}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Player O Wins</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-2xl font-black text-slate-300">{stats.ties}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Draws / Ties</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <span className="text-slate-300 font-medium">Best Win Streak:</span>
              <span className="font-extrabold text-indigo-400 text-sm">{stats.bestStreak} Games</span>
            </div>

            <Button
              onClick={() => setShowStatsModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-800 text-slate-100 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-lg">
                <Settings2 className="w-5 h-5" />
                <span>Customization & Themes</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Symbol Theme Options */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Symbol Icon Set
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SYMBOL_THEMES) as SymbolThemeKey[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSymbolThemeKey(st)
                      try {
                        localStorage.setItem("tictactoe_symbol", st)
                      } catch {}
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      symbolThemeKey === st
                        ? "bg-cyan-500/20 border-cyan-400 text-white"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span>{SYMBOL_THEMES[st].name}</span>
                    <span className="text-base">
                      {SYMBOL_THEMES[st].xSymbol} {SYMBOL_THEMES[st].oSymbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Theme Options */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Color Palette Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(VISUAL_THEMES) as VisualThemeKey[]).map((vt) => (
                  <button
                    key={vt}
                    onClick={() => {
                      setVisualThemeKey(vt)
                      try {
                        localStorage.setItem("tictactoe_visual", vt)
                      } catch {}
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      visualThemeKey === vt
                        ? "bg-purple-500/20 border-purple-400 text-white"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {VISUAL_THEMES[vt].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Turn Timer Duration */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Turn Move Timer
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 5, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setTimerDuration(sec)}
                    className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${
                      timerDuration === sec
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {sec === 0 ? "Off" : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setShowSettingsModal(false)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
            >
              Save & Apply
            </Button>
          </Card>
        </div>
      )}

      {/* HELP / INSTRUCTIONS MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-800 text-slate-100 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-lg">
                <HelpCircle className="w-5 h-5" />
                <span>How to Play</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Grid3X3 className="w-4 h-4 text-cyan-400" />
                  <span>Classic Mode</span>
                </div>
                <p>Align 3 (or 4 on larger grids) of your symbols horizontally, vertically, or diagonally before your opponent.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Quantum Vanishing Mode</span>
                </div>
                <p>Each player can only keep 3 marks on the board at once. Placing a 4th mark automatically vanishes your oldest mark!</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Misère (Not-To-Toe)</span>
                </div>
                <p>Reverse rule strategy! Forced line completion loses the game. Trick your opponent into completing a line!</p>
              </div>
            </div>

            <Button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
            >
              Got it!
            </Button>
          </Card>
        </div>
      )}

      {/* FOOTER METADATA */}
      <div className="text-center text-[11px] text-slate-500 z-10 py-1">
        Keyboard Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">U</kbd> Undo | <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">H</kbd> Hint | <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">R</kbd> Restart
      </div>
    </div>
  )
}
