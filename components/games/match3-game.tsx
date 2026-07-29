"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw, Target } from "lucide-react"

const ROWS = 8; const COLS = 8
const GEMS = ["bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-purple-400", "bg-pink-400"]
const EMOJIS = ["\u{1F534}", "\u{1F535}", "\u{1F7E2}", "\u{1F7E1}", "\u{1F7E3}", "\u{1F338}"]

type Grid = number[][]

function randomGrid(): Grid { return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => Math.floor(Math.random() * GEMS.length))) }

function findMatches(g: Grid): [number, number][] {
  const matched = new Set<string>()
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      if (g[r][c] !== -1 && g[r][c] === g[r][c + 1] && g[r][c] === g[r][c + 2]) { matched.add(`${r},${c}`); matched.add(`${r},${c + 1}`); matched.add(`${r},${c + 2}`) }
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      if (g[r][c] !== -1 && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 2][c]) { matched.add(`${r},${c}`); matched.add(`${r + 1},${c}`); matched.add(`${r + 2},${c}`) }
    }
  }
  return Array.from(matched).map(k => k.split(",").map(Number) as [number, number])
}

function removeAndDrop(g: Grid, matches: [number, number][]): Grid {
  const ng = g.map(r => [...r])
  for (const [r, c] of matches) ng[r][c] = -1
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1
    for (let r = ROWS - 1; r >= 0; r--) { if (ng[r][c] !== -1) { ng[write][c] = ng[r][c]; write-- } }
    while (write >= 0) { ng[write][c] = Math.floor(Math.random() * GEMS.length); write-- }
  }
  return ng
}

export default function Match3Game({ themeColor = "#14b8a6" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing">("menu")
  const [grid, setGrid] = useState<Grid>(randomGrid())
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(30)
  const [bestScore, setBestScore] = useState(0)
  const [message, setMessage] = useState("")

  const startGame = useCallback(() => {
    setGrid(randomGrid()); setSelected(null); setScore(0); setMoves(30); setMessage(""); setPhase("playing")
  }, [])

  const swap = (r1: number, c1: number, r2: number, c2: number) => {
    const ng = grid.map(row => [...row])
    ;[ng[r1][c1], ng[r2][c2]] = [ng[r2][c2], ng[r1][c1]]
    const matches = findMatches(ng)
    if (matches.length === 0) { setMessage("No match!"); setSelected(null); setTimeout(() => setMessage(""), 1000); return }
    let current = removeAndDrop(ng, matches)
    let scoreAdded = matches.length * 10
    while (true) {
      const m = findMatches(current)
      if (m.length === 0) break
      scoreAdded += m.length * 10
      current = removeAndDrop(current, m)
    }
    setGrid(current); setScore(s => { const ns = s + scoreAdded; if (ns > bestScore) setBestScore(ns); return ns })
    setMoves(m => { if (m - 1 <= 0) setPhase("menu"); return m - 1 })
    setSelected(null)
  }

  const handleClick = (r: number, c: number) => {
    if (phase !== "playing") return
    if (!selected) { setSelected([r, c]); return }
    const [sr, sc] = selected
    if (r === sr && c === sc) { setSelected(null); return }
    if (Math.abs(r - sr) + Math.abs(c - sc) === 1) { swap(sr, sc, r, c); return }
    setSelected([r, c])
  }

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Match-3</h2>
          <p className="text-muted-foreground mb-2">Swap adjacent gems to match 3 in a row</p>
          {bestScore > 0 && <p className="text-sm text-muted-foreground mb-6">Best: {bestScore}</p>}
          {(score > 0 || moves < 30) && <p className="text-sm font-semibold mb-4">Last Score: {score}</p>}
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Start Game</Button>
        </div>
      )}

      {phase === "playing" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3 w-full max-w-xs">
            <span className="text-sm">Score: {score}</span>
            <span className="text-sm">Moves: {moves}</span>
            <Button variant="ghost" size="sm" onClick={startGame}><RotateCcw className="w-3.5 h-3.5 mr-1" />New</Button>
          </div>
          {message && <div className="text-center text-sm text-red-500 mb-2">{message}</div>}
          <div className="border-2 rounded p-2 bg-gray-50 dark:bg-gray-900">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((gem, c) => {
                  const isSel = selected && selected[0] === r && selected[1] === c
                  return (
                    <div key={c} onClick={() => handleClick(r, c)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer rounded-lg m-0.5 text-xl transition-all ${gem === -1 ? "bg-transparent" : GEMS[gem]} ${isSel ? "ring-2 ring-white scale-110" : ""}`}
                    >{gem !== -1 ? EMOJIS[gem] : ""}</div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
