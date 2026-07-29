"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BookOpen,
  Trophy,
  Shuffle,
  CheckCircle2,
  RotateCcw,
  Volume2,
  VolumeX,
  Lightbulb,
  Clock,
  Flame,
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  HelpCircle,
  Play,
  Heart,
  ChevronRight,
  Star,
  Info,
  Check,
  X,
  RefreshCw,
  Plus
} from "lucide-react"

// Types
export type GameMode = "timed" | "level" | "survival" | "zen"
export type Difficulty = "easy" | "medium" | "hard" | "expert"
export type CategoryKey = "all" | "animals" | "geography" | "food" | "tech" | "nature" | "vocab" | "gaming"

interface WordData {
  word: string
  hint: string
  category: CategoryKey
  difficulty: Difficulty
}

interface TileItem {
  id: string
  letter: string
  originalIndex: number
}

interface WordScrambleGameProps {
  onBack?: () => void
  themeColor?: string
}

// ----------------------------------------------------
// CURATED DICTIONARY SYSTEM
// ----------------------------------------------------
const WORD_DICTIONARY: WordData[] = [
  // EASY WORDS (3-5 letters)
  { word: "CAT", hint: "Small domesticated carnivorous mammal with soft fur", category: "animals", difficulty: "easy" },
  { word: "DOG", hint: "Man's best four-legged friend", category: "animals", difficulty: "easy" },
  { word: "LION", hint: "King of the jungle", category: "animals", difficulty: "easy" },
  { word: "BEAR", hint: "Large heavy mammal with thick fur", category: "animals", difficulty: "easy" },
  { word: "FISH", hint: "Limbless cold-blooded vertebrate living in water", category: "animals", difficulty: "easy" },
  { word: "BIRD", hint: "Feathered warm-blooded vertebrate with wings", category: "animals", difficulty: "easy" },
  { word: "FROG", hint: "Tailless amphibian with long hind legs for leaping", category: "animals", difficulty: "easy" },
  
  { word: "ROME", hint: "Capital city of Italy", category: "geography", difficulty: "easy" },
  { word: "PERU", hint: "South American country home to Machu Picchu", category: "geography", difficulty: "easy" },
  { word: "ASIA", hint: "The world's largest continent", category: "geography", difficulty: "easy" },
  { word: "NILE", hint: "Famous long river flowing through Egypt", category: "geography", difficulty: "easy" },
  
  { word: "TACO", hint: "Mexican dish consisting of a folded tortilla", category: "food", difficulty: "easy" },
  { word: "SOUP", hint: "Liquid dish made by boiling meat or vegetables", category: "food", difficulty: "easy" },
  { word: "MILK", hint: "White nutrient-rich liquid produced by mammals", category: "food", difficulty: "easy" },
  { word: "RICE", hint: "Staple grain grown in flooded paddies", category: "food", difficulty: "easy" },
  { word: "CAKE", hint: "Sweet baked dessert food", category: "food", difficulty: "easy" },
  
  { word: "BYTE", hint: "Unit of digital information consisting of 8 bits", category: "tech", difficulty: "easy" },
  { word: "CODE", hint: "System of instructions written for a computer", category: "tech", difficulty: "easy" },
  { word: "CHIP", hint: "Microprocessor integrated circuit", category: "tech", difficulty: "easy" },
  { word: "DATA", hint: "Quantities, characters, or symbols on which computer operations are performed", category: "tech", difficulty: "easy" },
  
  { word: "TREE", hint: "Woody perennial plant having a single main trunk", category: "nature", difficulty: "easy" },
  { word: "RAIN", hint: "Moisture condensed from the atmosphere that falls in drops", category: "nature", difficulty: "easy" },
  { word: "SNOW", hint: "Atmospheric water vapor frozen into ice crystals", category: "nature", difficulty: "easy" },
  { word: "MOON", hint: "Natural satellite of the Earth", category: "nature", difficulty: "easy" },
  { word: "STAR", hint: "Luminous astronomical object in space", category: "nature", difficulty: "easy" },
  
  { word: "GLOW", hint: "To emit steady light without flame", category: "vocab", difficulty: "easy" },
  { word: "BOLD", hint: "Showing a willingness to take risks; confident", category: "vocab", difficulty: "easy" },
  { word: "PEAK", hint: "The pointed top of a mountain or highest point", category: "vocab", difficulty: "easy" },
  
  { word: "PONG", hint: "One of the earliest arcade video games", category: "gaming", difficulty: "easy" },
  { word: "BOSS", hint: "Major enemy encounter at the end of a level", category: "gaming", difficulty: "easy" },
  { word: "PING", hint: "Latency measurement in online multiplayer games", category: "gaming", difficulty: "easy" },

  // MEDIUM WORDS (5-7 letters)
  { word: "MONKEY", hint: "Tree-dwelling primate with a tail", category: "animals", difficulty: "medium" },
  { word: "TIGER", hint: "Large solitary striped wild cat", category: "animals", difficulty: "medium" },
  { word: "DOLPHIN", hint: "Highly intelligent aquatic marine mammal", category: "animals", difficulty: "medium" },
  { word: "EAGLE", hint: "Large bird of prey with keen eyesight", category: "animals", difficulty: "medium" },
  { word: "FALCON", hint: "Fast predatory bird capable of high-speed diving", category: "animals", difficulty: "medium" },
  { word: "PANTHER", hint: "Melanistic leopard or jaguar", category: "animals", difficulty: "medium" },
  
  { word: "BRAZIL", hint: "Largest country in South America", category: "geography", difficulty: "medium" },
  { word: "CANADA", hint: "Second largest country by land area", category: "geography", difficulty: "medium" },
  { word: "FRANCE", hint: "European nation famous for fashion and cuisine", category: "geography", difficulty: "medium" },
  { word: "GREECE", hint: "Southern European country of islands and ancient history", category: "geography", difficulty: "medium" },
  { word: "LONDON", hint: "Capital of the United Kingdom along River Thames", category: "geography", difficulty: "medium" },
  
  { word: "PIZZA", hint: "Italian baked flatbread topped with tomato & cheese", category: "food", difficulty: "medium" },
  { word: "BURGER", hint: "Sandwich consisting of a patty inside a split bun", category: "food", difficulty: "medium" },
  { word: "PASTA", hint: "Italian food made from wheat dough extruded into shapes", category: "food", difficulty: "medium" },
  { word: "CHEESE", hint: "Dairy product derived from milk curd", category: "food", difficulty: "medium" },
  { word: "BANANA", hint: "Yellow elongated tropical fruit rich in potassium", category: "food", difficulty: "medium" },
  
  { word: "SERVER", hint: "Computer program or device providing service to clients", category: "tech", difficulty: "medium" },
  { word: "PYTHON", hint: "Popular high-level interpreted programming language", category: "tech", difficulty: "medium" },
  { word: "SCREEN", hint: "Flat surface display showing images or text", category: "tech", difficulty: "medium" },
  { word: "PIXEL", hint: "Smallest basic unit of programmable color on a display", category: "tech", difficulty: "medium" },
  { word: "MODEM", hint: "Hardware device converting digital and analog signals", category: "tech", difficulty: "medium" },
  
  { word: "FOREST", hint: "Large ecosystem dominated by trees and flora", category: "nature", difficulty: "medium" },
  { word: "CANTON", hint: "Subdivision of a country or mountain district", category: "nature", difficulty: "medium" },
  { word: "CANYON", hint: "Deep gorge with steep sides carved by rivers", category: "nature", difficulty: "medium" },
  { word: "DESERT", hint: "Barren area of landscape where little precipitation occurs", category: "nature", difficulty: "medium" },
  { word: "GEIGER", hint: "Counter instrument measuring ionizing radiation", category: "nature", difficulty: "medium" },
  
  { word: "AURORA", hint: "Natural light display in the Earth's sky", category: "vocab", difficulty: "medium" },
  { word: "ECLIPSE", hint: "Obscuring of light from one celestial body by another", category: "vocab", difficulty: "medium" },
  { word: "HARMONY", hint: "Pleasing arrangement or combination of parts", category: "vocab", difficulty: "medium" },
  { word: "SERENE", hint: "Calm, peaceful, and untroubled", category: "vocab", difficulty: "medium" },
  
  { word: "AVATAR", hint: "Icon or figure representing a player in games", category: "gaming", difficulty: "medium" },
  { word: "HEALTH", hint: "Hit points meter determining character survival", category: "gaming", difficulty: "medium" },
  { word: "SHIELD", hint: "Protective barrier deflecting enemy damage", category: "gaming", difficulty: "medium" },
  { word: "HITBOX", hint: "Invisible shape determining collision detection", category: "gaming", difficulty: "medium" },

  // HARD WORDS (7-9 letters)
  { word: "ELEPHANT", hint: "Largest living land mammal with a long trunk", category: "animals", difficulty: "hard" },
  { word: "FLAMINGO", hint: "Tall wading bird known for pink feathers", category: "animals", difficulty: "hard" },
  { word: "KANGAROO", hint: "Large Australian marsupial with powerful hind legs", category: "animals", difficulty: "hard" },
  { word: "CHEETAH", hint: "Fastest land animal on planet earth", category: "animals", difficulty: "hard" },
  { word: "OCTOPUS", hint: "Soft-bodied eight-armed marine mollusk", category: "animals", difficulty: "hard" },
  
  { word: "AUSTRALIA", hint: "Country and continent surrounded by Indian & Pacific oceans", category: "geography", difficulty: "hard" },
  { word: "PORTUGAL", hint: "Southern European nation on the Iberian Peninsula", category: "geography", difficulty: "hard" },
  { word: "SINGAPORE", hint: "Island city-state in Southeast Asia", category: "geography", difficulty: "hard" },
  { word: "HIMALAYA", hint: "Mountain range containing Mount Everest", category: "geography", difficulty: "hard" },
  
  { word: "SPAGHETTI", hint: "Long, thin, solid cylindrical pasta", category: "food", difficulty: "hard" },
  { word: "CHOCOLATE", hint: "Food preparation from roasted cacao seeds", category: "food", difficulty: "hard" },
  { word: "SANDWICH", hint: "Food consisting of filling between bread slices", category: "food", difficulty: "hard" },
  { word: "AVOCADO", hint: "Pear-shaped fruit with dark green skin and buttery flesh", category: "food", difficulty: "hard" },
  
  { word: "DATABASE", hint: "Structured set of data held in a computer system", category: "tech", difficulty: "hard" },
  { word: "COMPUTER", hint: "Electronic machine for storing and processing data", category: "tech", difficulty: "hard" },
  { word: "KEYBOARD", hint: "Panel of keys used to input text into computers", category: "tech", difficulty: "hard" },
  { word: "INTERNET", hint: "Global computer network providing information facilities", category: "tech", difficulty: "hard" },
  { word: "ALGORITHM", hint: "Process or set of rules followed in calculations", category: "tech", difficulty: "hard" },
  
  { word: "MOUNTAIN", hint: "Large natural elevation of earth's surface", category: "nature", difficulty: "hard" },
  { word: "WATERFALL", hint: "Cascade of water falling from a height", category: "nature", difficulty: "hard" },
  { word: "RAINBOW", hint: "Arc of colors formed in sky by refraction of sunlight", category: "nature", difficulty: "hard" },
  { word: "VOLCANO", hint: "Mountain having a crater through which lava erupts", category: "nature", difficulty: "hard" },
  
  { word: "ENIGMATIC", hint: "Difficult to interpret or understand; mysterious", category: "vocab", difficulty: "hard" },
  { word: "RESILIENT", hint: "Able to withstand or recover quickly from difficult conditions", category: "vocab", difficulty: "hard" },
  { word: "LUMINOUS", hint: "Full of or shedding light; bright or shining", category: "vocab", difficulty: "hard" },
  { word: "SYNERGY", hint: "Combined effect greater than the sum of separate effects", category: "vocab", difficulty: "hard" },
  
  { word: "CHECKPOINT", hint: "Saved state position in game progression", category: "gaming", difficulty: "hard" },
  { word: "MULTIPLAYER", hint: "Game designed for more than one player simultaneously", category: "gaming", difficulty: "hard" },
  { word: "INVENTORY", hint: "Grid or list storing carried items and gear", category: "gaming", difficulty: "hard" },

  // EXPERT WORDS (9-12+ letters)
  { word: "CHAMELEON", hint: "Lizard capable of changing skin color for camouflage", category: "animals", difficulty: "expert" },
  { word: "RHINOCEROS", hint: "Large thick-skinned herbivore with one or two horns", category: "animals", difficulty: "expert" },
  { word: "HIPPOPOTAMUS", hint: "Large semi-aquatic African mammal", category: "animals", difficulty: "expert" },
  
  { word: "MADAGASCAR", hint: "Island country off the southeastern coast of Africa", category: "geography", difficulty: "expert" },
  { word: "SWITZERLAND", hint: "Mountainous Central European country of lakes & Alps", category: "geography", difficulty: "expert" },
  { word: "AZERBAIJAN", hint: "Nation bounded by the Caspian Sea and Caucasus Mountains", category: "geography", difficulty: "expert" },
  
  { word: "MARSHMALLOW", hint: "Spongy confection made of sugar, water and gelatin", category: "food", difficulty: "expert" },
  { word: "CAPPUCCINO", hint: "Italian coffee drink prepared with espresso and steamed milk", category: "food", difficulty: "expert" },
  { word: "PINEAPPLE", hint: "Large tropical fruit with spiky leaves and sweet yellow flesh", category: "food", difficulty: "expert" },
  
  { word: "CYBERSECURITY", hint: "State or process of protecting computer networks from attacks", category: "tech", difficulty: "expert" },
  { word: "PROGRAMMING", hint: "Process of writing instructions for computing systems", category: "tech", difficulty: "expert" },
  { word: "MICROPROCESSOR", hint: "Integrated circuit containing central processing unit", category: "tech", difficulty: "expert" },
  { word: "ARCHITECTURE", hint: "Conceptual structure and design of complex software", category: "tech", difficulty: "expert" },
  
  { word: "PHOTOSYNTHESIS", hint: "Process by which green plants synthesize nutrients from light", category: "nature", difficulty: "expert" },
  { word: "CONSTELLATION", hint: "Group of stars forming a recognized pattern in night sky", category: "nature", difficulty: "expert" },
  { word: "ATMOSPHERE", hint: "Envelope of gases surrounding the earth or another planet", category: "nature", difficulty: "expert" },
  
  { word: "PERSEVERANCE", hint: "Persistence in doing something despite difficulty or delay", category: "vocab", difficulty: "expert" },
  { word: "QUINTESSENTIAL", hint: "Representing the most perfect or typical example of a quality", category: "vocab", difficulty: "expert" },
  { word: "MAGNANIMOUS", hint: "Generous or forgiving, especially toward a rival", category: "vocab", difficulty: "expert" },
  
  { word: "SPEEDRUNNING", hint: "Playthrough of a video game done with the intent of finishing as fast as possible", category: "gaming", difficulty: "expert" },
  { word: "LEADERBOARD", hint: "Scoreboard displaying names and ranks of top players", category: "gaming", difficulty: "expert" },
  { word: "ACHIEVEMENT", hint: "Unlockable badge awarded for completing special challenges", category: "gaming", difficulty: "expert" }
]

