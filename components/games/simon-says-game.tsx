"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, Play, RotateCcw, Volume2, VolumeX, Zap, Clock, Flame, 
  Trophy, ShieldAlert, Shuffle, Music, Award, Sparkles, Key, Layers,
  Compass, Repeat, Disc, Binary, Cpu
} from "lucide-react"

interface SimonSaysGameProps {
  onBack: () => void
  themeColor: string
}

type GameState = "menu" | "difficulty" | "showing" | "waiting" | "game-over" | "achievements"
type GameMode = "classic" | "reverse" | "chaos" | "speed" | "tone"
type Difficulty = "beginner" | "standard" | "pro" | "insane"
type PatternStyle = "random" | "fibonacci" | "polyrhythm" | "knighthop" | "arpeggio" | "asymmetric"

interface PadConfig {
  id: number
  colorName: string
  label: string
  keyHint: string
  freq: number
  bgGradient: string
  glowColor: string
  activeColor: string
  borderColor: string
}

const PADS_4: PadConfig[] = [
  { id: 0, colorName: "Red", label: "Q / 1", keyHint: "1", freq: 261.63, bgGradient: "from-red-500/80 to-rose-600/80", glowColor: "rgba(244, 63, 94, 0.6)", activeColor: "bg-red-400", borderColor: "border-red-400/50" },
  { id: 1, colorName: "Blue", label: "W / 2", keyHint: "2", freq: 329.63, bgGradient: "from-blue-500/80 to-indigo-600/80", glowColor: "rgba(59, 130, 246, 0.6)", activeColor: "bg-blue-400", borderColor: "border-blue-400/50" },
  { id: 2, colorName: "Green", label: "A / 3", keyHint: "3", freq: 392.00, bgGradient: "from-emerald-500/80 to-green-600/80", glowColor: "rgba(16, 185, 129, 0.6)", activeColor: "bg-emerald-400", borderColor: "border-emerald-400/50" },
  { id: 3, colorName: "Yellow", label: "S / 4", keyHint: "4", freq: 523.25, bgGradient: "from-amber-400/80 to-yellow-500/80", glowColor: "rgba(245, 158, 11, 0.6)", activeColor: "bg-amber-300", borderColor: "border-amber-400/50" },
]

const PADS_6: PadConfig[] = [
  ...PADS_4,
  { id: 4, colorName: "Purple", label: "5", keyHint: "5", freq: 440.00, bgGradient: "from-purple-500/80 to-fuchsia-600/80", glowColor: "rgba(168, 85, 247, 0.6)", activeColor: "bg-purple-400", borderColor: "border-purple-400/50" },
  { id: 5, colorName: "Cyan", label: "6", keyHint: "6", freq: 587.33, bgGradient: "from-cyan-400/80 to-teal-500/80", glowColor: "rgba(6, 182, 212, 0.6)", activeColor: "bg-cyan-300", borderColor: "border-cyan-400/50" },
]

const PADS_9: PadConfig[] = [
  ...PADS_6,
  { id: 6, colorName: "Orange", label: "7", keyHint: "7", freq: 293.66, bgGradient: "from-orange-500/80 to-amber-600/80", glowColor: "rgba(249, 115, 22, 0.6)", activeColor: "bg-orange-400", borderColor: "border-orange-400/50" },
  { id: 7, colorName: "Pink", label: "8", keyHint: "8", freq: 349.23, bgGradient: "from-pink-500/80 to-rose-500/80", glowColor: "rgba(236, 72, 153, 0.6)", activeColor: "bg-pink-400", borderColor: "border-pink-400/50" },
  { id: 8, colorName: "Lime", label: "9", keyHint: "9", freq: 659.25, bgGradient: "from-lime-400/80 to-emerald-500/80", glowColor: "rgba(132, 204, 22, 0.6)", activeColor: "bg-lime-300", borderColor: "border-lime-400/50" },
]

