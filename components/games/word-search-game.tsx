"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

const WORDS = ["REACT","VUE","ANGULAR","SVELTE","NEXTJS","NODE","TYPESCRIPT","JAVASCRIPT","PYTHON","DOCKER","KUBERNETES","REDIS","POSTGRES","MONGODB","GRAPHQL"]
const GRID_SIZE = 10

interface Pos { row: number; col: number }
interface FoundWord { word: string; positions: Pos[] }

function generateGrid(words: string[]): { grid: string[][]; words: { word: string; positions: Pos[] }[] } {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""))
  const placed: { word: string; positions: Pos[] }[] = []
  const dirs = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1],[1,-1],[-1,1]]
  for (const word of words.slice(0, 5)) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)]
      const sr = Math.floor(Math.random() * GRID_SIZE); const sc = Math.floor(Math.random() * GRID_SIZE)
      const er = sr + dir[0] * (word.length - 1); const ec = sc + dir[1] * (word.length - 1)
      if (er < 0 || er >= GRID_SIZE || ec < 0 || ec >= GRID_SIZE) continue
      let fits = true; const positions: Pos[] = []
      for (let i = 0; i < word.length; i++) {
        const r = sr + dir[0] * i; const c = sc + dir[1] * i
        positions.push({ row: r, col: c })
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) { fits = false; break }
      }
      if (!fits) continue
      for (let i = 0; i < word.length; i++) grid[sr + dir[0] * i][sc + dir[1] * i] = word[i]
      placed.push({ word, positions })
      break
    }
  }
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) if (!grid[r][c]) grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  return { grid, words: placed }
}

export default function WordSearchGame({ themeColor = "#0ea5e9" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won">("menu")
  const [grid, setGrid] = useState<string[][]>([])
  const [words, setWords] = useState<{ word: string; positions: Pos[] }[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [dragStart, setDragStart] = useState<Pos | null>(null)
  const [dragEnd, setDragEnd] = useState<Pos | null>(null)
  const [score, setScore] = useState(0)

  const startGame = useCallback(() => {
    const { grid: g, words: w } = generateGrid([...WORDS].sort(() => Math.random() - 0.5))
    setGrid(g); setWords(w); setFoundWords([]); setSelectedCells(new Set()); setDragStart(null); setDragEnd(null); setPhase("playing")
  }, [])

  const cellKey = (r: number, c: number) => `${r},${c}`

  const getHighlightedCells = () => {
    const cells = new Set<string>()
    if (!dragStart || !dragEnd) return cells
    const dr = Math.sign(dragEnd.row - dragStart.row); const dc = Math.sign(dragEnd.col - dragStart.col)
    if (dr === 0 && dc === 0) return cells
    let r = dragStart.row; let c = dragStart.col
    while (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && (r !== dragEnd.row || c !== dragEnd.col)) {
      cells.add(cellKey(r, c)); r += dr; c += dc
    }
    cells.add(cellKey(dragEnd.row, dragEnd.col))
    return cells
  }

  const handleMouseDown = (row: number, col: number) => { setDragStart({ row, col }); setDragEnd({ row, col }) }
  const handleMouseEnter = (row: number, col: number) => { if (dragStart) setDragEnd({ row, col }) }
  const handleMouseUp = () => {
    if (!dragStart || !dragEnd) return
    const cells = getHighlightedCells()
    const selected = Array.from(cells).sort().join(",")
    for (const w of words) {
      if (foundWords.includes(w.word)) continue
      const wPositions = w.positions.map(p => cellKey(p.row, p.col)).sort().join(",")
      if (selected === wPositions) {
        setFoundWords(f => [...f, w.word])
        setScore(s => s + w.word.length * 10)
        setSelectedCells(prev => { const n = new Set(prev); cells.forEach(c => n.add(c)); return n })
        if (foundWords.length + 1 === words.length) setPhase("won")
      }
    }
    setDragStart(null); setDragEnd(null)
  }

  const highlightCells = getHighlightedCells()

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl text-white font-bold">W</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Word Search</h2>
          <p className="text-muted-foreground mb-6">Find hidden words in the letter grid</p>
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Start Game</Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="w-full max-w-2xl py-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">Score: {score}</span>
            <Button variant="ghost" size="sm" onClick={startGame}><RotateCcw className="w-3.5 h-3.5 mr-1" />New</Button>
          </div>
          <div className="flex gap-6 justify-center flex-wrap">
            <div className="grid gap-0.5 border-2 rounded p-0.5 select-none" onMouseUp={handleMouseUp} onMouseLeave={() => { setDragStart(null); setDragEnd(null) }}>
              {grid.map((row, r) => (
                <div key={r} className="flex gap-0.5">
                  {row.map((cell, c) => {
                    const key = cellKey(r, c)
                    const isFound = selectedCells.has(key)
                    const isHighlight = highlightCells.has(key)
                    return (
                      <div key={c}
                        onMouseDown={() => handleMouseDown(r, c)}
                        onMouseEnter={() => handleMouseEnter(r, c)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded cursor-pointer transition-colors ${
                          isFound ? "bg-green-200 text-green-800" : isHighlight ? "bg-blue-100 text-blue-700" : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >{cell}</div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Words to find:</h3>
              <ul className="space-y-1">
                {words.map((w, i) => (
                  <li key={i} className={`text-sm ${foundWords.includes(w.word) ? "line-through text-green-500" : ""}`}>{w.word}</li>
                ))}
              </ul>
            </div>
          </div>
          {phase === "won" && (
            <div className="text-center mt-6">
              <div className="text-lg font-bold text-green-500 mb-2">All words found!</div>
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="sm"><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