// Level Configuration for Adventure Mode
const LEVEL_CONFIGS = Array.from({ length: 15 }, (_, i) => {
  const levelNum = i + 1
  let diff: Difficulty = "easy"
  if (levelNum > 4) diff = "medium"
  if (levelNum > 8) diff = "hard"
  if (levelNum > 12) diff = "expert"

  return {
    level: levelNum,
    targetWords: Math.min(3 + Math.floor(levelNum / 3), 7),
    timeLimit: Math.max(90 - levelNum * 3, 45),
    targetScore: levelNum * 120,
    difficulty: diff
  }
})

// ----------------------------------------------------
// SOUND SYNTHESIZER (WEB AUDIO API)
// ----------------------------------------------------
class SoundSystem {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
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

  public setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  public playSound(type: "click" | "place" | "clear" | "shuffle" | "correct" | "wrong" | "hint" | "time" | "win" | "gameover" | "tick") {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    try {
      if (type === "click" || type === "place") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(type === "place" ? 440 : 330, now)
        osc.frequency.exponentialRampToValueAtTime(type === "place" ? 880 : 550, now + 0.08)
        gain.gain.setValueAtTime(0.12, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === "clear") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.12)
      } else if (type === "shuffle") {
        for (let i = 0; i < 4; i++) {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = "sine"
          const freq = 200 + Math.random() * 400
          osc.frequency.setValueAtTime(freq, now + i * 0.03)
          gain.gain.setValueAtTime(0.08, now + i * 0.03)
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.03 + 0.05)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now + i * 0.03)
          osc.stop(now + i * 0.03 + 0.05)
        }
      } else if (type === "correct") {
        const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          if (!this.ctx) return
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = "triangle"
          osc.frequency.setValueAtTime(freq, now + idx * 0.07)
          gain.gain.setValueAtTime(0.2, now + idx * 0.07)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now + idx * 0.07)
          osc.stop(now + idx * 0.07 + 0.3)
        })
      } else if (type === "wrong") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.25)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === "hint" || type === "time") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(587.33, now) // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15) // A5
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (type === "tick") {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "square"
        osc.frequency.setValueAtTime(800, now)
        gain.gain.setValueAtTime(0.04, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.04)
      } else if (type === "win") {
        const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5]
        chords.forEach((freq, i) => {
          if (!this.ctx) return
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, now + i * 0.1)
          gain.gain.setValueAtTime(0.18, now + i * 0.1)
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now + i * 0.1)
          osc.stop(now + i * 0.1 + 0.5)
        })
      } else if (type === "gameover") {
        const notes = [400, 350, 300, 250]
        notes.forEach((freq, idx) => {
          if (!this.ctx) return
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(freq, now + idx * 0.12)
          gain.gain.setValueAtTime(0.15, now + idx * 0.12)
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now + idx * 0.12)
          osc.stop(now + idx * 0.12 + 0.3)
        })
      }
    } catch {
      // Audio fallback
    }
  }
}

