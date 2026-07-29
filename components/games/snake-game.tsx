"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Shield,
  Flame,
  Clock,
  Settings,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react"

// Types & Interfaces
type Position = { x: number; y: number }
type Difficulty = "easy" | "medium" | "hard" | "insane"
type GameMode = "classic" | "maze" | "speedrun"
type ThemeKey = "neon" | "emerald" | "synthwave" | "minimal"
type FoodType = "apple" | "gold" | "berry" | "gem" | "ghost"

interface FoodItem extends Position {
  type: FoodType
  timer?: number
  maxTimer?: number
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

interface ActiveEffect {
  type: FoodType
  duration: number // milliseconds remaining
  maxDuration: number
}

// Config Constants
const GRID_CELLS = 22
const CANVAS_WIDTH = 520
const CELL_SIZE = CANVAS_WIDTH / GRID_CELLS

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    name: string
    speed: number
    wallWrap: boolean
    hasObstacles: boolean
    speedRamp: boolean
    scoreMult: number
    color: string
    badgeBg: string
    description: string
  }
> = {
  easy: {
    name: "Easy",
    speed: 135,
    wallWrap: true,
    hasObstacles: false,
    speedRamp: false,
    scoreMult: 1.0,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    description: "Relaxed speed, wall wrap enabled, no obstacle hazards.",
  },
  medium: {
    name: "Medium",
    speed: 95,
    wallWrap: false,
    hasObstacles: false,
    speedRamp: false,
    scoreMult: 1.5,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    description: "Classic speed with solid border walls. Pure arcade thrill.",
  },
  hard: {
    name: "Hard",
    speed: 70,
    wallWrap: false,
    hasObstacles: true,
    speedRamp: false,
    scoreMult: 2.0,
    color: "text-orange-400",
    badgeBg: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    description: "Fast speed with static laser barriers spawned on grid.",
  },
  insane: {
    name: "Insane",
    speed: 48,
    wallWrap: false,
    hasObstacles: true,
    speedRamp: true,
    scoreMult: 3.0,
    color: "text-rose-400",
    badgeBg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    description: "Hyper speed, dynamic obstacles, and accelerating tempo!",
  },
}

const THEMES: Record<
  ThemeKey,
  {
    name: string
    bg: string
    grid: string
    snakeHead: string
    snakeBody: string
    snakeGlow: string
    eyeColor: string
    foodApple: string
    foodGold: string
    foodBerry: string
    foodGem: string
    foodGhost: string
    wall: string
    wallGlow: string
    text: string
  }
> = {
  neon: {
    name: "Neon Cyber",
    bg: "#090d16",
    grid: "rgba(56, 189, 248, 0.07)",
    snakeHead: "#06b6d4",
    snakeBody: "#3b82f6",
    snakeGlow: "rgba(6, 182, 212, 0.7)",
    eyeColor: "#ffffff",
    foodApple: "#ef4444",
    foodGold: "#fbbf24",
    foodBerry: "#3b82f6",
    foodGem: "#a855f7",
    foodGhost: "#10b981",
    wall: "#1e293b",
    wallGlow: "rgba(56, 189, 248, 0.6)",
    text: "#f3f4f6",
  },
  emerald: {
    name: "Emerald Glow",
    bg: "#042f2e",
    grid: "rgba(52, 211, 153, 0.08)",
    snakeHead: "#34d399",
    snakeBody: "#10b981",
    snakeGlow: "rgba(52, 211, 153, 0.7)",
    eyeColor: "#022c22",
    foodApple: "#f43f5e",
    foodGold: "#fbbf24",
    foodBerry: "#60a5fa",
    foodGem: "#c084fc",
    foodGhost: "#34d399",
    wall: "#064e3b",
    wallGlow: "rgba(52, 211, 153, 0.5)",
    text: "#ecfdf5",
  },
  synthwave: {
    name: "Synth Sunset",
    bg: "#180226",
    grid: "rgba(236, 72, 153, 0.1)",
    snakeHead: "#ec4899",
    snakeBody: "#8b5cf6",
    snakeGlow: "rgba(236, 72, 153, 0.75)",
    eyeColor: "#ffffff",
    foodApple: "#f43f5e",
    foodGold: "#f59e0b",
    foodBerry: "#06b6d4",
    foodGem: "#d946ef",
    foodGhost: "#10b981",
    wall: "#3b0764",
    wallGlow: "rgba(236, 72, 153, 0.6)",
    text: "#fdf4ff",
  },
  minimal: {
    name: "Monochrome",
    bg: "#18181b",
    grid: "rgba(255, 255, 255, 0.05)",
    snakeHead: "#f4f4f5",
    snakeBody: "#a1a1aa",
    snakeGlow: "rgba(255, 255, 255, 0.4)",
    eyeColor: "#18181b",
    foodApple: "#ef4444",
    foodGold: "#eab308",
    foodBerry: "#3b82f6",
    foodGem: "#a855f7",
    foodGhost: "#10b981",
    wall: "#27272a",
    wallGlow: "rgba(161, 161, 170, 0.5)",
    text: "#f4f4f5",
  },
}

