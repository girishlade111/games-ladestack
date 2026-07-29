"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Play,
  RotateCcw,
  Timer,
  Zap,
  Volume2,
  VolumeX,
  Trophy,
  BarChart2,
  Sparkles,
  Keyboard as KeyboardIcon,
  CheckCircle2,
  AlertCircle,
  Settings,
  Code,
  Quote,
  Target,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Hash,
  Activity
} from "lucide-react"

// ==========================================
// 1. SOUND SYNTHESIZER (WEB AUDIO API)
// ==========================================
type SwitchSoundType = "clicky" | "tactile" | "linear" | "digital" | "off"

class MechanicalSoundEngine {
  private ctx: AudioContext | null = null

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
  }

  public playKeypress(soundType: SwitchSoundType, isSpace: boolean = false) {
    if (soundType === "off") return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    if (soundType === "clicky") {
      // Blue Switch sound: Sharp high click + noise
      osc.type = "sine"
      osc.frequency.setValueAtTime(isSpace ? 400 : 750, now)
      osc.frequency.exponentialRampToValueAtTime(isSpace ? 150 : 250, now + 0.03)

      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

      osc.start(now)
      osc.stop(now + 0.035)
    } else if (soundType === "tactile") {
      // Brown Switch sound: Soft thock
      osc.type = "triangle"
      osc.frequency.setValueAtTime(isSpace ? 200 : 350, now)
      osc.frequency.exponentialRampToValueAtTime(isSpace ? 80 : 120, now + 0.04)

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

      osc.start(now)
      osc.stop(now + 0.04)
    } else if (soundType === "linear") {
      // Red Switch sound: Deep smooth quiet sound
      osc.type = "sine"
      osc.frequency.setValueAtTime(isSpace ? 140 : 220, now)
      osc.frequency.exponentialRampToValueAtTime(isSpace ? 60 : 90, now + 0.05)

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      osc.start(now)
      osc.stop(now + 0.05)
    } else if (soundType === "digital") {
      // Synth arcade blip
      osc.type = "square"
      osc.frequency.setValueAtTime(isSpace ? 520 : 880, now)
      osc.frequency.exponentialRampToValueAtTime(isSpace ? 300 : 440, now + 0.02)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

      osc.start(now)
      osc.stop(now + 0.025)
    }
  }

  public playError() {
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(130, now)
    osc.frequency.linearRampToValueAtTime(90, now + 0.08)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.09)
  }

  public playFinish() {
    this.init()
    if (!this.ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return
      const now = this.ctx.currentTime + idx * 0.08
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    })
  }
}

const soundEngine = new MechanicalSoundEngine()

// ==========================================
// 2. TEXT DATASETS & CONTENT GENERATION
// ==========================================

const EASY_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
  "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
  "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
  "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
  "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
  "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us", "is", "was", "are",
  "has", "had", "been", "where", "much", "down", "own", "life", "glow", "cyber", "code", "fast"
]

const MEDIUM_WORDS = [
  "algorithm", "bandwidth", "complexity", "database", "encryption", "framework", "graphics",
  "hardware", "interface", "javascript", "kernel", "language", "memory", "network", "operating",
  "protocol", "query", "responsive", "software", "terminal", "utility", "virtual", "window",
  "execution", "developer", "function", "variable", "structure", "component", "synthesizer",
  "react", "typescript", "asynchronous", "iteration", "constant", "array", "object", "string",
  "boolean", "promise", "callback", "closure", "prototype", "module", "package", "render",
  "stylesheet", "document", "element", "listener", "dispatch", "handler", "state", "effect"
]

const HARD_WORDS = [
  "extraordinary", "incomprehensible", "synchronization", "cryptographic", "juxtaposition",
  "existential", "philosophical", "thermodynamic", "psycholinguistic", "architecture",
  "microservices", "multithreading", "polymorphism", "encapsulation", "abstraction",
  "concurrency", "deterministic", "metaprogramming", "neuroplasticity", "quantum",
  "heterogeneous", "idempotent", "refactoring", "transpilation", "unidirectional",
  "interoperability", "bi-directional", "decentralized", "paradigm", "scalability",
  "telemetry", "vectorization", "virtualization", "webassembly", "zero-copy"
]

