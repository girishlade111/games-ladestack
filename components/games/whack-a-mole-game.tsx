"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  RotateCcw, 
  Zap, 
  Target, 
  Flame, 
  Skull, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Sparkles, 
  Clock, 
  Award,
  Crown
} from "lucide-react"

interface WhackAMoleGameProps {
  onBack: () => void
  themeColor?: string
}

type Difficulty = "easy" | "medium" | "hard" | "insane"

type MoleType = "standard" | "golden" | "bomb" | "helmet" | "time" | "rainbow"

interface Mole {
  id: number
  type: MoleType
  isVisible: boolean
  isHit: boolean
  hp: number // for helmet mole requiring 2 hits
  maxHp: number
  spawnTime: number
  duration: number
}

interface FloatingText {
  id: number
  text: string
  x: number
  y: number
  color: string
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
}

interface DifficultyConfig {
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  spawnInterval: number
  hideDelay: number
  maxMoles: number
  scoreMultiplier: number
  gameTime: number
  description: string
  bombChance: number
  specialChance: number
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: "Garden Novice",
    icon: <Target className="w-5 h-5 text-emerald-400" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500",
    spawnInterval: 1400,
    hideDelay: 1600,
    maxMoles: 2,
    scoreMultiplier: 1.0,
    gameTime: 60,
    description: "Relaxed speed, 60s, gentle spawning, no bombs",
    bombChance: 0,
    specialChance: 0.15,
  },
  medium: {
    name: "Arcade Pro",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500",
    spawnInterval: 1000,
    hideDelay: 1100,
    maxMoles: 3,
    scoreMultiplier: 1.5,
    gameTime: 45,
    description: "Fast-paced, 45s, 3 moles max, occasional bombs",
    bombChance: 0.15,
    specialChance: 0.25,
  },
  hard: {
    name: "Mole Frenzy",
    icon: <Flame className="w-5 h-5 text-rose-500" />,
    color: "text-rose-500",
    bgColor: "bg-rose-500/20",
    borderColor: "border-rose-500",
    spawnInterval: 750,
    hideDelay: 800,
    maxMoles: 4,
    scoreMultiplier: 2.0,
    gameTime: 30,
    description: "Rapid reflex, 30s, 4 moles max, helmet moles & bombs",
    bombChance: 0.25,
    specialChance: 0.35,
  },
  insane: {
    name: "Chaos Master",
    icon: <Skull className="w-5 h-5 text-purple-400" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500",
    spawnInterval: 500,
    hideDelay: 600,
    maxMoles: 5,
    scoreMultiplier: 3.0,
    gameTime: 30,
    description: "Extreme velocity! Up to 5 simultaneous moles & hyper hazards",
    bombChance: 0.35,
    specialChance: 0.45,
  },
}

