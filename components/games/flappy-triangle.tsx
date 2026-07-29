"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Triangle,
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Shield,
  Clock,
  Sparkles,
  Zap,
  ArrowLeft,
  Flame,
  Award,
  Settings,
  Target
} from "lucide-react"

// Canvas Constants
const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 600
const BASE_TRIANGLE_SIZE = 26

type Difficulty = "easy" | "normal" | "hard" | "insane"
type ThemeId = "synthwave" | "sunset" | "matrix" | "cosmic"

interface DifficultyConfig {
  speed: number
  gap: number
  gravity: number
  jumpForce: number
  obstacleSpacing: number
  movingObstacles: boolean
  laserObstacles: boolean
  label: string
  description: string
  badgeColor: string
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    speed: 2.6,
    gap: 190,
    gravity: 0.44,
    jumpForce: -10.2,
    obstacleSpacing: 320,
    movingObstacles: false,
    laserObstacles: false,
    label: "Easy",
    description: "Gentle speed, wider gaps, relaxed flight",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
  },
  normal: {
    speed: 3.6,
    gap: 155,
    gravity: 0.55,
    jumpForce: -11.5,
    obstacleSpacing: 270,
    movingObstacles: false,
    laserObstacles: false,
    label: "Normal",
    description: "Standard arcade timing & obstacle flow",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40"
  },
  hard: {
    speed: 4.8,
    gap: 130,
    gravity: 0.66,
    jumpForce: -12.5,
    obstacleSpacing: 235,
    movingObstacles: true,
    laserObstacles: false,
    label: "Hard",
    description: "High speed, tight gaps & moving pillars",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/40"
  },
  insane: {
    speed: 6.2,
    gap: 110,
    gravity: 0.78,
    jumpForce: -13.5,
    obstacleSpacing: 200,
    movingObstacles: true,
    laserObstacles: true,
    label: "Insane",
    description: "Hyper velocity, laser gates & floating hazards",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40"
  }
}

interface ThemeConfig {
  id: ThemeId
  name: string
  bgGradient: [string, string]
  pillarPrimary: string
  pillarSecondary: string
  pillarGlow: string
  triangleColor: string
  triangleGlow: string
  gridColor: string
  accentColor: string
}

const THEMES: Record<ThemeId, ThemeConfig> = {
  synthwave: {
    id: "synthwave",
    name: "Neon Synthwave",
    bgGradient: ["#0d0221", "#190538"],
    pillarPrimary: "#ff007f",
    pillarSecondary: "#00f5ff",
    pillarGlow: "rgba(255, 0, 127, 0.5)",
    triangleColor: "#00f5ff",
    triangleGlow: "#00f5ff",
    gridColor: "rgba(255, 0, 127, 0.2)",
    accentColor: "#ff007f"
  },
  sunset: {
    id: "sunset",
    name: "Solar Flare",
    bgGradient: ["#1e0c24", "#3b1338"],
    pillarPrimary: "#f59e0b",
    pillarSecondary: "#ef4444",
    pillarGlow: "rgba(245, 158, 11, 0.5)",
    triangleColor: "#fbbf24",
    triangleGlow: "#f59e0b",
    gridColor: "rgba(245, 158, 11, 0.2)",
    accentColor: "#f59e0b"
  },
  matrix: {
    id: "matrix",
    name: "Cyber Emerald",
    bgGradient: ["#021a08", "#073312"],
    pillarPrimary: "#10b981",
    pillarSecondary: "#059669",
    pillarGlow: "rgba(16, 185, 129, 0.5)",
    triangleColor: "#34d399",
    triangleGlow: "#10b981",
    gridColor: "rgba(16, 185, 129, 0.2)",
    accentColor: "#10b981"
  },
  cosmic: {
    id: "cosmic",
    name: "Deep Cosmos",
    bgGradient: ["#03071e", "#0f172a"],
    pillarPrimary: "#8b5cf6",
    pillarSecondary: "#3b82f6",
    pillarGlow: "rgba(139, 92, 246, 0.5)",
    triangleColor: "#38bdf8",
    triangleGlow: "#38bdf8",
    gridColor: "rgba(56, 189, 248, 0.2)",
    accentColor: "#8b5cf6"
  }
}

type PowerupType = "shield" | "slowmo" | "shrink" | "gem"

interface PowerupItem {
  id: number
  x: number
  y: number
  type: PowerupType
  collected: boolean
  pulse: number
}

