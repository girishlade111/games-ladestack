"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const SIZE = 5 // dots per side -> 4x4 boxes
const BOXES = SIZE - 1
const GAP = 60
const PAD = 24

type Owner = 0 | 1 | 2

interface State {
  h: boolean[] // horizontal edges: SIZE rows x BOXES cols
  v: boolean[] // vertical edges: BOXES rows x SIZE cols
  boxes: Owner[]
}

function emptyState(): State {
  return {
    h: Array(SIZE * BOXES).fill(false),
    v: Array(BOXES * SIZE).fill(false),
    boxes: Array(BOXES * BOXES).fill(0) as Owner[],
  }
}

function boxEdges(r: number, c: number) {
  return {
    top: r * BOXES + c,
    bottom: (r + 1) * BOXES + c,
    left: r * SIZE + c,
    right: r * SIZE + c + 1,
  }
}

function edgeCount(s: State, r: number, c: number): number {
  const e = boxEdges(r, c)
  return [s.h[e.top], s.h[e.bottom], s.v[e.left], s.v[e.right]].filter(Boolean).length
}

/** Draw an edge and claim any box it completes. Returns the new state + gain. */
function drawEdge(s: State, kind: "h" | "v", idx: number, player: Owner): { state: State; claimed: number } {
  const next: State = { h: [...s.h], v: [...s.v], boxes: [...s.boxes] }
  next[kind][idx] = true

  let claimed = 0
  for (let r = 0; r < BOXES; r++) {
    for (let c = 0; c < BOXES; c++) {
      if (next.boxes[r * BOXES + c] === 0 && edgeCount(next, r, c) === 4) {
        next.boxes[r * BOXES + c] = player
        claimed++
      }
    }
  }
  return { state: next, claimed }
}

function freeEdges(s: State): Array<{ kind: "h" | "v"; idx: number }> {
  const out: Array<{ kind: "h" | "v"; idx: number }> = []
  s.h.forEach((taken, i) => !taken && out.push({ kind: "h", idx: i }))
  s.v.forEach((taken, i) => !taken && out.push({ kind: "v", idx: i }))
  return out
}

