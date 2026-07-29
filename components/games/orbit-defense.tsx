"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Target,
  Shield,
  Zap,
  Crosshair,
  Rocket,
  Activity,
  RefreshCw,
  Sun,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  ArrowLeft,
  Info,
  Radio,
} from "lucide-react"

// ==========================================
// GAME CONSTANTS & CONFIGURATION
// ==========================================
const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 700
const PLANET_RADIUS = 52
const PLANET_X = CANVAS_WIDTH / 2
const PLANET_Y = CANVAS_HEIGHT / 2
const SATELLITE_RADIUS = 14

export type DifficultyLevel = "cadet" | "commander" | "admiral" | "nightmare"

interface DifficultyConfig {
  name: string
  startingCredits: number
  planetHealth: number
  planetShield: number
  enemyHpMult: number
  enemySpeedMult: number
  scoreMult: number
  color: string
  description: string
}

const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultyConfig> = {
  cadet: {
    name: "Cadet",
    startingCredits: 220,
    planetHealth: 150,
    planetShield: 100,
    enemyHpMult: 0.75,
    enemySpeedMult: 0.85,
    scoreMult: 1.0,
    color: "#22c55e",
    description: "Relaxed defense with surplus credits and reinforced shields.",
  },
  commander: {
    name: "Commander",
    startingCredits: 140,
    planetHealth: 100,
    planetShield: 60,
    enemyHpMult: 1.0,
    enemySpeedMult: 1.0,
    scoreMult: 1.25,
    color: "#3b82f6",
    description: "Standard tactical combat challenge for seasoned officers.",
  },
  admiral: {
    name: "Admiral",
    startingCredits: 90,
    planetHealth: 75,
    planetShield: 30,
    enemyHpMult: 1.35,
    enemySpeedMult: 1.15,
    scoreMult: 1.6,
    color: "#f59e0b",
    description: "High enemy intensity, faster threats, limited defense budget.",
  },
  nightmare: {
    name: "Nightmare",
    startingCredits: 60,
    planetHealth: 50,
    planetShield: 0,
    enemyHpMult: 1.7,
    enemySpeedMult: 1.35,
    scoreMult: 2.2,
    color: "#ef4444",
    description: "Relentless aggressive armadas. Zero room for tactical error.",
  },
}

export type TurretType = "gatling" | "plasma" | "laser" | "missile" | "tesla" | "cryo" | "shield_node"

interface TurretConfig {
  name: string
  cost: number
  damage: number
  range: number
  fireRate: number // ms
  color: string
  secondaryColor: string
  description: string
  hotkey: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const TURRET_TYPES: Record<TurretType, TurretConfig> = {
  gatling: {
    name: "Gatling Turret",
    cost: 40,
    damage: 14,
    range: 145,
    fireRate: 180,
    color: "#38bdf8",
    secondaryColor: "#0284c7",
    description: "Rapid kinetic rounds. Effective against fast light craft.",
    hotkey: "1",
    icon: Crosshair,
  },
  plasma: {
    name: "Plasma Mortar",
    cost: 70,
    damage: 48,
    range: 165,
    fireRate: 850,
    color: "#c084fc",
    secondaryColor: "#7e22ce",
    description: "Fires volatile energy plasma with splash damage radius.",
    hotkey: "2",
    icon: Zap,
  },
  laser: {
    name: "Thermal Beam",
    cost: 95,
    damage: 9,
    range: 185,
    fireRate: 50,
    color: "#22c55e",
    secondaryColor: "#15803d",
    description: "Continuous thermal laser focused on high-priority targets.",
    hotkey: "3",
    icon: Sun,
  },
  missile: {
    name: "Homing Salvo",
    cost: 125,
    damage: 95,
    range: 220,
    fireRate: 1350,
    color: "#f97316",
    secondaryColor: "#c2410c",
    description: "Long-range heat-seeking payloads with heavy explosive power.",
    hotkey: "4",
    icon: Rocket,
  },
  tesla: {
    name: "Tesla Arc",
    cost: 140,
    damage: 32,
    range: 155,
    fireRate: 700,
    color: "#eab308",
    secondaryColor: "#a16207",
    description: "Chain lightning that shocks up to 3 targets with micro-stuns.",
    hotkey: "5",
    icon: Activity,
  },
  cryo: {
    name: "Cryo Emitter",
    cost: 115,
    damage: 18,
    range: 170,
    fireRate: 950,
    color: "#06b6d4",
    secondaryColor: "#0e7490",
    description: "Emits freezing pulses slowing enemy velocity by 45%.",
    hotkey: "6",
    icon: Shield,
  },
  shield_node: {
    name: "Aegis Node",
    cost: 160,
    damage: 0,
    range: 190,
    fireRate: 1600,
    color: "#10b981",
    secondaryColor: "#047857",
    description: "Passively restores planet shield and repairs surrounding orbitals.",
    hotkey: "7",
    icon: RefreshCw,
  },
}

export type EnemyType = "scout" | "cruiser" | "stealth" | "kamikaze" | "broodling" | "dreadnought"

interface EnemyConfig {
  name: string
  health: number
  speed: number
  value: number
  armor: number
  color: string
  radius: number
}

const ENEMY_SPECS: Record<EnemyType, EnemyConfig> = {
  scout: { name: "Scout Drone", health: 32, speed: 1.85, value: 14, armor: 0, color: "#38bdf8", radius: 7 },
  cruiser: { name: "Armored Cruiser", health: 130, speed: 0.75, value: 38, armor: 14, color: "#ef4444", radius: 13 },
  stealth: { name: "Stealth Raider", health: 48, speed: 1.4, value: 26, armor: 0, color: "#c084fc", radius: 8 },
  kamikaze: { name: "Kamikaze Skimmer", health: 26, speed: 2.7, value: 22, armor: 0, color: "#f59e0b", radius: 6 },
  broodling: { name: "Swarm Broodling", health: 18, speed: 2.1, value: 9, armor: 0, color: "#84cc16", radius: 5 },
  dreadnought: { name: "Boss Dreadnought", health: 650, speed: 0.42, value: 220, armor: 28, color: "#ec4899", radius: 22 },
}

// ==========================================
// GAME STATE INTERFACES
// ==========================================
interface Satellite {
  id: number
  x: number
  y: number
  angle: number
  radius: number
  range: number
  damage: number
  fireRate: number
  lastFired: number
  level: number
  cost: number
  type: TurretType
  targetPriority: "first" | "strongest" | "closest" | "weakest"
  kills: number
  totalDamage: number
}

interface Enemy {
  id: number
  x: number
  y: number
  radius: number
  health: number
  maxHealth: number
  speed: number
  value: number
  armor: number
  color: string
  angle: number
  orbitRadius: number
  orbitSpeed: number
  phase: "approaching" | "orbiting" | "attacking"
  orbitStartTime: number
  type: EnemyType
  slowTimer: number
  stunTimer: number
  stealthAlpha: number
  lastShotTime?: number
}

interface Bullet {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  radius: number
  damage: number
  speed: number
  life: number
  type: TurretType | "enemy_laser"
  targetEnemyId?: number
  splashRadius?: number
  chainTargetsLeft?: number
  trail: { x: number; y: number; alpha: number }[]
  color: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  shape?: "circle" | "spark" | "ring"
}

interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  color: string
  life: number
  maxLife: number
}

interface PowerUp {
  id: number
  type: "shield" | "repair" | "credits" | "overcharge"
  x: number
  y: number
  life: number
  maxLife: number
  pulse: number
}

interface Star {
  x: number
  y: number
  size: number
  alpha: number
  twinkleSpeed: number
  layer: number
}

