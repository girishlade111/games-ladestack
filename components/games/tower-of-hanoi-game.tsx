"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

type Pegs = number[][]

const DISC_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#4ade80", "#38bdf8", "#a78bfa", "#f472b6"]

function initial(discs: number): Pegs {
  return [Array.from({ length: discs }, (_, i) => discs - i), [], []]
}

export default function TowerOfHanoiGame({ themeColor = "#a21caf" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won">("menu")
  const [discs, setDiscs] = useState(3)
  const [pegs, setPegs] = useState<Pegs>(initial(3))
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [message, setMessage] = useState("")
  const [bests, setBests] = useState<Record<number, number>>({})

  const optimal = Math.pow(2, discs) - 1

  const start = useCallback((n: number) => {
    setDiscs(n)
    setPegs(initial(n))
    setSelected(null)
    setMoves(0)
    setMessage("")
    setPhase("playing")
  }, [])

  const clickPeg = useCallback(
    (p: number) => {
      if (phase !== "playing") return

      if (selected === null) {
        if (pegs[p].length === 0) return
        setSelected(p)
        return
      }

      if (selected === p) {
        setSelected(null)
        return
      }

      const from = pegs[selected]
      const to = pegs[p]
      const disc = from[from.length - 1]

      if (to.length > 0 && to[to.length - 1] < disc) {
        setMessage("Can't stack a larger disc on a smaller one")
        setSelected(null)
        setTimeout(() => setMessage(""), 1400)
        return
      }

      const next: Pegs = pegs.map((peg, i) =>
        i === selected ? peg.slice(0, -1) : i === p ? [...peg, disc] : [...peg]
      ) as Pegs
      setPegs(next)
      setSelected(null)
      const m = moves + 1
      setMoves(m)

      if (next[2].length === discs) {
        setPhase("won")
        setBests((b) => (b[discs] === undefined || m < b[discs] ? { ...b, [discs]: m } : b))
      }
    },
    [phase, selected, pegs, moves, discs]
  )

  const maxDiscW = 160

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🗼</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Tower of Hanoi</h2>
          <p className="text-muted-foreground mb-6">
            Move the whole stack to the right peg. One disc at a time, and never a larger disc onto a smaller one.
          </p>
          <div className="flex flex-col gap-3 items-center">
            {[3, 4, 5, 6].map((n) => (
              <Button key={n} onClick={() => start(n)} style={{ backgroundColor: themeColor }} size="lg" className="w-56">
                <Play className="w-5 h-5 mr-2" />
                {n} Discs · min {Math.pow(2, n) - 1} moves
              </Button>
            ))}
          </div>
          {Object.keys(bests).length > 0 && (
            <div className="mt-6 text-sm text-muted-foreground">
              {Object.entries(bests).map(([n, m]) => (
                <div key={n}>
                  Best {n} discs: {m} moves
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">Moves: {moves}</span>
            <span className="text-sm text-muted-foreground">Optimal: {optimal}</span>
            <Button variant="ghost" size="sm" onClick={() => start(discs)}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>

          {message && <div className="text-center text-sm text-red-500 mb-2">{message}</div>}

          <div className="grid grid-cols-3 gap-3">
            {pegs.map((peg, p) => (
              <button
                key={p}
                onClick={() => clickPeg(p)}
                className={`relative flex flex-col justify-end items-center h-64 rounded-xl border-2 transition-colors ${
                  selected === p ? "border-primary bg-primary/5" : "border-transparent bg-muted/60 hover:bg-muted"
                }`}
              >
                {/* Peg rod and base */}
                <div className="absolute bottom-3 w-2 h-52 rounded-t bg-foreground/25" />
                <div className="absolute bottom-0 w-full h-3 rounded-b-xl bg-foreground/35" />
                <div className="relative pb-3 flex flex-col items-center gap-1">
                  {peg.map((d, i) => (
                    <div
                      key={d}
                      className="h-6 rounded-md shadow-sm flex items-center justify-center text-[10px] font-bold text-black/60"
                      style={{
                        width: (maxDiscW * d) / discs,
                        backgroundColor: DISC_COLORS[(d - 1) % DISC_COLORS.length],
                        outline: selected === p && i === peg.length - 1 ? "2px solid currentColor" : "none",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <span className="absolute -bottom-6 text-xs text-muted-foreground">
                  {p === 0 ? "Start" : p === 2 ? "Goal" : "Spare"}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-10">
            {selected === null ? "Click a peg to pick up its top disc" : "Click another peg to place the disc"}
          </p>

          {phase === "won" && (
            <div className="text-center mt-4">
              <div className="text-lg font-bold text-green-500 mb-1">Tower Rebuilt!</div>
              <div className="text-sm text-muted-foreground mb-4">
                {moves} moves {moves === optimal ? "— that's perfect!" : `(optimal is ${optimal})`}
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => start(discs)} style={{ backgroundColor: themeColor }} size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPhase("menu")}>
                  Menu
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
