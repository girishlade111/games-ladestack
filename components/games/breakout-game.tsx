"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Flame,
  Shield,
  Sparkles,
  MousePointer,
  Keyboard,
  Swords,
  Gauge,
  Heart,
  Crosshair,
  Award,
  Sparkle,
  Target,
  ChevronRight,
  Layers,
  ZapOff
} from "lucide-react"

// Canvas Resolution Constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PADDLE_HEIGHT = 16
const BALL_RADIUS = 8
const PADDLE_SPEED = 9
const BRICK_WIDTH = 70
const BRICK_HEIGHT = 20
const BRICK_PADDING = 6
const BRICK_OFFSET_TOP = 65
const BRICK_OFFSET_LEFT = 22
const MAX_LEVELS = 6

type Difficulty = "easy" | "medium" | "hard" | "extreme"
type GameState = "menu" | "playing" | "paused" | "gameover" | "victory"
type PowerUpType = "laser" | "expand" | "multiball" | "fireball" | "shield" | "magnet" | "extralife" | "slow" | "multiplier"
type BrickType = "standard" | "durable" | "bomb" | "metal" | "powerup"

interface DifficultyConfig {
  lives: number
  ballSpeed: number
  paddleWidth: number
  showAimLine: boolean
  dropRate: number
  label: string
  desc: string
  color: string
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    lives: 5,
    ballSpeed: 4.5,
    paddleWidth: 125,
    showAimLine: true,
    dropRate: 0.35,
    label: "Zen Casual",
    desc: "5 Lives, slower ball, wide paddle & laser aim guide",
    color: "#10b981"
  },
  medium: {
    lives: 3,
    ballSpeed: 6.0,
    paddleWidth: 100,
    showAimLine: false,
    dropRate: 0.25,
    label: "Arcade Standard",
    desc: "3 Lives, balanced ball speed & standard paddle",
    color: "#3b82f6"
  },
  hard: {
    lives: 2,
    ballSpeed: 7.5,
    paddleWidth: 80,
    showAimLine: false,
    dropRate: 0.18,
    label: "Hardcore",
    desc: "2 Lives, fast ball & slim paddle",
    color: "#f59e0b"
  },
  extreme: {
    lives: 1,
    ballSpeed: 9.0,
    paddleWidth: 65,
    showAimLine: false,
    dropRate: 0.30,
    label: "Hyper Extreme",
    desc: "1 Life, lightning ball & precision paddle",
    color: "#ef4444"
  }
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
  laserActive: boolean
  laserTimer: number
  magnetActive: boolean
  magnetTimer: number
  expandTimer: number
}

interface Ball {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  radius: number
  isFireball: boolean
  fireTimer: number
  isStuck: boolean
  offsetX: number
  color: string
  trail: { x: number; y: number }[]
}

interface Brick {
  id: string
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
  type: BrickType
  hp: number
  maxHp: number
  color: string
  points: number
  visible: boolean
}

interface PowerDrop {
  id: string
  x: number
  y: number
  vy: number
  type: PowerUpType
  radius: number
  color: string
  label: string
}

interface Bullet {
  id: string
  x: number
  y: number
  vy: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  decay: number
}

interface FloatingText {
  id: string
  x: number
  y: number
  vy: number
  text: string
  color: string
  alpha: number
}

