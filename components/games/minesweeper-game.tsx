"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  RotateCcw,
  Flag,
  Bomb,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  Palette,
  Zap,
  Info,
  ShieldAlert,
  CheckCircle2,
  XCircle
} from "lucide-react"

// Types
export type Difficulty = "beginner" | "intermediate" | "expert" | "master" | "custom"
export type Theme = "cyber" | "classic" | "modern" | "neon"
export type ClickMode = "reveal" | "flag"
export type GameStatus = "ready" | "playing" | "won" | "lost"

interface Cell {
  row: number
  col: number
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
  isExploded?: boolean
  isFalseFlag?: boolean
  isHinted?: boolean
}

interface DifficultyConfig {
  name: string
  rows: number
  cols: number
  mines: number
  description: string
  badge: string
}

interface MinesweeperGameProps {
  onBack?: () => void
  themeColor?: string
}

interface GameStats {
  beginnerBest: number | null
  intermediateBest: number | null
  expertBest: number | null
  masterBest: number | null
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  bestStreak: number
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    name: "Beginner",
    rows: 9,
    cols: 9,
    mines: 10,
    description: "9 × 9 grid with 10 mines. Great for quick games!",
    badge: "Easy",
  },
  intermediate: {
    name: "Intermediate",
    rows: 16,
    cols: 16,
    mines: 40,
    description: "16 × 16 grid with 40 mines. Balanced puzzle challenge.",
    badge: "Medium",
  },
  expert: {
    name: "Expert",
    rows: 16,
    cols: 30,
    mines: 99,
    description: "16 × 30 grid with 99 mines. High density logic tactical field.",
    badge: "Hard",
  },
  master: {
    name: "Master",
    rows: 20,
    cols: 30,
    mines: 145,
    description: "20 × 30 grid with 145 mines. Ultimate test for mine clearance pros!",
    badge: "Extreme",
  },
  custom: {
    name: "Custom",
    rows: 10,
    cols: 10,
    mines: 15,
    description: "Create your own board dimensions and mine density.",
    badge: "Custom",
  },
}

// Sound generator with Web Audio API
const playSound = (type: "reveal" | "flag" | "unflag" | "chord" | "explode" | "win" | "hint" | "click", isMuted: boolean) => {
  if (isMuted || typeof window === "undefined") return
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === "reveal") {
      osc.type = "sine"
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
      osc.start(now)
      osc.stop(now + 0.05)
    } else if (type === "flag") {
      osc.type = "triangle"
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === "unflag") {
      osc.type = "triangle"
      osc.frequency.setValueAtTime(500, now)
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.08)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === "chord") {
      osc.type = "sine"
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + 0.04) // E5
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      osc.start(now)
      osc.stop(now + 0.1)
    } else if (type === "hint") {
      osc.type = "sine"
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.setValueAtTime(880, now + 0.08) // A5
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === "explode") {
      // Noise buffer explosion synth
      const bufferSize = ctx.sampleRate * 0.4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(800, now)
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.35)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.3, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      noise.start(now)
      noise.stop(now + 0.4)
    } else if (type === "win") {
      const notes = [523.25, 659.25, 783.99, 1046.5] // C E G C
      notes.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator()
        const noteGain = ctx.createGain()
        noteOsc.type = "triangle"
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08)
        noteGain.gain.setValueAtTime(0.15, now + idx * 0.08)
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2)

        noteOsc.connect(noteGain)
        noteGain.connect(ctx.destination)
        noteOsc.start(now + idx * 0.08)
        noteOsc.stop(now + idx * 0.08 + 0.2)
      })
    } else if (type === "click") {
      osc.type = "sine"
      osc.frequency.setValueAtTime(350, now)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03)
      osc.start(now)
      osc.stop(now + 0.03)
    }
  } catch (e) {
    // Ignore audio context errors
  }
}

