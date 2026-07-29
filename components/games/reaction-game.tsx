"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Timer,
  Zap,
  Trophy,
  Target,
  TrendingUp,
  RotateCcw,
  Volume2,
  VolumeX,
  Brain,
  Radio,
  Activity,
  Flame,
  Award,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export type GameMode = "classic" | "target" | "stroop" | "auditory"
export type Difficulty = "easy" | "medium" | "hard" | "insane"

interface ReactionGameProps {
  onBack?: () => void
  themeColor?: string
}

interface AttemptRecord {
  id: string
  mode: GameMode
  difficulty: Difficulty
  time: number
  timestamp: number
  accuracy?: number
}

const STROOP_COLORS = [
  { name: "RED", hex: "#ef4444", textClass: "text-red-500", bgClass: "bg-red-500" },
  { name: "BLUE", hex: "#3b82f6", textClass: "text-blue-500", bgClass: "bg-blue-500" },
  { name: "GREEN", hex: "#10b981", textClass: "text-green-500", bgClass: "bg-green-500" },
  { name: "YELLOW", hex: "#eab308", textClass: "text-yellow-500", bgClass: "bg-yellow-500" },
  { name: "PURPLE", hex: "#a855f7", textClass: "text-purple-500", bgClass: "bg-purple-500" },
]

// Web Audio Synthesizer
class SoundEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  constructor() {
    // Lazy init
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted
  }

  public isMuted() {
    return this.muted
  }

  public playTick() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(440, this.ctx.currentTime)
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.08)
  }

  public playGo() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(880, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.15)
  }

  public playAudioCue() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(600, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.2)
  }

  public playError() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(150, this.ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.25)

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.25)
  }

  public playSuccess() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08) // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16) // G5

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(now + 0.3)
  }

  public playFanfare() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, now + i * 0.08)

      gain.gain.setValueAtTime(0.15, now + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.2)
    })
  }
}

const audioEngine = new SoundEngine()

