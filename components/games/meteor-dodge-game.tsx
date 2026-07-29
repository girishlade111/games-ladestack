"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const W = 360
const H = 500
const SHIP_W = 30
const SHIP_H = 26

interface Meteor {
  x: number
  y: number
  r: number
  vy: number
  vx: number
}

interface Star {
  x: number
  y: number
  s: number
}

export default function MeteorDodgeGame({ themeColor = "#c2410c" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  const state = useRef({
    x: W / 2,
    meteors: [] as Meteor[],
    stars: [] as Star[],
    spawn: 0,
    frames: 0,
    left: false,
    right: false,
    pointer: null as number | null,
    running: false,
  })

  const reset = useCallback(() => {
    state.current = {
      x: W / 2,
      meteors: [],
      stars: Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.4 + Math.random() * 1.4 })),
      spawn: 0,
      frames: 0,
      left: false,
      right: false,
      pointer: null,
      running: true,
    }
    setScore(0)
    setPhase("playing")
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
        s.frames += 1
        setScore(Math.floor(s.frames / 6))

        if (s.pointer !== null) s.x = s.pointer
        else if (s.left) s.x -= 5.5
        else if (s.right) s.x += 5.5
        s.x = Math.max(SHIP_W / 2, Math.min(W - SHIP_W / 2, s.x))

        const difficulty = 1 + s.frames / 1800
        s.spawn -= 1
        if (s.spawn <= 0) {
          const r = 9 + Math.random() * 16
          s.meteors.push({
            x: r + Math.random() * (W - r * 2),
            y: -r,
            r,
            vy: (1.9 + Math.random() * 1.9) * difficulty,
            vx: (Math.random() - 0.5) * 1.4,
          })
          s.spawn = Math.max(9, 30 - s.frames / 140)
        }

        s.meteors.forEach((m) => {
          m.y += m.vy
          m.x += m.vx
          if (m.x < m.r || m.x > W - m.r) m.vx *= -1
        })
        s.meteors = s.meteors.filter((m) => m.y < H + m.r)

        s.stars.forEach((st) => {
          st.y += st.s
          if (st.y > H) {
            st.y = 0
            st.x = Math.random() * W
          }
        })

        // Circle vs. ship bounding box, shrunk a little to feel forgiving.
        const shipTop = H - 44
        const hit = s.meteors.some((m) => {
          const nx = Math.max(s.x - SHIP_W / 2 + 3, Math.min(m.x, s.x + SHIP_W / 2 - 3))
          const ny = Math.max(shipTop + 3, Math.min(m.y, shipTop + SHIP_H - 3))
          return (m.x - nx) ** 2 + (m.y - ny) ** 2 < m.r * m.r
        })
        if (hit) {
          s.running = false
          setPhase("over")
          setBest((b) => Math.max(b, Math.floor(s.frames / 6)))
        }
      }

      ctx.fillStyle = "#020617"
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = "rgba(255,255,255,0.7)"
      s.stars.forEach((st) => ctx.fillRect(st.x, st.y, st.s, st.s))

      s.meteors.forEach((m) => {
        const g = ctx.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.3, m.r * 0.2, m.x, m.y, m.r)
        g.addColorStop(0, "#fed7aa")
        g.addColorStop(0.6, "#ea580c")
        g.addColorStop(1, "#7c2d12")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      })

      if (s.running) {
        const y = H - 44
        ctx.fillStyle = themeColor
        ctx.beginPath()
        ctx.moveTo(s.x, y)
        ctx.lineTo(s.x + SHIP_W / 2, y + SHIP_H)
        ctx.lineTo(s.x, y + SHIP_H - 7)
        ctx.lineTo(s.x - SHIP_W / 2, y + SHIP_H)
        ctx.closePath()
        ctx.fill()
        // Thruster flicker
        ctx.fillStyle = "rgba(253,224,71,0.85)"
        ctx.beginPath()
        ctx.moveTo(s.x - 4, y + SHIP_H - 6)
        ctx.lineTo(s.x, y + SHIP_H + 6 + Math.random() * 5)
        ctx.lineTo(s.x + 4, y + SHIP_H - 6)
        ctx.closePath()
        ctx.fill()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, themeColor])

  useEffect(() => {
    if (phase !== "playing") return
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") state.current.left = true
      if (e.key === "ArrowRight" || e.key === "d") state.current.right = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") state.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") state.current.right = false
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [phase])

  const trackPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    state.current.pointer = ((e.clientX - rect.left) / rect.width) * W
  }

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">☄️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Meteor Dodge</h2>
          <p className="text-muted-foreground mb-2">
            Steer your ship through a thickening meteor shower. Arrow keys or drag across the canvas.
          </p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best: {best}</p>}
          <Button onClick={reset} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Launch
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3" style={{ width: W }}>
            <span className="text-sm font-medium">Score: {score}</span>
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
              onPointerMove={trackPointer}
              onPointerDown={trackPointer}
              onPointerLeave={() => (state.current.pointer = null)}
              className="rounded-lg border max-w-full touch-none"
            />
            {phase === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg text-white">
                <div className="text-xl font-bold mb-1">Ship Destroyed</div>
                <div className="text-sm mb-4 opacity-80">Score: {score}</div>
                <Button onClick={reset} style={{ backgroundColor: themeColor }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Launch Again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
