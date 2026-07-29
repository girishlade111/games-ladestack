"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw, Ship, Target, X } from "lucide-react"

type Cell = "empty" | "ship" | "hit" | "miss"
type BoardT = Cell[][]
type Pos = [number, number]
const SIZE = 8
const SHIP_SIZES = [5, 4, 3, 3, 2]

function emptyBoard(): BoardT { return Array.from({ length: SIZE }, () => Array(SIZE).fill("empty" as Cell)) }

function randomBoard(): BoardT {
  const b = emptyBoard()
  const dirs = [[0, 1], [1, 0]]
  for (const size of SHIP_SIZES) {
    let placed = false
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const dir = dirs[Math.floor(Math.random() * 2)]
      const r = Math.floor(Math.random() * SIZE); const c = Math.floor(Math.random() * SIZE)
      const er = r + dir[0] * (size - 1); const ec = c + dir[1] * (size - 1)
      if (er >= SIZE || ec >= SIZE) continue
      let clear = true
      for (let i = -1; i <= size; i++) for (let j = -1; j <= 1; j++) {
        const nr = r + dir[0] * i + dir[1] * j; const nc = c + dir[1] * i + dir[0] * j
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === "ship") { clear = false; break }
      }
      if (!clear) continue
      for (let i = 0; i < size; i++) b[r + dir[0] * i][c + dir[1] * i] = "ship"
      placed = true
    }
    if (!placed) return randomBoard()
  }
  return b
}

function aiGuess(playerBoard: BoardT, aiHits: Pos[], aiMisses: Pos[]): Pos {
  if (aiHits.length > 0) {
    const [hr, hc] = aiHits[0]
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = hr + dr; const nc = hc + dc
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && playerBoard[nr][nc] !== "hit" && playerBoard[nr][nc] !== "miss") return [nr, nc]
    }
  }
  for (let attempt = 0; attempt < 500; attempt++) {
    const r = Math.floor(Math.random() * SIZE); const c = Math.floor(Math.random() * SIZE)
    if (playerBoard[r][c] !== "hit" && playerBoard[r][c] !== "miss") return [r, c]
  }
  return [0, 0]
}

