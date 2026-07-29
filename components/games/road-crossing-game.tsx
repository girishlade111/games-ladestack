"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const COLS = 11
const ROWS = 13
const CELL = 32
const W = COLS * CELL
const H = ROWS * CELL

interface Row {
  kind: "safe" | "road"
  dir: number
  speed: number
  cars: number[]
  gap: number
}

function buildRows(): Row[] {
  return Array.from({ length: ROWS }, (_, r) => {
    // Bottom start row and top goal row are always safe, plus a mid-board rest.
    if (r === ROWS - 1 || r === 0 || r === 6) return { kind: "safe", dir: 1, speed: 0, cars: [], gap: 0 }
    const dir = r % 2 === 0 ? 1 : -1
    const speed = 0.35 + Math.random() * 0.5
    const gap = 3 + Math.floor(Math.random() * 2)
    const cars: number[] = []
    for (let c = 0; c < COLS; c += gap) cars.push(c + Math.random())
    return { kind: "road", dir, speed, cars, gap }
  })
}

export default function RoadCrossingGame({ themeColor = "#4d7c0f" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [lives, setLives] = useState(3)

  const state = useRef({
    rows: buildRows(),
    px: Math.floor(COLS / 2),
    py: ROWS - 1,
    lives: 3,
    crossings: 0,
    running: false,
  })

  const reset = useCallback(() => {
    state.current = { rows: buildRows(), px: Math.floor(COLS / 2), py: ROWS - 1, lives: 3, crossings: 0, running: true }
    setScore(0)
    setLives(3)
    setPhase("playing")
  }, [])

  const step = useCallback((dx: number, dy: number) => {
    const s = state.current
    if (!s.running) return
    s.px = Math.max(0, Math.min(COLS - 1, s.px + dx))
    s.py = Math.max(0, Math.min(ROWS - 1, s.py + dy))
    if (s.py === 0) {
      s.crossings += 1
      setScore(s.crossings * 100)
      s.px = Math.floor(COLS / 2)
      s.py = ROWS - 1
      // Fresh traffic pattern each time the goal is reached.
      s.rows = buildRows()
    }
  }, [])

  useEffect(() => {
    if (phase !== "playing") return
    let raf = 0
    const loop = () => {
      const s = state.current
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      if (s.running) {
        s.rows.forEach((row) => {
          if (row.kind !== "road") return
          row.cars = row.cars.map((c) => {
            let nc = c + row.dir * row.speed * 0.08
            if (nc > COLS + 1) nc = -1
            if (nc < -1) nc = COLS + 1
            return nc
          })
        })

        const row = s.rows[s.py]
        if (row.kind === "road" && row.cars.some((c) => Math.abs(c - s.px) < 0.85)) {
          s.lives -= 1
          setLives(s.lives)
          s.px = Math.floor(COLS / 2)
          s.py = ROWS - 1
          if (s.lives <= 0) {
            s.running = false
            setPhase("over")
            setBest((b) => Math.max(b, s.crossings * 100))
          }
        }
      }

      s.rows.forEach((row, r) => {
        ctx.fillStyle = r === 0 ? "#facc15" : row.kind === "safe" ? "#65a30d" : "#334155"
        ctx.fillRect(0, r * CELL, W, CELL)
        if (row.kind === "road") {
          ctx.strokeStyle = "rgba(255,255,255,0.18)"
          ctx.lineWidth = 2
          ctx.setLineDash([10, 12])
          ctx.beginPath()
          ctx.moveTo(0, r * CELL + CELL / 2)
          ctx.lineTo(W, r * CELL + CELL / 2)
          ctx.stroke()
          ctx.setLineDash([])
          row.cars.forEach((c) => {
            ctx.fillStyle = row.dir > 0 ? "#f87171" : "#60a5fa"
            ctx.beginPath()
            ctx.roundRect(c * CELL + 3, r * CELL + 6, CELL - 6, CELL - 12, 5)
            ctx.fill()
          })
        }
      })

      if (s.running) {
        ctx.fillStyle = themeColor
        ctx.beginPath()
        ctx.roundRect(s.px * CELL + 5, s.py * CELL + 5, CELL - 10, CELL - 10, 6)
        ctx.fill()
        ctx.fillStyle = "#fff"
        ctx.beginPath()
        ctx.arc(s.px * CELL + CELL / 2 - 4, s.py * CELL + CELL / 2 - 2, 2, 0, Math.PI * 2)
        ctx.arc(s.px * CELL + CELL / 2 + 4, s.py * CELL + CELL / 2 - 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, themeColor])

  useEffect(() => {
    if (phase !== "playing") return
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
      }
      const m = map[e.key]
      if (m) {
        e.preventDefault()
        step(m[0], m[1])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, step])

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md my-auto py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🐸</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Road Crossing</h2>
          <p className="text-muted-foreground mb-2">Hop across the traffic to the yellow goal line. Three lives, endless lanes.</p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best: {best}</p>}
          <Button onClick={reset} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3" style={{ width: W }}>
            <span className="text-sm font-medium">Score: {score}</span>
            <span className="text-sm">{"❤️".repeat(Math.max(0, lives))}</span>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>
          <div className="relative">
            <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border max-w-full" />
            {phase === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-start overflow-y-auto bg-black/70 rounded-lg text-white">
                <div className="text-xl font-bold mb-1">Game Over</div>
                <div className="text-sm mb-4 opacity-80">Score: {score}</div>
                <Button onClick={reset} style={{ backgroundColor: themeColor }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 w-44 mx-auto">
            <span />
            <Button variant="outline" size="sm" onClick={() => step(0, -1)}>
              ↑
            </Button>
            <span />
            <Button variant="outline" size="sm" onClick={() => step(-1, 0)}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={() => step(0, 1)}>
              ↓
            </Button>
            <Button variant="outline" size="sm" onClick={() => step(1, 0)}>
              →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
