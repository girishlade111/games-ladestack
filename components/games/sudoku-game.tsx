"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Pencil,
  Eraser,
  Volume2,
  VolumeX,
  Lightbulb,
  Clock,
  Sparkles,
  Zap,
  Award,
  HelpCircle,
  Pause,
  Undo2,
  Redo2,
  Trophy,
  Settings,
  CheckCircle2,
  Flame,
  Wand2,
  Eye,
  BarChart2,
  X,
  RefreshCw,
  Info,
  ShieldAlert
} from "lucide-react"

// ----------------------------------------------------
// TYPES & CONSTANTS
// ----------------------------------------------------
export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "expert" | "master"

export interface SudokuCell {
  row: number
  col: number
  value: number
  solution: number
  isGiven: boolean
  notes: number[]
  isError?: boolean
}

export type BoardGrid = SudokuCell[][]

export interface DifficultyConfig {
  name: string
  givens: number
  description: string
  color: string
  badgeText: string
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    name: "Beginner",
    givens: 45,
    description: "Great for newcomers & quick warmup games",
    color: "#10b981", // Emerald
    badgeText: "Relaxed"
  },
  easy: {
    name: "Easy",
    givens: 38,
    description: "Straightforward logic with basic elimination",
    color: "#06b6d4", // Cyan
    badgeText: "Casual"
  },
  medium: {
    name: "Medium",
    givens: 33,
    description: "Requires naked singles and standard strategies",
    color: "#3b82f6", // Blue
    badgeText: "Standard"
  },
  hard: {
    name: "Hard",
    givens: 28,
    description: "Challenging puzzles needing deeper candidate analysis",
    color: "#8b5cf6", // Violet
    badgeText: "Tricky"
  },
  expert: {
    name: "Expert",
    givens: 24,
    description: "Complex patterns like pointing pairs and hidden subsets",
    color: "#f59e0b", // Amber
    badgeText: "Expert"
  },
  master: {
    name: "Master",
    givens: 21,
    description: "Evil difficulty requiring advanced chain deductions",
    color: "#ef4444", // Red
    badgeText: "Insane"
  }
}

export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  bestTime: number | null // in seconds
  totalTime: number
  currentStreak: number
  bestStreak: number
}

type StatsMap = Record<Difficulty, GameStats>

const DEFAULT_STATS: StatsMap = {
  beginner: { gamesPlayed: 0, gamesWon: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  easy: { gamesPlayed: 0, gamesWon: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  medium: { gamesPlayed: 0, gamesWon: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  hard: { gamesPlayed: 0, gamesWon: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  expert: { gamesPlayed: 0, gamesWon: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  master: { gamesPlayed: 0, gamesWon: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 }
}

const LOCAL_STORAGE_STATS_KEY = "sudoku_game_stats_v2"
const LOCAL_STORAGE_SAVED_GAME_KEY = "sudoku_saved_game_v2"

// ----------------------------------------------------
// WEB AUDIO API SOUND SYNTHESIZER
// ----------------------------------------------------
class SoundManager {
  private ctx: AudioContext | null = null
  public enabled: boolean = true

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

  public playSelect() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.05)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  public playPlace(digit: number) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    // Pitch scales nicely with digit (1-9)
    const baseFreq = 300 + digit * 45
    osc.type = "triangle"
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.08)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.09)
  }

  public playNote() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04)

    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.04)
  }

  public playErase() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  public playError() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.setValueAtTime(120, now + 0.08)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  public playHint() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)

      gain.gain.setValueAtTime(0.08, now + idx * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(now + idx * 0.06)
      osc.stop(now + idx * 0.06 + 0.12)
    })
  }

  public playVictory() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const arpeggio = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, now + idx * 0.09)

      gain.gain.setValueAtTime(0.15, now + idx * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(now + idx * 0.09)
      osc.stop(now + idx * 0.09 + 0.25)
    })
  }
}

const sounds = new SoundManager()

// ----------------------------------------------------
// SUDOKU GENERATOR & SOLVER ALGORITHM
// ----------------------------------------------------
function createEmptyGrid(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}

function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false
    if (grid[i][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === num) return false
    }
  }
  return true
}

