"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const N = 5

type Board = boolean[]

/** Toggle a cell and its orthogonal neighbours. */
function press(board: Board, i: number): Board {
  const next = [...board]
  const r = Math.floor(i / N)
  const c = i % N
  const flip = (idx: number) => {
    next[idx] = !next[idx]
  }
  flip(i)
  if (r > 0) flip(i - N)
  if (r < N - 1) flip(i + N)
  if (c > 0) flip(i - 1)
  if (c < N - 1) flip(i + 1)
  return next
}

/** Build a puzzle by pressing random cells from solved, so a solution exists. */
function scramble(difficulty: number): Board {
  let board: Board = Array(N * N).fill(false)
  const presses = new Set<number>()
  while (presses.size < difficulty) presses.add(Math.floor(Math.random() * N * N))
  presses.forEach((i) => (board = press(board, i)))
  // A board that scrambled back to all-off would already be solved.
  return board.some(Boolean) ? board : press(board, 12)
}

export default function LightsOutGame({ themeColor = "#b45309" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won">("menu")
  const [board, setBoard] = useState<Board>(Array(N * N).fill(false))
  const [moves, setMoves] = useState(0)
  const [level, setLevel] = useState(1)
  const [best, setBest] = useState(0)

  const start = useCallback((lvl: number) => {
    setLevel(lvl)
    setBoard(scramble(2 + lvl))
    setMoves(0)
    setPhase("playing")
  }, [])

  const click = useCallback(
    (i: number) => {
      if (phase !== "playing") return
      const next = press(board, i)
      setBoard(next)
      setMoves((m) => m + 1)
      if (!next.some(Boolean)) {
        setPhase("won")
        setBest((b) => Math.max(b, level))
      }
    },
    [phase, board, level]
  )

  const lit = board.filter(Boolean).length

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">💡</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Lights Out</h2>
          <p className="text-muted-foreground mb-2">
            Clicking a light toggles it and its four neighbours. Turn every light off to clear the level.
          </p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best level cleared: {best}</p>}
          <Button onClick={() => start(1)} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3 gap-6">
            <span className="text-sm font-medium">Level {level}</span>
            <span className="text-sm text-muted-foreground">Moves: {moves}</span>
            <span className="text-sm text-muted-foreground">Lit: {lit}</span>
            <Button variant="ghost" size="sm" onClick={() => start(level)}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>
          <div className="grid gap-2 p-3 rounded-xl bg-muted" style={{ gridTemplateColumns: `repeat(${N}, 56px)` }}>
            {board.map((on, i) => (
              <button
                key={i}
                onClick={() => click(i)}
                className="w-14 h-14 rounded-lg transition-all active:scale-95"
                style={{
                  backgroundColor: on ? themeColor : "rgba(120,120,130,0.25)",
                  boxShadow: on ? `0 0 16px ${themeColor}` : "inset 0 1px 3px rgba(0,0,0,0.25)",
                }}
                aria-label={`Light ${i + 1} ${on ? "on" : "off"}`}
              />
            ))}
          </div>
          {phase === "won" && (
            <div className="text-center mt-6">
              <div className="text-lg font-bold text-green-500 mb-1">Lights Out!</div>
              <div className="text-sm text-muted-foreground mb-4">Level {level} cleared in {moves} moves</div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => start(level + 1)} style={{ backgroundColor: themeColor }} size="sm">
                  Next Level
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
