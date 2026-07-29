"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  RotateCcw, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Flame, 
  Zap, 
  Undo2, 
  Bomb, 
  Shuffle, 
  ArrowUp, 
  Clock,
  Palette,
  CheckCircle2,
  Crown
} from "lucide-react"

interface Puzzle2048GameProps {
  onBack: () => void
  themeColor?: string
}

type Mode = "classic" | "speed" | "compact" | "master" | "obstacle"

type Theme = "cyber" | "sunset" | "emerald" | "obsidian"

interface ModeConfig {
  name: string
  gridSize: number
  target: number
  description: string
  icon: React.ReactNode
}

const MODES: Record<Mode, ModeConfig> = {
  classic: {
    name: "Classic (4x4)",
    gridSize: 4,
    target: 2048,
    description: "Standard 4x4 grid. Merge tiles to reach 2048!",
    icon: <Sparkles className="w-4 h-4 text-amber-400" />
  },
  speed: {
    name: "Speed Rush (4x4)",
    gridSize: 4,
    target: 2048,
    description: "60-second time attack! Merges add +2 bonus seconds.",
    icon: <Clock className="w-4 h-4 text-rose-400" />
  },
  compact: {
    name: "Compact (3x3)",
    gridSize: 3,
    target: 1024,
    description: "Tight 3x3 space! Fast-paced tactical challenge.",
    icon: <Zap className="w-4 h-4 text-cyan-400" />
  },
  master: {
    name: "Master (5x5)",
    gridSize: 5,
    target: 4096,
    description: "Expanded 5x5 grid. Aim for the colossal 4096 tile!",
    icon: <Crown className="w-4 h-4 text-purple-400" />
  },
  obstacle: {
    name: "Obstacle Blitz (4x4)",
    gridSize: 4,
    target: 2048,
    description: "Frozen obstacle blocks spawn and decay after 5 moves!",
    icon: <Flame className="w-4 h-4 text-orange-400" />
  }
}

interface Tile {
  id: string
  value: number
  row: number
  col: number
  isNew?: boolean
  isMerged?: boolean
  isObstacle?: boolean
  obstacleTimer?: number
}

interface FloatingText {
  id: string
  text: string
  x: number
  y: number
  color: string
}

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
}

interface GameStateSnapshot {
  board: (Tile | null)[][]
  score: number
}