export default function MinesweeperGame({ onBack, themeColor = "#0f172a" }: MinesweeperGameProps) {
  // Game states
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner")
  const [customRows, setCustomRows] = useState(10)
  const [customCols, setCustomCols] = useState(10)
  const [customMines, setCustomMines] = useState(15)

  const [theme, setTheme] = useState<Theme>("cyber")
  const [clickMode, setClickMode] = useState<ClickMode>("reveal")
  const [isMuted, setIsMuted] = useState(false)

  const [board, setBoard] = useState<Cell[][]>([])
  const [gameStatus, setGameStatus] = useState<GameStatus>("ready")
  const [time, setTime] = useState(0)
  const [flags, setFlags] = useState(0)

  const [faceState, setFaceState] = useState<"happy" | "worry" | "dead" | "win">("happy")

  // Modals & Panels
  const [showStartModal, setShowStartModal] = useState(true)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)

  // Stats
  const [stats, setStats] = useState<GameStats>({
    beginnerBest: null,
    intermediateBest: null,
    expertBest: null,
    masterBest: null,
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
  })

  // Hints count
  const [hintsAvailable, setHintsAvailable] = useState(3)

  // Long press tracking for mobile right-click/flagging
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  // Load saved stats and preferences
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem("minesweeper_stats")
      if (savedStats) {
        setStats(JSON.parse(savedStats))
      }
      const savedTheme = localStorage.getItem("minesweeper_theme") as Theme
      if (savedTheme && ["cyber", "classic", "modern", "neon"].includes(savedTheme)) {
        setTheme(savedTheme)
      }
      const savedMute = localStorage.getItem("minesweeper_muted")
      if (savedMute !== null) {
        setIsMuted(savedMute === "true")
      }
    } catch (e) {
      console.error("Error loading localStorage data", e)
    }
  }, [])

  // Save stats to localStorage
  const saveStats = useCallback((updatedStats: GameStats) => {
    setStats(updatedStats)
    try {
      localStorage.setItem("minesweeper_stats", JSON.stringify(updatedStats))
    } catch (e) {
      console.error("Error saving stats to localStorage", e)
    }
  }, [])

  // Current difficulty config
  const getConfig = useCallback((): { rows: number; cols: number; mines: number } => {
    if (difficulty === "custom") {
      return {
        rows: Math.min(24, Math.max(8, customRows)),
        cols: Math.min(30, Math.max(8, customCols)),
        mines: Math.min(Math.floor(customRows * customCols * 0.8), Math.max(1, customMines)),
      }
    }
    return DIFFICULTY_SETTINGS[difficulty]
  }, [difficulty, customRows, customCols, customMines])

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStatus === "playing") {
      interval = setInterval(() => {
        setTime((prevTime) => Math.min(999, prevTime + 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameStatus])

  // Initialize empty board grid
  const initializeBlankBoard = useCallback(() => {
    const { rows, cols } = getConfig()
    const blank: Cell[][] = Array(rows)
      .fill(null)
      .map((_, r) =>
        Array(cols)
          .fill(null)
          .map((_, c) => ({
            row: r,
            col: c,
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
          }))
      )
    setBoard(blank)
    setFlags(0)
    setTime(0)
    setGameStatus("ready")
    setFaceState("happy")
    setHintsAvailable(3)
  }, [getConfig])

  // Initial load blank board setup
  useEffect(() => {
    initializeBlankBoard()
  }, [initializeBlankBoard])

  // Start new game
  const handleStartGame = (selectedDifficulty?: Difficulty) => {
    const newDiff = selectedDifficulty || difficulty
    setDifficulty(newDiff)
    setShowStartModal(false)
    setShowEndModal(false)
    playSound("click", isMuted)

    // Setup board
    setTimeout(() => {
      const { rows, cols } = selectedDifficulty ? (selectedDifficulty === "custom" ? { rows: customRows, cols: customCols } : DIFFICULTY_SETTINGS[selectedDifficulty]) : getConfig()
      const blank: Cell[][] = Array(rows)
        .fill(null)
        .map((_, r) =>
          Array(cols)
            .fill(null)
            .map((_, c) => ({
              row: r,
              col: c,
              isMine: false,
              isRevealed: false,
              isFlagged: false,
              adjacentMines: 0,
            }))
        )
      setBoard(blank)
      setFlags(0)
      setTime(0)
      setGameStatus("ready")
      setFaceState("happy")
      setHintsAvailable(3)
    }, 10)
  }

  // Create populated board on FIRST CLICK (guarantees safe click and 0-neighbor opening)
  const populateBoardOnFirstClick = useCallback(
    (startRow: number, startCol: number) => {
      const { rows, cols, mines } = getConfig()
      const newBoard: Cell[][] = Array(rows)
        .fill(null)
        .map((_, r) =>
          Array(cols)
            .fill(null)
            .map((_, c) => ({
              row: r,
              col: c,
              isMine: false,
              isRevealed: false,
              isFlagged: false,
              adjacentMines: 0,
            }))
        )

      // Safe zone: initial clicked cell + surrounding 8 cells
      const isSafeZone = (r: number, c: number) => {
        return Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1
      }

      // Distribute mines avoiding safe zone
      let placedMines = 0
      const totalCells = rows * cols
      const maxAvailableMines = Math.min(mines, totalCells - 9) // keep 3x3 clear if possible

      while (placedMines < maxAvailableMines) {
        const r = Math.floor(Math.random() * rows)
        const c = Math.floor(Math.random() * cols)
        if (!newBoard[r][c].isMine && (!isSafeZone(r, c) || maxAvailableMines > totalCells - 12)) {
          if (!(r === startRow && c === startCol)) {
            newBoard[r][c].isMine = true
            placedMines++
          }
        }
      }

      // Calculate adjacent mine counts
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (newBoard[r][c].isMine) continue
          let count = 0
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr
              const nc = c + dc
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++
              }
            }
          }
          newBoard[r][c].adjacentMines = count
        }
      }

      return newBoard
    },
    [getConfig]
  )

  // Recursive zero-neighbor cell flood fill reveal
  const floodReveal = (r: number, c: number, boardState: Cell[][], rows: number, cols: number): Cell[][] => {
    const queue: [number, number][] = [[r, c]]
    const newBoard = boardState.map((row) => row.map((cell) => ({ ...cell })))

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!
      const cell = newBoard[currR][currC]

      if (cell.isRevealed || cell.isFlagged) continue
      cell.isRevealed = true

      if (cell.adjacentMines === 0 && !cell.isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr
            const nc = currC + dc
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              !newBoard[nr][nc].isRevealed &&
              !newBoard[nr][nc].isFlagged
            ) {
              queue.push([nr, nc])
            }
          }
        }
      }
    }

    return newBoard
  }

  // Check victory condition
  const checkVictory = useCallback(
    (currentBoard: Cell[][]) => {
      const { rows, cols, mines } = getConfig()
      let unrevealedNonMines = 0

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = currentBoard[r][c]
          if (!cell.isMine && !cell.isRevealed) {
            unrevealedNonMines++
          }
        }
      }

      if (unrevealedNonMines === 0) {
        // Victory!
        setGameStatus("won")
        setFaceState("win")
        playSound("win", isMuted)

        // Automatically flag all remaining mines visually
        const finalBoard = currentBoard.map((row) =>
          row.map((cell) => (cell.isMine ? { ...cell, isFlagged: true } : cell))
        )
        setBoard(finalBoard)
        setFlags(mines)

        // Update statistics
        const updatedStats: GameStats = {
          ...stats,
          gamesPlayed: stats.gamesPlayed + 1,
          gamesWon: stats.gamesWon + 1,
          currentStreak: stats.currentStreak + 1,
          bestStreak: Math.max(stats.bestStreak, stats.currentStreak + 1),
        }

        if (difficulty === "beginner") {
          updatedStats.beginnerBest =
            stats.beginnerBest === null ? time : Math.min(stats.beginnerBest, time)
        } else if (difficulty === "intermediate") {
          updatedStats.intermediateBest =
            stats.intermediateBest === null ? time : Math.min(stats.intermediateBest, time)
        } else if (difficulty === "expert") {
          updatedStats.expertBest =
            stats.expertBest === null ? time : Math.min(stats.expertBest, time)
        } else if (difficulty === "master") {
          updatedStats.masterBest =
            stats.masterBest === null ? time : Math.min(stats.masterBest, time)
        }

        saveStats(updatedStats)
        setShowEndModal(true)
      }
    },
    [getConfig, isMuted, stats, time, difficulty, saveStats]
  )

  // Handle Game Over (Mine detonated)
  const triggerGameOver = useCallback(
    (explodedRow: number, explodedCol: number, currentBoard: Cell[][]) => {
      setGameStatus("lost")
      setFaceState("dead")
      playSound("explode", isMuted)

      const revealedBoard = currentBoard.map((row, r) =>
        row.map((cell, c) => {
          if (r === explodedRow && c === explodedCol) {
            return { ...cell, isRevealed: true, isExploded: true }
          }
          if (cell.isMine && !cell.isFlagged) {
            return { ...cell, isRevealed: true }
          }
          if (!cell.isMine && cell.isFlagged) {
            return { ...cell, isFalseFlag: true }
          }
          return cell
        })
      )

      setBoard(revealedBoard)

      // Update statistics
      const updatedStats: GameStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        currentStreak: 0,
      }
      saveStats(updatedStats)
      setShowEndModal(true)
    },
    [isMuted, saveStats, stats]
  )

  // Reveal Cell Action
  const handleRevealCell = useCallback(
    (r: number, c: number) => {
      if (gameStatus === "won" || gameStatus === "lost") return

      let activeBoard = board
      const { rows, cols } = getConfig()

      // Handle first click setup
      if (gameStatus === "ready") {
        activeBoard = populateBoardOnFirstClick(r, c)
        setGameStatus("playing")
      }

      const target = activeBoard[r][c]
      if (target.isRevealed || target.isFlagged) return

      // Hit mine!
      if (target.isMine) {
        triggerGameOver(r, c, activeBoard)
        return
      }

      // Safe reveal sound
      playSound("reveal", isMuted)

      // Flood fill reveal
      const newBoard = floodReveal(r, c, activeBoard, rows, cols)
      setBoard(newBoard)

      // Check win
      checkVictory(newBoard)
    },
    [board, checkVictory, gameStatus, getConfig, isMuted, populateBoardOnFirstClick, triggerGameOver]
  )

  // Toggle Flag on Cell
  const handleToggleFlag = useCallback(
    (r: number, c: number, e?: React.MouseEvent | React.SyntheticEvent) => {
      if (e) e.preventDefault()
      if (gameStatus === "won" || gameStatus === "lost" || board[r][c].isRevealed) return

      const { mines } = getConfig()

      const newBoard = board.map((row) => row.map((item) => ({ ...item })))
      const target = newBoard[r][c]

      if (!target.isFlagged) {
        if (flags >= mines) return // Prevent flagging beyond mine count
        target.isFlagged = true
        setFlags((prev) => prev + 1)
        playSound("flag", isMuted)
      } else {
        target.isFlagged = false
        setFlags((prev) => Math.max(0, prev - 1))
        playSound("unflag", isMuted)
      }

      setBoard(newBoard)
    },
    [board, flags, gameStatus, getConfig, isMuted]
  )

  // Chording: Clicking an already revealed number cell
  const handleChord = useCallback(
    (r: number, c: number) => {
      if (gameStatus !== "playing") return
      const cell = board[r][c]
      if (!cell.isRevealed || cell.adjacentMines === 0) return

      const { rows, cols } = getConfig()
      let adjacentFlags = 0
      const unflaggedNeighbors: [number, number][] = []

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const nCell = board[nr][nc]
            if (nCell.isFlagged) {
              adjacentFlags++
            } else if (!nCell.isRevealed) {
              unflaggedNeighbors.push([nr, nc])
            }
          }
        }
      }

      // If flags match adjacent mine count, reveal all remaining unflagged neighbors!
      if (adjacentFlags === cell.adjacentMines && unflaggedNeighbors.length > 0) {
        playSound("chord", isMuted)
        let tempBoard = board.map((row) => row.map((item) => ({ ...item })))
        let hitMine = false
        let explodedPos: [number, number] | null = null

        for (const [nr, nc] of unflaggedNeighbors) {
          if (tempBoard[nr][nc].isMine) {
            hitMine = true
            explodedPos = [nr, nc]
            break
          }
          tempBoard = floodReveal(nr, nc, tempBoard, rows, cols)
        }

        if (hitMine && explodedPos) {
          triggerGameOver(explodedPos[0], explodedPos[1], tempBoard)
        } else {
          setBoard(tempBoard)
          checkVictory(tempBoard)
        }
      }
    },
    [board, checkVictory, gameStatus, getConfig, isMuted, triggerGameOver]
  )

  // Mouse Click Handler (Click mode aware)
  const handleCellClick = (r: number, c: number) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }

    const cell = board[r][c]
    if (cell.isRevealed) {
      handleChord(r, c)
      return
    }

    if (clickMode === "flag") {
      handleToggleFlag(r, c)
    } else {
      handleRevealCell(r, c)
    }
  }

  // Mouse Down for worry face effect
  const handleMouseDown = () => {
    if (gameStatus === "playing" || gameStatus === "ready") {
      setFaceState("worry")
    }
  }

  const handleMouseUp = () => {
    if (gameStatus === "playing" || gameStatus === "ready") {
      setFaceState("happy")
    }
  }

  // Touch start for long press flagging on mobile
  const handleTouchStart = (r: number, c: number) => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      handleToggleFlag(r, c)
    }, 450)
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }

  // Smart Hint Generator Logic
  const handleUseHint = () => {
    if (gameStatus !== "playing" || hintsAvailable <= 0) return

    const { rows, cols } = getConfig()
    let safeCandidate: [number, number] | null = null

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c]
        if (cell.isRevealed && cell.adjacentMines > 0) {
          let flaggedCount = 0
          const unrevealedNeighbors: [number, number][] = []
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr
              const nc = c + dc
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (board[nr][nc].isFlagged) flaggedCount++
                else if (!board[nr][nc].isRevealed) unrevealedNeighbors.push([nr, nc])
              }
            }
          }

          if (flaggedCount === cell.adjacentMines && unrevealedNeighbors.length > 0) {
            safeCandidate = unrevealedNeighbors[0]
            break
          }
        }
      }
      if (safeCandidate) break
    }

    if (!safeCandidate) {
      const candidates: [number, number][] = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!board[r][c].isRevealed && !board[r][c].isFlagged && !board[r][c].isMine) {
            candidates.push([r, c])
          }
        }
      }
      if (candidates.length > 0) {
        safeCandidate = candidates[Math.floor(Math.random() * candidates.length)]
      }
    }

    if (safeCandidate) {
      const [hr, hc] = safeCandidate
      playSound("hint", isMuted)
      setHintsAvailable((h) => h - 1)

      const newBoard = board.map((row) =>
        row.map((c) => (c.row === hr && c.col === hc ? { ...c, isHinted: true } : c))
      )
      setBoard(newBoard)

      setTimeout(() => {
        setBoard((prev) =>
          prev.map((row) =>
            row.map((c) => (c.row === hr && c.col === hc ? { ...c, isHinted: false } : c))
          )
        )
      }, 2500)
    }
  }

  // Theme Styling Map
  const getThemeClasses = () => {
    switch (theme) {
      case "classic":
        return {
          wrapper: "bg-[#c0c0c0] text-black font-sans border-4 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-xl p-4 rounded-none",
          headerBg: "bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-3 mb-4",
          boardBg: "bg-[#c0c0c0] border-4 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-2",
          ledBg: "bg-black text-red-600 font-mono text-2xl tracking-widest px-3 py-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white",
          unrevealedCell: "bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#d4d4d4] active:border-none",
          revealedCell: "bg-[#c0c0c0] border border-[#808080]",
          mineExploded: "bg-red-600 border border-[#808080]",
        }
      case "modern":
        return {
          wrapper: "bg-slate-900 text-slate-100 font-sans shadow-2xl p-6 rounded-2xl border border-slate-800",
          headerBg: "bg-slate-800/80 backdrop-blur p-4 rounded-xl mb-4 border border-slate-700/50 shadow-inner",
          boardBg: "bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-2xl",
          ledBg: "bg-slate-900 text-emerald-400 font-mono text-xl font-bold tracking-wider px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner",
          unrevealedCell: "bg-slate-700 hover:bg-slate-600 border-b-2 border-r-2 border-slate-900/50 rounded-md transition-colors shadow-sm",
          revealedCell: "bg-slate-800 border border-slate-700/60 rounded-md",
          mineExploded: "bg-rose-600 border border-rose-400 rounded-md animate-pulse",
        }
      case "neon":
        return {
          wrapper: "bg-black text-cyan-400 font-sans p-6 rounded-2xl border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.25)]",
          headerBg: "bg-cyan-950/40 p-4 rounded-xl mb-4 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
          boardBg: "bg-black p-3 rounded-xl border border-cyan-500/30",
          ledBg: "bg-black text-cyan-300 font-mono text-2xl font-black tracking-widest px-3 py-1 rounded border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
          unrevealedCell: "bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 rounded-md transition-all shadow-[0_0_5px_rgba(6,182,212,0.1)]",
          revealedCell: "bg-slate-950 border border-cyan-950 rounded-md",
          mineExploded: "bg-fuchsia-600 border border-fuchsia-300 rounded-md shadow-[0_0_15px_rgba(217,70,239,0.8)]",
        }
      case "cyber":
      default:
        return {
          wrapper: "bg-slate-900/90 text-white font-sans backdrop-blur-xl p-6 rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.15)]",
          headerBg: "bg-indigo-950/40 border border-indigo-500/20 p-4 rounded-2xl mb-4 shadow-inner",
          boardBg: "bg-slate-950/80 p-3 rounded-2xl border border-indigo-900/40 shadow-2xl",
          ledBg: "bg-slate-950 text-indigo-400 font-mono text-xl font-black tracking-widest px-3.5 py-1.5 rounded-xl border border-indigo-500/30 shadow-inner",
          unrevealedCell: "bg-slate-800/90 hover:bg-indigo-900/50 border-b-2 border-r-2 border-slate-950 rounded-lg transition-all shadow-md active:translate-y-0.5",
          revealedCell: "bg-slate-900/60 border border-slate-800/80 rounded-lg",
          mineExploded: "bg-gradient-to-r from-red-600 to-rose-600 border border-red-400 rounded-lg shadow-lg animate-pulse",
        }
    }
  }

  // Number text color mapper
  const getNumberColorClass = (num: number) => {
    switch (num) {
      case 1:
        return theme === "neon" ? "text-cyan-400 font-bold" : "text-blue-500 font-bold"
      case 2:
        return theme === "neon" ? "text-emerald-400 font-bold" : "text-emerald-600 font-bold"
      case 3:
        return theme === "neon" ? "text-rose-400 font-bold" : "text-red-500 font-bold"
      case 4:
        return theme === "neon" ? "text-purple-400 font-bold" : "text-indigo-600 font-bold"
      case 5:
        return theme === "neon" ? "text-amber-400 font-bold" : "text-amber-600 font-bold"
      case 6:
        return theme === "neon" ? "text-teal-300 font-bold" : "text-teal-600 font-bold"
      case 7:
        return theme === "neon" ? "text-fuchsia-400 font-bold" : "text-purple-700 font-bold"
      case 8:
        return theme === "neon" ? "text-pink-400 font-bold" : "text-rose-700 font-bold"
      default:
        return "text-slate-400"
    }
  }

  const styles = getThemeClasses()
  const currentConfig = getConfig()
  const remainingMines = currentConfig.mines - flags

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 select-none relative overflow-x-hidden">
      {/* Background Glow Overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl flex flex-col items-center relative z-10">
        {/* Navigation & Header Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>

          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                <Palette className="w-4 h-4 mr-1.5 text-indigo-400" />
                <span className="capitalize text-xs hidden sm:inline">{theme}</span>
              </Button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1.5 z-50 min-w-[120px]">
                {(["cyber", "classic", "modern", "neon"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t)
                      localStorage.setItem("minesweeper_theme", t)
                    }}
                    className={`text-left text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      theme === t ? "bg-indigo-600 text-white font-medium" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Mute Toggle */}
            <Button
              onClick={() => {
                const next = !isMuted
                setIsMuted(next)
                localStorage.setItem("minesweeper_muted", String(next))
              }}
              variant="outline"
              size="sm"
              className="bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </Button>

            {/* Rules Button */}
            <Button
              onClick={() => setShowRulesModal(true)}
              variant="outline"
              size="sm"
              className="bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              <Info className="w-4 h-4" />
            </Button>

            {/* High Scores & Stats */}
            <Button
              onClick={() => setShowStatsModal(true)}
              variant="outline"
              size="sm"
              className="bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-amber-400"
            >
              <Trophy className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs font-semibold">Stats</span>
            </Button>
          </div>
        </div>

        {/* Game Main Frame */}
        <div className={`w-full max-w-max transition-all ${styles.wrapper}`}>
          {/* Header Controls Bar */}
          <div className={`flex items-center justify-between gap-4 ${styles.headerBg}`}>
            {/* Mines Counter Display */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <Flag className="w-5 h-5 text-red-500" />
              </div>
              <div className={styles.ledBg}>
                {String(Math.max(-99, remainingMines)).padStart(3, "0")}
              </div>
            </div>

            {/* Interactive Face Status Button */}
            <button
              onClick={() => initializeBlankBoard()}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              title="Reset Board"
              className="w-12 h-12 flex items-center justify-center text-2xl rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600 shadow-lg active:scale-95 transition-all"
            >
              {faceState === "happy" && "😊"}
              {faceState === "worry" && "😮"}
              {faceState === "dead" && "💥"}
              {faceState === "win" && "😎"}
            </button>

            {/* Digital LED Timer Display */}
            <div className="flex items-center gap-2">
              <div className={styles.ledBg}>
                {String(time).padStart(3, "0")}
              </div>
              <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Timer className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Action Tools Bar (Difficulty, Click Mode, Hint) */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
            {/* Difficulty Selector Dropdown */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowStartModal(true)}
                variant="outline"
                size="sm"
                className="bg-slate-800/80 border-slate-700 text-xs font-semibold capitalize text-indigo-300 hover:bg-slate-700"
              >
                {DIFFICULTY_SETTINGS[difficulty].name} Grid ({currentConfig.rows}×{currentConfig.cols})
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>

              <span className="text-xs text-slate-400 hidden sm:inline">
                {currentConfig.mines} Mines
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Click Mode Switcher */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setClickMode("reveal")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    clickMode === "reveal"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Reveal
                </button>
                <button
                  onClick={() => setClickMode("flag")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    clickMode === "flag"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Flag
                </button>
              </div>

              {/* Hint Button */}
              <Button
                onClick={handleUseHint}
                disabled={gameStatus !== "playing" || hintsAvailable <= 0}
                variant="outline"
                size="sm"
                className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Hint ({hintsAvailable})
              </Button>
            </div>
          </div>

          {/* Minefield Grid Container */}
          <div className="overflow-auto max-h-[65vh] p-1 flex justify-center custom-scrollbar">
            <div
              className={`inline-block ${styles.boardBg}`}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${currentConfig.cols}, minmax(0, 1fr))`,
                gap: "2px",
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isRevealed = cell.isRevealed
                  const isFlagged = cell.isFlagged
                  const isExploded = cell.isExploded
                  const isFalseFlag = cell.isFalseFlag
                  const isHinted = cell.isHinted

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleToggleFlag(r, c, e)}
                      onTouchStart={() => handleTouchStart(r, c)}
                      onTouchEnd={handleTouchEnd}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold cursor-pointer transition-all select-none ${
                        isExploded
                          ? styles.mineExploded
                          : isRevealed
                          ? styles.revealedCell
                          : isHinted
                          ? "bg-amber-400/80 text-black border-2 border-amber-300 animate-bounce"
                          : styles.unrevealedCell
                      }`}
                    >
                      {isFlagged && !isRevealed && (
                        <Flag className="w-4 h-4 text-red-500 drop-shadow-md" />
                      )}
                      {isFalseFlag && (
                        <div className="relative flex items-center justify-center">
                          <Flag className="w-4 h-4 text-red-400 opacity-50" />
                          <XCircle className="w-4 h-4 text-rose-500 absolute" />
                        </div>
                      )}
                      {isRevealed && cell.isMine && !isExploded && (
                        <Bomb className="w-4 h-4 text-slate-200" />
                      )}
                      {isRevealed && isExploded && (
                        <Bomb className="w-4 h-4 text-white animate-spin" />
                      )}
                      {isRevealed && !cell.isMine && cell.adjacentMines > 0 && (
                        <span className={getNumberColorClass(cell.adjacentMines)}>
                          {cell.adjacentMines}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Touch instruction hint */}
          <p className="text-[11px] text-slate-400 text-center mt-3">
            💡 Left click / Tap to reveal • Right click / Long press to flag • Click revealed number to chord surrounding cells
          </p>
        </div>
      </div>

      {/* Start Game & Difficulty Selector Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-slate-100 p-6 sm:p-8 rounded-3xl shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/30">
                <Bomb className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Minesweeper</h2>
              <p className="text-slate-400 text-sm mt-1">Select a difficulty level to deploy onto the minefield.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {(["beginner", "intermediate", "expert", "master"] as Difficulty[]).map((d) => {
                const conf = DIFFICULTY_SETTINGS[d]
                const isSelected = difficulty === d
                return (
                  <button
                    key={d}
                    onClick={() => handleStartGame(d)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-base">{conf.name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-700 text-indigo-300">
                          {conf.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{conf.description}</p>
                    </div>
                    <div className="text-xs font-mono text-indigo-400">
                      {conf.rows}×{conf.cols} • {conf.mines} Mines
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom Mode Expander */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-200">Custom Grid Generator</span>
                <Button
                  size="sm"
                  onClick={() => handleStartGame("custom")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Play Custom
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rows (8-24)</label>
                  <input
                    type="number"
                    min={8}
                    max={24}
                    value={customRows}
                    onChange={(e) => setCustomRows(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cols (8-30)</label>
                  <input
                    type="number"
                    min={8}
                    max={30}
                    value={customCols}
                    onChange={(e) => setCustomCols(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Mines</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.floor(customRows * customCols * 0.8)}
                    value={customMines}
                    onChange={(e) => setCustomMines(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowStartModal(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Game Over / Win Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-800 text-slate-100 p-6 sm:p-8 rounded-3xl shadow-2xl text-center">
            {gameStatus === "won" ? (
              <>
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 animate-bounce">
                  <Trophy className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Minefield Cleared! 🎉</h2>
                <p className="text-slate-400 text-sm mb-4">Fantastic tactical mine removal!</p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Difficulty:</span>
                    <span className="font-bold text-indigo-400 capitalize">{difficulty}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Time Taken:</span>
                    <span className="font-mono font-bold text-emerald-400">{time} seconds</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Current Win Streak:</span>
                    <span className="font-bold text-amber-400">{stats.currentStreak} 🔥</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">BOOM! Mine Detonated 💥</h2>
                <p className="text-slate-400 text-sm mb-4">Better luck on the next sweep.</p>
              </>
            )}

            <div className="flex flex-col gap-2.5">
              <Button
                onClick={() => {
                  setShowEndModal(false)
                  initializeBlankBoard()
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/25"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={() => {
                  setShowEndModal(false)
                  setShowStartModal(true)
                }}
                variant="outline"
                className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl"
              >
                Change Difficulty
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stats & Leaderboard Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Mine Sweeper Statistics</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">Played</div>
                <div className="text-xl font-bold text-white">{stats.gamesPlayed}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                <div className="text-xl font-bold text-emerald-400">
                  {stats.gamesPlayed > 0
                    ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%`
                    : "0%"}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">Streak</div>
                <div className="text-xl font-bold text-amber-400">{stats.currentStreak} 🔥</div>
              </div>
            </div>

            {/* Best Times List */}
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Best Completion Times
              </h4>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Beginner</span>
                <span className="font-mono text-emerald-400">
                  {stats.beginnerBest !== null ? `${stats.beginnerBest}s` : "—"}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Intermediate</span>
                <span className="font-mono text-emerald-400">
                  {stats.intermediateBest !== null ? `${stats.intermediateBest}s` : "—"}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Expert</span>
                <span className="font-mono text-emerald-400">
                  {stats.expertBest !== null ? `${stats.expertBest}s` : "—"}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Master</span>
                <span className="font-mono text-emerald-400">
                  {stats.masterBest !== null ? `${stats.masterBest}s` : "—"}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowStatsModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Instructions & Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">How to Play Minesweeper</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-6">
              <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Goal:</strong> Uncover all safe grid cells without detonating any hidden mines!
                </span>
              </div>

              <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Numbers:</strong> A number in a revealed cell shows exactly how many mines are adjacent to it in the 8 surrounding cells.
                </span>
              </div>

              <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Flagging (🚩):</strong> Right-click or long-press to flag cells you suspect contain mines.
                </span>
              </div>

              <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Chording:</strong> Left-clicking an opened number cell whose adjacent flag count matches its number will instantly clear all surrounding unflagged cells!
                </span>
              </div>

              <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Safe First Click:</strong> Your initial click on a new board is always 100% safe and will open up a starting area.
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowRulesModal(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold"
            >
              Got it!
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
