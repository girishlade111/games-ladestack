"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, RotateCcw } from "lucide-react"

const TILE_SIZE = 24; const COLS = 19; const ROWS = 17
const CANVAS_W = COLS * TILE_SIZE; const CANVAS_H = ROWS * TILE_SIZE
const WALL = 1; const DOT = 2; const POWER = 3; const EMPTY = 0

const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],[1,3,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],[1,2,1,2,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1],[1,2,1,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,1,2,1,1,2,2,2,1,1,2,1,2,2,2,1],[1,2,1,2,1,2,1,2,2,1,2,2,1,2,1,2,1,2,1],[1,2,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,1],
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
  const phaseRef = useRef<"menu" | "playing" | "gameover" | "won">("menu")

  const pacman = useRef({ x: 9 * TILE_SIZE + TILE_SIZE / 2, y: 9 * TILE_SIZE + TILE_SIZE / 2, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthAngle: 0, mouthOpen: true })
  const ghosts = useRef<Ghost[]>([])
  const maze = useRef<number[][]>(MAZE.map((r) => [...r]))
  const scoreR = useRef(0)
  const livesR = useRef(3)
  const scaredTimer = useRef(0)
  const moveTimer = useRef(0)
  const animFrame = useRef(0)

  const initGame = useCallback(() => {
    maze.current = MAZE.map((r) => [...r])
    pacman.current = { x: 9 * TILE_SIZE + TILE_SIZE / 2, y: 9 * TILE_SIZE + TILE_SIZE / 2, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthAngle: 0, mouthOpen: true }
    ghosts.current = [
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: -1 }, color: GHOST_COLORS[0], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 1, y: 0 }, color: GHOST_COLORS[1], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: -1, y: 0 }, color: GHOST_COLORS[2], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: 1 }, color: GHOST_COLORS[3], scared: false },
    ]
    scoreR.current = 0; livesR.current = 3; scaredTimer.current = 0
    setScore(0); setLives(3)
  }, [])

  const resetPositions = useCallback(() => {
    pacman.current = { x: 9 * TILE_SIZE + TILE_SIZE / 2, y: 9 * TILE_SIZE + TILE_SIZE / 2, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthAngle: 0, mouthOpen: true }
    ghosts.current = [
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: -1 }, color: GHOST_COLORS[0], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 1, y: 0 }, color: GHOST_COLORS[1], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: -1, y: 0 }, color: GHOST_COLORS[2], scared: false },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, dir: { x: 0, y: 1 }, color: GHOST_COLORS[3], scared: false },
    ]
    scaredTimer.current = 0
  }, [])

  const canMove = (x: number, y: number, dir: { x: number; y: number }) => {
    const nx = x + dir.x * 2; const ny = y + dir.y * 2
    const col = Math.floor(nx / TILE_SIZE); const row = Math.floor(ny / TILE_SIZE)
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false
    return maze.current[row]?.[col] !== WALL
  }

  const gameLoop = useCallback(() => {
    if (phaseRef.current !== "playing") { animFrame.current = requestAnimationFrame(gameLoop); return }

    const canvas = canvasRef.current
    if (!canvas) { animFrame.current = requestAnimationFrame(gameLoop); return }
    const ctx = canvas.getContext("2d")
    if (!ctx) { animFrame.current = requestAnimationFrame(gameLoop); return }

    const p = pacman.current; const gs = ghosts.current; const m = maze.current

    if (p.nextDir.x !== 0 || p.nextDir.y !== 0) { if (canMove(p.x, p.y, p.nextDir)) p.dir = { ...p.nextDir } }
    if ((p.dir.x !== 0 || p.dir.y !== 0) && canMove(p.x, p.y, p.dir)) { p.x += p.dir.x * 2; p.y += p.dir.y * 2; if (p.x < -TILE_SIZE / 2) p.x = CANVAS_W - TILE_SIZE / 2; if (p.x > CANVAS_W + TILE_SIZE / 2) p.x = TILE_SIZE / 2 }

    if (p.mouthOpen) { p.mouthAngle += 0.15; if (p.mouthAngle >= 0.8) p.mouthOpen = false }
    else { p.mouthAngle -= 0.15; if (p.mouthAngle <= 0.1) p.mouthOpen = true }

    const pCol = Math.floor(p.x / TILE_SIZE); const pRow = Math.floor(p.y / TILE_SIZE)
    if (pRow >= 0 && pRow < ROWS && pCol >= 0 && pCol < COLS) {
      if (m[pRow][pCol] === DOT) { m[pRow][pCol] = EMPTY; scoreR.current += 10; setScore(scoreR.current) }
      else if (m[pRow][pCol] === POWER) { m[pRow][pCol] = EMPTY; scoreR.current += 50; setScore(scoreR.current); scaredTimer.current = 300; gs.forEach((g) => { g.scared = true }) }
    }

    if (scaredTimer.current > 0) scaredTimer.current--; else gs.forEach((g) => { g.scared = false })

    moveTimer.current++
    if (moveTimer.current % 3 === 0) {
      gs.forEach((g) => {
        const possible: { x: number; y: number }[] = []
        for (const d of [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]) { if (d.x !== -g.dir.x || d.y !== -g.dir.y) { if (canMove(g.x, g.y, d)) possible.push(d) } }
        if (possible.length === 0 && canMove(g.x, g.y, { x: -g.dir.x, y: -g.dir.y })) possible.push({ x: -g.dir.x, y: -g.dir.y })
        if (possible.length > 0) {
          if (g.scared) g.dir = possible.sort((a, b) => { const da = Math.hypot(g.x + a.x * TILE_SIZE - p.x, g.y + a.y * TILE_SIZE - p.y); const db = Math.hypot(g.x + b.x * TILE_SIZE - p.x, g.y + b.y * TILE_SIZE - p.y); return db - da })[0]
          else if (Math.random() < 0.3) g.dir = possible[Math.floor(Math.random() * possible.length)]
          else g.dir = possible.sort((a, b) => { const da = Math.hypot(g.x + a.x * TILE_SIZE - p.x, g.y + a.y * TILE_SIZE - p.y); const db = Math.hypot(g.x + b.x * TILE_SIZE - p.x, g.y + b.y * TILE_SIZE - p.y); return da - db })[0]
        }
        g.x += g.dir.x * 2; g.y += g.dir.y * 2; if (g.x < -TILE_SIZE / 2) g.x = CANVAS_W - TILE_SIZE / 2; if (g.x > CANVAS_W + TILE_SIZE / 2) g.x = TILE_SIZE / 2
      })
    }

    for (let i = 0; i < gs.length; i++) {
      const g = gs[i]; const dist = Math.hypot(p.x - g.x, p.y - g.y)
      if (dist < TILE_SIZE * 0.7) {
        if (g.scared) { scoreR.current += 200; setScore(scoreR.current); g.x = 9 * TILE_SIZE; g.y = 5 * TILE_SIZE; g.scared = false }
        else {
          livesR.current--; setLives(livesR.current)
          if (livesR.current <= 0) {
            phaseRef.current = "gameover"; setPhase("gameover")
            const best = parseInt(localStorage.getItem("pacman-best") || "0")
            if (scoreR.current > best) { localStorage.setItem("pacman-best", String(scoreR.current)); setBestScore(scoreR.current) } else setBestScore(best)
            return
          }
          resetPositions()
        }
      }
    }

    let dotsLeft = 0
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (m[r][c] === DOT || m[r][c] === POWER) dotsLeft++
    if (dotsLeft === 0) {
      phaseRef.current = "won"; setPhase("won")
      const best = parseInt(localStorage.getItem("pacman-best") || "0")
      if (scoreR.current > best) { localStorage.setItem("pacman-best", String(scoreR.current)); setBestScore(scoreR.current) } else setBestScore(best)
      return
    }

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cx = c * TILE_SIZE; const cy = r * TILE_SIZE
      if (m[r][c] === WALL) { ctx.fillStyle = "#1a1a2e"; ctx.fillRect(cx, cy, TILE_SIZE, TILE_SIZE); ctx.strokeStyle = "#16213e"; ctx.strokeRect(cx, cy, TILE_SIZE, TILE_SIZE) }
      else if (m[r][c] === DOT) { ctx.fillStyle = "#f8b4b4"; ctx.beginPath(); ctx.arc(cx + TILE_SIZE / 2, cy + TILE_SIZE / 2, 2, 0, Math.PI * 2); ctx.fill() }
      else if (m[r][c] === POWER) { ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(cx + TILE_SIZE / 2, cy + TILE_SIZE / 2, 5, 0, Math.PI * 2); ctx.fill() }
    }
    gs.forEach((g) => {
      ctx.fillStyle = g.scared ? "#2121de" : g.color; ctx.beginPath(); ctx.arc(g.x, g.y, TILE_SIZE / 2 - 2, Math.PI, 0)
      ctx.lineTo(g.x + TILE_SIZE / 2 - 2, g.y + TILE_SIZE / 2 - 4); ctx.lineTo(g.x - TILE_SIZE / 2 + 2, g.y + TILE_SIZE / 2 - 4); ctx.fill()
      ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(g.x - 5, g.y - 3, 4, 0, Math.PI * 2); ctx.arc(g.x + 5, g.y - 3, 4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(g.x - 5 + g.dir.x * 2, g.y - 3 + g.dir.y * 2, 2, 0, Math.PI * 2); ctx.arc(g.x + 5 + g.dir.x * 2, g.y - 3 + g.dir.y * 2, 2, 0, Math.PI * 2); ctx.fill()
    })
    const angle = (p.dir.x !== 0 || p.dir.y !== 0) ? Math.atan2(p.dir.y, p.dir.x) : 0
    ctx.fillStyle = themeColor; ctx.beginPath(); ctx.arc(p.x, p.y, TILE_SIZE / 2 - 2, angle + p.mouthAngle, angle + Math.PI * 2 - p.mouthAngle); ctx.lineTo(p.x, p.y); ctx.fill()

    animFrame.current = requestAnimationFrame(gameLoop)
  }, [themeColor, resetPositions])

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { animFrame.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(animFrame.current) }, [gameLoop])

  useEffect(() => {
    const best = parseInt(localStorage.getItem("pacman-best") || "0"); setBestScore(best)
    const h = (e: KeyboardEvent) => {
      const m: Record<string, { x: number; y: number }> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
      if (m[e.key]) { e.preventDefault(); pacman.current.nextDir = m[e.key] }
    }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [])

  const startGame = () => { initGame(); setPhase("playing") }

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-4l-3.5 2 3.5 2zm2 0l3.5-2-3.5-2v4z" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Pac-Man</h2>
          <p className="text-muted-foreground mb-2">Navigate the maze, eat all dots, and avoid ghosts!</p>
          {bestScore > 0 && <p className="text-sm text-muted-foreground mb-4">Best Score: {bestScore}</p>}
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Start Game</Button>
        </div>
      )}
      {phase === "playing" && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full max-w-md"><span className="font-bold">Score: {score}</span><span className="text-red-500">Lives: {"\u2665".repeat(lives)}</span></div>
          <div className="border rounded-lg overflow-hidden bg-black"><canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="max-w-full h-auto" /></div>
          <p className="text-xs text-muted-foreground">Use arrow keys to move</p>
        </div>
      )}
      {(phase === "gameover" || phase === "won") && (
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            {phase === "won" ? <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg> : <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>}
          </div>
          <h2 className="text-2xl font-bold mb-2">{phase === "won" ? "You Won!" : "Game Over"}</h2>
          <p className="text-xl font-bold mb-2" style={{ color: themeColor }}>Score: {score}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={startGame} style={{ backgroundColor: themeColor }}><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button>
          </div>
        </div>
      )}
    </div>
  )
}
