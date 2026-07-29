"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const TARGET_COUNT = 25
const AREA_H = 440

interface Target {
  x: number // percentage of arena width
  y: number // pixels from top
  r: number
}

function spawn(): Target {
  const r = 16 + Math.random() * 16
  return { x: 6 + Math.random() * 88, y: r + Math.random() * (AREA_H - r * 2), r }
}

export default function AimTrainerGame({ themeColor = "#b91c1c" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [target, setTarget] = useState<Target>(spawn())
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [best, setBest] = useState<number | null>(null)
  const shownAt = useRef(0)

  const start = useCallback(() => {
    setTarget(spawn())
    setHits(0)
    setMisses(0)
    setTimes([])
    setPhase("playing")
  }, [])

  // Stamp the reveal time whenever a new target appears.
  useEffect(() => {
    if (phase === "playing") shownAt.current = performance.now()
  }, [phase, target])

  const hitTarget = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (phase !== "playing") return

      const elapsed = performance.now() - shownAt.current
      const nextTimes = [...times, elapsed]
      const nextHits = hits + 1
      setTimes(nextTimes)
      setHits(nextHits)

      if (nextHits >= TARGET_COUNT) {
        const avg = nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length
        setBest((b) => (b === null ? avg : Math.min(b, avg)))
        setPhase("over")
        return
      }
      setTarget(spawn())
    },
    [phase, times, hits]
  )

  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0
  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md my-auto py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Aim Trainer</h2>
          <p className="text-muted-foreground mb-2">
            Click {TARGET_COUNT} targets as fast as you can. Missed clicks count against your accuracy.
          </p>
          {best !== null && <p className="text-sm text-muted-foreground mb-6">Best average: {Math.round(best)} ms</p>}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Training
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-3 gap-4 flex-wrap">
            <span className="text-sm font-medium">
              {hits} / {TARGET_COUNT}
            </span>
            <span className="text-sm text-muted-foreground">Accuracy: {accuracy}%</span>
            <span className="text-sm text-muted-foreground">Avg: {avg ? Math.round(avg) : "–"} ms</span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Restart
            </Button>
          </div>

          <div
            onClick={() => phase === "playing" && setMisses((m) => m + 1)}
            className="relative rounded-xl border bg-slate-900 cursor-crosshair overflow-hidden select-none"
            style={{ height: AREA_H }}
          >
            {phase === "playing" && (
              <button
                onClick={hitTarget}
                className="absolute rounded-full transition-transform hover:scale-105"
                style={{
                  left: `${target.x}%`,
                  top: target.y,
                  width: target.r * 2,
                  height: target.r * 2,
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle at 35% 30%, #fff 0%, ${themeColor} 55%, #7f1d1d 100%)`,
                  boxShadow: `0 0 18px ${themeColor}aa`,
                }}
                aria-label="Target"
              />
            )}
            {phase === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-start overflow-y-auto text-white">
                <div className="text-2xl font-bold mb-2">Session Complete</div>
                <div className="text-sm opacity-80 mb-1">Average reaction: {Math.round(avg)} ms</div>
                <div className="text-sm opacity-80 mb-1">Fastest hit: {Math.round(Math.min(...times))} ms</div>
                <div className="text-sm opacity-80 mb-5">Accuracy: {accuracy}%</div>
                <Button onClick={start} style={{ backgroundColor: themeColor }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Train Again
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">Clicking empty space counts as a miss</p>
        </div>
      )}
    </div>
  )
}