const soundManager = new SoundSystem()

// Helper to scramble letters ensuring it's not identical to the target word
const scrambleString = (word: string): string => {
  if (word.length <= 1) return word
  const arr = word.split("")
  let scrambled = ""
  let attempts = 0
  
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    scrambled = arr.join("")
    attempts++
  } while (scrambled === word && attempts < 15)

  return scrambled
}

export default function WordScrambleGame({ onBack, themeColor = "#8b5cf6" }: WordScrambleGameProps) {
  // Navigation & Config States
  const [gameState, setGameState] = useState<"menu" | "level_select" | "playing" | "round_summary" | "game_over">("menu")
  const [mode, setMode] = useState<GameMode>("timed")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [category, setCategory] = useState<CategoryKey>("all")
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  // Current Puzzle State
  const [currentWordData, setCurrentWordData] = useState<WordData | null>(null)
  const [availableTiles, setAvailableTiles] = useState<TileItem[]>([])
  const [placedTiles, setPlacedTiles] = useState<(TileItem | null)[]>([])
  const [usedWordsHistory, setUsedWordsHistory] = useState<string[]>([])
  
  // Game Metrics & Scoring
  const [score, setScore] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [bestStreak, setBestStreak] = useState<number>(0)
  const [wordsSolved, setWordsSolved] = useState<number>(0)
  const [lives, setLives] = useState<number>(3)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [showHint, setShowHint] = useState<boolean>(false)
  const [isShake, setIsShake] = useState<boolean>(false)
  const [isCorrectFlash, setIsCorrectFlash] = useState<boolean>(false)

  // High Scores & Statistics
  const [highScores, setHighScores] = useState<Record<string, number>>({})
  const [levelStars, setLevelStars] = useState<Record<number, number>>({})

  // Confetti / FX Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Load Saved Stats
  useEffect(() => {
    try {
      const savedScores = localStorage.getItem("word_scramble_high_scores")
      if (savedScores) setHighScores(JSON.parse(savedScores))

      const savedStars = localStorage.getItem("word_scramble_level_stars")
      if (savedStars) setLevelStars(JSON.parse(savedStars))

      const savedSound = localStorage.getItem("word_scramble_sound")
      if (savedSound !== null) {
        const enabled = savedSound === "true"
        setSoundEnabled(enabled)
        soundManager.setEnabled(enabled)
      }
    } catch {
      // Storage fallback
    }
  }, [])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundManager.setEnabled(next)
    try {
      localStorage.setItem("word_scramble_sound", String(next))
    } catch {}
  }

  // Save High Score
  const updateHighScore = useCallback((newScore: number) => {
    const key = `${mode}_${difficulty}_${category}`
    setHighScores((prev) => {
      const prevBest = prev[key] || 0
      if (newScore > prevBest) {
        const updated = { ...prev, [key]: newScore }
        try {
          localStorage.setItem("word_scramble_high_scores", JSON.stringify(updated))
        } catch {}
        return updated
      }
      return prev
    })
  }, [mode, difficulty, category])

  // Trigger Confetti Effect
  const triggerConfetti = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[] = []
    const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4"]

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        alpha: 1
      })
    }

    let animationFrameId: number
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let active = false

      particles.forEach((p) => {
        if (p.alpha > 0.01) {
          active = true
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.2
          p.alpha *= 0.96
          ctx.save()
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })

      if (active) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Select Next Word from Dictionary
  const pickNextWord = useCallback(
    (targetDifficulty: Difficulty = difficulty, targetCategory: CategoryKey = category) => {
      let filtered = WORD_DICTIONARY.filter((item) => {
        const matchesDiff = targetDifficulty === item.difficulty
        const matchesCat = targetCategory === "all" || item.category === targetCategory
        return matchesDiff && matchesCat
      })

      if (filtered.length === 0) {
        // Fallback to any difficulty matching category if empty
        filtered = WORD_DICTIONARY.filter((item) => targetCategory === "all" || item.category === targetCategory)
      }

      // Avoid immediate word repetition
      const unplayed = filtered.filter((w) => !usedWordsHistory.includes(w.word))
      const pool = unplayed.length > 0 ? unplayed : filtered
      const selected = pool[Math.floor(Math.random() * pool.length)]

      if (!selected) return

      const scrambled = scrambleString(selected.word)
      const tiles: TileItem[] = scrambled.split("").map((letter, idx) => ({
        id: `${letter}_${idx}_${Math.random()}`,
        letter,
        originalIndex: idx
      }))

      setCurrentWordData(selected)
      setAvailableTiles(tiles)
      setPlacedTiles(new Array(selected.word.length).fill(null))
      setShowHint(false)
      setUsedWordsHistory((prev) => [...prev.slice(-20), selected.word])
    },
    [difficulty, category, usedWordsHistory]
  )

  // Start New Game Session
  const startGameSession = (selectedMode: GameMode, selectedLevel: number = 1) => {
    soundManager.playSound("click")
    setMode(selectedMode)
    setCurrentLevel(selectedLevel)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setWordsSolved(0)
    setLives(3)
    setUsedWordsHistory([])
    setIsShake(false)
    setIsCorrectFlash(false)

    if (selectedMode === "level") {
      const cfg = LEVEL_CONFIGS[selectedLevel - 1]
      setDifficulty(cfg.difficulty)
      setTimeLeft(cfg.timeLimit)
      pickNextWord(cfg.difficulty, category)
    } else {
      setTimeLeft(selectedMode === "timed" ? 60 : 0)
      pickNextWord(difficulty, category)
    }

    setGameState("playing")
  }

  // Handle Tile Selection (Click on available tile -> Moves to first empty target slot)
  const handleSelectTile = (tile: TileItem) => {
    if (isShake || isCorrectFlash) return
    const firstEmptyIndex = placedTiles.findIndex((slot) => slot === null)
    if (firstEmptyIndex === -1) return

    soundManager.playSound("place")
    const newPlaced = [...placedTiles]
    newPlaced[firstEmptyIndex] = tile
    setPlacedTiles(newPlaced)

    setAvailableTiles((prev) => prev.filter((t) => t.id !== tile.id))
  }

  // Handle Target Slot Click (Click on target slot -> Moves tile back to available)
  const handleUnselectSlot = (index: number) => {
    if (isShake || isCorrectFlash) return
    const tile = placedTiles[index]
    if (!tile) return

    soundManager.playSound("clear")
    const newPlaced = [...placedTiles]
    newPlaced[index] = null
    setPlacedTiles(newPlaced)

    setAvailableTiles((prev) => [...prev, tile])
  }

  // Shuffle Available Tiles
  const handleShuffleTiles = () => {
    if (availableTiles.length <= 1) return
    soundManager.playSound("shuffle")
    setAvailableTiles((prev) => {
      const shuffled = [...prev]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    })
  }

  // Clear All Placed Tiles
  const handleClearAll = () => {
    soundManager.playSound("clear")
    const activePlaced = placedTiles.filter((t): t is TileItem => t !== null)
    setAvailableTiles((prev) => [...prev, ...activePlaced])
    setPlacedTiles(new Array(currentWordData?.word.length || 0).fill(null))
  }

  // Check & Submit Solution
  const handleSubmitWord = useCallback(() => {
    if (!currentWordData || isShake || isCorrectFlash) return
    const currentGuess = placedTiles.map((t) => t?.letter || "").join("")

    if (currentGuess.length < currentWordData.word.length) {
      soundManager.playSound("wrong")
      setIsShake(true)
      setTimeout(() => setIsShake(false), 500)
      return
    }

    if (currentGuess === currentWordData.word) {
      // CORRECT ANSWER!
      soundManager.playSound("correct")
      triggerConfetti()
      setIsCorrectFlash(true)

      const wordPoints = currentWordData.word.length * 15
      const streakBonus = streak * 10
      const diffBonus = difficulty === "expert" ? 50 : difficulty === "hard" ? 30 : difficulty === "medium" ? 15 : 0
      const totalWordScore = wordPoints + streakBonus + diffBonus

      const nextScore = score + totalWordScore
      const nextStreak = streak + 1
      const nextSolved = wordsSolved + 1

      setScore(nextScore)
      setStreak(nextStreak)
      if (nextStreak > bestStreak) setBestStreak(nextStreak)
      setWordsSolved(nextSolved)
      updateHighScore(nextScore)

      // Level Mode Completion Check
      if (mode === "level") {
        const cfg = LEVEL_CONFIGS[currentLevel - 1]
        if (nextSolved >= cfg.targetWords || nextScore >= cfg.targetScore) {
          // Calculate Star Rating (1-3 stars)
          const stars = nextScore >= cfg.targetScore * 1.4 ? 3 : nextScore >= cfg.targetScore ? 2 : 1
          const updatedStars = { ...levelStars, [currentLevel]: Math.max(levelStars[currentLevel] || 0, stars) }
          setLevelStars(updatedStars)
          try {
            localStorage.setItem("word_scramble_level_stars", JSON.stringify(updatedStars))
          } catch {}

          setTimeout(() => {
            soundManager.playSound("win")
            setGameState("round_summary")
          }, 800)
          return
        }
      }

      // Next Word Transition
      setTimeout(() => {
        setIsCorrectFlash(false)
        if (mode === "level") {
          const cfg = LEVEL_CONFIGS[currentLevel - 1]
          pickNextWord(cfg.difficulty, category)
        } else {
          pickNextWord(difficulty, category)
        }
      }, 900)
    } else {
      // INCORRECT ANSWER
      soundManager.playSound("wrong")
      setIsShake(true)
      setStreak(0)

      if (mode === "survival") {
        const nextLives = lives - 1
        setLives(nextLives)
        if (nextLives <= 0) {
          setTimeout(() => {
            soundManager.playSound("gameover")
            setGameState("game_over")
          }, 600)
          return
        }
      }

      setTimeout(() => {
        setIsShake(false)
      }, 600)
    }
  }, [currentWordData, placedTiles, isShake, isCorrectFlash, streak, difficulty, score, wordsSolved, updateHighScore, mode, currentLevel, levelStars, triggerConfetti, pickNextWord, category, lives, bestStreak])

  // POWER-UPS: Reveal Next Correct Letter
  const handleRevealLetter = () => {
    if (!currentWordData) return
    const targetWord = currentWordData.word
    const emptySlotIdx = placedTiles.findIndex((slot, i) => slot === null || slot.letter !== targetWord[i])

    if (emptySlotIdx === -1) return

    soundManager.playSound("hint")

    const neededLetter = targetWord[emptySlotIdx]
    let matchingTile = availableTiles.find((t) => t.letter === neededLetter)

    // If letter is currently placed in a wrong slot, unplace it first
    if (!matchingTile) {
      const wrongSlotIdx = placedTiles.findIndex((t) => t !== null && t.letter === neededLetter)
      if (wrongSlotIdx !== -1) {
        matchingTile = placedTiles[wrongSlotIdx]!
        placedTiles[wrongSlotIdx] = null
      }
    }

    if (!matchingTile) return

    const newPlaced = [...placedTiles]
    newPlaced[emptySlotIdx] = matchingTile
    setPlacedTiles(newPlaced)
    setAvailableTiles((prev) => prev.filter((t) => t.id !== matchingTile!.id))

    // Penalty of 10 score points for using reveal hint
    setScore((prev) => Math.max(0, prev - 10))
  }

  // POWER-UPS: Add Bonus Time (+10s)
  const handleAddTime = () => {
    soundManager.playSound("time")
    setTimeLeft((prev) => prev + 10)
    setScore((prev) => Math.max(0, prev - 15))
  }

  // Physical Keyboard Input Listener
  useEffect(() => {
    if (gameState !== "playing" || !currentWordData) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()

      // Letter typing A-Z
      if (/^[A-Z]$/.test(key)) {
        const matchingTile = availableTiles.find((t) => t.letter === key)
        if (matchingTile) {
          handleSelectTile(matchingTile)
        }
      } else if (e.key === "Backspace") {
        e.preventDefault()
        // Remove last filled tile
        const lastFilledIdx = [...placedTiles].map((t) => t !== null).lastIndexOf(true)
        if (lastFilledIdx !== -1) {
          handleUnselectSlot(lastFilledIdx)
        }
      } else if (e.key === "Enter") {
        e.preventDefault()
        handleSubmitWord()
      } else if (e.key === " ") {
        e.preventDefault()
        handleShuffleTiles()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, currentWordData, availableTiles, placedTiles, handleSubmitWord])

  // Timer Effect (Timed & Level Modes)
  useEffect(() => {
    if (gameState !== "playing") return
    if (mode === "zen" || mode === "survival") return

    if (timeLeft <= 0) {
      soundManager.playSound("gameover")
      if (mode === "level") {
        setGameState("round_summary")
      } else {
        setGameState("game_over")
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 6 && prev > 1) soundManager.playSound("tick")
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, timeLeft, mode])

  const currentHighScoreKey = `${mode}_${difficulty}_${category}`
  const currentHighScore = highScores[currentHighScoreKey] || 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Background Animated Canvas Particle Mesh / Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_20%,#8b5cf6_0%,transparent_60%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-30" />

      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between z-20 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="icon"
              className="bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 font-black text-white text-xl"
              style={{ backgroundColor: themeColor }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
                Word Scramble
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-semibold">
                  PRO
                </span>
              </h1>
              <p className="text-xs text-slate-400">Unscramble letters, master vocabulary!</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={toggleSound}
            variant="outline"
            size="icon"
            className="bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-purple-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </Button>

          {gameState === "playing" && (
            <Button
              onClick={() => setGameState("menu")}
              variant="outline"
              size="sm"
              className="bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Menu
            </Button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER AREA */}
      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center items-center py-6 z-20">
        {/* ========================================================================= */}
        {/* 1. MENU STATE */}
        {/* ========================================================================= */}
        {gameState === "menu" && (
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Hero Header Card */}
            <Card className="bg-slate-900/90 border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-48 h-48 text-purple-400" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Modern Anagram Puzzle Engine
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                Unscramble & Conquer
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base mb-6">
                Challenge your mind with hundreds of curated words across 8 categories, 4 difficulty tiers, and interactive tile controls!
              </p>

              {/* Mode Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <button
                  onClick={() => setMode("timed")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    mode === "timed"
                      ? "bg-purple-600/20 border-purple-500/80 text-white shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/40"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Clock className={`w-6 h-6 mb-2 ${mode === "timed" ? "text-purple-400" : "text-slate-500"}`} />
                  <div>
                    <div className="font-bold text-sm">Classic Timed</div>
                    <div className="text-[11px] text-slate-400">Race the 60s clock</div>
                  </div>
                </button>

                <button
                  onClick={() => setMode("level")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    mode === "level"
                      ? "bg-cyan-600/20 border-cyan-500/80 text-white shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/40"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Trophy className={`w-6 h-6 mb-2 ${mode === "level" ? "text-cyan-400" : "text-slate-500"}`} />
                  <div>
                    <div className="font-bold text-sm">Adventure</div>
                    <div className="text-[11px] text-slate-400">15 Level Map</div>
                  </div>
                </button>

                <button
                  onClick={() => setMode("survival")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    mode === "survival"
                      ? "bg-rose-600/20 border-rose-500/80 text-white shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/40"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Heart className={`w-6 h-6 mb-2 ${mode === "survival" ? "text-rose-400" : "text-slate-500"}`} />
                  <div>
                    <div className="font-bold text-sm">Survival</div>
                    <div className="text-[11px] text-slate-400">3 Strikes Max</div>
                  </div>
                </button>

                <button
                  onClick={() => setMode("zen")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    mode === "zen"
                      ? "bg-emerald-600/20 border-emerald-500/80 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className={`w-6 h-6 mb-2 ${mode === "zen" ? "text-emerald-400" : "text-slate-500"}`} />
                  <div>
                    <div className="font-bold text-sm">Zen Mode</div>
                    <div className="text-[11px] text-slate-400">Relaxed untimed</div>
                  </div>
                </button>
              </div>

              {/* Difficulty Selection */}
              {mode !== "level" && (
                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
                    {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all ${
                          difficulty === d
                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Category Filter
                </label>
                <div className="flex flex-wrap justify-center gap-1.5 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
                  {[
                    { key: "all", label: "All Categories" },
                    { key: "animals", label: "🐾 Animals" },
                    { key: "geography", label: "🌍 Geography" },
                    { key: "food", label: "🍕 Food" },
                    { key: "tech", label: "💻 Science & Tech" },
                    { key: "nature", label: "🌿 Nature" },
                    { key: "vocab", label: "📚 Vocab" },
                    { key: "gaming", label: "🎮 Gaming" }
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCategory(cat.key as CategoryKey)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                        category === cat.key
                          ? "bg-slate-800 text-purple-300 border border-purple-500/40"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {mode === "level" ? (
                  <Button
                    onClick={() => setGameState("level_select")}
                    className="w-full py-6 rounded-2xl text-base font-bold text-white shadow-xl shadow-cyan-600/20 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                  >
                    Select Level Map <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => startGameSession(mode)}
                    className="w-full py-6 rounded-2xl text-base font-bold text-white shadow-xl shadow-purple-600/30 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" /> Start Game
                  </Button>
                )}
              </div>

              {/* High Score Badge */}
              {currentHighScore > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
                  <Trophy className="w-3.5 h-3.5" /> Best High Score: {currentHighScore} pts
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. LEVEL SELECT STATE */}
        {/* ========================================================================= */}
        {gameState === "level_select" && (
          <div className="w-full max-w-3xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black text-white">Adventure Map</h2>
                <p className="text-xs text-slate-400">Complete levels to earn 3-star ratings</p>
              </div>
              <Button
                onClick={() => setGameState("menu")}
                variant="outline"
                size="sm"
                className="bg-slate-900 border-slate-700 text-slate-300"
              >
                Back to Menu
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {LEVEL_CONFIGS.map((cfg) => {
                const stars = levelStars[cfg.level] || 0
                const unlocked = cfg.level === 1 || (levelStars[cfg.level - 1] || 0) > 0

                return (
                  <button
                    key={cfg.level}
                    disabled={!unlocked}
                    onClick={() => startGameSession("level", cfg.level)}
                    className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                      unlocked
                        ? "bg-slate-900/90 border-slate-800 hover:border-cyan-500/80 hover:bg-slate-800 text-white shadow-lg"
                        : "bg-slate-950/40 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-400 uppercase">Lvl {cfg.level}</div>
                    <div className="text-xl font-extrabold my-2 text-cyan-300">{cfg.targetScore} pts</div>

                    {/* Star Rating Display */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= stars ? "text-amber-400 fill-amber-400" : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. PLAYING STATE */}
        {/* ========================================================================= */}
        {gameState === "playing" && currentWordData && (
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Scoreboard HUD */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <Card className="bg-slate-900/80 border-slate-800 p-3 rounded-2xl text-center shadow-lg">
                <div className="text-xs text-slate-400 font-medium">Score</div>
                <div className="text-xl sm:text-2xl font-black text-purple-400">{score}</div>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 p-3 rounded-2xl text-center shadow-lg">
                <div className="text-xs text-slate-400 font-medium">
                  {mode === "survival" ? "Lives" : mode === "zen" ? "Words" : "Time Left"}
                </div>
                <div className="text-xl sm:text-2xl font-black text-cyan-400 flex items-center justify-center gap-1">
                  {mode === "survival" ? (
                    <span className="text-rose-400 flex items-center">
                      {"❤️".repeat(lives)}
                    </span>
                  ) : mode === "zen" ? (
                    wordsSolved
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-cyan-400 inline" /> {timeLeft}s
                    </>
                  )}
                </div>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 p-3 rounded-2xl text-center shadow-lg">
                <div className="text-xs text-slate-400 font-medium">Streak</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> {streak}x
                </div>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 p-3 rounded-2xl text-center shadow-lg capitalize">
                <div className="text-xs text-slate-400 font-medium">Category</div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1 truncate">
                  {currentWordData.category}
                </div>
              </Card>
            </div>

            {/* Main Interactive Word Board Card */}
            <Card
              className={`bg-slate-900/90 border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center transition-all ${
                isShake ? "animate-bounce border-rose-500/80 ring-2 ring-rose-500/50" : ""
              } ${isCorrectFlash ? "border-emerald-500/80 ring-2 ring-emerald-500/50 bg-emerald-950/20" : ""}`}
            >
              {/* Hint Box */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 mb-2">
                  <Info className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium text-slate-300">Category Clue:</span>
                  <span className="capitalize text-purple-300 font-bold">{currentWordData.category}</span>
                </div>

                {showHint && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm animate-in fade-in">
                    💡 <span className="font-semibold">Definition:</span> {currentWordData.hint}
                  </div>
                )}
              </div>

              {/* TARGET PLACED SLOTS (ROW 1) */}
              <div className="mb-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Your Answer ({placedTiles.filter(Boolean).length} / {currentWordData.word.length})
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {placedTiles.map((slotTile, idx) => (
                    <button
                      key={`slot_${idx}`}
                      onClick={() => handleUnselectSlot(idx)}
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl font-black text-2xl sm:text-3xl flex items-center justify-center transition-all shadow-md ${
                        slotTile
                          ? "bg-purple-600 text-white border-2 border-purple-400 shadow-purple-500/30 scale-105"
                          : "bg-slate-950/80 border-2 border-dashed border-slate-700 text-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {slotTile ? slotTile.letter : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* AVAILABLE SCRAMBLED TILES (ROW 2) */}
              <div className="mb-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Click or Type Letters
                </div>
                <div className="flex flex-wrap justify-center gap-2 min-h-[4rem]">
                  {availableTiles.map((tile) => (
                    <button
                      key={tile.id}
                      onClick={() => handleSelectTile(tile)}
                      className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl font-black text-2xl sm:text-3xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-slate-100 flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                      {tile.letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION CONTROLS */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <Button
                  onClick={handleSubmitWord}
                  disabled={placedTiles.some((t) => t === null)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-5 rounded-2xl shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Submit
                </Button>

                <Button
                  onClick={handleShuffleTiles}
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 px-4 py-5 rounded-2xl"
                  title="Shortcut: Spacebar"
                >
                  <Shuffle className="w-4 h-4 mr-2" /> Shuffle
                </Button>

                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 px-4 py-5 rounded-2xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Clear
                </Button>

                <Button
                  onClick={handleRevealLetter}
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 px-4 py-5 rounded-2xl"
                  title="Costs 10 points"
                >
                  <Lightbulb className="w-4 h-4 mr-1 text-amber-400" /> Reveal (-10p)
                </Button>

                {!showHint && (
                  <Button
                    onClick={() => setShowHint(true)}
                    variant="outline"
                    className="bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700 px-4 py-5 rounded-2xl"
                  >
                    <HelpCircle className="w-4 h-4 mr-1 text-cyan-400" /> Hint Clue
                  </Button>
                )}

                {mode === "timed" && (
                  <Button
                    onClick={handleAddTime}
                    variant="outline"
                    className="bg-slate-800 border-slate-700 text-emerald-300 hover:bg-slate-700 px-4 py-5 rounded-2xl"
                  >
                    <Plus className="w-4 h-4 mr-1 text-emerald-400" /> +10s (-15p)
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. ROUND SUMMARY (LEVEL COMPLETE) */}
        {/* ========================================================================= */}
        {gameState === "round_summary" && (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Card className="bg-slate-900/90 border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="text-3xl font-black text-white mb-1">Level Cleared!</h2>
              <p className="text-xs text-slate-400 mb-6">Great job solving the anagram puzzles!</p>

              {/* Star Rating Earned */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-8 h-8 ${
                      s <= (levelStars[currentLevel] || 1)
                        ? "text-amber-400 fill-amber-400 animate-bounce"
                        : "text-slate-700"
                    }`}
                  />
                ))}
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-left mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Score:</span>
                  <span className="font-bold text-purple-400">{score} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Words Solved:</span>
                  <span className="font-bold text-white">{wordsSolved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Best Streak:</span>
                  <span className="font-bold text-amber-400">{bestStreak}x</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setGameState("level_select")}
                  variant="outline"
                  className="w-1/2 py-5 rounded-2xl bg-slate-800 border-slate-700 text-white"
                >
                  Map Levels
                </Button>
                {currentLevel < 15 && (
                  <Button
                    onClick={() => startGameSession("level", currentLevel + 1)}
                    className="w-1/2 py-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    Next Level <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. GAME OVER STATE */}
        {/* ========================================================================= */}
        {gameState === "game_over" && (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Card className="bg-slate-900/90 border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <Award className="w-8 h-8" />
              </div>

              <h2 className="text-3xl font-black text-white mb-1">Game Over</h2>
              <p className="text-xs text-slate-400 mb-6">Time ran out or all strikes used!</p>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-left mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Score:</span>
                  <span className="font-bold text-purple-400">{score} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Words Solved:</span>
                  <span className="font-bold text-white">{wordsSolved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Streak:</span>
                  <span className="font-bold text-amber-400">{bestStreak}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">High Score:</span>
                  <span className="font-bold text-cyan-400">{currentHighScore} pts</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => startGameSession(mode, currentLevel)}
                  className="w-1/2 py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Button
                  onClick={() => setGameState("menu")}
                  variant="outline"
                  className="w-1/2 py-5 rounded-2xl bg-slate-800 border-slate-700 text-white"
                >
                  Menu
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-4xl text-center text-xs text-slate-500 z-20 py-2 border-t border-slate-800/60">
        Tip: You can use your physical keyboard to type letters, press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Space</kbd> to shuffle, and <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Enter</kbd> to submit!
      </footer>
    </div>
  )
}