export default function BreakoutGame({
  onBack,
  themeColor = "#8b5cf6"
}: {
  onBack?: () => void
  themeColor?: string
}) {
  // Settings & State
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameState, setGameState] = useState<GameState>("menu")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [controlType, setControlType] = useState<"mouse" | "keyboard">("mouse")
  const [activePowerUps, setActivePowerUps] = useState<string[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gsRef = useRef<GameState>("menu")

  // Mutable Game Loop State
  const gs = useRef({
    paddle: {
      x: CANVAS_WIDTH / 2 - 50,
      y: CANVAS_HEIGHT - 35,
      width: 100,
      height: PADDLE_HEIGHT,
      laserActive: false,
      laserTimer: 0,
      magnetActive: false,
      magnetTimer: 0,
      expandTimer: 0
    } as Paddle,
    balls: [] as Ball[],
    nextBallId: 1,
    bricks: [] as Brick[],
    powerDrops: [] as PowerDrop[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    safetyFloor: false,
    scoreMultiplier: 1,
    multiplierTimer: 0,
    slowTimer: 0,
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    maxCombo: 0,
    keys: new Set<string>(),
    screenShake: 0,
    aimAngle: Math.PI * 1.5,
    isPaused: false
  })

  // Load High Score
  useEffect(() => {
    try {
      const saved = localStorage.getItem("breakout_high_score")
      if (saved) setHighScore(parseInt(saved, 10))
    } catch {
      // ignore
    }
  }, [])

  // Web Audio Synth Helper
  const playSound = useCallback(
    (type: "paddle" | "brick" | "metal" | "bomb" | "laser" | "powerup" | "life" | "win" | "gameover", pitchMod = 1) => {
      if (!soundEnabled) return
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          audioCtxRef.current = new AudioContextClass()
        }
        const ctx = audioCtxRef.current
        if (ctx.state === "suspended") ctx.resume()

        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        if (type === "paddle") {
          osc.type = "sine"
          osc.frequency.setValueAtTime(300 * pitchMod, now)
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.08)
          gain.gain.setValueAtTime(0.3, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
          osc.start(now)
          osc.stop(now + 0.08)
        } else if (type === "brick") {
          osc.type = "triangle"
          osc.frequency.setValueAtTime((400 + pitchMod * 50), now)
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.1)
          gain.gain.setValueAtTime(0.25, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
          osc.start(now)
          osc.stop(now + 0.1)
        } else if (type === "metal") {
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(800, now)
          osc.frequency.setValueAtTime(600, now + 0.03)
          gain.gain.setValueAtTime(0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06)
          osc.start(now)
          osc.stop(now + 0.06)
        } else if (type === "bomb") {
          osc.type = "square"
          osc.frequency.setValueAtTime(150, now)
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.25)
          gain.gain.setValueAtTime(0.4, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
          osc.start(now)
          osc.stop(now + 0.25)
        } else if (type === "laser") {
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(900, now)
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.08)
          gain.gain.setValueAtTime(0.15, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
          osc.start(now)
          osc.stop(now + 0.08)
        } else if (type === "powerup") {
          osc.type = "sine"
          osc.frequency.setValueAtTime(440, now)
          osc.frequency.setValueAtTime(659, now + 0.08)
          osc.frequency.setValueAtTime(880, now + 0.16)
          gain.gain.setValueAtTime(0.25, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24)
          osc.start(now)
          osc.stop(now + 0.24)
        } else if (type === "life") {
          osc.type = "square"
          osc.frequency.setValueAtTime(300, now)
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.3)
          gain.gain.setValueAtTime(0.3, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
          osc.start(now)
          osc.stop(now + 0.3)
        } else if (type === "win") {
          const notes = [523.25, 659.25, 783.99, 1046.5]
          notes.forEach((freq, i) => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.type = "triangle"
            o.frequency.value = freq
            o.connect(g)
            g.connect(ctx.destination)
            g.gain.setValueAtTime(0.2, now + i * 0.1)
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2)
            o.start(now + i * 0.1)
            o.stop(now + i * 0.1 + 0.2)
          })
        } else if (type === "gameover") {
          const notes = [300, 260, 220, 180]
          notes.forEach((freq, i) => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.type = "sawtooth"
            o.frequency.value = freq
            o.connect(g)
            g.connect(ctx.destination)
            g.gain.setValueAtTime(0.2, now + i * 0.15)
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2)
            o.start(now + i * 0.15)
            o.stop(now + i * 0.15 + 0.2)
          })
        }
      } catch {
        // audio context failed
      }
    },
    [soundEnabled]
  )

  // Particle Explosions
  const createParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 4 + 1
      gs.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      })
    }
  }

  // Floating Text Popups
  const createFloatingText = (x: number, y: number, text: string, color = "#fbbf24") => {
    gs.current.floatingTexts.push({
      id: Math.random().toString(),
      x,
      y,
      vy: -1.5,
      text,
      color,
      alpha: 1
    })
  }

  // Level Generator
  const generateBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = []
    const rows = 8
    const cols = 10
    const colors = [
      "#ef4444", // Red
      "#f97316", // Orange
      "#f59e0b", // Amber
      "#10b981", // Emerald
      "#06b6d4", // Cyan
      "#3b82f6", // Blue
      "#8b5cf6", // Purple
      "#ec4899"  // Pink
    ]

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING)
        const y = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING)
        const id = `${r}-${c}`
        let type: BrickType = "standard"
        let hp = 1
        let maxHp = 1
        let color = colors[r % colors.length]
        let points = (rows - r) * 10

        // Custom level layouts
        if (lvl === 1) {
          // Classic rainbow
          if (r === 0 && (c === 2 || c === 7)) {
            type = "powerup"
            color = "#fbbf24"
            points = 50
          }
        } else if (lvl === 2) {
          // Pyramid Fortress
          if (c < 4 - r || c > 5 + r) continue
          if (r === 2 && (c === 4 || c === 5)) {
            type = "bomb"
            color = "#ff0055"
            points = 100
          } else if (r === 0) {
            type = "durable"
            hp = 2
            maxHp = 2
            color = "#94a3b8"
            points = 40
          }
        } else if (lvl === 3) {
          // Space Invader Pattern
          const invaderMask = [
            [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 1, 1, 1, 1, 0, 0, 0]
          ]
          if (!invaderMask[r][c]) continue
          if ((r === 3 && (c === 3 || c === 6))) {
            type = "metal"
            hp = 999
            maxHp = 999
            color = "#64748b"
            points = 0
          } else if (r === 4 && (c === 4 || c === 5)) {
            type = "bomb"
            color = "#ff0055"
            points = 100
          }
        } else if (lvl === 4) {
          // Diamond Shield
          const dist = Math.abs(c - 4.5) + Math.abs(r - 3.5)
          if (dist > 4.5) continue
          if (dist === 0.5) {
            type = "powerup"
            color = "#fbbf24"
            points = 75
          } else if (dist === 4.5 && (r === 0 || r === 7)) {
            type = "metal"
            hp = 999
            color = "#64748b"
            points = 0
          } else if (r <= 2) {
            type = "durable"
            hp = 2
            maxHp = 2
            color = "#a855f7"
            points = 50
          }
        } else if (lvl === 5) {
          // Castle Ramparts
          if (r === 0 && c % 2 === 1) continue
          if (r === 1 && (c === 0 || c === 9)) {
            type = "metal"
            hp = 999
            color = "#64748b"
            points = 0
          } else if (r === 3 && (c === 4 || c === 5)) {
            type = "bomb"
            color = "#ff0055"
            points = 120
          } else if (r === 2) {
            type = "durable"
            hp = 3
            maxHp = 3
            color = "#3b82f6"
            points = 60
          }
        } else if (lvl >= 6) {
          // Boss Core Matrix (Armor Fortress)
          if (r >= 2 && r <= 5 && c >= 3 && c <= 6) {
            if ((r === 3 || r === 4) && (c === 4 || c === 5)) {
              type = "bomb"
              color = "#ff0055"
              points = 150
            } else {
              type = "durable"
              hp = 3
              maxHp = 3
              color = "#e11d48"
              points = 80
            }
          } else if ((r === 0 || r === 7) && (c === 0 || c === 9)) {
            type = "metal"
            hp = 999
            color = "#64748b"
            points = 0
          } else if ((r + c) % 3 === 0) {
            type = "powerup"
            color = "#fbbf24"
            points = 50
          }
        }

        bricks.push({
          id,
          row: r,
          col: c,
          x,
          y,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          type,
          hp,
          maxHp,
          color,
          points,
          visible: true
        })
      }
    }
    return bricks
  }, [])

  // Create initial ball attached to paddle
  const createInitialBall = (paddleWidth: number, baseSpeed: number): Ball => {
    return {
      id: gs.current.nextBallId++,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 35 - BALL_RADIUS - 2,
      vx: 0,
      vy: -baseSpeed,
      speed: baseSpeed,
      radius: BALL_RADIUS,
      isFireball: false,
      fireTimer: 0,
      isStuck: true,
      offsetX: 0,
      color: "#ffffff",
      trail: []
    }
  }

  // Initialize Game Session
  const initGame = useCallback(
    (startLevel = 1, currentScore = 0) => {
      const cfg = DIFFICULTY_SETTINGS[difficulty]
      const paddleW = cfg.paddleWidth

      gs.current.paddle = {
        x: CANVAS_WIDTH / 2 - paddleW / 2,
        y: CANVAS_HEIGHT - 35,
        width: paddleW,
        height: PADDLE_HEIGHT,
        laserActive: false,
        laserTimer: 0,
        magnetActive: false,
        magnetTimer: 0,
        expandTimer: 0
      }

      gs.current.balls = [createInitialBall(paddleW, cfg.ballSpeed)]
      gs.current.bricks = generateBricks(startLevel)
      gs.current.powerDrops = []
      gs.current.bullets = []
      gs.current.particles = []
      gs.current.floatingTexts = []
      gs.current.safetyFloor = false
      gs.current.scoreMultiplier = 1
      gs.current.multiplierTimer = 0
      gs.current.slowTimer = 0
      gs.current.score = currentScore
      gs.current.lives = cfg.lives
      gs.current.level = startLevel
      gs.current.combo = 0
      gs.current.maxCombo = 0
      gs.current.isPaused = false

      setScore(currentScore)
      setLives(cfg.lives)
      setLevel(startLevel)
      setCombo(0)
      setActivePowerUps([])
    },
    [difficulty, generateBricks]
  )

  const startGame = useCallback(() => {
    initGame(1, 0)
    setGameState("playing")
    gsRef.current = "playing"
  }, [initGame])

  const launchStuckBalls = useCallback(() => {
    const cfg = DIFFICULTY_SETTINGS[difficulty]
    gs.current.balls.forEach((ball) => {
      if (ball.isStuck) {
        ball.isStuck = false
        const angle = Math.PI * 1.5 + (Math.random() * 0.4 - 0.2)
        ball.vx = Math.cos(angle) * cfg.ballSpeed
        ball.vy = Math.sin(angle) * cfg.ballSpeed
      }
    })
  }, [difficulty])

  const fireLasers = useCallback(() => {
    const p = gs.current.paddle
    if (!p.laserActive) return
    playSound("laser")
    gs.current.bullets.push({
      id: Math.random().toString(),
      x: p.x + 8,
      y: p.y - 6,
      vy: -12
    })
    gs.current.bullets.push({
      id: Math.random().toString(),
      x: p.x + p.width - 8,
      y: p.y - 6,
      vy: -12
    })
  }, [playSound])

  // Spawn Power Up Drop
  const spawnPowerDrop = (x: number, y: number) => {
    const cfg = DIFFICULTY_SETTINGS[difficulty]
    if (Math.random() > cfg.dropRate) return

    const types: { type: PowerUpType; label: string; color: string }[] = [
      { type: "laser", label: "⚡ LASER", color: "#ec4899" },
      { type: "expand", label: "🏓 EXPAND", color: "#3b82f6" },
      { type: "multiball", label: "⚾ MULTI-BALL", color: "#f59e0b" },
      { type: "fireball", label: "🔥 FIREBALL", color: "#ef4444" },
      { type: "shield", label: "🛡️ SHIELD", color: "#10b981" },
      { type: "magnet", label: "🧲 MAGNET", color: "#8b5cf6" },
      { type: "extralife", label: "❤️ EXTRA LIFE", color: "#f43f5e" },
      { type: "slow", label: "⏳ SLOW-MO", color: "#06b6d4" },
      { type: "multiplier", label: "💎 2X SCORE", color: "#fbbf24" }
    ]

    const selected = types[Math.floor(Math.random() * types.length)]
    gs.current.powerDrops.push({
      id: Math.random().toString(),
      x,
      y,
      vy: 2.2,
      type: selected.type,
      radius: 12,
      color: selected.color,
      label: selected.label
    })
  }

  // Trigger Bomb Explosion
  const triggerBombExplosion = (row: number, col: number) => {
    playSound("bomb")
    gs.current.screenShake = 12
    const bricks = gs.current.bricks

    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        const b = bricks.find((bk) => bk.row === r && bk.col === c && bk.visible && bk.type !== "metal")
        if (b) {
          b.visible = false
          createParticles(b.x + b.width / 2, b.y + b.height / 2, "#ff0055", 16)
          const pts = (b.points || 20) * gs.current.scoreMultiplier
          gs.current.score += pts
          createFloatingText(b.x + b.width / 2, b.y, `+${pts}`, "#ff0055")
        }
      }
    }
  }

  // Main Physics & Update Loop
  const updateGame = useCallback(() => {
    if (gsRef.current !== "playing" || gs.current.isPaused) return

    const { paddle, balls, bricks, powerDrops, bullets, particles, floatingTexts, keys } = gs.current
    const cfg = DIFFICULTY_SETTINGS[difficulty]

    // Handle Timers & Active Status
    if (paddle.laserActive) {
      paddle.laserTimer -= 1
      if (paddle.laserTimer <= 0) paddle.laserActive = false
    }
    if (paddle.magnetActive) {
      paddle.magnetTimer -= 1
      if (paddle.magnetTimer <= 0) paddle.magnetActive = false
    }
    if (paddle.expandTimer > 0) {
      paddle.expandTimer -= 1
      if (paddle.expandTimer <= 0) paddle.width = cfg.paddleWidth
    }
    if (gs.current.multiplierTimer > 0) {
      gs.current.multiplierTimer -= 1
      if (gs.current.multiplierTimer <= 0) gs.current.scoreMultiplier = 1
    }
    if (gs.current.slowTimer > 0) {
      gs.current.slowTimer -= 1
    }

    // Keyboard Paddle Movement
    if (["arrowleft", "a"].some((k) => keys.has(k))) {
      paddle.x = Math.max(0, paddle.x - PADDLE_SPEED)
    }
    if (["arrowright", "d"].some((k) => keys.has(k))) {
      paddle.x = Math.min(CANVAS_WIDTH - paddle.width, paddle.x + PADDLE_SPEED)
    }

    // Screen Shake decay
    if (gs.current.screenShake > 0) gs.current.screenShake *= 0.85

    // Bullets Logic
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      b.y += b.vy
      let hit = false

      // Check Brick Collision
      for (const brick of bricks) {
        if (
          brick.visible &&
          b.x >= brick.x &&
          b.x <= brick.x + brick.width &&
          b.y >= brick.y &&
          b.y <= brick.y + brick.height
        ) {
          hit = true
          if (brick.type !== "metal") {
            brick.hp -= 1
            if (brick.hp <= 0) {
              brick.visible = false
              playSound("brick")
              createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color)
              const pts = brick.points * gs.current.scoreMultiplier
              gs.current.score += pts
              setScore(gs.current.score)
              createFloatingText(brick.x + brick.width / 2, brick.y, `+${pts}`)
              if (brick.type === "powerup") spawnPowerDrop(brick.x + brick.width / 2, brick.y)
              if (brick.type === "bomb") triggerBombExplosion(brick.row, brick.col)
            }
          } else {
            playSound("metal")
            createParticles(b.x, b.y, "#94a3b8", 4)
          }
          break
        }
      }

      if (hit || b.y < 0) bullets.splice(i, 1)
    }

    // Balls Physics & Collisions
    const speedMult = gs.current.slowTimer > 0 ? 0.65 : 1.0

    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i]

      // Stuck on magnet or start
      if (ball.isStuck) {
        ball.x = paddle.x + paddle.width / 2 + ball.offsetX
        ball.y = paddle.y - ball.radius - 1
        continue
      }

      // Fireball timer
      if (ball.isFireball) {
        ball.fireTimer -= 1
        if (ball.fireTimer <= 0) {
          ball.isFireball = false
          ball.color = "#ffffff"
        }
      }

      // Trail effect
      ball.trail.push({ x: ball.x, y: ball.y })
      if (ball.trail.length > 8) ball.trail.shift()

      // Position update
      ball.x += ball.vx * speedMult
      ball.y += ball.vy * speedMult

      // Wall bouncing
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius
        ball.vx *= -1
        playSound("paddle", 0.9)
      } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius
        ball.vx *= -1
        playSound("paddle", 0.9)
      }
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius
        ball.vy *= -1
        playSound("paddle", 0.9)
      }

      // Paddle Collision
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x - 4 &&
        ball.x <= paddle.x + paddle.width + 4
      ) {
        if (paddle.magnetActive) {
          ball.isStuck = true
          ball.offsetX = ball.x - (paddle.x + paddle.width / 2)
          playSound("powerup")
        } else {
          // Curved hit deflection
          const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)
          const angle = hitPos * (Math.PI / 3) // max 60 deg deflection
          const currentSpeed = Math.hypot(ball.vx, ball.vy)
          ball.vx = currentSpeed * Math.sin(angle)
          ball.vy = -currentSpeed * Math.cos(angle)
          playSound("paddle", 1 + Math.abs(hitPos) * 0.3)
          createParticles(ball.x, paddle.y, "#ffffff", 6)
          gs.current.combo = 0
          setCombo(0)
        }
      }

      // Brick Collisions
      for (const brick of bricks) {
        if (!brick.visible) continue

        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          if (!ball.isFireball) {
            // Reflect ball vector based on penetration depth
            const overlapLeft = ball.x + ball.radius - brick.x
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius)
            const overlapTop = ball.y + ball.radius - brick.y
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius)

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
              ball.vx *= -1
            } else {
              ball.vy *= -1
            }
          }

          if (brick.type === "metal") {
            playSound("metal")
            createParticles(ball.x, ball.y, "#94a3b8", 8)
          } else {
            brick.hp -= 1
            if (brick.hp <= 0) {
              brick.visible = false
              gs.current.combo += 1
              gs.current.maxCombo = Math.max(gs.current.maxCombo, gs.current.combo)
              setCombo(gs.current.combo)

              const comboMult = 1 + Math.min(5, Math.floor(gs.current.combo / 3)) * 0.2
              const pts = Math.round(brick.points * comboMult * gs.current.scoreMultiplier)

              gs.current.score += pts
              setScore(gs.current.score)
              playSound("brick", comboMult)
              createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 12)

              const comboLabel = gs.current.combo > 2 ? `+${pts} (${gs.current.combo}x COMBO!)` : `+${pts}`
              createFloatingText(brick.x + brick.width / 2, brick.y, comboLabel, brick.color)

              if (brick.type === "powerup" || Math.random() < cfg.dropRate) {
                spawnPowerDrop(brick.x + brick.width / 2, brick.y)
              }
              if (brick.type === "bomb") {
                triggerBombExplosion(brick.row, brick.col)
              }
            } else {
              // Damaged durable brick
              playSound("metal", 1.5)
              createParticles(ball.x, ball.y, brick.color, 6)
            }
          }
          break
        }
      }

      // Safety Floor catch
      if (gs.current.safetyFloor && ball.y + ball.radius >= CANVAS_HEIGHT - 10) {
        ball.vy *= -1
        gs.current.safetyFloor = false
        playSound("powerup")
        createFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30, "SHIELD SAVED!", "#10b981")
      }

      // Ball lost below bottom
      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        balls.splice(i, 1)
      }
    }

    // Handle Life Loss / Respawn if all balls lost
    if (balls.length === 0) {
      gs.current.lives -= 1
      setLives(gs.current.lives)
      playSound("life")

      if (gs.current.lives <= 0) {
        gsRef.current = "gameover"
        setGameState("gameover")
        playSound("gameover")
        setHighScore((prev) => {
          const newHigh = Math.max(prev, gs.current.score)
          try {
            localStorage.setItem("breakout_high_score", newHigh.toString())
          } catch {}
          return newHigh
        })
        return
      } else {
        // Respawn single ball
        gs.current.balls = [createInitialBall(paddle.width, cfg.ballSpeed)]
      }
    }

    // Power Drops Update & Paddle Catch
    for (let i = powerDrops.length - 1; i >= 0; i--) {
      const pd = powerDrops[i]
      pd.y += pd.vy

      // Check collision with paddle
      if (
        pd.y + pd.radius >= paddle.y &&
        pd.y - pd.radius <= paddle.y + paddle.height &&
        pd.x >= paddle.x &&
        pd.x <= paddle.x + paddle.width
      ) {
        playSound("powerup")
        createParticles(pd.x, pd.y, pd.color, 14)
        createFloatingText(pd.x, paddle.y - 10, pd.label, pd.color)

        // Apply Powerup Effects
        if (pd.type === "laser") {
          paddle.laserActive = true
          paddle.laserTimer = 480 // 8 sec
        } else if (pd.type === "expand") {
          paddle.width = Math.min(CANVAS_WIDTH * 0.35, cfg.paddleWidth * 1.5)
          paddle.expandTimer = 600
        } else if (pd.type === "multiball") {
          if (balls.length > 0) {
            const b = balls[0]
            balls.push({
              id: gs.current.nextBallId++,
              x: b.x,
              y: b.y,
              vx: -b.vx || cfg.ballSpeed * 0.7,
              vy: b.vy || -cfg.ballSpeed,
              speed: b.speed,
              radius: BALL_RADIUS,
              isFireball: false,
              fireTimer: 0,
              isStuck: false,
              offsetX: 0,
              color: "#f59e0b",
              trail: []
            })
            balls.push({
              id: gs.current.nextBallId++,
              x: b.x,
              y: b.y,
              vx: b.vx * 0.5,
              vy: -Math.abs(b.vy),
              speed: b.speed,
              radius: BALL_RADIUS,
              isFireball: false,
              fireTimer: 0,
              isStuck: false,
              offsetX: 0,
              color: "#3b82f6",
              trail: []
            })
          }
        } else if (pd.type === "fireball") {
          balls.forEach((b) => {
            b.isFireball = true
            b.fireTimer = 420
            b.color = "#ef4444"
          })
        } else if (pd.type === "shield") {
          gs.current.safetyFloor = true
        } else if (pd.type === "magnet") {
          paddle.magnetActive = true
          paddle.magnetTimer = 500
        } else if (pd.type === "extralife") {
          gs.current.lives += 1
          setLives(gs.current.lives)
        } else if (pd.type === "slow") {
          gs.current.slowTimer = 450
        } else if (pd.type === "multiplier") {
          gs.current.scoreMultiplier = 2
          gs.current.multiplierTimer = 500
        }

        powerDrops.splice(i, 1)
        continue
      }

      if (pd.y > CANVAS_HEIGHT) powerDrops.splice(i, 1)
    }

    // Particles Update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.alpha -= p.decay
      if (p.alpha <= 0) particles.splice(i, 1)
    }

    // Floating Text Update
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i]
      ft.y += ft.vy
      ft.alpha -= 0.02
      if (ft.alpha <= 0) floatingTexts.splice(i, 1)
    }

    // Update Active Power-Ups State List for HUD
    const activeList: string[] = []
    if (paddle.laserActive) activeList.push("⚡ LASER")
    if (paddle.expandTimer > 0) activeList.push("🏓 EXPAND")
    if (paddle.magnetActive) activeList.push("🧲 MAGNET")
    if (gs.current.safetyFloor) activeList.push("🛡️ SHIELD")
    if (gs.current.scoreMultiplier > 1) activeList.push("💎 2X MULTI")
    if (gs.current.slowTimer > 0) activeList.push("⏳ SLOW-MO")
    if (balls.some((b) => b.isFireball)) activeList.push("🔥 FIREBALL")

    setActivePowerUps(activeList)

    // Check Level Clear Condition (all non-metal bricks destroyed)
    const remainingBreakable = bricks.filter((b) => b.visible && b.type !== "metal")
    if (remainingBreakable.length === 0) {
      if (gs.current.level < MAX_LEVELS) {
        playSound("win")
        const nextLvl = gs.current.level + 1
        initGame(nextLvl, gs.current.score + 500)
        createFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `STAGE ${nextLvl} CLEAR! +500 PTS`, "#10b981")
      } else {
        gsRef.current = "victory"
        setGameState("victory")
        playSound("win")
        setHighScore((prev) => {
          const newHigh = Math.max(prev, gs.current.score)
          try {
            localStorage.setItem("breakout_high_score", newHigh.toString())
          } catch {}
          return newHigh
        })
      }
    }
  }, [difficulty, initGame, playSound])

  // Canvas Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()

    // Apply Screen Shake Offset
    if (gs.current.screenShake > 0.5) {
      const shakeX = (Math.random() - 0.5) * gs.current.screenShake
      const shakeY = (Math.random() - 0.5) * gs.current.screenShake
      ctx.translate(shakeX, shakeY)
    }

    // Dark Cyber Grid Background
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw Subtle Neon Grid Lines
    ctx.strokeStyle = "rgba(51, 65, 85, 0.3)"
    ctx.lineWidth = 1
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
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

    const { paddle, balls, bricks, powerDrops, bullets, particles, floatingTexts } = gs.current

    // Safety Floor Line
    if (gs.current.safetyFloor) {
      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 4
      ctx.shadowColor = "#10b981"
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(0, CANVAS_HEIGHT - 6)
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 6)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Render Bricks
    bricks.forEach((b) => {
      if (!b.visible) return

      ctx.shadowColor = b.color
      ctx.shadowBlur = b.type === "powerup" || b.type === "bomb" ? 10 : 4
      ctx.fillStyle = b.color

      // Rounded Brick Box
      const r = 4
      ctx.beginPath()
      ctx.roundRect(b.x, b.y, b.width, b.height, r)
      ctx.fill()

      // Brick Inner Border / Texture
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Render Multi-HP Cracks or Metal Texture
      if (b.type === "durable" && b.hp < b.maxHp) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(b.x + 5, b.y + 3)
        ctx.lineTo(b.x + b.width - 8, b.y + b.height - 4)
        ctx.stroke()
      } else if (b.type === "bomb") {
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("💣", b.x + b.width / 2, b.y + b.height / 2 + 3)
      } else if (b.type === "powerup") {
        ctx.fillStyle = "#000000"
        ctx.font = "bold 10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("★", b.x + b.width / 2, b.y + b.height / 2 + 3)
      } else if (b.type === "metal") {
        ctx.fillStyle = "#cbd5e1"
        ctx.beginPath()
        ctx.arc(b.x + 6, b.y + 6, 2, 0, Math.PI * 2)
        ctx.arc(b.x + b.width - 6, b.y + b.height - 6, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    ctx.shadowBlur = 0

    // Render Laser Bullets
    bullets.forEach((bullet) => {
      ctx.fillStyle = "#ec4899"
      ctx.shadowColor = "#ec4899"
      ctx.shadowBlur = 8
      ctx.fillRect(bullet.x - 2, bullet.y, 4, 10)
    })
    ctx.shadowBlur = 0

    // Render Power Drops
    powerDrops.forEach((pd) => {
      ctx.fillStyle = pd.color
      ctx.shadowColor = pd.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(pd.x, pd.y, pd.radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 9px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(pd.label.split(" ")[0], pd.x, pd.y + 3)
    })
    ctx.shadowBlur = 0

    // Render Paddle
    const paddleGlow = paddle.laserActive ? "#ec4899" : paddle.magnetActive ? "#8b5cf6" : themeColor
    ctx.fillStyle = paddleGlow
    ctx.shadowColor = paddleGlow
    ctx.shadowBlur = 12

    ctx.beginPath()
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8)
    ctx.fill()
    ctx.shadowBlur = 0

    // Laser Cannons on Paddle Corners
    if (paddle.laserActive) {
      ctx.fillStyle = "#f43f5e"
      ctx.fillRect(paddle.x + 4, paddle.y - 6, 6, 8)
      ctx.fillRect(paddle.x + paddle.width - 10, paddle.y - 6, 6, 8)
    }

    // Render Aim Line (Easy Difficulty or Stuck Ball)
    const cfg = DIFFICULTY_SETTINGS[difficulty]
    balls.forEach((ball) => {
      if ((cfg.showAimLine || ball.isStuck) && ball.isStuck) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)"
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(ball.x, ball.y)
        ctx.lineTo(ball.x, ball.y - 120)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Render Ball Trails
      ball.trail.forEach((pos, idx) => {
        const alpha = (idx + 1) / ball.trail.length * 0.4
        ctx.fillStyle = ball.isFireball ? `rgba(239, 68, 68, ${alpha})` : `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, ball.radius * 0.8, 0, Math.PI * 2)
        ctx.fill()
      })

      // Render Ball Body
      ctx.fillStyle = ball.color
      ctx.shadowColor = ball.isFireball ? "#ef4444" : "#ffffff"
      ctx.shadowBlur = ball.isFireball ? 16 : 8
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Render Particles
    particles.forEach((p) => {
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0

    // Render Floating Text
    floatingTexts.forEach((ft) => {
      ctx.fillStyle = ft.color
      ctx.globalAlpha = Math.max(0, ft.alpha)
      ctx.font = "bold 13px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(ft.text, ft.x, ft.y)
    })
    ctx.globalAlpha = 1.0

    // Paused Overlay Canvas Text
    if (gs.current.isPaused) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 36px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
      ctx.font = "14px sans-serif"
      ctx.fillStyle = "#94a3b8"
      ctx.fillText("Press P or Space to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }

    ctx.restore()
  }, [difficulty, themeColor])

  // Main Loop Tick
  const gameLoop = useCallback(() => {
    updateGame()
    render()
    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, render])

  useEffect(() => {
    if (gameState === "playing") {
      animFrameRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameState, gameLoop])

  // Key Bindings & Mouse Event Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gs.current.keys.add(e.key.toLowerCase())

      if (gsRef.current === "playing") {
        if (e.key === "p" || e.key === "P") {
          e.preventDefault()
          gs.current.isPaused = !gs.current.isPaused
          setGameState(gs.current.isPaused ? "paused" : "playing")
        } else if (e.key === " ") {
          e.preventDefault()
          launchStuckBalls()
          fireLasers()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      gs.current.keys.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [launchStuckBalls, fireLasers])

  // Mouse Move Paddle Tracking & Click Launch/Fire
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlType !== "mouse" || gsRef.current !== "playing" || gs.current.isPaused) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const mouseX = (e.clientX - rect.left) * scaleX

    gs.current.paddle.x = Math.max(
      0,
      Math.min(CANVAS_WIDTH - gs.current.paddle.width, mouseX - gs.current.paddle.width / 2)
    )
  }

  const handleCanvasClick = () => {
    if (gsRef.current === "playing" && !gs.current.isPaused) {
      launchStuckBalls()
      fireLasers()
    }
  }

  // Touch Move Control for Mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gsRef.current !== "playing" || gs.current.isPaused) return
    const canvas = canvasRef.current
    if (!canvas || !e.touches[0]) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const touchX = (e.touches[0].clientX - rect.left) * scaleX

    gs.current.paddle.x = Math.max(
      0,
      Math.min(CANVAS_WIDTH - gs.current.paddle.width, touchX - gs.current.paddle.width / 2)
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="icon"
              className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl text-white shadow-lg"
              style={{ backgroundColor: themeColor, boxShadow: `0 0 15px ${themeColor}66` }}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                BREAKOUT <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">NEON ARCADE</span>
              </h1>
              <p className="text-xs text-slate-400">Smash neon bricks, collect power-ups & beat all stages</p>
            </div>
          </div>
        </div>

        {/* Audio & Control Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setSoundEnabled((prev) => !prev)}
            variant="outline"
            size="icon"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
            title={soundEnabled ? "Mute SFX" : "Unmute SFX"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </Button>

          <Button
            onClick={() => setControlType((prev) => (prev === "mouse" ? "keyboard" : "mouse"))}
            variant="outline"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
          >
            {controlType === "mouse" ? <MousePointer className="w-3.5 h-3.5 text-cyan-400" /> : <Keyboard className="w-3.5 h-3.5 text-amber-400" />}
            {controlType === "mouse" ? "Mouse Control" : "Key Control"}
          </Button>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
        {/* HUD Top Strip */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/80 border-b border-slate-800 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">STAGE:</span>
              <span className="font-bold text-purple-400">{level} / {MAX_LEVELS}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 font-medium mr-1">LIVES:</span>
              {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                <Heart key={i} className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
              ))}
            </div>
            {combo > 1 && (
              <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-bold text-amber-300">
                <Flame className="w-3.5 h-3.5" /> {combo}x COMBO
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 font-mono">
            <div>
              <span className="text-xs text-slate-400 font-sans mr-2">SCORE:</span>
              <span className="text-lg font-bold text-emerald-400">{score}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-sans mr-2">BEST:</span>
              <span className="text-lg font-bold text-amber-400">{highScore}</span>
            </div>
          </div>
        </div>

        {/* Active Power-Ups Badge Bar */}
        {activePowerUps.length > 0 && (
          <div className="absolute top-14 left-4 z-10 flex flex-wrap gap-1.5 max-w-md my-auto pointer-events-none">
            {activePowerUps.map((p, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 border border-purple-500/40 text-purple-300 shadow-md backdrop-blur-sm animate-pulse"
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Interactive Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          onTouchMove={handleTouchMove}
          onTouchStart={handleCanvasClick}
          className={`block ${controlType === "mouse" ? "cursor-none" : "cursor-default"}`}
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {/* MENU OVERLAY */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-20 flex items-center justify-start overflow-y-auto bg-slate-950/95 backdrop-blur-md p-6">
            <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800 text-slate-100 p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div
                  className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}88` }}
                >
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wide">SELECT DIFFICULTY</h2>
                <p className="text-xs text-slate-400 mt-1">Choose your preferred difficulty mode to start</p>
              </div>

              {/* Difficulty Selection Cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((key) => {
                  const item = DIFFICULTY_SETTINGS[key]
                  const isSelected = difficulty === key
                  return (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-slate-800/90 border-purple-500 shadow-lg scale-[1.02]"
                          : "bg-slate-950/50 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm" style={{ color: item.color }}>
                          {item.label}
                        </span>
                        {isSelected && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                    </button>
                  )
                })}
              </div>

              {/* Instructions */}
              <div className="bg-slate-950/80 rounded-xl p-3 text-xs text-slate-300 space-y-1 mb-6 border border-slate-800">
                <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" /> Controls & Power-Ups
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                  <div>• <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Mouse</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">← →</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">A D</kbd> to move</div>
                  <div>• <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Click</kbd> Launch / Fire Lasers</div>
                  <div>• <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">P</kbd> Pause game</div>
                  <div>• Collect falling neon power-up capsules!</div>
                </div>
              </div>

              <Button
                onClick={startGame}
                style={{ backgroundColor: themeColor }}
                className="w-full py-6 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg"
              >
                <Play className="w-5 h-5 mr-2 fill-current" /> START GAME
              </Button>
            </Card>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 z-20 flex items-center justify-start overflow-y-auto bg-slate-950/95 backdrop-blur-md p-6">
            <Card className="w-full max-w-md bg-slate-900/90 border-slate-800 text-slate-100 p-6 text-center shadow-2xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ZapOff className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">GAME OVER</h2>
              <p className="text-xs text-slate-400 mb-6">You ran out of lives on Stage {level}</p>

              <div className="bg-slate-950/80 rounded-xl p-4 mb-6 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Final Score</span>
                  <span className="font-mono font-bold text-lg text-emerald-400">{score}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Best High Score</span>
                  <span className="font-mono font-bold text-amber-400">{highScore}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Max Combo Streak</span>
                  <span className="font-mono font-bold text-purple-400">{gs.current.maxCombo}x</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={startGame}
                  style={{ backgroundColor: themeColor }}
                  className="flex-1 py-5 text-white font-bold hover:opacity-90"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> TRY AGAIN
                </Button>
                <Button
                  onClick={() => setGameState("menu")}
                  variant="outline"
                  className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
                >
                  MENU
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {gameState === "victory" && (
          <div className="absolute inset-0 z-20 flex items-center justify-start overflow-y-auto bg-slate-950/95 backdrop-blur-md p-6">
            <Card className="w-full max-w-md bg-slate-900/90 border-slate-800 text-slate-100 p-6 text-center shadow-2xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-bounce">
                <Trophy className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-amber-300 mb-1">VICTORY CHAMPION!</h2>
              <p className="text-xs text-slate-400 mb-6">You shattered all {MAX_LEVELS} brick stages!</p>

              <div className="bg-slate-950/80 rounded-xl p-4 mb-6 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Final Score</span>
                  <span className="font-mono font-bold text-2xl text-emerald-400">{score}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">All Time Best</span>
                  <span className="font-mono font-bold text-amber-400">{highScore}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Max Combo Streak</span>
                  <span className="font-mono font-bold text-purple-400">{gs.current.maxCombo}x</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={startGame}
                  style={{ backgroundColor: themeColor }}
                  className="flex-1 py-5 text-white font-bold hover:opacity-90"
                >
                  PLAY AGAIN
                </Button>
                <Button
                  onClick={() => setGameState("menu")}
                  variant="outline"
                  className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
                >
                  MENU
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Bottom Touch Fire Action Button for Mobile */}
        {gameState === "playing" && (
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">P</kbd> to Pause</span>
              <span>•</span>
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Click</kbd> Fire</span>
            </div>

            <Button
              onClick={() => {
                launchStuckBalls()
                fireLasers()
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4"
            >
              <Zap className="w-3.5 h-3.5 mr-1" /> FIRE / LAUNCH
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
