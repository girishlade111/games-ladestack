"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  PawPrint,
  Trophy,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Shield,
  Zap,
  Sparkles,
  Clock,
  Magnet,
  ArrowUp,
  ArrowDown,
  Heart
} from "lucide-react"

// --- AUDIO SYNTHESIZER ---
class SoundEffects {
  private ctx: AudioContext | null = null
  public muted: boolean = false

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  playJump() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(260, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.15)
    } catch {
      // Ignore audio errors
    }
  }

  playDoubleJump() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(450, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(950, this.ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.18)
    } catch {
      // Ignore audio errors
    }
  }

  playDuck() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(350, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.12)
    } catch {
      // Ignore audio errors
    }
  }

  playCollect() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + idx * 0.04)
        gain.gain.setValueAtTime(0.18, now + idx * 0.04)
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.04 + 0.08)
        osc.connect(gain)
        gain.connect(this.ctx!.destination)
        osc.start(now + idx * 0.04)
        osc.stop(now + idx * 0.04 + 0.08)
      })
    } catch {
      // Ignore audio errors
    }
  }

  playPowerup() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, now + idx * 0.05)
        gain.gain.setValueAtTime(0.25, now + idx * 0.05)
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.05 + 0.12)
        osc.connect(gain)
        gain.connect(this.ctx!.destination)
        osc.start(now + idx * 0.05)
        osc.stop(now + idx * 0.05 + 0.12)
      })
    } catch {
      // Ignore audio errors
    }
  }

  playHit() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(160, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25)
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.25)
    } catch {
      // Ignore audio errors
    }
  }

  playMilestone() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + idx * 0.06)
        gain.gain.setValueAtTime(0.25, now + idx * 0.06)
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.15)
        osc.connect(gain)
        gain.connect(this.ctx!.destination)
        osc.start(now + idx * 0.06)
        osc.stop(now + idx * 0.06 + 0.15)
      })
    } catch {
      // Ignore audio errors
    }
  }
}

const sfx = new SoundEffects()

// --- GAME CONFIG & CONSTANTS ---
export type DifficultyMode = "easy" | "medium" | "hard" | "insane"

interface DifficultyConfig {
  name: string
  label: string
  description: string
  initialSpeed: number
  maxSpeed: number
  speedAcc: number
  lives: number
  obstacleSpacing: number
  powerupFrequency: number
  defaultDoubleJump: boolean
  hasRollingHay: boolean
  hasStorm: boolean
  color: string
}

const DIFFICULTY_SETTINGS: Record<DifficultyMode, DifficultyConfig> = {
  easy: {
    name: "easy",
    label: "Peaceful Pasture",
    description: "Relaxed pace, 3 lives, double-jump default, frequent power-ups.",
    initialSpeed: 5.5,
    maxSpeed: 13,
    speedAcc: 0.0012,
    lives: 3,
    obstacleSpacing: 380,
    powerupFrequency: 0.004,
    defaultDoubleJump: true,
    hasRollingHay: false,
    hasStorm: false,
    color: "#22c55e",
  },
  medium: {
    name: "medium",
    label: "Wild Meadow",
    description: "Classic runner experience, balanced obstacles & power-ups.",
    initialSpeed: 7.0,
    maxSpeed: 17,
    speedAcc: 0.0022,
    lives: 1,
    obstacleSpacing: 310,
    powerupFrequency: 0.0028,
    defaultDoubleJump: false,
    hasRollingHay: false,
    hasStorm: false,
    color: "#3b82f6",
  },
  hard: {
    name: "hard",
    label: "Wolf Mountain",
    description: "High speed, fast night cycles, rolling hay bales & agile wolves.",
    initialSpeed: 9.0,
    maxSpeed: 21,
    speedAcc: 0.0035,
    lives: 1,
    obstacleSpacing: 250,
    powerupFrequency: 0.002,
    defaultDoubleJump: false,
    hasRollingHay: true,
    hasStorm: false,
    color: "#f59e0b",
  },
  insane: {
    name: "insane",
    label: "Stormy Ridge",
    description: "Blistering speed, stormy rain, lightning flashes & tight spacing.",
    initialSpeed: 11.5,
    maxSpeed: 26,
    speedAcc: 0.0048,
    lives: 1,
    obstacleSpacing: 200,
    powerupFrequency: 0.0014,
    defaultDoubleJump: false,
    hasRollingHay: true,
    hasStorm: true,
    color: "#ef4444",
  },
}

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 500
const GROUND_Y = 410

const NORMAL_WIDTH = 54
const NORMAL_HEIGHT = 50
const DUCK_WIDTH = 64
const DUCK_HEIGHT = 32
const GRAVITY = 0.85
const JUMP_FORCE = -17.5

type PowerUpType = "shield" | "multiplier" | "magnet" | "spring" | "slowmo"

interface SheepPlayer {
  x: number
  y: number
  vy: number
  width: number
  height: number
  onGround: boolean
  isDucking: boolean
  animFrame: number
  canDoubleJump: boolean
  hasDoubleJumped: boolean
  invincibleTimer: number
}