interface Obstacle {
  x: number
  width: number
  topHeight: number
  bottomHeight: number
  gapY: number
  gapHeight: number
  passed: boolean
  isLaser?: boolean
  moveSpeed?: number
  moveDir?: number
  minGapY?: number
  maxGapY?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  decay: number
  shape?: "circle" | "spark" | "shard"
}

interface FloatingText {
  id: number
  x: number
  y: number
  text: string
  color: string
  alpha: number
}

export default function FlappyTriangle({
  onBack,
  themeColor = "#f59e0b"
}: {
  onBack?: () => void
  themeColor?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Game States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu")
  const [difficulty, setDifficulty] = useState<Difficulty>("normal")
  const [theme, setTheme] = useState<ThemeId>("synthwave")
  const [score, setScore] = useState(0)
  const [bestScores, setBestScores] = useState<Record<Difficulty, number>>({
    easy: 0,
    normal: 0,
    hard: 0,
    insane: 0
  })
  const [isMuted, setIsMuted] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    gemsCollected: 0,
    pillarsCleared: 0,
    powerupsUsed: 0,
    flightTime: 0
  })

  // Active Powerups Status (for UI rendering)
  const [activeEffects, setActiveEffects] = useState<{
    shield: boolean
    slowmoTimer: number // percentage 0-100
    shrinkTimer: number // percentage 0-100
  }>({
    shield: false,
    slowmoTimer: 0,
    shrinkTimer: 0
  })

  // Refs for smooth 60fps Game Loop
  const gsRef = useRef<"menu" | "playing" | "paused" | "gameOver">("menu")
  const diffRef = useRef<Difficulty>("normal")
  const themeRef = useRef<ThemeId>("synthwave")
  const isMutedRef = useRef(false)

  const triangleRef = useRef({
    x: 140,
    y: CANVAS_HEIGHT / 2,
    velocityY: 0,
    rotation: 0,
    scale: 1,
    shield: false,
    slowmoTimer: 0, // frame countdown
    shrinkTimer: 0 // frame countdown
  })

  const obstaclesRef = useRef<Obstacle[]>([])
  const powerupsRef = useRef<PowerupItem[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatTextsRef = useRef<FloatingText[]>([])

  const scoreRef = useRef(0)
  const statsRef = useRef({
    gemsCollected: 0,
    pillarsCleared: 0,
    powerupsUsed: 0,
    startTime: 0,
    flightTime: 0
  })
  const animFrameRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const starfieldRef = useRef<{ x: number; y: number; size: number; speed: number; alpha: number }[]>([])

  // Keep refs synchronized with state
  useEffect(() => {
    gsRef.current = gameState
  }, [gameState])
  useEffect(() => {
    diffRef.current = difficulty
  }, [difficulty])
  useEffect(() => {
    themeRef.current = theme
  }, [theme])
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  // Load High Scores & Settings from LocalStorage
  useEffect(() => {
    try {
      const savedScores = {
        easy: parseInt(localStorage.getItem("flappy_triangle_hs_easy") || "0", 10),
        normal: parseInt(localStorage.getItem("flappy_triangle_hs_normal") || "0", 10),
        hard: parseInt(localStorage.getItem("flappy_triangle_hs_hard") || "0", 10),
        insane: parseInt(localStorage.getItem("flappy_triangle_hs_insane") || "0", 10)
      }
      setBestScores(savedScores)

      const savedTheme = localStorage.getItem("flappy_triangle_theme") as ThemeId
      if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme)

      const savedMute = localStorage.getItem("flappy_triangle_muted")
      if (savedMute !== null) setIsMuted(savedMute === "true")
    } catch {
      // Storage access ignored if restricted
    }
  }, [])

  // Initialize Background Stars / Cosmic backdrop
  useEffect(() => {
    const stars = []
    for (let i = 0; i < 75; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 0.8 + 0.2,
        alpha: Math.random() * 0.8 + 0.2
      })
    }
    starfieldRef.current = stars
  }, [])

  // Web Audio Synthesizer
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }, [])

  const playSound = useCallback((type: "flap" | "score" | "powerup" | "shield" | "explosion") => {
    if (isMutedRef.current) return
    const ctx = getAudioContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime

      if (type === "flap") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(160, now)
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.08)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === "score") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(523.25, now) // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06) // E5
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.16)
      } else if (type === "powerup") {
        const notes = [523.25, 659.25, 783.99, 1046.5]
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, now + idx * 0.05)
          gain.gain.setValueAtTime(0.15, now + idx * 0.05)
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.1)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.05)
          osc.stop(now + idx * 0.05 + 0.1)
        })
      } else if (type === "shield") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.linearRampToValueAtTime(150, now + 0.15)
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === "explosion") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(180, now)
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3)
        gain.gain.setValueAtTime(0.35, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.3)
      }
    } catch {
      // Ignore audio context errors
    }
  }, [getAudioContext])

  // Spawn Obstacles & Powerups
  const generateObstacle = useCallback((x: number): Obstacle => {
    const config = DIFFICULTIES[diffRef.current]
    const minTop = 60
    const maxTop = CANVAS_HEIGHT - config.gap - 80
    const gapY = Math.floor(Math.random() * (maxTop - minTop)) + minTop

    const isLaser = config.laserObstacles && Math.random() < 0.35
    const isMoving = config.movingObstacles && Math.random() < 0.45

    const obstacle: Obstacle = {
      x,
      width: isLaser ? 45 : 65,
      topHeight: gapY,
      bottomHeight: CANVAS_HEIGHT - gapY - config.gap,
      gapY,
      gapHeight: config.gap,
      passed: false,
      isLaser,
      moveSpeed: isMoving ? (Math.random() * 1.5 + 1.0) : 0,
      moveDir: Math.random() < 0.5 ? 1 : -1,
      minGapY: Math.max(40, gapY - 70),
      maxGapY: Math.min(CANVAS_HEIGHT - config.gap - 40, gapY + 70)
    }

    // Spawn Powerup chance in or near gap
    const spawnChance = config.label === "Easy" ? 0.45 : config.label === "Normal" ? 0.35 : 0.25
    if (Math.random() < spawnChance) {
      const types: PowerupType[] = ["shield", "slowmo", "shrink", "gem", "gem"]
      const chosenType = types[Math.floor(Math.random() * types.length)]
      powerupsRef.current.push({
        id: Date.now() + Math.random(),
        x: x + obstacle.width / 2,
        y: gapY + config.gap / 2 + (Math.random() * 40 - 20),
        type: chosenType,
        collected: false,
        pulse: 0
      })
    }

    return obstacle
  }, [])

  // Floating Text Animation Helper
  const addFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1
    })
  }, [])

  // Particle Explosions
  const spawnExplosionParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 7 + 2
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
        shape: Math.random() < 0.5 ? "shard" : "circle"
      })
    }
  }, [])

  // Precise Triangle Vertex vs Obstacles & Powerups Collision Check
  const checkCollision = useCallback((t: typeof triangleRef.current, obs: Obstacle[]) => {
    const radius = (BASE_TRIANGLE_SIZE * t.scale) / 2
    // Triangle bounds approximate box
    const triLeft = t.x - radius
    const triRight = t.x + radius
    const triTop = t.y - radius
    const triBottom = t.y + radius

    // Ceiling / Floor collision
    if (triTop <= 5 || triBottom >= CANVAS_HEIGHT - 5) {
      return true
    }

    for (const o of obs) {
      if (triRight > o.x && triLeft < o.x + o.width) {
        // Upper pillar hit
        if (triTop < o.topHeight) return true
        // Lower pillar hit
        if (triBottom > CANVAS_HEIGHT - o.bottomHeight) return true
      }
    }
    return false
  }, [])

  // Start Game Routine
  const startGame = useCallback(() => {
    getAudioContext()
    const config = DIFFICULTIES[diffRef.current]

    triangleRef.current = {
      x: 140,
      y: CANVAS_HEIGHT / 2,
      velocityY: -4,
      rotation: -0.2,
      scale: 1,
      shield: false,
      slowmoTimer: 0,
      shrinkTimer: 0
    }

    obstaclesRef.current = [generateObstacle(CANVAS_WIDTH + 100)]
    powerupsRef.current = []
    particlesRef.current = []
    floatTextsRef.current = []
    scoreRef.current = 0

    statsRef.current = {
      gemsCollected: 0,
      pillarsCleared: 0,
      powerupsUsed: 0,
      startTime: Date.now(),
      flightTime: 0
    }

    setScore(0)
    setStats({
      gemsCollected: 0,
      pillarsCleared: 0,
      powerupsUsed: 0,
      flightTime: 0
    })
    setActiveEffects({ shield: false, slowmoTimer: 0, shrinkTimer: 0 })

    setGameState("playing")
    gsRef.current = "playing"
  }, [generateObstacle, getAudioContext])

  // Flap / Jump Action
  const jump = useCallback(() => {
    const state = gsRef.current
    if (state === "menu" || state === "gameOver") {
      startGame()
      return
    }
    if (state === "paused") {
      setGameState("playing")
      gsRef.current = "playing"
      return
    }

    const t = triangleRef.current
    const config = DIFFICULTIES[diffRef.current]
    t.velocityY = config.jumpForce
    t.rotation = -0.45 // Point upward on jump

    // Spawn Thruster Particles
    const themeObj = THEMES[themeRef.current]
    for (let i = 0; i < 7; i++) {
      particlesRef.current.push({
        x: t.x - 12,
        y: t.y + (Math.random() * 10 - 5),
        vx: -(Math.random() * 4 + 2),
        vy: Math.random() * 3 - 1.5,
        size: Math.random() * 4 + 2,
        color: Math.random() < 0.5 ? themeObj.triangleColor : themeObj.accentColor,
        alpha: 1,
        decay: 0.05,
        shape: "spark"
      })
    }

    playSound("flap")
  }, [startGame, playSound])

  // Toggle Mute Audio
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem("flappy_triangle_muted", String(next))
      } catch {
        // ignored
      }
      return next
    })
  }, [])

  // Toggle Theme
  const changeTheme = useCallback((newTheme: ThemeId) => {
    setTheme(newTheme)
    try {
      localStorage.setItem("flappy_triangle_theme", newTheme)
    } catch {
      // ignored
    }
  }, [])

  // Main 60 FPS Physics Loop
  const gameLoop = useCallback(() => {
    if (gsRef.current === "playing") {
      const t = triangleRef.current
      const config = DIFFICULTIES[diffRef.current]
      const themeObj = THEMES[themeRef.current]

      // Timers & Slow-mo Calculation
      let currentSpeed = config.speed
      if (t.slowmoTimer > 0) {
        t.slowmoTimer--
        currentSpeed *= 0.6
      }

      if (t.shrinkTimer > 0) {
        t.shrinkTimer--
        t.scale = 0.65
      } else {
        t.scale = 1.0
      }

      // Update UI active effects timer state periodically
      if (Math.random() < 0.2) {
        setActiveEffects({
          shield: t.shield,
          slowmoTimer: Math.round((t.slowmoTimer / 360) * 100),
          shrinkTimer: Math.round((t.shrinkTimer / 420) * 100)
        })
      }

      // Gravity & Flight Mechanics
      t.velocityY += config.gravity
      t.y += t.velocityY

      // Smooth Rotation dynamics
      if (t.velocityY < 0) {
        t.rotation = Math.max(-0.5, t.rotation - 0.05)
      } else {
        t.rotation = Math.min(1.1, t.rotation + 0.04)
      }

      // Obstacle Movement & Management
      const obs = obstaclesRef.current
      for (const o of obs) {
        o.x -= currentSpeed

        // Oscillating moving pillars in Hard/Insane
        if (o.moveSpeed && o.minGapY !== undefined && o.maxGapY !== undefined) {
          o.gapY += o.moveSpeed * (o.moveDir || 1)
          if (o.gapY <= o.minGapY || o.gapY >= o.maxGapY) {
            o.moveDir = (o.moveDir || 1) * -1
          }
          o.topHeight = o.gapY
          o.bottomHeight = CANVAS_HEIGHT - o.gapY - o.gapHeight
        }
      }

      // Remove off-screen obstacles
      while (obs.length > 0 && obs[0].x + obs[0].width < 0) {
        obs.shift()
      }

      // Spawn next obstacle
      const lastObs = obs[obs.length - 1]
      if (!lastObs || lastObs.x < CANVAS_WIDTH - config.obstacleSpacing) {
        obs.push(generateObstacle(CANVAS_WIDTH + 20))
      }

      // Score Tracking & Pillar Cleared
      for (const o of obs) {
        if (!o.passed && o.x + o.width < t.x) {
          o.passed = true
          scoreRef.current += 1
          statsRef.current.pillarsCleared += 1
          setScore(scoreRef.current)
          playSound("score")
          addFloatingText(t.x, t.y - 25, "+1", "#34d399")
        }
      }

      // Powerups Update & Collection
      const powerups = powerupsRef.current
      for (const p of powerups) {
        if (!p.collected) {
          p.x -= currentSpeed
          p.pulse += 0.08

          // Collect distance check
          const dist = Math.hypot(p.x - t.x, p.y - t.y)
          if (dist < 32 * t.scale) {
            p.collected = true
            statsRef.current.powerupsUsed += 1

            if (p.type === "shield") {
              t.shield = true
              playSound("powerup")
              addFloatingText(t.x, t.y - 30, "SHIELD ACTIVE!", "#38bdf8")
            } else if (p.type === "slowmo") {
              t.slowmoTimer = 360 // ~6 seconds
              playSound("powerup")
              addFloatingText(t.x, t.y - 30, "SLOW-MO!", "#a855f7")
            } else if (p.type === "shrink") {
              t.shrinkTimer = 420 // ~7 seconds
              playSound("powerup")
              addFloatingText(t.x, t.y - 30, "MINI TRIANGLE!", "#f43f5e")
            } else if (p.type === "gem") {
              scoreRef.current += 5
              statsRef.current.gemsCollected += 1
              setScore(scoreRef.current)
              playSound("powerup")
              addFloatingText(p.x, p.y, "+5 GEMS!", "#fbbf24")
            }
          }
        }
      }

      // Filter collected or off-screen powerups
      powerupsRef.current = powerups.filter((p) => !p.collected && p.x > -50)

      // Collision Handler
      if (checkCollision(t, obs)) {
        if (t.shield) {
          // Shield absorbs crash!
          t.shield = false
          playSound("shield")
          spawnExplosionParticles(t.x, t.y, "#38bdf8")
          addFloatingText(t.x, t.y - 35, "SHIELD POPPED!", "#38bdf8")

          // Clear immediate colliding obstacle to give safety grace window
          for (const o of obs) {
            if (t.x + 30 > o.x && t.x - 30 < o.x + o.width) {
              o.x = -200
            }
          }
        } else {
          // Game Over Crash!
          spawnExplosionParticles(t.x, t.y, themeObj.triangleColor)
          playSound("explosion")

          const flightSecs = Math.round((Date.now() - statsRef.current.startTime) / 1000)
          const finalScore = scoreRef.current
          const currentDiff = diffRef.current

          setStats({
            gemsCollected: statsRef.current.gemsCollected,
            pillarsCleared: statsRef.current.pillarsCleared,
            powerupsUsed: statsRef.current.powerupsUsed,
            flightTime: flightSecs
          })

          // Save high score if record broken
          setBestScores((prev) => {
            const prevBest = prev[currentDiff]
            if (finalScore > prevBest) {
              const updated = { ...prev, [currentDiff]: finalScore }
              try {
                localStorage.setItem(`flappy_triangle_hs_${currentDiff}`, String(finalScore))
              } catch {
                // ignored
              }
              return updated
            }
            return prev
          })

          gsRef.current = "gameOver"
          setGameState("gameOver")
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [generateObstacle, checkCollision, playSound, addFloatingText, spawnExplosionParticles])

  // Setup loop listener
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [gameLoop])

  // Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let renderFrameId: number

    const render = () => {
      const themeObj = THEMES[themeRef.current]
      const t = triangleRef.current

      // 1. Background Gradient & Sky
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      bgGrad.addColorStop(0, themeObj.bgGradient[0])
      bgGrad.addColorStop(1, themeObj.bgGradient[1])
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // 2. Cosmic Stars / Grid Lines
      if (themeRef.current === "cosmic") {
        ctx.fillStyle = "#ffffff"
        for (const s of starfieldRef.current) {
          s.x -= s.speed * (t.slowmoTimer > 0 ? 0.4 : 1.0)
          if (s.x < 0) s.x = CANVAS_WIDTH
          ctx.globalAlpha = s.alpha
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      } else {
        // Perspective Grid Lines
        ctx.strokeStyle = themeObj.gridColor
        ctx.lineWidth = 1.5
        const gridOffset = (Date.now() * 0.05) % 40
        for (let x = -gridOffset; x < CANVAS_WIDTH; x += 40) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, CANVAS_HEIGHT)
          ctx.stroke()
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(CANVAS_WIDTH, y)
          ctx.stroke()
        }
      }

      // 3. Render Obstacles / Pillars
      const obs = obstaclesRef.current
      for (const o of obs) {
        if (o.isLaser) {
          // Neon Laser Gate Effect
          const laserGrad = ctx.createLinearGradient(o.x, 0, o.x + o.width, 0)
          laserGrad.addColorStop(0, "rgba(239, 68, 68, 0.8)")
          laserGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)")
          laserGrad.addColorStop(1, "rgba(239, 68, 68, 0.8)")

          ctx.shadowColor = "#ef4444"
          ctx.shadowBlur = 15
          ctx.fillStyle = laserGrad

          // Top Pillar
          ctx.fillRect(o.x, 0, o.width, o.topHeight)
          // Bottom Pillar
          ctx.fillRect(o.x, CANVAS_HEIGHT - o.bottomHeight, o.width, o.bottomHeight)

          // Glowing hazard borders
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(o.x, o.topHeight - 6, o.width, 6)
          ctx.fillRect(o.x, CANVAS_HEIGHT - o.bottomHeight, o.width, 6)
        } else {
          // Modern Metallic Cyber Pillar
          const pillarGrad = ctx.createLinearGradient(o.x, 0, o.x + o.width, 0)
          pillarGrad.addColorStop(0, themeObj.pillarPrimary)
          pillarGrad.addColorStop(0.5, "#ffffff")
          pillarGrad.addColorStop(1, themeObj.pillarSecondary)

          ctx.shadowColor = themeObj.pillarGlow
          ctx.shadowBlur = 12
          ctx.fillStyle = pillarGrad

          // Top Pillar Body
          ctx.fillRect(o.x, 0, o.width, o.topHeight)
          // Top Cap
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(o.x - 3, o.topHeight - 12, o.width + 6, 12)

          // Bottom Pillar Body
          ctx.fillStyle = pillarGrad
          ctx.fillRect(o.x, CANVAS_HEIGHT - o.bottomHeight, o.width, o.bottomHeight)
          // Bottom Cap
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(o.x - 3, CANVAS_HEIGHT - o.bottomHeight, o.width + 6, 12)
        }
        ctx.shadowBlur = 0
      }

      // 4. Render Powerups
      const powerups = powerupsRef.current
      for (const p of powerups) {
        if (!p.collected) {
          ctx.save()
          ctx.translate(p.x, p.y)
          const scalePulse = 1 + Math.sin(p.pulse) * 0.12
          ctx.scale(scalePulse, scalePulse)

          if (p.type === "shield") {
            ctx.shadowColor = "#38bdf8"
            ctx.shadowBlur = 15
            ctx.fillStyle = "#0284c7"
            ctx.beginPath()
            ctx.arc(0, 0, 16, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = "#7dd3fc"
            ctx.lineWidth = 3
            ctx.stroke()
            // Shield Symbol
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 14px sans-serif"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("🛡️", 0, 0)
          } else if (p.type === "slowmo") {
            ctx.shadowColor = "#a855f7"
            ctx.shadowBlur = 15
            ctx.fillStyle = "#7e22ce"
            ctx.beginPath()
            ctx.arc(0, 0, 16, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = "#c084fc"
            ctx.lineWidth = 3
            ctx.stroke()
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 14px sans-serif"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("⏱️", 0, 0)
          } else if (p.type === "shrink") {
            ctx.shadowColor = "#f43f5e"
            ctx.shadowBlur = 15
            ctx.fillStyle = "#be123c"
            ctx.beginPath()
            ctx.arc(0, 0, 16, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = "#fda4af"
            ctx.lineWidth = 3
            ctx.stroke()
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 14px sans-serif"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("🔬", 0, 0)
          } else if (p.type === "gem") {
            ctx.shadowColor = "#fbbf24"
            ctx.shadowBlur = 16
            ctx.fillStyle = "#d97706"
            ctx.beginPath()
            ctx.moveTo(0, -16)
            ctx.lineTo(14, 0)
            ctx.lineTo(0, 16)
            ctx.lineTo(-14, 0)
            ctx.closePath()
            ctx.fill()
            ctx.strokeStyle = "#fef08a"
            ctx.lineWidth = 2.5
            ctx.stroke()
          }
          ctx.restore()
        }
      }

      // 5. Render Particles
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color

        if (p.shape === "shard") {
          ctx.translate(p.x, p.y)
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // 6. Render Player Triangle
      if (gsRef.current === "playing" || gsRef.current === "paused") {
        ctx.save()
        ctx.translate(t.x, t.y)
        ctx.rotate(t.rotation)
        ctx.scale(t.scale, t.scale)

        const size = BASE_TRIANGLE_SIZE

        // Shield Aura Bubble
        if (t.shield) {
          ctx.shadowColor = "#38bdf8"
          ctx.shadowBlur = 20
          ctx.strokeStyle = "rgba(56, 189, 248, 0.85)"
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(0, 0, size + 8, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Triangle Glow & Body
        ctx.shadowColor = themeObj.triangleGlow
        ctx.shadowBlur = 18
        ctx.fillStyle = themeObj.triangleColor

        ctx.beginPath()
        // Front Tip (pointing right)
        ctx.moveTo(size * 0.9, 0)
        // Top Back Corner
        ctx.lineTo(-size * 0.7, -size * 0.75)
        // Inner Thruster Indent
        ctx.lineTo(-size * 0.35, 0)
        // Bottom Back Corner
        ctx.lineTo(-size * 0.7, size * 0.75)
        ctx.closePath()
        ctx.fill()

        // Highlight stroke edge
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()

        // Core Pilot Energy Node
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(size * 0.2, 0, 3.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      // 7. Render Floating Text Popups
      const floatTexts = floatTextsRef.current
      for (let i = floatTexts.length - 1; i >= 0; i--) {
        const ft = floatTexts[i]
        ft.y -= 1.2
        ft.alpha -= 0.02

        if (ft.alpha <= 0) {
          floatTexts.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, ft.alpha)
        ctx.font = "900 18px sans-serif"
        ctx.fillStyle = ft.color
        ctx.shadowColor = "#000000"
        ctx.shadowBlur = 6
        ctx.textAlign = "center"
        ctx.fillText(ft.text, ft.x, ft.y)
        ctx.restore()
      }

      // 8. Time Slow-mo Screen Tint Effect
      if (t.slowmoTimer > 0) {
        ctx.fillStyle = "rgba(168, 85, 247, 0.08)"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }

      renderFrameId = requestAnimationFrame(render)
    }

    renderFrameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(renderFrameId)
  }, [])

  // Input Listeners (Keyboard & Mouse / Touch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault()
        jump()
      } else if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault()
        if (gsRef.current === "playing") {
          setGameState("paused")
          gsRef.current = "paused"
        } else if (gsRef.current === "paused") {
          setGameState("playing")
          gsRef.current = "playing"
        }
      } else if (e.code === "KeyM") {
        toggleMute()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [jump, toggleMute])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-3 md:p-6 select-none font-sans">
      <div className="relative w-full max-w-4xl bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Top Glassmorphic Navigation Bar */}
        <div className="flex items-center justify-between mb-4 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg"
                style={{ backgroundColor: THEMES[theme].pillarPrimary }}
              >
                <Triangle className="w-5 h-5 text-white fill-white rotate-90" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                  Triangle Arcade
                </h1>
                <span className="text-xs text-slate-400 font-medium">
                  {DIFFICULTIES[difficulty].label} Mode • {THEMES[theme].name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Score Display */}
            {gameState === "playing" && (
              <div className="flex items-center gap-4 bg-slate-950/70 px-4 py-1.5 rounded-lg border border-slate-700">
                <div className="text-center">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Score</span>
                  <span className="text-xl font-extrabold text-amber-400">{score}</span>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div className="text-center">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Best</span>
                  <span className="text-xl font-extrabold text-emerald-400">{bestScores[difficulty]}</span>
                </div>
              </div>
            )}

            {/* Mute Toggle */}
            <Button
              onClick={toggleMute}
              variant="outline"
              size="icon"
              className="border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </Button>

            {/* Pause Button */}
            {gameState === "playing" && (
              <Button
                onClick={() => {
                  setGameState("paused")
                  gsRef.current = "paused"
                }}
                variant="outline"
                size="icon"
                className="border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
                title="Pause Game (P)"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Powerups Status Bar */}
        {gameState === "playing" && (
          <div className="absolute top-20 left-8 z-10 flex gap-2">
            {activeEffects.shield && (
              <div className="flex items-center gap-1.5 bg-sky-500/20 border border-sky-500/50 px-3 py-1 rounded-full backdrop-blur-md animate-pulse">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-semibold text-sky-300">Shield Active</span>
              </div>
            )}
            {activeEffects.slowmoTimer > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/50 px-3 py-1 rounded-full backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">Slow-Mo {activeEffects.slowmoTimer}%</span>
              </div>
            )}
            {activeEffects.shrinkTimer > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/50 px-3 py-1 rounded-full backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-semibold text-rose-300">Mini {activeEffects.shrinkTimer}%</span>
              </div>
            )}
          </div>
        )}

        {/* Main Interactive Game Canvas */}
        <div className="relative rounded-xl overflow-hidden shadow-inner border border-slate-800 cursor-pointer" onClick={jump}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto aspect-[3/2] block bg-slate-950"
          />

          {/* MAIN MENU OVERLAY */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-6 text-center z-20">
              <div className="max-w-lg my-auto w-full bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl">
                {/* Title */}
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-500 shadow-xl shadow-amber-500/20">
                  <Triangle className="w-9 h-9 text-white fill-white rotate-90" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white mb-1">TRIANGLE FLYER</h2>
                <p className="text-sm text-slate-400 mb-6">Master precision flight, dodge cyber pillars & pick up power-ups!</p>

                {/* Difficulty Selector */}
                <div className="mb-6 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Select Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => {
                      const d = DIFFICULTIES[key]
                      const isSelected = difficulty === key
                      return (
                        <button
                          key={key}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDifficulty(key)
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? `${d.badgeColor} bg-slate-800/90 shadow-md ring-2 ring-amber-500/40`
                              : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-sm text-white mb-0.5">
                            <span>{d.label}</span>
                            {bestScores[key] > 0 && (
                              <span className="text-xs font-medium text-amber-400">Best: {bestScores[key]}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{d.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="mb-6 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Visual Theme</label>
                  <div className="flex gap-2">
                    {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
                      const th = THEMES[tId]
                      const isSel = theme === tId
                      return (
                        <button
                          key={tId}
                          onClick={(e) => {
                            e.stopPropagation()
                            changeTheme(tId)
                          }}
                          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                            isSel
                              ? "border-amber-400 text-white bg-slate-800 shadow-md"
                              : "border-slate-800 text-slate-400 bg-slate-950/60 hover:border-slate-700"
                          }`}
                        >
                          {th.name.split(" ")[1] || th.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Start Flight Action */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    startGame()
                  }}
                  style={{ backgroundColor: themeColor }}
                  className="w-full py-3.5 text-base font-bold text-slate-950 hover:brightness-110 transition-all shadow-xl shadow-amber-500/20 rounded-xl flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-slate-950" /> Launch Flight
                </Button>

                <p className="text-xs text-slate-500 mt-4">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Click</kbd> to flap
                </p>
              </div>
            </div>
          )}

          {/* PAUSE OVERLAY */}
          {gameState === "paused" && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-start overflow-y-auto p-6 text-center z-20">
              <Card className="p-8 max-w-sm w-full bg-slate-900 border-slate-800 shadow-2xl text-slate-100">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Pause className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">GAME PAUSED</h2>
                <p className="text-sm text-slate-400 mb-6">Take a breath, pilot!</p>

                <div className="space-y-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setGameState("playing")
                      gsRef.current = "playing"
                    }}
                    style={{ backgroundColor: themeColor }}
                    className="w-full py-2.5 font-bold text-slate-950 hover:brightness-110"
                  >
                    Resume Flight
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      startGame()
                    }}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Restart
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setGameState("menu")
                      gsRef.current = "menu"
                    }}
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                  >
                    Main Menu
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === "gameOver" && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-start overflow-y-auto p-6 text-center z-20">
              <Card className="p-6 md:p-8 max-w-md w-full bg-slate-900/95 border-slate-800 shadow-2xl text-slate-100">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Flame className="w-7 h-7" />
                </div>

                <h2 className="text-3xl font-black tracking-tight text-white mb-1">FLIGHT CRASHED!</h2>
                <p className="text-sm text-slate-400 mb-6">Obstacle collision detected</p>

                {/* Score Summary Box */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-6">
                  <div className="flex justify-around items-center mb-4">
                    <div>
                      <span className="text-xs uppercase text-slate-400 font-bold block mb-0.5">Final Score</span>
                      <span className="text-4xl font-extrabold text-amber-400">{score}</span>
                    </div>
                    <div className="w-px h-10 bg-slate-800" />
                    <div>
                      <span className="text-xs uppercase text-slate-400 font-bold block mb-0.5">Best Score</span>
                      <span className="text-4xl font-extrabold text-emerald-400">{bestScores[difficulty]}</span>
                    </div>
                  </div>

                  {score === bestScores[difficulty] && score > 0 && (
                    <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-2 flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
                      <Trophy className="w-4 h-4 text-amber-400" /> NEW RECORD HIGH SCORE!
                    </div>
                  )}
                </div>

                {/* Detailed Game Stats */}
                <div className="grid grid-cols-2 gap-2 text-left mb-6">
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Pillars Cleared</span>
                    <span className="text-base font-bold text-slate-200">{stats.pillarsCleared}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Gems Collected</span>
                    <span className="text-base font-bold text-amber-400">{stats.gemsCollected}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Power-ups Used</span>
                    <span className="text-base font-bold text-sky-400">{stats.powerupsUsed}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Flight Duration</span>
                    <span className="text-base font-bold text-purple-400">{stats.flightTime}s</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      startGame()
                    }}
                    style={{ backgroundColor: themeColor }}
                    className="flex-1 py-3 font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setGameState("menu")
                      gsRef.current = "menu"
                    }}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Menu
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Quick Controls Guide */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
          <div>
            Controls: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">Up Arrow</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">Click</kbd> to fly
          </div>
          <div>
            Pause: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">P</kbd> | Mute: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">M</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
