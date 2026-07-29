"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const N = 13
type Cell = 0 | 1 | 2 // empty | player | AI
type Board = Cell[]

const LINES: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
]

function inBounds(r: number, c: number) {
  return r >= 0 && r < N && c >= 0 && c < N
}

/** Longest run through (r,c) for `player`, and whether it reaches five. */
function runLength(board: Board, r: number, c: number, player: Cell): number {
  let best = 0
  for (const [dr, dc] of LINES) {
    let len = 1
    for (const sign of [1, -1]) {
      let rr = r + dr * sign
      let cc = c + dc * sign
      while (inBounds(rr, cc) && board[rr * N + cc] === player) {
        len++
        rr += dr * sign
        cc += dc * sign
      }
    }
    best = Math.max(best, len)
  }
  return best
}

/** Heuristic value of placing `player` at idx: reward own runs and open ends. */
function scoreMove(board: Board, idx: number, player: Cell): number {
  const r = Math.floor(idx / N)
  const c = idx % N
  let total = 0
  for (const [dr, dc] of LINES) {
    let len = 1
    let openEnds = 0
    for (const sign of [1, -1]) {
      let rr = r + dr * sign
      let cc = c + dc * sign
      while (inBounds(rr, cc) && board[rr * N + cc] === player) {
        len++
        rr += dr * sign
        cc += dc * sign
      }
      if (inBounds(rr, cc) && board[rr * N + cc] === 0) openEnds++
    }
    if (len >= 5) total += 1_000_000
    else if (len === 4) total += openEnds === 2 ? 50_000 : openEnds === 1 ? 8_000 : 0
    else if (len === 3) total += openEnds === 2 ? 4_000 : openEnds === 1 ? 600 : 0
    else if (len === 2) total += openEnds === 2 ? 300 : openEnds === 1 ? 60 : 0
    else total += openEnds * 8
  }
  // Nudge play toward the centre when nothing else separates candidates.
  total += 12 - (Math.abs(r - 6) + Math.abs(c - 6))
  return total
}

/** Only consider empties near existing stones — keeps the AI fast and sane. */
function candidates(board: Board): number[] {
  const out: number[] = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (board[r * N + c] !== 0) continue
      let near = false
      for (let dr = -2; dr <= 2 && !near; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (inBounds(r + dr, c + dc) && board[(r + dr) * N + c + dc] !== 0) {
            near = true
            break
          }
        }
      }
      if (near) out.push(r * N + c)
    }
  }
  return out
}

export default function GomokuGame({ themeColor = "#44403c" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [board, setBoard] = useState<Board>(Array(N * N).fill(0) as Board)
  const [turn, setTurn] = useState<Cell>(1)
  const [result, setResult] = useState("")
  const [last, setLast] = useState<number | null>(null)
  const [record, setRecord] = useState({ wins: 0, losses: 0 })

  const start = useCallback(() => {
    setBoard(Array(N * N).fill(0) as Board)
    setTurn(1)
    setResult("")
    setLast(null)
    setPhase("playing")
  }, [])

  const place = useCallback(
    (idx: number) => {
      if (phase !== "playing" || turn !== 1 || board[idx] !== 0) return
      const next = [...board] as Board
      next[idx] = 1
      setBoard(next)
      setLast(idx)

      if (runLength(next, Math.floor(idx / N), idx % N, 1) >= 5) {
        setPhase("over")
        setResult("You win!")
        setRecord((r) => ({ ...r, wins: r.wins + 1 }))
        return
      }
      if (next.every((c) => c !== 0)) {
        setPhase("over")
        setResult("Board full — draw")
        return
      }
      setTurn(2)
    },
    [phase, turn, board]
  )

  useEffect(() => {
    if (phase !== "playing" || turn !== 2) return
    const timer = setTimeout(() => {
      const spots = candidates(board)
      // Opening move when the board is empty of neighbours.
      const pool = spots.length ? spots : [Math.floor((N * N) / 2)]

      let bestIdx = pool[0]
      let bestScore = -Infinity
      for (const idx of pool) {
        // Weight blocking slightly above attacking so the AI defends threats.
        const score = scoreMove(board, idx, 2) + scoreMove(board, idx, 1) * 1.1
        if (score > bestScore) {
          bestScore = score
          bestIdx = idx
        }
      }

      const next = [...board] as Board
      next[bestIdx] = 2
      setBoard(next)
      setLast(bestIdx)

      if (runLength(next, Math.floor(bestIdx / N), bestIdx % N, 2) >= 5) {
        setPhase("over")
        setResult("AI wins")
        setRecord((r) => ({ ...r, losses: r.losses + 1 }))
        return
      }
      if (next.every((c) => c !== 0)) {
        setPhase("over")
        setResult("Board full — draw")
        return
      }
      setTurn(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [phase, turn, board])

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md my-auto py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">⭕</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Gomoku</h2>
          <p className="text-muted-foreground mb-2">
            Five in a row wins. Simple rules, deep tactics — the AI blocks your threats while building its own.
          </p>
          {record.wins + record.losses > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              Record: {record.wins}W · {record.losses}L
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
            <span className="text-sm font-medium">{phase === "over" ? result : turn === 1 ? "Your turn (black)" : "AI thinking..."}</span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 border">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${N}, 26px)` }}>
              {board.map((cell, i) => (
                <button
                  key={i}
                  onClick={() => place(i)}
                  disabled={phase !== "playing" || turn !== 1 || cell !== 0}
                  className="relative w-[26px] h-[26px] flex items-center justify-center"
                >
                  {/* Grid lines drawn per intersection */}
                  <span className="absolute inset-0 border-r border-b border-amber-700/30" />
                  {cell !== 0 && (
                    <span
                      className={`relative w-5 h-5 rounded-full shadow ${cell === 1 ? "bg-neutral-900" : "bg-white border border-neutral-300"} ${
                        last === i ? "ring-2 ring-red-500" : ""
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {phase === "over" && (
            <div className="text-center mt-6">
              <div className="text-lg font-bold mb-4">{result}</div>
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