interface UltimatePower {
  id: "emp" | "shield" | "nuke"
  name: string
  hotkey: string
  cooldownMs: number
  lastUsed: number
  description: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================
class SoundSynth {
  private ctx: AudioContext | null = null
  private isMuted = false

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
  }

  public play(type: string) {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime

      if (type === "gatling") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.08)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === "plasma") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25)
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === "laser") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now)
        gain.gain.setValueAtTime(0.04, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.05)
      } else if (type === "missile") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "square"
        osc.frequency.setValueAtTime(220, now)
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.35)
      } else if (type === "tesla") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(600 + Math.random() * 400, now)
        gain.gain.setValueAtTime(0.12, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.12)
      } else if (type === "cryo") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(520, now)
        osc.frequency.linearRampToValueAtTime(320, now + 0.2)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (type === "explosion") {
        const bufferSize = this.ctx.sampleRate * 0.35
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const output = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1
        }
        const whiteNoise = this.ctx.createBufferSource()
        whiteNoise.buffer = buffer
        const filter = this.ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.setValueAtTime(600, now)
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.35)
        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        whiteNoise.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)
        whiteNoise.start(now)
      } else if (type === "hit_planet") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(90, now)
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.4)
        gain.gain.setValueAtTime(0.35, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.4)
      } else if (type === "ultimate_emp") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.4)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.45)
      } else if (type === "powerup") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === "wave_clear") {
        const notes = [440, 554.37, 659.25, 880]
        notes.forEach((freq, index) => {
          const osc = this.ctx!.createOscillator()
          const gain = this.ctx!.createGain()
          const startTime = now + index * 0.08
          osc.type = "triangle"
          osc.frequency.setValueAtTime(freq, startTime)
          gain.gain.setValueAtTime(0.15, startTime)
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25)
          osc.connect(gain)
          gain.connect(this.ctx!.destination)
          osc.start(startTime)
          osc.stop(startTime + 0.25)
        })
      } else if (type === "click") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(700, now)
        gain.gain.setValueAtTime(0.05, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.04)
      }
    } catch {
      // Ignore audio synthesis glitches
    }
  }
}

const audioSynth = new SoundSynth()

// ==========================================
// MAIN COMPONENT
// ==========================================
interface OrbitDefenseProps {
  onBack: () => void
  themeColor?: string
}

let nextSatelliteId = 1
let nextEnemyId = 1
let nextBulletId = 1
let nextPowerUpId = 1