const difficultyConfig: Record<Difficulty, {
  name: string
  icon: any
  padCount: number
  sequenceDelay: number
  buttonHighlight: number
  description: string
  badgeColor: string
}> = {
  beginner: {
    name: "Beginner",
    icon: Clock,
    padCount: 4,
    sequenceDelay: 750,
    buttonHighlight: 450,
    description: "4 Pads • Relaxed rhythm • Ideal for practice",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  standard: {
    name: "Standard",
    icon: Zap,
    padCount: 4,
    sequenceDelay: 500,
    buttonHighlight: 320,
    description: "4 Pads • Balanced tempo • The classic experience",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  pro: {
    name: "Pro (6 Pads)",
    icon: ShieldAlert,
    padCount: 6,
    sequenceDelay: 360,
    buttonHighlight: 220,
    description: "6 Hexagonal Pads • Rapid playback • High focus",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  insane: {
    name: "Insane (9 Pads)",
    icon: Flame,
    padCount: 9,
    sequenceDelay: 240,
    buttonHighlight: 150,
    description: "9 Grid Pads • Lightning memory • Extreme precision",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
}

const gameModesConfig: Record<GameMode, {
  name: string
  icon: any
  description: string
  accent: string
}> = {
  classic: {
    name: "Classic Echo",
    icon: Play,
    description: "Follow Simon's growing sequence in order.",
    accent: "from-blue-500 to-indigo-600",
  },
  reverse: {
    name: "Reverse Recall",
    icon: RotateCcw,
    description: "Repeat the sequence in REVERSE order!",
    accent: "from-purple-500 to-pink-600",
  },
  chaos: {
    name: "Chaos Matrix",
    icon: Shuffle,
    description: "Pad locations swap and rotate between rounds!",
    accent: "from-amber-500 to-orange-600",
  },
  speed: {
    name: "Speed Rush",
    icon: Zap,
    description: "Faster sequence each round with a turn timer!",
    accent: "from-emerald-500 to-teal-600",
  },
  tone: {
    name: "Tone Match",
    icon: Music,
    description: "Pads flash identically — rely purely on pitch memory!",
    accent: "from-cyan-500 to-blue-600",
  },
}

const patternStylesConfig: Record<PatternStyle, {
  name: string
  icon: any
  description: string
  badge: string
}> = {
  random: {
    name: "Adaptive Chaos",
    icon: Sparkles,
    description: "Unpredictable dynamic sequence shifts.",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  fibonacci: {
    name: "Fibonacci Spiral",
    icon: Binary,
    description: "Golden ratio leaps with non-linear prime offsets.",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  polyrhythm: {
    name: "Poly-Rhythm Sync",
    icon: Repeat,
    description: "Complex syncopated single/double/triple bursts.",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  knighthop: {
    name: "Knight's Hop Matrix",
    icon: Compass,
    description: "Chess Knight diagonal leaps across pads.",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  arpeggio: {
    name: "Chord Arpeggio",
    icon: Music,
    description: "Intricate musical scale progressions & chords.",
    badge: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
  asymmetric: {
    name: "Asymmetric Inversion",
    icon: Cpu,
    description: "Dynamic mirrored axis shifts & inversions.",
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
}

export default function SimonSaysGame({ onBack }: SimonSaysGameProps) {
  const [gameState, setGameState] = useState<GameState>("menu")
  const [mode, setMode] = useState<GameMode>("classic")
  const [difficulty, setDifficulty] = useState<Difficulty>("standard")
  const [patternStyle, setPatternStyle] = useState<PatternStyle>("fibonacci")
  
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [activeButton, setActiveButton] = useState<number | null>(null)
  const [sequenceIndex, setSequenceIndex] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [padOrder, setPadOrder] = useState<number[]>([])
  
  const [highScores, setHighScores] = useState<Record<string, number>>({})
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: "rookie", title: "First Sequence", description: "Reach a score of 5 in any mode", icon: "🌱", unlocked: false },
    { id: "maestro", title: "Memory Maestro", description: "Reach a score of 12 in Classic mode", icon: "🧠", unlocked: false },
    { id: "reverse_god", title: "Reverse Master", description: "Reach score 8 in Reverse Recall", icon: "🔄", unlocked: false },
    { id: "chaos_survivor", title: "Matrix Survivor", description: "Reach score 8 in Chaos Matrix", icon: "🌀", unlocked: false },
    { id: "speed_demon", title: "Lightning Reflex", description: "Reach score 10 in Speed Rush", icon: "⚡", unlocked: false },
    { id: "pitch_perfect", title: "Pitch Perfect", description: "Reach score 8 in Tone Match", icon: "🎵", unlocked: false },
    { id: "pattern_master", title: "Quantum Memory", description: "Reach score 10 using Fibonacci Spiral or Knight's Hop", icon: "⚛️", unlocked: false },
    { id: "insane_legend", title: "Insane Legend", description: "Reach score 10 on Insane Difficulty", icon: "👑", unlocked: false },
  ])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  useEffect(() => {
    try {
      const savedScores = localStorage.getItem("simon_says_high_scores_v4")
      if (savedScores) setHighScores(JSON.parse(savedScores))

      const savedAch = localStorage.getItem("simon_says_achievements_v4")
      if (savedAch) {
        const unlockedIds: string[] = JSON.parse(savedAch)
        setAchievements((prev) =>
          prev.map((a) => ({ ...a, unlocked: unlockedIds.includes(a.id) }))
        )
      }
    } catch (e) {
      console.warn("Could not load stored data:", e)
    }
  }, [])

  const saveHighScore = useCallback((currentScore: number) => {
    const key = `${mode}_${difficulty}_${patternStyle}`
    setHighScores((prev) => {
      const best = prev[key] || 0
      if (currentScore > best) {
        const updated = { ...prev, [key]: currentScore }
        localStorage.setItem("simon_says_high_scores_v4", JSON.stringify(updated))
        return updated
      }
      return prev
    })
  }, [mode, difficulty, patternStyle])

  const checkAchievements = useCallback((currentScore: number) => {
    setAchievements((prev) => {
      let changed = false
      const updated = prev.map((ach) => {
        if (ach.unlocked) return ach
        let unlock = false
        if (ach.id === "rookie" && currentScore >= 5) unlock = true
        if (ach.id === "maestro" && mode === "classic" && currentScore >= 12) unlock = true
        if (ach.id === "reverse_god" && mode === "reverse" && currentScore >= 8) unlock = true
        if (ach.id === "chaos_survivor" && mode === "chaos" && currentScore >= 8) unlock = true
        if (ach.id === "speed_demon" && mode === "speed" && currentScore >= 10) unlock = true
        if (ach.id === "pitch_perfect" && mode === "tone" && currentScore >= 8) unlock = true
        if (ach.id === "pattern_master" && (patternStyle === "fibonacci" || patternStyle === "knighthop") && currentScore >= 10) unlock = true
        if (ach.id === "insane_legend" && difficulty === "insane" && currentScore >= 10) unlock = true

        if (unlock) {
          changed = true
          return { ...ach, unlocked: true }
        }
        return ach
      })

      if (changed) {
        const unlockedIds = updated.filter((a) => a.unlocked).map((a) => a.id)
        localStorage.setItem("simon_says_achievements_v4", JSON.stringify(unlockedIds))
      }
      return updated
    })
  }, [mode, difficulty, patternStyle])

  const playTone = useCallback((freq: number, duration = 0.3, type: OscillatorType = "sine") => {
    if (!soundEnabled) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const subOsc = ctx.createOscillator()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      subOsc.type = "sine"
      subOsc.frequency.setValueAtTime(freq / 2, ctx.currentTime)

      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc.connect(gain)
      subOsc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      subOsc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
      subOsc.stop(ctx.currentTime + duration)
    } catch (e) {
      console.warn("Audio play error:", e)
    }
  }, [soundEnabled, getAudioContext])

  const playSuccessChime = useCallback(() => {
    if (!soundEnabled) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const notes = [523.25, 659.25, 783.99, 1046.50]
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playTone(freq, 0.25, "triangle")
        }, idx * 70)
      })
    } catch (e) {
      console.warn("Chime error:", e)
    }
  }, [soundEnabled, getAudioContext, playTone])

  const playGameOverSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6)
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    } catch (e) {
      console.warn("Game over audio error:", e)
    }
  }, [soundEnabled, getAudioContext])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener("resize", handleResize)

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

    const particles: Particle[] = []

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: "#60a5fa",
        alpha: Math.random() * 0.5 + 0.2,
        life: 0,
        maxLife: 99999,
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life++

        if (p.maxLife !== 99999 && p.life >= p.maxLife) {
          particles.splice(i, 1)
          continue
        }

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const triggerParticleBurst = useCallback((color = "#3b82f6") => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const cx = width / 2
    const cy = height / 2

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 6 + 2
      const size = Math.random() * 4 + 2

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(
        cx + Math.cos(angle) * 40,
        cy + Math.sin(angle) * 40,
        size,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
  }, [])

  const getPadsConfig = useCallback((): PadConfig[] => {
    const padCount = difficultyConfig[difficulty].padCount
    if (padCount === 9) return PADS_9
    if (padCount === 6) return PADS_6
    return PADS_4
  }, [difficulty])

  const currentPads = getPadsConfig()

  // Advanced Non-Linear Sequence Generator
  const generateNextPadId = useCallback((currentSeq: number[]): number => {
    const pads = getPadsConfig()
    const padsCount = pads.length
    const n = currentSeq.length

    if (n === 0) {
      return Math.floor(Math.random() * padsCount)
    }

    const lastPad = currentSeq[n - 1]

    if (patternStyle === "fibonacci") {
      // Fibonacci sequence with prime offsets
      const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
      const fibStep = fib[n % fib.length]
      const primeOffset = (n * 3 + 7) % padsCount
      return (lastPad + fibStep + primeOffset) % padsCount
    }

    if (patternStyle === "polyrhythm") {
      // Syncopated poly-rhythmic burst: Single -> Double -> Triple -> Burst
      const cyclePos = n % 6
      if (cyclePos === 1 || cyclePos === 3 || cyclePos === 4) {
        return lastPad // Repeat pad for syncopated rhythm
      }
      return (lastPad + Math.floor(Math.random() * (padsCount - 1)) + 1) % padsCount
    }

    if (patternStyle === "asymmetric") {
      // Asymmetric axis reflection
      if (padsCount === 4) {
        const mirrorMap = [3, 2, 1, 0]
        return (mirrorMap[lastPad] + (n % 2 === 0 ? 1 : 0)) % 4
      } else if (padsCount === 6) {
        return (padsCount - 1 - lastPad + n) % padsCount
      } else {
        const row = Math.floor(lastPad / 3)
        const col = lastPad % 3
        const nextRow = (2 - row + (n % 2)) % 3
        const nextCol = (2 - col + Math.floor(n / 2)) % 3
        return nextRow * 3 + nextCol
      }
    }

    if (patternStyle === "arpeggio") {
      // Musical chord progression (I - IV - V - vi)
      const chordProgressions = [
        [0, 2, 4, 7],
        [3, 5, 7, 0],
        [4, 6, 1, 3],
        [5, 0, 2, 4],
      ]
      const currentChord = chordProgressions[Math.floor(n / 4) % chordProgressions.length]
      const noteIndex = currentChord[n % currentChord.length]
      return noteIndex % padsCount
    }

    if (patternStyle === "knighthop") {
      // Chess Knight matrix hops
      if (padsCount === 4) {
        return (lastPad + (n % 2 === 0 ? 3 : 1)) % 4
      } else if (padsCount === 9) {
        const knightOffsets = [-7, -5, -3, 3, 5, 7]
        const validOffsets = knightOffsets.map(o => (lastPad + o + 9) % 9).filter(p => p !== lastPad)
        return validOffsets[n % validOffsets.length]
      } else {
        return (lastPad + 2 + (n % 3)) % padsCount
      }
    }

    // Adaptive Chaos Random
    let next = Math.floor(Math.random() * padsCount)
    if (n >= 2 && currentSeq[n - 1] === next && currentSeq[n - 2] === next) {
      next = (next + 1) % padsCount
    }
    return next
  }, [getPadsConfig, patternStyle])

  const playSequenceStep = useCallback(() => {
    if (sequenceIndex < sequence.length) {
      const padId = sequence[sequenceIndex]
      const padConfig = currentPads.find((p) => p.id === padId) || currentPads[0]

      setActiveButton(padId)
      playTone(padConfig.freq, 0.25)

      const cfg = difficultyConfig[difficulty]
      let highlightDuration = cfg.buttonHighlight
      if (mode === "speed") {
        highlightDuration = Math.max(100, cfg.buttonHighlight - sequence.length * 15)
      }

      setTimeout(() => {
        setActiveButton(null)
        if (sequenceIndex + 1 < sequence.length) {
          setSequenceIndex((prev) => prev + 1)
        } else {
          setTimeout(() => {
            setGameState("waiting")
            setPlayerSequence([])
            if (mode === "speed") {
              setTimeLeft(Math.max(3, 10 - Math.floor(sequence.length / 2)))
            }
          }, 250)
        }
      }, highlightDuration)
    }
  }, [sequenceIndex, sequence, currentPads, playTone, difficulty, mode])

  useEffect(() => {
    if (gameState === "showing") {
      if (sequenceIndex < sequence.length) {
        const cfg = difficultyConfig[difficulty]
        let delay = cfg.sequenceDelay
        if (mode === "speed") {
          delay = Math.max(180, cfg.sequenceDelay - sequence.length * 20)
        }
        const timer = setTimeout(playSequenceStep, delay)
        return () => clearTimeout(timer)
      }
    }
  }, [gameState, sequenceIndex, sequence.length, playSequenceStep, difficulty, mode])

  useEffect(() => {
    if (gameState === "waiting" && mode === "speed" && timeLeft !== null) {
      if (timeLeft <= 0) {
        playGameOverSound()
        saveHighScore(score)
        setGameState("game-over")
        return
      }
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : 0))
      }, 1000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
  }, [gameState, mode, timeLeft, playGameOverSound, saveHighScore, score])

  const startGame = () => {
    getAudioContext()
    const firstPad = generateNextPadId([])
    const pads = getPadsConfig()
    setPadOrder(pads.map((p) => p.id))
    setSequence([firstPad])
    setPlayerSequence([])
    setScore(0)
    setSequenceIndex(0)
    setTimeLeft(null)
    setGameState("showing")
  }

  const shufflePads = useCallback(() => {
    if (mode === "chaos") {
      setPadOrder((prev) => {
        const copy = [...prev]
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy
      })
    }
  }, [mode])

  const nextRound = useCallback(() => {
    const nextPad = generateNextPadId(sequence)
    const newSeq = [...sequence, nextPad]

    if (mode === "chaos") {
      shufflePads()
    }

    setSequence(newSeq)
    setPlayerSequence([])
    setScore((s) => s + 1)
    setSequenceIndex(0)
    setTimeLeft(null)
    playSuccessChime()
    triggerParticleBurst("#3b82f6")
    checkAchievements(score + 1)
    setGameState("showing")
  }, [sequence, generateNextPadId, mode, shufflePads, playSuccessChime, triggerParticleBurst, checkAchievements, score])

  const handlePadClick = useCallback(
    (padId: number) => {
      if (gameState !== "waiting") return

      const padConfig = currentPads.find((p) => p.id === padId) || currentPads[0]
      playTone(padConfig.freq, 0.2)
      setActiveButton(padId)
      setTimeout(() => setActiveButton(null), 180)

      const newPlayerSequence = [...playerSequence, padId]
      setPlayerSequence(newPlayerSequence)

      const currentIndex = newPlayerSequence.length - 1
      let expectedPadId = sequence[currentIndex]

      if (mode === "reverse") {
        expectedPadId = sequence[sequence.length - 1 - currentIndex]
      }

      if (padId !== expectedPadId) {
        playGameOverSound()
        saveHighScore(score)
        checkAchievements(score)
        setGameState("game-over")
        return
      }

      if (newPlayerSequence.length === sequence.length) {
        setTimeout(() => {
          nextRound()
        }, 600)
      }
    },
    [gameState, currentPads, playTone, playerSequence, sequence, mode, playGameOverSound, saveHighScore, score, checkAchievements, nextRound]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "waiting") return
      const key = e.key.toUpperCase()

      let matchedPadId: number | null = null
      const pads = getPadsConfig()

      if (pads.length === 4) {
        if (key === "1" || key === "Q") matchedPadId = 0
        if (key === "2" || key === "W") matchedPadId = 1
        if (key === "3" || key === "A") matchedPadId = 2
        if (key === "4" || key === "S") matchedPadId = 3
      } else {
        const num = parseInt(key, 10)
        if (!isNaN(num) && num >= 1 && num <= pads.length) {
          matchedPadId = num - 1
        }
      }

      if (matchedPadId !== null && matchedPadId < pads.length) {
        handlePadClick(matchedPadId)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, getPadsConfig, handlePadClick])

  const currentBest = highScores[`${mode}_${difficulty}_${patternStyle}`] || 0

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 overflow-hidden select-none font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-xl">
        {/* MENU STATE */}
        {gameState === "menu" && (
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-2">
                <Sparkles className="w-8 h-8 animate-spin-slow" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                SIMON SAYS
              </h1>
              <p className="text-slate-400 text-sm">
                Futuristic Audio-Visual Memory Console
              </p>
            </div>

            {/* Game Mode Selector */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left pl-1">
                1. Select Game Mode
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(gameModesConfig) as GameMode[]).map((mKey) => {
                  const mCfg = gameModesConfig[mKey]
                  const MIcon = mCfg.icon
                  const isSelected = mode === mKey
                  return (
                    <button
                      key={mKey}
                      onClick={() => setMode(mKey)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 ${
                        isSelected
                          ? "bg-slate-800 border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50"
                          : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className={`p-2 rounded-xl bg-gradient-to-tr ${mCfg.accent} text-white shrink-0 mt-0.5`}>
                        <MIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-200">{mCfg.name}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 leading-snug">
                          {mCfg.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Complex Pattern Style Selector */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left pl-1">
                2. Select Advanced Pattern Style
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(patternStylesConfig) as PatternStyle[]).map((pKey) => {
                  const pCfg = patternStylesConfig[pKey]
                  const PIcon = pCfg.icon
                  const isSel = patternStyle === pKey

                  return (
                    <button
                      key={pKey}
                      onClick={() => setPatternStyle(pKey)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSel
                          ? "bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md"
                          : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <PIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-bold text-xs text-slate-200">{pCfg.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                        {pCfg.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* High Score Preview */}
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-400 font-semibold text-sm">
                <Trophy className="w-5 h-5" />
                <span>Best Record ({gameModesConfig[mode].name} • {patternStylesConfig[patternStyle].name})</span>
              </div>
              <div className="text-2xl font-black text-white">{currentBest}</div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => setGameState("difficulty")}
                className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-200"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Choose Difficulty & Play
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setGameState("achievements")}
                  variant="outline"
                  className="h-11 bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                >
                  <Award className="w-4 h-4 mr-2 text-amber-400" />
                  Achievements
                </Button>
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="h-11 bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DIFFICULTY STATE */}
        {gameState === "difficulty" && (
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Choose Difficulty</h2>
              <p className="text-slate-400 text-sm">
                Mode: <span className="text-blue-400 font-bold">{gameModesConfig[mode].name}</span> • Pattern: <span className="text-indigo-400 font-bold">{patternStylesConfig[patternStyle].name}</span>
              </p>
            </div>

            <div className="space-y-3">
              {(Object.keys(difficultyConfig) as Difficulty[]).map((dKey) => {
                const dCfg = difficultyConfig[dKey]
                const DIcon = dCfg.icon
                const isSel = difficulty === dKey
                const record = highScores[`${mode}_${dKey}_${patternStyle}`] || 0

                return (
                  <button
                    key={dKey}
                    onClick={() => setDifficulty(dKey)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                      isSel
                        ? "bg-slate-800 border-blue-500/80 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10"
                        : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${dCfg.badgeColor} border`}>
                        <DIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{dCfg.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{dCfg.description}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400">Best</div>
                      <div className="text-lg font-black text-amber-400">{record}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={startGame}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/25"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Start Game
              </Button>
              <Button
                onClick={() => setGameState("menu")}
                variant="outline"
                className="w-full h-11 bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS STATE */}
        {gameState === "achievements" && (
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Award className="w-7 h-7 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Achievements</h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-4 transition-all ${
                    ach.unlocked
                      ? "bg-slate-800/80 border-amber-500/30 text-white shadow-md shadow-amber-500/5"
                      : "bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="text-3xl shrink-0">{ach.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span>{ach.title}</span>
                      {ach.unlocked && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{ach.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setGameState("menu")}
              variant="outline"
              className="w-full h-11 bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </div>
        )}

        {/* PLAYING STATE */}
        {(gameState === "showing" || gameState === "waiting") && (
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setGameState("menu")}
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {gameModesConfig[mode].name}
                  </div>
                  <div className="text-xs text-blue-400 font-bold">
                    {difficultyConfig[difficulty].name} • {patternStylesConfig[patternStyle].name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-slate-600" />}
                </Button>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 text-center relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="text-left">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Round
                  </div>
                  <div className="text-3xl font-black text-white">{score + 1}</div>
                </div>

                {mode === "speed" && timeLeft !== null && (
                  <div className="text-center">
                    <div className="text-xs text-amber-400 uppercase tracking-wider font-bold flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Timer
                    </div>
                    <div className={`text-2xl font-black ${timeLeft <= 2 ? "text-rose-500 animate-ping" : "text-amber-400"}`}>
                      {timeLeft}s
                    </div>
                  </div>
                )}

                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Best
                  </div>
                  <div className="text-3xl font-black text-amber-400">{currentBest}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 mt-2 flex items-center justify-between text-xs font-bold">
                {gameState === "showing" && (
                  <div className="w-full text-blue-400 animate-pulse flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Watch Sequence ({sequenceIndex + 1}/{sequence.length})</span>
                  </div>
                )}
                {gameState === "waiting" && (
                  <div className="w-full text-emerald-400 flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>
                      {mode === "reverse"
                        ? `Repeat in REVERSE! (${playerSequence.length}/${sequence.length})`
                        : `Your Turn! (${playerSequence.length}/${sequence.length})`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`grid gap-3.5 ${
                difficultyConfig[difficulty].padCount === 9
                  ? "grid-cols-3"
                  : difficultyConfig[difficulty].padCount === 6
                  ? "grid-cols-3"
                  : "grid-cols-2"
              }`}
            >
              {(padOrder.length > 0 ? padOrder : currentPads.map((p) => p.id)).map((padId) => {
                const pad = currentPads.find((p) => p.id === padId) || currentPads[0]
                const isActive = activeButton === pad.id

                return (
                  <button
                    key={pad.id}
                    onClick={() => handlePadClick(pad.id)}
                    disabled={gameState !== "waiting"}
                    style={{
                      boxShadow: isActive
                        ? `0 0 35px ${pad.glowColor}`
                        : "0 4px 20px rgba(0, 0, 0, 0.4)",
                    }}
                    className={`
                      relative aspect-square rounded-2xl border transition-all duration-150 transform overflow-hidden
                      ${
                        mode === "tone" && gameState === "showing" && isActive
                          ? "bg-slate-200 border-white"
                          : `bg-gradient-to-br ${pad.bgGradient} ${pad.borderColor}`
                      }
                      ${isActive ? "scale-95 brightness-150 ring-4 ring-white/60" : "hover:brightness-110 active:scale-95"}
                      ${gameState !== "waiting" ? "cursor-not-allowed opacity-90" : "cursor-pointer"}
                    `}
                  >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] hover:bg-transparent transition-all" />

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-white/80 backdrop-blur-md">
                      {pad.keyHint}
                    </div>

                    {isActive && (
                      <div className="absolute inset-0 bg-white/20 animate-ping pointer-events-none" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>Use mouse or press keys <strong className="text-slate-400">1-{currentPads.length}</strong> (or Q/W/A/S)</span>
            </div>
          </div>
        )}

        {/* GAME OVER STATE */}
        {gameState === "game-over" && (
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-3xl mb-2">
                😵
              </div>
              <h2 className="text-3xl font-extrabold text-white">Sequence Broken!</h2>
              <p className="text-slate-400 text-sm">
                Mode: <span className="text-blue-400 font-bold">{gameModesConfig[mode].name}</span> • Pattern: <span className="text-indigo-400 font-bold">{patternStylesConfig[patternStyle].name}</span>
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Rounds Reached
              </div>
              <div className="text-5xl font-black text-rose-400">{score}</div>

              {score > 0 && score >= currentBest && (
                <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>NEW PERSONAL BEST!</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={startGame}
                className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/25"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setGameState("difficulty")}
                  variant="outline"
                  className="h-11 bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  Change Mode
                </Button>
                <Button
                  onClick={() => setGameState("menu")}
                  variant="outline"
                  className="h-11 bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Main Menu
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
