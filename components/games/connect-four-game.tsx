"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  RotateCcw,
  User,
  Bot,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Undo2,
  Brain,
  Timer,
  Info,
  Crown,
  ChevronRight,
  ShieldAlert,
  Zap,
} from "lucide-react"

interface ConnectFourGameProps {
  onBack: () => void
  themeColor: string
}

type Player = 1 | 2 // 1: Red/Human, 2: Yellow/CPU or Player 2
type Cell = 0 | Player
type Board = Cell[][]
type GameMode = "pvp" | "cpu"
type Difficulty = "easy" | "medium" | "hard" | "master"
type ThemeKey = "arcade" | "cyber" | "sunset" | "emerald"

const ROWS = 6
const COLS = 7

interface MoveHistory {
  board: Board
  currentPlayer: Player
  lastMove: { row: number; col: number } | null
}

interface WinResult {
  winner: Player
  cells: [number, number][]
}

interface GameStats {
  pvpWins1: number
  pvpWins2: number
  cpuWins: number
  cpuLosses: number
  draws: number
  currentStreak: number
  bestStreak: number
  totalGames: number
}

const THEMES: Record<ThemeKey, { name: string; boardBg: string; boardBorder: string; p1Bg: string; p2Bg: string; p1Glow: string; p2Glow: string }> = {
  arcade: {
    name: "Classic Arcade",
    boardBg: "bg-blue-700/90 border-blue-900",
    boardBorder: "border-blue-900 shadow-blue-500/20",
    p1Bg: "bg-red-500 border-red-700",
    p2Bg: "bg-yellow-400 border-yellow-600",
    p1Glow: "shadow-[0_0_20px_rgba(239,68,68,0.8)]",
    p2Glow: "shadow-[0_0_20px_rgba(250,204,21,0.8)]",
  },
  cyber: {
    name: "Cyber Neon",
    boardBg: "bg-slate-900/90 border-cyan-500/50",
    boardBorder: "border-cyan-500/40 shadow-cyan-500/30",
    p1Bg: "bg-fuchsia-500 border-fuchsia-400",
    p2Bg: "bg-cyan-400 border-cyan-300",
    p1Glow: "shadow-[0_0_25px_rgba(217,70,239,0.9)]",
    p2Glow: "shadow-[0_0_25px_rgba(34,211,238,0.9)]",
  },
  sunset: {
    name: "Sunset Gold",
    boardBg: "bg-purple-950/90 border-amber-600/40",
    boardBorder: "border-amber-500/30 shadow-amber-500/20",
    p1Bg: "bg-rose-500 border-rose-400",
    p2Bg: "bg-amber-400 border-amber-300",
    p1Glow: "shadow-[0_0_20px_rgba(244,63,94,0.8)]",
    p2Glow: "shadow-[0_0_20px_rgba(251,191,36,0.8)]",
  },
  emerald: {
    name: "Deep Emerald",
    boardBg: "bg-emerald-950/90 border-emerald-600/40",
    boardBorder: "border-emerald-500/30 shadow-emerald-500/20",
    p1Bg: "bg-red-600 border-red-500",
    p2Bg: "bg-amber-300 border-amber-400",
    p1Glow: "shadow-[0_0_20px_rgba(220,38,38,0.8)]",
    p2Glow: "shadow-[0_0_20px_rgba(252,211,77,0.8)]",
  },
}

// Center-first column search order for faster alpha-beta pruning
const SEARCH_ORDER = [3, 2, 4, 1, 5, 0, 6]

// Positional weight matrix for Connect Four evaluation
const EVAL_MATRIX = [
  [3, 4, 5, 7, 5, 4, 3],
  [4, 6, 8, 10, 8, 6, 4],
  [5, 8, 11, 13, 11, 8, 5],
  [5, 8, 11, 13, 11, 8, 5],
  [4, 6, 8, 10, 8, 6, 4],
  [3, 4, 5, 7, 5, 4, 3],
]