export default function OrbitDefense({ onBack, themeColor = "#6366f1" }: OrbitDefenseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number | null>(null)

  // Game UI States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu")
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("commander")
  const [isMuted, setIsMuted] = useState(false)
  const [selectedTurretType, setSelectedTurretType] = useState<TurretType>("gatling")
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<number | null>(null)

  // HUD Stats (synced with refs)
  const [wave, setWave] = useState(1)
  const [credits, setCredits] = useState(140)
  const [score, setScore] = useState(0)
  const [planetHp, setPlanetHp] = useState(100)
  const [planetMaxHp, setPlanetMaxHp] = useState(100)
  const [planetShield, setPlanetShield] = useState(60)
  const [planetMaxShield, setPlanetMaxShield] = useState(60)

  // Persistent High Scores
  const [highScores, setHighScores] = useState<Record<DifficultyLevel, number>>({
    cadet: 0,
    commander: 0,
    admiral: 0,
    nightmare: 0,
  })

  // Ultimate Power Cooldown Display Triggers
  const [ultCooling, setUltCooling] = useState<{ emp: number; shield: number; nuke: number }>({ emp: 0, shield: 0, nuke: 0 })

  // Game Session Performance Stats
  const [sessionStats, setSessionStats] = useState({
    totalKills: 0,
    damageDealt: 0,
    creditsEarned: 0,
    bossesDefeated: 0,
  })

  // Core Game State Reference
  const gameStateRef = useRef<{
    difficulty: DifficultyLevel
    planet: {
      x: number
      y: number
      radius: number
      health: number
      maxHealth: number
      shield: number
      maxShield: number
      shieldOverdriveTimer: number
    }
    satellites: Satellite[]
    enemies: Enemy[]
    bullets: Bullet[]
    particles: Particle[]
    shockwaves: Shockwave[]
    powerUps: PowerUp[]
    stars: Star[]
    wave: number
    credits: number
    score: number
    enemiesToSpawn: number
    lastSpawnTime: number
    waveInProgress: boolean
    waveCompleteWarp: number
    screenShake: number
    mouseX: number
    mouseY: number
    ultimates: Record<"emp" | "shield" | "nuke", UltimatePower>
    nukeTargeting: boolean
    stats: {
      totalKills: number
      damageDealt: number
      creditsEarned: number
      bossesDefeated: number
    }
  }>({
    difficulty: "commander",
    planet: {
      x: PLANET_X,
      y: PLANET_Y,
      radius: PLANET_RADIUS,
      health: 100,
      maxHealth: 100,
      shield: 60,
      maxShield: 60,
      shieldOverdriveTimer: 0,
    },
    satellites: [],
    enemies: [],
    bullets: [],
    particles: [],
    shockwaves: [],
    powerUps: [],
    stars: [],
    wave: 1,
    credits: 140,
    score: 0,
    enemiesToSpawn: 0,
    lastSpawnTime: 0,
    waveInProgress: false,
    waveCompleteWarp: 0,
    screenShake: 0,
    mouseX: 0,
    mouseY: 0,
    ultimates: {
      emp: {
        id: "emp",
        name: "EMP Surge",
        hotkey: "Q",
        cooldownMs: 20000,
        lastUsed: 0,
        description: "Stuns all active enemies for 3.5s and breaks shields.",
        color: "#38bdf8",
        icon: Zap,
      },
      shield: {
        id: "shield",
        name: "Shield Overdrive",
        hotkey: "W",
        cooldownMs: 28000,
        lastUsed: 0,
        description: "Grants 5s of total planet invulnerability.",
        color: "#10b981",
        icon: Shield,
      },
      nuke: {
        id: "nuke",
        name: "Solar Ray Strike",
        hotkey: "E",
        cooldownMs: 25000,
        lastUsed: 0,
        description: "Focuses an orbital solar beam at target location.",
        color: "#f59e0b",
        icon: Sun,
      },
    },
    nukeTargeting: false,
    stats: {
      totalKills: 0,
      damageDealt: 0,
      creditsEarned: 0,
      bossesDefeated: 0,
    },
  })

  // Load High Scores from Local Storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("orbit_defense_high_scores_v2")
      if (saved) {
        setHighScores(JSON.parse(saved))
      }
    } catch {
      // Ignore local storage error
    }
  }, [])

  // Mute Audio Toggle Handler
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      audioSynth.setMuted(next)
      return next
    })
  }, [])

  // Create Background Starfield
  const initStarfield = useCallback(() => {
    const stars: Star[] = []
    for (let i = 0; i < 140; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: 0.01 + Math.random() * 0.03,
        layer: Math.floor(Math.random() * 3) + 1,
      })
    }
    gameStateRef.current.stars = stars
  }, [])

  // Add Visual Particles
  const spawnParticles = useCallback((x: number, y: number, color = "#ffffff", count = 8, shape: "circle" | "spark" = "circle") => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 6 + 1
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: Math.random() * 3 + 1,
        color,
        shape,
      })
    }
  }, [])

  // Add Shockwave Effect
  const spawnShockwave = useCallback((x: number, y: number, color = "#ffffff", maxRadius = 60) => {
    gameStateRef.current.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      life: 25,
      maxLife: 25,
    })
  }, [])

  // Start Enemy Wave
  const startWave = useCallback((waveNum: number) => {
    const config = DIFFICULTY_SETTINGS[gameStateRef.current.difficulty]
    gameStateRef.current.wave = waveNum
    gameStateRef.current.enemiesToSpawn = Math.floor((waveNum * 4 + 6) * (config.enemyHpMult > 1.2 ? 1.3 : 1.0))
    gameStateRef.current.waveInProgress = true
    gameStateRef.current.waveCompleteWarp = 0

    setWave(waveNum)
    audioSynth.play("wave_clear")
  }, [])

  // Spawn Individual Enemy Unit
  const spawnEnemy = useCallback(() => {
    const currentWave = gameStateRef.current.wave
    const config = DIFFICULTY_SETTINGS[gameStateRef.current.difficulty]

    // Determine Enemy Type Weights based on Wave progression
    const types: EnemyType[] = ["scout", "cruiser", "stealth", "kamikaze", "broodling"]
    let weights = [0.6, 0.1, 0.1, 0.1, 0.1]

    if (currentWave >= 3) weights = [0.35, 0.25, 0.15, 0.15, 0.1]
    if (currentWave >= 6) weights = [0.2, 0.3, 0.2, 0.15, 0.15]

    // Boss Dreadnought spawns on Wave 5, 10, 15...
    const isBossWave = currentWave % 5 === 0 && gameStateRef.current.enemiesToSpawn === 1
    let selectedType: EnemyType = "scout"

    if (isBossWave) {
      selectedType = "dreadnought"
    } else {
      let rand = Math.random()
      for (let i = 0; i < types.length; i++) {
        if (rand < weights[i]) {
          selectedType = types[i]
          break
        }
        rand -= weights[i]
      }
    }

    const spec = ENEMY_SPECS[selectedType]
    const angle = Math.random() * Math.PI * 2
    const distance = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.65
    const spawnX = PLANET_X + Math.cos(angle) * distance
    const spawnY = PLANET_Y + Math.sin(angle) * distance

    const healthScaled = Math.round((spec.health + currentWave * 9) * config.enemyHpMult)
    const speedScaled = (spec.speed + currentWave * 0.03) * config.enemySpeedMult

    gameStateRef.current.enemies.push({
      id: nextEnemyId++,
      x: spawnX,
      y: spawnY,
      radius: spec.radius,
      health: healthScaled,
      maxHealth: healthScaled,
      speed: speedScaled,
      value: Math.round(spec.value * config.scoreMult),
      armor: spec.armor,
      color: spec.color,
      angle: Math.random() * Math.PI * 2,
      orbitRadius: PLANET_RADIUS + 70 + Math.random() * 45,
      orbitSpeed: 0.012 + Math.random() * 0.01,
      phase: selectedType === "kamikaze" ? "attacking" : "approaching",
      orbitStartTime: 0,
      type: selectedType,
      slowTimer: 0,
      stunTimer: 0,
      stealthAlpha: selectedType === "stealth" ? 0.15 : 1.0,
    })
  }, [])

  // Place Satellite Turret
  const placeSatellite = useCallback(
    (x: number, y: number, type: TurretType) => {
      const turretSpec = TURRET_TYPES[type]
      if (gameStateRef.current.credits < turretSpec.cost) return false

      const distToPlanet = Math.hypot(x - PLANET_X, y - PLANET_Y)
      if (distToPlanet < PLANET_RADIUS + 28 || distToPlanet > 380) return false

      // Prevent overlap with existing satellites
      for (const s of gameStateRef.current.satellites) {
        if (Math.hypot(x - s.x, y - s.y) < SATELLITE_RADIUS * 2.4) {
          return false
        }
      }

      const angle = Math.atan2(y - PLANET_Y, x - PLANET_X)

      const newSat: Satellite = {
        id: nextSatelliteId++,
        x,
        y,
        angle,
        radius: SATELLITE_RADIUS,
        range: turretSpec.range,
        damage: turretSpec.damage,
        fireRate: turretSpec.fireRate,
        lastFired: 0,
        level: 1,
        cost: turretSpec.cost,
        type,
        targetPriority: "first",
        kills: 0,
        totalDamage: 0,
      }

      gameStateRef.current.satellites.push(newSat)
      gameStateRef.current.credits -= turretSpec.cost
      setCredits(gameStateRef.current.credits)

      spawnParticles(x, y, turretSpec.color, 12, "spark")
      audioSynth.play("click")
      return true
    },
    [spawnParticles],
  )

  // Upgrade Existing Satellite Turret
  const upgradeSatellite = useCallback(
    (satId: number) => {
      const sat = gameStateRef.current.satellites.find((s) => s.id === satId)
      if (!sat || sat.level >= 5) return false

      const upgradeCost = Math.round(sat.cost * 0.85 * sat.level)
      if (gameStateRef.current.credits < upgradeCost) return false

      gameStateRef.current.credits -= upgradeCost
      sat.level += 1
      sat.damage = Math.round(sat.damage * 1.35)
      sat.range = Math.round(sat.range + 18)
      sat.fireRate = Math.max(40, Math.round(sat.fireRate * 0.85))

      setCredits(gameStateRef.current.credits)
      spawnParticles(sat.x, sat.y, TURRET_TYPES[sat.type].color, 16, "spark")
      spawnShockwave(sat.x, sat.y, TURRET_TYPES[sat.type].color, 45)
      audioSynth.play("wave_clear")
      return true
    },
    [spawnParticles, spawnShockwave],
  )

  // Sell Satellite Turret for Refund
  const sellSatellite = useCallback(
    (satId: number) => {
      const index = gameStateRef.current.satellites.findIndex((s) => s.id === satId)
      if (index === -1) return
      const sat = gameStateRef.current.satellites[index]
      const refund = Math.round(sat.cost * 0.7 * sat.level)

      gameStateRef.current.credits += refund
      setCredits(gameStateRef.current.credits)
      spawnParticles(sat.x, sat.y, "#ef4444", 10)
      gameStateRef.current.satellites.splice(index, 1)
      setSelectedSatelliteId(null)
      audioSynth.play("click")
    },
    [spawnParticles],
  )

  // In-Game Shop Repair Options
  const repairPlanetHp = useCallback(() => {
    const cost = 40
    if (gameStateRef.current.credits < cost) return
    const currentHp = gameStateRef.current.planet.health
    const maxHp = gameStateRef.current.planet.maxHealth
    if (currentHp >= maxHp) return

    gameStateRef.current.credits -= cost
    gameStateRef.current.planet.health = Math.min(maxHp, currentHp + 35)
    setCredits(gameStateRef.current.credits)
    setPlanetHp(gameStateRef.current.planet.health)
    spawnParticles(PLANET_X, PLANET_Y, "#22c55e", 15, "spark")
    audioSynth.play("powerup")
  }, [spawnParticles])

  const rechargePlanetShield = useCallback(() => {
    const cost = 50
    if (gameStateRef.current.credits < cost) return
    const currentShield = gameStateRef.current.planet.shield
    const maxShield = gameStateRef.current.planet.maxShield
    if (currentShield >= maxShield) return

    gameStateRef.current.credits -= cost
    gameStateRef.current.planet.shield = maxShield
    setCredits(gameStateRef.current.credits)
    setPlanetShield(maxShield)
    spawnParticles(PLANET_X, PLANET_Y, "#38bdf8", 15, "spark")
    audioSynth.play("powerup")
  }, [spawnParticles])

  // Trigger Ultimate Powers
  const triggerUltimate = useCallback(
    (ultId: "emp" | "shield" | "nuke") => {
      const ult = gameStateRef.current.ultimates[ultId]
      const now = Date.now()
      if (now - ult.lastUsed < ult.cooldownMs) return

      if (ultId === "nuke") {
        gameStateRef.current.nukeTargeting = true
        return
      }

      ult.lastUsed = now
      setUltCooling((prev) => ({ ...prev, [ultId]: now }))

      if (ultId === "emp") {
        audioSynth.play("ultimate_emp")
        spawnShockwave(PLANET_X, PLANET_Y, "#38bdf8", 450)
        gameStateRef.current.enemies.forEach((enemy) => {
          enemy.stunTimer = 210 // ~3.5 seconds
          enemy.health = Math.max(1, enemy.health - 40)
          spawnParticles(enemy.x, enemy.y, "#38bdf8", 8)
        })
      } else if (ultId === "shield") {
        audioSynth.play("powerup")
        gameStateRef.current.planet.shieldOverdriveTimer = 300 // ~5 seconds invulnerability
        spawnShockwave(PLANET_X, PLANET_Y, "#10b981", 120)
      }
    },
    [spawnParticles, spawnShockwave],
  )

  // Execute Solar Ray Nuke Strike at Cursor Location
  const executeNukeStrike = useCallback(
    (targetX: number, targetY: number) => {
      const ult = gameStateRef.current.ultimates.nuke
      ult.lastUsed = Date.now()
      gameStateRef.current.nukeTargeting = false
      setUltCooling((prev) => ({ ...prev, nuke: Date.now() }))

      audioSynth.play("explosion")
      spawnShockwave(targetX, targetY, "#f59e0b", 160)
      spawnParticles(targetX, targetY, "#ef4444", 30, "spark")

      // Destroy all enemies in blast radius
      const blastRadius = 140
      for (let i = gameStateRef.current.enemies.length - 1; i >= 0; i--) {
        const enemy = gameStateRef.current.enemies[i]
        if (Math.hypot(enemy.x - targetX, enemy.y - targetY) <= blastRadius) {
          enemy.health -= 350
          if (enemy.health <= 0) {
            gameStateRef.current.stats.totalKills += 1
            gameStateRef.current.credits += enemy.value
            gameStateRef.current.score += Math.round(enemy.value * 2.5)
            gameStateRef.current.enemies.splice(i, 1)
          }
        }
      }
      setCredits(gameStateRef.current.credits)
      setScore(gameStateRef.current.score)
    },
    [spawnParticles, spawnShockwave],
  )

  // Initialize Fresh Game Session
  const initGameSession = useCallback(() => {
    const config = DIFFICULTY_SETTINGS[difficulty]
    nextSatelliteId = 1
    nextEnemyId = 1
    nextBulletId = 1
    nextPowerUpId = 1

    gameStateRef.current = {
      difficulty,
      planet: {
        x: PLANET_X,
        y: PLANET_Y,
        radius: PLANET_RADIUS,
        health: config.planetHealth,
        maxHealth: config.planetHealth,
        shield: config.planetShield,
        maxShield: config.planetShield,
        shieldOverdriveTimer: 0,
      },
      satellites: [],
      enemies: [],
      bullets: [],
      particles: [],
      shockwaves: [],
      powerUps: [],
      stars: gameStateRef.current.stars,
      wave: 1,
      credits: config.startingCredits,
      score: 0,
      enemiesToSpawn: 0,
      lastSpawnTime: 0,
      waveInProgress: false,
      waveCompleteWarp: 0,
      screenShake: 0,
      mouseX: 0,
      mouseY: 0,
      ultimates: {
        emp: { id: "emp", name: "EMP Surge", hotkey: "Q", cooldownMs: 20000, lastUsed: 0, description: "Stuns all active enemies for 3.5s.", color: "#38bdf8", icon: Zap },
        shield: { id: "shield", name: "Shield Overdrive", hotkey: "W", cooldownMs: 28000, lastUsed: 0, description: "5s planet invulnerability.", color: "#10b981", icon: Shield },
        nuke: { id: "nuke", name: "Solar Ray Strike", hotkey: "E", cooldownMs: 25000, lastUsed: 0, description: "Orbital beam at cursor location.", color: "#f59e0b", icon: Sun },
      },
      nukeTargeting: false,
      stats: { totalKills: 0, damageDealt: 0, creditsEarned: config.startingCredits, bossesDefeated: 0 },
    }

    setWave(1)
    setCredits(config.startingCredits)
    setScore(0)
    setPlanetHp(config.planetHealth)
    setPlanetMaxHp(config.planetHealth)
    setPlanetShield(config.planetShield)
    setPlanetMaxShield(config.planetShield)
    setSelectedSatelliteId(null)

    startWave(1)
  }, [difficulty, startWave])

  const startGame = useCallback(() => {
    initStarfield()
    initGameSession()
    setGameState("playing")
  }, [initStarfield, initGameSession])

  const handleGameOver = useCallback(() => {
    setGameState("gameOver")
    const finalScore = gameStateRef.current.score
    const diff = gameStateRef.current.difficulty

    setSessionStats({ ...gameStateRef.current.stats })

    // Update Local High Scores
    setHighScores((prev) => {
      const currentBest = prev[diff] || 0
      if (finalScore > currentBest) {
        const updated = { ...prev, [diff]: finalScore }
        try {
          localStorage.setItem("orbit_defense_high_scores_v2", JSON.stringify(updated))
        } catch {
          // Ignore write error
        }
        return updated
      }
      return prev
    })
  }, [])

  // Main Game Loop Update Logic
  const updateGame = useCallback(() => {
    const state = gameStateRef.current
    if (gameState !== "playing") return

    const now = Date.now()

    // 1. Update Screen Shake
    if (state.screenShake > 0) {
      state.screenShake -= 0.5
    }

    // 2. Shield Overdrive Timer
    if (state.planet.shieldOverdriveTimer > 0) {
      state.planet.shieldOverdriveTimer--
    }

    // 3. Wave Spawn Manager
    if (state.waveInProgress) {
      if (state.enemiesToSpawn > 0 && now - state.lastSpawnTime > Math.max(350, 1600 - state.wave * 45)) {
        spawnEnemy()
        state.enemiesToSpawn--
        state.lastSpawnTime = now
      }

      // Check Wave Completion
      if (state.enemiesToSpawn === 0 && state.enemies.length === 0) {
        state.waveInProgress = false
        state.waveCompleteWarp = 60
        state.credits += 80 + state.wave * 15
        setCredits(state.credits)

        // Passive Planet Shield Recharge after wave
        state.planet.shield = Math.min(state.planet.maxShield, state.planet.shield + 20)
        setPlanetShield(state.planet.shield)

        setTimeout(() => {
          if (gameStateRef.current.planet.health > 0) {
            startWave(gameStateRef.current.wave + 1)
          }
        }, 3000)
      }
    }

    // 4. Satellite Targeting & Shooting Logic
    state.satellites.forEach((sat) => {
      // Shield Node passive repair function
      if (sat.type === "shield_node") {
        if (now - sat.lastFired > sat.fireRate) {
          sat.lastFired = now
          state.planet.shield = Math.min(state.planet.maxShield, state.planet.shield + 2)
          setPlanetShield(state.planet.shield)
          spawnParticles(sat.x, sat.y, "#10b981", 3)
        }
        return
      }

      if (now - sat.lastFired > sat.fireRate) {
        // Filter valid enemies in range
        const validEnemies = state.enemies.filter((e) => {
          const dist = Math.hypot(e.x - sat.x, e.y - sat.y)
          return dist <= sat.range
        })

        if (validEnemies.length === 0) return

        // Sort based on satellite priority setting
        let target: Enemy = validEnemies[0]
        if (sat.targetPriority === "closest") {
          validEnemies.sort((a, b) => Math.hypot(a.x - sat.x, a.y - sat.y) - Math.hypot(b.x - sat.x, b.y - sat.y))
          target = validEnemies[0]
        } else if (sat.targetPriority === "strongest") {
          validEnemies.sort((a, b) => b.health - a.health)
          target = validEnemies[0]
        } else if (sat.targetPriority === "weakest") {
          validEnemies.sort((a, b) => a.health - b.health)
          target = validEnemies[0]
        }

        // Fire Projectile
        sat.lastFired = now
        sat.angle = Math.atan2(target.y - sat.y, target.x - sat.x)
        audioSynth.play(sat.type)

        if (sat.type === "laser") {
          // Instant Beam Damage
          target.health -= sat.damage
          sat.totalDamage += sat.damage
          state.stats.damageDealt += sat.damage
          spawnParticles(target.x, target.y, "#22c55e", 2)

          if (target.health <= 0) {
            sat.kills += 1
            state.stats.totalKills += 1
            if (target.type === "dreadnought") state.stats.bossesDefeated += 1
            state.credits += target.value
            state.score += target.value * 2
            setCredits(state.credits)
            setScore(state.score)
            const idx = state.enemies.findIndex((e) => e.id === target.id)
            if (idx !== -1) state.enemies.splice(idx, 1)
          }
        } else {
          // Spawn Flying Bullet / Missile / Plasma / Tesla
          state.bullets.push({
            id: nextBulletId++,
            x: sat.x,
            y: sat.y,
            targetX: target.x,
            targetY: target.y,
            radius: sat.type === "missile" ? 5 : sat.type === "plasma" ? 6 : 3,
            damage: sat.damage,
            speed: sat.type === "missile" ? 7 : sat.type === "plasma" ? 8 : 14,
            life: 90,
            type: sat.type,
            targetEnemyId: target.id,
            splashRadius: sat.type === "plasma" ? 55 : sat.type === "missile" ? 70 : 0,
            chainTargetsLeft: sat.type === "tesla" ? 2 : 0,
            trail: [],
            color: TURRET_TYPES[sat.type].color,
          })
        }
      }
    })

    // 5. Update Flying Bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i]

      b.trail.push({ x: b.x, y: b.y, alpha: 1 })
      if (b.trail.length > 8) b.trail.shift()

      // Homing capability for missiles and standard bullets
      const targetEnemy = state.enemies.find((e) => e.id === b.targetEnemyId)
      if (targetEnemy) {
        b.targetX = targetEnemy.x
        b.targetY = targetEnemy.y
      }

      const angle = Math.atan2(b.targetY - b.y, b.targetX - b.x)
      b.x += Math.cos(angle) * b.speed
      b.y += Math.sin(angle) * b.speed
      b.life--

      if (b.life <= 0) {
        state.bullets.splice(i, 1)
        continue
      }

      // Check Bullet Collision with Enemy
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const enemy = state.enemies[j]
        const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y)

        if (dist <= enemy.radius + b.radius + 4) {
          const effectiveDamage = Math.max(2, b.damage - enemy.armor)
          enemy.health -= effectiveDamage
          state.stats.damageDealt += effectiveDamage

          spawnParticles(b.x, b.y, b.color, 4)

          // Handle Splash Damage for Plasma Mortar & Missiles
          if (b.splashRadius && b.splashRadius > 0) {
            spawnShockwave(b.x, b.y, b.color, b.splashRadius)
            state.enemies.forEach((other) => {
              if (other.id !== enemy.id && Math.hypot(b.x - other.x, b.y - other.y) <= b.splashRadius!) {
                other.health -= Math.round(effectiveDamage * 0.6)
              }
            })
          }

          // Handle Tesla Chain Shock & Micro Stun
          if (b.type === "tesla") {
            enemy.stunTimer = 25 // micro stun
            spawnShockwave(b.x, b.y, "#eab308", 30)
          }

          // Handle Cryo Freeze Slowdown
          if (b.type === "cryo") {
            enemy.slowTimer = 90 // 1.5 seconds slow
          }

          state.bullets.splice(i, 1)

          // Enemy Death Check
          if (enemy.health <= 0) {
            spawnParticles(enemy.x, enemy.y, enemy.color, 14, "spark")
            spawnShockwave(enemy.x, enemy.y, enemy.color, 35)
            audioSynth.play("explosion")

            state.stats.totalKills += 1
            if (enemy.type === "dreadnought") state.stats.bossesDefeated += 1

            state.credits += enemy.value
            state.score += enemy.value * 2
            setCredits(state.credits)
            setScore(state.score)

            // Random PowerUp Drop Chance
            if (Math.random() < 0.12) {
              const pTypes: ("shield" | "repair" | "credits")[] = ["shield", "repair", "credits"]
              state.powerUps.push({
                id: nextPowerUpId++,
                type: pTypes[Math.floor(Math.random() * pTypes.length)],
                x: enemy.x,
                y: enemy.y,
                life: 450,
                maxLife: 450,
                pulse: 0,
              })
            }

            state.enemies.splice(j, 1)
          }
          break
        }
      }
    }

    // 6. Update Enemy Fleet Movement & Phases
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i]

      // Timers for Status Effects
      if (enemy.stunTimer > 0) {
        enemy.stunTimer--
        continue // Stunned enemies do not move
      }

      let currentSpeed = enemy.speed
      if (enemy.slowTimer > 0) {
        enemy.slowTimer--
        currentSpeed *= 0.55
      }

      // Stealth Raider cloak effect
      if (enemy.type === "stealth") {
        const distToPlanet = Math.hypot(enemy.x - PLANET_X, enemy.y - PLANET_Y)
        enemy.stealthAlpha = distToPlanet < 200 ? 1.0 : 0.25
      }

      // Boss Dreadnought retaliation pulse laser
      if (enemy.type === "dreadnought") {
        if (!enemy.lastShotTime || now - enemy.lastShotTime > 1800) {
          enemy.lastShotTime = now
          // Fire plasma bolt at nearest satellite
          if (state.satellites.length > 0) {
            const nearestSat = state.satellites[0]
            state.bullets.push({
              id: nextBulletId++,
              x: enemy.x,
              y: enemy.y,
              targetX: nearestSat.x,
              targetY: nearestSat.y,
              radius: 5,
              damage: 25,
              speed: 6,
              life: 80,
              type: "enemy_laser",
              color: "#ec4899",
              trail: [],
            })
          }
        }
      }

      const distToPlanet = Math.hypot(enemy.x - PLANET_X, enemy.y - PLANET_Y)

      if (enemy.phase === "approaching") {
        if (distToPlanet <= enemy.orbitRadius) {
          enemy.phase = "orbiting"
          enemy.orbitStartTime = now
        } else {
          const angle = Math.atan2(PLANET_Y - enemy.y, PLANET_X - enemy.x)
          enemy.x += Math.cos(angle) * currentSpeed
          enemy.y += Math.sin(angle) * currentSpeed
        }
      } else if (enemy.phase === "orbiting") {
        enemy.angle += enemy.orbitSpeed
        enemy.x = PLANET_X + Math.cos(enemy.angle) * enemy.orbitRadius
        enemy.y = PLANET_Y + Math.sin(enemy.angle) * enemy.orbitRadius

        if (now - enemy.orbitStartTime > 4500) {
          enemy.phase = "attacking"
        }
      } else if (enemy.phase === "attacking") {
        const angle = Math.atan2(PLANET_Y - enemy.y, PLANET_X - enemy.x)
        enemy.x += Math.cos(angle) * currentSpeed
        enemy.y += Math.sin(angle) * currentSpeed
      }

      // Collision with Planet Shield / Core
      if (distToPlanet <= PLANET_RADIUS + enemy.radius + 2) {
        audioSynth.play("hit_planet")
        state.screenShake = 12
        spawnParticles(enemy.x, enemy.y, "#ef4444", 12, "spark")

        // Direct damage calculation (Ignored if Shield Overdrive active)
        if (state.planet.shieldOverdriveTimer <= 0) {
          const impactDamage = enemy.type === "cruiser" ? 25 : enemy.type === "kamikaze" ? 30 : 12
          if (state.planet.shield > 0) {
            state.planet.shield = Math.max(0, state.planet.shield - impactDamage)
          } else {
            state.planet.health -= impactDamage
          }
          setPlanetHp(state.planet.health)
          setPlanetShield(state.planet.shield)
        }

        state.enemies.splice(i, 1)

        // Check Planet Destruction
        if (state.planet.health <= 0) {
          audioSynth.play("explosion")
          handleGameOver()
          return
        }
      }
    }

    // 7. Power-up Items Lifetime & Pickup
    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const p = state.powerUps[i]
      p.life--
      p.pulse += 0.05
      if (p.life <= 0) {
        state.powerUps.splice(i, 1)
      }
    }

    // 8. Update Particles & Shockwaves
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.94
      p.vy *= 0.94
      p.life--
      if (p.life <= 0) state.particles.splice(i, 1)
    }

    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
      const s = state.shockwaves[i]
      s.radius += (s.maxRadius - s.radius) * 0.15
      s.life--
      if (s.life <= 0) state.shockwaves.splice(i, 1)
    }

    // ==========================================
    // CANVAS RENDERING ENGINE
    // ==========================================
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()

    // Screen Shake Offset
    if (state.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake
      const shakeY = (Math.random() - 0.5) * state.screenShake
      ctx.translate(shakeX, shakeY)
    }

    // Background Gradient (Deep Space Nebula)
    const bgGrad = ctx.createRadialGradient(PLANET_X, PLANET_Y, 50, PLANET_X, PLANET_Y, 600)
    bgGrad.addColorStop(0, "#090d16")
    bgGrad.addColorStop(0.5, "#05070e")
    bgGrad.addColorStop(1, "#020305")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Starfield Rendering
    state.stars.forEach((star) => {
      ctx.fillStyle = "#ffffff"
      ctx.globalAlpha = star.alpha * (0.6 + Math.sin(now * star.twinkleSpeed) * 0.4)
      ctx.beginPath()

      // Warp speed stretch on wave complete
      const warpMult = state.waveCompleteWarp > 0 ? 3 : 1
      ctx.arc(star.x, star.y, star.size * warpMult, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0

    // Orbital Range Guide Rings
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = 1
    ;[120, 180, 240, 300].forEach((r) => {
      ctx.beginPath()
      ctx.arc(PLANET_X, PLANET_Y, r, 0, Math.PI * 2)
      ctx.stroke()
    })

    // Placement Cursor Ring Preview
    if (state.mouseX > 0 && state.mouseY > 0) {
      const spec = TURRET_TYPES[selectedTurretType]
      const distToPlanet = Math.hypot(state.mouseX - PLANET_X, state.mouseY - PLANET_Y)

      let isValid = distToPlanet >= PLANET_RADIUS + 28 && distToPlanet <= 380
      if (state.credits < spec.cost) isValid = false

      ctx.strokeStyle = isValid ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"
      ctx.fillStyle = isValid ? "rgba(34, 197, 94, 0.06)" : "rgba(239, 68, 68, 0.06)"
      ctx.lineWidth = 1.5

      ctx.beginPath()
      ctx.arc(state.mouseX, state.mouseY, spec.range, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(state.mouseX, state.mouseY, SATELLITE_RADIUS, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Render Shockwaves
    state.shockwaves.forEach((sw) => {
      ctx.strokeStyle = sw.color
      ctx.globalAlpha = sw.life / sw.maxLife
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
      ctx.stroke()
    })
    ctx.globalAlpha = 1.0

    // Render Particles
    state.particles.forEach((p) => {
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0

    // Render Bullets & Laser Trails
    state.bullets.forEach((b) => {
      // Trail
      b.trail.forEach((t, idx) => {
        ctx.fillStyle = b.color
        ctx.globalAlpha = (idx / b.trail.length) * 0.4
        ctx.beginPath()
        ctx.arc(t.x, t.y, b.radius * 0.7, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1.0

      // Head
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.fill()
    })

    // Render Enemies
    state.enemies.forEach((e) => {
      ctx.save()
      ctx.globalAlpha = e.stealthAlpha

      // Stunned Glow Effect
      if (e.stunTimer > 0) {
        ctx.strokeStyle = "#38bdf8"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Enemy Ship Geometry
      ctx.fillStyle = e.color
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
      ctx.fill()

      // Enemy HP Bar
      const hpWidth = e.radius * 2.2
      const hpPct = Math.max(0, e.health / e.maxHealth)
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      ctx.fillRect(e.x - hpWidth / 2, e.y - e.radius - 8, hpWidth, 4)
      ctx.fillStyle = hpPct > 0.5 ? "#22c55e" : hpPct > 0.25 ? "#f59e0b" : "#ef4444"
      ctx.fillRect(e.x - hpWidth / 2, e.y - e.radius - 8, hpWidth * hpPct, 4)

      ctx.restore()
    })

    // Render Satellites
    state.satellites.forEach((sat) => {
      ctx.save()
      ctx.translate(sat.x, sat.y)
      ctx.rotate(sat.angle)

      const spec = TURRET_TYPES[sat.type]

      // Selection Ring Highlight
      if (selectedSatelliteId === sat.id) {
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, sat.radius + 5, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Turret Body
      ctx.fillStyle = spec.color
      ctx.beginPath()
      ctx.arc(0, 0, sat.radius, 0, Math.PI * 2)
      ctx.fill()

      // Turret Barrel
      ctx.fillStyle = spec.secondaryColor
      ctx.fillRect(0, -3, sat.radius + 6, 6)

      ctx.restore()

      // Level Star Badges
      if (sat.level > 1) {
        ctx.fillStyle = "#eab308"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("★".repeat(sat.level), sat.x, sat.y + sat.radius + 12)
      }

      // Range Circle if Selected
      if (selectedSatelliteId === sat.id) {
        ctx.strokeStyle = spec.color
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.arc(sat.x, sat.y, sat.range, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })

    // Render Power-up Items
    state.powerUps.forEach((p) => {
      ctx.save()
      const pulseSize = 14 + Math.sin(p.pulse) * 3
      ctx.fillStyle = p.type === "shield" ? "#38bdf8" : p.type === "repair" ? "#22c55e" : "#f59e0b"
      ctx.beginPath()
      ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 11px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(p.type === "shield" ? "S" : p.type === "repair" ? "H" : "$", p.x, p.y)
      ctx.restore()
    })

    // Render Core Planet
    // Atmospheric Glow Ring
    const planetGlow = ctx.createRadialGradient(PLANET_X, PLANET_Y, PLANET_RADIUS - 5, PLANET_X, PLANET_Y, PLANET_RADIUS + 22)
    planetGlow.addColorStop(0, "rgba(99, 102, 241, 0.4)")
    planetGlow.addColorStop(0.7, "rgba(99, 102, 241, 0.1)")
    planetGlow.addColorStop(1, "rgba(99, 102, 241, 0)")
    ctx.fillStyle = planetGlow
    ctx.beginPath()
    ctx.arc(PLANET_X, PLANET_Y, PLANET_RADIUS + 22, 0, Math.PI * 2)
    ctx.fill()

    // Planet Body
    const planetBodyGrad = ctx.createRadialGradient(PLANET_X - 15, PLANET_Y - 15, 5, PLANET_X, PLANET_Y, PLANET_RADIUS)
    planetBodyGrad.addColorStop(0, "#818cf8")
    planetBodyGrad.addColorStop(0.6, "#4f46e5")
    planetBodyGrad.addColorStop(1, "#312e81")
    ctx.fillStyle = planetBodyGrad
    ctx.beginPath()
    ctx.arc(PLANET_X, PLANET_Y, PLANET_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Planet Shield Ring
    if (state.planet.shieldOverdriveTimer > 0) {
      // Overdrive Active Shield
      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 5
      ctx.shadowColor = "#10b981"
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(PLANET_X, PLANET_Y, PLANET_RADIUS + 10, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    } else if (state.planet.shield > 0) {
      const shieldAlpha = (state.planet.shield / state.planet.maxShield) * 0.75 + 0.15
      ctx.strokeStyle = `rgba(56, 189, 248, ${shieldAlpha})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(PLANET_X, PLANET_Y, PLANET_RADIUS + 8, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Solar Ray Nuke Targeting Reticle Cursor
    if (state.nukeTargeting && state.mouseX > 0 && state.mouseY > 0) {
      ctx.strokeStyle = "#f59e0b"
      ctx.lineWidth = 2
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.arc(state.mouseX, state.mouseY, 140, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(state.mouseX - 20, state.mouseY)
      ctx.lineTo(state.mouseX + 20, state.mouseY)
      ctx.moveTo(state.mouseX, state.mouseY - 20)
      ctx.lineTo(state.mouseX, state.mouseY + 20)
      ctx.stroke()
    }

    ctx.restore()

    gameLoopRef.current = requestAnimationFrame(updateGame)
  }, [gameState, selectedTurretType, selectedSatelliteId, spawnEnemy, spawnParticles, spawnShockwave, startWave, handleGameOver])

  // Mouse Interactivity
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    gameStateRef.current.mouseX = (e.clientX - rect.left) * scaleX
    gameStateRef.current.mouseY = (e.clientY - rect.top) * scaleY
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameState !== "playing") return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height

      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      // Nuke Target Execution
      if (gameStateRef.current.nukeTargeting) {
        executeNukeStrike(x, y)
        return
      }

      // Check Power-up Click
      for (let i = 0; i < gameStateRef.current.powerUps.length; i++) {
        const p = gameStateRef.current.powerUps[i]
        if (Math.hypot(x - p.x, y - p.y) < 22) {
          if (p.type === "shield") {
            gameStateRef.current.planet.shield = gameStateRef.current.planet.maxShield
            setPlanetShield(gameStateRef.current.planet.maxShield)
          } else if (p.type === "repair") {
            gameStateRef.current.planet.health = Math.min(
              gameStateRef.current.planet.maxHealth,
              gameStateRef.current.planet.health + 40,
            )
            setPlanetHp(gameStateRef.current.planet.health)
          } else if (p.type === "credits") {
            gameStateRef.current.credits += 50
            setCredits(gameStateRef.current.credits)
          }

          spawnParticles(p.x, p.y, "#22c55e", 12, "spark")
          audioSynth.play("powerup")
          gameStateRef.current.powerUps.splice(i, 1)
          return
        }
      }

      // Check Existing Satellite Click (Select)
      for (const sat of gameStateRef.current.satellites) {
        if (Math.hypot(x - sat.x, y - sat.y) < sat.radius + 10) {
          setSelectedSatelliteId(sat.id)
          audioSynth.play("click")
          return
        }
      }

      // Otherwise Try Placing New Satellite
      if (placeSatellite(x, y, selectedTurretType)) {
        setSelectedSatelliteId(null)
      } else {
        setSelectedSatelliteId(null)
      }
    },
    [gameState, selectedTurretType, placeSatellite, executeNukeStrike, spawnParticles],
  )

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing") {
        if (e.key === "1") setSelectedTurretType("gatling")
        if (e.key === "2") setSelectedTurretType("plasma")
        if (e.key === "3") setSelectedTurretType("laser")
        if (e.key === "4") setSelectedTurretType("missile")
        if (e.key === "5") setSelectedTurretType("tesla")
        if (e.key === "6") setSelectedTurretType("cryo")
        if (e.key === "7") setSelectedTurretType("shield_node")

        if (e.key.toLowerCase() === "q") triggerUltimate("emp")
        if (e.key.toLowerCase() === "w") triggerUltimate("shield")
        if (e.key.toLowerCase() === "e") triggerUltimate("nuke")

        if (e.key === " ") {
          e.preventDefault()
          setGameState("paused")
        }
        if (e.key === "Escape") {
          setSelectedSatelliteId(null)
          gameStateRef.current.nukeTargeting = false
        }
      } else if (gameState === "paused") {
        if (e.key === " ") {
          e.preventDefault()
          setGameState("playing")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, triggerUltimate])

  // Trigger Canvas Render Loop
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(updateGame)
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [gameState, updateGame])

  const selectedSatObj = gameStateRef.current.satellites.find((s) => s.id === selectedSatelliteId)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 font-sans select-none">
      {/* HEADER NAVIGATION */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white">ORBIT DEFENSE</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              PRO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-slate-400 hover:text-white hover:bg-slate-900"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </Button>

          {gameState === "playing" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGameState("paused")}
              className="border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
            >
              <Pause className="w-4 h-4 mr-1" /> Pause
            </Button>
          )}
        </div>
      </div>

      {/* GAME CANVAS & HUD CONTAINER */}
      <div className="relative w-full max-w-5xl bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
        {/* HUD TOP BAR */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 text-xs">
            {/* Planet HP & Shield */}
            <div className="flex items-center gap-4">
              <div>
                <div className="flex justify-between text-[11px] font-medium mb-0.5">
                  <span className="text-rose-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> HP
                  </span>
                  <span className="text-slate-300 font-mono">
                    {planetHp}/{planetMaxHp}
                  </span>
                </div>
                <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                    style={{ width: `${Math.max(0, (planetHp / planetMaxHp) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-0.5">
                  <span className="text-sky-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> SHIELD
                  </span>
                  <span className="text-slate-300 font-mono">
                    {planetShield}/{planetMaxShield}
                  </span>
                </div>
                <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-300"
                    style={{ width: `${Math.max(0, (planetShield / planetMaxShield) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Wave Progress & Credits */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-slate-400 uppercase text-[10px] tracking-wider block">WAVE</span>
                <span className="text-lg font-bold font-mono text-indigo-400">{wave}</span>
              </div>

              <div className="text-center">
                <span className="text-slate-400 uppercase text-[10px] tracking-wider block">CREDITS</span>
                <span className="text-lg font-bold font-mono text-amber-400">${credits}</span>
              </div>

              <div className="text-center">
                <span className="text-slate-400 uppercase text-[10px] tracking-wider block">SCORE</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{score.toLocaleString()}</span>
              </div>
            </div>

            {/* Planetary Repair Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={repairPlanetHp}
                disabled={credits < 40 || planetHp >= planetMaxHp}
                className="h-7 px-2.5 text-[11px] border-slate-700 bg-slate-800/80 text-emerald-300 hover:bg-emerald-950/50"
              >
                +HP ($40)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={rechargePlanetShield}
                disabled={credits < 50 || planetShield >= planetMaxShield}
                className="h-7 px-2.5 text-[11px] border-slate-700 bg-slate-800/80 text-sky-300 hover:bg-sky-950/50"
              >
                +Shield ($50)
              </Button>
            </div>
          </div>
        )}

        {/* MAIN CANVAS */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          className="w-full h-auto cursor-crosshair block"
        />

        {/* MENU OVERLAY */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6">
            <Card className="max-w-xl w-full p-6 bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  <Target className="w-8 h-8 text-slate-950" />
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">ORBIT DEFENSE</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Command planetary orbitals, deploy tactical defense satellites, and protect your core world against incoming cosmic armadas.
                </p>
              </div>

              {/* Difficulty Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select Difficulty Level</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(DIFFICULTY_SETTINGS) as DifficultyLevel[]).map((key) => {
                    const cfg = DIFFICULTY_SETTINGS[key]
                    const isSelected = difficulty === key
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setDifficulty(key)
                          audioSynth.play("click")
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-slate-800 border-indigo-500 ring-1 ring-indigo-500 shadow-md"
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm" style={{ color: cfg.color }}>
                            {cfg.name}
                          </span>
                          {highScores[key] > 0 && (
                            <span className="text-[10px] font-mono text-slate-400">Best: {highScores[key].toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{cfg.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Controls Accordion summary */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs space-y-1.5 text-slate-300">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> Controls & Shortcuts
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">Mouse Click</kbd> Place / Select Turret
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">1 - 7</kbd> Switch Satellite Type
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">Q / W / E</kbd> Planetary Ultimates
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">Space / Esc</kbd> Pause / Deselect
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <Button
                onClick={startGame}
                style={{ backgroundColor: themeColor }}
                className="w-full py-6 text-base font-bold text-white shadow-lg hover:brightness-110 transition-all"
              >
                DEPLOY DEFENSE GRID
              </Button>
            </Card>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {gameState === "paused" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <Card className="p-6 bg-slate-900 border-slate-800 text-slate-100 max-w-sm w-full text-center space-y-5 shadow-2xl">
              <h3 className="text-2xl font-bold tracking-tight">GAME PAUSED</h3>
              <p className="text-xs text-slate-400">Tactical simulation suspended. Resume when ready.</p>

              <div className="space-y-2.5">
                <Button
                  onClick={() => setGameState("playing")}
                  style={{ backgroundColor: themeColor }}
                  className="w-full font-semibold text-white"
                >
                  <Play className="w-4 h-4 mr-2" /> RESUME DEFENSE
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setGameState("menu")}
                  className="w-full border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-800"
                >
                  ABANDON MISSION
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6">
            <Card className="max-w-md w-full p-6 bg-slate-900 border-slate-800 text-slate-100 shadow-2xl space-y-6 text-center">
              <div className="space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2">
                  <Flame className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-white">PLANET DESTROYED!</h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Mission Debrief Report</p>
              </div>

              {/* Performance Stats Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/70 rounded-lg border border-slate-800 text-left">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">FINAL SCORE</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{score.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">WAVES SURVIVED</span>
                  <span className="text-xl font-bold font-mono text-indigo-400">{wave - 1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">ENEMIES DESTROYED</span>
                  <span className="text-sm font-semibold text-slate-200">{sessionStats.totalKills}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">BOSSES DEFEATED</span>
                  <span className="text-sm font-semibold text-slate-200">{sessionStats.bossesDefeated}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Difficulty Mode:</span>
                <span className="font-semibold text-slate-200 uppercase">{DIFFICULTY_SETTINGS[difficulty].name}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={startGame}
                  style={{ backgroundColor: themeColor }}
                  className="flex-1 font-bold text-white py-5"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> DEFEND AGAIN
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setGameState("menu")}
                  className="flex-1 border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
                >
                  MAIN MENU
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* BOTTOM DASHBOARD: TURRET SELECTION CAROUSEL & ULTIMATES */}
        {gameState === "playing" && (
          <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Turret Selection Hotbar */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
              {(Object.keys(TURRET_TYPES) as TurretType[]).map((key) => {
                const spec = TURRET_TYPES[key]
                const isSelected = selectedTurretType === key
                const canAfford = credits >= spec.cost
                const Icon = spec.icon

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedTurretType(key)
                      audioSynth.play("click")
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all relative ${
                      isSelected
                        ? "bg-slate-800 border-indigo-500 ring-1 ring-indigo-500"
                        : canAfford
                        ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60"
                        : "bg-slate-900/30 border-slate-800/50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: `${spec.color}20`, color: spec.color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="pr-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-200 whitespace-nowrap">{spec.name}</span>
                        <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded font-mono">
                          {spec.hotkey}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">${spec.cost}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Ultimate Abilities Hotbar */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              {(["emp", "shield", "nuke"] as const).map((ultId) => {
                const ult = gameStateRef.current.ultimates[ultId]
                const last = ultCooling[ultId] || 0
                const now = Date.now()
                const cooldownLeft = Math.max(0, ult.cooldownMs - (now - last))
                const isReady = cooldownLeft === 0
                const Icon = ult.icon

                return (
                  <button
                    key={ultId}
                    onClick={() => triggerUltimate(ultId)}
                    disabled={!isReady}
                    title={`${ult.name} (${ult.hotkey}) - ${ult.description}`}
                    className={`p-2.5 rounded-lg border flex items-center justify-center relative transition-all ${
                      isReady
                        ? "bg-slate-900 border-slate-700 hover:bg-slate-800 hover:scale-105 shadow-sm"
                        : "bg-slate-950 border-slate-800 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <Icon className="w-5 h-5" style={{ color: isReady ? ult.color : "#64748b" }} />
                    <span className="absolute top-0.5 right-1 text-[9px] font-bold text-slate-400 font-mono">{ult.hotkey}</span>
                    {!isReady && (
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-[10px] font-mono font-bold text-amber-400 rounded-lg">
                        {Math.ceil(cooldownLeft / 1000)}s
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* SELECTED SATELLITE INSPECTOR MODAL PANEL */}
      {selectedSatObj && gameState === "playing" && (
        <div className="mt-3 w-full max-w-5xl p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${TURRET_TYPES[selectedSatObj.type].color}20`, color: TURRET_TYPES[selectedSatObj.type].color }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{TURRET_TYPES[selectedSatObj.type].name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  LVL {selectedSatObj.level}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                <span>Dmg: <strong className="text-slate-200 font-mono">{selectedSatObj.damage}</strong></span>
                <span>Range: <strong className="text-slate-200 font-mono">{selectedSatObj.range}</strong></span>
                <span>Kills: <strong className="text-emerald-400 font-mono">{selectedSatObj.kills}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedSatObj.level < 5 && (
              <Button
                size="sm"
                onClick={() => upgradeSatellite(selectedSatObj.id)}
                disabled={credits < Math.round(selectedSatObj.cost * 0.85 * selectedSatObj.level)}
                className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
              >
                Upgrade (${Math.round(selectedSatObj.cost * 0.85 * selectedSatObj.level)})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => sellSatellite(selectedSatObj.id)}
              className="h-8 border-rose-800 text-rose-300 hover:bg-rose-950/50 text-xs"
            >
              Sell (${Math.round(selectedSatObj.cost * 0.7 * selectedSatObj.level)})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedSatelliteId(null)}
              className="h-8 text-slate-400 hover:text-white"
            >
              Deselect
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