function solveGrid(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        // Shuffle numbers for random puzzle generation
        for (let i = nums.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[nums[i], nums[j]] = [nums[j], nums[i]]
        }
        for (const num of nums) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num
            if (solveGrid(grid)) return true
            grid[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function generateCompleteSudoku(): number[][] {
  const grid = createEmptyGrid()
  solveGrid(grid)
  return grid
}

function countSolutions(grid: number[][], limit = 2): number {
  let count = 0

  function solve(g: number[][]): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(g, r, c, num)) {
              g[r][c] = num
              solve(g)
              g[r][c] = 0
              if (count >= limit) return true
            }
          }
          return false
        }
      }
    }
    count++
    return count >= limit
  }

  solve(grid.map((row) => [...row]))
  return count
}

function generatePuzzle(givensCount: number): { puzzle: number[][]; solution: number[][] } {
  const solution = generateCompleteSudoku()
  const puzzle = solution.map((r) => [...r])

  const positions: [number, number][] = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c])
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }

  let removed = 0
  const targetRemove = 81 - givensCount

  for (const [r, c] of positions) {
    if (removed >= targetRemove) break
    const temp = puzzle[r][c]
    puzzle[r][c] = 0

    // Verify unique solution
    if (countSolutions(puzzle, 2) === 1) {
      removed++
    } else {
      puzzle[r][c] = temp
    }
  }

  return { puzzle, solution }
}