export default function ReactionGame({ onBack }: ReactionGameProps) {
  // Game Configuration
  const [mode, setMode] = useState<GameMode>("classic")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // State Management
  const [gameState, setGameState] = useState<"waiting" | "ready" | "fakeout" | "go" | "clicked" | "too-early">("waiting")
  const [startTime, setStartTime] = useState<number>(0)
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])
  const [highScores, setHighScores] = useState<Record<string, number>>({})

  // Target Grid State
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [targetHitCount, setTargetHitCount] = useState<number>(0)
  const [targetTimes, setTargetTimes] = useState<number[]>([])

  // Stroop State
  const [stroopWord, setStroopWord] = useState<{ text: string; colorHex: string; colorName: string }>({
    text: "RED",
    colorHex: "#ef4444",
    colorName: "RED",
  })
  const [stroopRound, setStroopRound] = useState<number>(0)
  const [stroopScore, setStroopScore] = useState<number>(0)
  const [stroopTimes, setStroopTimes] = useState<number[]>([])

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Audio Toggle
  const toggleAudio = () => {
    const next = !isMuted
    setIsMuted(next)
    audioEngine.setMuted(next)
  }

  // Load High Scores from Storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("reaction_game_stats_v2")
      if (saved) {
        setHighScores(JSON.parse(saved))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Particle Effects System
  const triggerParticles = useCallback((color = "#10b981", count = 35) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.parentElement?.clientWidth || 800
    canvas.height = canvas.parentElement?.clientHeight || 400

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      alpha: number
      decay: number
    }> = []

    const originX = canvas.width / 2
    const originY = canvas.height / 2

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 8 + 2
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
      })
    }

    let animId: number
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false

      particles.forEach((p) => {
        if (p.alpha > 0) {
          alive = true
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.15 // Gravity
          p.alpha -= p.decay

          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })

      if (alive) {
        animId = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animId = requestAnimationFrame(render)
  }, [])

  // Helper stats
  const getDifficultyDelay = useCallback(() => {
    switch (difficulty) {
      case "easy":
        return Math.random() * 2500 + 2000 // 2.0 - 4.5s
      case "medium":
        return Math.random() * 2500 + 1500 // 1.5 - 4.0s
      case "hard":
        return Math.random() * 2000 + 1000 // 1.0 - 3.0s
      case "insane":
        return Math.random() * 1700 + 800 // 0.8 - 2.5s
    }
  }, [difficulty])

  // Save Best Score
  const updateHighScore = useCallback(
    (key: string, val: number) => {
      setHighScores((prev) => {
        const currentBest = prev[key]
        if (!currentBest || val < currentBest) {
          const updated = { ...prev, [key]: val }
          try {
            localStorage.setItem("reaction_game_stats_v2", JSON.stringify(updated))
          } catch {
            // Ignore
          }
          audioEngine.playFanfare()
          triggerParticles("#f59e0b", 50)
          return updated
        }
        return prev
      })
    },
    [triggerParticles]
  )

  // Reset current attempt state
  const resetGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setGameState("waiting")
    setStartTime(0)
    setTargetIndex(null)
    setTargetHitCount(0)
    setTargetTimes([])
    setStroopRound(0)
    setStroopScore(0)
    setStroopTimes([])
  }, [])

  // Start Signal/Auditory Game
  const startSignalGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setGameState("ready")
    audioEngine.playTick()

    const delay = getDifficultyDelay()

    // Handle fakeout on Hard / Insane
    const allowFakeout = (difficulty === "hard" || difficulty === "insane") && Math.random() < 0.35

    if (allowFakeout) {
      const fakeoutTime = delay * 0.5
      timerRef.current = setTimeout(() => {
        setGameState("fakeout")
        audioEngine.playTick()
        timerRef.current = setTimeout(() => {
          setGameState("ready")
          timerRef.current = setTimeout(() => {
            setGameState("go")
            setStartTime(Date.now())
            if (mode === "auditory") audioEngine.playAudioCue()
            else audioEngine.playGo()
          }, delay * 0.5)
        }, 350)
      }, fakeoutTime)
    } else {
      timerRef.current = setTimeout(() => {
        setGameState("go")
        setStartTime(Date.now())
        if (mode === "auditory") audioEngine.playAudioCue()
        else audioEngine.playGo()
      }, delay)
    }
  }, [difficulty, getDifficultyDelay, mode])

  // Target Grid Spawner
  const spawnNextTarget = useCallback((currentHitCount: number, times: number[]) => {
    if (currentHitCount >= 10) {
      // Completed 10 targets
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      setLastReactionTime(avg)
      setGameState("clicked")
      audioEngine.playSuccess()
      triggerParticles("#10b981", 40)

      const key = `target_${difficulty}`
      updateHighScore(key, avg)

      const newRecord: AttemptRecord = {
        id: Math.random().toString(36).substring(2, 9),
        mode: "target",
        difficulty,
        time: avg,
        timestamp: Date.now(),
      }
      setAttempts((prev) => [newRecord, ...prev])
      return
    }

    const nextCell = Math.floor(Math.random() * 16)
    setTargetIndex(nextCell)
    setStartTime(Date.now())
  }, [difficulty, updateHighScore, triggerParticles])

  // Start Target Game
  const startTargetGame = useCallback(() => {
    setGameState("go")
    setTargetHitCount(0)
    setTargetTimes([])
    audioEngine.playGo()
    spawnNextTarget(0, [])
  }, [spawnNextTarget])

  // Target Cell Click
  const handleTargetClick = useCallback(
    (index: number) => {
      if (gameState !== "go" || targetIndex !== index) return

      const reactTime = Date.now() - startTime
      audioEngine.playSuccess()

      const newTimes = [...targetTimes, reactTime]
      const newHitCount = targetHitCount + 1

      setTargetTimes(newTimes)
      setTargetHitCount(newHitCount)
      spawnNextTarget(newHitCount, newTimes)
    },
    [gameState, targetIndex, startTime, targetTimes, targetHitCount, spawnNextTarget]
  )

  // Generate Stroop Challenge
  const generateStroopChallenge = useCallback(() => {
    const textObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    let colorObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]

    // 50% chance match vs mismatch
    if (Math.random() < 0.5) {
      colorObj = textObj
    }

    setStroopWord({
      text: textObj.name,
      colorHex: colorObj.hex,
      colorName: colorObj.name,
    })
    setStartTime(Date.now())
  }, [])

  // Start Stroop Game
  const startStroopGame = useCallback(() => {
    setGameState("go")
    setStroopRound(1)
    setStroopScore(0)
    setStroopTimes([])
    audioEngine.playGo()
    generateStroopChallenge()
  }, [generateStroopChallenge])

  // Handle Stroop Option Click
  const handleStroopAnswer = useCallback(
    (isMatchingChoice: boolean) => {
      if (gameState !== "go") return

      const reactTime = Date.now() - startTime
      const isActualMatch = stroopWord.text === stroopWord.colorName
      const correct = isMatchingChoice === isActualMatch

      let newScore = stroopScore
      if (correct) {
        audioEngine.playSuccess()
        newScore += 1
      } else {
        audioEngine.playError()
      }

      const newTimes = [...stroopTimes, reactTime]
      const nextRound = stroopRound + 1

      setStroopScore(newScore)
      setStroopTimes(newTimes)

      if (nextRound > 10) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length)
        const adjustedScoreTime = correct ? avg : avg + (10 - newScore) * 150 // Penalty for errors
        setLastReactionTime(adjustedScoreTime)
        setGameState("clicked")

        const key = `stroop_${difficulty}`
        updateHighScore(key, adjustedScoreTime)

        const newRecord: AttemptRecord = {
          id: Math.random().toString(36).substring(2, 9),
          mode: "stroop",
          difficulty,
          time: adjustedScoreTime,
          accuracy: Math.round((newScore / 10) * 100),
          timestamp: Date.now(),
        }
        setAttempts((prev) => [newRecord, ...prev])
      } else {
        setStroopRound(nextRound)
        generateStroopChallenge()
      }
    },
    [gameState, startTime, stroopWord, stroopScore, stroopTimes, stroopRound, difficulty, updateHighScore, generateStroopChallenge]
  )

  // Main Action Click (for Signal & Auditory)
  const handleMainAreaClick = useCallback(() => {
    if (mode === "target" || mode === "stroop") return

    if (gameState === "waiting") {
      startSignalGame()
    } else if (gameState === "ready" || gameState === "fakeout") {
      // False start!
      if (timerRef.current) clearTimeout(timerRef.current)
      setGameState("too-early")
      audioEngine.playError()
    } else if (gameState === "go") {
      const reactTime = Date.now() - startTime
      setLastReactionTime(reactTime)

      // Sub 100ms is considered pre-fit/cheat false start in pro athletic testing
      if (reactTime < 100) {
        setGameState("too-early")
        audioEngine.playError()
        return
      }

      setGameState("clicked")
      audioEngine.playSuccess()
      triggerParticles("#10b981", 30)

      const key = `${mode}_${difficulty}`
      updateHighScore(key, reactTime)

      const newRecord: AttemptRecord = {
        id: Math.random().toString(36).substring(2, 9),
        mode,
        difficulty,
        time: reactTime,
        timestamp: Date.now(),
      }
      setAttempts((prev) => [newRecord, ...prev])
    } else if (gameState === "clicked" || gameState === "too-early") {
      resetGame()
    }
  }, [mode, gameState, startSignalGame, startTime, triggerParticles, difficulty, updateHighScore, resetGame])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        if (mode === "classic" || mode === "auditory") {
          handleMainAreaClick()
        }
      }
      if (mode === "stroop" && gameState === "go") {
        if (e.code === "KeyM" || e.code === "Digit1" || e.code === "Numpad1") {
          handleStroopAnswer(true) // MATCH
        } else if (e.code === "KeyD" || e.code === "Digit2" || e.code === "Numpad2") {
          handleStroopAnswer(false) // MISMATCH
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mode, gameState, handleMainAreaClick, handleStroopAnswer])

  // Compute Statistics
  const getFilteredAttempts = useCallback(() => {
    return attempts.filter((a) => a.mode === mode && a.difficulty === difficulty)
  }, [attempts, mode, difficulty])

  const filteredAttempts = getFilteredAttempts()
  const bestScore = highScores[`${mode}_${difficulty}`] || null

  const getAverage = useCallback(() => {
    if (filteredAttempts.length === 0) return null
    const sum = filteredAttempts.reduce((acc, curr) => acc + curr.time, 0)
    return Math.round(sum / filteredAttempts.length)
  }, [filteredAttempts])

  const getStandardDeviation = useCallback(() => {
    if (filteredAttempts.length < 2) return null
    const avg = filteredAttempts.reduce((acc, curr) => acc + curr.time, 0) / filteredAttempts.length
    const squareDiffs = filteredAttempts.map((a) => Math.pow(a.time - avg, 2))
    const avgSquareDiff = squareDiffs.reduce((acc, curr) => acc + curr, 0) / squareDiffs.length
    return Math.round(Math.sqrt(avgSquareDiff))
  }, [filteredAttempts])

  // Rating & Percentiles
  const getRating = (timeMs: number | null) => {
    if (!timeMs) return { label: "No Record Yet", color: "text-gray-400", percentile: "N/A" }
    if (timeMs < 180) return { label: "Lightning God! ⚡", color: "text-emerald-400", percentile: "Top 1%" }
    if (timeMs < 215) return { label: "Reflex Master 🎯", color: "text-cyan-400", percentile: "Top 5%" }
    if (timeMs < 250) return { label: "Pro Athlete 🔥", color: "text-blue-400", percentile: "Top 15%" }
    if (timeMs < 300) return { label: "Above Average 👍", color: "text-amber-400", percentile: "Top 35%" }
    if (timeMs < 380) return { label: "Casual Gamer 📊", color: "text-purple-400", percentile: "Top 60%" }
    return { label: "Warmup Needed 🐢", color: "text-rose-400", percentile: "Top 85%" }
  }

  const currentRating = getRating(lastReactionTime)
  const avgTime = getAverage()
  const stdDev = getStandardDeviation()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Particle Overlay Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-30" />

      <div className="max-w-4xl w-full z-10 space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl"
            >
              ← Back
            </Button>
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                REFLEX LAB
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleAudio}
              variant="outline"
              size="icon"
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </Button>
            <Button
              onClick={() => {
                setAttempts([])
                setLastReactionTime(null)
                resetGame()
              }}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Stats
            </Button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => {
              setMode("classic")
              resetGame()
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              mode === "classic"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>Classic Signal</span>
          </button>

          <button
            onClick={() => {
              setMode("target")
              resetGame()
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              mode === "target"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Target Matrix</span>
          </button>

          <button
            onClick={() => {
              setMode("stroop")
              resetGame()
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              mode === "stroop"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Stroop Match</span>
          </button>

          <button
            onClick={() => {
              setMode("auditory")
              resetGame()
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              mode === "auditory"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Auditory Cue</span>
          </button>
        </div>

        {/* Difficulty Selector Bar */}
        <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs sm:text-sm">
          <span className="text-slate-400 font-semibold px-2 flex items-center">
            <Flame className="w-4 h-4 mr-1.5 text-amber-400" />
            Difficulty:
          </span>
          <div className="flex space-x-1.5">
            {(["easy", "medium", "hard", "insane"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d)
                  resetGame()
                }}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                  difficulty === d
                    ? d === "easy"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : d === "medium"
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : d === "hard"
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-rose-500 text-slate-950 font-bold shadow-lg shadow-rose-500/20 animate-pulse"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN GAME DISPLAY CANVAS / PLAY AREA */}
        <Card className="border-0 bg-slate-900/90 shadow-2xl overflow-hidden rounded-3xl relative">
          {/* Classic Signal / Auditory Play Area */}
          {(mode === "classic" || mode === "auditory") && (
            <div
              onClick={handleMainAreaClick}
              className={`h-96 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 relative p-6 text-center ${
                gameState === "waiting"
                  ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 hover:bg-indigo-900/40"
                  : gameState === "ready"
                    ? "bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950"
                    : gameState === "fakeout"
                      ? "bg-gradient-to-br from-amber-950 via-amber-900 to-slate-950"
                      : gameState === "go"
                        ? "bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 animate-pulse"
                        : gameState === "too-early"
                          ? "bg-gradient-to-br from-rose-900 via-red-950 to-slate-950"
                          : "bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950"
              }`}
            >
              {/* Dynamic UI Content depending on State */}
              {gameState === "waiting" && (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
                    {mode === "classic" ? <Timer className="w-10 h-10" /> : <Radio className="w-10 h-10" />}
                  </div>
                  <h2 className="text-3xl font-extrabold text-white">Click or Press Space to Start</h2>
                  <p className="text-slate-400 max-w-sm mx-auto text-sm">
                    {mode === "classic"
                      ? "Wait for the screen to turn GREEN, then tap as quickly as possible!"
                      : "Listen closely! Tap immediately when you hear the acoustic audio chime."}
                  </p>
                  {(difficulty === "hard" || difficulty === "insane") && (
                    <span className="inline-flex items-center text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Watch out for false amber flashes!
                    </span>
                  )}
                </div>
              )}

              {gameState === "ready" && (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 animate-ping">
                    <Activity className="w-8 h-8" />
                  </div>
                  <h2 className="text-4xl font-black text-rose-200 tracking-wider">WAIT FOR SIGNAL...</h2>
                  <p className="text-rose-300/80 text-sm">Do not click yet!</p>
                </div>
              )}

              {gameState === "fakeout" && (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h2 className="text-4xl font-black text-amber-300 tracking-wider">HOLD... FALSE ALARM!</h2>
                  <p className="text-amber-200/80 text-sm">Don't fall for distractors!</p>
                </div>
              )}

              {gameState === "go" && (
                <div className="space-y-3">
                  <h2 className="text-6xl font-black text-slate-950 tracking-tighter drop-shadow-md">CLICK NOW!</h2>
                  <p className="text-slate-900 font-bold text-lg">FAST AS YOU CAN!</p>
                </div>
              )}

              {gameState === "too-early" && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-rose-300">Too Early!</h2>
                  <p className="text-slate-400 text-sm">You jumped the gun. Click anywhere to try again.</p>
                </div>
              )}

              {gameState === "clicked" && (
                <div className="space-y-4">
                  <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-tight">
                    {lastReactionTime} <span className="text-3xl text-slate-400 font-medium">ms</span>
                  </div>

                  <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                    <span className={currentRating.color}>{currentRating.label}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{currentRating.percentile}</span>
                  </div>

                  <p className="text-slate-400 text-xs pt-2">Click anywhere or press Space to test again</p>
                </div>
              )}
            </div>
          )}

          {/* Target Matrix Play Area */}
          {mode === "target" && (
            <div className="h-96 flex flex-col items-center justify-center p-6 text-center bg-slate-950 relative">
              {gameState !== "go" ? (
                <div className="space-y-4">
                  {gameState === "clicked" && lastReactionTime ? (
                    <div className="space-y-2">
                      <div className="text-5xl font-black text-emerald-400">{lastReactionTime} ms</div>
                      <p className="text-slate-400 text-sm">10-Target Average Hit Speed</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white">Target Matrix Reflex</h2>
                      <p className="text-slate-400 text-sm max-w-md">
                        10 targets will light up one by one in the grid. Tap each glowing cell as quickly as possible!
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={startTargetGame}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg px-8 py-6 rounded-2xl shadow-lg shadow-emerald-500/20"
                  >
                    {gameState === "clicked" ? "Play Again" : "Start Grid Test"}
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-sm space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 px-1">
                    <span>Progress: {targetHitCount} / 10 Targets</span>
                    <span>
                      Avg:{" "}
                      {targetTimes.length > 0
                        ? `${Math.round(targetTimes.reduce((a, b) => a + b, 0) / targetTimes.length)} ms`
                        : "--"}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTargetClick(idx)}
                        className={`h-16 sm:h-20 rounded-2xl transition-all duration-100 flex items-center justify-center border ${
                          targetIndex === idx
                            ? "bg-emerald-400 border-emerald-300 shadow-xl shadow-emerald-500/40 scale-105 animate-pulse"
                            : "bg-slate-900 border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        {targetIndex === idx && <Target className="w-8 h-8 text-slate-950 animate-spin" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stroop Match Play Area */}
          {mode === "stroop" && (
            <div className="h-96 flex flex-col items-center justify-center p-6 text-center bg-slate-950 relative">
              {gameState !== "go" ? (
                <div className="space-y-4">
                  {gameState === "clicked" && lastReactionTime ? (
                    <div className="space-y-2">
                      <div className="text-5xl font-black text-purple-400">{lastReactionTime} ms</div>
                      <p className="text-slate-400 text-sm">
                        10-Round Cognitive Speed (Accuracy: {attempts[0]?.accuracy || 100}%)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white">Stroop Cognitive Challenge</h2>
                      <p className="text-slate-400 text-sm max-w-md">
                        Does the <span className="font-bold text-slate-200">word text</span> match the physical{" "}
                        <span className="font-bold text-slate-200">ink color</span>? Click MATCH or MISMATCH as fast as you can.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={startStroopGame}
                    className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-lg px-8 py-6 rounded-2xl shadow-lg shadow-purple-500/20"
                  >
                    {gameState === "clicked" ? "Play Again" : "Start Cognitive Test"}
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-6">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Round {stroopRound} / 10</span>
                    <span>Score: {stroopScore} Correct</span>
                  </div>

                  {/* Word Box */}
                  <div className="h-32 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-inner">
                    <span
                      className="text-5xl font-black tracking-wider"
                      style={{ color: stroopWord.colorHex }}
                    >
                      {stroopWord.text}
                    </span>
                  </div>

                  {/* Decision Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleStroopAnswer(true)}
                      className="py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all hover:scale-105"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>MATCH [1]</span>
                    </button>

                    <button
                      onClick={() => handleStroopAnswer(false)}
                      className="py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all hover:scale-105"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>MISMATCH [2]</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* METRICS & STATISTICS PANEL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900/60 border-slate-800 rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center text-amber-400 text-xs font-semibold space-x-1">
              <Trophy className="w-4 h-4" />
              <span>Personal Best</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {bestScore ? `${bestScore}ms` : "--"}
            </div>
            <div className="text-[10px] text-slate-500 capitalize">{mode} ({difficulty})</div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center text-cyan-400 text-xs font-semibold space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Average</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {avgTime ? `${avgTime}ms` : "--"}
            </div>
            <div className="text-[10px] text-slate-500">
              Across {filteredAttempts.length} trials
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center text-indigo-400 text-xs font-semibold space-x-1">
              <BarChart3 className="w-4 h-4" />
              <span>Consistency</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stdDev !== null ? `±${stdDev}ms` : "--"}
            </div>
            <div className="text-[10px] text-slate-500">Standard Deviation</div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center text-emerald-400 text-xs font-semibold space-x-1">
              <Award className="w-4 h-4" />
              <span>Percentile</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
              {currentRating.percentile}
            </div>
            <div className="text-[10px] text-slate-500">Human Benchmark</div>
          </Card>
        </div>

        {/* RESPONSE TIME DISTRIBUTION SVG GRAPH */}
        {filteredAttempts.length > 1 && (
          <Card className="p-5 bg-slate-900/60 border-slate-800 rounded-3xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Response Time Trend</span>
              </span>
              <span>Recent {Math.min(filteredAttempts.length, 12)} Attempts</span>
            </div>

            <div className="h-32 w-full pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                {(() => {
                  const recent = filteredAttempts.slice(0, 12).reverse()
                  const times = recent.map((r) => r.time)
                  const min = Math.min(...times) * 0.85
                  const max = Math.max(...times) * 1.15
                  const points = times.map((t, idx) => {
                    const x = (idx / (times.length - 1)) * 380 + 10
                    const y = 90 - ((t - min) / (max - min || 1)) * 80
                    return `${x},${y}`
                  })
                  const pathData = `M ${points.join(" L ")}`

                  return (
                    <>
                      {/* Grid Lines */}
                      <line x1="0" y1="10" x2="400" y2="10" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                      <line x1="0" y1="50" x2="400" y2="50" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                      <line x1="0" y1="90" x2="400" y2="90" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />

                      {/* Area Glow */}
                      <path
                        d={`${pathData} L ${points[points.length - 1].split(",")[0]},90 L 10,90 Z`}
                        fill="url(#trendGradient)"
                        opacity="0.25"
                      />

                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Line */}
                      <path d={pathData} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />

                      {/* Point Dots */}
                      {times.map((t, idx) => {
                        const x = (idx / (times.length - 1)) * 380 + 10
                        const y = 90 - ((t - min) / (max - min || 1)) * 80
                        return (
                          <g key={idx}>
                            <circle cx={x} cy={y} r="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
                          </g>
                        )
                      })}
                    </>
                  )
                })()}
              </svg>
            </div>
          </Card>
        )}

        {/* Benchmark Info Footer */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/80">
          <p>Human Benchmark Average: Visual ~250ms • Auditory ~170ms • Touch Latency +15ms</p>
        </div>
      </div>
    </div>
  )
}
