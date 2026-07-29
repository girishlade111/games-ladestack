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
  Volume2,
  VolumeX,
  Rocket,
  Shield,
  Zap,
  Sparkles,
  Crosshair,
  Award,
  Swords,
  Gauge,
  Flame,
  Target,
  ChevronRight,
  Info,
  Sparkle,
  Layers,
  Radio,
  RefreshCw,
} from "lucide-react"

// Canvas Resolution Constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

// Player & Game Constants
const PLAYER_WIDTH = 48
const PLAYER_HEIGHT = 32
const BASE_PLAYER_SPEED = 7
const BULLET_WIDTH = 4
const BULLET_HEIGHT = 14
const BASE_BULLET_SPEED = 9

// Invader Constants
const INVADER_WIDTH = 34
const INVADER_HEIGHT = 26
const INVADER_ROWS = 5
const INVADER_COLS = 10
const INVADER_X_SPACING = 50
const INVADER_Y_SPACING = 38

type Difficulty = "cadet" | "veteran" | "commander" | "insane"
type GameState = "menu" | "playing" | "paused" | "gameover" | "victory"
type PowerUpType = "double" | "laser" | "spread" | "shield" | "freeze" | "nuke" | "repair"
type InvaderType = "squid" | "crab" | "octopus" | "elite"

interface DifficultyConfig {
  lives: number
  invaderSpeed: number
  alienFireInterval: number
  bunkerCount: number
  dropRate: number
  showAimLine: boolean
  label: string
  desc: string
  color: string
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  cadet: {
    lives: 5,
    invaderSpeed: 0.75,
    alienFireInterval: 2200,
    bunkerCount: 4,
    dropRate: 0.35,
    showAimLine: true,
    label: "Cadet (Easy)",
    desc: "5 Lives, slower alien march, wider defense shields & aim guide",
    color: "#10b981",
  },
  veteran: {
    lives: 3,
    invaderSpeed: 1.0,
    alienFireInterval: 1500,
    bunkerCount: 4,
    dropRate: 0.22,
    showAimLine: false,
    label: "Veteran (Standard)",
    desc: "3 Lives, classic arcade speed & standard defense bunkers",
    color: "#3b82f6",
  },
  commander: {
    lives: 2,
    invaderSpeed: 1.35,
    alienFireInterval: 1000,
    bunkerCount: 3,
    dropRate: 0.14,
    showAimLine: false,
    label: "Commander (Hard)",
    desc: "2 Lives, rapid alien deployment & aggressive laser salvos",
    color: "#f59e0b",
  },
  insane: {
    lives: 1,
    invaderSpeed: 1.7,
    alienFireInterval: 650,
    bunkerCount: 2,
    dropRate: 0.08,
    showAimLine: false,
    label: "Hyper Alien (Insane)",
    desc: "1 Life, lightning alien step, mothership bosses & fragile shields",
    color: "#ef4444",
  },
}

// Powerup Configurations
const POWERUP_CONFIGS: Record<PowerUpType, { label: string; color: string; duration: number; symbol: string }> = {
  double: { label: "Twin Lasers", color: "#38bdf8", duration: 8000, symbol: "2X" },
  laser: { label: "Piercing Beam", color: "#a855f7", duration: 6000, symbol: "BEAM" },
  spread: { label: "Spread Cannon", color: "#f59e0b", duration: 7000, symbol: "3-WAY" },
  shield: { label: "Energy Aegis", color: "#10b981", duration: 10000, symbol: "SHIELD" },
  freeze: { label: "Stasis Matrix", color: "#06b6d4", duration: 6000, symbol: "FREEZE" },
  nuke: { label: "Orbital Nuke", color: "#ef4444", duration: 0, symbol: "NUKE" },
  repair: { label: "Shield Repair", color: "#ec4899", duration: 0, symbol: "REPAIR" },
}

interface PlayerEntity {
  x: number
  y: number
  width: number
  height: number
  speed: number
  shieldActive: boolean
  shieldTime: number
  weaponType: PowerUpType | "standard"
  weaponTime: number
  nukeCharges: number
  invulnerableTime: number
}

interface InvaderEntity {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: InvaderType
  row: number
  col: number
  alive: boolean
  hp: number
  maxHp: number
  points: number
  color: string
}

interface BossEntity {
  active: boolean
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  phase: number
  dx: number
  attackTimer: number
  color: string
}

interface BulletEntity {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  isPlayer: boolean
  damage: number
  color: string
  piercing: boolean
  type?: string
}

interface BunkerBlock {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  bunkerIndex: number
}

interface UfoEntity {
  active: boolean
  x: number
  y: number
  width: number
  height: number
  speed: number
  points: number
  hasPowerup: boolean
}

interface PowerUpItem {
  x: number
  y: number
  vy: number
  type: PowerUpType
  color: string
  size: number
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
  glow?: boolean
}

interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  alpha: number
  vy: number
}

interface Star {
  x: number
  y: number
  size: number
  speed: number
  brightness: number
}