// Web Audio API Audio Synthesizer
class SoundSynth {
  private ctx: AudioContext | null = null

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume()
    }
  }

  playTurn(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(320, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.04)
  }

  playEat(muted: boolean, type: FoodType = "apple") {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    if (type === "gold") {
      osc.type = "triangle"
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.setValueAtTime(880, now + 0.06) // A5
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    } else if (type === "berry" || type === "gem" || type === "ghost") {
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } else {
      osc.type = "sine"
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.07)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.07)
    }
  }

  playGameOver(muted: boolean) {
    if (muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.35)
  }
}

const synth = new SoundSynth()

// Pre-designed Obstacle Maps
const MAZE_OBSTACLES: Position[] = [
  // Top-Left block
  { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 6 },
  // Top-Right block
  { x: 15, y: 5 }, { x: 16, y: 5 }, { x: 16, y: 6 },
  // Bottom-Left block
  { x: 5, y: 15 }, { x: 5, y: 16 }, { x: 6, y: 16 },
  // Bottom-Right block
  { x: 16, y: 15 }, { x: 15, y: 16 }, { x: 16, y: 16 },
  // Center cross barrier
  { x: 10, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 11 }, { x: 11, y: 11 },
]

export default function SnakeGame({
  onBack,
  themeColor = "#22c55e",
}: {
  onBack?: () => void
  themeColor?: string
}) {
  // Game Setup & Options
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameMode, setGameMode] = useState<GameMode>("classic")
  const [themeKey, setThemeKey] = useState<ThemeKey>("neon")
  const [isMuted, setIsMuted] = useState(false)

  // Game Lifecycle States
  const [hasStarted, setHasStarted] = useState(false)
  const [gameRunning, setGameRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  // Stats & Timers
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [foodEatenCount, setFoodEatenCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60) // Speedrun timer
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([])
  const [shake, setShake] = useState(false)

  // Canvas & Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ])
  const directionRef = useRef<Position>({ x: 1, y: 0 })
  const nextDirRef = useRef<Position>({ x: 1, y: 0 })
  const foodsRef = useRef<FoodItem[]>([])
  const obstaclesRef = useRef<Position[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatingTextsRef = useRef<FloatingText[]>([])
  const textIdCounter = useRef(0)

  // Animation Loop Refs
  const lastMoveRef = useRef<number>(0)
  const animFrameRef = useRef<number>(0)
  const gameRunningRef = useRef(false)
  const isPausedRef = useRef(false)
  const gameOverRef = useRef(false)
  const scoreRef = useRef(0)
  const bestScoreRef = useRef(0)
  const comboRef = useRef(1)
  const comboResetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const activeEffectsRef = useRef<ActiveEffect[]>([])
  const startTimeRef = useRef<number>(0)
  const survivalTimeRef = useRef<number>(0)

  // Load saved preferences and high score
  useEffect(() => {
    try {
      const savedMute = localStorage.getItem("snake_muted")
      if (savedMute) setIsMuted(savedMute === "true")

      const savedTheme = localStorage.getItem("snake_theme") as ThemeKey
      if (savedTheme && THEMES[savedTheme]) setThemeKey(savedTheme)

      const scoreKey = `snake_best_${difficulty}_${gameMode}`
      const savedBest = localStorage.getItem(scoreKey)
      if (savedBest) {
        const val = parseInt(savedBest, 10)
        setBestScore(val)
        bestScoreRef.current = val
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [difficulty, gameMode])

  // Save High Score on Update
  const updateBestScore = useCallback((newScore: number) => {
    if (newScore > bestScoreRef.current) {
      bestScoreRef.current = newScore
      setBestScore(newScore)
      try {
        const scoreKey = `snake_best_${difficulty}_${gameMode}`
        localStorage.setItem(scoreKey, newScore.toString())
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [difficulty, gameMode])

  // Helper to spawn dynamic food item
  const generateFood = useCallback((type: FoodType = "apple"): FoodItem => {
    let newPos: Position
    const snake = snakeRef.current
    const obs = obstaclesRef.current
    const existingFoods = foodsRef.current

    let attempts = 0
    do {
      newPos = {
        x: Math.floor(Math.random() * GRID_CELLS),
        y: Math.floor(Math.random() * GRID_CELLS),
      }
      attempts++
    } while (
      attempts < 300 &&
      (snake.some((s) => s.x === newPos.x && s.y === newPos.y) ||
        obs.some((o) => o.x === newPos.x && o.y === newPos.y) ||
        existingFoods.some((f) => f.x === newPos.x && f.y === newPos.y))
    )

    let maxTimer: number | undefined
    if (type === "gold") maxTimer = 9000 // 9 sec
    else if (type === "berry" || type === "gem" || type === "ghost") maxTimer = 10000 // 10 sec

    return {
      x: newPos.x,
      y: newPos.y,
      type,
      timer: maxTimer,
      maxTimer,
    }
  }, [])

  // Particle explosion helper
  const createParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    const px = (x + 0.5) * CELL_SIZE
    const py = (y + 0.5) * CELL_SIZE
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3.5
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 3.5,
        alpha: 1.0,
        life: 0,
        maxLife: 20 + Math.floor(Math.random() * 25),
      })
    }
  }, [])

  // Floating score text helper
  const addFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    const px = (x + 0.5) * CELL_SIZE
    const py = y * CELL_SIZE
    textIdCounter.current += 1
    floatingTextsRef.current.push({
      id: textIdCounter.current,
      x: px,
      y: py,
      text,
      color,
      alpha: 1.0,
      vy: -1.2,
      life: 0,
    })
  }, [])

  // Reset / Initialize Game State
  const resetGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]
    directionRef.current = { x: 1, y: 0 }
    nextDirRef.current = { x: 1, y: 0 }
    scoreRef.current = 0
    comboRef.current = 1
    gameRunningRef.current = true
    isPausedRef.current = false
    gameOverRef.current = false
    activeEffectsRef.current = []
    particlesRef.current = []
    floatingTextsRef.current = []
    startTimeRef.current = Date.now()

    // Configure Obstacles based on mode & difficulty
    if (gameMode === "maze" || DIFFICULTY_CONFIG[difficulty].hasObstacles) {
      obstaclesRef.current = [...MAZE_OBSTACLES]
    } else {
      obstaclesRef.current = []
    }

    // Spawn Initial Foods
    foodsRef.current = []
    const firstApple = generateFood("apple")
    foodsRef.current = [firstApple]

    setScore(0)
    setCombo(1)
    setFoodEatenCount(0)
    setTimeLeft(60)
    setActiveEffects([])
    setHasStarted(true)
    setGameRunning(true)
    setIsPaused(false)
    setGameOver(false)
    lastMoveRef.current = 0
  }, [difficulty, gameMode, generateFood])

  // Trigger Game Over
  const handleGameOver = useCallback(() => {
    gameOverRef.current = true
    gameRunningRef.current = false
    setGameRunning(false)
    setGameOver(true)
    setShake(true)
    setTimeout(() => setShake(false), 500)
    synth.playGameOver(isMuted)
    survivalTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000)
    updateBestScore(scoreRef.current)
  }, [isMuted, updateBestScore])

  // Game Loop Step logic
  const updateGame = useCallback(
    (timestamp: number) => {
      if (!gameRunningRef.current || isPausedRef.current || gameOverRef.current) {
        return
      }

      // Calculate Speed with modifier from difficulty and powerups
      const cfg = DIFFICULTY_CONFIG[difficulty]
      let currentSpeed = cfg.speed

      // Chill Berry slow-down effect
      const hasBerry = activeEffectsRef.current.some((e) => e.type === "berry")
      if (hasBerry) currentSpeed *= 1.3

      // Dynamic Speed Ramp for Insane mode
      if (cfg.speedRamp) {
        const speedBonus = Math.min(25, Math.floor(scoreRef.current / 40) * 2)
        currentSpeed = Math.max(30, currentSpeed - speedBonus)
      }

      if (timestamp - lastMoveRef.current < currentSpeed) {
        return
      }
      lastMoveRef.current = timestamp

      // Apply Direction
      directionRef.current = { ...nextDirRef.current }
      const dir = directionRef.current
      const snake = [...snakeRef.current]
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

      const hasGhost = activeEffectsRef.current.some((e) => e.type === "ghost")

      // Check Wall Collision / Wrapping
      if (
        head.x < 0 ||
        head.x >= GRID_CELLS ||
        head.y < 0 ||
        head.y >= GRID_CELLS
      ) {
        if (cfg.wallWrap || hasGhost) {
          head.x = (head.x + GRID_CELLS) % GRID_CELLS
          head.y = (head.y + GRID_CELLS) % GRID_CELLS
        } else {
          handleGameOver()
          return
        }
      }

      // Check Obstacle Collision
      const hitObstacle = obstaclesRef.current.some(
        (o) => o.x === head.x && o.y === head.y
      )
      if (hitObstacle && !hasGhost) {
        handleGameOver()
        return
      }

      // Check Self Collision
      const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y)
      if (hitSelf && !hasGhost) {
        handleGameOver()
        return
      }

      // Move Snake Forward
      snake.unshift(head)

      // Check Food Collision
      const eatenIndex = foodsRef.current.findIndex(
        (f) => f.x === head.x && f.y === head.y
      )

      if (eatenIndex !== -1) {
        const eatenFood = foodsRef.current[eatenIndex]
        foodsRef.current.splice(eatenIndex, 1)

        // Combo Logic
        comboRef.current += 1
        setCombo(comboRef.current)
        if (comboResetTimerRef.current) clearTimeout(comboResetTimerRef.current)
        comboResetTimerRef.current = setTimeout(() => {
          comboRef.current = 1
          setCombo(1)
        }, 3500)

        // Calculate Points
        const hasGem = activeEffectsRef.current.some((e) => e.type === "gem")
        let basePts = 10
        if (eatenFood.type === "gold") basePts = 30
        else if (eatenFood.type !== "apple") basePts = 15

        const pointsGained = Math.round(
          basePts * cfg.scoreMult * comboRef.current * (hasGem ? 2 : 1)
        )

        scoreRef.current += pointsGained
        setScore(scoreRef.current)
        setFoodEatenCount((prev) => prev + 1)
        updateBestScore(scoreRef.current)

        // Audio & Visual Effects
        synth.playEat(isMuted, eatenFood.type)
        const theme = THEMES[themeKey]
        const particleColor =
          eatenFood.type === "gold"
            ? theme.foodGold
            : eatenFood.type === "berry"
            ? theme.foodBerry
            : eatenFood.type === "gem"
            ? theme.foodGem
            : eatenFood.type === "ghost"
            ? theme.foodGhost
            : theme.foodApple

        createParticles(head.x, head.y, particleColor, 16)
        addFloatingText(head.x, head.y, `+${pointsGained}`, particleColor)

        // Handle Special Food Active Effects
        if (
          eatenFood.type === "berry" ||
          eatenFood.type === "gem" ||
          eatenFood.type === "ghost"
        ) {
          const duration = eatenFood.type === "ghost" ? 5000 : 7000
          activeEffectsRef.current = [
            ...activeEffectsRef.current.filter((e) => e.type !== eatenFood.type),
            { type: eatenFood.type, duration, maxDuration: duration },
          ]
          setActiveEffects([...activeEffectsRef.current])
        }

        // Spawn New Main Food (Apple)
        foodsRef.current.push(generateFood("apple"))

        // Chance to spawn bonus food (Gold or Special)
        const rand = Math.random()
        if (rand < 0.28 && foodsRef.current.length < 3) {
          const bonusTypes: FoodType[] = ["gold", "berry", "gem", "ghost"]
          const pick = bonusTypes[Math.floor(Math.random() * bonusTypes.length)]
          foodsRef.current.push(generateFood(pick))
        }
      } else {
        // Did not eat food -> shrink tail
        snake.pop()
      }

      snakeRef.current = snake
    },
    [
      difficulty,
      generateFood,
      handleGameOver,
      isMuted,
      themeKey,
      createParticles,
      addFloatingText,
      updateBestScore,
    ]
  )

  // Main RAF Loop
  const mainLoop = useCallback(
    (timestamp: number) => {
      updateGame(timestamp)

      // Update Food Expiration Timers
      if (gameRunningRef.current && !isPausedRef.current && !gameOverRef.current) {
        foodsRef.current.forEach((food, idx) => {
          if (food.timer !== undefined) {
            food.timer -= 16.6
            if (food.timer <= 0) {
              foodsRef.current.splice(idx, 1)
              // Ensure at least 1 apple stays on screen
              if (foodsRef.current.length === 0) {
                foodsRef.current.push(generateFood("apple"))
              }
            }
          }
        })

        // Update Active Buff Effects
        if (activeEffectsRef.current.length > 0) {
          activeEffectsRef.current = activeEffectsRef.current
            .map((e) => ({ ...e, duration: e.duration - 16.6 }))
            .filter((e) => e.duration > 0)
          setActiveEffects([...activeEffectsRef.current])
        }
      }

      animFrameRef.current = requestAnimationFrame(mainLoop)
    },
    [updateGame, generateFood]
  )

  // Speedrun Countdown Timer Effect
  useEffect(() => {
    if (gameMode !== "speedrun" || !gameRunning || isPaused || gameOver) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleGameOver()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [gameMode, gameRunning, isPaused, gameOver, handleGameOver])

  // Attach RAF loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(mainLoop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [mainLoop])

  // Sync ref flags with React states
  useEffect(() => {
    gameRunningRef.current = gameRunning
    isPausedRef.current = isPaused
    gameOverRef.current = gameOver
  }, [gameRunning, isPaused, gameOver])

  // Canvas Drawing Render Effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let renderFrameId: number
    const theme = THEMES[themeKey]

    const draw = () => {
      // Clear Background
      ctx.fillStyle = theme.bg
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH)

      // Draw Grid Lines
      ctx.strokeStyle = theme.grid
      ctx.lineWidth = 1
      for (let i = 0; i <= CANVAS_WIDTH; i += CELL_SIZE) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, CANVAS_WIDTH)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(CANVAS_WIDTH, i)
        ctx.stroke()
      }

      // Draw Obstacles / Walls
      obstaclesRef.current.forEach((obs) => {
        const x = obs.x * CELL_SIZE
        const y = obs.y * CELL_SIZE
        ctx.fillStyle = theme.wall
        ctx.strokeStyle = theme.wallGlow
        ctx.lineWidth = 2
        ctx.shadowColor = theme.wallGlow
        ctx.shadowBlur = 8
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
        ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
        ctx.shadowBlur = 0

        // Inner obstacle pattern
        ctx.fillStyle = theme.wallGlow
        ctx.fillRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16)
      })

      // Draw Food Items
      foodsRef.current.forEach((food) => {
        const fx = food.x * CELL_SIZE + CELL_SIZE / 2
        const fy = food.y * CELL_SIZE + CELL_SIZE / 2
        const radius = (CELL_SIZE / 2) - 3

        let foodColor = theme.foodApple
        if (food.type === "gold") foodColor = theme.foodGold
        else if (food.type === "berry") foodColor = theme.foodBerry
        else if (food.type === "gem") foodColor = theme.foodGem
        else if (food.type === "ghost") foodColor = theme.foodGhost

        ctx.save()
        ctx.shadowColor = foodColor
        ctx.shadowBlur = 12

        // Timer ring countdown for special food
        if (food.timer !== undefined && food.maxTimer !== undefined) {
          const progress = food.timer / food.maxTimer
          ctx.beginPath()
          ctx.arc(fx, fy, radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
          ctx.strokeStyle = foodColor
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Draw Food Sphere
        ctx.beginPath()
        ctx.arc(fx, fy, radius, 0, Math.PI * 2)
        ctx.fillStyle = foodColor
        ctx.fill()

        // Highlight shine
        ctx.beginPath()
        ctx.arc(fx - radius * 0.3, fy - radius * 0.3, radius * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)"
        ctx.fill()
        ctx.restore()
      })

      // Draw Snake Body & Head
      const snake = snakeRef.current
      const hasGhost = activeEffectsRef.current.some((e) => e.type === "ghost")

      snake.forEach((segment, index) => {
        const sx = segment.x * CELL_SIZE
        const sy = segment.y * CELL_SIZE
        const isHead = index === 0

        ctx.save()

        if (isHead) {
          // Snake Head Glowing
          ctx.shadowColor = hasGhost ? theme.foodGhost : theme.snakeGlow
          ctx.shadowBlur = 14
          ctx.fillStyle = hasGhost ? theme.foodGhost : theme.snakeHead

          ctx.beginPath()
          ctx.roundRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, 8)
          ctx.fill()
          ctx.shadowBlur = 0

          // Eye orientation based on direction
          const dir = directionRef.current
          ctx.fillStyle = theme.eyeColor
          const eyeSize = 3.5

          let leftEyeX = sx + 6
          let leftEyeY = sy + 6
          let rightEyeX = sx + CELL_SIZE - 10
          let rightEyeY = sy + 6

          if (dir.x === 1) {
            leftEyeX = sx + CELL_SIZE - 8
            leftEyeY = sy + 5
            rightEyeX = sx + CELL_SIZE - 8
            rightEyeY = sy + CELL_SIZE - 9
          } else if (dir.x === -1) {
            leftEyeX = sx + 5
            leftEyeY = sy + 5
            rightEyeX = sx + 5
            rightEyeY = sy + CELL_SIZE - 9
          } else if (dir.y === 1) {
            leftEyeX = sx + 5
            leftEyeY = sy + CELL_SIZE - 8
            rightEyeX = sx + CELL_SIZE - 9
            rightEyeY = sy + CELL_SIZE - 8
          }

          ctx.beginPath()
          ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2)
          ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Snake Body Segments tapering slightly towards tail
          const progress = index / snake.length
          const pad = 1 + progress * 2
          ctx.fillStyle = hasGhost ? "rgba(16, 185, 129, 0.7)" : theme.snakeBody

          ctx.beginPath()
          ctx.roundRect(
            sx + pad,
            sy + pad,
            CELL_SIZE - pad * 2,
            CELL_SIZE - pad * 2,
            5
          )
          ctx.fill()
        }
        ctx.restore()
      })

      // Update and Draw Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy
        p.life += 1
        p.alpha = 1.0 - p.life / p.maxLife

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(idx, 1)
        } else {
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })

      // Update and Draw Floating Texts
      floatingTextsRef.current.forEach((t, idx) => {
        t.y += t.vy
        t.life += 1
        t.alpha = 1.0 - t.life / 35

        if (t.life >= 35) {
          floatingTextsRef.current.splice(idx, 1)
        } else {
          ctx.save()
          ctx.globalAlpha = Math.max(0, t.alpha)
          ctx.fillStyle = t.color
          ctx.font = "bold 15px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(t.text, t.x, t.y)
          ctx.restore()
        }
      })

      renderFrameId = requestAnimationFrame(draw)
    }

    renderFrameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(renderFrameId)
  }, [themeKey])

  // Key Down Handler for Snake Movements & Shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Shortcuts when paused / ended
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        if (!hasStarted) {
          resetGame()
          return
        }
        if (gameOver) {
          resetGame()
          return
        }
        setIsPaused((prev) => !prev)
        return
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault()
        resetGame()
        return
      }

      if (!gameRunningRef.current || isPausedRef.current) return

      const currDir = directionRef.current
      let newDir: Position | null = null

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (currDir.y !== 1) newDir = { x: 0, y: -1 }
          break
        case "ArrowDown":
        case "s":
        case "S":
          if (currDir.y !== -1) newDir = { x: 0, y: 1 }
          break
        case "ArrowLeft":
        case "a":
        case "A":
          if (currDir.x !== 1) newDir = { x: -1, y: 0 }
          break
        case "ArrowRight":
        case "d":
        case "D":
          if (currDir.x !== -1) newDir = { x: 1, y: 0 }
          break
      }

      if (newDir) {
        e.preventDefault()
        nextDirRef.current = newDir
        synth.playTurn(isMuted)
      }
    },
    [hasStarted, gameOver, resetGame, isMuted]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Mobile D-Pad Control Helper
  const triggerDirection = (dir: Position) => {
    if (!gameRunningRef.current || isPausedRef.current) return
    const curr = directionRef.current
    if (dir.x !== 0 && curr.x === -dir.x) return
    if (dir.y !== 0 && curr.y === -dir.y) return
    nextDirRef.current = dir
    synth.playTurn(isMuted)
  }

  const theme = THEMES[themeKey]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      <div className="max-w-2xl w-full flex flex-col gap-4">
        {/* Top Action & Branding Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              SNAKE ULTRA
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const nextMute = !isMuted
                setIsMuted(nextMute)
                try {
                  localStorage.setItem("snake_muted", nextMute.toString())
                } catch {
                  // ignore
                }
              }}
              variant="outline"
              size="icon"
              className="w-8 h-8 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </Button>

            <Button
              onClick={resetGame}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Live HUD Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-3 backdrop-blur shadow-lg">
          <div className="flex items-center gap-2.5 px-2">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</div>
              <div className="text-lg font-bold text-slate-100">{score}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-2 border-l border-slate-800">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Best</div>
              <div className="text-lg font-bold text-cyan-400">{bestScore}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0">
            <Flame className={`w-5 h-5 shrink-0 ${combo > 1 ? "text-orange-400 animate-bounce" : "text-slate-500"}`} />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Combo</div>
              <div className="text-lg font-bold text-orange-400">{combo}x</div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {gameMode === "speedrun" ? "Time Left" : "Difficulty"}
              </div>
              <div className={`text-sm font-bold capitalize ${DIFFICULTY_CONFIG[difficulty].color}`}>
                {gameMode === "speedrun" ? `${timeLeft}s` : DIFFICULTY_CONFIG[difficulty].name}
              </div>
            </div>
            {gameMode === "speedrun" && <Clock className="w-4 h-4 text-rose-400 animate-pulse" />}
          </div>
        </div>

        {/* Active Power-up Status Badges */}
        {activeEffects.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {activeEffects.map((effect) => {
              const pct = (effect.duration / effect.maxDuration) * 100
              return (
                <div
                  key={effect.type}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs font-medium text-slate-200 shadow"
                >
                  <span className="capitalize font-bold text-emerald-400">
                    {effect.type === "berry" ? "⚡ Time Slow" : effect.type === "gem" ? "💎 2x Multiplier" : "👻 Ghost Mode"}
                  </span>
                  <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                    <div className="bg-emerald-400 h-full transition-all duration-100" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Canvas Display Stage */}
        <Card
          className={`relative overflow-hidden border-2 border-slate-800 bg-slate-950 p-2 rounded-2xl shadow-2xl flex items-center justify-center transition-transform ${
            shake ? "animate-shake" : ""
          }`}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_WIDTH}
            className="w-full max-w-[520px] aspect-square rounded-xl block border border-slate-800/80 shadow-inner"
          />

          {/* SETUP SCREEN OVERLAY (Before starting game) */}
          {!hasStarted && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-5 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <Gamepad2 className="w-3.5 h-3.5" /> Next-Gen Arcade
                </div>
                <h2 className="text-3xl font-extrabold text-white">SNAKE ULTRA</h2>
                <p className="text-xs text-slate-400 max-w-sm">
                  Customize your speed, challenge mode, and neon aesthetic to begin.
                </p>
              </div>

              {/* Difficulty Selection */}
              <div className="w-full max-w-md space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
                  Difficulty Level
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => {
                    const cfg = DIFFICULTY_CONFIG[key]
                    const selected = difficulty === key
                    return (
                      <button
                        key={key}
                        onClick={() => setDifficulty(key)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                          selected
                            ? `${cfg.badgeBg} border-2 scale-105 shadow-lg`
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {cfg.name}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-400 italic text-left pt-0.5">
                  {DIFFICULTY_CONFIG[difficulty].description}
                </p>
              </div>

              {/* Mode Selection */}
              <div className="w-full max-w-md space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
                  Game Mode
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "classic", label: "Classic Arena" },
                    { key: "maze", label: "Maze Runner" },
                    { key: "speedrun", label: "Speed Blitz" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setGameMode(m.key as GameMode)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        gameMode === m.key
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 border-2 scale-105 shadow-lg"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="w-full max-w-md space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
                  Visual Theme
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(THEMES) as ThemeKey[]).map((tKey) => (
                    <button
                      key={tKey}
                      onClick={() => {
                        setThemeKey(tKey)
                        try {
                          localStorage.setItem("snake_theme", tKey)
                        } catch {
                          // ignore
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        themeKey === tKey
                          ? "bg-slate-800 border-emerald-400 text-emerald-400 border-2 scale-105"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {THEMES[tKey].name}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={resetGame}
                size="lg"
                className="w-full max-w-md bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold shadow-lg shadow-emerald-500/25 py-6 text-base tracking-wide rounded-xl"
              >
                <Play className="w-5 h-5 mr-2 fill-current" /> START GAME
              </Button>
            </div>
          )}

          {/* PAUSE OVERLAY */}
          {hasStarted && isPaused && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-fade-in">
              <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 mb-1">
                <Pause className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">GAME PAUSED</h2>
              <p className="text-xs text-slate-400">Take a breather! Resume whenever you are ready.</p>

              <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
                <Button
                  onClick={() => setIsPaused(false)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" /> Resume Game
                </Button>
                <Button onClick={resetGame} variant="outline" className="border-slate-700 bg-slate-900 text-slate-200">
                  <RefreshCw className="w-4 h-4 mr-2" /> Restart Match
                </Button>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-fade-in">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white">GAME OVER</h2>
                <p className="text-xs text-slate-400 mt-1">Collision detected!</p>
              </div>

              {/* Stats Card Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 w-full max-w-xs space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Final Score</span>
                  <span className="text-xl font-extrabold text-emerald-400">{score}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Best Score</span>
                  <span className="text-base font-bold text-amber-400">{bestScore}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Foods Eaten</span>
                  <span className="text-sm font-bold text-slate-200">{foodEatenCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Survival Time</span>
                  <span className="text-sm font-bold text-cyan-400">{survivalTimeRef.current}s</span>
                </div>
              </div>

              <Button
                onClick={resetGame}
                size="lg"
                className="w-full max-w-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold shadow-lg py-5 rounded-xl"
              >
                <RotateCcw className="w-5 h-5 mr-2" /> PLAY AGAIN
              </Button>
            </div>
          )}
        </Card>

        {/* Bottom Controls Bar & Mobile Touch D-Pad */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline font-semibold">Controls:</span>
            <span className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded text-slate-300">
              <kbd className="font-mono text-emerald-400">↑↓←→</kbd> or <kbd className="font-mono text-emerald-400">WASD</kbd>
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded text-slate-300">
              <kbd className="font-mono text-cyan-400">Space</kbd> Pause
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded text-slate-300">
              <kbd className="font-mono text-amber-400">R</kbd> Restart
            </span>
          </div>

          {/* On-Screen Mobile D-Pad */}
          <div className="grid grid-cols-3 gap-1.5 w-36 h-36 sm:hidden">
            <div />
            <Button
              onClick={() => triggerDirection({ x: 0, y: -1 })}
              variant="outline"
              size="icon"
              className="w-full h-full bg-slate-800 border-slate-700 text-slate-200 active:scale-95"
            >
              <ChevronUp className="w-6 h-6" />
            </Button>
            <div />
            <Button
              onClick={() => triggerDirection({ x: -1, y: 0 })}
              variant="outline"
              size="icon"
              className="w-full h-full bg-slate-800 border-slate-700 text-slate-200 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => setIsPaused((p) => !p)}
              variant="outline"
              size="icon"
              className="w-full h-full bg-slate-900 border-slate-700 text-emerald-400 active:scale-95"
            >
              {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button
              onClick={() => triggerDirection({ x: 1, y: 0 })}
              variant="outline"
              size="icon"
              className="w-full h-full bg-slate-800 border-slate-700 text-slate-200 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
            <div />
            <Button
              onClick={() => triggerDirection({ x: 0, y: 1 })}
              variant="outline"
              size="icon"
              className="w-full h-full bg-slate-800 border-slate-700 text-slate-200 active:scale-95"
            >
              <ChevronDown className="w-6 h-6" />
            </Button>
            <div />
          </div>
        </div>
      </div>
    </div>
  )
}
