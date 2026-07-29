"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const W = 340
const H = 520
const LANES = 4
const LANE_W = W / LANES
const CAR_W = 40
const CAR_H = 66

interface Traffic {
  lane: number
  y: number
  hue: number
}

export default function LaneRacerGame({ themeColor = "#be123c" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  const state = useRef({
    lane: 1,
    traffic: [] as Traffic[],
    speed: 3.6,
    dist: 0,
    road: 0,
    spawn: 0,
    running: false,
  })

  const reset = useCallback(() => {
    state.current = { lane: 1, traffic: [], speed: 3.6, dist: 0, road: 0, spawn: 0, running: true }
    setScore(0)
    setPhase("playing")
  }, [])

  const move = useCallback((delta: number) => {
    const s = state.current
    if (!s.running) return
    s.lane = Math.max(0, Math.min(LANES - 1, s.lane + delta))
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
        s.dist += s.speed
        s.road = (s.road + s.speed) % 44
        s.speed = Math.min(9, 3.6 + s.dist / 2600)
        setScore(Math.floor(s.dist / 12))

        s.spawn -= s.speed
        if (s.spawn <= 0) {
          // Leave at least one lane clear so the player always has an out.
          const blocked = Math.floor(Math.random() * LANES)
          for (let l = 0; l < LANES; l++) {
            if (l !== blocked && Math.random() < 0.55) s.traffic.push({ lane: l, y: -CAR_H, hue: Math.floor(Math.random() * 360) })
          }
          s.spawn = 150 + Math.random() * 90
        }

        s.traffic.forEach((t) => (t.y += s.speed))
        s.traffic = s.traffic.filter((t) => t.y < H + CAR_H)

        const py = H - CAR_H - 16
        const hit = s.traffic.some(
          (t) => t.lane === s.lane && t.y + CAR_H > py && t.y < py + CAR_H
        )
        if (hit) {
          s.running = false
          setPhase("over")
          setBest((b) => Math.max(b, Math.floor(s.dist / 12)))
        }
      }

      ctx.fillStyle = "#1f2937"
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = "rgba(255,255,255,0.35)"
      ctx.lineWidth = 3
      ctx.setLineDash([22, 22])
      for (let l = 1; l < LANES; l++) {
        ctx.beginPath()
        ctx.moveTo(l * LANE_W, s.road - 44)
        ctx.lineTo(l * LANE_W, H)
        ctx.stroke()
      }
      ctx.setLineDash([])

      const car = (x: number, y: number, fill: string) => {
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.roundRect(x, y, CAR_W, CAR_H, 8)
        ctx.fill()
        ctx.fillStyle = "rgba(255,255,255,0.4)"
        ctx.beginPath()
        ctx.roundRect(x + 6, y + 10, CAR_W - 12, 18, 4)
        ctx.fill()
      }

      s.traffic.forEach((t) => car(t.lane * LANE_W + (LANE_W - CAR_W) / 2, t.y, `hsl(${t.hue} 65% 55%)`))
      if (s.running) car(s.lane * LANE_W + (LANE_W - CAR_W) / 2, H - CAR_H - 16, themeColor)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, themeColor])

  useEffect(() => {
    if (phase !== "playing") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        e.preventDefault()
        move(-1)
      } else if (e.key === "ArrowRight" || e.key === "d") {
        e.preventDefault()
        move(1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, move])

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md my-auto py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🏎️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Lane Racer</h2>
          <p className="text-muted-foreground mb-2">Weave through traffic with the arrow keys. The longer you survive, the faster it gets.</p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best: {best} m</p>}
          <Button onClick={reset} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Race
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3" style={{ width: W }}>
            <span className="text-sm font-medium">{score} m</span>
            <span className="text-sm text-muted-foreground">Best: {best} m</span>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>
          <div className="relative">
            <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border max-w-full" />
            {phase === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-start overflow-y-auto bg-black/70 rounded-lg text-white">
                <div className="text-xl font-bold mb-1">Crashed!</div>
                <div className="text-sm mb-4 opacity-80">{score} m travelled</div>
                <Button onClick={reset} style={{ backgroundColor: themeColor }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Race Again
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3 mt-3">
            <Button variant="outline" size="lg" onClick={() => move(-1)} className="w-24">
              ←
            </Button>
            <Button variant="outline" size="lg" onClick={() => move(1)} className="w-24">
              →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
