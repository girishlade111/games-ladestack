"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Shield,
  Zap,
  Sparkles,
  Flame,
  Clock,
  Heart,
  Pause,
  HelpCircle,
  BarChart2,
  Award,
} from "lucide-react"

interface BubblePopGameProps {
  onBack: () => void
  themeColor: string
}

type GameMode = "arcade" | "survival" | "frenzy" | "zen"
type Difficulty = "easy" | "normal" | "hard" | "master"
type BubbleType = "normal" | "gold" | "bomb" | "clock" | "lightning" | "rainbow" | "armored"

interface Bubble {
  id: number
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  type: BubbleType
  color: string
  accentColor: string
  wobblePhase: number
  wobbleSpeed: number
  hp: number
  maxHp: number
  points: number
  pulsePhase: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  opacity: number
  life: number
  maxLife: number
  shape?: "circle" | "spark" | "ring"
}

interface FloatingText {
  id: number
  x: number
  y: number
  text: string
  color: string
  opacity: number
  life: number
  maxLife: number
  scale: number
}

interface AmbientBubble {
  x: number
  y: number
  radius: number
  speed: number
  opacity: number
}

export default function BubblePopGame({ onBack, themeColor }: BubblePopGameProps) {
  // Game state
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu")
  const [mode, setMode] = useState<GameMode>("arcade")
  const [difficulty, setDifficulty] = useState<Difficulty>("normal")
  
  // Scoring & Stats
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(60)
  const [bubblesPopped, setBubblesPopped] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [successfulPops, setSuccessfulPops] = useState(0)

  // Active Effects
  const [slowMoTimer, setSlowMoTimer] = useState(0)
  const [frenzyTimer, setFrenzyTimer] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Canvas & Audio References
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const spawnTimerRef = useRef<number>(0)
  const nextIdRef = useRef<number>(0)
  const shakeIntensityRef = useRef<number>(0)

  // Entities stored in refs for 60FPS performance
  const bubblesRef = useRef<Bubble[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatingTextsRef = useRef<FloatingText[]>([])
  const ambientBubblesRef = useRef<AmbientBubble[]>([])

  // Web Audio Synthesizer
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AudioCtx()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const playSynthSound = useCallback((type: "pop" | "bomb" | "gold" | "slow" | "lightning" | "rainbow" | "armor", pitchMultiplier = 1) => {
    if (!soundEnabled) return
    try {
      const ctx = getAudioContext()
      const now = ctx.currentTime

      if (type === "pop") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        const freq = (400 + Math.random() * 200) * pitchMultiplier
        osc.frequency.setValueAtTime(freq, now)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.08)

        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === "bomb") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(140, now)
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35)

        gain.gain.setValueAtTime(0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.35)
      } else if (type === "gold") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(587.33, now) // D5
        osc.frequency.setValueAtTime(880, now + 0.08) // A5

        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === "slow") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.4)

        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.4)
      } else if (type === "lightning") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "square"
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.linearRampToValueAtTime(1200, now + 0.15)

        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === "rainbow") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.3)

        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.3)
      } else if (type === "armor") {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(220, now)
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1)

        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.1)
      }
    } catch {
      // Audio context error fallback
    }
  }, [soundEnabled, getAudioContext])

  // Load High Score from localStorage
  useEffect(() => {
    const key = `bubble-pop-best-${mode}-${difficulty}`
    const saved = localStorage.getItem(key)
    if (saved) {
      setHighScore(parseInt(saved, 10))
    } else {
      setHighScore(0)
    }
  }, [mode, difficulty])

  // Initialize Ambient Background Bubbles
  useEffect(() => {
    const ambient: AmbientBubble[] = []
    for (let i = 0; i < 20; i++) {
      ambient.push({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        radius: Math.random() * 25 + 5,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.15 + 0.05,
      })
    }
    ambientBubblesRef.current = ambient
  }, [])

  // Difficulty parameters helper
  const getDifficultySettings = useCallback(() => {
    switch (difficulty) {
      case "easy":
        return { speedMult: 0.7, minRadius: 28, maxRadius: 42, bombChance: 0.05, spawnInterval: 900 }
      case "hard":
        return { speedMult: 1.4, minRadius: 18, maxRadius: 30, bombChance: 0.18, spawnInterval: 500 }
      case "master":
        return { speedMult: 1.8, minRadius: 14, maxRadius: 25, bombChance: 0.24, spawnInterval: 380 }
      case "normal":
      default:
        return { speedMult: 1.0, minRadius: 22, maxRadius: 36, bombChance: 0.10, spawnInterval: 700 }
    }
  }, [difficulty])

  // Spawn Bubble Logic
  const spawnBubble = useCallback((forcedType?: BubbleType) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { speedMult, minRadius, maxRadius, bombChance } = getDifficultySettings()

    const radius = Math.floor(Math.random() * (maxRadius - minRadius + 1)) + minRadius
    const x = Math.random() * (canvas.width - radius * 2) + radius
    const y = canvas.height + radius + 10

    let type: BubbleType = "normal"
    if (forcedType) {
      type = forcedType
    } else {
      const rand = Math.random()
      if (rand < bombChance && mode !== "zen") {
        type = "bomb"
      } else if (rand < bombChance + 0.08) {
        type = "gold"
      } else if (rand < bombChance + 0.13) {
        type = "clock"
      } else if (rand < bombChance + 0.18) {
        type = "lightning"
      } else if (rand < bombChance + 0.22) {
        type = "rainbow"
      } else if (rand < bombChance + 0.27) {
        type = "armored"
      }
    }

    // Color definitions
    let color = "#3b82f6"
    let accentColor = "#93c5fd"
    let points = 10

    if (type === "normal") {
      const normalColors = [
        { c: "#3b82f6", a: "#93c5fd" },
        { c: "#06b6d4", a: "#67e8f9" },
        { c: "#ec4899", a: "#fbcfe8" },
        { c: "#10b981", a: "#6ee7b7" },
        { c: "#8b5cf6", a: "#c4b5fd" },
      ]
      const chosen = normalColors[Math.floor(Math.random() * normalColors.length)]
      color = chosen.c
      accentColor = chosen.a
      // Smaller bubbles get slightly higher points
      points = Math.round(10 + (40 - radius) * 0.5)
    } else if (type === "gold") {
      color = "#f59e0b"
      accentColor = "#fef08a"
      points = 50
    } else if (type === "bomb") {
      color = "#ef4444"
      accentColor = "#fca5a5"
      points = -30
    } else if (type === "clock") {
      color = "#0284c7"
      accentColor = "#bae6fd"
      points = 20
    } else if (type === "lightning") {
      color = "#7c3aed"
      accentColor = "#ddd6fe"
      points = 25
    } else if (type === "rainbow") {
      color = "#d946ef"
      accentColor = "#f5d0fe"
      points = 30
    } else if (type === "armored") {
      color = "#64748b"
      accentColor = "#cbd5e1"
      points = 40
    }

    const baseSpeed = (Math.random() * 1.5 + 1.2) * speedMult
    const vy = mode === "frenzy" ? -baseSpeed * 1.5 : -baseSpeed
    const vx = (Math.random() - 0.5) * 0.8

    const newBubble: Bubble = {
      id: nextIdRef.current++,
      x,
      y,
      radius,
      vx,
      vy,
      type,
      color,
      accentColor,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.05 + 0.02,
      hp: type === "armored" ? 2 : 1,
      maxHp: type === "armored" ? 2 : 1,
      points,
      pulsePhase: 0,
    }

    bubblesRef.current.push(newBubble)
  }, [getDifficultySettings, mode])

  // Create Particle Explosion
  const createParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 5 + 1.5
      newParticles.push({
        id: nextIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: Math.random() * 4 + 2,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 20 + 20,
        shape: Math.random() < 0.3 ? "spark" : "circle",
      })
    }
    particlesRef.current.push(...newParticles)
  }, [])

  // Create Floating Text Overlay
  const createFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      id: nextIdRef.current++,
      x,
      y,
      text,
      color,
      opacity: 1,
      life: 0,
      maxLife: 35,
      scale: 1,
    })
  }, [])

  // Trigger Screen Shake
  const triggerShake = useCallback((intensity = 15) => {
    shakeIntensityRef.current = intensity
  }, [])

  // Pop Bubble Logic
  const popBubble = useCallback((bubble: Bubble, isChain = false) => {
    if (bubble.hp > 1) {
      // Armored bubble hit
      bubble.hp -= 1
      playSynthSound("armor")
      createParticles(bubble.x, bubble.y, "#94a3b8", 6)
      createFloatingText(bubble.x, bubble.y, "CRACK!", "#94a3b8")
      return
    }

    // Remove bubble
    bubblesRef.current = bubblesRef.current.filter((b) => b.id !== bubble.id)

    setBubblesPopped((prev) => prev + 1)
    setSuccessfulPops((prev) => prev + 1)

    // Combo system
    let currentCombo = 0
    setCombo((prev) => {
      currentCombo = prev + 1
      setMaxCombo((max) => Math.max(max, currentCombo))
      return currentCombo
    })

    const pitchScale = Math.min(2.0, 1 + currentCombo * 0.05)

    // Handle bubble types
    if (bubble.type === "bomb") {
      playSynthSound("bomb")
      triggerShake(18)
      createParticles(bubble.x, bubble.y, "#ef4444", 25)
      createFloatingText(bubble.x, bubble.y, "BOMB! -30", "#ef4444")
      
      setScore((s) => Math.max(0, s - 30))
      setCombo(0)

      if (mode === "survival") {
        setLives((l) => {
          const next = l - 1
          if (next <= 0) setGameState("gameOver")
          return Math.max(0, next)
        })
      } else if (mode === "arcade") {
        setTimeLeft((t) => Math.max(0, t - 3))
      }
      return
    }

    // Positive Pops
    let earnedPoints = bubble.points
    if (currentCombo > 1) {
      earnedPoints = Math.round(earnedPoints * (1 + (currentCombo - 1) * 0.1))
    }

    setScore((s) => s + earnedPoints)

    if (bubble.type === "normal") {
      playSynthSound("pop", pitchScale)
      createParticles(bubble.x, bubble.y, bubble.color, 10)
      createFloatingText(
        bubble.x,
        bubble.y,
        `+${earnedPoints}${currentCombo > 2 ? ` (x${currentCombo})` : ""}`,
        bubble.accentColor
      )
    } else if (bubble.type === "gold") {
      playSynthSound("gold")
      createParticles(bubble.x, bubble.y, "#f59e0b", 20)
      createFloatingText(bubble.x, bubble.y, `⭐ +${earnedPoints}`, "#fef08a")
    } else if (bubble.type === "clock") {
      playSynthSound("slow")
      createParticles(bubble.x, bubble.y, "#0284c7", 18)
      createFloatingText(bubble.x, bubble.y, "❄️ SLOW MO!", "#7dd3fc")
      setSlowMoTimer(300) // ~5 seconds
    } else if (bubble.type === "lightning") {
      playSynthSound("lightning")
      createParticles(bubble.x, bubble.y, "#7c3aed", 22)
      createFloatingText(bubble.x, bubble.y, "⚡ CHAIN BURST!", "#c4b5fd")
      
      // Chain reaction: pop surrounding bubbles within radius
      if (!isChain) {
        const radius = 160
        const toChain = bubblesRef.current.filter((other) => {
          const dist = Math.hypot(other.x - bubble.x, other.y - bubble.y)
          return dist <= radius && other.id !== bubble.id
        })
        toChain.forEach((other) => popBubble(other, true))
      }
    } else if (bubble.type === "rainbow") {
      playSynthSound("rainbow")
      createParticles(bubble.x, bubble.y, "#d946ef", 24)
      createFloatingText(bubble.x, bubble.y, "🌈 FRENZY RUSH!", "#f5d0fe")
      setFrenzyTimer(240) // ~4 seconds
      // Instant bonus spawns
      for (let i = 0; i < 6; i++) {
        spawnBubble("gold")
      }
    } else if (bubble.type === "armored") {
      playSynthSound("pop", pitchScale)
      createParticles(bubble.x, bubble.y, "#64748b", 16)
      createFloatingText(bubble.x, bubble.y, `🛡️ +${earnedPoints}`, "#cbd5e1")
    }
  }, [mode, playSynthSound, createParticles, createFloatingText, triggerShake, spawnBubble])

  // Canvas Click / Touch Handler
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return
    
    // Ensure Audio Context is active
    getAudioContext()

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    setTotalClicks((prev) => prev + 1)

    // Find clicked bubble (from top rendered to bottom)
    const clickedBubble = [...bubblesRef.current].reverse().find((bubble) => {
      const dist = Math.hypot(clickX - bubble.x, clickY - bubble.y)
      return dist <= bubble.radius + 6 // Slightly forgiving touch radius
    })

    if (clickedBubble) {
      popBubble(clickedBubble)
    } else {
      // Missed click - reset combo unless Zen mode
      if (mode !== "zen") {
        setCombo(0)
      }
    }
  }, [gameState, getAudioContext, popBubble, mode])

  // Reset Game
  const resetGame = useCallback(() => {
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setLives(3)
    setTimeLeft(60)
    setBubblesPopped(0)
    setTotalClicks(0)
    setSuccessfulPops(0)
    setSlowMoTimer(0)
    setFrenzyTimer(0)
    bubblesRef.current = []
    particlesRef.current = []
    floatingTextsRef.current = []
    shakeIntensityRef.current = 0
  }, [])

  // Start Game
  const startGame = useCallback(() => {
    resetGame()
    setGameState("playing")
  }, [resetGame])

  // Main Render Loop (60FPS Canvas)
  useEffect(() => {
    let animationId: number

    const render = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = Math.min(50, timestamp - lastTimeRef.current)
      lastTimeRef.current = timestamp

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Handle screen shake decay
      let shakeX = 0
      let shakeY = 0
      if (shakeIntensityRef.current > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensityRef.current
        shakeY = (Math.random() - 0.5) * shakeIntensityRef.current
        shakeIntensityRef.current = Math.max(0, shakeIntensityRef.current - 0.8)
      }

      ctx.save()
      ctx.translate(shakeX, shakeY)

      // Clear & Draw Dynamic Deep Backdrop
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#0f172a")
      gradient.addColorStop(0.5, "#1e1b4b")
      gradient.addColorStop(1, "#311b92")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw Ambient Floating Bubbles
      ambientBubblesRef.current.forEach((amb) => {
        amb.y -= amb.speed
        if (amb.y < -amb.radius) {
          amb.y = canvas.height + amb.radius
          amb.x = Math.random() * canvas.width
        }
        ctx.beginPath()
        ctx.arc(amb.x, amb.y, amb.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${amb.opacity})`
        ctx.fill()
      })

      if (gameState === "playing") {
        // Active effect timers
        setSlowMoTimer((prev) => Math.max(0, prev - 1))
        setFrenzyTimer((prev) => Math.max(0, prev - 1))

        const isSlowMo = slowMoTimer > 0
        const isFrenzy = frenzyTimer > 0

        // Timer update for Arcade mode
        if (mode === "arcade") {
          setTimeLeft((prev) => {
            const next = prev - deltaTime / 1000
            if (next <= 0) {
              setGameState("gameOver")
              return 0
            }
            return next
          })
        }

        // Spawn logic
        const { spawnInterval } = getDifficultySettings()
        const effectiveSpawnInterval = isFrenzy ? spawnInterval * 0.3 : isSlowMo ? spawnInterval * 1.5 : spawnInterval

        spawnTimerRef.current += deltaTime
        if (spawnTimerRef.current >= effectiveSpawnInterval) {
          spawnTimerRef.current = 0
          spawnBubble()
          if (isFrenzy) spawnBubble()
        }

        // Update & Render Bubbles
        const speedMultiplier = isSlowMo ? 0.35 : isFrenzy ? 1.4 : 1.0

        bubblesRef.current.forEach((bubble) => {
          bubble.y += bubble.vy * speedMultiplier
          bubble.wobblePhase += bubble.wobbleSpeed
          bubble.x += Math.sin(bubble.wobblePhase) * 0.6 + bubble.vx
          bubble.pulsePhase += 0.05

          // Bounce off left/right canvas boundaries
          if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > canvas.width) {
            bubble.vx *= -1
          }

          // Render Bubble Glossy Aesthetics
          ctx.save()
          ctx.translate(bubble.x, bubble.y)

          // Wobble scale effect
          const scaleX = 1 + Math.sin(bubble.wobblePhase) * 0.05
          const scaleY = 1 - Math.sin(bubble.wobblePhase) * 0.05
          ctx.scale(scaleX, scaleY)

          // Outer Pulse/Aura for Special Bubbles
          if (bubble.type === "bomb") {
            const pulse = Math.sin(bubble.pulsePhase) * 4
            ctx.beginPath()
            ctx.arc(0, 0, bubble.radius + 4 + pulse, 0, Math.PI * 2)
            ctx.fillStyle = "rgba(239, 68, 68, 0.35)"
            ctx.fill()
          } else if (bubble.type === "gold") {
            ctx.beginPath()
            ctx.arc(0, 0, bubble.radius + 5, 0, Math.PI * 2)
            ctx.fillStyle = "rgba(245, 158, 11, 0.3)"
            ctx.fill()
          } else if (bubble.type === "lightning") {
            ctx.beginPath()
            ctx.arc(0, 0, bubble.radius + 6, 0, Math.PI * 2)
            ctx.fillStyle = "rgba(124, 58, 237, 0.35)"
            ctx.fill()
          }

          // Main Bubble Radial Gradient
          const bGrad = ctx.createRadialGradient(
            -bubble.radius * 0.3,
            -bubble.radius * 0.3,
            bubble.radius * 0.1,
            0,
            0,
            bubble.radius
          )
          bGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)")
          bGrad.addColorStop(0.3, bubble.accentColor)
          bGrad.addColorStop(0.85, bubble.color)
          bGrad.addColorStop(1, "rgba(15, 23, 42, 0.6)")

          ctx.beginPath()
          ctx.arc(0, 0, bubble.radius, 0, Math.PI * 2)
          ctx.fillStyle = bGrad
          ctx.fill()
          ctx.lineWidth = 1.5
          ctx.strokeStyle = bubble.accentColor
          ctx.stroke()

          // Specular Highlight (Glass Shine)
          ctx.beginPath()
          ctx.ellipse(
            -bubble.radius * 0.35,
            -bubble.radius * 0.35,
            bubble.radius * 0.35,
            bubble.radius * 0.2,
            Math.PI / 4,
            0,
            Math.PI * 2
          )
          ctx.fillStyle = "rgba(255, 255, 255, 0.65)"
          ctx.fill()

          // Inner Icon / Text Demarcation
          ctx.fillStyle = "#ffffff"
          ctx.font = `bold ${Math.max(12, bubble.radius * 0.7)}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"

          if (bubble.type === "bomb") {
            ctx.fillText("💣", 0, 1)
          } else if (bubble.type === "gold") {
            ctx.fillText("⭐", 0, 1)
          } else if (bubble.type === "clock") {
            ctx.fillText("❄️", 0, 1)
          } else if (bubble.type === "lightning") {
            ctx.fillText("⚡", 0, 1)
          } else if (bubble.type === "rainbow") {
            ctx.fillText("🌈", 0, 1)
          } else if (bubble.type === "armored") {
            ctx.fillText(bubble.hp === 2 ? "🛡️" : "💥", 0, 1)
          }

          ctx.restore()
        })

        // Filter out bubbles that escaped off top of canvas
        const escaped = bubblesRef.current.filter((b) => b.y < -b.radius - 20)
        if (escaped.length > 0) {
          bubblesRef.current = bubblesRef.current.filter((b) => b.y >= -b.radius - 20)

          if (mode === "survival") {
            const nonBombEscaped = escaped.filter((b) => b.type !== "bomb")
            if (nonBombEscaped.length > 0) {
              setLives((l) => {
                const next = l - nonBombEscaped.length
                if (next <= 0) setGameState("gameOver")
                return Math.max(0, next)
              })
              setCombo(0)
              triggerShake(8)
            }
          } else if (mode === "arcade") {
            // Escaped bubble breaks combo
            const nonBombEscaped = escaped.filter((b) => b.type !== "bomb")
            if (nonBombEscaped.length > 0) {
              setCombo(0)
            }
          }
        }

        // Update & Render Particles
        particlesRef.current.forEach((p) => {
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.12 // Gravity
          p.life += 1
          p.opacity = 1 - p.life / p.maxLife

          ctx.save()
          ctx.globalAlpha = Math.max(0, p.opacity)
          ctx.fillStyle = p.color
          ctx.beginPath()
          if (p.shape === "spark") {
            ctx.rect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)
          } else {
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          }
          ctx.fill()
          ctx.restore()
        })
        particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife)

        // Update & Render Floating Text
        floatingTextsRef.current.forEach((ft) => {
          ft.y -= 1.2
          ft.life += 1
          ft.opacity = 1 - ft.life / ft.maxLife

          ctx.save()
          ctx.globalAlpha = Math.max(0, ft.opacity)
          ctx.fillStyle = ft.color
          ctx.font = "bold 18px sans-serif"
          ctx.textAlign = "center"
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
          ctx.shadowBlur = 4
          ctx.fillText(ft.text, ft.x, ft.y)
          ctx.restore()
        })
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.life < ft.maxLife)
      }

      ctx.restore()
      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationId)
  }, [gameState, mode, slowMoTimer, frenzyTimer, getDifficultySettings, spawnBubble, triggerShake])

  // Save High Score on Game Over
  useEffect(() => {
    if (gameState === "gameOver") {
      if (score > highScore) {
        setHighScore(score)
        const key = `bubble-pop-best-${mode}-${difficulty}`
        localStorage.setItem(key, score.toString())
      }
    }
  }, [gameState, score, highScore, mode, difficulty])

  const calculatedAccuracy = totalClicks > 0 ? Math.round((successfulPops / totalClicks) * 100) : 0

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-slate-950 text-white select-none font-sans">
      {/* Top Header Bar */}
      <div className="z-20 flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              BUBBLE POP
            </span>
            <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
              {mode} • {difficulty}
            </span>
          </div>
        </div>

        {/* HUD In Game */}
        {gameState === "playing" && (
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Score */}
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Score</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400">{score.toLocaleString()}</div>
            </div>

            {/* Arcade Mode Timer / Survival Lives */}
            {mode === "arcade" && (
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Time</div>
                <div
                  className={`text-xl sm:text-2xl font-black ${
                    timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"
                  }`}
                >
                  {Math.ceil(timeLeft)}s
                </div>
              </div>
            )}

            {mode === "survival" && (
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Lives</div>
                <div className="flex gap-1 text-red-500 text-lg">
                  {[1, 2, 3].map((heartIndex) => (
                    <Heart
                      key={heartIndex}
                      className={`w-5 h-5 ${
                        heartIndex <= lives ? "fill-red-500 text-red-500" : "text-slate-600 fill-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Combo */}
            <div className="text-center min-w-[50px]">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Combo</div>
              <div
                className={`text-xl sm:text-2xl font-black ${
                  combo > 3 ? "text-purple-400 animate-bounce" : "text-slate-200"
                }`}
              >
                x{combo}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </Button>

          {gameState === "playing" && (
            <Button
              onClick={() => setGameState("paused")}
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Pause className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full h-full bg-slate-950 cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={900}
          height={650}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full object-cover touch-none"
        />

        {/* Active Power-up Overlay Indicators */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-3 pointer-events-none">
            {slowMoTimer > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-400/40 rounded-full text-cyan-300 font-bold text-xs animate-pulse">
                <Clock className="w-3.5 h-3.5" /> Slow-Mo Active!
              </div>
            )}
            {frenzyTimer > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 backdrop-blur-md border border-purple-400/40 rounded-full text-purple-300 font-bold text-xs animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> Bubble Frenzy!
              </div>
            )}
          </div>
        )}

        {/* Start / Mode Selection Menu Modal */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <Card className="w-full max-w-lg border-slate-800 bg-slate-900/90 text-white shadow-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: "8s" }} />
                  </div>
                  <h1 className="text-3xl font-black text-white tracking-tight">BUBBLE POP</h1>
                  <p className="text-xs text-slate-400 mt-1">Popping arcade action with fluid physics & synth audio</p>
                </div>

                {/* Mode Selector */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                      Game Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "arcade", label: "Arcade", desc: "60s Timed Challenge", icon: Clock },
                        { id: "survival", label: "Survival", desc: "3 Lives, Don't Miss", icon: Heart },
                        { id: "frenzy", label: "Frenzy", desc: "Rapid Fire Rush", icon: Flame },
                        { id: "zen", label: "Zen", desc: "Relaxed Endless", icon: Sparkles },
                      ].map((m) => {
                        const Icon = m.icon
                        const isSelected = mode === m.id
                        return (
                          <button
                            key={m.id}
                            onClick={() => setMode(m.id as GameMode)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "bg-blue-600/30 border-blue-500 text-white shadow-md shadow-blue-500/10"
                                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-sm text-white">
                              <Icon className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                              {m.label}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Difficulty Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["easy", "normal", "hard", "master"] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`py-2 px-1 rounded-lg border text-center font-bold text-xs uppercase tracking-wide transition-all ${
                            difficulty === d
                              ? "bg-amber-500/30 border-amber-500 text-amber-300"
                              : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* High Score Banner */}
                <div className="mb-6 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-xs">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Best Score ({mode} • {difficulty})</span>
                  </div>
                  <span className="text-lg font-black text-amber-400">{highScore.toLocaleString()}</span>
                </div>

                <Button
                  onClick={startGame}
                  className="w-full py-6 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 rounded-xl"
                >
                  <Play className="w-5 h-5 mr-2 fill-white" />
                  START GAME
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paused Menu Modal */}
        {gameState === "paused" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <Card className="w-full max-w-sm border-slate-800 bg-slate-900 text-white shadow-2xl">
              <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-black mb-4">GAME PAUSED</h2>
                <div className="space-y-3 mb-6">
                  <Button
                    onClick={() => setGameState("playing")}
                    className="w-full bg-blue-600 hover:bg-blue-500 font-bold"
                  >
                    Resume
                  </Button>
                  <Button
                    onClick={startGame}
                    variant="outline"
                    className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    Restart
                  </Button>
                  <Button
                    onClick={() => setGameState("menu")}
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                  >
                    Main Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white shadow-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                  <Trophy className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-1">GAME OVER</h2>
                <p className="text-xs text-slate-400 mb-6">
                  {mode.toUpperCase()} MODE • {difficulty.toUpperCase()}
                </p>

                {/* Score Breakdown Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Final Score</div>
                    <div className="text-2xl font-black text-amber-400">{score.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Best Score</div>
                    <div className="text-2xl font-black text-white">{highScore.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Max Combo</div>
                    <div className="text-xl font-bold text-purple-400">x{maxCombo}</div>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</div>
                    <div className="text-xl font-bold text-cyan-400">{calculatedAccuracy}%</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={startGame}
                    className="flex-1 py-5 font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Button
                    onClick={() => setGameState("menu")}
                    variant="outline"
                    className="flex-1 py-5 font-bold border-slate-700 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                  >
                    Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