interface Hazard {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: "bush" | "rock" | "fence" | "wolf" | "eagle" | "hay"
  speedMultiplier?: number
  animFrame: number
}

interface ItemCollectable {
  id: number
  x: number
  y: number
  type: "clover" | "star" | PowerUpType
  collected: boolean
  pulse: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

interface ActivePowerUp {
  type: PowerUpType
  duration: number
  maxDuration: number
}

export default function SheepRunGame({
  onBack,
  themeColor = "#374151",
}: {
  onBack?: () => void
  themeColor?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number | null>(null)

  // Game UI state
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu")
  const [difficulty, setDifficulty] = useState<DifficultyMode>("medium")
  const [isMuted, setIsMuted] = useState(false)
  const [score, setScore] = useState(0)
  const [highScores, setHighScores] = useState<Record<DifficultyMode, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
    insane: 0,
  })
  const [lives, setLives] = useState(1)
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([])
  const [cloversCollected, setCloversCollected] = useState(0)

  // Refs for animation & mutable physics state
  const gameStateRef = useRef<"menu" | "playing" | "paused" | "gameOver">("menu")
  const difficultyRef = useRef<DifficultyMode>("medium")
  const isMutedRef = useRef(false)

  const engineRef = useRef({
    sheep: {
      x: 90,
      y: GROUND_Y - NORMAL_HEIGHT,
      vy: 0,
      width: NORMAL_WIDTH,
      height: NORMAL_HEIGHT,
      onGround: true,
      isDucking: false,
      animFrame: 0,
      canDoubleJump: false,
      hasDoubleJumped: false,
      invincibleTimer: 0,
    } as SheepPlayer,
    hazards: [] as Hazard[],
    items: [] as ItemCollectable[],
    particles: [] as Particle[],
    activePowerUps: [] as ActivePowerUp[],
    speed: 7,
    distance: 0,
    score: 0,
    cloversCount: 0,
    lives: 1,
    hazardIdCounter: 0,
    itemIdCounter: 0,
    lastMilestoneScore: 0,
    dayTime: 0, // 0 to 1 cycle
    weatherRain: [] as { x: number; y: number; speed: number; len: number }[],
    keys: {
      up: false,
      down: false,
    },
  })

  // Load high scores from localStorage
  useEffect(() => {
    try {
      const savedEasy = localStorage.getItem("sheep_run_hs_easy")
      const savedMedium = localStorage.getItem("sheep_run_hs_medium")
      const savedHard = localStorage.getItem("sheep_run_hs_hard")
      const savedInsane = localStorage.getItem("sheep_run_hs_insane")
      setHighScores({
        easy: savedEasy ? parseInt(savedEasy, 10) : 0,
        medium: savedMedium ? parseInt(savedMedium, 10) : 0,
        hard: savedHard ? parseInt(savedHard, 10) : 0,
        insane: savedInsane ? parseInt(savedInsane, 10) : 0,
      })
    } catch {
      // Local storage fallback
    }
  }, [])