export default function ConnectFourGame({ onBack, themeColor }: ConnectFourGameProps) {
  // Game Setup State
  const [gameMode, setGameMode] = useState<GameMode | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [theme, setTheme] = useState<ThemeKey>("arcade")
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Core Game State
  const [board, setBoard] = useState<Board>(() =>
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(0)),
  )
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1)
  const [gameState, setGameState] = useState<"playing" | "won" | "draw">("playing")
  const [winResult, setWinResult] = useState<WinResult | null>(null)
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null)
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [hintCol, setHintCol] = useState<number | null>(null)
  const [history, setHistory] = useState<MoveHistory[]>([])

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0) // 0 means disabled
  const [timeLeft, setTimeLeft] = useState<number>(0)

  // Modals & Extras
  const [showStats, setShowStats] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [stats, setStats] = useState<GameStats>({
    pvpWins1: 0,
    pvpWins2: 0,
    cpuWins: 0,
    cpuLosses: 0,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
  })

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Load stats from LocalStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem("connect_four_stats")
      if (savedStats) {
        setStats(JSON.parse(savedStats))
      }
      const savedSound = localStorage.getItem("connect_four_sound")
      if (savedSound !== null) {
        setSoundEnabled(JSON.parse(savedSound))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Save sound setting
  const toggleSound = () => {
    const nextSound = !soundEnabled
    setSoundEnabled(nextSound)
    try {
      localStorage.setItem("connect_four_sound", JSON.stringify(nextSound))
    } catch {}
  }

  // Audio Synthesizer functions
  const playSound = useCallback(
    (type: "drop" | "win" | "draw" | "click" | "hint", row: number = 0) => {
      if (!soundEnabled) return
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        }
        const ctx = audioCtxRef.current
        if (ctx.state === "suspended") {
          ctx.resume()
        }

        const now = ctx.currentTime

        if (type === "click") {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(440, now)
          gain.gain.setValueAtTime(0.08, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.05)
        } else if (type === "hint") {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "triangle"
          osc.frequency.setValueAtTime(587.33, now) // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.15) // A5
          gain.gain.setValueAtTime(0.1, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.2)
        } else if (type === "drop") {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          // Pitch scales higher at top row, deeper bass at bottom row (row 5)
          const baseFreq = 380 - row * 45
          osc.type = "sine"
          osc.frequency.setValueAtTime(baseFreq, now)
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.12)
          gain.gain.setValueAtTime(0.3, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.15)
        } else if (type === "win") {
          // Major chord fanfare: C4, E4, G4, C5
          const freqs = [261.63, 329.63, 392.0, 523.25]
          freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const startTime = now + idx * 0.1
            osc.type = "triangle"
            osc.frequency.setValueAtTime(freq, startTime)
            gain.gain.setValueAtTime(0.15, startTime)
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(startTime)
            osc.stop(startTime + 0.4)
          })
        } else if (type === "draw") {
          const freqs = [300, 280, 260]
          freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const startTime = now + idx * 0.12
            osc.type = "sawtooth"
            osc.frequency.setValueAtTime(freq, startTime)
            gain.gain.setValueAtTime(0.08, startTime)
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(startTime)
            osc.stop(startTime + 0.25)
          })
        }
      } catch {
        // Fallback silently if web audio fails
      }
    },
    [soundEnabled],
  )

  // Check for 4 in a row
  const checkWinner = useCallback((boardState: Board): WinResult | null => {
    const directions = [
      [0, 1], // Horizontal
      [1, 0], // Vertical
      [1, 1], // Diagonal \
      [1, -1], // Diagonal /
    ]

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const player = boardState[r][c]
        if (player === 0) continue

        for (const [dr, dc] of directions) {
          const cells: [number, number][] = [[r, c]]
          for (let step = 1; step < 4; step++) {
            const nr = r + dr * step
            const nc = c + dc * step
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && boardState[nr][nc] === player) {
              cells.push([nr, nc])
            } else {
              break
            }
          }
          if (cells.length === 4) {
            return { winner: player, cells }
          }
        }
      }
    }
    return null
  }, [])

  const isBoardFull = useCallback((boardState: Board): boolean => {
    return boardState[0].every((cell) => cell !== 0)
  }, [])

  // Helper to evaluate a 4-cell window for Minimax heuristic
  const evaluateWindow = (window: Cell[], player: Player): number => {
    const opp: Player = player === 1 ? 2 : 1
    let score = 0
    let countPlayer = 0
    let countOpp = 0
    let countEmpty = 0

    for (const cell of window) {
      if (cell === player) countPlayer++
      else if (cell === opp) countOpp++
      else countEmpty++
    }

    if (countPlayer === 4) score += 100000
    else if (countPlayer === 3 && countEmpty === 1) score += 100
    else if (countPlayer === 2 && countEmpty === 2) score += 10

    if (countOpp === 4) score -= 100000
    else if (countOpp === 3 && countEmpty === 1) score -= 90

    return score
  }

  // Heuristic evaluation of board state
  const evaluateBoard = useCallback((boardState: Board, player: Player): number => {
    let score = 0

    // Positional weights
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (boardState[r][c] === player) {
          score += EVAL_MATRIX[r][c] * 3
        } else if (boardState[r][c] !== 0) {
          score -= EVAL_MATRIX[r][c] * 3
        }
      }
    }

    // Horizontal windows
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const window = [boardState[r][c], boardState[r][c + 1], boardState[r][c + 2], boardState[r][c + 3]]
        score += evaluateWindow(window, player)
      }
    }

    // Vertical windows
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 3; r++) {
        const window = [boardState[r][c], boardState[r + 1][c], boardState[r + 2][c], boardState[r + 3][c]]
        score += evaluateWindow(window, player)
      }
    }

    // Diagonal \ windows
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const window = [boardState[r][c], boardState[r + 1][c + 1], boardState[r + 2][c + 2], boardState[r + 3][c + 3]]
        score += evaluateWindow(window, player)
      }
    }

    // Diagonal / windows
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const window = [boardState[r][c], boardState[r - 1][c + 1], boardState[r - 2][c + 2], boardState[r - 3][c + 3]]
        score += evaluateWindow(window, player)
      }
    }

    return score
  }, [])

  // Minimax with Alpha-Beta Pruning
  const minimax = useCallback(
    (
      boardState: Board,
      depth: number,
      alpha: number,
      beta: number,
      isMaximizing: boolean,
      aiPlayer: Player,
    ): { score: number; col: number | null } => {
      const win = checkWinner(boardState)
      if (win) {
        if (win.winner === aiPlayer) return { score: 1000000 + depth, col: null }
        return { score: -1000000 - depth, col: null }
      }
      if (isBoardFull(boardState) || depth === 0) {
        return { score: evaluateBoard(boardState, aiPlayer), col: null }
      }

      // Valid columns ordered by center proximity
      const validCols: number[] = []
      for (const col of SEARCH_ORDER) {
        if (boardState[0][col] === 0) validCols.push(col)
      }

      if (isMaximizing) {
        let maxEval = -Infinity
        let bestCol = validCols[0]

        for (const col of validCols) {
          // Drop piece
          let rowToDrop = -1
          for (let r = ROWS - 1; r >= 0; r--) {
            if (boardState[r][col] === 0) {
              rowToDrop = r
              break
            }
          }
          boardState[rowToDrop][col] = aiPlayer

          const evaluation = minimax(boardState, depth - 1, alpha, beta, false, aiPlayer).score

          // Undo piece
          boardState[rowToDrop][col] = 0

          if (evaluation > maxEval) {
            maxEval = evaluation
            bestCol = col
          }
          alpha = Math.max(alpha, evaluation)
          if (beta <= alpha) break
        }
        return { score: maxEval, col: bestCol }
      } else {
        let minEval = Infinity
        let bestCol = validCols[0]
        const oppPlayer: Player = aiPlayer === 1 ? 2 : 1

        for (const col of validCols) {
          let rowToDrop = -1
          for (let r = ROWS - 1; r >= 0; r--) {
            if (boardState[r][col] === 0) {
              rowToDrop = r
              break
            }
          }
          boardState[rowToDrop][col] = oppPlayer

          const evaluation = minimax(boardState, depth - 1, alpha, beta, true, aiPlayer).score

          boardState[rowToDrop][col] = 0

          if (evaluation < minEval) {
            minEval = evaluation
            bestCol = col
          }
          beta = Math.min(beta, evaluation)
          if (beta <= alpha) break
        }
        return { score: minEval, col: bestCol }
      }
    },
    [checkWinner, evaluateBoard, isBoardFull],
  )

  // AI Decision Engine with Difficulty scaling
  const getCPUMove = useCallback(
    (boardState: Board): number => {
      const validCols: number[] = []
      for (let c = 0; c < COLS; c++) {
        if (boardState[0][c] === 0) validCols.push(c)
      }
      if (validCols.length === 0) return 0

      // Easy: 75% random, 25% basic 1-step win/block
      if (difficulty === "easy") {
        if (Math.random() < 0.75) {
          return validCols[Math.floor(Math.random() * validCols.length)]
        }
      }

      // Depth mapping per difficulty
      let depth = 2
      if (difficulty === "medium") depth = 3
      if (difficulty === "hard") depth = 5
      if (difficulty === "master") depth = 6

      // Clone board for minimax search
      const tempBoard = boardState.map((row) => [...row])
      const { col } = minimax(tempBoard, depth, -Infinity, Infinity, true, 2)
      return col !== null ? col : validCols[Math.floor(Math.random() * validCols.length)]
    },
    [difficulty, minimax],
  )

  // Execute a piece drop
  const dropPiece = useCallback(
    (col: number, player: Player) => {
      let droppedRow = -1
      setBoard((prevBoard) => {
        if (prevBoard[0][col] !== 0) return prevBoard // Column full

        const newBoard = prevBoard.map((row) => [...row])
        for (let r = ROWS - 1; r >= 0; r--) {
          if (newBoard[r][col] === 0) {
            newBoard[r][col] = player
            droppedRow = r
            break
          }
        }
        return newBoard
      })

      if (droppedRow !== -1) {
        playSound("drop", droppedRow)
        setLastMove({ row: droppedRow, col })
        setHintCol(null)

        // Save history for undo
        setHistory((prev) => [
          ...prev,
          {
            board: board.map((r) => [...r]),
            currentPlayer: player,
            lastMove,
          },
        ])

        // Verify winner with new board
        const nextBoard = board.map((row) => [...row])
        nextBoard[droppedRow][col] = player

        const win = checkWinner(nextBoard)
        if (win) {
          setGameState("won")
          setWinResult(win)
          playSound("win")

          // Update statistics
          setStats((prev) => {
            let pvpWins1 = prev.pvpWins1
            let pvpWins2 = prev.pvpWins2
            let cpuWins = prev.cpuWins
            let cpuLosses = prev.cpuLosses
            let currentStreak = prev.currentStreak
            let bestStreak = prev.bestStreak

            if (gameMode === "pvp") {
              if (win.winner === 1) pvpWins1++
              else pvpWins2++
            } else {
              if (win.winner === 1) {
                cpuLosses++ // Player won against CPU
                currentStreak++
                if (currentStreak > bestStreak) bestStreak = currentStreak
              } else {
                cpuWins++ // CPU won
                currentStreak = 0
              }
            }

            const updated: GameStats = {
              ...prev,
              pvpWins1,
              pvpWins2,
              cpuWins,
              cpuLosses,
              currentStreak,
              bestStreak,
              totalGames: prev.totalGames + 1,
            }
            try {
              localStorage.setItem("connect_four_stats", JSON.stringify(updated))
            } catch {}
            return updated
          })
        } else if (isBoardFull(nextBoard)) {
          setGameState("draw")
          playSound("draw")
          setStats((prev) => {
            const updated = {
              ...prev,
              draws: prev.draws + 1,
              totalGames: prev.totalGames + 1,
            }
            try {
              localStorage.setItem("connect_four_stats", JSON.stringify(updated))
            } catch {}
            return updated
          })
        } else {
          // Switch Turn
          const nextPlayer: Player = player === 1 ? 2 : 1
          setCurrentPlayer(nextPlayer)
          if (timerSeconds > 0) {
            setTimeLeft(timerSeconds)
          }
        }
      }
    },
    [board, checkWinner, gameMode, isBoardFull, lastMove, playSound, timerSeconds],
  )

  // Handle human clicking a column
  const handleColumnClick = useCallback(
    (col: number) => {
      if (gameState !== "playing" || isThinking || board[0][col] !== 0) return
      if (gameMode === "cpu" && currentPlayer === 2) return

      dropPiece(col, currentPlayer)
    },
    [board, currentPlayer, dropPiece, gameMode, gameState, isThinking],
  )

  // CPU Automated Turn
  useEffect(() => {
    if (gameMode === "cpu" && currentPlayer === 2 && gameState === "playing") {
      setIsThinking(true)
      const thinkTime = difficulty === "master" ? 800 : difficulty === "hard" ? 600 : 400
      const timer = setTimeout(() => {
        const cpuCol = getCPUMove(board)
        dropPiece(cpuCol, 2)
        setIsThinking(false)
      }, thinkTime)

      return () => clearTimeout(timer)
    }
  }, [board, currentPlayer, difficulty, dropPiece, gameMode, gameState, getCPUMove])

  // Turn Timer Effect
  useEffect(() => {
    if (gameState !== "playing" || timerSeconds === 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer expired - auto random drop or switch turn
          const validCols: number[] = []
          for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) validCols.push(c)
          }
          if (validCols.length > 0) {
            const randomCol = validCols[Math.floor(Math.random() * validCols.length)]
            dropPiece(randomCol, currentPlayer)
          }
          return timerSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [board, currentPlayer, dropPiece, gameState, timerSeconds])

  // Hint Generator
  const handleGenerateHint = () => {
    if (gameState !== "playing" || isThinking) return
    playSound("hint")

    const tempBoard = board.map((row) => [...row])
    const { col } = minimax(tempBoard, 4, -Infinity, Infinity, true, currentPlayer)
    if (col !== null) {
      setHintCol(col)
    }
  }

  // Undo Feature
  const handleUndo = () => {
    if (history.length === 0 || gameState !== "playing" || isThinking) return
    playSound("click")

    let targetHistoryIndex = history.length - 1
    // If in CPU mode and it's human turn (1), undo 2 moves (CPU + Human)
    if (gameMode === "cpu" && currentPlayer === 1 && history.length >= 2) {
      targetHistoryIndex = history.length - 2
    }

    const previousState = history[targetHistoryIndex]
    setBoard(previousState.board)
    setCurrentPlayer(previousState.currentPlayer)
    setLastMove(previousState.lastMove)
    setHistory((prev) => prev.slice(0, targetHistoryIndex))
    setHintCol(null)
    if (timerSeconds > 0) setTimeLeft(timerSeconds)
  }

  // Reset Game
  const resetGame = () => {
    playSound("click")
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(0)),
    )
    setCurrentPlayer(1)
    setGameState("playing")
    setWinResult(null)
    setLastMove(null)
    setHoveredCol(null)
    setIsThinking(false)
    setHintCol(null)
    setHistory([])
    if (timerSeconds > 0) setTimeLeft(timerSeconds)
  }

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing" || isThinking) return
      if (gameMode === "cpu" && currentPlayer === 2) return

      if (e.key === "ArrowLeft") {
        setHoveredCol((prev) => (prev === null || prev === 0 ? COLS - 1 : prev - 1))
      } else if (e.key === "ArrowRight") {
        setHoveredCol((prev) => (prev === null || prev === COLS - 1 ? 0 : prev + 1))
      } else if (e.key === "Enter" || e.key === " ") {
        if (hoveredCol !== null && board[0][hoveredCol] === 0) {
          handleColumnClick(hoveredCol)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [board, currentPlayer, gameMode, gameState, hoveredCol, isThinking, handleColumnClick])

  // Select Game Mode / Start Screen
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
        <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
          {/* Glowing gradient backdrops */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowStats(true)}
                variant="outline"
                size="icon"
                className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-amber-400"
                title="Statistics"
              >
                <Trophy className="w-4 h-4" />
              </Button>
              <Button
                onClick={toggleSound}
                variant="outline"
                size="icon"
                className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-cyan-400"
                title="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setShowRules(true)}
                variant="outline"
                size="icon"
                className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-indigo-400"
                title="Rules & Guide"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500/20 via-cyan-500/20 to-yellow-500/20 px-4 py-1.5 rounded-full border border-slate-700/50 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Modern Arcade Edition</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent mb-2">
              CONNECT FOUR
            </h1>
            <p className="text-sm text-slate-400">Strategy, tactical traps, and four-in-a-row mastery</p>
          </div>

          {/* Difficulty & Options */}
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">AI Difficulty</label>
              <div className="grid grid-cols-4 gap-2">
                {(["easy", "medium", "hard", "master"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      playSound("click")
                      setDifficulty(d)
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs capitalize transition-all border ${
                      difficulty === d
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105"
                        : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Board Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(THEMES) as ThemeKey[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      playSound("click")
                      setTheme(t)
                    }}
                    className={`p-3 rounded-xl font-medium text-xs text-left transition-all border flex items-center justify-between ${
                      theme === t
                        ? "bg-slate-800 border-cyan-400 text-white shadow-md"
                        : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span>{THEMES[t].name}</span>
                    <div className="flex gap-1">
                      <div className={`w-3 h-3 rounded-full ${THEMES[t].p1Bg}`} />
                      <div className={`w-3 h-3 rounded-full ${THEMES[t].p2Bg}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Turn Timer</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 15, 30].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      playSound("click")
                      setTimerSeconds(sec)
                      setTimeLeft(sec)
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                      timerSeconds === sec
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20"
                        : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {sec === 0 ? "Off" : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Launcher */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => {
                  playSound("click")
                  setGameMode("cpu")
                  resetGame()
                }}
                className="w-full h-14 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-950/50 flex items-center justify-center space-x-3 transition-transform hover:scale-[1.02]"
              >
                <Bot className="w-6 h-6" />
                <span>Single Player vs AI</span>
                <ChevronRight className="w-5 h-5 ml-auto opacity-70" />
              </Button>

              <Button
                onClick={() => {
                  playSound("click")
                  setGameMode("pvp")
                  resetGame()
                }}
                variant="outline"
                className="w-full h-14 bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-lg rounded-2xl flex items-center justify-center space-x-3 transition-transform hover:scale-[1.02]"
              >
                <User className="w-6 h-6 text-cyan-400" />
                <span>2-Player Local (Pass & Play)</span>
                <ChevronRight className="w-5 h-5 ml-auto opacity-70" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Modal */}
        {showStats && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white p-6 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                  <Trophy className="w-5 h-5" /> Game Statistics
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowStats(false)} className="text-slate-400 hover:text-white">
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl text-center">
                  <div className="text-3xl font-extrabold text-cyan-400">{stats.totalGames}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase mt-1">Total Played</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl text-center">
                  <div className="text-3xl font-extrabold text-amber-400">{stats.bestStreak}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase mt-1">Best Win Streak</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.cpuLosses}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase mt-1">VS AI Wins</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.cpuWins}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase mt-1">VS AI Defeats</div>
                </div>
              </div>

              <Button onClick={() => setShowStats(false)} className="w-full bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl">
                Close
              </Button>
            </Card>
          </div>
        )}

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white p-6 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                  <Info className="w-5 h-5" /> Connect Four Guide
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">
                  ✕
                </Button>
              </div>
              <div className="space-y-3 text-sm text-slate-300 mb-6">
                <p>• <strong>Goal:</strong> Connect 4 of your colored disks in a line horizontally, vertically, or diagonally before your opponent.</p>
                <p>• <strong>Controls:</strong> Click any column or use <strong>Left/Right Arrow keys</strong> to move and <strong>Space/Enter</strong> to drop.</p>
                <p>• <strong>Hint System:</strong> Click the Hint button to trigger the Minimax engine to suggest the optimal tactical column move.</p>
                <p>• <strong>Pro Tip:</strong> Control the center column (Column 4) early in the game to build powerful double-ended traps!</p>
              </div>
              <Button onClick={() => setShowRules(false)} className="w-full bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl">
                Got It
              </Button>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Active Game View
  const currentTheme = THEMES[theme]

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-2 sm:p-6 selection:bg-cyan-500/30">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <Button
            onClick={() => {
              playSound("click")
              setGameMode(null)
            }}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Menu
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-cyan-400">
              {gameMode === "cpu" ? `VS CPU (${difficulty})` : "2-Player Local"}
            </span>
            {timerSeconds > 0 && gameState === "playing" && (
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-mono font-bold text-xs">
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleUndo}
              disabled={history.length === 0 || gameState !== "playing" || isThinking}
              variant="outline"
              size="icon"
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 rounded-xl"
              title="Undo Move"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleGenerateHint}
              disabled={gameState !== "playing" || isThinking}
              variant="outline"
              size="icon"
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-amber-400 disabled:opacity-30 rounded-xl"
              title="Get Hint"
            >
              <Brain className="w-4 h-4" />
            </Button>
            <Button
              onClick={resetGame}
              variant="outline"
              size="icon"
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl"
              title="Reset Game"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Players Indicator Header */}
        <div className="w-full grid grid-cols-2 gap-4 mb-4">
          {/* Player 1 */}
          <div
            className={`flex items-center p-3 rounded-2xl border transition-all duration-300 ${
              currentPlayer === 1 && gameState === "playing"
                ? "bg-slate-900 border-red-500/80 shadow-lg shadow-red-500/20 scale-[1.02]"
                : "bg-slate-900/40 border-slate-800/80 opacity-60"
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${currentTheme.p1Bg} shadow-md flex items-center justify-center mr-3`} />
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">Player 1</div>
              <div className="text-sm font-bold text-slate-100">{gameMode === "cpu" ? "You (Red)" : "Player 1"}</div>
            </div>
            {currentPlayer === 1 && gameState === "playing" && (
              <div className="ml-auto w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]" />
            )}
          </div>

          {/* Player 2 / CPU */}
          <div
            className={`flex items-center p-3 rounded-2xl border transition-all duration-300 ${
              currentPlayer === 2 && gameState === "playing"
                ? "bg-slate-900 border-yellow-500/80 shadow-lg shadow-yellow-500/20 scale-[1.02]"
                : "bg-slate-900/40 border-slate-800/80 opacity-60"
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${currentTheme.p2Bg} shadow-md flex items-center justify-center mr-3`} />
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">{gameMode === "cpu" ? "Opponent" : "Player 2"}</div>
              <div className="text-sm font-bold text-slate-100">{gameMode === "cpu" ? `CPU (${difficulty})` : "Player 2"}</div>
            </div>
            {currentPlayer === 2 && gameState === "playing" && (
              <div className="ml-auto flex items-center space-x-1">
                {isThinking ? (
                  <span className="text-xs text-yellow-400 font-mono animate-pulse">Thinking...</span>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,1)]" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hover / Column Preview Drop Bar */}
        <div className="w-full grid grid-cols-7 gap-2 sm:gap-3 px-3 sm:px-6 mb-2 h-10 items-center">
          {Array.from({ length: COLS }, (_, col) => {
            const isHovered = hoveredCol === col && gameState === "playing" && board[0][col] === 0 && !isThinking
            const isHinted = hintCol === col
            return (
              <div key={col} className="flex justify-center items-center h-full">
                {isHovered ? (
                  <div
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${
                      currentPlayer === 1 ? currentTheme.p1Bg : currentTheme.p2Bg
                    } animate-bounce opacity-90 shadow-md`}
                  />
                ) : isHinted ? (
                  <div className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-400/20 border-2 border-amber-400 animate-pulse">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Game Board Container */}
        <div
          className={`w-full p-3 sm:p-5 rounded-3xl border-4 ${currentTheme.boardBg} ${currentTheme.boardBorder} shadow-2xl backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: COLS }, (_, col) => (
              <div
                key={col}
                onClick={() => handleColumnClick(col)}
                onMouseEnter={() => setHoveredCol(col)}
                onMouseLeave={() => setHoveredCol(null)}
                className="flex flex-col gap-2 sm:gap-3 cursor-pointer group"
              >
                {Array.from({ length: ROWS }, (_, row) => {
                  const cellValue = board[row][col]
                  const isWinningCell = winResult?.cells.some(([r, c]) => r === row && c === col)
                  const isLastMoveCell = lastMove?.row === row && lastMove?.col === col

                  return (
                    <div
                      key={`${row}-${col}`}
                      className="w-full aspect-square rounded-full bg-slate-950/80 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] border border-slate-800/80 relative flex items-center justify-center overflow-hidden transition-transform duration-150 group-hover:bg-slate-900/60"
                    >
                      {cellValue !== 0 && (
                        <div
                          className={`w-full h-full rounded-full transition-all duration-300 ${
                            cellValue === 1 ? currentTheme.p1Bg : currentTheme.p2Bg
                          } ${
                            isWinningCell
                              ? `${cellValue === 1 ? currentTheme.p1Glow : currentTheme.p2Glow} scale-105 z-10 border-2 border-white animate-pulse`
                              : ""
                          } ${isLastMoveCell ? "ring-2 ring-white/60" : ""}`}
                          style={{
                            animation: isLastMoveCell ? "dropBounce 0.35s ease-out" : "none",
                          }}
                        >
                          {/* Inner 3D Highlight Ring */}
                          <div className="w-full h-full rounded-full bg-gradient-to-tr from-black/40 via-transparent to-white/30" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Win / Draw Overlay Banner */}
        {gameState !== "playing" && (
          <div className="w-full mt-6 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl text-center backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
            {gameState === "won" && winResult && (
              <div>
                <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 mb-3">
                  <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
                <h2 className="text-2xl font-extrabold mb-1">
                  {winResult.winner === 1 ? (
                    <span className="text-red-400">🎉 Player 1 Victory!</span>
                  ) : (
                    <span className="text-yellow-400">🎉 {gameMode === "cpu" ? "CPU Victory!" : "Player 2 Victory!"}</span>
                  )}
                </h2>
                <p className="text-sm text-slate-400 mb-5">Four in a row achieved!</p>
              </div>
            )}

            {gameState === "draw" && (
              <div>
                <div className="inline-flex p-3 rounded-full bg-slate-800 border border-slate-700 mb-3">
                  <ShieldAlert className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-200 mb-1">Grid Full — It's a Draw!</h2>
                <p className="text-sm text-slate-400 mb-5">Both players matched strategically!</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={resetGame}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold px-6 rounded-xl shadow-lg shadow-cyan-500/20"
              >
                Play Again
              </Button>
              <Button
                onClick={() => setGameMode(null)}
                variant="outline"
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
              >
                Change Mode
              </Button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes dropBounce {
          0% {
            transform: translateY(-150px) scale(0.8);
            opacity: 0.3;
          }
          70% {
            transform: translateY(8px) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
