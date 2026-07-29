"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, RotateCcw, Pencil, Eraser } from "lucide-react"

type Cell = { value: number; isGiven: boolean; notes: number[] }
type Board = Cell[][]

const DIFFICULTIES = {
  easy: 36,
  medium: 30,
  hard: 24,
}

function generateSudoku(givens: number): Board {
  const solved = solveSudoku(createEmptyBoard())
  const board: Board = solved.map((row) =>
    row.map((value) => ({ value, isGiven: true, notes: [] }))
  )

  let toRemove = 81 - givens
  while (toRemove > 0) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    if (board[row][col].value !== 0) {
      board[row][col] = { value: 0, isGiven: false, notes: [] }
      toRemove--
    }
  }
  return board
}

function createEmptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}

function isValid(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false
    if (board[i][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false
    }
  }
  return true
}

function solveSudoku(board: number[][]): number[][] {
  const copy = board.map((row) => [...row])
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9)
    const col = i % 9
    if (copy[row][col] === 0) {
      for (let k = numbers.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1))
        ;[numbers[k], numbers[j]] = [numbers[j], numbers[k]]
      }
      for (const num of numbers) {
        if (isValid(copy, row, col, num)) {
          copy[row][col] = num
          if (solveSudoku(copy).every((r) => r.every((c) => c !== 0))) {
            return copy
          }
          copy[row][col] = 0
        }
      }
      return copy
    }
  }
  return copy
}

export default function SudokuGame({ themeColor = "#14b8a6" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "finished">("menu")
  const [board, setBoard] = useState<Board>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTIES>("easy")
  const [mistakes, setMistakes] = useState(0)
  const [noteMode, setNoteMode] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    if (!timerRunning) return
    const interval = setInterval(() => setTimer((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [timerRunning])

  const startGame = useCallback((diff: keyof typeof DIFFICULTIES) => {
    setBoard(generateSudoku(DIFFICULTIES[diff]))
    setDifficulty(diff)
    setSelected(null)
    setMistakes(0)
    setNoteMode(false)
    setTimer(0)
    setTimerRunning(true)
    setPhase("playing")
  }, [])

  const isComplete = useCallback((b: Board) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c].value === 0) return false
        const cellValue = b.map((row) => row.map((cell) => cell.value))
        cellValue[r][c] = 0
        if (!isValid(cellValue, r, c, b[r][c].value)) return false
      }
    }
    return true
  }, [])

  const handleCellClick = (row: number, col: number) => {
    if (board[row]?.[col]?.isGiven) return
    setSelected([row, col])
  }

  const handleNumberInput = (num: number) => {
    if (!selected) return
    const [row, col] = selected
    if (board[row][col].isGiven) return

    const newBoard = board.map((r) => r.map((c) => ({ ...c, notes: [...c.notes] })))

    if (noteMode) {
      const cell = newBoard[row][col]
      if (cell.notes.includes(num)) {
        cell.notes = cell.notes.filter((n) => n !== num)
      } else {
        cell.notes.push(num)
        cell.notes.sort()
      }
    } else {
      const cellValue = newBoard.map((r) => r.map((c) => c.value))
      cellValue[row][col] = 0
      if (isValid(cellValue, row, col, num)) {
        newBoard[row][col].value = num
        newBoard[row][col].notes = []
      } else {
        setMistakes((m) => m + 1)
        return
      }
    }

    setBoard(newBoard)

    if (isComplete(newBoard)) {
      setTimerRunning(false)
      setPhase("finished")
    }
  }

  const handleErase = () => {
    if (!selected) return
    const [row, col] = selected
    if (board[row][col].isGiven) return
    const newBoard = board.map((r) => r.map((c) => ({ ...c, notes: [...c.notes] })))
    newBoard[row][col].value = 0
    newBoard[row][col].notes = []
    setBoard(newBoard)
  }

  const getRelatedCells = (row: number, col: number): [number, number][] => {
    const cells: [number, number][] = []
    for (let i = 0; i < 9; i++) {
      cells.push([row, i])
      cells.push([i, col])
    }
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        cells.push([boxRow + i, boxCol + j])
      }
    }
    return cells.filter(([r, c]) => r !== row || c !== col)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const isRelated = (r: number, c: number) => {
    if (!selected) return false
    const [sr, sc] = selected
    if (r === sr && c === sc) return true
    return (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)))
  }

  const isSameNumber = (r: number, c: number) => {
    if (!selected || !board[selected[0]]?.[selected[1]]?.value) return false
    return board[r][c].value === board[selected[0]][selected[1]].value && board[r][c].value !== 0
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sudoku</h2>
          <p className="text-muted-foreground mb-8">Fill the grid so every row, column, and 3x3 box contains 1-9</p>
          <div className="space-y-3">
            {(["easy", "medium", "hard"] as const).map((diff) => (
              <Card
                key={diff}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => startGame(diff)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-semibold capitalize">{diff}</div>
                    <div className="text-sm text-muted-foreground">{DIFFICULTIES[diff]} given numbers</div>
                  </div>
                  <Play className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {formatTime(timer)}
            </span>
            <span className="text-red-500">
              Mistakes: {mistakes}/3
            </span>
          </div>

          <div className="grid grid-cols-9 gap-px bg-border rounded-lg overflow-hidden border">
            {board.map((row, r) =>
              row.map((cell, c) => {
                let bgClass = "bg-card"
                if (isRelated(r, c)) bgClass = "bg-accent/50"
                if (isSameNumber(r, c)) bgClass = "bg-primary/20"
                if (selected && selected[0] === r && selected[1] === c) bgClass = "bg-primary/30"

                return (
                  <button
                    key={`${r}-${c}`}
                    className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-sm font-medium transition-colors ${bgClass} ${cell.isGiven ? "text-foreground font-bold" : "text-primary cursor-pointer hover:bg-accent"}`}
                    style={{
                      borderRight: (c + 1) % 3 === 0 ? "2px solid hsl(var(--border))" : undefined,
                      borderBottom: (r + 1) % 3 === 0 ? "2px solid hsl(var(--border))" : undefined,
                    }}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {cell.value > 0 ? (
                      cell.value
                    ) : cell.notes.length > 0 ? (
                      <div className="grid grid-cols-3 gap-0 text-[8px] leading-none w-full h-full p-0.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <span key={n} className="flex items-center justify-center text-muted-foreground">
                            {cell.notes.includes(n) ? n : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>

          {mistakes >= 3 && (
            <div className="text-center">
              <p className="text-red-500 font-semibold mb-2">Too many mistakes!</p>
              <Button onClick={() => startGame(difficulty)} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            </div>
          )}

          {mistakes < 3 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => handleNumberInput(num)}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant={noteMode ? "default" : "outline"}
                size="sm"
                className="w-9 h-9 p-0"
                style={noteMode ? { backgroundColor: themeColor } : {}}
                onClick={() => setNoteMode(!noteMode)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="w-9 h-9 p-0" onClick={handleErase}>
                <Eraser className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "finished" && (
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Puzzle Solved!</h2>
          <p className="text-muted-foreground mb-2">Time: {formatTime(timer)}</p>
          <p className="text-muted-foreground mb-6">Mistakes: {mistakes}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => startGame(difficulty)} style={{ backgroundColor: themeColor }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Game
            </Button>
            <Button variant="outline" onClick={() => setPhase("menu")}>
              Change Difficulty
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
