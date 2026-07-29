"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const W = 360
const H = 520
const BLOCK_H = 26
const BASE_W = 180

interface Block {
  x: number
  w: number
}

export default function StackTowerGame({ themeColor = "#c2410c" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  const state = useRef({
    stack: [] as Block[],
    cur: { x: 0, w: BASE_W },
    dir: 1,
    speed: 2.2,
    running: false,
  })

  const reset = useCallback(() => {
    state.current.stack = [{ x: (W - BASE_W) / 2, w: BASE_W }]
    state.current.cur = { x: 0, w: BASE_W }
    state.current.dir = 1
    state.current.speed = 2.2
    state.current.running = true
    setScore(0)
    setPhase("playing")
  }, [])

  const drop = useCallback(() => {
    const s = state.current
    if (!s.running) return
    const top = s.stack[s.stack.length - 1]
    const left = Math.max(s.cur.x, top.x)
    const right = Math.min(s.cur.x + s.cur.w, top.x + top.w)
    const overlap = right - left

    if (overlap <= 0) {
      s.running = false
      setPhase("over")
      setBest((b) => Math.max(b, s.stack.length - 1))
      return
    }

    s.stack.push({ x: left, w: overlap })
    setScore(s.stack.length - 1)
    s.speed = Math.min(6.5, s.speed + 0.16)
    s.cur = { x: s.dir > 0 ? 0 : W - overlap, w: overlap }
    s.dir *= -1
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
        s.cur.x += s.dir * s.speed
        if (s.cur.x <= 0) {
          s.cur.x = 0
          s.dir = 1
        } else if (s.cur.x + s.cur.w >= W) {
          s.cur.x = W - s.cur.w
          s.dir = -1
        }
      }

      ctx.fillStyle = "#0f172a"
      ctx.fillRect(0, 0, W, H)

      // The camera follows the tower once it grows past the lower half.
      const camera = Math.max(0, s.stack.length * BLOCK_H - H * 0.55)
      const yFor = (i: number) => H - 40 - i * BLOCK_H + camera

      s.stack.forEach((b, i) => {
        const y = yFor(i)
        if (y < -BLOCK_H || y > H) return
        ctx.fillStyle = `hsl(${(i * 14 + 190) % 360} 72% ${45 + (i % 3) * 6}%)`
        ctx.fillRect(b.x, y, b.w, BLOCK_H - 2)
      })

      if (s.running) {
        ctx.fillStyle = themeColor
        ctx.fillRect(s.cur.x, yFor(s.stack.length), s.cur.w, BLOCK_H - 2)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, themeColor])

  useEffect(() => {
    if (phase !== "playing") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        drop()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, drop])

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🏗️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Stack Tower</h2>
          <p className="text-muted-foreground mb-2">Tap or press Space to drop each block. Misaligned edges get trimmed away.</p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best: {best} blocks</p>}
          <Button onClick={reset} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3" style={{ width: W }}>
            <span className="text-sm font-medium">Height: {score}</span>
            <span className="text-sm text-muted-foreground">Best: {best}</span>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              onClick={drop}
              className="rounded-lg border cursor-pointer max-w-full"
              style={{ touchAction: "manipulation" }}
            />
            {phase === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg text-white">
                <div className="text-xl font-bold mb-1">Tower Collapsed</div>
                <div className="text-sm mb-4 opacity-80">{score} blocks stacked</div>
                <Button onClick={reset} style={{ backgroundColor: themeColor }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">Click the tower or press Space to drop</p>
        </div>
      )}
    </div>
  )
}