export default function SpaceInvadersGame({
  onBack,
  themeColor = "#06b6d4",
}: {
  onBack?: () => void
  themeColor?: string
}) {
  // State variables
  const [gameState, setGameState] = useState<GameState>("menu")
  const [difficulty, setDifficulty] = useState<Difficulty>("veteran")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [autoFire, setAutoFire] = useState(false)

  // Game Stats
  const [aliensDefeated, setAliensDefeated] = useState(0)
  const [ufosDestroyed, setUfosDestroyed] = useState(0)
  const [shotsFired, setShotsFired] = useState(0)
  const [shotsHit, setShotsHit] = useState(0)

  // Active Power-up indicators
  const [activePowerup, setActivePowerup] = useState<{ type: PowerUpType; label: string; percent: number } | null>(
    null,
  )

  // References
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean; nuke: boolean }>({
    left: false,
    right: false,
    shoot: false,
    nuke: false,
  })

  const gsRef = useRef({
    gameState: "menu" as GameState,
    difficulty: "veteran" as Difficulty,
    score: 0,
    lives: 3,
    wave: 1,
    combo: 0,
    maxCombo: 0,
    aliensDefeated: 0,
    ufosDestroyed: 0,
    shotsFired: 0,
    shotsHit: 0,
    invaderDirection: 1,
    lastInvaderStep: 0,
    invaderStepInterval: 800,
    lastInvaderShot: 0,
    lastUfoSpawn: 0,
    lastPlayerShot: 0,
    screenShake: 0,
    marchStep: 0,

    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - 65,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: BASE_PLAYER_SPEED,
      shieldActive: false,
      shieldTime: 0,
      weaponType: "standard" as PowerUpType | "standard",
      weaponTime: 0,
      nukeCharges: 0,
      invulnerableTime: 0,
    } as PlayerEntity,

    boss: {
      active: false,
      x: CANVAS_WIDTH / 2 - 80,
      y: 70,
      width: 160,
      height: 70,
      hp: 100,
      maxHp: 100,
      phase: 1,
      dx: 2.5,
      attackTimer: 0,
      color: "#ec4899",
    } as BossEntity,

    ufo: {
      active: false,
      x: -60,
      y: 45,
      width: 50,
      height: 22,
      speed: 3,
      points: 200,
      hasPowerup: true,
    } as UfoEntity,

    invaders: [] as InvaderEntity[],
    bullets: [] as BulletEntity[],
    bunkers: [] as BunkerBlock[],
    powerups: [] as PowerUpItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as Star[],
  })

  // Load High Score on mount / difficulty change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`space_invaders_highscore_${difficulty}`)
      if (saved) {
        setHighScore(Number.parseInt(saved, 10))
      } else {
        setHighScore(0)
      }
    } catch {
      setHighScore(0)
    }
  }, [difficulty])

  // Save High Score
  const checkAndSaveHighScore = useCallback((currentScore: number, diff: Difficulty) => {
    try {
      const saved = localStorage.getItem(`space_invaders_highscore_${diff}`)
      const prev = saved ? Number.parseInt(saved, 10) : 0
      if (currentScore > prev) {
        localStorage.setItem(`space_invaders_highscore_${diff}`, currentScore.toString())
        setHighScore(currentScore)
      }
    } catch {
      // Ignore local storage errors
    }
  }, [])

  // Web Audio Synthesizer
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
  }, [])

  const playSynthSound = useCallback((type: string, pitch = 440) => {
    if (isMuted || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      const now = ctx.currentTime

      if (type === "laser_player") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(880, now)
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.12)
      } else if (type === "laser_invader") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "square"
        osc.frequency.setValueAtTime(350, now)
        osc.frequency.linearRampToValueAtTime(120, now + 0.15)
        gain.gain.setValueAtTime(0.12, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === "march") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        const freqs = [180, 160, 140, 120]
        const freq = freqs[Math.abs(pitch) % 4]
        osc.frequency.setValueAtTime(freq, now)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === "explosion_small") {
        const bufferSize = ctx.sampleRate * 0.15
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
        const noise = ctx.createBufferSource()
        noise.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.setValueAtTime(800, now)
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.15)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        noise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        noise.start(now)
      } else if (type === "explosion_large") {
        const bufferSize = ctx.sampleRate * 0.4
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
        const noise = ctx.createBufferSource()
        noise.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.setValueAtTime(1200, now)
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.4)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        noise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        noise.start(now)
      } else if (type === "ufo") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(500 + Math.sin(now * 20) * 150, now)
        gain.gain.setValueAtTime(0.1, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.1)
      } else if (type === "powerup") {
        const notes = [440, 554.37, 659.25, 880]
        notes.forEach((f, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(f, now + idx * 0.05)
          gain.gain.setValueAtTime(0.15, now + idx * 0.05)
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.1)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.05)
          osc.stop(now + idx * 0.05 + 0.1)
        })
      } else if (type === "shield_hit") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.1)
      } else if (type === "nuke") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5)
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.5)
      }
    } catch {
      // Audio fallback silent error handling
    }
  }, [isMuted])

  // Spawn Particle Helper
  const createParticles = useCallback((x: number, y: number, color: string, count = 12, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (Math.random() * 4 + 1) * speedMult
      gsRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: Math.floor(Math.random() * 20 + 20),
        maxLife: 40,
        size: Math.random() * 3 + 1.5,
        color,
        glow: Math.random() > 0.5,
      })
    }
  }, [])

  // Spawn Floating Score Text
  const addFloatingText = useCallback((x: number, y: number, text: string, color = "#ffffff") => {
    gsRef.current.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    })
  }, [])

  // Generate Bunkers (Shield Matrix)
  const generateBunkers = useCallback((count: number) => {
    const bunkers: BunkerBlock[] = []
    const bunkerWidth = 72
    const bunkerHeight = 44
    const totalSpan = CANVAS_WIDTH - 120
    const spacing = totalSpan / (count + 1)

    const cols = 9
    const rows = 6
    const blockW = bunkerWidth / cols
    const blockH = bunkerHeight / rows

    for (let b = 1; b <= count; b++) {
      const startX = 60 + spacing * b - bunkerWidth / 2
      const startY = CANVAS_HEIGHT - 145

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Arch notch in bottom center
          if (r >= 4 && c >= 3 && c <= 5) continue
          // Top rounded corners
          if (r === 0 && (c === 0 || c === cols - 1)) continue

          bunkers.push({
            x: startX + c * blockW,
            y: startY + r * blockH,
            width: blockW,
            height: blockH,
            hp: 3,
            maxHp: 3,
            bunkerIndex: b,
          })
        }
      }
    }
    return bunkers
  }, [])

  // Generate Invaders Grid
  const generateInvaders = useCallback((waveNum: number): InvaderEntity[] => {
    const invaders: InvaderEntity[] = []
    const startX = 80
    const startY = 80 + Math.min(waveNum * 6, 40)

    for (let r = 0; r < INVADER_ROWS; r++) {
      let type: InvaderType = "octopus"
      let pts = 10
      let clr = "#38bdf8"
      let hp = 1

      if (r === 0) {
        type = "squid"
        pts = 30
        clr = "#a855f7"
      } else if (r === 1 || r === 2) {
        type = "crab"
        pts = 20
        clr = "#f43f5e"
      } else if (r === 3 && waveNum >= 3) {
        type = "elite"
        pts = 40
        clr = "#f59e0b"
        hp = 2
      } else {
        type = "octopus"
        pts = 10
        clr = "#38bdf8"
      }

      for (let c = 0; c < INVADER_COLS; c++) {
        invaders.push({
          id: `${r}-${c}`,
          x: startX + c * INVADER_X_SPACING,
          y: startY + r * INVADER_Y_SPACING,
          width: INVADER_WIDTH,
          height: INVADER_HEIGHT,
          type,
          row: r,
          col: c,
          alive: true,
          hp,
          maxHp: hp,
          points: pts,
          color: clr,
        })
      }
    }
    return invaders
  }, [])

  // Spawn Boss Invader
  const spawnBoss = useCallback((waveNum: number) => {
    const hp = 80 + waveNum * 40
    gsRef.current.boss = {
      active: true,
      x: CANVAS_WIDTH / 2 - 80,
      y: 65,
      width: 160,
      height: 70,
      hp,
      maxHp: hp,
      phase: 1,
      dx: 2.2,
      attackTimer: 0,
      color: "#ec4899",
    }
  }, [])

  // Initialize Stars Background
  const initStars = useCallback(() => {
    const stars: Star[] = []
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        brightness: Math.random(),
      })
    }
    return stars
  }, [])

  // Start / Reset Game
  const initGame = useCallback(
    (targetDiff: Difficulty = difficulty) => {
      initAudio()
      const cfg = DIFFICULTY_SETTINGS[targetDiff]

      gsRef.current.gameState = "playing"
      gsRef.current.difficulty = targetDiff
      gsRef.current.score = 0
      gsRef.current.lives = cfg.lives
      gsRef.current.wave = 1
      gsRef.current.combo = 0
      gsRef.current.maxCombo = 0
      gsRef.current.aliensDefeated = 0
      gsRef.current.ufosDestroyed = 0
      gsRef.current.shotsFired = 0
      gsRef.current.shotsHit = 0
      gsRef.current.invaderDirection = 1
      gsRef.current.lastInvaderStep = Date.now()
      gsRef.current.invaderStepInterval = Math.max(250, 700 / cfg.invaderSpeed)
      gsRef.current.lastInvaderShot = Date.now()
      gsRef.current.lastUfoSpawn = Date.now()
      gsRef.current.lastPlayerShot = 0
      gsRef.current.screenShake = 0
      gsRef.current.marchStep = 0

      gsRef.current.player = {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - 65,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speed: BASE_PLAYER_SPEED,
        shieldActive: false,
        shieldTime: 0,
        weaponType: "standard",
        weaponTime: 0,
        nukeCharges: 0,
        invulnerableTime: 0,
      }

      gsRef.current.boss.active = false
      gsRef.current.ufo.active = false
      gsRef.current.invaders = generateInvaders(1)
      gsRef.current.bullets = []
      gsRef.current.bunkers = generateBunkers(cfg.bunkerCount)
      gsRef.current.powerups = []
      gsRef.current.particles = []
      gsRef.current.floatingTexts = []
      gsRef.current.stars = initStars()

      setGameState("playing")
      setScore(0)
      setLives(cfg.lives)
      setWave(1)
      setCombo(0)
      setMaxCombo(0)
      setActivePowerup(null)
    },
    [difficulty, generateInvaders, generateBunkers, initStars, initAudio],
  )

  // Fire Weapon
  const firePlayerWeapon = useCallback(() => {
    const { player, bullets } = gsRef.current
    if (gsRef.current.gameState !== "playing") return

    const now = Date.now()
    const fireCooldown = player.weaponType === "double" ? 180 : player.weaponType === "spread" ? 240 : 220
    if (now - gsRef.current.lastPlayerShot < fireCooldown) return

    gsRef.current.lastPlayerShot = now
    gsRef.current.shotsFired++
    setShotsFired(gsRef.current.shotsFired)

    const centerX = player.x + player.width / 2
    const topY = player.y - 4

    playSynthSound("laser_player")

    if (player.weaponType === "double") {
      bullets.push({
        x: centerX - 12,
        y: topY,
        vx: 0,
        vy: -BASE_BULLET_SPEED,
        width: 3.5,
        height: BULLET_HEIGHT,
        isPlayer: true,
        damage: 1,
        color: POWERUP_CONFIGS.double.color,
        piercing: false,
      })
      bullets.push({
        x: centerX + 8,
        y: topY,
        vx: 0,
        vy: -BASE_BULLET_SPEED,
        width: 3.5,
        height: BULLET_HEIGHT,
        isPlayer: true,
        damage: 1,
        color: POWERUP_CONFIGS.double.color,
        piercing: false,
      })
    } else if (player.weaponType === "spread") {
      bullets.push({
        x: centerX - 2,
        y: topY,
        vx: 0,
        vy: -BASE_BULLET_SPEED,
        width: 4,
        height: BULLET_HEIGHT,
        isPlayer: true,
        damage: 1,
        color: POWERUP_CONFIGS.spread.color,
        piercing: false,
      })
      bullets.push({
        x: centerX - 6,
        y: topY,
        vx: -2.2,
        vy: -BASE_BULLET_SPEED * 0.9,
        width: 4,
        height: BULLET_HEIGHT,
        isPlayer: true,
        damage: 1,
        color: POWERUP_CONFIGS.spread.color,
        piercing: false,
      })
      bullets.push({
        x: centerX + 2,
        y: topY,
        vx: 2.2,
        vy: -BASE_BULLET_SPEED * 0.9,
        width: 4,
        height: BULLET_HEIGHT,
        isPlayer: true,
        damage: 1,
        color: POWERUP_CONFIGS.spread.color,
        piercing: false,
      })
    } else if (player.weaponType === "laser") {
      bullets.push({
        x: centerX - 3,
        y: topY,
        vx: 0,
        vy: -BASE_BULLET_SPEED * 1.3,
        width: 6,
        height: BULLET_HEIGHT + 6,
        isPlayer: true,
        damage: 2,
        color: POWERUP_CONFIGS.laser.color,
        piercing: true,
      })
    } else {
      // Standard Laser
      bullets.push({
        x: centerX - BULLET_WIDTH / 2,
        y: topY,
        vx: 0,
        vy: -BASE_BULLET_SPEED,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        isPlayer: true,
        damage: 1,
        color: themeColor,
        piercing: false,
      })
    }
  }, [themeColor, playSynthSound])

  // Trigger Orbital Nuke
  const triggerNuke = useCallback(() => {
    const { player, invaders, particles } = gsRef.current
    if (player.nukeCharges <= 0) return

    player.nukeCharges--
    gsRef.current.screenShake = 18
    playSynthSound("nuke")

    // Destroy lowest row of alive invaders
    const alive = invaders.filter((i) => i.alive)
    if (alive.length > 0) {
      const maxRow = Math.max(...alive.map((i) => i.row))
      alive.forEach((inv) => {
        if (inv.row === maxRow) {
          inv.alive = false
          gsRef.current.score += inv.points * 2
          gsRef.current.aliensDefeated++
          createParticles(inv.x + inv.width / 2, inv.y + inv.height / 2, "#ef4444", 16, 1.8)
          addFloatingText(inv.x, inv.y, `+${inv.points * 2} NUKE`, "#ef4444")
        }
      })
      setScore(gsRef.current.score)
      setAliensDefeated(gsRef.current.aliensDefeated)
    }

    // Flash particles screen wide
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        maxLife: 30,
        size: Math.random() * 4 + 2,
        color: "#ef4444",
        glow: true,
      })
    }
  }, [playSynthSound, createParticles, addFloatingText])

  // Drop Powerup Opportunity
  const tryDropPowerup = useCallback(
    (x: number, y: number) => {
      const cfg = DIFFICULTY_SETTINGS[gsRef.current.difficulty]
      if (Math.random() < cfg.dropRate) {
        const types: PowerUpType[] = ["double", "laser", "spread", "shield", "freeze", "nuke", "repair"]
        const chosen = types[Math.floor(Math.random() * types.length)]
        gsRef.current.powerups.push({
          x,
          y,
          vy: 1.8,
          type: chosen,
          color: POWERUP_CONFIGS[chosen].color,
          size: 16,
        })
      }
    },
    [],
  )

  // Main Game Loop Update Logic
  const updateGame = useCallback(() => {
    const {
      gameState: state,
      player,
      invaders,
      boss,
      ufo,
      bullets,
      bunkers,
      powerups,
      particles,
      floatingTexts,
      stars,
      difficulty: diff,
    } = gsRef.current

    if (state !== "playing") return

    const now = Date.now()
    const cfg = DIFFICULTY_SETTINGS[diff]

    // 1. Update Player Movement
    if (keysRef.current.left) {
      player.x = Math.max(10, player.x - player.speed)
    }
    if (keysRef.current.right) {
      player.x = Math.min(CANVAS_WIDTH - player.width - 10, player.x + player.speed)
    }
    if ((keysRef.current.shoot || autoFire) && now - gsRef.current.lastPlayerShot > 200) {
      firePlayerWeapon()
    }
    if (keysRef.current.nuke) {
      keysRef.current.nuke = false
      triggerNuke()
    }

    // Weapon/Shield Time Counters
    if (player.shieldActive) {
      player.shieldTime -= 16
      if (player.shieldTime <= 0) {
        player.shieldActive = false
        setActivePowerup(null)
      } else {
        setActivePowerup({
          type: "shield",
          label: POWERUP_CONFIGS.shield.label,
          percent: (player.shieldTime / POWERUP_CONFIGS.shield.duration) * 100,
        })
      }
    } else if (player.weaponType !== "standard") {
      player.weaponTime -= 16
      if (player.weaponTime <= 0) {
        player.weaponType = "standard"
        setActivePowerup(null)
      } else {
        const conf = POWERUP_CONFIGS[player.weaponType as PowerUpType]
        if (conf) {
          setActivePowerup({
            type: player.weaponType as PowerUpType,
            label: conf.label,
            percent: (player.weaponTime / conf.duration) * 100,
          })
        }
      }
    }

    if (player.invulnerableTime > 0) player.invulnerableTime -= 16

    // 2. Stars Parallax Movement
    stars.forEach((s) => {
      s.y += s.speed
      if (s.y > CANVAS_HEIGHT) {
        s.y = 0
        s.x = Math.random() * CANVAS_WIDTH
      }
    })

    // 3. Invader March & AI Movement
    const aliveInvaders = invaders.filter((i) => i.alive)
    const totalInvaders = aliveInvaders.length

    // Dynamic march speed accelerates as invaders die
    const speedRatio = Math.max(0.18, totalInvaders / (INVADER_ROWS * INVADER_COLS))
    const currentStepInterval = Math.max(80, gsRef.current.invaderStepInterval * speedRatio)

    if (totalInvaders > 0 && now - gsRef.current.lastInvaderStep > currentStepInterval) {
      gsRef.current.lastInvaderStep = now
      gsRef.current.marchStep = (gsRef.current.marchStep + 1) % 4
      playSynthSound("march", gsRef.current.marchStep)

      let edgeHit = false
      for (const inv of aliveInvaders) {
        if (
          (gsRef.current.invaderDirection > 0 && inv.x + inv.width >= CANVAS_WIDTH - 25) ||
          (gsRef.current.invaderDirection < 0 && inv.x <= 25)
        ) {
          edgeHit = true
          break
        }
      }

      if (edgeHit) {
        gsRef.current.invaderDirection *= -1
        for (const inv of aliveInvaders) {
          inv.y += 18
          // Alien Invasion Reached Bottom Barrier -> Loss
          if (inv.y + inv.height >= player.y - 10) {
            gsRef.current.gameState = "gameover"
            setGameState("gameover")
            checkAndSaveHighScore(gsRef.current.score, diff)
            playSynthSound("explosion_large")
            return
          }
        }
      } else {
        const stepDist = 8 * cfg.invaderSpeed
        for (const inv of aliveInvaders) {
          inv.x += stepDist * gsRef.current.invaderDirection
        }
      }
    }

    // Invader Firing Logic
    if (
      totalInvaders > 0 &&
      now - gsRef.current.lastInvaderShot > cfg.alienFireInterval * (0.6 + Math.random() * 0.8)
    ) {
      gsRef.current.lastInvaderShot = now
      const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)]
      bullets.push({
        x: shooter.x + shooter.width / 2 - BULLET_WIDTH / 2,
        y: shooter.y + shooter.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 5.5 * cfg.invaderSpeed,
        width: BULLET_WIDTH + 1,
        height: BULLET_HEIGHT,
        isPlayer: false,
        damage: 1,
        color: shooter.color,
        piercing: false,
      })
      playSynthSound("laser_invader")
    }

    // 4. Mystery UFO Spawning & Update
    if (!ufo.active && now - gsRef.current.lastUfoSpawn > 16000 + Math.random() * 12000) {
      ufo.active = true
      ufo.x = -60
      ufo.speed = 2.8
      gsRef.current.lastUfoSpawn = now
    }
    if (ufo.active) {
      ufo.x += ufo.speed
      if (Math.random() < 0.1) playSynthSound("ufo")
      if (ufo.x > CANVAS_WIDTH + 60) ufo.active = false
    }

    // 5. Boss Mothership AI (Milestone Waves)
    if (boss.active) {
      boss.x += boss.dx
      if (boss.x <= 20 || boss.x + boss.width >= CANVAS_WIDTH - 20) {
        boss.dx *= -1
      }
      boss.attackTimer += 16
      if (boss.attackTimer > 1200) {
        boss.attackTimer = 0
        // Dual laser salvo
        bullets.push({
          x: boss.x + 30,
          y: boss.y + boss.height,
          vx: -1,
          vy: 6.5,
          width: 5,
          height: 16,
          isPlayer: false,
          damage: 1,
          color: "#ec4899",
          piercing: false,
        })
        bullets.push({
          x: boss.x + boss.width - 35,
          y: boss.y + boss.height,
          vx: 1,
          vy: 6.5,
          width: 5,
          height: 16,
          isPlayer: false,
          damage: 1,
          color: "#ec4899",
          piercing: false,
        })
        playSynthSound("laser_invader")
      }
    }

    // 6. Bullets Motion & Collision Physics
    for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = bullets[bIdx]
      b.x += b.vx
      b.y += b.vy

      // Out of bounds
      if (b.y < -20 || b.y > CANVAS_HEIGHT + 20 || b.x < -20 || b.x > CANVAS_WIDTH + 20) {
        bullets.splice(bIdx, 1)
        continue
      }

      // Check Collision with Bunkers
      let hitBunker = false
      for (let bkIdx = bunkers.length - 1; bkIdx >= 0; bkIdx--) {
        const bk = bunkers[bkIdx]
        if (b.x < bk.x + bk.width && b.x + b.width > bk.x && b.y < bk.y + bk.height && b.y + b.height > bk.y) {
          bk.hp -= b.damage
          hitBunker = true
          createParticles(b.x, b.y, "#10b981", 5)
          playSynthSound("shield_hit")
          if (bk.hp <= 0) bunkers.splice(bkIdx, 1)
          break
        }
      }
      if (hitBunker) {
        bullets.splice(bIdx, 1)
        continue
      }

      // Player Bullet Hits
      if (b.isPlayer) {
        // Hit UFO
        if (
          ufo.active &&
          b.x < ufo.x + ufo.width &&
          b.x + b.width > ufo.x &&
          b.y < ufo.y + ufo.height &&
          b.y + b.height > ufo.y
        ) {
          ufo.active = false
          gsRef.current.score += ufo.points
          gsRef.current.ufosDestroyed++
          setScore(gsRef.current.score)
          setUfosDestroyed(gsRef.current.ufosDestroyed)
          createParticles(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, "#f43f5e", 20, 1.5)
          addFloatingText(ufo.x, ufo.y, `+${ufo.points} UFO!`, "#f43f5e")
          playSynthSound("explosion_large")
          tryDropPowerup(ufo.x + ufo.width / 2, ufo.y + ufo.height)
          if (!b.piercing) {
            bullets.splice(bIdx, 1)
            continue
          }
        }

        // Hit Boss Mothership
        if (
          boss.active &&
          b.x < boss.x + boss.width &&
          b.x + b.width > boss.x &&
          b.y < boss.y + boss.height &&
          b.y + b.height > boss.y
        ) {
          boss.hp -= b.damage
          createParticles(b.x, b.y, "#ec4899", 8)
          playSynthSound("shield_hit")
          if (boss.hp <= 0) {
            boss.active = false
            gsRef.current.score += 1500
            setScore(gsRef.current.score)
            createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, "#ec4899", 40, 2)
            addFloatingText(boss.x + boss.width / 2 - 30, boss.y, "+1500 BOSS DESTROYED!", "#ec4899")
            playSynthSound("explosion_large")
            gsRef.current.screenShake = 22
          }
          if (!b.piercing) {
            bullets.splice(bIdx, 1)
            continue
          }
        }

        // Hit Invader
        let hitInvader = false
        for (const inv of invaders) {
          if (
            inv.alive &&
            b.x < inv.x + inv.width &&
            b.x + b.width > inv.x &&
            b.y < inv.y + inv.height &&
            b.y + b.height > inv.y
          ) {
            inv.hp -= b.damage
            hitInvader = true
            gsRef.current.shotsHit++
            setShotsHit(gsRef.current.shotsHit)

            if (inv.hp <= 0) {
              inv.alive = false
              gsRef.current.combo++
              const comboBonus = Math.min(gsRef.current.combo * 5, 100)
              const awardedPts = inv.points + comboBonus
              gsRef.current.score += awardedPts
              gsRef.current.aliensDefeated++

              if (gsRef.current.combo > gsRef.current.maxCombo) {
                gsRef.current.maxCombo = gsRef.current.combo
                setMaxCombo(gsRef.current.maxCombo)
              }

              setScore(gsRef.current.score)
              setCombo(gsRef.current.combo)
              setAliensDefeated(gsRef.current.aliensDefeated)

              createParticles(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color, 14)
              addFloatingText(inv.x, inv.y, `+${awardedPts}`, inv.color)
              playSynthSound("explosion_small")
              tryDropPowerup(inv.x + inv.width / 2, inv.y + inv.height)
            }
            break
          }
        }

        if (hitInvader && !b.piercing) {
          bullets.splice(bIdx, 1)
          continue
        }
      } else {
        // Enemy Bullet Hits Player
        if (
          player.invulnerableTime <= 0 &&
          b.x < player.x + player.width &&
          b.x + b.width > player.x &&
          b.y < player.y + player.height &&
          b.y + b.height > player.y
        ) {
          bullets.splice(bIdx, 1)

          if (player.shieldActive) {
            player.shieldActive = false
            setActivePowerup(null)
            createParticles(player.x + player.width / 2, player.y + player.height / 2, "#10b981", 15)
            playSynthSound("shield_hit")
          } else {
            gsRef.current.lives--
            gsRef.current.combo = 0
            setLives(gsRef.current.lives)
            setCombo(0)
            player.invulnerableTime = 2000
            gsRef.current.screenShake = 14
            createParticles(player.x + player.width / 2, player.y + player.height / 2, "#ef4444", 25, 1.5)
            playSynthSound("explosion_large")

            if (gsRef.current.lives <= 0) {
              gsRef.current.gameState = "gameover"
              setGameState("gameover")
              checkAndSaveHighScore(gsRef.current.score, diff)
              return
            }
          }
        }
      }
    }

    // 7. Powerups Fall & Collection
    for (let pIdx = powerups.length - 1; pIdx >= 0; pIdx--) {
      const p = powerups[pIdx]
      p.y += p.vy
      if (p.y > CANVAS_HEIGHT + 20) {
        powerups.splice(pIdx, 1)
        continue
      }

      if (
        p.x < player.x + player.width &&
        p.x + p.size > player.x &&
        p.y < player.y + player.height &&
        p.y + p.size > player.y
      ) {
        // Collect Powerup
        playSynthSound("powerup")
        addFloatingText(player.x, player.y - 15, `POWERUP: ${POWERUP_CONFIGS[p.type].label}!`, p.color)

        if (p.type === "shield") {
          player.shieldActive = true
          player.shieldTime = POWERUP_CONFIGS.shield.duration
        } else if (p.type === "nuke") {
          player.nukeCharges++
          addFloatingText(player.x, player.y - 35, "+1 NUKE CHARGE!", "#ef4444")
        } else if (p.type === "repair") {
          gsRef.current.bunkers = generateBunkers(cfg.bunkerCount)
          addFloatingText(player.x, player.y - 35, "BUNKERS REPAIRED!", "#ec4899")
        } else if (p.type === "freeze") {
          gsRef.current.invaderStepInterval *= 2.2
          setTimeout(() => {
            gsRef.current.invaderStepInterval = Math.max(250, 700 / cfg.invaderSpeed)
          }, POWERUP_CONFIGS.freeze.duration)
        } else {
          player.weaponType = p.type
          player.weaponTime = POWERUP_CONFIGS[p.type].duration
        }

        powerups.splice(pIdx, 1)
      }
    }

    // 8. Wave Clear -> Advance to Next Wave
    if (invaders.filter((i) => i.alive).length === 0 && !boss.active) {
      const nextWave = gsRef.current.wave + 1
      gsRef.current.wave = nextWave
      setWave(nextWave)

      if (nextWave % 5 === 0) {
        spawnBoss(nextWave)
        addFloatingText(CANVAS_WIDTH / 2 - 80, 150, `WAVE ${nextWave}: MOTHERSHIP BOSS!`, "#ec4899")
      } else {
        gsRef.current.invaders = generateInvaders(nextWave)
        addFloatingText(CANVAS_WIDTH / 2 - 60, 200, `WAVE ${nextWave} INCOMING!`, themeColor)
      }

      // Bonus points for clear
      gsRef.current.score += 500 * nextWave
      setScore(gsRef.current.score)
      playSynthSound("powerup")
    }

    // 9. Particles Update
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i]
      pt.x += pt.vx
      pt.y += pt.vy
      pt.vx *= 0.96
      pt.vy *= 0.96
      pt.life--
      if (pt.life <= 0) particles.splice(i, 1)
    }

    // 10. Floating Texts Update
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i]
      ft.y += ft.vy
      ft.alpha -= 0.02
      if (ft.alpha <= 0) floatingTexts.splice(i, 1)
    }

    // Decay Screen Shake
    if (gsRef.current.screenShake > 0) gsRef.current.screenShake *= 0.88
  }, [
    firePlayerWeapon,
    triggerNuke,
    tryDropPowerup,
    playSynthSound,
    generateInvaders,
    generateBunkers,
    spawnBoss,
    createParticles,
    addFloatingText,
    checkAndSaveHighScore,
    autoFire,
    themeColor,
  ])

  // Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const {
      player,
      invaders,
      boss,
      ufo,
      bullets,
      bunkers,
      powerups,
      particles,
      floatingTexts,
      stars,
      screenShake,
      difficulty: diff,
    } = gsRef.current

    ctx.save()

    // Handle Screen Shake
    if (screenShake > 0.5) {
      const shakeX = (Math.random() - 0.5) * screenShake
      const shakeY = (Math.random() - 0.5) * screenShake
      ctx.translate(shakeX, shakeY)
    }

    // Clear Space Canvas
    ctx.fillStyle = "#030712"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Render Parallax Stars
    stars.forEach((s) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + s.brightness * 0.7})`
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()
    })

    // Render Aim Trajectory Guide Line for Cadet mode
    if (DIFFICULTY_SETTINGS[diff].showAimLine && gsRef.current.gameState === "playing") {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)"
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.moveTo(player.x + player.width / 2, player.y)
      ctx.lineTo(player.x + player.width / 2, 0)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Render Bunkers (Shield Matrix)
    bunkers.forEach((bk) => {
      const ratio = bk.hp / bk.maxHp
      ctx.fillStyle = ratio > 0.66 ? "#10b981" : ratio > 0.33 ? "#f59e0b" : "#ef4444"
      ctx.fillRect(bk.x, bk.y, bk.width, bk.height)
      ctx.strokeStyle = "rgba(0,0,0,0.4)"
      ctx.strokeRect(bk.x, bk.y, bk.width, bk.height)
    })

    // Render Invaders with Pixel Art Aesthetics
    invaders.forEach((inv) => {
      if (!inv.alive) return

      ctx.save()
      ctx.fillStyle = inv.color
      ctx.shadowColor = inv.color
      ctx.shadowBlur = 8

      const x = inv.x
      const y = inv.y
      const w = inv.width
      const h = inv.height

      if (inv.type === "squid") {
        // Top Row Squid Invader
        ctx.fillRect(x + w * 0.35, y, w * 0.3, h * 0.2)
        ctx.fillRect(x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.4)
        ctx.fillRect(x, y + h * 0.6, w, h * 0.2)
        ctx.fillRect(x + w * 0.1, y + h * 0.8, w * 0.2, h * 0.2)
        ctx.fillRect(x + w * 0.7, y + h * 0.8, w * 0.2, h * 0.2)

        // Eyes
        ctx.fillStyle = "#000000"
        ctx.fillRect(x + w * 0.25, y + h * 0.3, w * 0.15, h * 0.18)
        ctx.fillRect(x + w * 0.6, y + h * 0.3, w * 0.15, h * 0.18)
      } else if (inv.type === "crab") {
        // Middle Row Crab Invader
        ctx.fillRect(x + w * 0.2, y, w * 0.6, h * 0.25)
        ctx.fillRect(x, y + h * 0.25, w, h * 0.45)
        ctx.fillRect(x + w * 0.15, y + h * 0.7, w * 0.25, h * 0.3)
        ctx.fillRect(x + w * 0.6, y + h * 0.7, w * 0.25, h * 0.3)

        // Eyes
        ctx.fillStyle = "#000000"
        ctx.fillRect(x + w * 0.2, y + h * 0.35, w * 0.18, h * 0.18)
        ctx.fillRect(x + w * 0.62, y + h * 0.35, w * 0.18, h * 0.18)
      } else if (inv.type === "elite") {
        // Commander Elite Invader
        ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8)
        ctx.fillRect(x + w * 0.4, y, w * 0.2, h * 0.2)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(x + w * 0.3, y + h * 0.35, w * 0.4, h * 0.3)
      } else {
        // Bottom Row Octopus Invader
        ctx.fillRect(x + w * 0.25, y, w * 0.5, h * 0.2)
        ctx.fillRect(x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.5)
        ctx.fillRect(x, y + h * 0.7, w * 0.2, h * 0.3)
        ctx.fillRect(x + w * 0.4, y + h * 0.7, w * 0.2, h * 0.3)
        ctx.fillRect(x + w * 0.8, y + h * 0.7, w * 0.2, h * 0.3)

        // Eyes
        ctx.fillStyle = "#000000"
        ctx.fillRect(x + w * 0.25, y + h * 0.35, w * 0.16, h * 0.16)
        ctx.fillRect(x + w * 0.59, y + h * 0.35, w * 0.16, h * 0.16)
      }

      ctx.restore()
    })

    // Render Mystery UFO
    if (ufo.active) {
      ctx.save()
      ctx.fillStyle = "#f43f5e"
      ctx.shadowColor = "#f43f5e"
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.ellipse(
        ufo.x + ufo.width / 2,
        ufo.y + ufo.height / 2,
        ufo.width / 2,
        ufo.height / 2,
        0,
        0,
        Math.PI * 2,
      )
      ctx.fill()
      ctx.fillStyle = "#fef08a"
      ctx.fillRect(ufo.x + ufo.width * 0.35, ufo.y + ufo.height * 0.15, ufo.width * 0.3, ufo.height * 0.35)
      ctx.restore()
    }

    // Render Boss Mothership
    if (boss.active) {
      ctx.save()
      ctx.fillStyle = boss.color
      ctx.shadowColor = boss.color
      ctx.shadowBlur = 16
      ctx.fillRect(boss.x, boss.y + 15, boss.width, boss.height - 30)
      ctx.fillRect(boss.x + 30, boss.y, boss.width - 60, boss.height)

      // Core Energy Dome
      ctx.fillStyle = "#67e8f9"
      ctx.beginPath()
      ctx.arc(boss.x + boss.width / 2, boss.y + boss.height / 2, 18, 0, Math.PI * 2)
      ctx.fill()

      // Health Bar
      const hpWidth = (boss.hp / boss.maxHp) * boss.width
      ctx.fillStyle = "rgba(0,0,0,0.6)"
      ctx.fillRect(boss.x, boss.y - 12, boss.width, 6)
      ctx.fillStyle = "#ec4899"
      ctx.fillRect(boss.x, boss.y - 12, hpWidth, 6)
      ctx.restore()
    }

    // Render Bullets
    bullets.forEach((b) => {
      ctx.save()
      ctx.fillStyle = b.color
      ctx.shadowColor = b.color
      ctx.shadowBlur = b.isPlayer ? 10 : 6
      ctx.fillRect(b.x, b.y, b.width, b.height)
      ctx.restore()
    })

    // Render Powerups Drops
    powerups.forEach((p) => {
      ctx.save()
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#000000"
      ctx.font = "bold 9px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(POWERUP_CONFIGS[p.type]?.symbol || "P", p.x, p.y)
      ctx.restore()
    })

    // Render Player Spaceship
    if (gsRef.current.gameState === "playing") {
      ctx.save()
      const px = player.x
      const py = player.y
      const pw = player.width
      const ph = player.height

      // Invulnerability Blink
      if (player.invulnerableTime % 200 > 100) {
        ctx.globalAlpha = 0.4
      }

      // Hull
      ctx.fillStyle = themeColor
      ctx.shadowColor = themeColor
      ctx.shadowBlur = 12

      // Main Wing Base
      ctx.fillRect(px, py + ph * 0.4, pw, ph * 0.6)
      // Cockpit & Cannon Nose
      ctx.fillRect(px + pw * 0.35, py, pw * 0.3, ph * 0.5)
      ctx.fillRect(px + pw * 0.44, py - 6, pw * 0.12, 8)

      // Thruster Flame
      ctx.fillStyle = "#f59e0b"
      ctx.fillRect(px + pw * 0.25, py + ph, pw * 0.15, 6 + Math.random() * 4)
      ctx.fillRect(px + pw * 0.6, py + ph, pw * 0.15, 6 + Math.random() * 4)

      // Active Energy Shield Aura
      if (player.shieldActive) {
        ctx.strokeStyle = "#10b981"
        ctx.lineWidth = 3
        ctx.shadowColor = "#10b981"
        ctx.shadowBlur = 14
        ctx.beginPath()
        ctx.arc(px + pw / 2, py + ph / 2, pw * 0.8, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.restore()
    }

    // Render Particles
    particles.forEach((pt) => {
      ctx.save()
      ctx.fillStyle = pt.color
      if (pt.glow) {
        ctx.shadowColor = pt.color
        ctx.shadowBlur = 8
      }
      ctx.globalAlpha = pt.life / pt.maxLife
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Render Floating Text Labels
    floatingTexts.forEach((ft) => {
      ctx.save()
      ctx.fillStyle = ft.color
      ctx.globalAlpha = Math.max(0, ft.alpha)
      ctx.font = "bold 13px sans-serif"
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.restore()
    })

    ctx.restore()
  }, [themeColor])

  // Main Loop Handler
  const gameLoop = useCallback(() => {
    updateGame()
    renderCanvas()
    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, renderCanvas])

  // Start Animation Frame Loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameLoop])

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) keysRef.current.left = true
      if (["ArrowRight", "KeyD"].includes(e.code)) keysRef.current.right = true
      if (["Space", "ArrowUp"].includes(e.code)) {
        e.preventDefault()
        keysRef.current.shoot = true
        firePlayerWeapon()
      }
      if (["ShiftLeft", "ShiftRight", "KeyE"].includes(e.code)) keysRef.current.nuke = true
      if (e.code === "KeyP" || e.code === "Escape") {
        if (gsRef.current.gameState === "playing") {
          gsRef.current.gameState = "paused"
          setGameState("paused")
        } else if (gsRef.current.gameState === "paused") {
          gsRef.current.gameState = "playing"
          setGameState("playing")
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) keysRef.current.left = false
      if (["ArrowRight", "KeyD"].includes(e.code)) keysRef.current.right = false
      if (["Space", "ArrowUp"].includes(e.code)) keysRef.current.shoot = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [firePlayerWeapon])

  // Mouse/Pointer Drag Control for Canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gsRef.current.gameState !== "playing") return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const pointerX = (e.clientX - rect.left) * scaleX
    gsRef.current.player.x = Math.max(10, Math.min(CANVAS_WIDTH - PLAYER_WIDTH - 10, pointerX - PLAYER_WIDTH / 2))
  }

  const accuracyPercent = shotsFired > 0 ? Math.min(100, Math.round((shotsHit / shotsFired) * 100)) : 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-sans select-none text-slate-100">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20"
              style={{ backgroundColor: themeColor }}
            >
              <Rocket className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                SPACE INVADERS
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-mono">
                  PRO v2.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">Defend Earth from alien armadas</p>
            </div>
          </div>
        </div>

        {/* Audio Mute & Pause Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="outline"
            size="icon"
            className="border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </Button>

          {gameState === "playing" && (
            <Button
              onClick={() => {
                gsRef.current.gameState = "paused"
                setGameState("paused")
              }}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
            >
              <Pause className="w-4 h-4 mr-1" /> Pause
            </Button>
          )}
        </div>
      </div>

      {/* Main Game Screen Frame */}
      <div className="relative w-full max-w-4xl flex flex-col items-center">
        {/* Canvas Workspace */}
        <div className="relative border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/40 bg-slate-950">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerMove={handlePointerMove}
            onPointerDown={firePlayerWeapon}
            className="block max-w-full h-auto cursor-crosshair touch-none"
          />

          {/* Active HUD Bar overlay during gameplay */}
          {gameState === "playing" && (
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none text-xs font-mono">
              <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400">SCORE:</span>{" "}
                  <span className="text-cyan-400 font-bold text-sm">{score}</span>
                </div>
                <div>
                  <span className="text-slate-400">WAVE:</span>{" "}
                  <span className="text-amber-400 font-bold">{wave}</span>
                </div>
                {combo > 1 && (
                  <div className="animate-pulse">
                    <span className="text-rose-400 font-bold">{combo}x STREAK</span>
                  </div>
                )}
              </div>

              {/* Power-up duration indicator */}
              {activePowerup && (
                <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-800/50">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                  <span className="text-cyan-300 font-semibold">{activePowerup.label}</span>
                  <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-100"
                      style={{ width: `${activePowerup.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Lives and Nuke Indicator */}
              <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 mr-1">SHIPS:</span>
                  {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                    <Rocket key={i} className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                  ))}
                </div>
                {gsRef.current.player.nukeCharges > 0 && (
                  <div className="flex items-center gap-1 text-rose-400 font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>NUKE ({gsRef.current.player.nukeCharges})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MAIN MENU OVERLAY */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6">
              <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800 text-white p-6 shadow-2xl">
                <div className="text-center mb-6">
                  <div
                    className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Rocket className="w-8 h-8 text-slate-950" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1">SPACE INVADERS PRO</h2>
                  <p className="text-xs text-slate-400">Select difficulty and clear alien waves</p>
                </div>

                {/* Difficulty Selector Tabs */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block text-left">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((dKey) => {
                      const cfg = DIFFICULTY_SETTINGS[dKey]
                      const isSel = difficulty === dKey
                      return (
                        <button
                          key={dKey}
                          onClick={() => setDifficulty(dKey)}
                          className={`p-3 rounded-xl text-left border transition-all ${
                            isSel
                              ? "border-cyan-500 bg-cyan-950/40 shadow-md shadow-cyan-950/50"
                              : "border-slate-800 bg-slate-950/50 hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-slate-200">{cfg.label}</span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">{cfg.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* High Score Banner */}
                {highScore > 0 && (
                  <div className="mb-6 bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                      <Trophy className="w-4 h-4" />
                      <span>PERSONAL BEST ({DIFFICULTY_SETTINGS[difficulty].label})</span>
                    </div>
                    <span className="font-mono text-base font-bold text-white">{highScore}</span>
                  </div>
                )}

                {/* Controls Info Box */}
                <div className="mb-6 bg-slate-950/60 rounded-xl p-3 text-xs text-slate-300 space-y-1 border border-slate-800/80">
                  <div className="font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-cyan-400" /> Controls:
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Move Ship</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300">
                      ← / → or A / D or Drag Pointer
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Fire Laser</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300">
                      Space / Up Arrow / Tap Screen
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Orbital Nuke</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-rose-400">Shift / E</span>
                  </div>
                </div>

                <Button
                  onClick={() => initGame(difficulty)}
                  style={{ backgroundColor: themeColor }}
                  className="w-full text-slate-950 font-bold py-6 text-base shadow-lg shadow-cyan-500/20 hover:brightness-110"
                >
                  <Play className="w-5 h-5 mr-2 fill-slate-950" /> Launch Defense Mission
                </Button>
              </Card>
            </div>
          )}

          {/* PAUSE OVERLAY */}
          {gameState === "paused" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
              <Card className="w-full max-w-sm bg-slate-900 border-slate-800 text-white p-6 text-center shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">MISSION PAUSED</h3>
                <p className="text-xs text-slate-400 mb-6">Take a breath, defender</p>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      gsRef.current.gameState = "playing"
                      setGameState("playing")
                    }}
                    style={{ backgroundColor: themeColor }}
                    className="w-full text-slate-950 font-bold"
                  >
                    <Play className="w-4 h-4 mr-2 fill-slate-950" /> Resume Battle
                  </Button>
                  <Button
                    onClick={() => initGame(difficulty)}
                    variant="outline"
                    className="w-full border-slate-700 bg-slate-800 text-slate-200"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Restart Mission
                  </Button>
                  <Button
                    onClick={() => setGameState("menu")}
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
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6">
              <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white p-6 text-center shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/40">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-rose-400 mb-1">EARTH HAS FALLEN!</h3>
                <p className="text-xs text-slate-400 mb-6">Alien invaders breached the defense line</p>

                {/* End Game Performance Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">FINAL SCORE</span>
                    <p className="text-xl font-bold font-mono text-cyan-400">{score}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">WAVE REACHED</span>
                    <p className="text-xl font-bold font-mono text-amber-400">{wave}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">ALIENS DESTROYED</span>
                    <p className="text-base font-bold font-mono text-emerald-400">{aliensDefeated}</p>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">LASER ACCURACY</span>
                    <p className="text-base font-bold font-mono text-purple-400">{accuracyPercent}%</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => initGame(difficulty)}
                    style={{ backgroundColor: themeColor }}
                    className="flex-1 text-slate-950 font-bold"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                  </Button>
                  <Button
                    onClick={() => setGameState("menu")}
                    variant="outline"
                    className="border-slate-700 bg-slate-800 text-slate-200"
                  >
                    Menu
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* On-screen Touch Controls for Mobile / Casual Play */}
        {gameState === "playing" && (
          <div className="w-full flex items-center justify-between mt-3 px-2">
            <div className="flex items-center gap-2">
              <Button
                onPointerDown={() => (keysRef.current.left = true)}
                onPointerUp={() => (keysRef.current.left = false)}
                onPointerLeave={() => (keysRef.current.left = false)}
                variant="outline"
                className="w-14 h-12 border-slate-800 bg-slate-900/90 text-slate-200 active:bg-cyan-950 text-lg font-bold"
              >
                ◀
              </Button>
              <Button
                onPointerDown={() => (keysRef.current.right = true)}
                onPointerUp={() => (keysRef.current.right = false)}
                onPointerLeave={() => (keysRef.current.right = false)}
                variant="outline"
                className="w-14 h-12 border-slate-800 bg-slate-900/90 text-slate-200 active:bg-cyan-950 text-lg font-bold"
              >
                ▶
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setAutoFire(!autoFire)}
                variant="outline"
                size="sm"
                className={`border-slate-800 ${autoFire ? "bg-cyan-950 text-cyan-400 border-cyan-700" : "bg-slate-900 text-slate-400"}`}
              >
                Auto-Fire: {autoFire ? "ON" : "OFF"}
              </Button>

              {gsRef.current.player.nukeCharges > 0 && (
                <Button
                  onClick={triggerNuke}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-12 px-4 shadow-lg shadow-rose-950/50"
                >
                  <Flame className="w-4 h-4 mr-1" /> NUKE
                </Button>
              )}

              <Button
                onPointerDown={firePlayerWeapon}
                style={{ backgroundColor: themeColor }}
                className="w-24 h-12 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20"
              >
                FIRE ⚡
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