const FAMOUS_QUOTES = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "Future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { quote: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { quote: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { quote: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" }
]

const CODE_SNIPPETS = [
  `const calculateWpm = (chars: number, seconds: number): number => { return Math.round((chars / 5) / (seconds / 60)); };`,
  `useEffect(() => { const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000); return () => clearInterval(timer); }, []);`,
  `async function fetchData(url: string): Promise<Data> { const res = await fetch(url); return await res.json(); }`,
  `function BinarySearch<T>(arr: T[], target: T): number { let left = 0, right = arr.length - 1; while (left <= right) { const mid = (left + right) >> 1; if (arr[mid] === target) return mid; } return -1; }`,
  `const [state, setState] = useState<{ score: number; accuracy: number }>({ score: 0, accuracy: 100 });`
]

// Virtual Keyboard Layout
const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
  ["space"]
]

// High Score / Telemetry Interface
interface TestResult {
  date: string
  wpm: number
  rawWpm: number
  accuracy: number
  cpm: number
  mode: string
  difficulty: string
  errors: number
}

export default function TypingSpeedGame({
  themeColor = "#8b5cf6",
  onBack,
}: {
  themeColor?: string
  onBack?: () => void
}) {
  // Game Configuration State
  const [mode, setMode] = useState<"timed" | "words" | "quotes" | "code" | "zen">("timed")
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "hard" | "master">("intermediate")
  const [timeConfig, setTimeConfig] = useState<number>(30) // 15, 30, 60, 120
  const [wordConfig, setWordConfig] = useState<number>(25) // 10, 25, 50, 100
  const [soundType, setSoundType] = useState<SwitchSoundType>("clicky")
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large")
  const [colorTheme, setColorTheme] = useState<"purple" | "cyan" | "emerald" | "amber">("purple")

  // Game Engine State
  const [gameState, setGameState] = useState<"menu" | "playing" | "finished">("menu")
  const [targetText, setTargetText] = useState("")
  const [quoteAuthor, setQuoteAuthor] = useState<string | null>(null)
  const [userInput, setUserInput] = useState("")
  const [timeLeft, setTimeLeft] = useState(30)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Live Performance Stats
  const [correctChars, setCorrectChars] = useState(0)
  const [totalKeystrokes, setTotalKeystrokes] = useState(0)
  const [totalErrors, setTotalErrors] = useState(0)
  const [comboStreak, setComboStreak] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)

  // Live Telemetry for Graphing
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number; rawWpm: number; acc: number }[]>([])

  // Virtual Keyboard & Animation Feedback State
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [keyHits, setKeyHits] = useState<Record<string, boolean>>({})

  // Persistent High Scores & Records
  const [resultsHistory, setResultsHistory] = useState<TestResult[]>([])
  const [bestWpm, setBestWpm] = useState<number>(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Theme styles dictionary
  const themeColors = useMemo(() => {
    switch (colorTheme) {
      case "cyan":
        return { primary: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)", bgCard: "bg-cyan-950/20 border-cyan-500/30" }
      case "emerald":
        return { primary: "#10b981", glow: "rgba(16, 185, 129, 0.4)", bgCard: "bg-emerald-950/20 border-emerald-500/30" }
      case "amber":
        return { primary: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", bgCard: "bg-amber-950/20 border-amber-500/30" }
      default:
        return { primary: themeColor || "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)", bgCard: "bg-purple-950/20 border-purple-500/30" }
    }
  }, [colorTheme, themeColor])

  // Load High Scores from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("typing_speed_results_v2")
      if (saved) {
        const parsed: TestResult[] = JSON.parse(saved)
        setResultsHistory(parsed)
        if (parsed.length > 0) {
          const maxVal = Math.max(...parsed.map((r) => r.wpm))
          setBestWpm(maxVal)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Save Results helper
  const saveResult = useCallback(
    (newResult: TestResult) => {
      const updated = [newResult, ...resultsHistory].slice(0, 20)
      setResultsHistory(updated)
      if (newResult.wpm > bestWpm) {
        setBestWpm(newResult.wpm)
      }
      try {
        localStorage.setItem("typing_speed_results_v2", JSON.stringify(updated))
      } catch (e) {
        console.error(e)
      }
    },
    [resultsHistory, bestWpm]
  )

  // Text Generator
  const generateTextContent = useCallback(() => {
    if (mode === "quotes") {
      const q = FAMOUS_QUOTES[Math.floor(Math.random() * FAMOUS_QUOTES.length)]
      setQuoteAuthor(q.author)
      return q.quote
    }
    if (mode === "code") {
      setQuoteAuthor("Tech Snippet")
      return CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
    }

    setQuoteAuthor(null)
    let wordPool = EASY_WORDS
    if (difficulty === "intermediate") {
      wordPool = [...EASY_WORDS, ...MEDIUM_WORDS]
    } else if (difficulty === "hard") {
      wordPool = [...MEDIUM_WORDS, ...HARD_WORDS]
    } else if (difficulty === "master") {
      wordPool = [...HARD_WORDS]
    }

    const count = mode === "words" ? wordConfig : mode === "timed" ? (timeConfig <= 30 ? 60 : 120) : 100
    const chosen: string[] = []
    for (let i = 0; i < count; i++) {
      const word = wordPool[Math.floor(Math.random() * wordPool.length)]
      chosen.push(word)
    }
    return chosen.join(" ")
  }, [mode, difficulty, wordConfig, timeConfig])

  // Initialize Game Session
  const initGame = useCallback(() => {
    const text = generateTextContent()
    setTargetText(text)
    setUserInput("")
    setStartTime(null)
    setElapsedSeconds(0)
    setCorrectChars(0)
    setTotalKeystrokes(0)
    setTotalErrors(0)
    setComboStreak(0)
    setMaxCombo(0)
    setWpmHistory([])
    setTimeLeft(mode === "timed" ? timeConfig : 0)
    setGameState("playing")

    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [generateTextContent, mode, timeConfig])

  // Finish Game Session
  const finishGame = useCallback(() => {
    soundEngine.playFinish()
    setGameState("finished")

    const duration = elapsedSeconds > 0 ? elapsedSeconds : 1
    const finalWpm = Math.round((correctChars / 5) / (duration / 60))
    const finalRawWpm = Math.round((totalKeystrokes / 5) / (duration / 60))
    const finalAcc = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100
    const finalCpm = Math.round(correctChars / (duration / 60))

    const newResult: TestResult = {
      date: new Date().toLocaleDateString(),
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      accuracy: finalAcc,
      cpm: finalCpm,
      mode: `${mode} (${mode === "timed" ? timeConfig + "s" : mode === "words" ? wordConfig + "w" : mode})`,
      difficulty,
      errors: totalErrors,
    }

    saveResult(newResult)
  }, [elapsedSeconds, correctChars, totalKeystrokes, mode, timeConfig, wordConfig, difficulty, totalErrors, saveResult])

  // Live Timer Loop
  useEffect(() => {
    if (gameState !== "playing" || !startTime) return

    const timer = setInterval(() => {
      const now = Date.now()
      const secs = Math.max(1, Math.floor((now - startTime) / 1000))
      setElapsedSeconds(secs)

      // Calculate snapshot stats for telemetry line graph
      const currentWpm = Math.round((correctChars / 5) / (secs / 60))
      const currentRawWpm = Math.round((totalKeystrokes / 5) / (secs / 60))
      const currentAcc = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100

      setWpmHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].time === secs) return prev
        return [...prev, { time: secs, wpm: currentWpm, rawWpm: currentRawWpm, acc: currentAcc }]
      })

      if (mode === "timed") {
        const remaining = Math.max(0, timeConfig - secs)
        setTimeLeft(remaining)
        if (remaining <= 0) {
          finishGame()
        }
      }
    }, 500)

    return () => clearInterval(timer)
  }, [gameState, startTime, correctChars, totalKeystrokes, mode, timeConfig, finishGame])

  // Handle Keystrokes & Typing Engine
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== "playing") return

    const val = e.target.value
    if (!startTime && val.length > 0) {
      setStartTime(Date.now())
    }

    const isBackspacing = val.length < userInput.length
    setUserInput(val)

    if (!isBackspacing && val.length > 0) {
      const typedChar = val[val.length - 1]
      const targetChar = targetText[val.length - 1]
      const isSpace = typedChar === " "

      // Trigger Virtual Keyboard animation
      const keyLabel = isSpace ? "space" : typedChar.toLowerCase()
      setActiveKey(keyLabel)
      setKeyHits((prev) => ({ ...prev, [keyLabel]: true }))
      setTimeout(() => setActiveKey(null), 120)

      if (typedChar === targetChar) {
        soundEngine.playKeypress(soundType, isSpace)
        setCorrectChars((c) => c + 1)
        setComboStreak((s) => {
          const next = s + 1
          if (next > maxCombo) setMaxCombo(next)
          return next
        })
      } else {
        soundEngine.playError()
        setTotalErrors((err) => err + 1)
        setComboStreak(0)
      }

      setTotalKeystrokes((k) => k + 1)
    }

    // Check completion condition
    if (val.length >= targetText.length) {
      finishGame()
    }
  }

  // Handle Global Shortcuts (Tab + Enter or Esc to restart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        initGame()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [initGame])

  // Current WPM / Acc computations for live rendering
  const liveDuration = elapsedSeconds > 0 ? elapsedSeconds : 1
  const liveWpm = Math.round((correctChars / 5) / (liveDuration / 60))
  const liveRawWpm = Math.round((totalKeystrokes / 5) / (liveDuration / 60))
  const liveAcc = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100
  const progressPercent = targetText.length ? Math.min(100, (userInput.length / targetText.length) * 100) : 0

  // Expected Next Key to Highlight on Keyboard
  const nextTargetChar = targetText[userInput.length] || ""
  const nextKeyboardKey = nextTargetChar === " " ? "space" : nextTargetChar.toLowerCase()

  // Typing Rank Calculation
  const getRankBadge = (wpm: number, acc: number) => {
    if (wpm >= 100 && acc >= 98) return { label: "⚡ GODLIKE TYPER", tier: "S+", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" }
    if (wpm >= 85) return { label: "🚀 MASTER TOUCH TYPER", tier: "S", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" }
    if (wpm >= 65) return { label: "🔥 SWIFT PRO", tier: "A", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" }
    if (wpm >= 45) return { label: "✨ PROFICIENT", tier: "B", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" }
    if (wpm >= 25) return { label: "🐢 CASUAL TYPER", tier: "C", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" }
    return { label: "🌱 NOVICE TYPER", tier: "D", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" }
  }

  // Draw Canvas Graph for Post-Game Analysis
  useEffect(() => {
    if (gameState !== "finished" || !canvasRef.current || wpmHistory.length < 2) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)

    // Background Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = 1
    for (let i = 1; i <= 4; i++) {
      const y = (height / 5) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const maxWpm = Math.max(100, ...wpmHistory.map((h) => h.rawWpm))
    const maxTime = wpmHistory[wpmHistory.length - 1].time || 1

    // Draw Raw WPM Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
    ctx.lineWidth = 2
    ctx.beginPath()
    wpmHistory.forEach((pt, i) => {
      const x = (pt.time / maxTime) * (width - 40) + 20
      const y = height - 20 - (pt.rawWpm / maxWpm) * (height - 40)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw Net WPM Line (Main glowing theme line)
    ctx.strokeStyle = themeColors.primary
    ctx.lineWidth = 3
    ctx.shadowColor = themeColors.glow
    ctx.shadowBlur = 10
    ctx.beginPath()
    wpmHistory.forEach((pt, i) => {
      const x = (pt.time / maxTime) * (width - 40) + 20
      const y = height - 20 - (pt.wpm / maxWpm) * (height - 40)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Reset shadow
    ctx.shadowBlur = 0

    // Draw Points
    wpmHistory.forEach((pt) => {
      const x = (pt.time / maxTime) * (width - 40) + 20
      const y = height - 20 - (pt.wpm / maxWpm) * (height - 40)
      ctx.fillStyle = themeColors.primary
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [gameState, wpmHistory, themeColors])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-foreground select-none">
      {/* HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: themeColors.primary }}
          >
            <KeyboardIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              Typing Speed Test <Sparkles className="w-4 h-4 text-amber-400" />
            </h1>
            <p className="text-xs text-muted-foreground">Test your WPM, accuracy, and mechanical touch typing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const types: SwitchSoundType[] = ["clicky", "tactile", "linear", "digital", "off"]
              const nextIndex = (types.indexOf(soundType) + 1) % types.length
              setSoundType(types[nextIndex])
            }}
            className="text-xs gap-1.5 font-medium border-border/60"
          >
            {soundType === "off" ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="capitalize">{soundType} Switch</span>
          </Button>

          {/* Color Theme Selector */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const themes: Array<"purple" | "cyan" | "emerald" | "amber"> = ["purple", "cyan", "emerald", "amber"]
              const next = themes[(themes.indexOf(colorTheme) + 1) % themes.length]
              setColorTheme(next)
            }}
            className="text-xs gap-1 border-border/60"
          >
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="capitalize">{colorTheme}</span>
          </Button>

          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
              Back
            </Button>
          )}
        </div>
      </div>

      {/* GAME MODE & DIFFICULTY BAR */}
      {gameState !== "finished" && (
        <Card className={`p-3 mb-6 bg-card/40 backdrop-blur border-border/60 flex flex-wrap items-center justify-between gap-4`}>
          {/* Modes */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {(
              [
                { id: "timed", label: "Timed", icon: Timer },
                { id: "words", label: "Words", icon: Hash },
                { id: "quotes", label: "Quotes", icon: Quote },
                { id: "code", label: "Code Snippets", icon: Code },
                { id: "zen", label: "Zen Mode", icon: Activity },
              ] as const
            ).map((m) => {
              const Icon = m.icon
              const isActive = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    if (gameState === "playing") initGame()
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  style={isActive ? { backgroundColor: themeColors.primary } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Sub-configs for Timed or Words */}
          <div className="flex items-center gap-4 text-xs">
            {mode === "timed" && (
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md">
                {[15, 30, 60, 120].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setTimeConfig(sec)
                      if (gameState === "playing") initGame()
                    }}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      timeConfig === sec ? "bg-background text-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            )}

            {mode === "words" && (
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md">
                {[10, 25, 50, 100].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => {
                      setWordConfig(cnt)
                      if (gameState === "playing") initGame()
                    }}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      wordConfig === cnt ? "bg-background text-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cnt}w
                  </button>
                ))}
              </div>
            )}

            {/* Difficulty Selector */}
            {mode !== "quotes" && mode !== "code" && (
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md">
                {(["beginner", "intermediate", "hard", "master"] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      setDifficulty(diff)
                      if (gameState === "playing") initGame()
                    }}
                    className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                      difficulty === diff ? "bg-background text-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* MENU / START SCREEN */}
      {gameState === "menu" && (
        <div className="text-center py-12 px-4 max-w-2xl mx-auto">
          <div
            className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl animate-pulse"
            style={{ backgroundColor: themeColors.primary, boxShadow: `0 10px 30px ${themeColors.glow}` }}
          >
            <Sparkles className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-black mb-3 tracking-tight">Ready to Test Your Velocity?</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-lg mx-auto">
            Choose your preferred test duration, text category, and mechanical sound profile. Focus on rhythm, accuracy, and flow.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center bg-card/50 border-border/60">
              <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold">{bestWpm}</div>
              <div className="text-xs text-muted-foreground font-medium">Personal Best WPM</div>
            </Card>

            <Card className="p-4 text-center bg-card/50 border-border/60">
              <BarChart2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold">{resultsHistory.length}</div>
              <div className="text-xs text-muted-foreground font-medium">Tests Completed</div>
            </Card>

            <Card className="p-4 text-center bg-card/50 border-border/60">
              <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold">
                {resultsHistory.length > 0
                  ? Math.round(resultsHistory.reduce((a, b) => a + b.accuracy, 0) / resultsHistory.length)
                  : 100}
                %
              </div>
              <div className="text-xs text-muted-foreground font-medium">Average Accuracy</div>
            </Card>

            <Card className="p-4 text-center bg-card/50 border-border/60">
              <Flame className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold">
                {resultsHistory.length > 0 ? Math.round(resultsHistory.reduce((a, b) => a + b.wpm, 0) / resultsHistory.length) : 0}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Average WPM</div>
            </Card>
          </div>

          <Button
            size="lg"
            onClick={initGame}
            className="px-8 py-6 text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-105"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Play className="w-5 h-5 mr-2 fill-current" /> Start Typing Test
          </Button>
        </div>
      )}

      {/* ACTIVE PLAYING SCREEN */}
      {gameState === "playing" && (
        <div className="space-y-6">
          {/* LIVE METRICS BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="p-3 text-center bg-card/40 border-border/60">
              <div className="text-xs text-muted-foreground font-semibold">
                {mode === "timed" ? "TIME REMAINING" : "ELAPSED TIME"}
              </div>
              <div className="text-2xl font-black" style={{ color: themeColors.primary }}>
                {mode === "timed" ? `${timeLeft}s` : `${elapsedSeconds}s`}
              </div>
            </Card>

            <Card className="p-3 text-center bg-card/40 border-border/60">
              <div className="text-xs text-muted-foreground font-semibold">NET WPM</div>
              <div className="text-2xl font-black text-foreground">{liveWpm}</div>
            </Card>

            <Card className="p-3 text-center bg-card/40 border-border/60">
              <div className="text-xs text-muted-foreground font-semibold">ACCURACY</div>
              <div className={`text-2xl font-black ${liveAcc >= 95 ? "text-emerald-400" : liveAcc >= 85 ? "text-amber-400" : "text-red-400"}`}>
                {liveAcc}%
              </div>
            </Card>

            <Card className="p-3 text-center bg-card/40 border-border/60">
              <div className="text-xs text-muted-foreground font-semibold">RAW WPM / CPM</div>
              <div className="text-lg font-black text-muted-foreground">{liveRawWpm} / {correctChars}</div>
            </Card>

            <Card className="p-3 text-center bg-card/40 border-border/60 col-span-2 sm:col-span-1">
              <div className="text-xs text-muted-foreground font-semibold">COMBO STREAK</div>
              <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-current" /> {comboStreak}
              </div>
            </Card>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%`, backgroundColor: themeColors.primary }}
            />
          </div>

          {/* MAIN TYPING TEXT BOX CONTAINER */}
          <Card
            className="relative p-6 sm:p-8 bg-card/60 backdrop-blur-md border-border/80 rounded-2xl shadow-xl min-h-[180px] flex flex-col justify-between cursor-text overflow-hidden"
            onClick={() => inputRef.current?.focus()}
            ref={containerRef}
          >
            {/* Quote Author Tag if applicable */}
            {quoteAuthor && (
              <div className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" /> Source: <span className="text-foreground font-bold">{quoteAuthor}</span>
              </div>
            )}

            {/* Hidden Input field capturing keystrokes seamlessly */}
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              className="absolute opacity-0 pointer-events-none inset-0"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

            {/* Character Render Field */}
            <div
              className={`leading-relaxed font-mono tracking-wide break-words select-none transition-all ${
                fontSize === "xlarge" ? "text-2xl" : fontSize === "large" ? "text-xl" : "text-lg"
              }`}
            >
              {targetText.split("").map((char, index) => {
                const isTyped = index < userInput.length
                const isCorrect = isTyped && userInput[index] === char
                const isCursor = index === userInput.length

                let charStyle = "text-muted-foreground/40"
                if (isTyped) {
                  charStyle = isCorrect
                    ? "text-emerald-400 font-bold"
                    : "text-red-400 bg-red-500/20 underline decoration-red-500 decoration-2 rounded-sm"
                }

                return (
                  <span key={index} className={`relative inline-block transition-colors duration-75 ${charStyle}`}>
                    {/* Glowing Cursor Line */}
                    {isCursor && (
                      <span
                        className="absolute -left-0.5 top-0 bottom-0 w-0.5 animate-pulse rounded-full"
                        style={{ backgroundColor: themeColors.primary, boxShadow: `0 0 8px ${themeColors.glow}` }}
                      />
                    )}
                    {char === " " ? "\u00A0" : char}
                  </span>
                )
              })}
            </div>

            {/* Bottom prompt info */}
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>Click text box or press any key to type</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Esc</kbd> to restart</span>
            </div>
          </Card>

          {/* VIRTUAL QWERTY KEYBOARD VISUALIZER */}
          <Card className="p-4 bg-card/40 backdrop-blur border-border/60 rounded-2xl flex flex-col gap-2 items-center">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5 justify-center w-full max-w-2xl">
                {row.map((key) => {
                  const isActive = activeKey === key
                  const isTargetNext = nextKeyboardKey === key
                  const isSpace = key === "space"

                  return (
                    <div
                      key={key}
                      className={`h-10 rounded-lg flex items-center justify-center font-mono text-xs uppercase font-bold transition-all duration-75 border ${
                        isSpace ? "flex-1 max-w-[240px]" : "w-8 sm:w-10"
                      } ${
                        isActive
                          ? "scale-95 bg-primary text-primary-foreground border-primary shadow-lg"
                          : isTargetNext
                          ? "border-primary/80 bg-primary/20 text-foreground animate-pulse shadow-md"
                          : "bg-muted/40 border-border/40 text-muted-foreground"
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                          : isTargetNext
                          ? { borderColor: themeColors.primary }
                          : {}
                      }
                    >
                      {isSpace ? "SPACE" : key}
                    </div>
                  )
                })}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* FINISHED ANALYTICS & RESULTS DASHBOARD */}
      {gameState === "finished" && (
        <div className="space-y-6 max-w-3xl mx-auto py-4">
          {/* RANK & SUMMARY HEADER */}
          {(() => {
            const finalDuration = elapsedSeconds > 0 ? elapsedSeconds : 1
            const finalWpm = Math.round((correctChars / 5) / (finalDuration / 60))
            const finalAcc = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100
            const rank = getRankBadge(finalWpm, finalAcc)

            return (
              <Card className="p-6 bg-card/60 backdrop-blur border-border/80 rounded-2xl shadow-xl text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm mx-auto" style={{ borderColor: themeColors.primary }}>
                  <Award className="w-4 h-4" /> {rank.label}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border/40">
                  <div>
                    <div className="text-4xl font-black" style={{ color: themeColors.primary }}>
                      {finalWpm}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold">NET WPM</div>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-emerald-400">{finalAcc}%</div>
                    <div className="text-xs text-muted-foreground font-semibold">ACCURACY</div>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-foreground">{correctChars}</div>
                    <div className="text-xs text-muted-foreground font-semibold">CHARACTERS</div>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-amber-400">{maxCombo}</div>
                    <div className="text-xs text-muted-foreground font-semibold">MAX STREAK</div>
                  </div>
                </div>

                {/* PERFORMANCE GRAPH CANVAS */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>WPM VELOCITY OVER TIME</span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColors.primary }} /> Net WPM
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-white/20" /> Raw WPM
                    </span>
                  </div>

                  <div className="w-full h-48 bg-muted/20 rounded-xl p-2 border border-border/40 overflow-hidden">
                    <canvas ref={canvasRef} width={600} height={180} className="w-full h-full" />
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={initGame}
                    className="px-6 font-bold shadow-lg transition-all hover:scale-105"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                  </Button>

                  <Button variant="outline" size="lg" onClick={() => setGameState("menu")} className="font-bold border-border/60">
                    <Settings className="w-4 h-4 mr-2" /> Change Mode & Settings
                  </Button>
                </div>
              </Card>
            )
          })()}

          {/* PAST RESULTS TABLE */}
          {resultsHistory.length > 0 && (
            <Card className="p-4 bg-card/40 border-border/60 rounded-2xl">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" /> Recent Tests Log
              </h3>
              <div className="divide-y divide-border/30 text-xs">
                {resultsHistory.slice(0, 5).map((res, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-muted-foreground">#{i + 1}</span>
                      <div>
                        <div className="font-bold">{res.wpm} WPM <span className="text-muted-foreground font-normal">({res.accuracy}% Acc)</span></div>
                        <div className="text-[10px] text-muted-foreground capitalize">{res.mode} • {res.difficulty}</div>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground">
                      <div>{res.cpm} CPM</div>
                      <div>{res.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