export default function WhackAMoleGame({ onBack }: WhackAMoleGameProps) {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(45)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [bombsHit, setBombsHit] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [screenShake, setScreenShake] = useState(false)
  const [isSwinging, setIsSwinging] = useState(false)

  // Mouse position for custom hammer cursor
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 })

  const [bestScores, setBestScores] = useState<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
    insane: 0,
  })

  // 9 holes grid (3x3)
  const [moles, setMoles] = useState<Mole[]>(() =>
    Array.from({ length: 9 }, (_, i) => ({
      id: i,
      type: "standard",
      isVisible: false,
      isHit: false,
      hp: 1,
      maxHp: 1,
      spawnTime: 0,
      duration: 1000,
    }))
  )

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [particles, setParticles] = useState<Particle[]>([])

  const audioCtxRef = useRef<AudioContext | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const particleLoopRef = useRef<number | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const config = DIFFICULTY_CONFIGS[difficulty]

  // Initialize Web Audio API
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  // Sound Synthesizer Functions
  const playSound = useCallback((type: "whack" | "golden" | "bomb" | "helmet" | "time" | "rainbow" | "combo" | "miss" | "gameover") => {
    if (!soundEnabled) return
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    if (type === "whack") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.12)
    } else if (type === "golden") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.setValueAtTime(880, now + 0.08) // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.16) // D6
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.3)
    } else if (type === "bomb") {
      // Noise burst for explosion
      const bufferSize = ctx.sampleRate * 0.25
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
      filter.frequency.exponentialRampToValueAtTime(40, now + 0.25)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.5, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start(now)
    } else if (type === "helmet") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.1)
    } else if (type === "time") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === "rainbow") {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + idx * 0.05)
        gain.gain.setValueAtTime(0.2, now + idx * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.15)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.05)
        osc.stop(now + idx * 0.05 + 0.15)
      })
    } else if (type === "combo") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === "miss") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.15)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === "gameover") {
      const notes = [400, 350, 300, 250]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(freq, now + idx * 0.12)
        gain.gain.setValueAtTime(0.2, now + idx * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.12)
        osc.stop(now + idx * 0.12 + 0.2)
      })
    }
  }, [soundEnabled, getAudioContext])

  // Load high scores
  useEffect(() => {
    const easy = localStorage.getItem("whack-a-mole-best-easy")
    const medium = localStorage.getItem("whack-a-mole-best-medium")
    const hard = localStorage.getItem("whack-a-mole-best-hard")
    const insane = localStorage.getItem("whack-a-mole-best-insane")

    setBestScores({
      easy: easy ? parseInt(easy, 10) : 0,
      medium: medium ? parseInt(medium, 10) : 0,
      hard: hard ? parseInt(hard, 10) : 0,
      insane: insane ? parseInt(insane, 10) : 0,
    })
  }, [])

  // Floating text emitter
  const addFloatingText = (text: string, x: number, y: number, color: string = "#facc15") => {
    const id = Date.now() + Math.random()
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color }])
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id))
    }, 800)
  }

  // Particle Emitter
  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 6
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 5,
        life: 1.0,
      })
    }
    setParticles((prev) => [...prev, ...newParticles])
  }

  // Update particles loop
  useEffect(() => {
    if (particles.length === 0) return
    const update = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // gravity
            life: p.life - 0.04,
          }))
          .filter((p) => p.life > 0)
      )
    }
    particleLoopRef.current = requestAnimationFrame(update)
    return () => {
      if (particleLoopRef.current) cancelAnimationFrame(particleLoopRef.current)
    }
  }, [particles])

  // Mouse move handler for custom hammer cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  // Start game
  const startGame = () => {
    setScore(0)
    setTimeLeft(config.gameTime)
    setCombo(0)
    setMaxCombo(0)
    setHits(0)
    setMisses(0)
    setBombsHit(0)
    setGameState("playing")
    setMoles(
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        type: "standard",
        isVisible: false,
        isHit: false,
        hp: 1,
        maxHp: 1,
        spawnTime: 0,
        duration: config.hideDelay,
      }))
    )
  }

  // Game timer countdown
  useEffect(() => {
    if (gameState !== "playing") return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  // End Game
  const endGame = () => {
    setGameState("gameOver")
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    playSound("gameover")

    // Update best score
    setScore((finalScore) => {
      if (finalScore > bestScores[difficulty]) {
        setBestScores((prev) => {
          const updated = { ...prev, [difficulty]: finalScore }
          localStorage.setItem(`whack-a-mole-best-${difficulty}`, finalScore.toString())
          return updated
        })
      }
      return finalScore
    })
  }

  // Mole Spawner logic
  useEffect(() => {
    if (gameState !== "playing") return

    const spawnMole = () => {
      setMoles((prevMoles) => {
        const visibleCount = prevMoles.filter((m) => m.isVisible).length
        if (visibleCount >= config.maxMoles) return prevMoles

        const hiddenIndices = prevMoles
          .map((m, idx) => (!m.isVisible ? idx : -1))
          .filter((idx) => idx !== -1)

        if (hiddenIndices.length === 0) return prevMoles

        const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)]

        // Determine Mole Type based on probability
        const rand = Math.random()
        let moleType: MoleType = "standard"
        let hp = 1
        let maxHp = 1

        if (rand < config.bombChance) {
          moleType = "bomb"
        } else if (rand < config.bombChance + config.specialChance) {
          const specialRand = Math.random()
          if (specialRand < 0.35) {
            moleType = "golden"
          } else if (specialRand < 0.65) {
            moleType = "helmet"
            hp = 2
            maxHp = 2
          } else if (specialRand < 0.85) {
            moleType = "time"
          } else {
            moleType = "rainbow"
          }
        }

        const duration = Math.max(config.hideDelay - Math.floor(score / 500) * 40, 450)

        const updated = [...prevMoles]
        updated[randomIndex] = {
          id: randomIndex,
          type: moleType,
          isVisible: true,
          isHit: false,
          hp,
          maxHp,
          spawnTime: Date.now(),
          duration,
        }
        return updated
      })
    }

    gameLoopRef.current = setInterval(spawnMole, config.spawnInterval)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [gameState, config, score])

  // Auto-hide mole timeout checker
  useEffect(() => {
    if (gameState !== "playing") return

    const checkInterval = setInterval(() => {
      const now = Date.now()
      setMoles((prevMoles) =>
        prevMoles.map((mole) => {
          if (mole.isVisible && !mole.isHit && now - mole.spawnTime > mole.duration) {
            // Mole escaped!
            if (mole.type !== "bomb") {
              setMisses((m) => m + 1)
              setCombo(0) // streak broken on escape
            }
            return { ...mole, isVisible: false }
          }
          return mole
        })
      )
    }, 100)

    return () => clearInterval(checkInterval)
  }, [gameState])

  // Whack mole handler
  const whackMole = (index: number, e: React.MouseEvent) => {
    if (gameState !== "playing") return

    // Trigger mallet swing animation
    setIsSwinging(true)
    setTimeout(() => setIsSwinging(false), 120)

    const mole = moles[index]
    const boardRect = boardRef.current?.getBoundingClientRect()
    const clickX = e.clientX - (boardRect?.left || 0)
    const clickY = e.clientY - (boardRect?.top || 0)

    // Empty hole click (miss)
    if (!mole.isVisible || mole.isHit) {
      playSound("miss")
      addFloatingText("MISS!", clickX, clickY, "#9ca3af")
      setCombo(0)
      return
    }

    // Hit mole!
    if (mole.type === "bomb") {
      // BOMB HIT!
      playSound("bomb")
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 400)
      spawnParticles(clickX, clickY, "#ef4444", 25)
      addFloatingText("BOMB! -200", clickX, clickY, "#ef4444")
      setScore((prev) => Math.max(0, prev - 200))
      setBombsHit((b) => b + 1)
      setCombo(0)

      setMoles((prev) => {
        const copy = [...prev]
        copy[index] = { ...copy[index], isHit: true, isVisible: false }
        return copy
      })
      return
    }

    // Helmet mole requiring 2 hits
    if (mole.type === "helmet" && mole.hp > 1) {
      playSound("helmet")
      spawnParticles(clickX, clickY, "#94a3b8", 10)
      addFloatingText("CRACK! (1/2)", clickX, clickY, "#cbd5e1")
      setMoles((prev) => {
        const copy = [...prev]
        copy[index] = { ...copy[index], hp: mole.hp - 1 }
        return copy
      })
      return
    }

    // Final hit on mole
    setHits((h) => h + 1)
    const newCombo = combo + 1
    setCombo(newCombo)
    if (newCombo > maxCombo) setMaxCombo(newCombo)

    // Calculate Combo Multiplier
    const multiplier = 1 + Math.floor(newCombo / 5) * 0.5
    let basePoints = 100
    let soundType: "whack" | "golden" | "rainbow" | "time" = "whack"
    let particleColor = "#fbbf24"
    let label = "+100"

    if (mole.type === "golden") {
      basePoints = 300
      soundType = "golden"
      particleColor = "#f59e0b"
      label = "GOLDEN! +300"
    } else if (mole.type === "rainbow") {
      basePoints = 500
      soundType = "rainbow"
      particleColor = "#a855f7"
      label = "RAINBOW! +500"
    } else if (mole.type === "time") {
      basePoints = 150
      soundType = "time"
      particleColor = "#3b82f6"
      label = "+5 SECONDS!"
      setTimeLeft((prev) => prev + 5)
    } else if (mole.type === "helmet") {
      basePoints = 250
      particleColor = "#64748b"
      label = "ARMORED! +250"
    }

    if (newCombo >= 5 && newCombo % 5 === 0) {
      playSound("combo")
    } else {
      playSound(soundType)
    }

    const pointsAdded = Math.round(basePoints * config.scoreMultiplier * multiplier)
    setScore((prev) => prev + pointsAdded)

    spawnParticles(clickX, clickY, particleColor, 18)
    addFloatingText(`${label} ${multiplier > 1 ? `(x${multiplier.toFixed(1)})` : ""}`, clickX, clickY, particleColor)

    // Mark mole as hit and hide
    setMoles((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], isHit: true, isVisible: false }
      return copy
    })
  }

  // Calculate Accuracy
  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0

  // Calculate Grade
  const getGrade = () => {
    if (score >= 4000) return { letter: "S", color: "text-amber-400 border-amber-400" }
    if (score >= 2800) return { letter: "A+", color: "text-emerald-400 border-emerald-400" }
    if (score >= 1800) return { letter: "A", color: "text-blue-400 border-blue-400" }
    if (score >= 1000) return { letter: "B", color: "text-purple-400 border-purple-400" }
    return { letter: "C", color: "text-gray-400 border-gray-400" }
  }

  const grade = getGrade()

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-3 md:p-6 select-none relative overflow-hidden">
      {/* Background Neon Grid Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <div className="z-10 w-full max-w-4xl bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-4 md:p-6 flex flex-col gap-5">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Dashboard</span>
          </Button>

          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              WHACK-A-MOLE ARCADE
            </h1>
          </div>

          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-600" />}
          </Button>
        </div>

        {/* MENU / DIFFICULTY SELECTION */}
        {gameState === "menu" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center max-w-lg my-auto">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Select Challenge Mode</h2>
              <p className="text-slate-400 text-sm">
                Whack moles as fast as you can! Avoid bombs, crack heavy helmets, and chain combo streaks for massive scores.
              </p>
            </div>

            {/* Difficulty Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((key) => {
                const cfg = DIFFICULTY_CONFIGS[key]
                const isSelected = difficulty === key
                return (
                  <div
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isSelected
                        ? `${cfg.borderColor} ${cfg.bgColor} shadow-lg shadow-${cfg.borderColor}/20 scale-[1.02]`
                        : "border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${cfg.bgColor} border ${cfg.borderColor}`}>
                          {cfg.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{cfg.name}</h3>
                          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.scoreMultiplier}x Score Multiplier</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" /> Best
                        </div>
                        <div className="text-base font-extrabold text-amber-400">{bestScores[key]}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{cfg.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Mole Legend */}
            <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-around gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-amber-700 border border-amber-600" />
                <span className="text-slate-300">Standard (+100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-amber-400 border border-yellow-200 animate-pulse" />
                <span className="text-amber-400 font-semibold">Golden (+300)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-red-600 border border-red-400" />
                <span className="text-red-400 font-semibold">Bomb (-200)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-600 border border-slate-400" />
                <span className="text-slate-300 font-semibold">Helmet (2 Hits)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-300" />
                <span className="text-blue-400 font-semibold">Clock (+5s)</span>
              </div>
            </div>

            <Button
              onClick={startGame}
              className={`w-full max-w-md py-6 text-lg font-black tracking-wider uppercase rounded-xl shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400`}
            >
              Start Game ({config.name})
            </Button>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && (
          <div className="flex flex-col gap-4">
            {/* HUD / Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-xs text-slate-400 font-medium">SCORE</div>
                <div className="text-xl md:text-2xl font-black text-amber-400 tracking-tight">{score}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> TIME
                </div>
                <div className={`text-xl md:text-2xl font-black ${timeLeft <= 10 ? "text-rose-500 animate-ping" : "text-cyan-400"}`}>
                  {timeLeft}s
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" /> COMBO
                </div>
                <div className="text-xl md:text-2xl font-black text-orange-400">
                  {combo}x {combo >= 5 && <span className="text-xs text-yellow-300 font-bold">🔥</span>}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-xs text-slate-400 font-medium">ACCURACY</div>
                <div className="text-xl md:text-2xl font-black text-emerald-400">{accuracy}%</div>
              </div>

              <div className={`col-span-2 md:col-span-1 ${config.bgColor} border ${config.borderColor} rounded-xl p-2.5 text-center`}>
                <div className="text-xs text-slate-400 font-medium">MODE</div>
                <div className={`text-sm md:text-base font-extrabold ${config.color} truncate`}>{config.name}</div>
              </div>
            </div>

            {/* Game Board Surface */}
            <div
              ref={boardRef}
              onMouseMove={handleMouseMove}
              className={`relative aspect-[4/3] md:aspect-[16/10] bg-gradient-to-b from-amber-950/40 via-emerald-950/60 to-slate-950 border-4 border-amber-900/60 rounded-2xl p-4 md:p-6 overflow-hidden cursor-none shadow-2xl ${
                screenShake ? "animate-bounce" : ""
              }`}
            >
              {/* Dirt / Turf Texture BG */}
              <div className="absolute inset-0 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

              {/* 3x3 Mole Holes Grid */}
              <div className="grid grid-cols-3 gap-3 md:gap-6 h-full relative z-10">
                {moles.map((mole, idx) => (
                  <div
                    key={mole.id}
                    onClick={(e) => whackMole(idx, e)}
                    className="relative flex items-center justify-center group"
                  >
                    {/* Dirt Mound Hole Base */}
                    <div className="absolute bottom-1 w-full h-1/2 bg-gradient-to-t from-amber-950 via-amber-900 to-amber-950 rounded-[50%] border-2 border-amber-950 shadow-inner flex items-center justify-center overflow-hidden">
                      {/* Deep Hole Oval */}
                      <div className="w-[85%] h-[75%] bg-slate-950 rounded-[50%] shadow-[inset_0_8px_16px_rgba(0,0,0,0.9)]" />
                    </div>

                    {/* Mole Character Pop-up */}
                    <div
                      className={`absolute bottom-3 w-[70%] h-[75%] transition-all duration-150 ease-out flex items-end justify-center ${
                        mole.isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-full opacity-0 scale-95"
                      }`}
                    >
                      {/* Standard Mole */}
                      {mole.type === "standard" && (
                        <div className="relative w-full h-full bg-amber-800 rounded-t-full border-2 border-amber-700 shadow-xl flex flex-col items-center justify-start pt-2">
                          {/* Helmet */}
                          <div className="w-[60%] h-3 bg-yellow-500 rounded-t-md border-b border-yellow-600 mb-1" />
                          {/* Eyes */}
                          <div className="flex gap-2 mb-1">
                            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full flex items-center justify-center">
                              <div className="w-1 h-1 bg-white rounded-full translate-x-0.5 -translate-y-0.5" />
                            </div>
                            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full flex items-center justify-center">
                              <div className="w-1 h-1 bg-white rounded-full translate-x-0.5 -translate-y-0.5" />
                            </div>
                          </div>
                          {/* Nose */}
                          <div className="w-3 h-2 bg-pink-400 rounded-full" />
                        </div>
                      )}

                      {/* Golden Mole */}
                      {mole.type === "golden" && (
                        <div className="relative w-full h-full bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-600 rounded-t-full border-2 border-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.8)] flex flex-col items-center justify-start pt-1 animate-pulse">
                          {/* Crown */}
                          <Crown className="w-5 h-5 text-yellow-100 drop-shadow-md" />
                          {/* Eyes */}
                          <div className="flex gap-2 my-1">
                            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
                            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
                          </div>
                          {/* Nose */}
                          <div className="w-3.5 h-2 bg-pink-300 rounded-full" />
                        </div>
                      )}

                      {/* Bomb Mole */}
                      {mole.type === "bomb" && (
                        <div className="relative w-full h-full bg-slate-900 rounded-t-full border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] flex flex-col items-center justify-start pt-2">
                          {/* Fuse */}
                          <div className="w-1 h-3 bg-amber-600 -mt-3 animate-ping" />
                          {/* Skull/Bomb icon */}
                          <Skull className="w-6 h-6 text-red-500 mb-1" />
                          <span className="text-[10px] font-black text-red-400 tracking-tighter">DANGER</span>
                        </div>
                      )}

                      {/* Helmet Mole */}
                      {mole.type === "helmet" && (
                        <div className="relative w-full h-full bg-amber-900 rounded-t-full border-2 border-slate-500 shadow-xl flex flex-col items-center justify-start pt-1">
                          {/* Heavy Iron Helmet */}
                          <div className="w-[85%] h-6 bg-slate-700 border-2 border-slate-400 rounded-t-lg flex items-center justify-center mb-1">
                            <span className="text-[9px] font-extrabold text-slate-200">{mole.hp}/2 HP</span>
                          </div>
                          {/* Eyes */}
                          <div className="flex gap-2 mb-1">
                            <div className="w-2 h-2 bg-slate-950 rounded-full" />
                            <div className="w-2 h-2 bg-slate-950 rounded-full" />
                          </div>
                        </div>
                      )}

                      {/* Time Mole */}
                      {mole.type === "time" && (
                        <div className="relative w-full h-full bg-gradient-to-b from-cyan-400 to-blue-600 rounded-t-full border-2 border-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.8)] flex flex-col items-center justify-start pt-2">
                          <Clock className="w-5 h-5 text-white mb-1" />
                          <span className="text-[10px] font-extrabold text-white">+5s</span>
                        </div>
                      )}

                      {/* Rainbow Mole */}
                      {mole.type === "rainbow" && (
                        <div className="relative w-full h-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-t-full border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.9)] flex flex-col items-center justify-start pt-2 animate-bounce">
                          <Sparkles className="w-5 h-5 text-yellow-300 mb-1" />
                          <span className="text-[9px] font-black text-white">500 PTS</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Text FX */}
              {floatingTexts.map((ft) => (
                <div
                  key={ft.id}
                  style={{ left: ft.x, top: ft.y, color: ft.color }}
                  className="absolute pointer-events-none font-black text-sm md:text-base -translate-x-1/2 -translate-y-1/2 animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  {ft.text}
                </div>
              ))}

              {/* Particle Canvas / Elements */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    left: p.x,
                    top: p.y,
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    opacity: p.life,
                  }}
                  className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                />
              ))}

              {/* Custom Mallet Hammer Cursor */}
              <div
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                }}
                className={`absolute pointer-events-none z-30 transition-transform duration-75 origin-bottom-right ${
                  isSwinging ? "-rotate-45 scale-110" : "rotate-12"
                }`}
              >
                {/* Mallet Head */}
                <div className="w-8 h-5 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 border border-amber-600 rounded-sm shadow-2xl flex items-center justify-between px-1">
                  <div className="w-1 h-full bg-amber-500" />
                  <div className="w-1 h-full bg-amber-500" />
                </div>
                {/* Mallet Handle */}
                <div className="w-2 h-10 bg-amber-600 border-x border-amber-700 mx-auto -mt-1 rounded-b-sm" />
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER MODAL */}
        {gameState === "gameOver" && (
          <div className="flex flex-col items-center text-center gap-5 py-4">
            <div className="p-3 bg-amber-500/20 border border-amber-500 rounded-full animate-pulse">
              <Award className="w-10 h-10 text-amber-400" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">GAME OVER!</h2>
              <p className="text-slate-400 text-sm mt-1">Challenge completed in {config.name} mode.</p>
            </div>

            {/* Performance Rating Badge */}
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-black px-4 py-2 border-2 rounded-xl ${grade.color}`}>
                GRADE {grade.letter}
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-xs text-slate-500">FINAL SCORE</div>
                <div className="text-xl font-extrabold text-amber-400">{score}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-xs text-slate-500">BEST SCORE</div>
                <div className="text-xl font-extrabold text-yellow-300">{bestScores[difficulty]}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-xs text-slate-500">MAX COMBO</div>
                <div className="text-xl font-extrabold text-orange-400">{maxCombo}x</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-xs text-slate-500">ACCURACY</div>
                <div className="text-xl font-extrabold text-emerald-400">{accuracy}%</div>
              </div>
            </div>

            {/* Sub-stats summary */}
            <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex justify-around text-xs text-slate-400">
              <div>Whacks: <span className="text-white font-bold">{hits}</span></div>
              <div>Misses: <span className="text-white font-bold">{misses}</span></div>
              <div>Bombs Hit: <span className="text-red-400 font-bold">{bombsHit}</span></div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full max-w-md mt-2">
              <Button
                onClick={startGame}
                className="flex-1 py-5 font-bold text-base bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 rounded-xl"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </Button>
              <Button
                onClick={() => setGameState("menu")}
                variant="outline"
                className="flex-1 py-5 font-bold text-base border-slate-700 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
              >
                Change Difficulty
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
