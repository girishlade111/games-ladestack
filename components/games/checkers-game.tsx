"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

type Piece = "red" | "black" | "red-king" | "black-king" | null
type Board = (Piece)[][]
type Pos = [number, number]

function createBoard(): Board { const b: Board = []; for (let r = 0; r < 8; r++) { b.push([]); for (let c = 0; c < 8; c++) { if ((r + c) % 2 === 0) { b[r].push(null) } else if (r < 3) { b[r].push("black") } else if (r > 4) { b[r].push("red") } else { b[r].push(null) } } } return b }

function cloneBoard(b: Board): Board { return b.map(r => [...r]) }

function getMoves(b: Board, r: number, c: number): Pos[] {
  const piece = b[r][c]; if (!piece || piece === "black" || piece === "black-king") return []
  const isKing = piece === "red-king"
  const moves: Pos[] = []
  const drs = isKing ? [-1, 1] : [-1]
  for (const dr of drs) {
    for (const dc of [-1, 1]) {
      const nr = r + dr; const nc = c + dc
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (!b[nr][nc]) moves.push([nr, nc])
        else if ((b[nr][nc] === "black" || b[nr][nc] === "black-king") && nr + dr >= 0 && nr + dr < 8 && nc + dc >= 0 && nc + dc < 8 && !b[nr + dr][nc + dc]) moves.push([nr + dr, nc + dc])
      }
    }
  }
  return moves
}

function aiMove(b: Board): Board | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (b[r][c] !== "black" && b[r][c] !== "black-king") continue
      const isKing = b[r][c] === "black-king"
      const drs = isKing ? [-1, 1] : [1]
      for (const dr of drs) {
        for (const dc of [-1, 1]) {
          const nr = r + dr; const nc = c + dc
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!b[nr][nc]) { const nb = cloneBoard(b); nb[r][c] = null; nb[nr][nc] = nr === 0 && nb[r][c] === "black" ? "black-king" : b[r][c]; return nb }
          }
          const jr = r + dr * 2; const jc = c + dc * 2
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !b[jr][jc] && (b[nr][nc] === "red" || b[nr][nc] === "red-king")) {
            const nb = cloneBoard(b); nb[r][c] = null; nb[nr][nc] = null; nb[jr][jc] = jr === 0 && b[r][c] === "black" ? "black-king" : b[r][c]; return nb
          }
        }
      }
    }
  }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (b[r][c] !== "black" && b[r][c] !== "black-king") continue
    const drs = b[r][c] === "black-king" ? [-1, 1] : [1]
    for (const dr of drs) for (const dc of [-1, 1]) { const nr = r + dr; const nc = c + dc; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !b[nr][nc]) { const nb = cloneBoard(b); nb[r][c] = null; nb[nr][nc] = nr === 0 ? "black-king" : b[r][c]; return nb } }
  }
  return null
}

export default function CheckersGame({ themeColor = "#dc2626" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won" | "lost">("menu")
  const [board, setBoard] = useState<Board>(createBoard())
  const [selected, setSelected] = useState<Pos | null>(null)
  const [moves, setMoves] = useState<Pos[]>([])
  const [turn, setTurn] = useState<"red" | "black">("red")
  const [message, setMessage] = useState("")
  const [score, setScore] = useState(0)

  const startGame = useCallback(() => { setBoard(createBoard()); setSelected(null); setMoves([]); setTurn("red"); setMessage(""); setPhase("playing") }, [])

  const checkWin = (b: Board) => {
    let hasRed = false; let hasBlack = false
    for (const row of b) for (const cell of row) { if (cell === "red" || cell === "red-king") hasRed = true; if (cell === "black" || cell === "black-king") hasBlack = true }
    if (!hasBlack) { setPhase("won"); setScore(s => s + 100); setMessage("You win!") }
    else if (!hasRed) { setPhase("lost"); setMessage("AI wins!") }
  }

  const doAiTurn = (b: Board) => {
    setTimeout(() => { const nb = aiMove(b); if (nb) { setBoard(nb); setTurn("red"); checkWin(nb) } }, 400)
  }

  const handleClick = (r: number, c: number) => {
    if (phase !== "playing" || turn !== "red") return
    if (selected) {
      const [sr, sc] = selected
      if (r === sr && c === sc) { setSelected(null); setMoves([]); return }
      const valid = moves.some(([mr, mc]) => mr === r && mc === c)
      if (valid) {
        const nb = cloneBoard(board)
        const isJump = Math.abs(r - sr) === 2
        nb[sr][sc] = null
        if (isJump) nb[(sr + r) / 2][(sc + c) / 2] = null
        nb[r][c] = r === 0 ? "red-king" : board[sr][sc]
        setBoard(nb); setSelected(null); setMoves([]); setTurn("black"); checkWin(nb); doAiTurn(nb)
      } else { setSelected(null); setMoves([]) }
    } else {
      if (board[r][c] !== "red" && board[r][c] !== "red-king") return
      const m = getMoves(board, r, c)
      if (m.length > 0) { setSelected([r, c]); setMoves(m) }
    }
  }

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl text-white font-bold">C</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Checkers</h2>
          <p className="text-muted-foreground mb-2">Jump over opponent pieces to capture them</p>
          <p className="text-sm text-muted-foreground mb-6">You are Red, AI is Black</p>
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Start Game</Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">{turn === "red" ? "Your turn" : "AI thinking..."}</span>
            <span className="text-sm text-muted-foreground">Score: {score}</span>
            <Button variant="ghost" size="sm" onClick={startGame}><RotateCcw className="w-3.5 h-3.5 mr-1" />New</Button>
          </div>
          <div className="border-4 border-amber-800 rounded">
            {board.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => {
                  const isDark = (r + c) % 2 === 1
                  const isSelected = selected && selected[0] === r && selected[1] === c
                  const isMoveTarget = moves.some(([mr, mc]) => mr === r && mc === c)
                  return (
                    <div key={c}
                      onClick={() => handleClick(r, c)}
                      className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-colors ${
                        isSelected ? "bg-yellow-300" : isMoveTarget ? "bg-green-200" : isDark ? "bg-amber-800" : "bg-amber-100"
                      }`}
                    >
                      {cell && (
                        <div className={`w-8 h-8 rounded-full border-2 ${(cell === "red" || cell === "red-king") ? "bg-red-500 border-red-700" : "bg-gray-800 border-gray-900"} flex items-center justify-center`}>
                          {(cell === "red-king" || cell === "black-king") && <span className="text-yellow-300 text-xs font-bold">K</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {message && <div className={`text-center mt-4 text-lg font-bold ${phase === "won" ? "text-green-500" : "text-red-500"}`}>{message}</div>}
          {(phase === "won" || phase === "lost") && (
            <div className="text-center mt-4">
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="sm"><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
