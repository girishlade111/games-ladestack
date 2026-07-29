"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Trophy,
  Zap,
  Shield,
  Magnet,
  Snowflake,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  HelpCircle
} from "lucide-react"

// Types & Interfaces
type Difficulty = "casual" | "classic" | "rush" | "insane"
type GameMode = "timed" | "survival" | "stage"
type GameState = "menu" | "playing" | "paused" | "gameOver" | "stageClear"

interface CoinCollectorGameProps {
  onBack: () => void
  themeColor?: string
}

interface Player {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  onGround: boolean
  jumpCount: number
  maxJumps: number
  facing: "left" | "right"
  scaleX: number
  scaleY: number
  trail: { x: number; y: number; alpha: number }[]
  dashCooldown: number
  isDashing: boolean
}

interface Coin {
  id: number
  x: number
  y: number
  baseY: number
  size: number
  collected: boolean
  type: "bronze" | "gold" | "diamond" | "rainbow" | "mystery"
  value: number
  color: string
  glowColor: string
  rotation: number
  floatOffset: number
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: "normal" | "moving" | "crumbling"
  vx?: number
  range?: [number, number]
  crumbleTimer?: number
  isCrumbling?: boolean
  isBroken?: boolean
}

interface Hazard {
  id: number
  type: "spike" | "slime" | "meteor"
  x: number
  y: number
  width: number
  height: number
  vx?: number
  range?: [number, number]
}

interface PowerUpItem {
  id: number
  x: number
  y: number
  type: "magnet" | "shield" | "speed" | "freeze"
  collected: boolean
  duration: number
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
  shape?: "circle" | "star" | "spark" | "dust"
}

interface FloatingText {
  id: number
  text: string
  x: number
  y: number
  color: string
  alpha: number
  scale: number
  vy: number
}

interface Achievement {
  id: string
  title: string
  desc: string
  icon: string
  unlocked: boolean
}

// Config per difficulty
const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    name: string
    timeLimit: number
    scoreMultiplier: number
    hazardSpeed: number
    coinMagnetRange: number
    platformCrumble: boolean
    description: string
    color: string
  }
> = {
  casual: {
    name: "Casual",
    timeLimit: 90,
    scoreMultiplier: 1.0,
    hazardSpeed: 1,
    coinMagnetRange: 180,
    platformCrumble: false,
    description: "Relaxed speed, high magnet range, no deadly hazards.",
    color: "from-emerald-500 to-teal-600",
  },
  classic: {
    name: "Classic",
    timeLimit: 60,
    scoreMultiplier: 1.5,
    hazardSpeed: 2,
    coinMagnetRange: 120,
    platformCrumble: false,
    description: "Standard gameplay with roaming slimes and timed rush.",
    color: "from-blue-500 to-indigo-600",
  },
  rush: {
    name: "Rush",
    timeLimit: 45,
    scoreMultiplier: 2.0,
    hazardSpeed: 3.2,
    coinMagnetRange: 90,
    platformCrumble: false,
    description: "Fast speed, roaming hazards, and double jump precision.",
    color: "from-amber-500 to-orange-600",
  },
  insane: {
    name: "Insane",
    timeLimit: 30,
    scoreMultiplier: 3.0,
    hazardSpeed: 4.5,
    coinMagnetRange: 60,
    platformCrumble: true,
    description: "Crumbling platforms, hyper hazards, maximum score multiplier!",
    color: "from-rose-600 to-purple-700",
  },
}