export default function DotsAndBoxesGame({ themeColor = "#0369a1" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [state, setState] = useState<State>(emptyState())
  const [turn, setTurn] = useState<Owner>(1)
  const [record, setRecord] = useState({ wins: 0, losses: 0, draws: 0 })

  const start = useCallback(() => {
    setState(emptyState())
    setTurn(1)
    setPhase("playing")
  }, [])

  const you = state.boxes.filter((b) => b === 1).length
  const ai = state.boxes.filter((b) => b === 2).length

  const commit = useCallback(
    (kind: "h" | "v", idx: number, player: Owner) => {
      const { state: next, claimed } = drawEdge(state, kind, idx, player)
      setState(next)

      if (freeEdges(next).length === 0) {
        const y = next.boxes.filter((b) => b === 1).length
        const a = next.boxes.filter((b) => b === 2).length
        setPhase("over")
        setRecord((r) => ({
          wins: r.wins + (y > a ? 1 : 0),
          losses: r.losses + (a > y ? 1 : 0),
          draws: r.draws + (y === a ? 1 : 0),
        }))
        return
      }
      // Completing a box grants another turn.
      if (claimed === 0) setTurn(player === 1 ? 2 : 1)
    },
    [state]
  )

  const clickEdge = useCallback(
    (kind: "h" | "v", idx: number) => {
      if (phase !== "playing" || turn !== 1 || state[kind][idx]) return
      commit(kind, idx, 1)
    },
    [phase, turn, state, commit]
  )

  useEffect(() => {
    if (phase !== "playing" || turn !== 2) return
    const timer = setTimeout(() => {
      const free = freeEdges(state)
      if (!free.length) return

      // Prefer an edge that completes a box; otherwise avoid handing one over.
      const scoring = free.filter((e) => drawEdge(state, e.kind, e.idx, 2).claimed > 0)
      const safe = free.filter((e) => {
        const { state: after } = drawEdge(state, e.kind, e.idx, 2)
        return !freeEdges(after).some((f) => drawEdge(after, f.kind, f.idx, 1).claimed > 0)
      })
      const pool = scoring.length ? scoring : safe.length ? safe : free
      const pick = pool[Math.floor(Math.random() * pool.length)]
      commit(pick.kind, pick.idx, 2)
    }, 480)
    return () => clearTimeout(timer)
  }, [phase, turn, state, commit])

  const boardPx = PAD * 2 + GAP * BOXES
  const lineColors: Record<Owner, string> = { 0: "transparent", 1: themeColor, 2: "#f97316" }

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">▪️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Dots &amp; Boxes</h2>
          <p className="text-muted-foreground mb-2">
            Draw a line between two dots. Close a square to claim it and take another turn. Most boxes wins.
          </p>
          {record.wins + record.losses + record.draws > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              Record: {record.wins}W · {record.losses}L · {record.draws}D
            </p>
          )}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3 gap-6">
            <span className="text-sm font-medium" style={{ color: themeColor }}>
              You: {you}
            </span>
            <span className="text-sm text-muted-foreground">
              {phase === "over" ? (you > ai ? "You win!" : ai > you ? "AI wins" : "Draw") : turn === 1 ? "Your turn" : "AI thinking..."}
            </span>
            <span className="text-sm font-medium text-orange-500">AI: {ai}</span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="relative rounded-lg border bg-card" style={{ width: boardPx, height: boardPx }}>
            {/* Claimed boxes */}
            {state.boxes.map((owner, i) => {
              if (owner === 0) return null
              const r = Math.floor(i / BOXES)
              const c = i % BOXES
              return (
                <div
                  key={`b${i}`}
                  className="absolute flex items-center justify-center text-xs font-bold text-white/90"
                  style={{
                    left: PAD + c * GAP,
                    top: PAD + r * GAP,
                    width: GAP,
                    height: GAP,
                    backgroundColor: owner === 1 ? `${themeColor}55` : "#f9731655",
                  }}
                >
                  {owner === 1 ? "You" : "AI"}
                </div>
              )
            })}

            {/* Horizontal edges */}
            {state.h.map((taken, i) => {
              const r = Math.floor(i / BOXES)
              const c = i % BOXES
              return (
                <button
                  key={`h${i}`}
                  onClick={() => clickEdge("h", i)}
                  disabled={taken || phase !== "playing" || turn !== 1}
                  className="absolute rounded-full transition-colors"
                  style={{
                    left: PAD + c * GAP + 6,
                    top: PAD + r * GAP - 4,
                    width: GAP - 12,
                    height: 8,
                    backgroundColor: taken ? themeColor : "rgba(125,125,135,0.18)",
                  }}
                  aria-label="Horizontal line"
                />
              )
            })}

            {/* Vertical edges */}
            {state.v.map((taken, i) => {
              const r = Math.floor(i / SIZE)
              const c = i % SIZE
              return (
                <button
                  key={`v${i}`}
                  onClick={() => clickEdge("v", i)}
                  disabled={taken || phase !== "playing" || turn !== 1}
                  className="absolute rounded-full transition-colors"
                  style={{
                    left: PAD + c * GAP - 4,
                    top: PAD + r * GAP + 6,
                    width: 8,
                    height: GAP - 12,
                    backgroundColor: taken ? themeColor : "rgba(125,125,135,0.18)",
                  }}
                  aria-label="Vertical line"
                />
              )
            })}

            {/* Dots on top so they read as the grid anchors */}
            {Array.from({ length: SIZE * SIZE }, (_, i) => (
              <span
                key={`d${i}`}
                className="absolute w-2.5 h-2.5 rounded-full bg-foreground"
                style={{ left: PAD + (i % SIZE) * GAP - 5, top: PAD + Math.floor(i / SIZE) * GAP - 5 }}
              />
            ))}
          </div>

          {phase === "over" && (
            <div className="text-center mt-6">
              <div className="text-lg font-bold mb-1">{you > ai ? "You win!" : ai > you ? "AI wins" : "It's a draw"}</div>
              <div className="text-sm text-muted-foreground mb-4">
                {you} – {ai}
              </div>
              <Button onClick={start} style={{ backgroundColor: themeColor }} size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
