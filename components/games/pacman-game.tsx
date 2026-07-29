"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, RotateCcw } from "lucide-react"

const TILE_SIZE = 24
const COLS = 19
const ROWS = 17
const CANVAS_W = COLS * TILE_SIZE
const CANVAS_H = ROWS * TILE_SIZE

const WALL = 1
const DOT = 2
const POWER = 3
const EMPTY = 0

const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,2,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1],
  [1,2,1,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,1,2,1,1,2,2,2,1,1,2,1,2,2,2,1],
  [1,2,1,2,1,2,1,2,2,1,2,2,1,2,1,2,1,2,1],
  [1,2,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

type Ghost = { x: number; y: number; dir: { x: number; y: number }; color: string; scared: boolean }

const GHOST_COLORS = ["#ff0000", "#ffb8ff", "#00ffff", "#ffb852"]

export default function PacmanGame({ themeColor = "#facc15" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<"menu" | "playing" | "gameover" | "won">("menu")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [bestScore, setBestScore] = useState(0)

  const pacmanRef = useRef({ x: 9 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthAngle: 0, mouthOpen: true })
  const ghostsRef = useRef<Ghost[]>([])
  const mazeRef = useRef<number[][]>([])
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const animFrameRef = useRef(0)
  const scaredTimerRef = useRef(0)
  const moveTimerRef = useRef(0)

  const initGame = useCallback(() => {
    mazeRef.current = MAZE.map((row) => [...row])
    pacmanRef.current = { x: 9 * TILE_SIZE + TILE_SIZE / 2, y: 9 * TILE_SIZE + TILE_SIZE / 2, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthAngle: 0, mouthOpen: true }
    ghostsRef.current = [
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: -1 }, color: GHOST_COLORS[0], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 1, y: 0 }, color: GHOST_COLORS[1], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: -1, y: 0 }, color: GHOST_COLORS[2], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: 1 }, color: GHOST_COLORS[3], scared: false },
    ]
    scoreRef.current = 0
    livesRef.current = 3
    scaredTimerRef.current = 0
    setScore(0)
    setLives(3)
  }, [])

  const resetPositions = useCallback(() => {
    pacmanRef.current = { x: 9 * TILE_SIZE + TILE_SIZE / 2, y: 9 * TILE_SIZE + TILE_SIZE / 2, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthAngle: 0, mouthOpen: true }
    ghostsRef.current = [
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: -1 }, color: GHOST_COLORS[0], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 1, y: 0 }, color: GHOST_COLORS[1], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: -1, y: 0 }, color: GHOST_COLORS[2], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: 1 }, color: GHOST_COLORS[3], scared: false },
    ]
    scaredTimerRef.current = 0
  }, [])

  const canMove = (x: number, y: number, dir: { x: number; y: number }) => {
    const margin = 2
    const nextX = x + dir.x * margin
    const nextY = y + dir.y * margin
    const col = Math.floor(nextX / TILE_SIZE)
    const row = Math.floor(nextY / TILE_SIZE)
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false
    return mazeRef.current[row]?.[col] !== WALL
  }

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pacman = pacmanRef.current
    const ghosts = ghostsRef.current
    const maze = mazeRef.current

    // Move Pac-Man
    if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
      if (canMove(pacman.x, pacman.y, pacman.nextDir)) {
        pacman.dir = { ...pacman.nextDir }
      }
    }
    if (pacman.dir.x !== 0 || pacman.dir.y !== 0) {
      if (canMove(pacman.x, pacman.y, pacman.dir)) {
        pacman.x += pacman.dir.x * 2
        pacman.y += pacman.dir.y * 2
        // Tunnel wrapping
        if (pacman.x < -TILE_SIZE / 2) pacman.x = CANVAS_W - TILE_SIZE / 2
        if (pacman.x > CANVAS_W + TILE_SIZE / 2) pacman.x = TILE_SIZE / 2
      }
    }

    // Mouth animation
    if (pacman.mouthOpen) {
      pacman.mouthAngle += 0.15
      if (pacman.mouthAngle >= 0.8) pacman.mouthOpen = false
    } else {
      pacman.mouthAngle -= 0.15
      if (pacman.mouthAngle <= 0.1) pacman.mouthOpen = true
    }

    // Eat dots
    const pCol = Math.floor(pacman.x / TILE_SIZE)
    const pRow = Math.floor(pacman.y / TILE_SIZE)
    if (pRow >= 0 && pRow < ROWS && pCol >= 0 && pCol < COLS) {
      if (maze[pRow][pCol] === DOT) {
        maze[pRow][pCol] = EMPTY
        scoreRef.current += 10
        setScore(scoreRef.current)
      } else if (maze[pRow][pCol] === POWER) {
        maze[pRow][pCol] = EMPTY
        scoreRef.current += 50
        setScore(scoreRef.current)
        scaredTimerRef.current = 300
        ghosts.forEach((g) => { g.scared = true })
      }
    }

    // Move ghosts
    if (scaredTimerRef.current > 0) scaredTimerRef.current--
    else ghosts.forEach((g) => { g.scared = false })

    moveTimerRef.current++
    if (moveTimerRef.current % 3 === 0) {
      ghosts.forEach((g) => {
        const gCol = Math.floor(g.x / TILE_SIZE)
        const gRow = Math.floor(g.y / TILE_SIZE)
        const possibleDirs: { x: number; y: number }[] = []
        for (const d of [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]) {
          if (d.x !== -g.dir.x || d.y !== -g.dir.y) {
            if (canMove(g.x, g.y, d)) possibleDirs.push(d)
          }
        }
        if (possibleDirs.length === 0) {
          if (canMove(g.x, g.y, { x: -g.dir.x, y: -g.dir.y })) possibleDirs.push({ x: -g.dir.x, y: -g.dir.y })
        }
        if (possibleDirs.length > 0) {
          if (g.scared) {
            const awayFromPacman = possibleDirs.map((d) => {
              const nx = g.x + d.x * TILE_SIZE
              const ny = g.y + d.y * TILE_SIZE
              const dist = Math.hypot(nx - pacman.x, ny - pacman.y)
              return { d, dist }
            }).sort((a, b) => b.dist - a.dist)
            g.dir = awayFromPacman[0].d
          } else {
            const towardsPacman = possibleDirs.map((d) => {
              const nx = g.x + d.x * TILE_SIZE
              const ny = g.y + d.y * TILE_SIZE
              const dist = Math.hypot(nx - pacman.x, ny - pacman.y)
              return { d, dist }
            }).sort((a, b) => a.dist - b.dist)
            if (Math.random() < 0.3) {
              g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)]
            } else {
              g.dir = towardsPacman[0].d
            }
          }
        }
        g.x += g.dir.x * 2
        g.y += g.dir.y * 2
        if (g.x < -TILE_SIZE / 2) g.x = CANVAS_W - TILE_SIZE / 2
        if (g.x > CANVAS_W + TILE_SIZE / 2) g.x = TILE_SIZE / 2
      })
    }

    // Collision detection
    const px = pacman.x
    const py = pacman.y
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i]
      const dist = Math.hypot(px - g.x, py - g.y)
      if (dist < TILE_SIZE * 0.7) {
        if (g.scared) {
          scoreRef.current += 200
          setScore(scoreRef.current)
          g.x = 9 * TILE_SIZE
          g.y = 5 * TILE_SIZE
          g.scared = false
        } else {
          livesRef.current--
          setLives(livesRef.current)
          if (livesRef.current <= 0) {
            setPhase("gameover")
            const best = parseInt(localStorage.getItem("pacman-best") || "0")
            if (scoreRef.current > best) {
              localStorage.setItem("pacman-best", scoreRef.current.toString())
              setBestScore(scoreRef.current)
            }
            return
          }
          resetPositions()
          return
        }
      }
    }

    // Check win
    let dotsLeft = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (maze[r][c] === DOT || maze[r][c] === POWER) dotsLeft++
      }
    }
    if (dotsLeft === 0) {
      setPhase("won")
      const best = parseInt(localStorage.getItem("pacman-best") || "0")
      if (scoreRef.current > best) {
        localStorage.setItem("pacman-best", scoreRef.current.toString())
        setBestScore(scoreRef.current)
      }
      return
    }

    // Render
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Maze
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = maze[r][c]
        const cx = c * TILE_SIZE
        const cy = r * TILE_SIZE
        if (cell === WALL) {
          ctx.fillStyle = "#1a1a2e"
          ctx.fillRect(cx, cy, TILE_SIZE, TILE_SIZE)
          ctx.strokeStyle = "#16213e"
          ctx.strokeRect(cx, cy, TILE_SIZE, TILE_SIZE)
        } else if (cell === DOT) {
          ctx.fillStyle = "#f8b4b4"
          ctx.beginPath()
          ctx.arc(cx + TILE_SIZE / 2, cy + TILE_SIZE / 2, 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (cell === POWER) {
          ctx.fillStyle = "#facc15"
          ctx.beginPath()
          ctx.arc(cx + TILE_SIZE / 2, cy + TILE_SIZE / 2, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Ghosts
    ghosts.forEach((g) => {
      const gColor = g.scared ? "#2121de" : g.color
      ctx.fillStyle = gColor
      ctx.beginPath()
      ctx.arc(g.x, g.y, TILE_SIZE / 2 - 2, Math.PI, 0)
      ctx.lineTo(g.x + TILE_SIZE / 2 - 2, g.y + TILE_SIZE / 2 - 4)
      ctx.lineTo(g.x - TILE_SIZE / 2 + 2, g.y + TILE_SIZE / 2 - 4)
      ctx.fill()
      // Eyes
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.arc(g.x - 5, g.y - 3, 4, 0, Math.PI * 2)
      ctx.arc(g.x + 5, g.y - 3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "black"
      ctx.beginPath()
      ctx.arc(g.x - 5 + g.dir.x * 2, g.y - 3 + g.dir.y * 2, 2, 0, Math.PI * 2)
      ctx.arc(g.x + 5 + g.dir.x * 2, g.y - 3 + g.dir.y * 2, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    // Pac-Man
    const angle = pacman.dir.x !== 0 || pacman.dir.y !== 0
      ? Math.atan2(pacman.dir.y, pacman.dir.x)
      : 0
    ctx.fillStyle = themeColor
    ctx.beginPath()
    ctx.arc(pacman.x, pacman.y, TILE_SIZE / 2 - 2, angle + pacman.mouthAngle, angle + Math.PI * 2 - pacman.mouthAngle)
    ctx.lineTo(pacman.x, pacman.y)
    ctx.fill()

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [themeColor, resetPositions])

  useEffect(() => {
    if (phase === "playing") {
      animFrameRef.current = requestAnimationFrame(gameLoop)
    }
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [phase, gameLoop])

  useEffect(() => {
    const best = parseInt(localStorage.getItem("pacman-best") || "0")
    setBestScore(best)
    const handleKey = (e: KeyboardEvent) => {
      const dirMap: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
      }
      if (dirMap[e.key]) {
        e.preventDefault()
        pacmanRef.current.nextDir = dirMap[e.key]
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const startGame = () => {
    initGame()
    setPhase("playing")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-4l-3.5 2 3.5 2zm2 0l3.5-2-3.5-2v4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Pac-Man</h2>
          <p className="text-muted-foreground mb-2">Navigate the maze, eat all dots, and avoid ghosts!</p>
          {bestScore > 0 && <p className="text-sm text-muted-foreground mb-4">Best Score: {bestScore}</p>}
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full max-w-md">
            <span className="font-bold">Score: {score}</span>
            <span className="text-red-500">Lives: {"♥".repeat(lives)}</span>
          </div>
          <div className="border rounded-lg overflow-hidden bg-black">
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="max-w-full h-auto" />
          </div>
          <p className="text-xs text-muted-foreground">Use arrow keys to move</p>
        </div>
      )}

      {(phase === "gameover" || phase === "won") && (
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            {phase === "won" ? (
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">{phase === "won" ? "You Won!" : "Game Over"}</h2>
          <p className="text-xl font-bold mb-2" style={{ color: themeColor }}>Score: {score}</p>
          <p className="text-sm text-muted-foreground mb-6">Best: {bestScore}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={startGame} style={{ backgroundColor: themeColor }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