// Helper to compute valid candidates for a cell
function getCandidates(grid: number[][], r: number, c: number): number[] {
  if (grid[r][c] !== 0) return []
  const candidates: number[] = []
  for (let n = 1; n <= 9; n++) {
    if (isValidPlacement(grid, r, c, n)) {
      candidates.push(n)
    }
  }
  return candidates
}

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export default function SudokuGame({
  onBack,
  themeColor = "#14b8a6"
}: {
  onBack?: () => void
  themeColor?: string
}) {
  const [phase, setPhase] = useState<"menu" | "playing" | "finished" | "stats">("menu")
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [board, setBoard] = useState<BoardGrid>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  
  // Controls & Modes
  const [inputMode, setInputMode] = useState<"cell-first" | "digit-first">("cell-first")
  const [lockedDigit, setLockedDigit] = useState<number | null>(null)
  const [noteMode, setNoteMode] = useState(false)
  const [autoRemoveNotes, setAutoRemoveNotes] = useState(true)
  const [autoCheckErrors, setAutoCheckErrors] = useState(true)
  const [maxMistakes, setMaxMistakes] = useState<number | null>(3) // 3 or null (infinite)
  const [mistakes, setMistakes] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)

  // Timer & State
  const [timer, setTimer] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [stats, setStats] = useState<StatsMap>(DEFAULT_STATS)
  const [hasSavedGame, setHasSavedGame] = useState(false)

  // History stack for Undo/Redo
  const [history, setHistory] = useState<BoardGrid[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Canvas ref for victory particle effect
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Sync sound manager enabled state
  useEffect(() => {
    sounds.enabled = soundEnabled
  }, [soundEnabled])

  // Load persistent stats & saved game on mount
  useEffect(() => {
    try {
      const savedStatsStr = localStorage.getItem(LOCAL_STORAGE_STATS_KEY)
      if (savedStatsStr) {
        setStats(JSON.parse(savedStatsStr))
      }
      const savedGame = localStorage.getItem(LOCAL_STORAGE_SAVED_GAME_KEY)
      if (savedGame) {
        setHasSavedGame(true)
      }
    } catch {
      // Ignore local storage errors
    }
  }, [])

  // Save statistics
  const saveStats = (newStats: StatsMap) => {
    setStats(newStats)
    try {
      localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(newStats))
    } catch {
      // Ignore local storage write errors
    }
  }

  // Timer Effect
  useEffect(() => {
    if (phase !== "playing" || isPaused) return
    const interval = setInterval(() => {
      setTimer((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, isPaused])

  // Save current game state to localStorage periodically
  useEffect(() => {
    if (phase === "playing" && board.length > 0) {
      try {
        const payload = {
          difficulty,
          board,
          mistakes,
          timer,
          hintsUsed,
          history,
          historyIndex
        }
        localStorage.setItem(LOCAL_STORAGE_SAVED_GAME_KEY, JSON.stringify(payload))
        setHasSavedGame(true)
      } catch {
        // Ignore
      }
    } else if (phase === "finished") {
      try {
        localStorage.removeItem(LOCAL_STORAGE_SAVED_GAME_KEY)
        setHasSavedGame(false)
      } catch {
        // Ignore
      }
    }
  }, [phase, board, mistakes, timer, hintsUsed, difficulty, history, historyIndex])

  // ----------------------------------------------------
  // GAME INITIALIZATION
  // ----------------------------------------------------
  const startNewGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff)
    const { puzzle, solution } = generatePuzzle(DIFFICULTIES[diff].givens)

    const initialBoard: BoardGrid = puzzle.map((row, r) =>
      row.map((val, c) => ({
        row: r,
        col: c,
        value: val,
        solution: solution[r][c],
        isGiven: val !== 0,
        notes: [],
        isError: false
      }))
    )

    setBoard(initialBoard)
    setSelected(null)
    setMistakes(0)
    setHintsUsed(0)
    setTimer(0)
    setIsPaused(false)
    setNoteMode(false)
    setLockedDigit(null)

    // Init history
    setHistory([initialBoard])
    setHistoryIndex(0)
    setPhase("playing")

    // Update stats: gamesPlayed
    setStats((prev) => {
      const updated = {
        ...prev,
        [diff]: {
          ...prev[diff],
          gamesPlayed: prev[diff].gamesPlayed + 1
        }
      }
      saveStats(updated)
      return updated
    })
  }, [])

  const resumeSavedGame = () => {
    try {
      const savedStr = localStorage.getItem(LOCAL_STORAGE_SAVED_GAME_KEY)
      if (!savedStr) return
      const data = JSON.parse(savedStr)
      setDifficulty(data.difficulty || "easy")
      setBoard(data.board)
      setMistakes(data.mistakes || 0)
      setTimer(data.timer || 0)
      setHintsUsed(data.hintsUsed || 0)
      setHistory(data.history || [data.board])
      setHistoryIndex(data.historyIndex ?? 0)
      setSelected(null)
      setIsPaused(false)
      setPhase("playing")
    } catch {
      // Fallback if save is corrupt
      startNewGame("easy")
    }
  }

  // Record board state into undo stack
  const recordState = (newBoard: BoardGrid) => {
    const sliced = history.slice(0, historyIndex + 1)
    setHistory([...sliced, newBoard])
    setHistoryIndex(sliced.length)
    setBoard(newBoard)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      sounds.playErase()
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setBoard(history[newIndex])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      sounds.playPlace(5)
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setBoard(history[newIndex])
    }
  }

  // Check if puzzle is solved
  const checkCompletion = useCallback(
    (currentBoard: BoardGrid) => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = currentBoard[r][c]
          if (cell.value === 0 || cell.value !== cell.solution) {
            return false
          }
        }
      }
      return true
    },
    []
  )

  // Handle Win sequence
  const handleVictory = useCallback(() => {
    sounds.playVictory()
    setPhase("finished")

    // Update stats
    setStats((prev) => {
      const cur = prev[difficulty]
      const isBestTime = cur.bestTime === null || timer < cur.bestTime
      const updatedDiffStats: GameStats = {
        ...cur,
        gamesWon: cur.gamesWon + 1,
        bestTime: isBestTime ? timer : cur.bestTime,
        totalTime: cur.totalTime + timer,
        currentStreak: cur.currentStreak + 1,
        bestStreak: Math.max(cur.bestStreak, cur.currentStreak + 1)
      }
      const updatedStats = { ...prev, [difficulty]: updatedDiffStats }
      saveStats(updatedStats)
      return updatedStats
    })

    // Trigger Canvas Confetti
    setTimeout(() => {
      triggerConfetti()
    }, 100)
  }, [difficulty, timer])

  // Canvas Victory Confetti Effect
  const triggerConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      size: number
      color: string
      vx: number
      vy: number
      life: number
    }[] = []

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"]
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 16,
        life: 1.0
      })
    }

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let active = false

      particles.forEach((p) => {
        if (p.life > 0) {
          active = true
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.25 // Gravity
          p.life -= 0.012

          ctx.save()
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.fillStyle = p.color
          ctx.fillRect(p.x, p.y, p.size, p.size)
          ctx.restore()
        }
      })

      if (active) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()
  }

  // ----------------------------------------------------
  // PLAYER ACTIONS (CELL / NUMBER PLACEMENT)
  // ----------------------------------------------------
  const handleCellSelect = (r: number, c: number) => {
    sounds.playSelect()
    setSelected([r, c])

    // If in digit-first mode with a locked digit, apply digit immediately!
    if (inputMode === "digit-first" && lockedDigit !== null) {
      applyDigitToCell(r, c, lockedDigit)
    }
  }

  const applyDigitToCell = (r: number, c: number, digit: number) => {
    const targetCell = board[r][c]
    if (targetCell.isGiven) return

    // Clone board
    const newBoard = board.map((row) =>
      row.map((cell) => ({
        ...cell,
        notes: [...cell.notes]
      }))
    )

    if (noteMode) {
      // NOTE MODE
      sounds.playNote()
      const currentNotes = newBoard[r][c].notes
      if (currentNotes.includes(digit)) {
        newBoard[r][c].notes = currentNotes.filter((n) => n !== digit)
      } else {
        newBoard[r][c].notes = [...currentNotes, digit].sort()
      }
      recordState(newBoard)
    } else {
      // REGULAR DIGIT PLACEMENT
      const isCorrect = digit === targetCell.solution

      if (isCorrect) {
        sounds.playPlace(digit)
        newBoard[r][c].value = digit
        newBoard[r][c].notes = []
        newBoard[r][c].isError = false

        // Auto-remove notes from same row, column, and 3x3 block
        if (autoRemoveNotes) {
          const boxRow = Math.floor(r / 3) * 3
          const boxCol = Math.floor(c / 3) * 3

          for (let i = 0; i < 9; i++) {
            // Row & Col
            newBoard[r][i].notes = newBoard[r][i].notes.filter((n) => n !== digit)
            newBoard[i][c].notes = newBoard[i][c].notes.filter((n) => n !== digit)

            // Box
            const br = boxRow + Math.floor(i / 3)
            const bc = boxCol + (i % 3)
            newBoard[br][bc].notes = newBoard[br][bc].notes.filter((n) => n !== digit)
          }
        }

        recordState(newBoard)

        // Check Win
        if (checkCompletion(newBoard)) {
          handleVictory()
        }
      } else {
        // INCORRECT DIGIT
        sounds.playError()
        const newMistakes = mistakes + 1
        setMistakes(newMistakes)

        if (autoCheckErrors) {
          newBoard[r][c].value = digit
          newBoard[r][c].isError = true
          recordState(newBoard)
        }

        if (maxMistakes !== null && newMistakes >= maxMistakes) {
          // Game Over due to max mistakes
          // Reset streak
          setStats((prev) => {
            const updated = {
              ...prev,
              [difficulty]: {
                ...prev[difficulty],
                currentStreak: 0
              }
            }
            saveStats(updated)
            return updated
          })
        }
      }
    }
  }

  const handleNumberInput = (digit: number) => {
    if (inputMode === "digit-first") {
      if (lockedDigit === digit) {
        setLockedDigit(null) // Toggle off digit lock
      } else {
        setLockedDigit(digit)
      }
      sounds.playSelect()
      if (selected) {
        applyDigitToCell(selected[0], selected[1], digit)
      }
    } else {
      if (!selected) return
      applyDigitToCell(selected[0], selected[1], digit)
    }
  }

  const handleEraseCell = () => {
    if (!selected) return
    const [r, c] = selected
    const cell = board[r][c]
    if (cell.isGiven || (cell.value === 0 && cell.notes.length === 0)) return

    sounds.playErase()
    const newBoard = board.map((row) =>
      row.map((cellItem) => ({
        ...cellItem,
        notes: [...cellItem.notes]
      }))
    )
    newBoard[r][c].value = 0
    newBoard[r][c].notes = []
    newBoard[r][c].isError = false

    recordState(newBoard)
  }

  // Smart Hint Engine
  const handleSmartHint = () => {
    if (phase !== "playing" || isPaused) return

    // Find cells that are empty or incorrect
    const candidatesList: [number, number][] = []
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board[r][c]
        if (!cell.isGiven && (cell.value === 0 || cell.value !== cell.solution)) {
          candidatesList.push([r, c])
        }
      }
    }

    if (candidatesList.length === 0) return

    // Pick cell (prefer selected cell if valid)
    let target: [number, number]
    if (selected && candidatesList.some(([r, c]) => r === selected[0] && c === selected[1])) {
      target = selected
    } else {
      target = candidatesList[Math.floor(Math.random() * candidatesList.length)]
    }

    const [tr, tc] = target
    sounds.playHint()
    setSelected(target)
    setHintsUsed((h) => h + 1)

    const newBoard = board.map((row) =>
      row.map((cellItem) => ({
        ...cellItem,
        notes: [...cellItem.notes]
      }))
    )

    newBoard[tr][tc].value = newBoard[tr][tc].solution
    newBoard[tr][tc].notes = []
    newBoard[tr][tc].isError = false

    // Auto remove notes
    if (autoRemoveNotes) {
      const correctDigit = newBoard[tr][tc].solution
      const boxRow = Math.floor(tr / 3) * 3
      const boxCol = Math.floor(tc / 3) * 3

      for (let i = 0; i < 9; i++) {
        newBoard[tr][i].notes = newBoard[tr][i].notes.filter((n) => n !== correctDigit)
        newBoard[i][tc].notes = newBoard[i][tc].notes.filter((n) => n !== correctDigit)

        const br = boxRow + Math.floor(i / 3)
        const bc = boxCol + (i % 3)
        newBoard[br][bc].notes = newBoard[br][bc].notes.filter((n) => n !== correctDigit)
      }
    }

    recordState(newBoard)

    if (checkCompletion(newBoard)) {
      handleVictory()
    }
  }

  // Auto Pencil Marks Generator
  const handleAutoPencil = () => {
    if (phase !== "playing" || isPaused) return
    sounds.playHint()

    const rawGrid = board.map((row) => row.map((cell) => cell.value))

    const newBoard = board.map((row, r) =>
      row.map((cell, c) => {
        if (cell.value !== 0 || cell.isGiven) return { ...cell, notes: [] }
        const candidates = getCandidates(rawGrid, r, c)
        return {
          ...cell,
          notes: candidates
        }
      })
    )

    recordState(newBoard)
  }

  // ----------------------------------------------------
  // KEYBOARD NAVIGATION & SHORTCUTS
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== "playing" || isPaused) return

      // Navigation
      if (["ArrowUp", "w", "W"].includes(e.key)) {
        e.preventDefault()
        setSelected((prev) => (prev ? [Math.max(0, prev[0] - 1), prev[1]] : [0, 0]))
      } else if (["ArrowDown", "s", "S"].includes(e.key)) {
        e.preventDefault()
        setSelected((prev) => (prev ? [Math.min(8, prev[0] + 1), prev[1]] : [0, 0]))
      } else if (["ArrowLeft", "a", "A"].includes(e.key)) {
        e.preventDefault()
        setSelected((prev) => (prev ? [prev[0], Math.max(0, prev[1] - 1)] : [0, 0]))
      } else if (["ArrowRight", "d", "D"].includes(e.key)) {
        e.preventDefault()
        setSelected((prev) => (prev ? [prev[0], Math.min(8, prev[1] + 1)] : [0, 0]))
      }
      // Numbers 1-9
      else if (e.key >= "1" && e.key <= "9") {
        e.preventDefault()
        handleNumberInput(parseInt(e.key, 10))
      }
      // Erase
      else if (["Backspace", "Delete", "e", "E"].includes(e.key)) {
        e.preventDefault()
        handleEraseCell()
      }
      // Pencil mode toggle
      else if (["n", "N"].includes(e.key)) {
        e.preventDefault()
        setNoteMode((prev) => !prev)
        sounds.playNote()
      }
      // Hint
      else if (["h", "H"].includes(e.key)) {
        e.preventDefault()
        handleSmartHint()
      }
      // Undo
      else if (["u", "U"].includes(e.key)) {
        e.preventDefault()
        handleUndo()
      }
      // Redo
      else if (["r", "R"].includes(e.key)) {
        e.preventDefault()
        handleRedo()
      }
      // Pause
      else if (["p", "P", " "].includes(e.key)) {
        e.preventDefault()
        setIsPaused((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, isPaused, selected, noteMode, inputMode, lockedDigit, historyIndex, history, board])

  // ----------------------------------------------------
  // HIGHLIGHT & COUNT HELPERS
  // ----------------------------------------------------
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Count remaining instances for each number (1-9)
  const getDigitCounts = (): Record<number, number> => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.value >= 1 && cell.value <= 9 && !cell.isError) {
          counts[cell.value] = (counts[cell.value] || 0) + 1
        }
      })
    })
    return counts
  }

  const digitCounts = getDigitCounts()

  const activeSelectedValue = selected ? board[selected[0]]?.[selected[1]]?.value : 0

  const isCellRelated = (r: number, c: number) => {
    if (!selected) return false
    const [sr, sc] = selected
    if (r === sr && c === sc) return true
    const isSameRow = r === sr
    const isSameCol = c === sc
    const isSameBox = Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)
    return isSameRow || isSameCol || isSameBox
  }

  const isSameValueCell = (r: number, c: number) => {
    const cellVal = board[r][c].value
    if (inputMode === "digit-first" && lockedDigit) {
      return cellVal === lockedDigit && cellVal !== 0
    }
    if (!selected || activeSelectedValue === 0) return false
    return cellVal === activeSelectedValue
  }

  const isGameOverByMistakes = maxMistakes !== null && mistakes >= maxMistakes

  // ----------------------------------------------------
  // RENDER UI
  // ----------------------------------------------------
  return (
    <div className="relative min-h-[650px] w-full flex flex-col items-center justify-center p-2 sm:p-6 select-none transition-colors duration-300">
      {/* Victory Confetti Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ display: phase === "finished" ? "block" : "none" }}
      />

      {/* Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: themeColor }}
            >
              9
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl leading-tight">Sudoku Pro</h1>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {phase === "playing" ? DIFFICULTIES[difficulty].name : "Classic Puzzle"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-500" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setPhase("stats")}
            title="Statistics"
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------
          MENU PHASE
         ---------------------------------------------------- */}
      {phase === "menu" && (
        <Card className="w-full max-w-xl p-6 sm:p-8 backdrop-blur-md bg-card/80 border-border/60 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl transform hover:scale-105 transition-transform"
              style={{ backgroundColor: themeColor }}
            >
              <GridIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Select Difficulty</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your puzzle challenge level to start a new game
            </p>
          </div>

          {/* Saved Game Resume Option */}
          {hasSavedGame && (
            <div className="mb-6">
              <Button
                className="w-full py-6 text-base font-semibold shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl flex items-center justify-center gap-2"
                onClick={resumeSavedGame}
              >
                <Play className="w-5 h-5 fill-current" />
                Resume Saved Game
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or start new</span>
                </div>
              </div>
            </div>
          )}

          {/* Difficulty Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diffKey) => {
              const config = DIFFICULTIES[diffKey]
              const diffStats = stats[diffKey]

              return (
                <button
                  key={diffKey}
                  onClick={() => startNewGame(diffKey)}
                  className="group relative p-4 rounded-xl border border-border/60 bg-accent/20 hover:bg-accent/60 hover:border-primary/50 text-left transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base group-hover:text-primary transition-colors">
                        {config.name}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                        style={{
                          backgroundColor: `${config.color}20`,
                          color: config.color
                        }}
                      >
                        {config.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {config.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{config.givens} Clues</span>
                    {diffStats.bestTime !== null ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Best: {formatTime(diffStats.bestTime)}
                      </span>
                    ) : (
                      <span>Unplayed</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Settings Bar */}
          <div className="p-3 bg-muted/40 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Mistake Limit:</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant={maxMistakes === 3 ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setMaxMistakes(3)}
              >
                3 Mistakes
              </Button>
              <Button
                variant={maxMistakes === null ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setMaxMistakes(null)}
              >
                No Limit
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ----------------------------------------------------
          PLAYING PHASE
         ---------------------------------------------------- */}
      {phase === "playing" && (
        <div className="w-full max-w-xl flex flex-col items-center gap-3">
          {/* Top Status & Controls Bar */}
          <div className="w-full flex items-center justify-between px-2 text-sm bg-card/60 border border-border/60 rounded-xl p-2.5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 font-mono font-medium text-foreground hover:bg-accent"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{formatTime(timer)}</span>
              </Button>

              <span className="text-border">|</span>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Mistakes:</span>
                <span
                  className={`font-bold ${
                    mistakes > 0 ? "text-red-500 animate-pulse" : "text-foreground"
                  }`}
                >
                  {mistakes}{maxMistakes !== null ? `/${maxMistakes}` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Input Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => {
                  setInputMode((m) => (m === "cell-first" ? "digit-first" : "cell-first"))
                  setLockedDigit(null)
                }}
                title="Toggle Cell-First or Digit-First mode"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">Mode:</span>
                <span className="font-semibold capitalize">
                  {inputMode === "cell-first" ? "Cell" : "Digit"}
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPhase("menu")}
                title="Change Difficulty / Menu"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Sudoku Board Grid */}
          <div className="relative w-full aspect-square max-w-[460px] bg-card/90 rounded-2xl shadow-xl border-2 border-foreground/20 overflow-hidden p-1 sm:p-1.5 select-none">
            {/* Pause Shield Overlay */}
            {isPaused && (
              <div className="absolute inset-0 z-30 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Pause className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-1">Game Paused</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Take a break. Timer will resume when you continue.
                </p>
                <Button
                  className="px-6 py-2 shadow-lg"
                  style={{ backgroundColor: themeColor }}
                  onClick={() => setIsPaused(false)}
                >
                  Resume Game
                </Button>
              </div>
            )}

            {/* Game Over Overlay (Max Mistakes) */}
            {isGameOverByMistakes && (
              <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3 text-red-500">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-red-500 mb-1">Too Many Mistakes!</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  You reached the limit of {maxMistakes} mistakes.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMaxMistakes(null)}
                    size="sm"
                  >
                    Continue without limit
                  </Button>
                  <Button
                    style={{ backgroundColor: themeColor }}
                    onClick={() => startNewGame(difficulty)}
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* 9x9 Grid Rendering */}
            <div className="grid grid-cols-9 grid-rows-9 gap-[1px] bg-foreground/20 w-full h-full border border-foreground/20 rounded-lg overflow-hidden">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isSelected = selected && selected[0] === r && selected[1] === c
                  const related = isCellRelated(r, c)
                  const sameVal = isSameValueCell(r, c)

                  // 3x3 Block Boundary borders
                  const borderRight = (c + 1) % 3 === 0 && c < 8 ? "2px solid currentColor" : undefined
                  const borderBottom = (r + 1) % 3 === 0 && r < 8 ? "2px solid currentColor" : undefined

                  let bgStyle = "bg-card"
                  if (isSelected) {
                    bgStyle = "bg-primary/30 font-bold shadow-inner"
                  } else if (sameVal) {
                    bgStyle = "bg-primary/20"
                  } else if (related) {
                    bgStyle = "bg-accent/40"
                  }

                  let textColor = "text-primary"
                  if (cell.isGiven) {
                    textColor = "text-foreground font-bold"
                  } else if (cell.isError) {
                    textColor = "text-red-500 font-bold bg-red-500/10 animate-pulse"
                  }

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellSelect(r, c)}
                      style={{
                        borderRight,
                        borderBottom
                      }}
                      className={`relative flex items-center justify-center text-base sm:text-xl font-semibold transition-all duration-150 border-foreground/20 ${bgStyle} ${textColor} hover:bg-primary/10 active:scale-95 focus:outline-none`}
                    >
                      {/* Digit Display */}
                      {cell.value > 0 ? (
                        <span>{cell.value}</span>
                      ) : cell.notes.length > 0 ? (
                        /* Pencil Marks Grid (3x3) */
                        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none text-[8px] sm:text-[10px] leading-none text-muted-foreground font-medium">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <span
                              key={num}
                              className="flex items-center justify-center"
                            >
                              {cell.notes.includes(num) ? num : ""}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* Selected Indicator Outline */}
                      {isSelected && (
                        <div
                          className="absolute inset-0 border-2 rounded-sm pointer-events-none animate-in fade-in duration-100"
                          style={{ borderColor: themeColor }}
                        />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Action Helper Toolbar */}
          <div className="w-full flex items-center justify-between gap-1.5 px-1 py-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 text-xs flex flex-col items-center justify-center gap-0.5 p-1"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 text-xs flex flex-col items-center justify-center gap-0.5 p-1"
              onClick={handleEraseCell}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Erase</span>
            </Button>

            <Button
              variant={noteMode ? "default" : "outline"}
              size="sm"
              style={noteMode ? { backgroundColor: themeColor } : {}}
              className="flex-1 h-10 text-xs flex flex-col items-center justify-center gap-0.5 p-1 transition-all"
              onClick={() => {
                setNoteMode(!noteMode)
                sounds.playNote()
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Pencil {noteMode ? "ON" : "OFF"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 text-xs flex flex-col items-center justify-center gap-0.5 p-1"
              onClick={handleAutoPencil}
              title="Auto-fill candidate notes for all empty cells"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Auto Notes</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 text-xs flex flex-col items-center justify-center gap-0.5 p-1"
              onClick={handleSmartHint}
              title="Reveal correct digit for selected cell"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Hint</span>
            </Button>
          </div>

          {/* Digit Keypad (1-9) */}
          <div className="w-full grid grid-cols-9 gap-1 sm:gap-1.5 mt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const count = digitCounts[num] || 0
              const isCompleted = count >= 9
              const isLocked = inputMode === "digit-first" && lockedDigit === num

              return (
                <button
                  key={num}
                  disabled={isCompleted}
                  onClick={() => handleNumberInput(num)}
                  style={isLocked ? { backgroundColor: themeColor, color: "#ffffff" } : undefined}
                  className={`relative h-12 rounded-xl font-extrabold text-lg sm:text-xl flex flex-col items-center justify-center transition-all duration-150 border ${
                    isLocked
                      ? "shadow-lg scale-105"
                      : isCompleted
                      ? "bg-accent/30 text-muted-foreground/40 border-border/30 cursor-not-allowed"
                      : "bg-card border-border/70 text-foreground hover:bg-accent hover:border-primary/40 active:scale-95 shadow-sm"
                  }`}
                >
                  <span>{num}</span>
                  {!isCompleted && (
                    <span className="text-[9px] font-semibold opacity-70 leading-none">
                      {9 - count}
                    </span>
                  )}
                  {isCompleted && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute top-1 right-1" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          FINISHED / VICTORY PHASE
         ---------------------------------------------------- */}
      {phase === "finished" && (
        <Card className="w-full max-w-md p-6 sm:p-8 backdrop-blur-md bg-card/90 border-border/80 shadow-2xl rounded-2xl text-center animate-in fade-in zoom-in-95 duration-300">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white shadow-xl animate-bounce"
            style={{ backgroundColor: themeColor }}
          >
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            Puzzle Solved!
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-6">
            Difficulty: {DIFFICULTIES[difficulty].name}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-accent/40 rounded-xl border border-border/40">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Taken</span>
              </div>
              <span className="text-xl font-extrabold">{formatTime(timer)}</span>
            </div>

            <div className="p-3 bg-accent/40 rounded-xl border border-border/40">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Mistakes</span>
              </div>
              <span className="text-xl font-extrabold">{mistakes}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full py-6 text-base font-semibold shadow-lg text-white rounded-xl"
              style={{ backgroundColor: themeColor }}
              onClick={() => startNewGame(difficulty)}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>

            <Button
              variant="outline"
              className="w-full py-5 rounded-xl"
              onClick={() => setPhase("menu")}
            >
              Change Difficulty
            </Button>
          </div>
        </Card>
      )}

      {/* ----------------------------------------------------
          STATISTICS MODAL
         ---------------------------------------------------- */}
      {phase === "stats" && (
        <Card className="w-full max-w-lg p-6 backdrop-blur-md bg-card/90 border-border/80 shadow-2xl rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Player Statistics</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPhase("menu")}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diffKey) => {
              const config = DIFFICULTIES[diffKey]
              const s = stats[diffKey]
              const winRate = s.gamesPlayed > 0 ? Math.round((s.gamesWon / s.gamesPlayed) * 100) : 0

              return (
                <div key={diffKey} className="p-3 bg-accent/20 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: config.color }}>
                      {config.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Win Rate: {winRate}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="block text-muted-foreground text-[10px]">Played</span>
                      <span className="font-bold">{s.gamesPlayed}</span>
                    </div>

                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="block text-muted-foreground text-[10px]">Won</span>
                      <span className="font-bold">{s.gamesWon}</span>
                    </div>

                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="block text-muted-foreground text-[10px]">Best Time</span>
                      <span className="font-bold">
                        {s.bestTime !== null ? formatTime(s.bestTime) : "--:--"}
                      </span>
                    </div>

                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="block text-muted-foreground text-[10px]">Streak</span>
                      <span className="font-bold">{s.currentStreak}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setPhase("menu")}>
              Close
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  )
}