export default function Puzzle2048Game({ onBack, themeColor = "#f59e0b" }: Puzzle2048GameProps) {
  // Game Setup State
  const [mode, setMode] = useState<Mode>("classic")
  const [theme, setTheme] = useState<Theme>("cyber")
  const [gridSize, setGridSize] = useState<number>(MODES.classic.gridSize)
  
  // Board & Score State
  const [board, setBoard] = useState<(Tile | null)[][]>([])
  const [score, setScore] = useState<number>(0)
  const [bestScores, setBestScores] = useState<Record<Mode, number>>({
    classic: 0,
    speed: 0,
    compact: 0,
    master: 0,
    obstacle: 0
  })
  const [moveCount, setMoveCount] = useState<number>(0)
  const [combo, setCombo] = useState<number>(0)
  
  // Status Flags
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [gameWon, setGameWon] = useState<boolean>(false)
  const [keepPlaying, setKeepPlaying] = useState<boolean>(false)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  
  // Power-Ups
  const [history, setHistory] = useState<GameStateSnapshot[]>([])
  const [hammerCharges, setHammerCharges] = useState<number>(2)
  const [isHammerActive, setIsHammerActive] = useState<boolean>(false)
  const [upgradeCharges, setUpgradeCharges] = useState<number>(1)
  const [isUpgradeActive, setIsUpgradeActive] = useState<boolean>(false)
  const [shuffleCharges, setShuffleCharges] = useState<number>(1)

  // Visual Effects State
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [particles, setParticles] = useState<Particle[]>([])

  // Touch Swipe Handlers
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Web Audio Synthesizer
  const playSound = useCallback((type: "slide" | "merge" | "combo" | "victory" | "gameover" | "powerup", tileVal: number = 2) => {
    if (isMuted) return
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioCtxRef.current = new AudioContextClass()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") {
        ctx.resume()
      }

      const now = ctx.currentTime

      if (type === "slide") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(220, now)
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08)
        gain.gain.setValueAtTime(0.1, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === "merge") {
        // Base frequency scales with log2 of tile value
        const tier = Math.log2(tileVal)
        const baseFreq = 220 * Math.pow(1.08, tier * 1.5)
        
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = "triangle"
        osc2.type = "sine"

        osc1.frequency.setValueAtTime(baseFreq, now)
        osc2.frequency.setValueAtTime(baseFreq * 1.5, now)

        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 0.25)
        osc2.stop(now + 0.25)
      } else if (type === "combo") {
        const freqs = [523.25, 659.25, 783.99, 1046.50] // C5 E5 G5 C6 chord
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, now + idx * 0.05)
          gain.gain.setValueAtTime(0.15, now + idx * 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.05)
          osc.stop(now + idx * 0.05 + 0.3)
        })
      } else if (type === "powerup") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.2)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (type === "victory") {
        const notes = [440, 554.37, 659.25, 880]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "triangle"
          osc.frequency.setValueAtTime(freq, now + i * 0.1)
          gain.gain.setValueAtTime(0.2, now + i * 0.1)
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + i * 0.1)
          osc.stop(now + i * 0.1 + 0.4)
        })
      } else if (type === "gameover") {
        const notes = [300, 260, 220, 180]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(freq, now + i * 0.12)
          gain.gain.setValueAtTime(0.15, now + i * 0.12)
          gain.gain.linearRampToValueAtTime(0.01, now + i * 0.12 + 0.3)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + i * 0.12)
          osc.stop(now + i * 0.12 + 0.3)
        })
      }
    } catch {
      // Audio playback safety catch
    }
  }, [isMuted])

  // Load Best Scores from localStorage
  useEffect(() => {
    try {
      const loaded: Record<Mode, number> = { ...bestScores }
      ;(Object.keys(MODES) as Mode[]).forEach((m) => {
        const saved = localStorage.getItem(`2048-best-${m}`)
        if (saved) {
          loaded[m] = parseInt(saved, 10)
        }
      })
      setBestScores(loaded)
    } catch {
      // localStorage safety
    }
  }, [])

  // Save Best Scores
  useEffect(() => {
    if (score > (bestScores[mode] || 0)) {
      setBestScores((prev) => ({ ...prev, [mode]: score }))
      try {
        localStorage.setItem(`2048-best-${mode}`, score.toString())
      } catch {
        // localStorage safety
      }
    }
  }, [score, mode, bestScores])

  // Trigger Particles FX
  const createParticles = useCallback((cx: number, cy: number, color: string) => {
    const newP: Particle[] = []
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 6
      newP.push({
        id: Math.random().toString(),
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 5,
        life: 1.0
      })
    }
    setParticles((prev) => [...prev, ...newP])
  }, [])

  // Particle Physics Animation Loop
  useEffect(() => {
    if (particles.length === 0) return
    const timer = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // Gravity
            life: p.life - 0.05
          }))
          .filter((p) => p.life > 0)
      )
    }, 30)
    return () => clearInterval(timer)
  }, [particles.length])

  // Spawn Floating Text Popup
  const addFloatingText = useCallback((text: string, x: number, y: number, color: string = "#f59e0b") => {
    const id = Math.random().toString()
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color }])
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id))
    }, 1000)
  }, [])

  // Initialize Board Function
  const initializeBoard = useCallback((gSize: number, currentMode: Mode): (Tile | null)[][] => {
    const emptyBoard: (Tile | null)[][] = Array(gSize)
      .fill(null)
      .map(() => Array(gSize).fill(null))

    const addRandomTileToBoard = (b: (Tile | null)[][], isObstacle: boolean = false): void => {
      const emptyCells: [number, number][] = []
      for (let r = 0; r < gSize; r++) {
        for (let c = 0; c < gSize; c++) {
          if (!b[r][c]) {
            emptyCells.push([r, c])
          }
        }
      }
      if (emptyCells.length > 0) {
        const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
        b[r][c] = {
          id: Math.random().toString(),
          value: isObstacle ? -1 : Math.random() < 0.9 ? 2 : 4,
          row: r,
          col: c,
          isNew: true,
          isObstacle,
          obstacleTimer: isObstacle ? 5 : undefined
        }
      }
    }

    addRandomTileToBoard(emptyBoard)
    addRandomTileToBoard(emptyBoard)

    if (currentMode === "obstacle") {
      addRandomTileToBoard(emptyBoard, true)
    }

    return emptyBoard
  }, [])

  // Restart / Reset Game
  const resetGame = useCallback(() => {
    const size = MODES[mode].gridSize
    setGridSize(size)
    setBoard(initializeBoard(size, mode))
    setScore(0)
    setMoveCount(0)
    setCombo(0)
    setGameOver(false)
    setGameWon(false)
    setKeepPlaying(false)
    setTimeLeft(60)
    setHistory([])
    setHammerCharges(mode === "compact" ? 3 : 2)
    setUpgradeCharges(1)
    setShuffleCharges(1)
    setIsHammerActive(false)
    setIsUpgradeActive(false)
  }, [mode, initializeBoard])

  // Initial Game Load & Mode Change Reset
  useEffect(() => {
    resetGame()
  }, [resetGame])

  // Timer Effect for Speed Rush Mode
  useEffect(() => {
    if (mode !== "speed" || gameOver || (gameWon && !keepPlaying)) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true)
          playSound("gameover")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [mode, gameOver, gameWon, keepPlaying, playSound])

  // Check Game Over Condition
  const checkCanMove = (b: (Tile | null)[][], size: number): boolean => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!b[r][c]) return true
        const current = b[r][c]
        if (current && !current.isObstacle) {
          // Check right neighbor
          if (c + 1 < size) {
            const right = b[r][c + 1]
            if (right && !right.isObstacle && right.value === current.value) return true
          }
          // Check down neighbor
          if (r + 1 < size) {
            const down = b[r + 1][c]
            if (down && !down.isObstacle && down.value === current.value) return true
          }
        }
      }
    }
    return false
  }

  // Core Slide & Merge Move Logic
  const handleMove = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (gameOver || (gameWon && !keepPlaying) || isHammerActive || isUpgradeActive) return

    setBoard((prevBoard) => {
      const size = gridSize
      let moved = false
      let scoreGained = 0
      let maxMergedVal = 0
      let mergeCount = 0

      // Deep copy board matrix
      const newBoard: (Tile | null)[][] = prevBoard.map((row) =>
        row.map((cell) => (cell ? { ...cell, isNew: false, isMerged: false } : null))
      )

      // Save History snapshot for Undo
      const snapshot: GameStateSnapshot = {
        board: prevBoard.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
        score
      }

      // Helper function to slide line
      const slideLine = (line: (Tile | null)[]): { newLine: (Tile | null)[]; lineMoved: boolean } => {
        let lineMoved = false
        const filtered = line.filter((t) => t !== null) as Tile[]
        const newLine: (Tile | null)[] = Array(size).fill(null)
        let targetIdx = 0

        for (let i = 0; i < filtered.length; i++) {
          const current = filtered[i]

          // If current is an obstacle block, place it at current index directly without merging
          if (current.isObstacle) {
            while (targetIdx < size && newLine[targetIdx] !== null) {
              targetIdx++
            }
            newLine[targetIdx] = current
            if (targetIdx !== line.indexOf(current)) lineMoved = true
            targetIdx++
            continue
          }

          // Check for merge with next tile in filtered line
          if (
            i + 1 < filtered.length &&
            !filtered[i + 1].isObstacle &&
            filtered[i + 1].value === current.value
          ) {
            const mergedVal = current.value * 2
            scoreGained += mergedVal
            mergeCount++
            if (mergedVal > maxMergedVal) maxMergedVal = mergedVal

            newLine[targetIdx] = {
              id: Math.random().toString(),
              value: mergedVal,
              row: 0,
              col: 0,
              isMerged: true
            }
            lineMoved = true
            i++ // Skip merged tile
          } else {
            newLine[targetIdx] = { ...current }
            if (targetIdx !== line.indexOf(current)) lineMoved = true
          }
          targetIdx++
        }

        // Return sliced line
        return { newLine, lineMoved }
      }

      // Process directional line extractions
      if (direction === "left") {
        for (let r = 0; r < size; r++) {
          const { newLine, lineMoved } = slideLine(newBoard[r])
          if (lineMoved) moved = true
          for (let c = 0; c < size; c++) {
            if (newLine[c]) {
              newLine[c]!.row = r
              newLine[c]!.col = c
            }
            newBoard[r][c] = newLine[c]
          }
        }
      } else if (direction === "right") {
        for (let r = 0; r < size; r++) {
          const line = [...newBoard[r]].reverse()
          const { newLine, lineMoved } = slideLine(line)
          if (lineMoved) moved = true
          newLine.reverse()
          for (let c = 0; c < size; c++) {
            if (newLine[c]) {
              newLine[c]!.row = r
              newLine[c]!.col = c
            }
            newBoard[r][c] = newLine[c]
          }
        }
      } else if (direction === "up") {
        for (let c = 0; c < size; c++) {
          const line = newBoard.map((row) => row[c])
          const { newLine, lineMoved } = slideLine(line)
          if (lineMoved) moved = true
          for (let r = 0; r < size; r++) {
            if (newLine[r]) {
              newLine[r]!.row = r
              newLine[r]!.col = c
            }
            newBoard[r][c] = newLine[r]
          }
        }
      } else if (direction === "down") {
        for (let c = 0; c < size; c++) {
          const line = newBoard.map((row) => row[c]).reverse()
          const { newLine, lineMoved } = slideLine(line)
          if (lineMoved) moved = true
          newLine.reverse()
          for (let r = 0; r < size; r++) {
            if (newLine[r]) {
              newLine[r]!.row = r
              newLine[r]!.col = c
            }
            newBoard[r][c] = newLine[r]
          }
        }
      }

      if (!moved) return prevBoard // No state change if tiles didn't move

      // Save History stack (max 5 snapshots)
      setHistory((prev) => [snapshot, ...prev.slice(0, 4)])
      setMoveCount((prev) => prev + 1)

      // Handle Obstacle Decay in Obstacle Mode
      if (mode === "obstacle") {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const tile = newBoard[r][c]
            if (tile && tile.isObstacle) {
              const remaining = (tile.obstacleTimer || 5) - 1
              if (remaining <= 0) {
                newBoard[r][c] = null // Obstacle broke!
                addFloatingText("OBSTACLE SHATTERED!", 150, 150, "#f97316")
              } else {
                tile.obstacleTimer = remaining
              }
            }
          }
        }
      }

      // Add Random Tile
      const emptyCells: [number, number][] = []
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!newBoard[r][c]) {
            emptyCells.push([r, c])
          }
        }
      }

      if (emptyCells.length > 0) {
        const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
        
        // Spawn obstacle or standard tile
        const spawnObstacle = mode === "obstacle" && Math.random() < 0.15
        newBoard[r][c] = {
          id: Math.random().toString(),
          value: spawnObstacle ? -1 : Math.random() < 0.88 ? 2 : 4,
          row: r,
          col: c,
          isNew: true,
          isObstacle: spawnObstacle,
          obstacleTimer: spawnObstacle ? 5 : undefined
        }
      }

      // Audio & Visual Effects
      if (mergeCount > 1) {
        setCombo((prev) => prev + 1)
        playSound("combo")
        addFloatingText(`${mergeCount}x MULTI-MERGE!`, 160, 80, "#a855f7")
      } else if (maxMergedVal > 0) {
        setCombo(0)
        playSound("merge", maxMergedVal)
        addFloatingText(`+${scoreGained}`, 180, 120, "#eab308")
      } else {
        playSound("slide")
      }

      // Speed mode time bonus on merge
      if (mode === "speed" && mergeCount > 0) {
        setTimeLeft((prev) => Math.min(99, prev + mergeCount * 2))
      }

      // Check Win Condition
      const targetVal = MODES[mode].target
      if (!gameWon && !keepPlaying) {
        let reachedTarget = false
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (newBoard[r][c] && newBoard[r][c]!.value >= targetVal) {
              reachedTarget = true
              break
            }
          }
        }
        if (reachedTarget) {
          setGameWon(true)
          playSound("victory")
          createParticles(200, 200, "#f59e0b")
        }
      }

      // Check Game Over Condition
      if (!checkCanMove(newBoard, size)) {
        setGameOver(true)
        playSound("gameover")
      }

      setScore((prev) => prev + scoreGained)
      return newBoard
    })
  }, [
    gameOver, 
    gameWon, 
    keepPlaying, 
    isHammerActive, 
    isUpgradeActive, 
    gridSize, 
    score, 
    mode, 
    playSound, 
    addFloatingText, 
    createParticles
  ])

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
        e.preventDefault()
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          handleMove("up")
          break
        case "ArrowDown":
        case "s":
        case "S":
          handleMove("down")
          break
        case "ArrowLeft":
        case "a":
        case "A":
          handleMove("left")
          break
        case "ArrowRight":
        case "d":
        case "D":
          handleMove("right")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleMove])

  // Touch Gesture Listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) return

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    const minSwipeDistance = 30 // Minimum pixel threshold

    if (Math.max(absDx, absDy) > minSwipeDistance) {
      if (absDx > absDy) {
        if (dx > 0) handleMove("right")
        else handleMove("left")
      } else {
        if (dy > 0) handleMove("down")
        else handleMove("up")
      }
    }

    touchStartRef.current = null
  }

  // Power-Up Actions
  const handleUndo = () => {
    if (history.length === 0) return
    const [previous, ...rest] = history
    setBoard(previous.board)
    setScore(previous.score)
    setHistory(rest)
    setGameOver(false)
    playSound("powerup")
    addFloatingText("UNDO REVERTED!", 160, 160, "#3b82f6")
  }

  const handleTileClick = (r: number, c: number) => {
    const tile = board[r][c]
    if (!tile) return

    if (isHammerActive && hammerCharges > 0) {
      setBoard((prev) => {
        const next = prev.map((row) => [...row])
        next[r][c] = null
        return next
      })
      setHammerCharges((prev) => prev - 1)
      setIsHammerActive(false)
      playSound("powerup")
      addFloatingText("TILE DESTROYED!", 160, 160, "#ef4444")
      createParticles(180, 180, "#ef4444")
    } else if (isUpgradeActive && upgradeCharges > 0 && !tile.isObstacle) {
      setBoard((prev) => {
        const next = prev.map((row) => [...row])
        next[r][c] = {
          ...tile,
          value: tile.value * 2,
          isMerged: true
        }
        return next
      })
      setUpgradeCharges((prev) => prev - 1)
      setIsUpgradeActive(false)
      playSound("powerup")
      addFloatingText("TILE DOUBLED!", 160, 160, "#22c55e")
      createParticles(180, 180, "#22c55e")
    }
  }

  const handleShuffle = () => {
    if (shuffleCharges <= 0) return

    const size = gridSize
    const nonNullTiles: Tile[] = []
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] && !board[r][c]!.isObstacle) {
          nonNullTiles.push(board[r][c]!)
        }
      }
    }

    // Shuffle non-null tiles array
    for (let i = nonNullTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[nonNullTiles[i], nonNullTiles[j]] = [nonNullTiles[j], nonNullTiles[i]]
    }

    setBoard((prev) => {
      const next: (Tile | null)[][] = prev.map((row) =>
        row.map((cell) => (cell && cell.isObstacle ? cell : null))
      )
      let idx = 0
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!next[r][c] && idx < nonNullTiles.length) {
            next[r][c] = {
              ...nonNullTiles[idx],
              row: r,
              col: c
            }
            idx++
          }
        }
      }
      return next
    })

    setShuffleCharges((prev) => prev - 1)
    playSound("powerup")
    addFloatingText("BOARD SHUFFLED!", 160, 160, "#a855f7")
  }

  // Visual Theme Styling Maps
  const themeStyles: Record<Theme, { bg: string; gridBg: string; tileColors: Record<number, string> }> = {
    cyber: {
      bg: "from-slate-950 via-slate-900 to-indigo-950",
      gridBg: "bg-slate-900/80 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]",
      tileColors: {
        2: "bg-cyan-950/70 text-cyan-200 border-cyan-500/30 shadow-cyan-500/20",
        4: "bg-cyan-900/80 text-cyan-100 border-cyan-400/40 shadow-cyan-500/30",
        8: "bg-indigo-900/90 text-indigo-100 border-indigo-500/50 shadow-indigo-500/40",
        16: "bg-purple-900/90 text-purple-100 border-purple-500/50 shadow-purple-500/40",
        32: "bg-pink-900/90 text-pink-100 border-pink-500/60 shadow-pink-500/50",
        64: "bg-rose-900/90 text-rose-100 border-rose-500/60 shadow-rose-500/50",
        128: "bg-gradient-to-br from-amber-600 to-yellow-500 text-yellow-950 font-extrabold border-yellow-300 shadow-yellow-500/60",
        256: "bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 font-extrabold border-orange-300 shadow-orange-500/60",
        512: "bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 font-extrabold border-emerald-300 shadow-emerald-500/60",
        1024: "bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 font-extrabold border-cyan-200 shadow-cyan-400/80",
        2048: "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white font-black border-fuchsia-300 shadow-fuchsia-500/90 animate-pulse",
        4096: "bg-gradient-to-br from-rose-500 via-purple-600 to-cyan-500 text-white font-black border-white shadow-rose-500/90"
      }
    },
    sunset: {
      bg: "from-amber-950 via-rose-950 to-purple-950",
      gridBg: "bg-amber-950/60 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]",
      tileColors: {
        2: "bg-orange-950/60 text-orange-200 border-orange-500/30 shadow-orange-500/10",
        4: "bg-amber-900/70 text-amber-100 border-amber-500/40 shadow-amber-500/20",
        8: "bg-orange-800/80 text-white border-orange-400/50 shadow-orange-500/30",
        16: "bg-rose-800/80 text-white border-rose-400/50 shadow-rose-500/40",
        32: "bg-pink-700/80 text-white border-pink-400/60 shadow-pink-500/50",
        64: "bg-red-700/90 text-white border-red-400/60 shadow-red-500/50",
        128: "bg-gradient-to-br from-amber-500 to-yellow-400 text-amber-950 font-extrabold border-amber-200 shadow-amber-400/70",
        256: "bg-gradient-to-br from-orange-500 to-red-500 text-white font-extrabold border-orange-200 shadow-orange-500/70",
        512: "bg-gradient-to-br from-rose-600 to-pink-500 text-white font-extrabold border-rose-200 shadow-rose-500/70",
        1024: "bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-extrabold border-purple-300 shadow-purple-500/80",
        2048: "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 text-slate-950 font-black border-yellow-200 shadow-yellow-400/90 animate-pulse",
        4096: "bg-gradient-to-br from-amber-300 via-rose-500 to-purple-600 text-white font-black border-white shadow-amber-300/90"
      }
    },
    emerald: {
      bg: "from-emerald-950 via-slate-900 to-teal-950",
      gridBg: "bg-emerald-950/60 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      tileColors: {
        2: "bg-emerald-950/70 text-emerald-200 border-emerald-500/30 shadow-emerald-500/10",
        4: "bg-emerald-900/80 text-emerald-100 border-emerald-400/40 shadow-emerald-500/20",
        8: "bg-teal-900/90 text-teal-100 border-teal-500/50 shadow-teal-500/30",
        16: "bg-cyan-900/90 text-cyan-100 border-cyan-500/50 shadow-cyan-500/40",
        32: "bg-sky-900/90 text-sky-100 border-sky-500/60 shadow-sky-500/50",
        64: "bg-green-800/90 text-white border-green-400/60 shadow-green-500/50",
        128: "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-extrabold border-emerald-200 shadow-emerald-400/70",
        256: "bg-gradient-to-br from-green-400 to-emerald-600 text-slate-950 font-extrabold border-green-200 shadow-green-400/70",
        512: "bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950 font-extrabold border-teal-200 shadow-teal-400/80",
        1024: "bg-gradient-to-br from-cyan-300 to-emerald-500 text-slate-950 font-extrabold border-cyan-100 shadow-cyan-300/90",
        2048: "bg-gradient-to-br from-emerald-300 via-teal-400 to-lime-400 text-slate-950 font-black border-white shadow-emerald-300/90 animate-pulse",
        4096: "bg-gradient-to-br from-yellow-300 via-emerald-400 to-cyan-500 text-slate-950 font-black border-white shadow-yellow-300/90"
      }
    },
    obsidian: {
      bg: "from-neutral-950 via-zinc-900 to-neutral-900",
      gridBg: "bg-neutral-900/90 border-neutral-700/50 shadow-[0_0_30px_rgba(255,255,255,0.05)]",
      tileColors: {
        2: "bg-zinc-800/80 text-zinc-300 border-zinc-700/50 shadow-black/40",
        4: "bg-zinc-700/80 text-zinc-200 border-zinc-600/50 shadow-black/50",
        8: "bg-stone-700/90 text-amber-200 border-amber-600/30 shadow-amber-900/20",
        16: "bg-stone-600/90 text-amber-100 border-amber-500/40 shadow-amber-800/30",
        32: "bg-zinc-600/90 text-yellow-100 border-yellow-500/50 shadow-yellow-800/40",
        64: "bg-neutral-700/90 text-yellow-200 border-yellow-400/50 shadow-yellow-700/50",
        128: "bg-gradient-to-br from-amber-300 to-yellow-600 text-zinc-950 font-extrabold border-amber-200 shadow-amber-400/60",
        256: "bg-gradient-to-br from-slate-200 to-slate-400 text-zinc-950 font-extrabold border-white shadow-slate-300/60",
        512: "bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-extrabold border-amber-100 shadow-amber-400/80",
        1024: "bg-gradient-to-br from-purple-400 to-pink-600 text-white font-extrabold border-purple-200 shadow-purple-400/80",
        2048: "bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-zinc-950 font-black border-white shadow-amber-200/90 animate-pulse",
        4096: "bg-gradient-to-br from-slate-100 via-amber-300 to-yellow-500 text-zinc-950 font-black border-white shadow-slate-100/90"
      }
    }
  }

  const getTileStyle = (val: number, isObs: boolean = false) => {
    if (isObs) {
      return "bg-slate-800 text-slate-400 border-slate-600/80 shadow-slate-900 shadow-inner flex flex-col items-center justify-center font-bold"
    }
    const currentTheme = themeStyles[theme]
    return (
      currentTheme.tileColors[val] ||
      "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white font-black border-white shadow-purple-500/90"
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles[theme].bg} text-white p-3 md:p-6 flex flex-col items-center select-none font-sans relative overflow-hidden transition-colors duration-500`}>
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Score Popups */}
      {floatingTexts.map((ft) => (
        <div
          key={ft.id}
          className="absolute z-40 font-black text-xl md:text-2xl pointer-events-none animate-bounce"
          style={{
            left: `${ft.x}px`,
            top: `${ft.y}px`,
            color: ft.color,
            textShadow: "0 0 10px rgba(0,0,0,0.8)"
          }}
        >
          {ft.text}
        </div>
      ))}

      {/* Explosive Particles Canvas / Divs */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none z-30"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.life,
            boxShadow: `0 0 8px ${p.color}`
          }}
        />
      ))}

      {/* Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 z-10">
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-slate-900/60 border-slate-700/60 hover:bg-slate-800 text-slate-200 gap-2 rounded-xl backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="flex items-center bg-slate-900/60 border border-slate-700/60 rounded-xl p-1 backdrop-blur-md">
            {(["cyber", "sunset", "emerald", "obsidian"] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  theme === t
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="outline"
            size="icon"
            className="bg-slate-900/60 border-slate-700/60 hover:bg-slate-800 text-slate-200 rounded-xl backdrop-blur-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </Button>
        </div>
      </div>

      {/* Main Title & Score Cards */}
      <div className="w-full max-w-xl flex flex-col md:flex-row items-center justify-between gap-4 mb-4 z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent drop-shadow-sm flex items-center gap-3">
            2048 <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">
            Join tiles, reach <span className="text-amber-400 font-bold">{MODES[mode].target}</span>!
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Current Score */}
          <div className="bg-slate-900/80 border border-amber-500/30 px-4 py-2 rounded-2xl text-center min-w-[90px] shadow-lg backdrop-blur-md">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-400 block">Score</span>
            <span className="text-2xl font-black text-white">{score}</span>
          </div>

          {/* Best Score */}
          <div className="bg-slate-900/80 border border-slate-700/60 px-4 py-2 rounded-2xl text-center min-w-[90px] shadow-lg backdrop-blur-md">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 block flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> Best
            </span>
            <span className="text-2xl font-black text-amber-300">{bestScores[mode] || 0}</span>
          </div>
        </div>
      </div>

      {/* Difficulty Mode Selector */}
      <div className="w-full max-w-xl mb-4 z-10">
        <div className="grid grid-cols-5 gap-1.5 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                mode === m
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold shadow-lg scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium"
              }`}
            >
              <div className="mb-1">{MODES[m].icon}</div>
              <span className="text-[11px] leading-tight text-center capitalize">{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Speed Rush Timer Indicator */}
      {mode === "speed" && (
        <div className="w-full max-w-xl mb-3 flex items-center justify-between bg-rose-950/50 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold text-rose-200 backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-400 animate-spin" /> Time Remaining:
          </span>
          <span className={`text-lg font-black ${timeLeft <= 10 ? "text-rose-400 animate-ping" : "text-white"}`}>
            {timeLeft}s
          </span>
        </div>
      )}

      {/* Obstacle Blitz Indicator */}
      {mode === "obstacle" && (
        <div className="w-full max-w-xl mb-3 bg-amber-950/50 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-medium text-amber-200 backdrop-blur-md flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" /> Obstacle Mode active! Frozen blocks break after 5 moves.
          </span>
        </div>
      )}

      {/* Tactical Power-Up Toolbar */}
      <div className="w-full max-w-xl mb-3 z-10 flex items-center justify-between gap-2">
        <Button
          onClick={handleUndo}
          disabled={history.length === 0}
          variant="outline"
          size="sm"
          className="flex-1 bg-slate-900/70 border-slate-700/60 hover:bg-slate-800 disabled:opacity-40 text-xs gap-1.5 rounded-xl backdrop-blur-md"
        >
          <Undo2 className="w-3.5 h-3.5 text-blue-400" />
          Undo ({history.length})
        </Button>

        <Button
          onClick={() => {
            setIsHammerActive(!isHammerActive)
            setIsUpgradeActive(false)
          }}
          disabled={hammerCharges <= 0}
          variant={isHammerActive ? "default" : "outline"}
          size="sm"
          className={`flex-1 text-xs gap-1.5 rounded-xl backdrop-blur-md transition-all ${
            isHammerActive
              ? "bg-red-600 text-white font-bold ring-2 ring-red-400"
              : "bg-slate-900/70 border-slate-700/60 hover:bg-slate-800 disabled:opacity-40"
          }`}
        >
          <Bomb className="w-3.5 h-3.5 text-red-400" />
          {isHammerActive ? "Tap Tile!" : `Hammer (${hammerCharges})`}
        </Button>

        <Button
          onClick={() => {
            setIsUpgradeActive(!isUpgradeActive)
            setIsHammerActive(false)
          }}
          disabled={upgradeCharges <= 0}
          variant={isUpgradeActive ? "default" : "outline"}
          size="sm"
          className={`flex-1 text-xs gap-1.5 rounded-xl backdrop-blur-md transition-all ${
            isUpgradeActive
              ? "bg-emerald-600 text-white font-bold ring-2 ring-emerald-400"
              : "bg-slate-900/70 border-slate-700/60 hover:bg-slate-800 disabled:opacity-40"
          }`}
        >
          <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
          {isUpgradeActive ? "Tap Tile!" : `Double (${upgradeCharges})`}
        </Button>

        <Button
          onClick={handleShuffle}
          disabled={shuffleCharges <= 0}
          variant="outline"
          size="sm"
          className="flex-1 bg-slate-900/70 border-slate-700/60 hover:bg-slate-800 disabled:opacity-40 text-xs gap-1.5 rounded-xl backdrop-blur-md"
        >
          <Shuffle className="w-3.5 h-3.5 text-purple-400" />
          Shuffle ({shuffleCharges})
        </Button>
      </div>

      {/* Main Game Board Grid */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`w-full max-w-xl aspect-square p-2.5 rounded-3xl border ${themeStyles[theme].gridBg} backdrop-blur-xl relative flex flex-col justify-between z-10 shadow-2xl touch-none transition-all duration-300`}
      >
        {/* Victory Overlay Modal */}
        {gameWon && !keepPlaying && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-3xl z-30 flex flex-col items-center justify-start overflow-y-auto p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <Crown className="w-16 h-16 text-amber-400 mb-3 animate-bounce" />
            <h2 className="text-3xl md:text-4xl font-black text-amber-300 mb-2">YOU REACHED {MODES[mode].target}!</h2>
            <p className="text-slate-300 text-sm mb-6 max-w-xs">
              Amazing strategic skills! You conquered the <span className="text-amber-400 font-bold">{MODES[mode].name}</span> mode.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setKeepPlaying(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl px-5"
              >
                Keep Playing
              </Button>
              <Button
                onClick={resetGame}
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl px-5"
              >
                New Game
              </Button>
            </div>
          </div>
        )}

        {/* Game Over Overlay Modal */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl z-30 flex flex-col items-center justify-start overflow-y-auto p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-center mb-3">
              <RotateCcw className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">NO MORE MOVES!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Final Score: <span className="text-amber-400 font-extrabold">{score}</span> in {moveCount} moves.
            </p>
            <Button
              onClick={resetGame}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl px-8 py-3 text-base shadow-lg"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Grid Cells */}
        <div
          className="w-full h-full grid gap-2 md:gap-3"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: gridSize }).map((_, r) =>
            Array.from({ length: gridSize }).map((_, c) => {
              const tile = board[r] ? board[r][c] : null

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  className={`relative rounded-2xl border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                    tile
                      ? `${getTileStyle(tile.value, tile.isObstacle)} ${
                          tile.isNew ? "animate-in zoom-in-50 duration-200" : ""
                        } ${tile.isMerged ? "scale-105 shadow-xl duration-150" : ""}`
                      : "bg-slate-900/50 border-slate-800/80"
                  } ${
                    isHammerActive && tile
                      ? "ring-2 ring-red-500 animate-pulse hover:scale-95"
                      : isUpgradeActive && tile && !tile.isObstacle
                      ? "ring-2 ring-emerald-500 animate-pulse hover:scale-105"
                      : ""
                  }`}
                >
                  {tile ? (
                    tile.isObstacle ? (
                      <div className="flex flex-col items-center">
                        <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {tile.obstacleTimer}m
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`font-black tracking-tight ${
                          gridSize >= 5
                            ? tile.value >= 1024
                              ? "text-lg md:text-xl"
                              : "text-xl md:text-2xl"
                            : tile.value >= 1024
                            ? "text-2xl md:text-3xl"
                            : tile.value >= 100
                            ? "text-3xl md:text-4xl"
                            : "text-3xl md:text-5xl"
                        }`}
                      >
                        {tile.value}
                      </span>
                    )
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Directional Touch D-Pad Controls for Mobile */}
      <div className="w-full max-w-xl mt-4 z-10 flex flex-col items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1">
          Controls: Keyboard Arrows / WASD / Swipe
        </span>
        <div className="grid grid-cols-3 gap-2 w-48 mt-1">
          <div />
          <Button
            onClick={() => handleMove("up")}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-amber-400 rounded-xl h-10 w-full"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
          <div />
          <Button
            onClick={() => handleMove("left")}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-amber-400 rounded-xl h-10 w-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => handleMove("down")}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-amber-400 rounded-xl h-10 w-full"
          >
            <ArrowUp className="w-5 h-5 rotate-180" />
          </Button>
          <Button
            onClick={() => handleMove("right")}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-amber-400 rounded-xl h-10 w-full"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-xs text-slate-500 flex items-center gap-4 z-10 font-medium">
        <span>Moves: <strong className="text-slate-300">{moveCount}</strong></span>
        <span>•</span>
        <span>Combos: <strong className="text-amber-400">{combo}x</strong></span>
        <span>•</span>
        <button
          onClick={resetGame}
          className="text-slate-400 hover:text-amber-400 flex items-center gap-1 underline transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset Grid
        </button>
      </div>
    </div>
  )
}
