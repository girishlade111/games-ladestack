"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Palette,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Zap,
  Target,
  Brain,
  Layers,
  Sparkles,
  Flame,
  Award,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react"

export type GameMode = "classic" | "stroop" | "spectrum" | "memory"
export type Difficulty = "easy" | "medium" | "hard" | "insane"

interface ColorMatchGameProps {
  onBack?: () => void
  themeColor?: string
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

interface ColorNode {
  id: number
  x: number
  y: number
  radius: number
  color: string
  label?: string
  labelColor?: string
  isTarget?: boolean
  targetIndex?: number
  scale: number
}

interface DifficultyConfig {
  optionCount: number
  timeLimit: number
  multiplier: number
  rotationSpeed: number
  shadeVariance: number // lower = harder to distinguish in spectrum mode
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: { optionCount: 4, timeLimit: 40, multiplier: 1.0, rotationSpeed: 0.005, shadeVariance: 40 },
  medium: { optionCount: 6, timeLimit: 30, multiplier: 1.5, rotationSpeed: 0.01, shadeVariance: 25 },
  hard: { optionCount: 8, timeLimit: 25, multiplier: 2.0, rotationSpeed: 0.018, shadeVariance: 15 },
  insane: { optionCount: 10, timeLimit: 20, multiplier: 3.0, rotationSpeed: 0.028, shadeVariance: 8 },
}

const COLOR_PALETTE = [
  { name: "Crimson", hex: "#ef4444", textClass: "text-red-500", freq: 261.63 }, // C4
  { name: "Azure", hex: "#3b82f6", textClass: "text-blue-500", freq: 293.66 }, // D4
  { name: "Emerald", hex: "#10b981", textClass: "text-emerald-500", freq: 329.63 }, // E4
  { name: "Amber", hex: "#f59e0b", textClass: "text-amber-500", freq: 349.23 }, // F4
  { name: "Purple", hex: "#a855f7", textClass: "text-purple-500", freq: 392.0 }, // G4
  { name: "Cyan", hex: "#06b6d4", textClass: "text-cyan-500", freq: 440.0 }, // A4
  { name: "Pink", hex: "#ec4899", textClass: "text-pink-500", freq: 493.88 }, // B4
  { name: "Orange", hex: "#f97316", textClass: "text-orange-500", freq: 523.25 }, // C5
  { name: "Lime", hex: "#84cc16", textClass: "text-lime-500", freq: 587.33 }, // D5
  { name: "Indigo", hex: "#6366f1", textClass: "text-indigo-500", freq: 659.25 }, // E5
  { name: "Rose", hex: "#f43f5e", textClass: "text-rose-500", freq: 698.46 }, // F5
  { name: "Teal", hex: "#14b8a6", textClass: "text-teal-500", freq: 783.99 }, // G5
]

// Web Audio Sound Synthesizer
class SoundEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  public init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted
  }

  public isMuted() {
    return this.muted
  }

  public playColorPitch(freq: number) {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.18)
  }

  public playCorrect(streak: number) {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const baseFreq = 440 + Math.min(streak * 25, 400)
    const now = this.ctx.currentTime

    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc1.type = "triangle"
    osc2.type = "sine"

    osc1.frequency.setValueAtTime(baseFreq, now)
    osc2.frequency.setValueAtTime(baseFreq * 1.25, now + 0.05)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(this.ctx.destination)

    osc1.start(now)
    osc2.start(now + 0.05)
    osc1.stop(now + 0.25)
    osc2.stop(now + 0.25)
  }

  public playWrong() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  public playStreakFire() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now + idx * 0.05)

      gain.gain.setValueAtTime(0.1, now + idx * 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(now + idx * 0.05)
      osc.stop(now + idx * 0.05 + 0.2)
    })
  }

  public playFanfare() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [440, 554.37, 659.25, 880]
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, now + i * 0.08)

      gain.gain.setValueAtTime(0.15, now + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.3)
    })
  }

  public playTick() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(800, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.04)
  }
}

const soundEngine = new SoundEngine()

