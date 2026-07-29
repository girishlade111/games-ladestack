"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const LANES = 4
const LANE_KEYS = ["d", "f", "j", "k"]
const LANE_COLORS = ["#f472b6", "#c084fc", "#60a5fa", "#4ade80"]
const W = 320
const H = 480
const HIT_Y = H - 60
const NOTE_H = 18
const PERFECT = 18
const GOOD = 38

interface Note {
  id: number
  lane: number
  y: number
  hit: boolean
}

export default function RhythmTapGame({ themeColor = "#a21caf" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [best, setBest] = useState(0)
  const [judgement, setJudgement] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [flash, setFlash] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)

  const engine = useRef({ notes: [] as Note[], nextId: 0, spawn: 0, speed: 3.2, elapsed: 0, running: false })

  const start = useCallback(() => {
    engine.current = { notes: [], nextId: 0, spawn: 0, speed: 3.2, elapsed: 0, running: true }
    setNotes([])
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setMisses(0)
    setJudgement("")
    setPhase("playing")
  }, [])

  useEffect(() => {
    if (phase !== "playing") return
    let raf = 0
    const loop = () => {
      const e = engine.current
      if (e.running) {
        e.elapsed += 1
        e.speed = Math.min(7, 3.2 + e.elapsed / 900)

        e.spawn -= 1
        if (e.spawn <= 0) {
          e.notes.push({ id: e.nextId++, lane: Math.floor(Math.random() * LANES), y: -NOTE_H, hit: false })
          e.spawn = Math.max(22, 46 - e.elapsed / 120)
        }

        e.notes.forEach((n) => (n.y += e.speed))

        // Notes that slip past the hit line break the combo.
        const escaped = e.notes.filter((n) => !n.hit && n.y > HIT_Y + GOOD)
        if (escaped.length) {
          setCombo(0)
          setJudgement("Miss")
          setMisses((m) => {
            const next = m + escaped.length
            if (next >= 15) {
              e.running = false
              setPhase("over")
            }
            return next
          })
        }

        e.notes = e.notes.filter((n) => !n.hit && n.y <= HIT_Y + GOOD)
        setNotes([...e.notes])
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useEffect(() => {
    if (phase === "over") {
      setBest((b) => Math.max(b, score))
    }
  }, [phase, score])

  const tapLane = useCallback(
    (lane: number) => {
      if (phase !== "playing") return
      setFlash(lane)
      setTimeout(() => setFlash(null), 90)

      const e = engine.current
      // Closest un-hit note in this lane wins the tap.
      let target: Note | null = null
      let bestDist = Infinity
      for (const n of e.notes) {
        if (n.lane !== lane || n.hit) continue
        const dist = Math.abs(n.y + NOTE_H / 2 - HIT_Y)
        if (dist < bestDist) {
          bestDist = dist
          target = n
        }
      }

      if (!target || bestDist > GOOD) {
        setCombo(0)
        setJudgement("Miss")
        return
      }

      target.hit = true
      e.notes = e.notes.filter((n) => n !== target)
      setNotes([...e.notes])

      const perfect = bestDist <= PERFECT
      setJudgement(perfect ? "Perfect!" : "Good")
      setCombo((c) => {
        const nc = c + 1
        setMaxCombo((m) => Math.max(m, nc))
        setScore((s) => s + (perfect ? 100 : 50) + Math.min(nc, 20) * 2)
        return nc
      })
    },
    [phase]
  )

  useEffect(() => {
    if (phase !== "playing") return
    const onKey = (ev: KeyboardEvent) => {
      const lane = LANE_KEYS.indexOf(ev.key.toLowerCase())
      if (lane >= 0) {
        ev.preventDefault()
        tapLane(lane)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, tapLane])

  const laneW = W / LANES

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🎵</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Rhythm Tap</h2>
          <p className="text-muted-foreground mb-2">
            Hit each note as it crosses the line using D, F, J, K — or tap the pads. Fifteen misses ends the run.
          </p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best score: {best}</p>}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3" style={{ width: W }}>
            <span className="text-sm font-medium">{score}</span>
            <span className="text-sm text-muted-foreground">Combo {combo}</span>
            <span className="text-xs text-muted-foreground">Miss {misses}/15</span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="relative rounded-xl border overflow-hidden bg-slate-950" style={{ width: W, height: H }}>
            {/* Lane dividers */}
            {Array.from({ length: LANES - 1 }, (_, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: (i + 1) * laneW }} />
            ))}

            {/* Hit line */}
            <div className="absolute left-0 right-0 h-1 bg-white/60" style={{ top: HIT_Y }} />

            {notes.map((n) => (
              <div
                key={n.id}
                className="absolute rounded-md"
                style={{
                  left: n.lane * laneW + 6,
                  top: n.y,
                  width: laneW - 12,
                  height: NOTE_H,
                  backgroundColor: LANE_COLORS[n.lane],
                  boxShadow: `0 0 10px ${LANE_COLORS[n.lane]}99`,
                }}
              />
            ))}

            {judgement && (
              <div
                className={`absolute left-0 right-0 text-center text-sm font-bold ${
                  judgement === "Perfect!" ? "text-yellow-300" : judgement === "Good" ? "text-emerald-300" : "text-red-400"
                }`}
                style={{ top: HIT_Y - 46 }}
              >
                {judgement}
              </div>
            )}

            {/* Tap pads */}
            <div className="absolute left-0 right-0 bottom-0 flex" style={{ height: H - HIT_Y }}>
              {Array.from({ length: LANES }, (_, i) => (
                <button
                  key={i}
                  onPointerDown={() => tapLane(i)}
                  className="flex-1 border-t border-white/20 text-xs font-bold text-white/70 transition-colors"
                  style={{ backgroundColor: flash === i ? `${LANE_COLORS[i]}66` : "rgba(255,255,255,0.05)" }}
                >
                  {LANE_KEYS[i].toUpperCase()}
                </button>
              ))}
            </div>

            {phase === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                <div className="text-xl font-bold mb-2">Song Over</div>
                <div className="text-sm opacity-80 mb-1">Score: {score}</div>
                <div className="text-sm opacity-80 mb-5">Max combo: {maxCombo}</div>
                <Button onClick={start} style={{ backgroundColor: themeColor }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
