"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  Users,
  Bot,
  Flame,
  Shield,
  Sparkles,
  MousePointer,
  Keyboard,
  Swords,
  Gauge,
  CircleDot
} from "lucide-react"

// Canvas Resolution Constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 500
const PADDLE_WIDTH = 14
const BASE_PADDLE_HEIGHT = 90
const BALL_SIZE = 12
const INITIAL_BALL_SPEED = 6
const MAX_BALL_SPEED = 18

type Difficulty = "easy" | "medium" | "hard" | "impossible"
type GameMode = "ai" | "pvp"
type Variant = "classic" | "arcade"
type GameState = "menu" | "countdown" | "playing" | "paused" | "gameover"

interface PowerUp {
  id: string
  x: number
  y: number
  radius: number
  type: "multiball" | "expand" | "shrink" | "speed" | "shield" | "freeze"
  durationMs: number
  color: string
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  speed: number
  trail: { x: number; y: number }[]
  color: string
  isExtra?: boolean
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

interface ShieldBarrier {
  active: boolean
  x: number
  hitsRemaining: number
}

export default function PongGame({
  onBack,
  themeColor = "#3b82f6",
}: {
  onBack?: () => void
  themeColor?: string
}) {
  // Game Settings State
  const [gameMode, setGameMode] = useState<GameMode>("ai")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [variant, setVariant] = useState<Variant>("classic")
  const [targetScore, setTargetScore] = useState<number>(7)
  const [controlType, setControlType] = useState<"keyboard" | "mouse">("keyboard")
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  // Game Run State
  const [gameState, setGameState] = useState<GameState>("menu")
  const [countdown, setCountdown] = useState<number>(3)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [winner, setWinner] = useState<"p1" | "p2" | null>(null)

  // Stats State
  const [rallyCount, setRallyCount] = useState(0)
  const [maxRally, setMaxRally] = useState(0)
  const [maxBallSpeed, setMaxBallSpeed] = useState(INITIAL_BALL_SPEED)
  const [highScore, setHighScore] = useState(0)

  // Active PowerUp Display
  const [p1ActivePowerUp, setP1ActivePowerUp] = useState<string | null>(null)
  const [p2ActivePowerUp, setP2ActivePowerUp] = useState<string | null>(null)

  // Canvas & Audio References
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Dynamic Ref State for Game Loop
  const gameStateRef = useRef<GameState>("menu")
  const p1ScoreRef = useRef(0)
  const p2ScoreRef = useRef(0)

  const p1Ref = useRef({
    x: 24,
    y: CANVAS_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: BASE_PADDLE_HEIGHT,
    vy: 0,
    speed: 8,
    freezeTimer: 0,
  })

  const p2Ref = useRef({
    x: CANVAS_WIDTH - 24 - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: BASE_PADDLE_HEIGHT,
    vy: 0,
    speed: 7,
    freezeTimer: 0,
  })

  const ballsRef = useRef<Ball[]>([])
  const particlesRef = useRef<Particle[]>([])
  const powerUpsRef = useRef<PowerUp[]>([])
  const p1ShieldRef = useRef<ShieldBarrier>({ active: false, x: 10, hitsRemaining: 0 })
  const p2ShieldRef = useRef<ShieldBarrier>({ active: false, x: CANVAS_WIDTH - 10, hitsRemaining: 0 })

  const keysRef = useRef<Record<string, boolean>>({})
  const mousePosRef = useRef<number>(CANVAS_HEIGHT / 2)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const screenShakeRef = useRef<number>(0)
  const rallyRef = useRef<number>(0)
  const maxRallyRef = useRef<number>(0)
  const maxSpeedRef = useRef<number>(INITIAL_BALL_SPEED)

  // Load High Score on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pong_high_score")
      if (saved) setHighScore(parseInt(saved, 10))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Web Audio Synthesizer
  const playSound = useCallback(
    (type: "paddle" | "wall" | "score" | "powerup" | "win" | "lose", pitchMultiplier = 1) => {
      if (!soundEnabled) return
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          audioCtxRef.current = new AudioContextClass()
        }
        const ctx = audioCtxRef.current
        if (ctx.state === "suspended") {
          void ctx.resume()
        }

        const now = ctx.currentTime

        if (type === "paddle") {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "triangle"
          const freq = Math.min(1200, 320 * pitchMultiplier)
          osc.frequency.setValueAtTime(freq, now)
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08)
          gain.gain.setValueAtTime(0.3, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.08)
        } else if (type === "wall") {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(220, now)
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.05)
          gain.gain.setValueAtTime(0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.05)
        } else if (type === "powerup") {
          const notes = [440, 554.37, 659.25, 880]
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "sine"
            osc.frequency.setValueAtTime(freq, now + idx * 0.04)
            gain.gain.setValueAtTime(0.25, now + idx * 0.04)
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.08)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(now + idx * 0.04)
            osc.stop(now + idx * 0.04 + 0.08)
          })
        } else if (type === "score") {
          const notes = [523.25, 659.25, 783.99]
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "square"
            osc.frequency.setValueAtTime(freq, now + idx * 0.07)
            gain.gain.setValueAtTime(0.2, now + idx * 0.07)
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.12)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(now + idx * 0.07)
            osc.stop(now + idx * 0.07 + 0.12)
          })
        } else if (type === "win") {
          const notes = [523.25, 659.25, 783.99, 1046.5]
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "triangle"
            osc.frequency.setValueAtTime(freq, now + idx * 0.1)
            gain.gain.setValueAtTime(0.3, now + idx * 0.1)
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(now + idx * 0.1)
            osc.stop(now + idx * 0.1 + 0.25)
          })
        } else if (type === "lose") {
          const notes = [400, 350, 300, 250]
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "sawtooth"
            osc.frequency.setValueAtTime(freq, now + idx * 0.12)
            gain.gain.setValueAtTime(0.25, now + idx * 0.12)
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(now + idx * 0.12)
            osc.stop(now + idx * 0.12 + 0.2)
          })
        }
      } catch {
        // Audio fallback safe block
      }
    },
    [soundEnabled]
  )

  // Particle Explosions
  const createSparks = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 4 + 1
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
      })
    }
  }

  // Create Ball Helper
  const createBall = useCallback((towardsRight = true): Ball => {
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI
    const speed = INITIAL_BALL_SPEED
    const dx = Math.cos(angle) * speed * (towardsRight ? 1 : -1)
    const dy = Math.sin(angle) * speed
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx,
      dy,
      speed,
      trail: [],
      color: "#ffffff",
    }
  }, [])

  // Spawn Power-Up
  const spawnPowerUp = () => {
    if (variant !== "arcade") return
    if (powerUpsRef.current.length >= 2) return

    const types: PowerUp["type"][] = ["multiball", "expand", "shrink", "speed", "shield", "freeze"]
    const selectedType = types[Math.floor(Math.random() * types.length)]

    const colorMap: Record<PowerUp["type"], string> = {
      multiball: "#f59e0b", // Amber
      expand: "#10b981",   // Emerald
      shrink: "#ef4444",   // Red
      speed: "#ec4899",    // Pink
      shield: "#3b82f6",   // Blue
      freeze: "#06b6d4",   // Cyan
    }

    powerUpsRef.current.push({
      id: Math.random().toString(),
      x: CANVAS_WIDTH / 4 + Math.random() * (CANVAS_WIDTH / 2),
      y: 60 + Math.random() * (CANVAS_HEIGHT - 120),
      radius: 16,
      type: selectedType,
      durationMs: 7000,
      color: colorMap[selectedType],
    })
  }

  // Reset Round / Serve
  const serveBall = useCallback(
    (towardsPlayer2 = true) => {
      ballsRef.current = [createBall(towardsPlayer2)]
      rallyRef.current = 0
      setRallyCount(0)
    },
    [createBall]
  )

  // Start Countdown Sequence
  const startCountdown = useCallback(
    (serveTowardsP2 = true) => {
      setGameState("countdown")
      gameStateRef.current = "countdown"
      setCountdown(3)
      serveBall(serveTowardsP2)

      let timer = 3
      const interval = setInterval(() => {
        timer -= 1
        setCountdown(timer)
        if (timer <= 0) {
          clearInterval(interval)
          setGameState("playing")
          gameStateRef.current = "playing"
        }
      }, 700)
    },
    [serveBall]
  )

  // Full Game Reset
  const resetGame = useCallback(() => {
    p1ScoreRef.current = 0
    p2ScoreRef.current = 0
    setPlayer1Score(0)
    setPlayer2Score(0)
    setWinner(null)
    rallyRef.current = 0
    maxRallyRef.current = 0
    maxSpeedRef.current = INITIAL_BALL_SPEED
    setRallyCount(0)
    setMaxRally(0)
    setMaxBallSpeed(INITIAL_BALL_SPEED)

    p1Ref.current.y = CANVAS_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2
    p1Ref.current.height = BASE_PADDLE_HEIGHT
    p1Ref.current.freezeTimer = 0

    p2Ref.current.y = CANVAS_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2
    p2Ref.current.height = BASE_PADDLE_HEIGHT
    p2Ref.current.freezeTimer = 0

    p1ShieldRef.current = { active: false, x: 10, hitsRemaining: 0 }
    p2ShieldRef.current = { active: false, x: CANVAS_WIDTH - 10, hitsRemaining: 0 }

    powerUpsRef.current = []
    particlesRef.current = []
    setP1ActivePowerUp(null)
    setP2ActivePowerUp(null)

    startCountdown(Math.random() > 0.5)
  }, [startCountdown])

  // Apply PowerUp Effect
  const applyPowerUp = (player: "p1" | "p2", powerUpType: PowerUp["type"]) => {
    playSound("powerup")
    const isP1 = player === "p1"
    const self = isP1 ? p1Ref.current : p2Ref.current
    const opponent = isP1 ? p2Ref.current : p1Ref.current

    if (isP1) setP1ActivePowerUp(powerUpType.toUpperCase())
    else setP2ActivePowerUp(powerUpType.toUpperCase())

    setTimeout(() => {
      if (isP1) setP1ActivePowerUp(null)
      else setP2ActivePowerUp(null)
    }, 5000)

    switch (powerUpType) {
      case "multiball": {
        const extraBall = createBall(isP1)
        extraBall.isExtra = true
        ballsRef.current.push(extraBall)
        break
      }
      case "expand": {
        self.height = BASE_PADDLE_HEIGHT * 1.45
        setTimeout(() => {
          self.height = BASE_PADDLE_HEIGHT
        }, 7000)
        break
      }
      case "shrink": {
        opponent.height = BASE_PADDLE_HEIGHT * 0.65
        setTimeout(() => {
          opponent.height = BASE_PADDLE_HEIGHT
        }, 7000)
        break
      }
      case "speed": {
        ballsRef.current.forEach((b) => {
          b.speed = Math.min(MAX_BALL_SPEED, b.speed * 1.35)
          b.dx *= 1.35
          b.dy *= 1.35
        })
        break
      }
      case "shield": {
        if (isP1) p1ShieldRef.current = { active: true, x: 12, hitsRemaining: 1 }
        else p2ShieldRef.current = { active: true, x: CANVAS_WIDTH - 12, hitsRemaining: 1 }
        break
      }
      case "freeze": {
        opponent.freezeTimer = 2500 // freeze for 2.5 seconds
        break
      }
    }
  }

  // Update Game Loop Physics
  const updatePhysics = useCallback(
    (deltaMs: number) => {
      if (gameStateRef.current !== "playing") return

      const keys = keysRef.current
      const p1 = p1Ref.current
      const p2 = p2Ref.current

      // Decrease freeze timers
      if (p1.freezeTimer > 0) p1.freezeTimer -= deltaMs
      if (p2.freezeTimer > 0) p2.freezeTimer -= deltaMs

      // Player 1 Movement (Keyboard W/S or Mouse)
      const p1Speed = p1.freezeTimer > 0 ? p1.speed * 0.35 : p1.speed
      if (controlType === "mouse") {
        const targetY = mousePosRef.current - p1.height / 2
        p1.y += (targetY - p1.y) * 0.25
      } else {
        if (keys["KeyW"] || keys["w"] || keys["W"]) p1.y -= p1Speed
        if (keys["KeyS"] || keys["s"] || keys["S"]) p1.y += p1Speed
      }
      p1.y = Math.max(8, Math.min(CANVAS_HEIGHT - p1.height - 8, p1.y))

      // Player 2 / AI Movement
      const p2Speed = p2.freezeTimer > 0 ? p2.speed * 0.35 : p2.speed
      if (gameMode === "pvp") {
        if (keys["ArrowUp"]) p2.y -= p2Speed
        if (keys["ArrowDown"]) p2.y += p2Speed
      } else {
        // AI Logic
        const primaryBall = ballsRef.current.find((b) => b.dx > 0) || ballsRef.current[0]
        if (primaryBall) {
          let targetY = primaryBall.y - p2.height / 2

          // Add difficulty variation
          if (difficulty === "easy") {
            // Relaxed delay, center offset
            targetY += Math.sin(Date.now() / 250) * 35
            const aiSpeed = p2Speed * 0.55
            if (p2.y < targetY - 15) p2.y += aiSpeed
            else if (p2.y > targetY + 15) p2.y -= aiSpeed
          } else if (difficulty === "medium") {
            const aiSpeed = p2Speed * 0.75
            if (p2.y < targetY - 10) p2.y += aiSpeed
            else if (p2.y > targetY + 10) p2.y -= aiSpeed
          } else if (difficulty === "hard") {
            // Predictive trajectory forecasting
            if (primaryBall.dx > 0) {
              const timeToReach = (p2.x - primaryBall.x) / primaryBall.dx
              let predictedY = primaryBall.y + primaryBall.dy * timeToReach
              if (predictedY < 0 || predictedY > CANVAS_HEIGHT) {
                predictedY = Math.abs(predictedY) % CANVAS_HEIGHT
              }
              targetY = predictedY - p2.height / 2
            }
            const aiSpeed = p2Speed * 0.95
            if (p2.y < targetY - 5) p2.y += aiSpeed
            else if (p2.y > targetY + 5) p2.y -= aiSpeed
          } else if (difficulty === "impossible") {
            // Perfect instant tracking AI
            targetY = primaryBall.y - p2.height / 2
            p2.y += (targetY - p2.y) * 0.35
          }
        }
      }
      p2.y = Math.max(8, Math.min(CANVAS_HEIGHT - p2.height - 8, p2.y))

      // Arcade PowerUp Spawner
      if (variant === "arcade" && Math.random() < 0.003) {
        spawnPowerUp()
      }

      // Update Balls
      const activeBalls: Ball[] = []

      for (let i = 0; i < ballsRef.current.length; i++) {
        const ball = ballsRef.current[i]

        // Record Trail
        ball.trail.push({ x: ball.x, y: ball.y })
        if (ball.trail.length > 8) ball.trail.shift()

        // Move Ball
        ball.x += ball.dx
        ball.y += ball.dy

        // Wall Bounce (Top & Bottom)
        if (ball.y - BALL_SIZE / 2 <= 0) {
          ball.y = BALL_SIZE / 2
          ball.dy = -ball.dy
          playSound("wall")
          createSparks(ball.x, ball.y, "#94a3b8", 6)
        } else if (ball.y + BALL_SIZE / 2 >= CANVAS_HEIGHT) {
          ball.y = CANVAS_HEIGHT - BALL_SIZE / 2
          ball.dy = -ball.dy
          playSound("wall")
          createSparks(ball.x, ball.y, "#94a3b8", 6)
        }

        // Check PowerUp Collisions
        for (let pIdx = powerUpsRef.current.length - 1; pIdx >= 0; pIdx--) {
          const pu = powerUpsRef.current[pIdx]
          const dist = Math.hypot(ball.x - pu.x, ball.y - pu.y)
          if (dist < BALL_SIZE / 2 + pu.radius) {
            const hitter = ball.dx > 0 ? "p1" : "p2"
            applyPowerUp(hitter, pu.type)
            createSparks(pu.x, pu.y, pu.color, 16)
            powerUpsRef.current.splice(pIdx, 1)
          }
        }

        // Paddle 1 Collision (Left)
        if (
          ball.dx < 0 &&
          ball.x - BALL_SIZE / 2 <= p1.x + p1.width &&
          ball.x + BALL_SIZE / 2 >= p1.x &&
          ball.y >= p1.y &&
          ball.y <= p1.y + p1.height
        ) {
          ball.x = p1.x + p1.width + BALL_SIZE / 2
          const relativeIntersectY = ball.y - (p1.y + p1.height / 2)
          const normalizedIntersect = relativeIntersectY / (p1.height / 2)
          const bounceAngle = normalizedIntersect * (Math.PI / 3) // Max 60 deg angle

          ball.speed = Math.min(MAX_BALL_SPEED, ball.speed + 0.4)
          ball.dx = Math.cos(bounceAngle) * ball.speed
          ball.dy = Math.sin(bounceAngle) * ball.speed

          rallyRef.current += 1
          setRallyCount(rallyRef.current)
          if (rallyRef.current > maxRallyRef.current) {
            maxRallyRef.current = rallyRef.current
            setMaxRally(maxRallyRef.current)
          }
          if (ball.speed > maxSpeedRef.current) {
            maxSpeedRef.current = ball.speed
            setMaxBallSpeed(Math.round(maxSpeedRef.current))
          }

          playSound("paddle", ball.speed / INITIAL_BALL_SPEED)
          createSparks(ball.x, ball.y, themeColor, 12)
          screenShakeRef.current = 4
        }

        // Paddle 2 Collision (Right)
        if (
          ball.dx > 0 &&
          ball.x + BALL_SIZE / 2 >= p2.x &&
          ball.x - BALL_SIZE / 2 <= p2.x + p2.width &&
          ball.y >= p2.y &&
          ball.y <= p2.y + p2.height
        ) {
          ball.x = p2.x - BALL_SIZE / 2
          const relativeIntersectY = ball.y - (p2.y + p2.height / 2)
          const normalizedIntersect = relativeIntersectY / (p2.height / 2)
          const bounceAngle = normalizedIntersect * (Math.PI / 3)

          ball.speed = Math.min(MAX_BALL_SPEED, ball.speed + 0.4)
          ball.dx = -Math.cos(bounceAngle) * ball.speed
          ball.dy = Math.sin(bounceAngle) * ball.speed

          rallyRef.current += 1
          setRallyCount(rallyRef.current)
          if (rallyRef.current > maxRallyRef.current) {
            maxRallyRef.current = rallyRef.current
            setMaxRally(maxRallyRef.current)
          }
          if (ball.speed > maxSpeedRef.current) {
            maxSpeedRef.current = ball.speed
            setMaxBallSpeed(Math.round(maxSpeedRef.current))
          }

          playSound("paddle", ball.speed / INITIAL_BALL_SPEED)
          createSparks(ball.x, ball.y, "#a855f7", 12)
          screenShakeRef.current = 4
        }

        // Shield Collisions
        if (p1ShieldRef.current.active && ball.x <= p1ShieldRef.current.x + 8 && ball.dx < 0) {
          ball.dx = Math.abs(ball.dx)
          p1ShieldRef.current.active = false
          createSparks(ball.x, ball.y, "#3b82f6", 16)
          playSound("wall")
        }
        if (p2ShieldRef.current.active && ball.x >= p2ShieldRef.current.x - 8 && ball.dx > 0) {
          ball.dx = -Math.abs(ball.dx)
          p2ShieldRef.current.active = false
          createSparks(ball.x, ball.y, "#3b82f6", 16)
          playSound("wall")
        }

        // Goal Scoring Checks
        if (ball.x < 0) {
          // P2 Scores
          if (ballsRef.current.length === 1 || !ball.isExtra) {
            p2ScoreRef.current += 1
            setPlayer2Score(p2ScoreRef.current)
            createSparks(0, ball.y, "#ef4444", 24)
            screenShakeRef.current = 10
            playSound("score")

            if (p2ScoreRef.current >= targetScore) {
              setWinner("p2")
              setGameState("gameover")
              gameStateRef.current = "gameover"
              playSound(gameMode === "ai" ? "lose" : "win")
              return
            } else {
              startCountdown(true)
              return
            }
          }
        } else if (ball.x > CANVAS_WIDTH) {
          // P1 Scores
          if (ballsRef.current.length === 1 || !ball.isExtra) {
            p1ScoreRef.current += 1
            setPlayer1Score(p1ScoreRef.current)
            createSparks(CANVAS_WIDTH, ball.y, "#10b981", 24)
            screenShakeRef.current = 10
            playSound("score")

            // Update High Score
            if (p1ScoreRef.current > highScore) {
              setHighScore(p1ScoreRef.current)
              try {
                localStorage.setItem("pong_high_score", String(p1ScoreRef.current))
              } catch {
                // Ignore storage error
              }
            }

            if (p1ScoreRef.current >= targetScore) {
              setWinner("p1")
              setGameState("gameover")
              gameStateRef.current = "gameover"
              playSound("win")
              return
            } else {
              startCountdown(false)
              return
            }
          }
        } else {
          activeBalls.push(ball)
        }
      }

      ballsRef.current = activeBalls

      // Update Particles
      for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
        const p = particlesRef.current[pIdx]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay
        if (p.alpha <= 0) particlesRef.current.splice(pIdx, 1)
      }
    },
    [
      controlType,
      difficulty,
      gameMode,
      highScore,
      playSound,
      startCountdown,
      targetScore,
      themeColor,
      variant,
    ]
  )

  // Main Render Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()

    // Screen Shake Transform
    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current
      ctx.translate(shakeX, shakeY)
      screenShakeRef.current *= 0.85
      if (screenShakeRef.current < 0.2) screenShakeRef.current = 0
    }

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    bgGrad.addColorStop(0, "#0b0f19")
    bgGrad.addColorStop(1, "#111827")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Center Field Dashed Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)"
    ctx.lineWidth = 4
    ctx.setLineDash([12, 12])
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    // Center Circle Accent
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 70, 0, Math.PI * 2)
    ctx.stroke()

    // Draw Shields
    if (p1ShieldRef.current.active) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 4
      ctx.shadowColor = "#3b82f6"
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(p1ShieldRef.current.x, 0)
      ctx.lineTo(p1ShieldRef.current.x, CANVAS_HEIGHT)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    if (p2ShieldRef.current.active) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 4
      ctx.shadowColor = "#3b82f6"
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(p2ShieldRef.current.x, 0)
      ctx.lineTo(p2ShieldRef.current.x, CANVAS_HEIGHT)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Draw Paddles
    const p1 = p1Ref.current
    const p2 = p2Ref.current

    // Player 1 Paddle (Glow + Gradient)
    ctx.save()
    ctx.shadowColor = themeColor
    ctx.shadowBlur = 16
    const p1Grad = ctx.createLinearGradient(p1.x, p1.y, p1.x + p1.width, p1.y + p1.height)
    p1Grad.addColorStop(0, themeColor)
    p1Grad.addColorStop(1, "#60a5fa")
    ctx.fillStyle = p1.freezeTimer > 0 ? "#06b6d4" : p1Grad
    ctx.beginPath()
    ctx.roundRect(p1.x, p1.y, p1.width, p1.height, 6)
    ctx.fill()
    ctx.restore()

    // Player 2 Paddle
    ctx.save()
    ctx.shadowColor = "#a855f7"
    ctx.shadowBlur = 16
    const p2Grad = ctx.createLinearGradient(p2.x, p2.y, p2.x + p2.width, p2.y + p2.height)
    p2Grad.addColorStop(0, "#a855f7")
    p2Grad.addColorStop(1, "#c084fc")
    ctx.fillStyle = p2.freezeTimer > 0 ? "#06b6d4" : p2Grad
    ctx.beginPath()
    ctx.roundRect(p2.x, p2.y, p2.width, p2.height, 6)
    ctx.fill()
    ctx.restore()

    // Draw Power-Ups (Arcade Mode)
    powerUpsRef.current.forEach((pu) => {
      ctx.save()
      ctx.shadowColor = pu.color
      ctx.shadowBlur = 12
      ctx.fillStyle = pu.color
      ctx.beginPath()
      ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2)
      ctx.fill()

      // Inner Pulse
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(pu.x, pu.y, pu.radius * 0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Draw Balls
    ballsRef.current.forEach((ball) => {
      // Draw Trail
      ball.trail.forEach((t, idx) => {
        const alpha = (idx / ball.trail.length) * 0.4
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(t.x, t.y, (BALL_SIZE / 2) * (idx / ball.trail.length), 0, Math.PI * 2)
        ctx.fill()
      })

      // Main Ball
      ctx.save()
      ctx.shadowColor = ball.color
      ctx.shadowBlur = 14
      ctx.fillStyle = ball.color
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Draw Particles
    particlesRef.current.forEach((p) => {
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0

    // Draw In-Game Score HUD on Canvas
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)"
    ctx.font = "700 48px Inter, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(String(p1ScoreRef.current), CANVAS_WIDTH / 4, 65)
    ctx.fillText(String(p2ScoreRef.current), (3 * CANVAS_WIDTH) / 4, 65)

    ctx.restore()
  }, [themeColor])

  // Game Loop Tick
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaMs = Math.min(32, timestamp - lastTimeRef.current)
      lastTimeRef.current = timestamp

      updatePhysics(deltaMs)
      draw()

      animFrameRef.current = requestAnimationFrame(gameLoop)
    },
    [draw, updatePhysics]
  )

  // Start Main Loop on Mount
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [gameLoop])

  // Mouse Move Listener
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlType !== "mouse") return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePosRef.current = (e.clientY - rect.top) * scaleY
  }

  // Touch Move Listener
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || e.touches.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePosRef.current = (e.touches[0].clientY - rect.top) * scaleY
  }

  // Key Down & Key Up Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true

      // Space toggle pause
      if (e.key === " " && (gameStateRef.current === "playing" || gameStateRef.current === "paused")) {
        e.preventDefault()
        setGameState((prev) => {
          const next = prev === "playing" ? "paused" : "playing"
          gameStateRef.current = next
          return next
        })
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl w-full flex flex-col gap-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl shadow-lg">
          <Button onClick={onBack} variant="ghost" size="sm" className="hover:bg-slate-800 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <CircleDot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Cyber Pong
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{gameMode === "ai" ? `vs AI (${difficulty})` : "2 Player Local"}</span>
                <span>&bull;</span>
                <span>{variant === "arcade" ? "Arcade Power-Ups" : "Classic Mode"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="outline"
              size="icon"
              className="border-slate-700 bg-slate-800/50 hover:bg-slate-800"
              title={soundEnabled ? "Mute Audio" : "Enable Audio"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </Button>

            {gameState !== "menu" && (
              <Button
                onClick={resetGame}
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800/50 hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* HUD Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Flame className="w-4 h-4 text-amber-500" /> Current Rally</span>
            <span className="font-bold text-slate-100">{rallyCount}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-yellow-400" /> Max Rally</span>
            <span className="font-bold text-yellow-400">{maxRally}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Gauge className="w-4 h-4 text-pink-500" /> Ball Speed</span>
            <span className="font-bold text-pink-400">{maxBallSpeed} px/f</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Zap className="w-4 h-4 text-emerald-400" /> High Score</span>
            <span className="font-bold text-emerald-400">{highScore}</span>
          </div>
        </div>

        {/* Active Power-Ups Banner (Arcade Mode) */}
        {variant === "arcade" && (p1ActivePowerUp || p2ActivePowerUp) && (
          <div className="flex justify-between items-center px-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">P1 Power-Up:</span>
              {p1ActivePowerUp ? <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{p1ActivePowerUp}</span> : <span className="text-slate-500">None</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">P2 Power-Up:</span>
              {p2ActivePowerUp ? <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{p2ActivePowerUp}</span> : <span className="text-slate-500">None</span>}
            </div>
          </div>
        )}

        {/* Main Canvas Viewport Container */}
        <Card className="relative p-2 bg-slate-900 border-slate-800 overflow-hidden rounded-xl shadow-2xl">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="w-full h-auto aspect-[16/10] block rounded-lg cursor-crosshair border border-slate-800/80"
          />

          {/* MENU OVERLAY */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-6 text-center z-20">
              <div className="max-w-md my-auto w-full space-y-6">
                <div>
                  <h2 className="text-3xl font-black tracking-wider uppercase text-white mb-1">Select Game Mode</h2>
                  <p className="text-sm text-slate-400">Customise your match settings and start playing.</p>
                </div>

                {/* Game Mode Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opponent</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setGameMode("ai")}
                      variant={gameMode === "ai" ? "default" : "outline"}
                      className={gameMode === "ai" ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-slate-800 text-slate-300"}
                    >
                      <Bot className="w-4 h-4 mr-2" /> vs AI
                    </Button>
                    <Button
                      onClick={() => setGameMode("pvp")}
                      variant={gameMode === "pvp" ? "default" : "outline"}
                      className={gameMode === "pvp" ? "bg-purple-600 hover:bg-purple-500 text-white" : "border-slate-800 text-slate-300"}
                    >
                      <Users className="w-4 h-4 mr-2" /> 2 Player Local
                    </Button>
                  </div>
                </div>

                {/* AI Difficulty Selector */}
                {gameMode === "ai" && (
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Difficulty</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["easy", "medium", "hard", "impossible"] as Difficulty[]).map((d) => (
                        <Button
                          key={d}
                          size="sm"
                          onClick={() => setDifficulty(d)}
                          variant={difficulty === d ? "default" : "outline"}
                          className={
                            difficulty === d
                              ? "bg-blue-600 hover:bg-blue-500 capitalize text-xs"
                              : "border-slate-800 text-slate-400 capitalize text-xs"
                          }
                        >
                          {d}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Game Variant Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Game Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setVariant("classic")}
                      variant={variant === "classic" ? "default" : "outline"}
                      className={variant === "classic" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "border-slate-800 text-slate-300"}
                    >
                      <Swords className="w-4 h-4 mr-2" /> Classic
                    </Button>
                    <Button
                      onClick={() => setVariant("arcade")}
                      variant={variant === "arcade" ? "default" : "outline"}
                      className={variant === "arcade" ? "bg-amber-600 hover:bg-amber-500 text-white" : "border-slate-800 text-slate-300"}
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> Arcade Power-Ups
                    </Button>
                  </div>
                </div>

                {/* Control Type Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">P1 Control Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setControlType("keyboard")}
                      variant={controlType === "keyboard" ? "default" : "outline"}
                      className={controlType === "keyboard" ? "bg-slate-700 text-white" : "border-slate-800 text-slate-300"}
                    >
                      <Keyboard className="w-4 h-4 mr-2" /> Keyboard (W/S)
                    </Button>
                    <Button
                      onClick={() => setControlType("mouse")}
                      variant={controlType === "mouse" ? "default" : "outline"}
                      className={controlType === "mouse" ? "bg-slate-700 text-white" : "border-slate-800 text-slate-300"}
                    >
                      <MousePointer className="w-4 h-4 mr-2" /> Mouse / Touch
                    </Button>
                  </div>
                </div>

                {/* Target Score Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Score</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 7, 10, 15].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        onClick={() => setTargetScore(s)}
                        variant={targetScore === s ? "default" : "outline"}
                        className={targetScore === s ? "bg-blue-600 text-white" : "border-slate-800 text-slate-400"}
                      >
                        {s} PTS
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={resetGame}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold tracking-wider uppercase text-base shadow-lg py-6"
                >
                  <Play className="w-5 h-5 mr-2 fill-white" /> Start Match
                </Button>
              </div>
            </div>
          )}

          {/* COUNTDOWN OVERLAY */}
          {gameState === "countdown" && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-start overflow-y-auto text-center z-20">
              <div className="text-7xl font-black text-white animate-bounce drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                {countdown > 0 ? countdown : "GO!"}
              </div>
              <p className="text-sm text-slate-300 mt-4">Get Ready!</p>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {gameState === "paused" && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto text-center z-20 space-y-4">
              <h3 className="text-3xl font-black text-white uppercase tracking-wider">Game Paused</h3>
              <p className="text-sm text-slate-400">Press Space or click Resume to continue.</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setGameState("playing")
                    gameStateRef.current = "playing"
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Play className="w-4 h-4 mr-2" /> Resume
                </Button>
                <Button
                  onClick={() => {
                    setGameState("menu")
                    gameStateRef.current = "menu"
                  }}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  Main Menu
                </Button>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-6 text-center z-20 space-y-6">
              <div>
                <div className="inline-flex p-3 rounded-full bg-yellow-500/10 text-yellow-400 mb-3 border border-yellow-500/20">
                  <Trophy className="w-8 h-8" />
                </div>
                <h2 className="text-4xl font-black uppercase text-white tracking-wider">
                  {winner === "p1" ? (gameMode === "ai" ? "Victory!" : "Player 1 Wins!") : (gameMode === "ai" ? "Defeat!" : "Player 2 Wins!")}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Final Score: <span className="text-blue-400 font-bold">{player1Score}</span> - <span className="text-purple-400 font-bold">{player2Score}</span>
                </p>
              </div>

              {/* Match Stats Table */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl w-full max-w-sm my-auto grid grid-cols-2 gap-3 text-xs text-left">
                <div>
                  <span className="text-slate-500">Longest Rally</span>
                  <p className="text-base font-bold text-yellow-400">{maxRally} hits</p>
                </div>
                <div>
                  <span className="text-slate-500">Max Ball Speed</span>
                  <p className="text-base font-bold text-pink-400">{maxBallSpeed} px/f</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Score</span>
                  <p className="text-base font-bold text-slate-200">{targetScore} PTS</p>
                </div>
                <div>
                  <span className="text-slate-500">Game Mode</span>
                  <p className="text-base font-bold text-blue-400 capitalize">{gameMode === "ai" ? `vs AI (${difficulty})` : "2 Player"}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full max-w-sm my-auto">
                <Button
                  onClick={resetGame}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-5"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Rematch
                </Button>
                <Button
                  onClick={() => {
                    setGameState("menu")
                    gameStateRef.current = "menu"
                  }}
                  variant="outline"
                  className="border-slate-700 text-slate-300 py-5"
                >
                  Main Menu
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Footer Controls & Instructions */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-300">P1 Controls:</span>
            <span>W / S Keys (or Mouse Drag)</span>
          </div>
          {gameMode === "pvp" && (
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-300">P2 Controls:</span>
              <span>Up / Down Arrow Keys</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-300">Pause Game:</span>
            <span>Spacebar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
