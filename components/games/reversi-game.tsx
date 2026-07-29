"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const N = 8
type Cell = 0 | 1 | 2 // empty | black (player) | white (AI)
type Board = Cell[]

const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

/** Weight corners heavily and the squares beside them negatively. */
const WEIGHTS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
]

function initialBoard(): Board {
  const b: Board = Array(N * N).fill(0) as Board
  b[27] = 2; b[28] = 1; b[35] = 1; b[36] = 2
  return b
}

/** Discs that would flip if `player` plays at (r,c); empty means illegal. */
function captures(board: Board, r: number, c: number, player: Cell): number[] {
  if (board[r * N + c] !== 0) return []
  const opponent: Cell = player === 1 ? 2 : 1
  const out: number[] = []
  for (const [dr, dc] of DIRS) {
    const line: number[] = []
    let rr = r + dr
    let cc = c + dc
    while (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr * N + cc] === opponent) {
      line.push(rr * N + cc)
      rr += dr
      cc += dc
    }
    if (line.length && rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr * N + cc] === player) out.push(...line)
  }
  return out
}

function legalMoves(board: Board, player: Cell): Map<number, number[]> {
  const moves = new Map<number, number[]>()
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const flips = captures(board, r, c, player)
      if (flips.length) moves.set(r * N + c, flips)
    }
  }
  return moves
}

function applyMove(board: Board, idx: number, flips: number[], player: Cell): Board {
  const next = [...board] as Board
  next[idx] = player
  flips.forEach((f) => (next[f] = player))
  return next
}

function count(board: Board, player: Cell): number {
  return board.reduce((n, c) => n + (c === player ? 1 : 0), 0)
}

export default function ReversiGame({ themeColor = "#047857" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [board, setBoard] = useState<Board>(initialBoard())
  const [turn, setTurn] = useState<Cell>(1)
  const [status, setStatus] = useState("")
  const [record, setRecord] = useState({ wins: 0, losses: 0, draws: 0 })

  const start = useCallback(() => {
    setBoard(initialBoard())
    setTurn(1)
    setStatus("")
    setPhase("playing")
  }, [])

  const moves = legalMoves(board, turn)

  const finish = useCallback((b: Board) => {
    const you = count(b, 1)
    const ai = count(b, 2)
    setPhase("over")
    setStatus(you > ai ? "You win!" : ai > you ? "AI wins" : "It's a draw")
    setRecord((r) => ({
      wins: r.wins + (you > ai ? 1 : 0),
      losses: r.losses + (ai > you ? 1 : 0),
      draws: r.draws + (you === ai ? 1 : 0),
    }))
  }, [])

  /** Hand play to the next side, skipping a player with no legal move. */
  const advance = useCallback(
    (b: Board, next: Cell) => {
      if (legalMoves(b, next).size > 0) {
        setTurn(next)
        setStatus("")
        return
      }
      const other: Cell = next === 1 ? 2 : 1
      if (legalMoves(b, other).size > 0) {
        setTurn(other)
        setStatus(next === 1 ? "You have no move — AI plays again" : "AI has no move — your turn again")
        return
      }
      finish(b)
    },
    [finish]
  )

  const play = useCallback(
    (idx: number) => {
      if (phase !== "playing" || turn !== 1) return
      const flips = moves.get(idx)
      if (!flips) return
      const next = applyMove(board, idx, flips, 1)
      setBoard(next)
      advance(next, 2)
    },
    [phase, turn, moves, board, advance]
  )

  // AI turn: greedy on positional weight plus disc gain.
  useEffect(() => {
    if (phase !== "playing" || turn !== 2) return
    const timer = setTimeout(() => {
      const aiMoves = legalMoves(board, 2)
      if (aiMoves.size === 0) {
        advance(board, 1)
        return
      }
      let bestIdx = -1
      let bestScore = -Infinity
      aiMoves.forEach((flips, idx) => {
        const score = WEIGHTS[idx] + flips.length * 4
        if (score > bestScore) {
          bestScore = score
          bestIdx = idx
        }
      })
      const next = applyMove(board, bestIdx, aiMoves.get(bestIdx)!, 2)
      setBoard(next)
      advance(next, 1)
    }, 550)
    return () => clearTimeout(timer)
  }, [phase, turn, board, advance])

  const you = count(board, 1)
  const ai = count(board, 2)

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">⚫</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Reversi</h2>
          <p className="text-muted-foreground mb-2">
            Trap the AI's discs between two of yours to flip them. Whoever owns the most discs at the end wins.
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
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-neutral-600" />
              You: {you}
            </span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-400" />
              AI: {ai}
            </span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="text-center text-sm mb-2 h-5 text-muted-foreground">
            {phase === "over" ? "" : status || (turn === 1 ? "Your turn" : "AI is thinking...")}
          </div>

          <div className="grid gap-0.5 p-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${N}, 40px)`, backgroundColor: themeColor }}>
            {board.map((cell, i) => {
              const playable = phase === "playing" && turn === 1 && moves.has(i)
              return (
                <button
                  key={i}
                  onClick={() => play(i)}
                  disabled={!playable}
                  className="w-10 h-10 flex items-center justify-center rounded-sm bg-emerald-700/60 hover:bg-emerald-700/80 transition-colors disabled:hover:bg-emerald-700/60"
                >
                  {cell !== 0 ? (
                    <span
                      className={`w-7 h-7 rounded-full shadow ${cell === 1 ? "bg-neutral-900" : "bg-white"}`}
                    />
                  ) : playable ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-white/50" />
                  ) : null}
                </button>
              )
            })}
          </div>

          {phase === "over" && (
            <div className="text-center mt-6">
              <div className="text-lg font-bold mb-1">{status}</div>
              <div className="text-sm text-muted-foreground mb-4">
                Final score {you} – {ai}
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