export default function CoinCollectorGame({ onBack, themeColor = "#f59e0b" }: CoinCollectorGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const keysRef = useRef<Set<string>>(new Set())

  // Game Settings State
  const [difficulty, setDifficulty] = useState<Difficulty>("classic")
  const [gameMode, setGameMode] = useState<GameMode>("timed")
  const [gameState, setGameState] = useState<GameState>("menu")
  const [soundEnabled, setSoundEnabled] = useState(true)

  // In-Game Stats
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [currentStage, setCurrentStage] = useState(1)
  const [stageGoal, setStageGoal] = useState(15)

  // Active Power-ups State
  const [activePowerUps, setActivePowerUps] = useState<{
    magnet: number
    shield: boolean
    speed: number
    freeze: number
    fever: number
  }>({
    magnet: 0,
    shield: false,
    speed: 0,
    freeze: 0,
    fever: 0,
  })

  // Cumulative Stats & Achievements
  const [stats, setStats] = useState({
    totalCoins: 0,
    totalGames: 0,
    totalFevers: 0,
  })
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: "first_coin", title: "First Shine", desc: "Collect your first coin", icon: "🪙", unlocked: false },
    { id: "combo_10", title: "Fever Starter", desc: "Reach a 10x combo streak", icon: "🔥", unlocked: false },
    { id: "century", title: "Coin Hoarder", desc: "Collect 100 coins in total", icon: "💰", unlocked: false },
    { id: "magnet_master", title: "Magnet Master", desc: "Collect a Magnet power-up", icon: "🧲", unlocked: false },
    { id: "insane_survivor", title: "Insane Collector", desc: "Score over 1,000 pts on Insane", icon: "👑", unlocked: false },
  ])

  // Canvas Logic Refs (avoiding React state re-render latency during loop)
  const playerRef = useRef<Player>({
    x: 100,
    y: 350,
    width: 32,
    height: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    jumpCount: 0,
    maxJumps: 2,
    facing: "right",
    scaleX: 1,
    scaleY: 1,
    trail: [],
    dashCooldown: 0,
    isDashing: false,
  })

  const coinsRef = useRef<Coin[]>([])
  const platformsRef = useRef<Platform[]>([])
  const hazardsRef = useRef<Hazard[]>([])
  const powerUpsRef = useRef<PowerUpItem[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatingTextsRef = useRef<FloatingText[]>([])
  const comboTimerRef = useRef<number>(0)
  const cloudOffsetRef = useRef<number>(0)

  // Web Audio Synthesizer Functions
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

  const playSynthTone = useCallback((freq: number, type: OscillatorType, duration: number, startVol = 0.1, endVol = 0.001) => {
    if (!soundEnabled) return
    try {
      initAudio()
      const ctx = audioCtxRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(startVol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(endVol, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // Ignore audio context autoplay errors
    }
  }, [soundEnabled, initAudio])

  const playCoinSound = useCallback((comboMultiplier: number) => {
    if (!soundEnabled) return
    const baseFreq = 587.33 // D5
    const pitchShift = Math.min(comboMultiplier * 40, 600)
    playSynthTone(baseFreq + pitchShift, "sine", 0.12, 0.2, 0.01)
    setTimeout(() => {
      playSynthTone(baseFreq + pitchShift + 300, "triangle", 0.15, 0.15, 0.01)
    }, 40)
  }, [soundEnabled, playSynthTone])

  const playJumpSound = useCallback((isDoubleJump: boolean) => {
    if (!soundEnabled) return
    const freq = isDoubleJump ? 440 : 320
    const endFreq = isDoubleJump ? 880 : 540
    try {
      initAudio()
      const ctx = audioCtxRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {
      // Audio fallback
    }
  }, [soundEnabled, initAudio])

  const playPowerupSound = useCallback(() => {
    if (!soundEnabled) return
    const notes = [440, 554.37, 659.25, 880]
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playSynthTone(freq, "triangle", 0.15, 0.2, 0.01)
      }, idx * 60)
    })
  }, [soundEnabled, playSynthTone])

  const playFeverSound = useCallback(() => {
    if (!soundEnabled) return
    const chord = [523.25, 659.25, 783.99, 1046.5]
    chord.forEach((freq) => playSynthTone(freq, "sine", 0.3, 0.1, 0.01))
  }, [soundEnabled, playSynthTone])

  const playHazardHitSound = useCallback(() => {
    if (!soundEnabled) return
    playSynthTone(140, "sawtooth", 0.25, 0.25, 0.01)
  }, [soundEnabled, playSynthTone])

  const playGameOverSound = useCallback(() => {
    if (!soundEnabled) return
    const notes = [440, 415.3, 392, 349.23]
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playSynthTone(freq, "sawtooth", 0.3, 0.2, 0.01)
      }, idx * 120)
    })
  }, [soundEnabled, playSynthTone])

  // Load High Score & Saved Stats
  useEffect(() => {
    const key = `coin_collector_hs_${difficulty}_${gameMode}`
    const savedHs = localStorage.getItem(key)
    if (savedHs) setHighScore(parseInt(savedHs, 10))

    const savedStats = localStorage.getItem("coin_collector_user_stats")
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats))
      } catch {
        // Parse error fallback
      }
    }

    const savedAch = localStorage.getItem("coin_collector_achievements")
    if (savedAch) {
      try {
        setAchievements(JSON.parse(savedAch))
      } catch {
        // Fallback
      }
    }
  }, [difficulty, gameMode])

  // Check achievements helper
  const unlockAchievement = useCallback((id: string) => {
    setAchievements((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, unlocked: true } : item))
      localStorage.setItem("coin_collector_achievements", JSON.stringify(updated))
      return updated
    })
  }, [])

  // Create Floating Score Indicator
  const spawnFloatingText = useCallback((text: string, x: number, y: number, color = "#facc15") => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1,
      scale: 1,
      vy: -1.5,
    })
  }, [])

  // Spawn Particle FX
  const spawnParticles = useCallback((x: number, y: number, count: number, color: string, shape: "circle" | "star" | "spark" | "dust" = "circle") => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 4 + 1
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        shape,
      })
    }
  }, [])

  // Level Generator
  const generateLevelLayout = useCallback(() => {
    const platforms: Platform[] = [
      // Ground
      { x: 0, y: 480, width: 900, height: 40, type: "normal" },

      // Tier 1
      { x: 120, y: 390, width: 140, height: 18, type: "normal" },
      { x: 380, y: 390, width: 150, height: 18, type: difficulty === "insane" ? "crumbling" : "normal" },
      { x: 640, y: 390, width: 140, height: 18, type: "normal" },

      // Tier 2 (Moving platforms)
      { x: 230, y: 290, width: 130, height: 18, type: "moving", vx: 1.5, range: [180, 420] },
      { x: 520, y: 290, width: 130, height: 18, type: "moving", vx: -1.5, range: [480, 720] },

      // Tier 3 Top level
      { x: 100, y: 190, width: 120, height: 18, type: "normal" },
      { x: 360, y: 170, width: 180, height: 18, type: difficulty === "insane" ? "crumbling" : "normal" },
      { x: 680, y: 190, width: 120, height: 18, type: "normal" },
    ]

    const coins: Coin[] = []
    const hazards: Hazard[] = []
    const powerUps: PowerUpItem[] = []

    platforms.forEach((plat, pIdx) => {
      if (pIdx === 0) return // Skip ground for base coin spawn

      // Spawn coins on platforms
      const coinCount = Math.floor(Math.random() * 3) + 1
      for (let c = 0; c < coinCount; c++) {
        const cx = plat.x + (plat.width / (coinCount + 1)) * (c + 1)
        const cy = plat.y - 25

        const rand = Math.random()
        let type: Coin["type"] = "bronze"
        let value = 10
        let color = "#fbbf24" // Amber gold
        let glowColor = "#fef08a"

        if (rand > 0.95) {
          type = "rainbow"
          value = 100
          color = "#e879f9"
          glowColor = "#f472b6"
        } else if (rand > 0.82) {
          type = "mystery"
          value = 40
          color = "#38bdf8"
          glowColor = "#7dd3fc"
        } else if (rand > 0.65) {
          type = "diamond"
          value = 50
          color = "#a855f7"
          glowColor = "#c084fc"
        } else if (rand > 0.35) {
          type = "gold"
          value = 25
          color = "#f59e0b"
          glowColor = "#fcd34d"
        }

        coins.push({
          id: Math.random(),
          x: cx,
          y: cy,
          baseY: cy,
          size: type === "rainbow" ? 14 : type === "diamond" ? 12 : 10,
          collected: false,
          type,
          value,
          color,
          glowColor,
          rotation: Math.random() * Math.PI,
          floatOffset: Math.random() * Math.PI * 2,
        })
      }
    })

    // Ground level extra coins
    for (let i = 0; i < 5; i++) {
      const gx = 100 + i * 160
      const gy = 450
      coins.push({
        id: Math.random(),
        x: gx,
        y: gy,
        baseY: gy,
        size: 10,
        collected: false,
        type: "bronze",
        value: 10,
        color: "#fbbf24",
        glowColor: "#fef08a",
        rotation: 0,
        floatOffset: i,
      })
    }

    // Add hazards based on difficulty
    const hazSpeed = DIFFICULTY_CONFIG[difficulty].hazardSpeed
    if (difficulty !== "casual") {
      hazards.push({
        id: 1,
        type: "slime",
        x: 390,
        y: 366,
        width: 24,
        height: 24,
        vx: hazSpeed,
        range: [380, 510],
      })
      hazards.push({
        id: 2,
        type: "slime",
        x: 240,
        y: 266,
        width: 24,
        height: 24,
        vx: -hazSpeed,
        range: [230, 340],
      })

      if (difficulty === "rush" || difficulty === "insane") {
        hazards.push({
          id: 3,
          type: "spike",
          x: 420,
          y: 154,
          width: 30,
          height: 16,
        })
      }
    }

    // Spawn 1-2 initial Power-ups
    const powerTypes: PowerUpItem["type"][] = ["magnet", "shield", "speed", "freeze"]
    const pType = powerTypes[Math.floor(Math.random() * powerTypes.length)]
    powerUps.push({
      id: Math.random(),
      x: 440,
      y: 140,
      type: pType,
      collected: false,
      duration: 8,
    })

    platformsRef.current = platforms
    coinsRef.current = coins
    hazardsRef.current = hazards
    powerUpsRef.current = powerUps
  }, [difficulty])

  // Key Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current.add(key)

      if ((key === "p" || key === "escape") && gameState === "playing") {
        setGameState("paused")
      } else if ((key === "p" || key === "escape") && gameState === "paused") {
        setGameState("playing")
      }

      // Jump triggering
      if ((key === " " || key === "w" || key === "arrowup") && gameState === "playing") {
        const p = playerRef.current
        if (p.onGround || p.jumpCount < p.maxJumps) {
          p.vy = -11.5
          p.scaleX = 0.75
          p.scaleY = 1.3
          p.jumpCount += 1
          p.onGround = false
          playJumpSound(p.jumpCount > 1)
          spawnParticles(p.x + p.width / 2, p.y + p.height, 8, "#e2e8f0", "dust")
        }
      }

      // Dash triggering (Shift or Key E)
      if ((key === "shift" || key === "e") && gameState === "playing") {
        const p = playerRef.current
        if (p.dashCooldown <= 0 && !p.isDashing) {
          p.isDashing = true
          p.dashCooldown = 60 // 1 sec cooldown at 60fps
          p.vx = p.facing === "right" ? 16 : -16
          playSynthTone(750, "sine", 0.1, 0.2, 0.01)
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 12, "#38bdf8", "spark")
          setTimeout(() => {
            p.isDashing = false
          }, 150)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState, playJumpSound, playSynthTone, spawnParticles])

  // Timer Tick Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (gameState === "playing") {
      interval = setInterval(() => {
        if (activePowerUps.freeze > 0) {
          setActivePowerUps((prev) => ({ ...prev, freeze: prev.freeze - 1 }))
          return // Time frozen!
        }

        if (gameMode === "timed" || gameMode === "survival") {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setGameState("gameOver")
              playGameOverSound()
              return 0
            }
            return prev - 1
          })
        }

        // Active Power-up Decay
        setActivePowerUps((prev) => ({
          magnet: Math.max(0, prev.magnet - 1),
          speed: Math.max(0, prev.speed - 1),
          fever: Math.max(0, prev.fever - 1),
          shield: prev.shield,
          freeze: prev.freeze,
        }))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, gameMode, activePowerUps.freeze, playGameOverSound])

  // Main Canvas Render & Game Loop
  useEffect(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let lastTime = performance.now()

    const gameLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      // 1. Clear Canvas & Draw Sky Background
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height)
      if (activePowerUps.fever > 0) {
        skyGrad.addColorStop(0, "#4c1d95")
        skyGrad.addColorStop(1, "#831843")
      } else {
        skyGrad.addColorStop(0, "#0f172a")
        skyGrad.addColorStop(0.5, "#1e1b4b")
        skyGrad.addColorStop(1, "#311b92")
      }
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Moving background clouds
      cloudOffsetRef.current = (cloudOffsetRef.current + 0.3) % canvas.width
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
      ctx.beginPath()
      ctx.arc((100 + cloudOffsetRef.current) % (canvas.width + 200) - 100, 80, 50, 0, Math.PI * 2)
      ctx.arc((140 + cloudOffsetRef.current) % (canvas.width + 200) - 100, 70, 70, 0, Math.PI * 2)
      ctx.arc((500 + cloudOffsetRef.current) % (canvas.width + 200) - 100, 100, 60, 0, Math.PI * 2)
      ctx.fill()

      // 2. Update Player Physics
      const p = playerRef.current
      const moveSpeed = activePowerUps.speed > 0 ? 7.5 : 5.2

      if (p.dashCooldown > 0) p.dashCooldown -= 1

      // Horizontal Input
      if (keysRef.current.has("a") || keysRef.current.has("arrowleft")) {
        p.vx = -moveSpeed
        p.facing = "left"
      } else if (keysRef.current.has("d") || keysRef.current.has("arrowright")) {
        p.vx = moveSpeed
        p.facing = "right"
      } else if (!p.isDashing) {
        p.vx *= 0.78 // Friction
      }

      // Max Speed & Gravity
      p.vy += 0.52 // Gravity
      p.x += p.vx
      p.y += p.vy

      // Screen Edge Bounds
      if (p.x < 0) {
        p.x = 0
        p.vx = 0
      }
      if (p.x + p.width > canvas.width) {
        p.x = canvas.width - p.width
        p.vx = 0
      }

      // Recover Squish/Stretch scale towards 1
      p.scaleX += (1 - p.scaleX) * 0.15
      p.scaleY += (1 - p.scaleY) * 0.15

      // Motion Trail
      p.trail.push({ x: p.x + p.width / 2, y: p.y + p.height / 2, alpha: 0.5 })
      if (p.trail.length > 8) p.trail.shift()

      // Platform Collision Detection
      p.onGround = false
      platformsRef.current.forEach((plat) => {
        if (plat.isBroken) return

        // Update Moving Platform
        if (plat.type === "moving" && plat.vx && plat.range) {
          plat.x += plat.vx
          if (plat.x <= plat.range[0] || plat.x + plat.width >= plat.range[1]) {
            plat.vx *= -1
          }
        }

        // Landing collision
        if (
          p.x + p.width > plat.x + 4 &&
          p.x < plat.x + plat.width - 4 &&
          p.y + p.height >= plat.y &&
          p.y + p.height <= plat.y + 14 &&
          p.vy >= 0
        ) {
          p.y = plat.y - p.height
          p.vy = 0
          p.onGround = true
          p.jumpCount = 0

          if (!p.onGround) {
            p.scaleX = 1.25
            p.scaleY = 0.75
          }

          // Handle Crumbling platforms
          if (plat.type === "crumbling") {
            plat.isCrumbling = true
            plat.crumbleTimer = (plat.crumbleTimer || 0) + 1
            if (plat.crumbleTimer > 35) {
              plat.isBroken = true
              spawnParticles(plat.x + plat.width / 2, plat.y, 16, "#f43f5e", "spark")
            }
          }
        }
      })

      // Ground limit safety net
      if (p.y + p.height >= canvas.height - 40) {
        p.y = canvas.height - 40 - p.height
        p.vy = 0
        p.onGround = true
        p.jumpCount = 0
      }

      // 3. Draw Platforms
      platformsRef.current.forEach((plat) => {
        if (plat.isBroken) return

        // Platform Glow & Shadow
        ctx.shadowColor = plat.type === "crumbling" ? "#f43f5e" : plat.type === "moving" ? "#38bdf8" : "#818cf8"
        ctx.shadowBlur = 8

        const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height)
        if (plat.type === "crumbling") {
          grad.addColorStop(0, plat.isCrumbling ? "#fda4af" : "#f43f5e")
          grad.addColorStop(1, "#be123c")
        } else if (plat.type === "moving") {
          grad.addColorStop(0, "#38bdf8")
          grad.addColorStop(1, "#0284c7")
        } else {
          grad.addColorStop(0, "#4f46e5")
          grad.addColorStop(1, "#312e81")
        }

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 6)
        ctx.fill()

        // Highlight Top Rail
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
        ctx.fillRect(plat.x + 2, plat.y, plat.width - 4, 3)

        ctx.shadowBlur = 0
      })

      // 4. Update & Draw Coins
      const pCenterX = p.x + p.width / 2
      const pCenterY = p.y + p.height / 2
      const magnetRange = activePowerUps.magnet > 0 ? 240 : DIFFICULTY_CONFIG[difficulty].coinMagnetRange

      let collectedThisFrame = 0

      coinsRef.current.forEach((coin) => {
        if (coin.collected) return

        // Floating bob animation & rotation
        coin.rotation += 0.05
        coin.y = coin.baseY + Math.sin(now * 0.004 + coin.floatOffset) * 4

        // Magnet attraction toward player
        const dist = Math.hypot(pCenterX - coin.x, pCenterY - coin.y)
        if (dist < magnetRange) {
          const angle = Math.atan2(pCenterY - coin.y, pCenterX - coin.x)
          const pullForce = (1 - dist / magnetRange) * 7.5
          coin.x += Math.cos(angle) * pullForce
          coin.y += Math.sin(angle) * pullForce
        }

        // Collection Check
        if (dist < coin.size + 18) {
          coin.collected = true
          collectedThisFrame += 1

          const feverMult = activePowerUps.fever > 0 ? 2 : 1
          const modeMult = DIFFICULTY_CONFIG[difficulty].scoreMultiplier
          const gainedVal = Math.round(coin.value * feverMult * modeMult)

          setScore((prev) => prev + gainedVal)
          setCoinsCollected((prev) => prev + 1)
          unlockAchievement("first_coin")

          // Update Stats
          setStats((prev) => {
            const newTotal = prev.totalCoins + 1
            if (newTotal >= 100) unlockAchievement("century")
            const updated = { ...prev, totalCoins: newTotal }
            localStorage.setItem("coin_collector_user_stats", JSON.stringify(updated))
            return updated
          })

          // Survival Mode Time Addition
          if (gameMode === "survival") {
            const addSecs = coin.type === "rainbow" ? 5 : coin.type === "diamond" ? 3 : 1
            setTimeLeft((prev) => prev + addSecs)
            spawnFloatingText(`+${addSecs}s`, coin.x, coin.y - 10, "#4ade80")
          } else {
            spawnFloatingText(`+${gainedVal}`, coin.x, coin.y - 10, coin.color)
          }

          // Combo escalation
          setCombo((prev) => {
            const nextCombo = prev + 1
            setMaxCombo((m) => Math.max(m, nextCombo))
            if (nextCombo >= 10) unlockAchievement("combo_10")
            playCoinSound(nextCombo)
            return nextCombo
          })
          comboTimerRef.current = 180 // 3 seconds at 60fps

          // Trigger Fever mode if rainbow coin collected
          if (coin.type === "rainbow") {
            setActivePowerUps((prev) => ({ ...prev, fever: 6 }))
            playFeverSound()
            spawnFloatingText("FEVER 2X!", pCenterX, pCenterY - 30, "#ec4899")
            setStats((prev) => ({ ...prev, totalFevers: prev.totalFevers + 1 }))
          }

          // Mystery Coin gives random power-up
          if (coin.type === "mystery") {
            const pTypes: PowerUpItem["type"][] = ["magnet", "shield", "speed", "freeze"]
            const chosen = pTypes[Math.floor(Math.random() * pTypes.length)]
            powerUpsRef.current.push({
              id: Math.random(),
              x: coin.x,
              y: coin.y,
              type: chosen,
              collected: false,
              duration: 8,
            })
          }

          // Coin particles
          spawnParticles(coin.x, coin.y, 10, coin.color, "star")
        }

        // Draw Coin
        ctx.save()
        ctx.translate(coin.x, coin.y)
        ctx.scale(Math.cos(coin.rotation), 1) // 3D spin effect

        ctx.shadowColor = coin.glowColor
        ctx.shadowBlur = 10

        ctx.fillStyle = coin.color
        ctx.beginPath()
        ctx.arc(0, 0, coin.size, 0, Math.PI * 2)
        ctx.fill()

        // Inner coin shine
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        ctx.beginPath()
        ctx.arc(-coin.size / 3, -coin.size / 3, coin.size / 3.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })

      // Level Reset / New Coins Generation if all coins collected
      const remainingCoins = coinsRef.current.filter((c) => !c.collected)
      if (remainingCoins.length === 0) {
        generateLevelLayout()
        if (gameMode === "stage") {
          setCurrentStage((prev) => {
            const next = prev + 1
            setStageGoal((g) => g + 15)
            setGameState("stageClear")
            return next
          })
        }
      }

      // Combo Timeout Logic
      if (comboTimerRef.current > 0) {
        comboTimerRef.current -= 1
        if (comboTimerRef.current <= 0) {
          setCombo(0)
        }
      }

      // 5. Update & Draw Power-ups
      powerUpsRef.current.forEach((pu) => {
        if (pu.collected) return

        const dist = Math.hypot(pCenterX - pu.x, pCenterY - pu.y)
        if (dist < 26) {
          pu.collected = true
          playPowerupSound()

          if (pu.type === "magnet") {
            setActivePowerUps((prev) => ({ ...prev, magnet: 8 }))
            unlockAchievement("magnet_master")
            spawnFloatingText("MAGNET ON!", pCenterX, pCenterY - 20, "#38bdf8")
          } else if (pu.type === "shield") {
            setActivePowerUps((prev) => ({ ...prev, shield: true }))
            spawnFloatingText("SHIELD UP!", pCenterX, pCenterY - 20, "#a855f7")
          } else if (pu.type === "speed") {
            setActivePowerUps((prev) => ({ ...prev, speed: 8 }))
            spawnFloatingText("SPEED BOOST!", pCenterX, pCenterY - 20, "#eab308")
          } else if (pu.type === "freeze") {
            setActivePowerUps((prev) => ({ ...prev, freeze: 6 }))
            spawnFloatingText("TIME FROZEN!", pCenterX, pCenterY - 20, "#06b6d4")
          }

          spawnParticles(pu.x, pu.y, 14, "#38bdf8", "spark")
        }

        // Draw Power-up Icon Circle
        ctx.shadowColor = "#38bdf8"
        ctx.shadowBlur = 12
        ctx.fillStyle = pu.type === "magnet" ? "#0284c7" : pu.type === "shield" ? "#7e22ce" : pu.type === "speed" ? "#ca8a04" : "#0891b2"
        ctx.beginPath()
        ctx.arc(pu.x, pu.y, 14, 0, Math.PI * 2)
        ctx.fill()

        // Power-up Symbol
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 12px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const sym = pu.type === "magnet" ? "🧲" : pu.type === "shield" ? "🛡️" : pu.type === "speed" ? "⚡" : "❄️"
        ctx.fillText(sym, pu.x, pu.y)
        ctx.shadowBlur = 0
      })

      // 6. Update & Draw Hazards
      if (activePowerUps.freeze <= 0) {
        hazardsRef.current.forEach((haz) => {
          if (haz.type === "slime" && haz.vx && haz.range) {
            haz.x += haz.vx
            if (haz.x <= haz.range[0] || haz.x + haz.width >= haz.range[1]) {
              haz.vx *= -1
            }
          }

          // Hazard Collision Check with Player
          if (
            p.x < haz.x + haz.width &&
            p.x + p.width > haz.x &&
            p.y < haz.y + haz.height &&
            p.y + p.height > haz.y
          ) {
            if (activePowerUps.shield) {
              // Shield protects hit
              setActivePowerUps((prev) => ({ ...prev, shield: false }))
              playSynthTone(600, "sine", 0.2, 0.2, 0.01)
              spawnFloatingText("SHIELD BROKEN!", pCenterX, pCenterY - 20, "#f43f5e")
              p.vy = -8 // Knockback bounce
            } else {
              // Penalty
              playHazardHitSound()
              setScore((prev) => Math.max(0, prev - 30))
              setCombo(0)
              p.vy = -10 // Knockback
              p.vx = p.x < haz.x ? -10 : 10
              spawnFloatingText("-30 PTS", pCenterX, pCenterY - 20, "#ef4444")
              spawnParticles(pCenterX, pCenterY, 12, "#ef4444", "spark")
            }
          }

          // Draw Hazards
          ctx.save()
          if (haz.type === "slime") {
            // Cute gelatinous bouncy slime
            const squish = Math.sin(now * 0.01) * 2
            ctx.fillStyle = "#ef4444"
            ctx.shadowColor = "#f87171"
            ctx.shadowBlur = 8
            ctx.beginPath()
            ctx.ellipse(haz.x + haz.width / 2, haz.y + haz.height / 2, haz.width / 2 + squish, haz.height / 2 - squish, 0, 0, Math.PI * 2)
            ctx.fill()

            // Eyes
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(haz.x + 6, haz.y + 6, 4, 4)
            ctx.fillRect(haz.x + 14, haz.y + 6, 4, 4)
          } else if (haz.type === "spike") {
            // Spikes
            ctx.fillStyle = "#dc2626"
            ctx.beginPath()
            ctx.moveTo(haz.x, haz.y + haz.height)
            ctx.lineTo(haz.x + haz.width / 2, haz.y)
            ctx.lineTo(haz.x + haz.width, haz.y + haz.height)
            ctx.closePath()
            ctx.fill()
          }
          ctx.restore()
        })
      }

      // 7. Draw Player Character
      ctx.save()

      // Player Motion Trail
      p.trail.forEach((t) => {
        ctx.fillStyle = `rgba(245, 158, 11, ${t.alpha * 0.4})`
        ctx.beginPath()
        ctx.arc(t.x, t.y, p.width / 2, 0, Math.PI * 2)
        ctx.fill()
      })

      // Magnet Aura
      if (activePowerUps.magnet > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(pCenterX, pCenterY, magnetRange, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Shield Aura Bubble
      if (activePowerUps.shield) {
        ctx.strokeStyle = "#a855f7"
        ctx.shadowColor = "#c084fc"
        ctx.shadowBlur = 12
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(pCenterX, pCenterY, p.width / 2 + 8, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Player Body Transformation (Squish & Stretch)
      ctx.translate(pCenterX, pCenterY)
      ctx.scale(p.scaleX, p.scaleY)

      ctx.shadowColor = activePowerUps.fever > 0 ? "#ec4899" : themeColor
      ctx.shadowBlur = 14

      // Character Gradient Body
      const playerGrad = ctx.createLinearGradient(-p.width / 2, -p.height / 2, p.width / 2, p.height / 2)
      if (activePowerUps.fever > 0) {
        playerGrad.addColorStop(0, "#f472b6")
        playerGrad.addColorStop(1, "#db2777")
      } else {
        playerGrad.addColorStop(0, "#fbbf24")
        playerGrad.addColorStop(1, "#d97706")
      }

      ctx.fillStyle = playerGrad
      ctx.beginPath()
      ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 10)
      ctx.fill()

      // Cute Animated Face
      ctx.fillStyle = "#000000"
      const eyeOffset = p.facing === "right" ? 4 : -4

      if (activePowerUps.fever > 0) {
        // Star eyes during fever
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 10px sans-serif"
        ctx.fillText("★", -6 + eyeOffset, -2)
        ctx.fillText("★", 6 + eyeOffset, -2)
      } else {
        // Expressive eyes
        ctx.fillRect(-8 + eyeOffset, -6, 4, 6)
        ctx.fillRect(4 + eyeOffset, -6, 4, 6)
      }

      // Smile mouth
      ctx.beginPath()
      ctx.arc(0 + eyeOffset, 2, 5, 0, Math.PI)
      ctx.stroke()

      ctx.restore()

      // 8. Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i]
        pt.x += pt.vx
        pt.y += pt.vy
        pt.alpha -= pt.decay

        if (pt.alpha <= 0) {
          particlesRef.current.splice(i, 1)
          continue
        }

        ctx.fillStyle = pt.color
        ctx.globalAlpha = pt.alpha
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // 9. Render Floating Texts (+10, +50, FEVER!)
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i]
        ft.y += ft.vy
        ft.alpha -= 0.02

        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = ft.alpha
        ctx.fillStyle = ft.color
        ctx.shadowColor = ft.color
        ctx.shadowBlur = 6
        ctx.font = "bold 16px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(ft.text, ft.x, ft.y)
        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [
    gameState,
    difficulty,
    gameMode,
    activePowerUps,
    themeColor,
    playCoinSound,
    playFeverSound,
    playHazardHitSound,
    playPowerupSound,
    spawnFloatingText,
    spawnParticles,
    generateLevelLayout,
    unlockAchievement
  ])

  // Save High Score on Game Over
  useEffect(() => {
    if (gameState === "gameOver") {
      if (score > highScore) {
        setHighScore(score)
        const key = `coin_collector_hs_${difficulty}_${gameMode}`
        localStorage.setItem(key, score.toString())
      }

      if (difficulty === "insane" && score >= 1000) {
        unlockAchievement("insane_survivor")
      }
    }
  }, [gameState, score, highScore, difficulty, gameMode, unlockAchievement])

  // Start New Game
  const startGame = () => {
    setScore(0)
    setCoinsCollected(0)
    setCombo(0)
    setMaxCombo(0)
    setCurrentStage(1)
    setStageGoal(15)
    setTimeLeft(DIFFICULTY_CONFIG[difficulty].timeLimit)
    setActivePowerUps({ magnet: 0, shield: false, speed: 0, freeze: 0, fever: 0 })

    playerRef.current = {
      x: 100,
      y: 350,
      width: 32,
      height: 32,
      vx: 0,
      vy: 0,
      onGround: false,
      jumpCount: 0,
      maxJumps: 2,
      facing: "right",
      scaleX: 1,
      scaleY: 1,
      trail: [],
      dashCooldown: 0,
      isDashing: false,
    }

    generateLevelLayout()
    setGameState("playing")

    setStats((prev) => {
      const updated = { ...prev, totalGames: prev.totalGames + 1 }
      localStorage.setItem("coin_collector_user_stats", JSON.stringify(updated))
      return updated
    })
  }

  // Next Stage Transition
  const nextStage = () => {
    generateLevelLayout()
    setGameState("playing")
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans p-4 overflow-hidden select-none">
      {/* Dynamic Background Ambient Light */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${themeColor}, transparent 70%)`,
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Dashboard
          </Button>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 font-bold text-sm">
              <Trophy className="w-4 h-4 mr-1 text-yellow-400" />
              <span>High: {highScore.toLocaleString()}</span>
            </div>

            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
            </Button>
          </div>
        </div>

        {/* GAME MENU SCREEN */}
        {gameState === "menu" && (
          <Card className="w-full max-w-xl bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl text-slate-100 rounded-3xl overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
                <span className="text-4xl">🪙</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">Coin Collector Deluxe</h1>
              <p className="text-slate-400 text-sm mb-6 text-center">
                Run, jump, double-jump & snatch coins before time runs out!
              </p>

              {/* Game Mode Picker */}
              <div className="w-full mb-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  Select Game Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "timed", label: "Timed Rush", desc: "Classic timer" },
                    { id: "survival", label: "Survival", desc: "Coins add time" },
                    { id: "stage", label: "Stage Rush", desc: "Stage quotas" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setGameMode(mode.id as GameMode)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        gameMode === mode.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                          : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <div className="font-bold text-sm">{mode.label}</div>
                      <div className="text-[11px] opacity-75">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Picker */}
              <div className="w-full mb-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  Select Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => {
                    const cfg = DIFFICULTY_CONFIG[key]
                    const active = difficulty === key
                    return (
                      <button
                        key={key}
                        onClick={() => setDifficulty(key)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          active
                            ? `bg-gradient-to-r ${cfg.color} text-white border-transparent shadow-lg shadow-amber-500/10`
                            : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">{cfg.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 text-white font-mono">
                            {cfg.scoreMultiplier}x Pts
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-200/80 leading-snug">{cfg.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Controls Guide */}
              <div className="w-full p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-xs text-slate-300 mb-6 space-y-1">
                <div className="font-bold text-slate-200 mb-1 flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-400" /> Controls Guide
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <div>• Move: <span className="text-slate-200 font-mono">A / D</span> or <span className="text-slate-200 font-mono">← / →</span></div>
                  <div>• Jump / Double Jump: <span className="text-slate-200 font-mono">Space / W</span></div>
                  <div>• Dash: <span className="text-slate-200 font-mono">Shift / E</span></div>
                  <div>• Pause Game: <span className="text-slate-200 font-mono">ESC / P</span></div>
                </div>
              </div>

              {/* Achievements & Stats Banner */}
              <div className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-2xl border border-slate-800 mb-6 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>
                    Unlocked: <strong className="text-slate-200">{achievements.filter((a) => a.unlocked).length}/{achievements.length}</strong>
                  </span>
                </div>
                <div>Total Coins: <strong className="text-amber-400">{stats.totalCoins}</strong></div>
              </div>

              <Button
                onClick={startGame}
                className="w-full py-6 rounded-2xl text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
              >
                <Play className="w-5 h-5 mr-2 fill-current" /> Start Game
              </Button>
            </CardContent>
          </Card>
        )}

        {/* IN-GAME / PLAYING VIEW */}
        {(gameState === "playing" || gameState === "paused" || gameState === "stageClear") && (
          <div className="relative w-full flex flex-col items-center">
            {/* Top HUD Bar */}
            <div className="w-full max-w-[900px] flex items-center justify-between mb-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg backdrop-blur-md">
              {/* Score Display */}
              <div className="flex items-center space-x-3">
                <div className="bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Score</div>
                  <div className="text-xl font-extrabold text-white font-mono">{score.toLocaleString()}</div>
                </div>

                {/* Combo Counter */}
                {combo > 1 && (
                  <div className="bg-pink-500/20 border border-pink-500/40 px-3 py-1.5 rounded-xl animate-pulse">
                    <div className="text-[10px] uppercase font-bold text-pink-400">Combo Streak</div>
                    <div className="text-lg font-black text-pink-300">{combo}x 🔥</div>
                  </div>
                )}
              </div>

              {/* Center Status: Timer or Stage Goal */}
              <div className="flex items-center space-x-4">
                {gameMode !== "stage" ? (
                  <div className={`px-4 py-1.5 rounded-xl border text-center font-mono ${timeLeft <= 10 ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-bounce" : "bg-slate-800 border-slate-700 text-slate-200"}`}>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Time Left</div>
                    <div className="text-2xl font-bold">{timeLeft}s</div>
                  </div>
                ) : (
                  <div className="px-4 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-center font-mono">
                    <div className="text-[10px] uppercase font-semibold text-indigo-300">Stage {currentStage}</div>
                    <div className="text-lg font-bold text-white">{coinsCollected} / {stageGoal} Coins</div>
                  </div>
                )}

                {/* Active Power-up Badges */}
                <div className="flex items-center space-x-1.5">
                  {activePowerUps.magnet > 0 && (
                    <div className="p-1.5 bg-sky-500/20 border border-sky-500/40 rounded-xl text-sky-400 text-xs flex items-center" title="Magnet Active">
                      <Magnet className="w-4 h-4 animate-spin" />
                      <span className="ml-1 text-[10px] font-bold">{activePowerUps.magnet}s</span>
                    </div>
                  )}
                  {activePowerUps.shield && (
                    <div className="p-1.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400 text-xs flex items-center" title="Shield Active">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}
                  {activePowerUps.speed > 0 && (
                    <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 text-xs flex items-center" title="Speed Active">
                      <Zap className="w-4 h-4" />
                    </div>
                  )}
                  {activePowerUps.freeze > 0 && (
                    <div className="p-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400 text-xs flex items-center" title="Time Frozen">
                      <Snowflake className="w-4 h-4 animate-pulse" />
                    </div>
                  )}
                  {activePowerUps.fever > 0 && (
                    <div className="p-1.5 bg-pink-500/20 border border-pink-500/40 rounded-xl text-pink-400 text-xs flex items-center animate-bounce" title="Coin Fever">
                      <Flame className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Pause Button */}
              <Button
                onClick={() => setGameState(gameState === "playing" ? "paused" : "playing")}
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                <Pause className="w-5 h-5" />
              </Button>
            </div>

            {/* Canvas Playfield */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-900">
              <canvas
                ref={canvasRef}
                width={900}
                height={520}
                className="block max-w-full h-auto cursor-crosshair"
              />

              {/* Paused Overlay */}
              {gameState === "paused" && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-slate-100 p-6 z-20">
                  <h2 className="text-3xl font-extrabold mb-2">Game Paused</h2>
                  <p className="text-slate-400 text-sm mb-6">Take a breather and hop back in!</p>
                  <div className="flex space-x-4">
                    <Button
                      onClick={() => setGameState("playing")}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                    >
                      Resume
                    </Button>
                    <Button
                      onClick={() => setGameState("menu")}
                      variant="outline"
                      className="px-6 py-3 rounded-2xl border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Quit to Menu
                    </Button>
                  </div>
                </div>
              )}

              {/* Stage Clear Overlay */}
              {gameState === "stageClear" && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-slate-100 p-6 z-20 animate-fade-in">
                  <Sparkles className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
                  <h2 className="text-3xl font-extrabold mb-1">Stage {currentStage - 1} Cleared!</h2>
                  <p className="text-slate-400 text-sm mb-6">Target reached! Ready for the next stage?</p>
                  <Button
                    onClick={nextStage}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-extrabold text-lg shadow-lg shadow-amber-500/20"
                  >
                    Next Stage <ChevronRight className="w-5 h-5 ml-1 inline" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === "gameOver" && (
          <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl text-slate-100 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-1">Time&apos;s Up!</h2>
              <p className="text-slate-400 text-sm mb-6">Great run! Here is your final summary:</p>

              <div className="w-full bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 mb-6 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                  <span className="text-slate-400 text-sm">Final Score</span>
                  <span className="text-2xl font-extrabold text-amber-400 font-mono">{score.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-left text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400">Coins Collected</div>
                    <div className="text-lg font-bold text-slate-200 mt-0.5">{coinsCollected} 🪙</div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400">Peak Combo</div>
                    <div className="text-lg font-bold text-pink-400 mt-0.5">{maxCombo}x 🔥</div>
                  </div>
                </div>
              </div>

              <div className="flex w-full space-x-3">
                <Button
                  onClick={startGame}
                  className="flex-1 py-6 rounded-2xl text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-lg shadow-amber-500/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Button
                  onClick={() => setGameState("menu")}
                  variant="outline"
                  className="flex-1 py-6 rounded-2xl border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