  // Sync mute state to audio synth
  useEffect(() => {
    sfx.muted = isMuted
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  // --- SPAWN HELPER FUNCTIONS ---
  const spawnHazard = useCallback((minX: number) => {
    const eng = engineRef.current
    const cfg = DIFFICULTY_SETTINGS[difficultyRef.current]
    const rand = Math.random()

    let type: Hazard["type"] = "bush"
    let width = 45
    let height = 40
    let y = GROUND_Y - height

    if (rand < 0.3) {
      type = "bush"
      width = Math.random() > 0.5 ? 65 : 44
      height = 42
      y = GROUND_Y - height
    } else if (rand < 0.5) {
      if (Math.random() > 0.5) {
        type = "fence"
        width = 52
        height = 44
        y = GROUND_Y - height
      } else {
        type = "rock"
        width = 46
        height = 38
        y = GROUND_Y - height
      }
    } else if (rand < 0.75) {
      type = "wolf"
      width = 64
      height = 40
      y = GROUND_Y - height
    } else if (cfg.hasRollingHay && Math.random() > 0.5) {
      type = "hay"
      width = 48
      height = 48
      y = GROUND_Y - height
    } else {
      type = "eagle"
      width = 56
      height = 36
      const flightHeight = Math.random() > 0.55 ? 120 : 65
      y = GROUND_Y - flightHeight
    }

    eng.hazards.push({
      id: eng.hazardIdCounter++,
      x: minX,
      y,
      width,
      height,
      type,
      animFrame: 0,
      speedMultiplier: type === "wolf" ? 1.15 : type === "hay" ? 1.25 : 1.0,
    })
  }, [])

  const spawnItem = useCallback((x: number) => {
    const eng = engineRef.current
    const cfg = DIFFICULTY_SETTINGS[difficultyRef.current]
    const roll = Math.random()

    let type: ItemCollectable["type"] = "clover"
    if (roll < cfg.powerupFrequency) {
      const pTypes: PowerUpType[] = ["shield", "multiplier", "magnet", "spring", "slowmo"]
      type = pTypes[Math.floor(Math.random() * pTypes.length)]
    } else if (Math.random() < 0.25) {
      type = "star"
    }

    const itemY = GROUND_Y - (70 + Math.random() * 110)
    eng.items.push({
      id: eng.itemIdCounter++,
      x,
      y: itemY,
      type,
      collected: false,
      pulse: 0,
    })
  }, [])

  const createParticles = useCallback((x: number, y: number, color: string, count = 8, speedScale = 1) => {
    const eng = engineRef.current
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (1 + Math.random() * 4) * speedScale
      eng.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 20,
      })
    }
  }, [])

  // --- INIT GAME ENGINE ---
  const initEngine = useCallback(() => {
    const cfg = DIFFICULTY_SETTINGS[difficultyRef.current]

    const rain = []
    if (cfg.hasStorm) {
      for (let i = 0; i < 60; i++) {
        rain.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          speed: 12 + Math.random() * 8,
          len: 12 + Math.random() * 10,
        })
      }
    }

    engineRef.current = {
      sheep: {
        x: 90,
        y: GROUND_Y - NORMAL_HEIGHT,
        vy: 0,
        width: NORMAL_WIDTH,
        height: NORMAL_HEIGHT,
        onGround: true,
        isDucking: false,
        animFrame: 0,
        canDoubleJump: cfg.defaultDoubleJump,
        hasDoubleJumped: false,
        invincibleTimer: 0,
      },
      hazards: [],
      items: [],
      particles: [],
      activePowerUps: [],
      speed: cfg.initialSpeed,
      distance: 0,
      score: 0,
      cloversCount: 0,
      lives: cfg.lives,
      hazardIdCounter: 0,
      itemIdCounter: 0,
      lastMilestoneScore: 0,
      dayTime: 0,
      weatherRain: rain,
      keys: { up: false, down: false },
    }

    setScore(0)
    setLives(cfg.lives)
    setCloversCollected(0)
    setActivePowerUps([])

    spawnHazard(CANVAS_WIDTH + 150)
    spawnItem(CANVAS_WIDTH + 300)
  }, [spawnHazard, spawnItem])

  // --- USER CONTROLS: JUMP & DUCK ---
  const handleJump = useCallback(() => {
    if (gameStateRef.current !== "playing") return
    const eng = engineRef.current
    const sheep = eng.sheep
    const hasSpring = eng.activePowerUps.some((p) => p.type === "spring")
    const cfg = DIFFICULTY_SETTINGS[difficultyRef.current]

    if (sheep.onGround) {
      sheep.vy = JUMP_FORCE
      sheep.onGround = false
      sheep.canDoubleJump = cfg.defaultDoubleJump || hasSpring
      sheep.hasDoubleJumped = false
      sfx.playJump()
      createParticles(sheep.x + sheep.width / 2, sheep.y + sheep.height, "#d1d5db", 8)
    } else if ((sheep.canDoubleJump || hasSpring) && !sheep.hasDoubleJumped) {
      sheep.vy = JUMP_FORCE * 0.92
      sheep.hasDoubleJumped = true
      sfx.playDoubleJump()
      createParticles(sheep.x + sheep.width / 2, sheep.y + sheep.height, "#f59e0b", 12, 1.3)
    }
  }, [createParticles])

  const handleDuck = useCallback((isDucking: boolean) => {
    if (gameStateRef.current !== "playing") return
    const eng = engineRef.current
    const sheep = eng.sheep

    if (isDucking && !sheep.isDucking) {
      sheep.isDucking = true
      sheep.width = DUCK_WIDTH
      sheep.height = DUCK_HEIGHT
      if (!sheep.onGround) {
        sheep.vy += 8
      }
      sfx.playDuck()
    } else if (!isDucking && sheep.isDucking) {
      sheep.isDucking = false
      sheep.width = NORMAL_WIDTH
      sheep.height = NORMAL_HEIGHT
      sheep.y = GROUND_Y - NORMAL_HEIGHT
    }
  }, [])

  // --- RENDER ENGINE & CANVASES ---
  const render = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const eng = engineRef.current
      const cfg = DIFFICULTY_SETTINGS[difficultyRef.current]

      eng.dayTime = (eng.distance / 2500) % 1
      let skyGradient: CanvasGradient

      if (cfg.hasStorm) {
        skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        skyGradient.addColorStop(0, "#0f172a")
        skyGradient.addColorStop(1, "#1e293b")
      } else if (eng.dayTime < 0.4) {
        skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        skyGradient.addColorStop(0, "#38bdf8")
        skyGradient.addColorStop(1, "#bae6fd")
      } else if (eng.dayTime < 0.6) {
        skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        skyGradient.addColorStop(0, "#fdba74")
        skyGradient.addColorStop(1, "#f43f5e")
      } else {
        skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        skyGradient.addColorStop(0, "#0f172a")
        skyGradient.addColorStop(1, "#1e1b4b")
      }

      ctx.fillStyle = skyGradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // SUN / MOON
      ctx.save()
      const celestialX = ((eng.distance / 10) % (CANVAS_WIDTH + 100)) - 50
      const celestialY = 70 + Math.sin((celestialX / CANVAS_WIDTH) * Math.PI) * -30
      if (eng.dayTime >= 0.6) {
        ctx.fillStyle = "#fef08a"
        ctx.shadowColor = "#fef08a"
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(CANVAS_WIDTH - celestialX, celestialY + 30, 22, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = "#facc15"
        ctx.shadowColor = "#facc15"
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.arc(celestialX, celestialY, 28, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // DISTANT MOUNTAINS
      ctx.fillStyle = eng.dayTime >= 0.6 ? "#1e293b" : "#94a3b8"
      const mtnOffset = (eng.distance * 0.15) % 300
      ctx.beginPath()
      ctx.moveTo(-mtnOffset, GROUND_Y)
      for (let x = -mtnOffset; x < CANVAS_WIDTH + 300; x += 150) {
        ctx.lineTo(x + 75, GROUND_Y - 140)
        ctx.lineTo(x + 150, GROUND_Y)
      }
      ctx.fill()

      // ROLLING GREEN HILLS
      ctx.fillStyle = eng.dayTime >= 0.6 ? "#064e3b" : "#4ade80"
      const hillOffset = (eng.distance * 0.4) % 400
      ctx.beginPath()
      ctx.moveTo(-hillOffset, GROUND_Y)
      for (let x = -hillOffset; x < CANVAS_WIDTH + 400; x += 200) {
        ctx.quadraticCurveTo(x + 100, GROUND_Y - 70, x + 200, GROUND_Y)
      }
      ctx.fill()

      // FOREGROUND FENCES
      ctx.fillStyle = "#b45309"
      const fenceOffset = (eng.distance * 0.8) % 180
      for (let x = -fenceOffset; x < CANVAS_WIDTH + 180; x += 90) {
        ctx.fillRect(x, GROUND_Y - 26, 8, 26)
        ctx.fillRect(x - 45, GROUND_Y - 18, 90, 4)
      }

      // GROUND STRIP
      ctx.fillStyle = "#16a34a"
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 12)
      ctx.fillStyle = "#78350f"
      ctx.fillRect(0, GROUND_Y + 12, CANVAS_WIDTH, CANVAS_HEIGHT - (GROUND_Y + 12))

      ctx.fillStyle = "#a16207"
      const groundOffset = (eng.distance * eng.speed) % 40
      for (let x = -groundOffset; x < CANVAS_WIDTH; x += 40) {
        ctx.fillRect(x, GROUND_Y + 22, 14, 4)
        ctx.fillRect(x + 20, GROUND_Y + 45, 10, 3)
      }

      // RAIN EFFECT
      if (cfg.hasStorm) {
        ctx.strokeStyle = "rgba(203, 213, 225, 0.4)"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        eng.weatherRain.forEach((r) => {
          ctx.moveTo(r.x, r.y)
          ctx.lineTo(r.x - 4, r.y + r.len)
          r.x -= 4
          r.y += r.speed
          if (r.y > CANVAS_HEIGHT) {
            r.y = -20
            r.x = Math.random() * CANVAS_WIDTH
          }
        })
        ctx.stroke()
      }

      // COLLECTIBLES & POWERUPS
      eng.items.forEach((item) => {
        if (item.collected) return
        item.pulse += 0.08
        const hoverY = item.y + Math.sin(item.pulse) * 4

        ctx.save()
        ctx.translate(item.x, hoverY)

        if (item.type === "clover") {
          ctx.fillStyle = "#22c55e"
          ctx.beginPath()
          ctx.arc(-5, -5, 7, 0, Math.PI * 2)
          ctx.arc(5, -5, 7, 0, Math.PI * 2)
          ctx.arc(0, 5, 7, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = "#15803d"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(0, 5)
          ctx.lineTo(0, 14)
          ctx.stroke()
        } else if (item.type === "star") {
          ctx.fillStyle = "#eab308"
          ctx.shadowColor = "#fde047"
          ctx.shadowBlur = 10
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * 12, -Math.sin(((18 + i * 72) * Math.PI) / 180) * 12)
            ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * 6, -Math.sin(((54 + i * 72) * Math.PI) / 180) * 6)
          }
          ctx.closePath()
          ctx.fill()
        } else {
          let pColor = "#3b82f6"
          if (item.type === "shield") pColor = "#f59e0b"
          if (item.type === "multiplier") pColor = "#ec4899"
          if (item.type === "magnet") pColor = "#8b5cf6"
          if (item.type === "spring") pColor = "#10b981"
          if (item.type === "slowmo") pColor = "#06b6d4"

          ctx.fillStyle = pColor
          ctx.shadowColor = pColor
          ctx.shadowBlur = 12
          ctx.beginPath()
          ctx.arc(0, 0, 14, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 12px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          const symbol =
            item.type === "shield"
              ? "S"
              : item.type === "multiplier"
              ? "2x"
              : item.type === "magnet"
              ? "M"
              : item.type === "spring"
              ? "J"
              : "T"
          ctx.fillText(symbol, 0, 1)
        }

        ctx.restore()
      })

      // HAZARDS
      eng.hazards.forEach((h) => {
        h.animFrame++
        ctx.save()
        ctx.translate(h.x, h.y)

        if (h.type === "bush") {
          ctx.fillStyle = "#15803d"
          ctx.beginPath()
          ctx.ellipse(h.width / 2, h.height / 2, h.width / 2, h.height / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = "#22c55e"
          ctx.beginPath()
          ctx.ellipse(h.width * 0.35, h.height * 0.4, h.width * 0.25, h.height * 0.3, 0, 0, Math.PI * 2)
          ctx.fill()
        } else if (h.type === "rock") {
          ctx.fillStyle = "#64748b"
          ctx.beginPath()
          ctx.moveTo(0, h.height)
          ctx.lineTo(h.width * 0.2, h.height * 0.2)
          ctx.lineTo(h.width * 0.6, 0)
          ctx.lineTo(h.width, h.height * 0.4)
          ctx.lineTo(h.width * 0.9, h.height)
          ctx.closePath()
          ctx.fill()
        } else if (h.type === "fence") {
          ctx.fillStyle = "#78350f"
          ctx.fillRect(5, 0, 10, h.height)
          ctx.fillRect(h.width - 15, 0, 10, h.height)
          ctx.fillRect(0, 10, h.width, 8)
          ctx.fillRect(0, h.height - 16, h.width, 8)
        } else if (h.type === "wolf") {
          ctx.fillStyle = "#334155"
          const runCycle = Math.floor(h.animFrame / 5) % 2
          ctx.fillRect(10, 10, h.width - 20, h.height - 18)
          ctx.fillRect(0, 4, 18, 16)
          ctx.fillStyle = "#ef4444"
          ctx.fillRect(4, 8, 4, 4)
          ctx.fillStyle = "#1e293b"
          if (runCycle === 0) {
            ctx.fillRect(12, h.height - 10, 6, 10)
            ctx.fillRect(h.width - 24, h.height - 10, 6, 10)
          } else {
            ctx.fillRect(18, h.height - 10, 6, 10)
            ctx.fillRect(h.width - 18, h.height - 10, 6, 10)
          }
        } else if (h.type === "hay") {
          ctx.save()
          ctx.translate(h.width / 2, h.height / 2)
          ctx.rotate((h.animFrame * 0.15) % (Math.PI * 2))
          ctx.fillStyle = "#eab308"
          ctx.beginPath()
          ctx.arc(0, 0, h.width / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = "#ca8a04"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(0, 0, h.width * 0.3, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        } else if (h.type === "eagle") {
          const wingFlap = Math.sin(h.animFrame * 0.2) * 12
          ctx.fillStyle = "#475569"
          ctx.fillRect(12, 12, h.width - 24, 12)
          ctx.fillRect(0, 8, 14, 14)
          ctx.fillStyle = "#f59e0b"
          ctx.fillRect(-6, 14, 8, 6)
          ctx.fillStyle = "#1e293b"
          ctx.beginPath()
          ctx.moveTo(h.width / 2, 12)
          ctx.lineTo(h.width / 2 - 15, 12 - wingFlap)
          ctx.lineTo(h.width / 2 + 15, 12 - wingFlap)
          ctx.fill()
        }

        ctx.restore()
      })

      // SHEEP PLAYER
      const sheep = eng.sheep
      sheep.animFrame++

      ctx.save()
      ctx.translate(sheep.x, sheep.y)

      const isShielded = eng.activePowerUps.some((p) => p.type === "shield")

      if (isShielded) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.35)"
        ctx.shadowColor = "#f59e0b"
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.ellipse(sheep.width / 2, sheep.height / 2, sheep.width / 2 + 10, sheep.height / 2 + 10, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      if (sheep.invincibleTimer % 6 < 3) {
        const legFrame = sheep.onGround ? Math.floor(sheep.animFrame / 4) % 2 : 0

        if (sheep.isDucking) {
          ctx.fillStyle = "#f8fafc"
          ctx.beginPath()
          ctx.ellipse(sheep.width / 2, sheep.height / 2 + 2, sheep.width / 2, sheep.height / 2 - 2, 0, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = "#1e293b"
          ctx.fillRect(sheep.width - 12, sheep.height / 2 - 4, 16, 14)
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(sheep.width - 4, sheep.height / 2 - 2, 4, 4)
        } else {
          ctx.fillStyle = "#f8fafc"
          ctx.beginPath()
          ctx.ellipse(sheep.width / 2 - 4, sheep.height / 2, sheep.width / 2 - 2, sheep.height / 2 - 6, 0, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = "#ffffff"
          const puffs = [
            { x: 10, y: 12, r: 12 },
            { x: 26, y: 8, r: 14 },
            { x: 38, y: 14, r: 12 },
            { x: 20, y: 28, r: 13 },
            { x: 34, y: 26, r: 12 },
          ]
          puffs.forEach((p) => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            ctx.fill()
          })

          ctx.fillStyle = "#1e293b"
          ctx.beginPath()
          ctx.ellipse(sheep.width - 6, 18, 12, 10, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillRect(sheep.width - 16, 12, 8, 4)

          const isBlinking = sheep.animFrame % 120 < 6
          ctx.fillStyle = "#ffffff"
          if (isBlinking) {
            ctx.fillRect(sheep.width - 4, 16, 4, 1)
          } else {
            ctx.fillRect(sheep.width - 4, 15, 3, 3)
          }

          ctx.fillStyle = "#f472b6"
          ctx.fillRect(sheep.width + 2, 20, 3, 3)

          ctx.fillStyle = "#0f172a"
          if (legFrame === 0) {
            ctx.fillRect(14, sheep.height - 12, 6, 12)
            ctx.fillRect(32, sheep.height - 12, 6, 12)
          } else {
            ctx.fillRect(10, sheep.height - 12, 6, 12)
            ctx.fillRect(36, sheep.height - 12, 6, 12)
          }

          ctx.fillStyle = "#f8fafc"
          const tailWiggle = Math.sin(sheep.animFrame * 0.3) * 3
          ctx.fillRect(0, 18 + tailWiggle, 6, 6)
        }
      }

      ctx.restore()

      // PARTICLES
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life++
        p.alpha = 1 - p.life / p.maxLife

        if (p.life >= p.maxLife) {
          eng.particles.splice(i, 1)
          continue
        }

        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }
      ctx.globalAlpha = 1.0
    },
    []
  )

  // --- MAIN GAME LOOP ---
  const updateGame = useCallback(() => {
    if (gameStateRef.current !== "playing") return
    const eng = engineRef.current
    const sheep = eng.sheep
    const cfg = DIFFICULTY_SETTINGS[difficultyRef.current]

    const hasSlowmo = eng.activePowerUps.some((p) => p.type === "slowmo")
    const speedMult = hasSlowmo ? 0.7 : 1.0

    eng.speed = Math.min(cfg.maxSpeed, eng.speed + cfg.speedAcc)
    const effectiveSpeed = eng.speed * speedMult
    eng.distance += effectiveSpeed / 10

    const hasMultiplier = eng.activePowerUps.some((p) => p.type === "multiplier")
    const scoreAdd = (effectiveSpeed / 8) * (hasMultiplier ? 2 : 1)
    eng.score += scoreAdd
    setScore(Math.floor(eng.score))

    const currentMilestone = Math.floor(eng.score / 500)
    if (currentMilestone > eng.lastMilestoneScore) {
      eng.lastMilestoneScore = currentMilestone
      sfx.playMilestone()
    }

    if (eng.activePowerUps.length > 0) {
      eng.activePowerUps.forEach((p) => (p.duration -= 16.6))
      eng.activePowerUps = eng.activePowerUps.filter((p) => p.duration > 0)
      setActivePowerUps([...eng.activePowerUps])
    }

    sheep.vy += GRAVITY
    sheep.y += sheep.vy

    const currentHeight = sheep.isDucking ? DUCK_HEIGHT : NORMAL_HEIGHT
    if (sheep.y + currentHeight >= GROUND_Y) {
      sheep.y = GROUND_Y - currentHeight
      sheep.vy = 0
      sheep.onGround = true
      sheep.hasDoubleJumped = false
    }

    if (sheep.invincibleTimer > 0) sheep.invincibleTimer--

    if (sheep.onGround && Math.random() < 0.35) {
      createParticles(sheep.x, GROUND_Y - 2, "#9ca3af", 1, 0.5)
    }

    const lastHazardX = eng.hazards.length > 0 ? eng.hazards[eng.hazards.length - 1].x : 0
    if (lastHazardX < CANVAS_WIDTH - cfg.obstacleSpacing - Math.random() * 150) {
      spawnHazard(CANVAS_WIDTH + 50)
      if (Math.random() < 0.4) spawnItem(CANVAS_WIDTH + 80)
    }

    const hasShield = eng.activePowerUps.some((p) => p.type === "shield")

    for (let i = eng.hazards.length - 1; i >= 0; i--) {
      const h = eng.hazards[i]
      h.x -= effectiveSpeed * (h.speedMultiplier || 1.0)

      if (h.x + h.width < -50) {
        eng.hazards.splice(i, 1)
        continue
      }

      const padX = 6
      const padY = 6
      if (
        sheep.x + padX < h.x + h.width - padX &&
        sheep.x + sheep.width - padX > h.x + padX &&
        sheep.y + padY < h.y + h.height - padY &&
        sheep.y + currentHeight - padY > h.y + padY
      ) {
        if (hasShield) {
          sfx.playHit()
          createParticles(h.x + h.width / 2, h.y + h.height / 2, "#f59e0b", 16, 2)
          eng.hazards.splice(i, 1)
          eng.activePowerUps = eng.activePowerUps.filter((p) => p.type !== "shield")
          setActivePowerUps([...eng.activePowerUps])
        } else if (sheep.invincibleTimer <= 0) {
          sfx.playHit()
          createParticles(sheep.x + sheep.width / 2, sheep.y + sheep.height / 2, "#ef4444", 20, 2)
          eng.lives--
          setLives(eng.lives)

          if (eng.lives <= 0) {
            setGameState("gameOver")
            gameStateRef.current = "gameOver"
            const finalScore = Math.floor(eng.score)

            setHighScores((prev) => {
              const currentHs = prev[difficultyRef.current]
              if (finalScore > currentHs) {
                const updated = { ...prev, [difficultyRef.current]: finalScore }
                try {
                  localStorage.setItem(`sheep_run_hs_${difficultyRef.current}`, finalScore.toString())
                } catch {
                  // LocalStorage error
                }
                return updated
              }
              return prev
            })
            return
          } else {
            sheep.invincibleTimer = 90
            eng.hazards.splice(i, 1)
          }
        }
      }
    }

    const hasMagnet = eng.activePowerUps.some((p) => p.type === "magnet")

    for (let i = eng.items.length - 1; i >= 0; i--) {
      const item = eng.items[i]
      item.x -= effectiveSpeed

      if (hasMagnet && !item.collected) {
        const dx = sheep.x + sheep.width / 2 - item.x
        const dy = sheep.y + sheep.height / 2 - item.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 220) {
          item.x += (dx / dist) * 9
          item.y += (dy / dist) * 9
        }
      }

      if (item.x < -40) {
        eng.items.splice(i, 1)
        continue
      }

      if (
        !item.collected &&
        Math.abs(sheep.x + sheep.width / 2 - item.x) < 32 &&
        Math.abs(sheep.y + sheep.height / 2 - item.y) < 36
      ) {
        item.collected = true
        if (item.type === "clover") {
          eng.score += 75
          eng.cloversCount++
          setCloversCollected(eng.cloversCount)
          sfx.playCollect()
          createParticles(item.x, item.y, "#22c55e", 10)
        } else if (item.type === "star") {
          eng.score += 200
          sfx.playCollect()
          createParticles(item.x, item.y, "#eab308", 12)
        } else {
          sfx.playPowerup()
          createParticles(item.x, item.y, "#3b82f6", 16, 1.5)
          const newPower: ActivePowerUp = {
            type: item.type as PowerUpType,
            duration: 7000,
            maxDuration: 7000,
          }
          eng.activePowerUps = [...eng.activePowerUps.filter((p) => p.type !== newPower.type), newPower]
          setActivePowerUps([...eng.activePowerUps])
        }
        eng.items.splice(i, 1)
      }
    }

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) render(ctx)
    }

    if (gameStateRef.current === "playing") {
      gameLoopRef.current = requestAnimationFrame(updateGame)
    }
  }, [createParticles, render, spawnHazard, spawnItem])

  // --- START / RESTART GAME ---
  const startGame = useCallback(() => {
    initEngine()
    setGameState("playing")
    gameStateRef.current = "playing"
  }, [initEngine])

  // --- KEYBOARD CONTROLS LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault()
        if (gameStateRef.current === "playing") {
          handleJump()
        } else if (gameStateRef.current === "menu" || gameStateRef.current === "gameOver") {
          startGame()
        }
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault()
        if (gameStateRef.current === "playing") {
          handleDuck(true)
        }
      } else if (e.code === "Escape" || e.code === "KeyP") {
        if (gameStateRef.current === "playing") {
          setGameState("paused")
        } else if (gameStateRef.current === "paused") {
          setGameState("playing")
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        handleDuck(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleDuck, handleJump, startGame])

  // --- GAME LOOP RAF MANAGER ---
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(updateGame)
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [gameState, updateGame])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-sans select-none text-slate-100">
      {/* HEADER / BACK NAVIGATION BAR */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              ← Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            <PawPrint className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wide text-white">Sheep Run</h1>
          </div>
        </div>

        {/* AUDIO & PAUSE BUTTONS */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="outline"
            size="icon"
            className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </Button>

          {gameState === "playing" && (
            <Button
              onClick={() => setGameState("paused")}
              variant="outline"
              size="icon"
              className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <Pause className="w-4 h-4 text-amber-400" />
            </Button>
          )}
        </div>
      </div>

      {/* GAME CANVAS & HUD CONTAINER */}
      <div className="relative w-full max-w-[900px] aspect-[9/5] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-cover block"
        />

        {/* IN-GAME HUD OVERLAY */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            {/* LIVES & POWERUPS */}
            <div className="flex items-center gap-3">
              {/* Hearts */}
              <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
                {Array.from({ length: lives }).map((_, i) => (
                  <Heart key={i} className="w-4 h-4 text-rose-500 fill-rose-500 animate-bounce" />
                ))}
              </div>

              {/* Active Power-Up Pills */}
              <div className="flex gap-2">
                {activePowerUps.map((p) => {
                  const pct = (p.duration / p.maxDuration) * 100
                  return (
                    <div
                      key={p.type}
                      className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-xs font-semibold text-amber-300"
                    >
                      {p.type === "shield" && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                      {p.type === "multiplier" && <Sparkles className="w-3.5 h-3.5 text-pink-400" />}
                      {p.type === "magnet" && <Magnet className="w-3.5 h-3.5 text-purple-400" />}
                      {p.type === "spring" && <Zap className="w-3.5 h-3.5 text-emerald-400" />}
                      {p.type === "slowmo" && <Clock className="w-3.5 h-3.5 text-cyan-400" />}
                      <span className="capitalize">{p.type}</span>
                      <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                        <div className="h-full bg-amber-400 transition-all duration-100" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* LIVE SCORE & HIGH SCORE */}
            <div className="flex items-center gap-4 bg-slate-950/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                HI {highScores[difficulty]}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 tracking-wider">
                {score.toString().padStart(5, "0")}
              </div>
            </div>
          </div>
        )}

        {/* MAIN MENU OVERLAY */}
        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
            <Card className="w-full max-w-md bg-slate-900/90 border-slate-800 text-slate-100 p-6 shadow-2xl rounded-2xl flex flex-col items-center">
              <div className="p-3 bg-emerald-500/10 rounded-full mb-3 border border-emerald-500/20">
                <PawPrint className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">Sheep Run</h2>
              <p className="text-xs text-slate-400 mb-6 text-center">
                Dodge wolves & hurdles, duck under flying eagles, and harvest power-ups in this modern endless runner!
              </p>

              {/* DIFFICULTY SELECTOR */}
              <div className="w-full mb-6">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Select Difficulty Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DIFFICULTY_SETTINGS) as DifficultyMode[]).map((mode) => {
                    const cfg = DIFFICULTY_SETTINGS[mode]
                    const isSelected = difficulty === mode
                    return (
                      <button
                        key={mode}
                        onClick={() => setDifficulty(mode)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30"
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-white capitalize">{mode}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cfg.color }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{cfg.description}</p>
                        <div className="mt-2 text-[10px] text-amber-400 font-mono flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Best: {highScores[mode]}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* CONTROLS BRIEF */}
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-6 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
                  <span>Controls:</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Jump / Double Jump</span>
                  <div className="flex gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-200">
                      Space
                    </kbd>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-200">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-200">
                      W
                    </kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duck / Roll</span>
                  <div className="flex gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-200">
                      ↓
                    </kbd>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-200">
                      S
                    </kbd>
                  </div>
                </div>
              </div>

              {/* START BUTTON */}
              <Button
                onClick={startGame}
                size="lg"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-5 h-5 mr-2 fill-slate-950" /> Start Running
              </Button>
            </Card>
          </div>
        )}

        {/* PAUSED OVERLAY */}
        {gameState === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
            <Card className="bg-slate-900 border-slate-800 p-6 text-center rounded-2xl w-80 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2">Game Paused</h3>
              <p className="text-xs text-slate-400 mb-6">Take a breath! Ready to jump back in?</p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setGameState("playing")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                >
                  <Play className="w-4 h-4 mr-2 fill-slate-950" /> Resume Game
                </Button>
                <Button
                  onClick={() => setGameState("menu")}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  Main Menu
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
            <Card className="w-full max-w-sm bg-slate-900 border-slate-800 p-6 text-center rounded-2xl shadow-2xl flex flex-col items-center">
              <div className="p-3 bg-rose-500/10 rounded-full mb-3 border border-rose-500/20">
                <PawPrint className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-1">Game Over</h3>
              <p className="text-xs text-slate-400 mb-4 capitalize">Mode: {difficulty}</p>

              {/* STATS PANEL */}
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Final Score</span>
                  <span className="font-mono font-bold text-emerald-400 text-lg">{score}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Clovers Collected</span>
                  <span className="font-mono font-bold text-amber-400">{cloversCollected}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2 mt-2">
                  <span className="text-slate-400">High Score ({difficulty})</span>
                  <span className="font-mono font-bold text-slate-200">{highScores[difficulty]}</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 w-full">
                <Button
                  onClick={startGame}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Button
                  onClick={() => setGameState("menu")}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  Menu
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* MOBILE / ON-SCREEN TOUCH CONTROLS */}
      <div className="w-full max-w-[900px] flex items-center justify-between mt-4 gap-4 px-2">
        <button
          onTouchStart={() => handleDuck(true)}
          onTouchEnd={() => handleDuck(false)}
          onMouseDown={() => handleDuck(true)}
          onMouseUp={() => handleDuck(false)}
          className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-200 font-bold text-sm shadow-md"
        >
          <ArrowDown className="w-5 h-5 text-amber-400" /> DUCK / ROLL
        </button>
        <button
          onTouchStart={handleJump}
          onMouseDown={handleJump}
          className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 text-slate-950 font-extrabold text-sm shadow-md"
        >
          <ArrowUp className="w-5 h-5 text-slate-950" /> JUMP / FLY
        </button>
      </div>
    </div>
  )
}