export default function BattleshipGame({ themeColor = "#1e40af" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "placing" | "playing" | "won" | "lost">("menu")
  const [playerBoard, setPlayerBoard] = useState<BoardT>(emptyBoard())
  const [enemyBoard, setEnemyBoard] = useState<BoardT>(emptyBoard())
  const [enemyShips, setEnemyShips] = useState<BoardT>(emptyBoard())
  const [aiHits, setAiHits] = useState<Pos[]>([])
  const [score, setScore] = useState(0)
  const [placingShip, setPlacingShip] = useState(0)
  const [placingDir, setPlacingDir] = useState(0)
  const [message, setMessage] = useState("")
  const [playerHits, setPlayerHits] = useState(0)
  const [enemyHits, setEnemyHits] = useState(0)
  const totalShipCells = SHIP_SIZES.reduce((a, b) => a + b, 0)

  const startGame = useCallback(() => { setPlayerBoard(emptyBoard()); setEnemyBoard(emptyBoard()); setEnemyShips(randomBoard()); setAiHits([]); setScore(0); setPlacingShip(0); setPlacingDir(0); setMessage(""); setPlayerHits(0); setEnemyHits(0); setPhase("placing") }, [])

  const placeShipCell = (r: number, c: number) => {
    if (phase !== "placing") return
    const dir = [[0, 1], [1, 0]][placingDir]
    const size = SHIP_SIZES[placingShip]
    const newBoard = playerBoard.map(row => [...row])
    const shipCells: Pos[] = []
    for (let i = 0; i < size; i++) shipCells.push([r + dir[0] * i, c + dir[1] * i])
    const valid = shipCells.every(([br, bc]) => br >= 0 && br < SIZE && bc >= 0 && bc < SIZE && newBoard[br][bc] === "empty")
    if (!valid) return
    for (const [br, bc] of shipCells) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = br + dr; const nc = bc + dc
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && newBoard[nr][nc] === "ship") return
      }
    }
    for (const [br, bc] of shipCells) newBoard[br][bc] = "ship"
    setPlayerBoard(newBoard)
    if (placingShip + 1 >= SHIP_SIZES.length) { setPhase("playing") } else { setPlacingShip(s => s + 1) }
  }

  const playerAttack = (r: number, c: number) => {
    if (phase !== "playing") return
    if (enemyBoard[r][c] === "hit" || enemyBoard[r][c] === "miss") return
    const neb = enemyBoard.map(row => [...row])
    if (enemyShips[r][c] === "ship") { neb[r][c] = "hit"; setEnemyBoard(neb); setPlayerHits(h => h + 1); if (playerHits + 1 >= totalShipCells) { setPhase("won"); setScore(s => s + 100 + 50); setMessage("You sank all enemy ships!"); return } }
    else { neb[r][c] = "miss"; setEnemyBoard(neb) }
    doAiTurn()
  }

  const doAiTurn = () => {
    setTimeout(() => {
      const pb = playerBoard.map(row => [...row])
      const [r, c] = aiGuess(pb, aiHits, [])
      if (pb[r][c] === "ship") { pb[r][c] = "hit"; setPlayerBoard(pb); setAiHits(h => [[r, c], ...h]); setEnemyHits(h => h + 1); if (enemyHits + 1 >= totalShipCells) { setPhase("lost"); setMessage("AI sank all your ships!"); return } }
      else { pb[r][c] = "miss"; setPlayerBoard(pb) }
    }, 500)
  }

  const renderCell = (board: BoardT, r: number, c: number, clickable: boolean, onClick?: () => void) => {
    const cell = board[r][c]
    const cls = "w-8 h-8 sm:w-10 sm:h-10 border flex items-center justify-center cursor-pointer text-xs"
    if (clickable && phase === "placing") return <div key={c} onClick={() => placeShipCell(r, c)} className={`${cls} hover:bg-blue-100 ${playerBoard[r][c] === "ship" ? "bg-blue-400" : "bg-blue-50"}`}>{playerBoard[r][c] === "ship" ? <Ship className="w-4 h-4 text-white" /> : ""}</div>
    return (
      <div key={c} onClick={onClick} className={`${cls} ${cell === "hit" ? "bg-red-100" : cell === "miss" ? "bg-gray-100" : clickable ? "hover:bg-blue-50" : cell === "ship" ? "bg-blue-100" : "bg-blue-50"} ${clickable ? "" : ""}`}>
        {cell === "hit" ? <X className="w-3 h-3 text-red-500 sm:w-4 sm:h-4" /> : cell === "miss" ? <div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> : phase !== "placing" && cell === "ship" && !clickable ? <Ship className="w-3 h-3 text-blue-600 sm:w-4 sm:h-4" /> : ""}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <Ship className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Battleship</h2>
          <p className="text-muted-foreground mb-6">Sink the enemy fleet before they sink yours!</p>
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Start Game</Button>
        </div>
      )}

      {phase === "placing" && (
        <div className="py-4">
          <div className="text-center mb-3">
            <p className="text-sm text-muted-foreground mb-1">Place your ships ({SHIP_SIZES[placingShip]} cells long)</p>
            <p className="text-xs text-muted-foreground">Ship {placingShip + 1} of {SHIP_SIZES.length}</p>
            <Button variant="ghost" size="sm" onClick={() => setPlacingDir(d => d === 0 ? 1 : 0)} className="mt-1">Toggle: {placingDir === 0 ? "Horizontal" : "Vertical"}</Button>
          </div>
          <div className="border-2 rounded p-1">{playerBoard.map((row, r) => <div key={r} className="flex">{row.map((_, c) => renderCell(playerBoard, r, c, true))}</div>)}</div>
        </div>
      )}

      {(phase === "playing" || phase === "won" || phase === "lost") && (
        <div className="py-4 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">Score: {score} | Hits: {playerHits}/{totalShipCells}</span>
            <Button variant="ghost" size="sm" onClick={startGame}><RotateCcw className="w-3.5 h-3.5 mr-1" />New</Button>
          </div>
          <div className="flex gap-6 justify-center flex-wrap">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-center">Enemy Waters</h3>
              <div className="border-2 rounded p-1">{enemyBoard.map((row, r) => <div key={r} className="flex">{row.map((_, c) => renderCell(enemyBoard, r, c, phase === "playing", () => playerAttack(r, c)))}</div>)}</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 text-center">Your Fleet</h3>
              <div className="border-2 rounded p-1">{playerBoard.map((row, r) => <div key={r} className="flex">{row.map((_, c) => renderCell(playerBoard, r, c, false))}</div>)}</div>
            </div>
          </div>
          {message && <div className={`text-center mt-4 text-lg font-bold ${phase === "won" ? "text-green-500" : "text-red-500"}`}>{message}</div>}
          {(phase === "won" || phase === "lost") && (
            <div className="text-center mt-2"><Button onClick={startGame} style={{ backgroundColor: themeColor }} size="sm"><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button></div>
          )}
        </div>
      )}
    </div>
  )
}