// Color utilities for spectrum mode
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace("#", "")
  if (c.length === 3) c = c.split("").map((x) => x + x).join("")
  const num = parseInt(c, 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export default function ColorMatchGame({ onBack, themeColor = "#ec4899" }: ColorMatchGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])

  // Game state
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [mode, setMode] = useState<GameMode>("classic")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [soundMuted, setSoundMuted] = useState(false)

  // Scores and stats
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [correctMatches, setCorrectMatches] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [lastMatchStartTime, setLastMatchStartTime] = useState<number>(0)

  // Target and current choices state
  const [targetColorHex, setTargetColorHex] = useState<string>("#ef4444")
  const [targetColorName, setTargetColorName] = useState<string>("Crimson")
  const [stroopPromptMode, setStroopPromptMode] = useState<"word" | "ink">("word")
  const [stroopTextWord, setStroopTextWord] = useState<string>("RED")
  const [stroopInkColorHex, setStroopInkColorHex] = useState<string>("#3b82f6")

  // Memory mode state
  const [memorySequence, setMemorySequence] = useState<number[]>([])
  const [memoryPlayerStep, setMemoryPlayerStep] = useState<number>(0)
  const [isMemoryShowingPattern, setIsMemoryShowingPattern] = useState<boolean>(false)
  const [memoryActiveColorIndex, setMemoryActiveColorIndex] = useState<number | null>(null)

  // Nodes for rendering canvas
  const [colorNodes, setColorNodes] = useState<ColorNode[]>([])
  const rotationAngleRef = useRef<number>(0)
  const screenShakeRef = useRef<number>(0)
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; alpha: number; color: string }[]>([])

  // Load high scores from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem(`colormatch_highscore_${mode}_${difficulty}`)
      const savedStreak = localStorage.getItem(`colormatch_beststreak_${mode}_${difficulty}`)
      if (savedScore) setHighScore(parseInt(savedScore, 10))
      if (savedStreak) setBestStreak(parseInt(savedStreak, 10))
    }
  }, [mode, difficulty])

  const toggleMute = () => {
    const next = !soundMuted
    setSoundMuted(next)
    soundEngine.setMuted(next)
  }

  // Create particle burst animation
  const spawnParticleBurst = (x: number, y: number, color: string) => {
    const count = 28
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 6 + 2
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 5 + 2,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.015,
      })
    }

    shockwavesRef.current.push({
      x,
      y,
      radius: 10,
      alpha: 1.0,
      color,
    })
  }

  // Generate next puzzle round based on active mode
  const generateNewRound = useCallback(() => {
    const config = DIFFICULTY_SETTINGS[difficulty]
    const nodeCount = config.optionCount
    const nodes: ColorNode[] = []

    setLastMatchStartTime(performance.now())

    if (mode === "classic") {
      // Pick target color randomly from palette
      const shuffledPalette = [...COLOR_PALETTE].sort(() => Math.random() - 0.5)
      const targetObj = shuffledPalette[0]
      setTargetColorHex(targetObj.hex)
      setTargetColorName(targetObj.name)

      // Ensure target color is placed in one node
      const chosenOptions = shuffledPalette.slice(0, nodeCount)
      const targetIndexInNodes = Math.floor(Math.random() * nodeCount)
      chosenOptions[targetIndexInNodes] = targetObj

      const centerX = 400
      const centerY = 300
      const orbitDistance = nodeCount > 6 ? 190 : 160

      for (let i = 0; i < nodeCount; i++) {
        const baseAngle = (i * Math.PI * 2) / nodeCount
        nodes.push({
          id: i,
          x: centerX + Math.cos(baseAngle) * orbitDistance,
          y: centerY + Math.sin(baseAngle) * orbitDistance,
          radius: nodeCount > 8 ? 32 : 40,
          color: chosenOptions[i].hex,
          label: chosenOptions[i].name,
          scale: 1,
        })
      }
    } else if (mode === "stroop") {
      // Stroop mode: prompt specifies either "Match TEXT WORD" or "Match INK COLOR"
      const isMatchWordPrompt = Math.random() > 0.5
      setStroopPromptMode(isMatchWordPrompt ? "word" : "ink")

      const shuffled = [...COLOR_PALETTE].sort(() => Math.random() - 0.5)
      const wordObj = shuffled[0]
      const inkObj = shuffled[1]

      setStroopTextWord(wordObj.name)
      setStroopInkColorHex(inkObj.hex)

      // The correct color to pick depends on prompt
      const targetObj = isMatchWordPrompt ? wordObj : inkObj
      setTargetColorHex(targetObj.hex)

      const options = shuffled.slice(0, nodeCount)
      if (!options.some((o) => o.hex === targetObj.hex)) {
        options[Math.floor(Math.random() * nodeCount)] = targetObj
      }

      const centerX = 400
      const centerY = 300
      const orbitDistance = 160

      for (let i = 0; i < nodeCount; i++) {
        const baseAngle = (i * Math.PI * 2) / nodeCount
        nodes.push({
          id: i,
          x: centerX + Math.cos(baseAngle) * orbitDistance,
          y: centerY + Math.sin(baseAngle) * orbitDistance,
          radius: 38,
          color: options[i].hex,
          label: options[i].name,
          scale: 1,
        })
      }
    } else if (mode === "spectrum") {
      // Spectrum Precision: Target is a base HSL color, options are subtle hue/lightness variations
      const baseObj = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
      const baseHSL = hexToHSL(baseObj.hex)
      setTargetColorHex(baseObj.hex)
      setTargetColorName(baseObj.name)

      const targetIndex = Math.floor(Math.random() * nodeCount)
      const centerX = 400
      const centerY = 300
      const orbitDistance = nodeCount > 6 ? 190 : 160

      for (let i = 0; i < nodeCount; i++) {
        let shadeHex = baseObj.hex
        if (i !== targetIndex) {
          // create subtle variation based on difficulty variance
          const varAmount = config.shadeVariance
          const hueOffset = (Math.random() - 0.5) * varAmount
          const lightnessOffset = (Math.random() - 0.5) * (varAmount * 0.8)
          shadeHex = hslToHex(
            (baseHSL.h + hueOffset + 360) % 360,
            baseHSL.s,
            Math.min(85, Math.max(15, baseHSL.l + lightnessOffset))
          )
        }

        const baseAngle = (i * Math.PI * 2) / nodeCount
        nodes.push({
          id: i,
          x: centerX + Math.cos(baseAngle) * orbitDistance,
          y: centerY + Math.sin(baseAngle) * orbitDistance,
          radius: nodeCount > 8 ? 32 : 40,
          color: shadeHex,
          scale: 1,
        })
      }
    } else if (mode === "memory") {
      // Memory Echo: 4 color pads fixed in cross/ring position
      const memoryColors = COLOR_PALETTE.slice(0, 4)
      setTargetColorHex(memoryColors[0].hex)

      const centerX = 400
      const centerY = 300
      const orbitDistance = 140

      for (let i = 0; i < 4; i++) {
        const baseAngle = (i * Math.PI * 2) / 4 - Math.PI / 4
        nodes.push({
          id: i,
          x: centerX + Math.cos(baseAngle) * orbitDistance,
          y: centerY + Math.sin(baseAngle) * orbitDistance,
          radius: 50,
          color: memoryColors[i].hex,
          label: memoryColors[i].name,
          scale: 1,
        })
      }
    }

    setColorNodes(nodes)
  }, [mode, difficulty])

  // Play memory sequence demo
  const playMemorySequence = useCallback(
    (sequence: number[]) => {
      setIsMemoryShowingPattern(true)
      setMemoryPlayerStep(0)

      sequence.forEach((colorIdx, stepIndex) => {
        setTimeout(() => {
          setMemoryActiveColorIndex(colorIdx)
          soundEngine.playColorPitch(COLOR_PALETTE[colorIdx]?.freq || 440)

          setTimeout(() => {
            setMemoryActiveColorIndex(null)
            if (stepIndex === sequence.length - 1) {
              setIsMemoryShowingPattern(false)
              setLastMatchStartTime(performance.now())
            }
          }, 350)
        }, (stepIndex + 1) * 600)
      })
    },
    []
  )

  // Start new game round
  const startGame = useCallback(() => {
    soundEngine.init()
    const config = DIFFICULTY_SETTINGS[difficulty]

    setGameState("playing")
    setScore(0)
    setStreak(0)
    setTimeLeft(config.timeLimit)
    setCorrectMatches(0)
    setTotalAttempts(0)
    setReactionTimes([])
    particlesRef.current = []
    shockwavesRef.current = []

    if (mode === "memory") {
      const firstSeq = [Math.floor(Math.random() * 4)]
      setMemorySequence(firstSeq)
      generateNewRound()
      playMemorySequence(firstSeq)
    } else {
      generateNewRound()
    }
  }, [difficulty, mode, generateNewRound, playMemorySequence])

  // End game logic
  const endGame = useCallback(() => {
    setGameState("gameOver")
    soundEngine.playFanfare()

    setHighScore((prev) => {
      const nextHigh = Math.max(prev, score)
      if (typeof window !== "undefined") {
        localStorage.setItem(`colormatch_highscore_${mode}_${difficulty}`, nextHigh.toString())
      }
      return nextHigh
    })

    setBestStreak((prev) => {
      const nextBest = Math.max(prev, streak)
      if (typeof window !== "undefined") {
        localStorage.setItem(`colormatch_beststreak_${mode}_${difficulty}`, nextBest.toString())
      }
      return nextBest
    })
  }, [score, streak, mode, difficulty])

  // Timer countdown hook
  useEffect(() => {
    if (gameState !== "playing") return
    if (mode === "memory") return // Memory mode uses sequence progression rather than tick timer

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          endGame()
          return 0
        }
        if (prev <= 5) soundEngine.playTick()
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, mode, endGame])

  // Process a selected option node
  const handleNodeClick = useCallback(
    (selectedNode: ColorNode, clickX?: number, clickY?: number) => {
      if (gameState !== "playing" || isMemoryShowingPattern) return

      const clickTime = performance.now()
      const reactionMs = Math.round(clickTime - lastMatchStartTime)
      setTotalAttempts((prev) => prev + 1)

      const targetX = clickX ?? selectedNode.x
      const targetY = clickY ?? selectedNode.y

      if (mode === "memory") {
        // Memory pattern match
        const expectedColorIdx = memorySequence[memoryPlayerStep]
        soundEngine.playColorPitch(COLOR_PALETTE[selectedNode.id]?.freq || 440)

        if (selectedNode.id === expectedColorIdx) {
          // Correct step in sequence
          spawnParticleBurst(targetX, targetY, selectedNode.color)

          if (memoryPlayerStep + 1 === memorySequence.length) {
            // Sequence completed!
            const newMatches = correctMatches + 1
            const config = DIFFICULTY_SETTINGS[difficulty]
            const pointsGained = Math.round(100 * config.multiplier + streak * 15)

            setScore((prev) => prev + pointsGained)
            setStreak((prev) => {
              const nextStreak = prev + 1
              if (nextStreak > 0 && nextStreak % 5 === 0) soundEngine.playStreakFire()
              else soundEngine.playCorrect(nextStreak)
              return nextStreak
            })
            setCorrectMatches(newMatches)
            setReactionTimes((prev) => [...prev, reactionMs])

            // Extend sequence
            const nextSeq = [...memorySequence, Math.floor(Math.random() * 4)]
            setMemorySequence(nextSeq)
            setTimeout(() => playMemorySequence(nextSeq), 600)
          } else {
            setMemoryPlayerStep((prev) => prev + 1)
          }
        } else {
          // Wrong memory step
          soundEngine.playWrong()
          screenShakeRef.current = 15
          setStreak(0)
          endGame()
        }
        return
      }

      // Modes: Classic, Stroop, Spectrum
      const isCorrect = selectedNode.color.toLowerCase() === targetColorHex.toLowerCase()

      if (isCorrect) {
        soundEngine.playCorrect(streak + 1)
        spawnParticleBurst(targetX, targetY, selectedNode.color)

        const config = DIFFICULTY_SETTINGS[difficulty]
        const pointsGained = Math.round((10 + streak * 3) * config.multiplier)

        setScore((prev) => prev + pointsGained)
        setStreak((prev) => {
          const nextStreak = prev + 1
          if (nextStreak > 0 && nextStreak % 5 === 0) soundEngine.playStreakFire()
          return nextStreak
        })
        setCorrectMatches((prev) => prev + 1)
        setReactionTimes((prev) => [...prev, reactionMs])
        generateNewRound()
      } else {
        soundEngine.playWrong()
        screenShakeRef.current = 12
        setStreak(0)
        setScore((prev) => Math.max(0, prev - 5))
        generateNewRound()
      }
    },
    [
      gameState,
      isMemoryShowingPattern,
      lastMatchStartTime,
      mode,
      memorySequence,
      memoryPlayerStep,
      correctMatches,
      difficulty,
      streak,
      targetColorHex,
      generateNewRound,
      playMemorySequence,
      endGame,
    ]
  )

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        toggleMute()
        return
      }

      if (gameState === "menu") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          startGame()
        }
        return
      }

      if (gameState === "gameOver") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          startGame()
        } else if (e.key === "Escape") {
          setGameState("menu")
        }
        return
      }

      if (gameState === "playing") {
        if (e.key === "Escape") {
          setGameState("menu")
          return
        }

        // Keys 1-9 to select nodes directly
        const num = parseInt(e.key, 10)
        if (!isNaN(num) && num >= 1 && num <= colorNodes.length) {
          const targetNode = colorNodes[num - 1]
          if (targetNode) {
            handleNodeClick(targetNode)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, colorNodes, startGame, handleNodeClick])

  // Canvas main animation loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Screen Shake apply
    let offsetX = 0
    let offsetY = 0
    if (screenShakeRef.current > 0) {
      offsetX = (Math.random() - 0.5) * screenShakeRef.current
      offsetY = (Math.random() - 0.5) * screenShakeRef.current
      screenShakeRef.current = Math.max(0, screenShakeRef.current - 1)
    }

    ctx.save()
    ctx.translate(offsetX, offsetY)

    // Dark sleek backdrop gradient
    const bgGrad = ctx.createRadialGradient(400, 300, 50, 400, 300, 450)
    bgGrad.addColorStop(0, "#0f172a")
    bgGrad.addColorStop(1, "#020617")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Subtle ambient background grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    if (gameState === "playing") {
      const config = DIFFICULTY_SETTINGS[difficulty]
      rotationAngleRef.current += config.rotationSpeed

      // Center Target Element (except for memory mode)
      if (mode !== "memory") {
        ctx.save()
        ctx.shadowColor = targetColorHex
        ctx.shadowBlur = 25

        // Central Target Ring Glow
        ctx.beginPath()
        ctx.arc(400, 300, 48, 0, Math.PI * 2)
        ctx.fillStyle = mode === "stroop" ? stroopInkColorHex : targetColorHex
        ctx.fill()
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 4
        ctx.stroke()
        ctx.restore()

        // Central Target Text / Instruction
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        if (mode === "stroop") {
          ctx.font = "bold 22px Inter, sans-serif"
          ctx.fillStyle = "#ffffff"
          ctx.fillText(stroopTextWord, 400, 300)

          ctx.font = "12px Inter, sans-serif"
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
          ctx.fillText(
            stroopPromptMode === "word" ? "MATCH WORD TEXT" : "MATCH INK COLOR",
            400,
            230
          )
        } else if (mode === "spectrum") {
          ctx.font = "12px Inter, sans-serif"
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
          ctx.fillText("MATCH EXACT SHADE", 400, 230)
        } else {
          ctx.font = "12px Inter, sans-serif"
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
          ctx.fillText("MATCH TARGET COLOR", 400, 230)
        }
      }

      // Render orbiting option nodes
      const centerX = 400
      const centerY = 300
      const currentRotation = mode === "memory" ? 0 : rotationAngleRef.current

      colorNodes.forEach((node, index) => {
        const angleOffset = (index * Math.PI * 2) / colorNodes.length
        const totalAngle = baseAngleForNode(index, colorNodes.length) + currentRotation
        const orbitDist = colorNodes.length > 6 ? 190 : 160

        const nodeX = mode === "memory" ? node.x : centerX + Math.cos(totalAngle) * orbitDist
        const nodeY = mode === "memory" ? node.y : centerY + Math.sin(totalAngle) * orbitDist

        // Update node live coordinates for click collision
        node.x = nodeX
        node.y = nodeY

        const isHighlight = mode === "memory" && memoryActiveColorIndex === index

        ctx.save()
        ctx.shadowColor = node.color
        ctx.shadowBlur = isHighlight ? 30 : 15

        // Circle pad fill
        ctx.beginPath()
        ctx.arc(nodeX, nodeY, isHighlight ? node.radius * 1.15 : node.radius, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()

        // White border contour
        ctx.strokeStyle = isHighlight ? "#facc15" : "rgba(255, 255, 255, 0.8)"
        ctx.lineWidth = isHighlight ? 4 : 2
        ctx.stroke()
        ctx.restore()

        // Keybinding hint badge (1, 2, 3...)
        ctx.beginPath()
        ctx.arc(nodeX - node.radius + 10, nodeY - node.radius + 10, 11, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.font = "bold 11px Inter, sans-serif"
        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${index + 1}`, nodeX - node.radius + 10, nodeY - node.radius + 10)
      })

      // Shockwaves render
      shockwavesRef.current.forEach((sw, idx) => {
        sw.radius += 4
        sw.alpha -= 0.04
        if (sw.alpha > 0) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
          ctx.strokeStyle = sw.color
          ctx.lineWidth = 3
          ctx.globalAlpha = sw.alpha
          ctx.stroke()
          ctx.restore()
        } else {
          shockwavesRef.current.splice(idx, 1)
        }
      })

      // Particle physics update & render
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay

        if (p.alpha > 0) {
          ctx.save()
          ctx.globalAlpha = p.alpha
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
          ctx.restore()
        } else {
          particlesRef.current.splice(idx, 1)
        }
      })
    }

    ctx.restore()
  }, [gameState, mode, difficulty, stroopTextWord, stroopInkColorHex, stroopPromptMode, targetColorHex, colorNodes, memoryActiveColorIndex])

  // Helper angle calculator
  function baseAngleForNode(index: number, total: number) {
    return (index * Math.PI * 2) / total
  }

  // Animation frame loop
  useEffect(() => {
    const render = () => {
      drawCanvas()
      animationRef.current = requestAnimationFrame(render)
    }
    animationRef.current = requestAnimationFrame(render)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [drawCanvas])

  // Handle click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    for (const node of colorNodes) {
      const dist = Math.hypot(x - node.x, y - node.y)
      if (dist <= node.radius + 8) {
        handleNodeClick(node, x, y)
        break
      }
    }
  }

  // Calculate analytics
  const avgReactionTime =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0
  const accuracyPct = totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 100

  // Performance rank evaluation
  const getRank = () => {
    if (score >= 400 && accuracyPct >= 90) return { title: "Chroma God 👑", color: "text-amber-400" }
    if (score >= 250 && accuracyPct >= 85) return { title: "Spectrum Master ⚡", color: "text-purple-400" }
    if (score >= 150) return { title: "Prism Expert 🎯", color: "text-blue-400" }
    if (score >= 80) return { title: "Color Apprentice 🎨", color: "text-emerald-400" }
    return { title: "Chroma Novice 🌟", color: "text-slate-400" }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-5xl space-y-4">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ← Back
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: themeColor }}
              >
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">Color Match Pro</h1>
                <p className="text-xs text-slate-400">Reflex & Perception Training</p>
              </div>
            </div>
          </div>

          {/* Sound & HUD info */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </Button>
          </div>
        </div>

        {/* Main Canvas & Overlay Container */}
        <div className="relative flex justify-center items-center rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="w-full max-w-[800px] h-auto cursor-pointer block touch-none"
          />

          {/* Playing HUD Overlay */}
          {gameState === "playing" && (
            <div className="absolute top-4 left-4 right-4 pointer-events-none flex justify-between items-center gap-4">
              {/* Score & Streak */}
              <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/80 shadow-lg">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Score</div>
                  <div className="text-xl font-black text-amber-400">{score}</div>
                </div>
                {streak > 1 && (
                  <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-bold animate-pulse">
                    <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {streak}x
                  </div>
                )}
              </div>

              {/* Time Remaining Bar */}
              {mode !== "memory" && (
                <div className="flex flex-col items-center bg-slate-900/90 backdrop-blur-md px-5 py-2 rounded-xl border border-slate-700/80 shadow-lg min-w-[140px]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Time Left</div>
                  <div className={`text-xl font-mono font-bold ${timeLeft <= 5 ? "text-red-400 animate-bounce" : "text-emerald-400"}`}>
                    {timeLeft}s
                  </div>
                </div>
              )}

              {/* Reaction Speed Metric */}
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/80 shadow-lg">
                <Activity className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Avg Reflex</div>
                  <div className="text-sm font-mono font-bold text-cyan-300">{avgReactionTime > 0 ? `${avgReactionTime} ms` : "--"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Menu Overlay */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-start overflow-y-auto p-6 z-20">
              <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800 text-slate-100 p-6 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                  <div
                    className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Palette className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">Color Match Pro</h2>
                  <p className="text-xs text-slate-400">Choose your challenge mode & difficulty level</p>
                </div>

                {/* Game Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "classic", label: "Chroma Speed", icon: Zap, desc: "Fast target matching" },
                      { id: "stroop", label: "Stroop Brain", icon: Brain, desc: "Text vs Ink conflict" },
                      { id: "spectrum", label: "Spectrum Precision", icon: Target, desc: "Subtle shade matching" },
                      { id: "memory", label: "Memory Echo", icon: Layers, desc: "Simon color sequences" },
                    ].map((m) => {
                      const Icon = m.icon
                      const isActive = mode === m.id
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMode(m.id as GameMode)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? "bg-pink-600/20 border-pink-500 text-white shadow-lg shadow-pink-500/10"
                              : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-semibold text-sm">
                            <Icon className={`w-4 h-4 ${isActive ? "text-pink-400" : "text-slate-400"}`} />
                            {m.label}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{m.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Difficulty</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["easy", "medium", "hard", "insane"] as Difficulty[]).map((d) => {
                      const isActive = difficulty === d
                      return (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`py-2 px-3 rounded-lg border text-center font-semibold text-xs capitalize transition-all ${
                            isActive
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                              : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* High Score banner */}
                {highScore > 0 && (
                  <div className="flex justify-between items-center bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Best High Score:</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-sm">{highScore} pts</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2">
                  <Button
                    onClick={startGame}
                    className="w-full py-6 text-base font-bold text-white shadow-xl hover:opacity-90 transition-all rounded-xl"
                    style={{ backgroundColor: themeColor }}
                  >
                    Start Game (Space)
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === "gameOver" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-start overflow-y-auto p-6 z-20">
              <Card className="w-full max-w-md bg-slate-900/95 border-slate-800 text-slate-100 p-6 shadow-2xl space-y-6 text-center">
                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 mb-2 border border-pink-500/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Round Completed!</h3>
                  <div className={`text-base font-bold ${getRank().color}`}>{getRank().title}</div>
                </div>

                {/* Performance stats grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-left">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Final Score</div>
                    <div className="text-2xl font-black text-amber-400 font-mono">{score}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Best Streak</div>
                    <div className="text-2xl font-black text-pink-400 font-mono">{streak}x</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Avg Reaction</div>
                    <div className="text-base font-bold text-cyan-300 font-mono">
                      {avgReactionTime > 0 ? `${avgReactionTime} ms` : "--"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Accuracy</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">{accuracyPct}%</div>
                  </div>
                </div>

                {/* High Score Indicator */}
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Personal Best ({mode} / {difficulty}): <span className="text-amber-400 font-bold">{highScore}</span></div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={startGame}
                    className="flex-1 py-5 text-sm font-bold text-white rounded-xl shadow-lg"
                    style={{ backgroundColor: themeColor }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Play Again (Space)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGameState("menu")}
                    className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 py-5 rounded-xl"
                  >
                    Menu (Esc)
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex flex-wrap justify-between items-center text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">1-9</kbd> Select Option
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">Space</kbd> Start/Retry
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">Esc</kbd> Menu
            </span>
          </div>
          <div>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">M</kbd> Sound Toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
