"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Square } from "lucide-react"

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const BLOCK_SIZE = 30
const CANVAS_WIDTH = BOARD_WIDTH * BLOCK_SIZE
const CANVAS_HEIGHT = BOARD_HEIGHT * BLOCK_SIZE

const PIECES = {
  I: { shape: [[1, 1, 1, 1]], color: "#00f5ff" },
  O: { shape: [[1, 1], [1, 1]], color: "#ffed00" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "#a000f0" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "#00f000" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "#f00000" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "#0000f0" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "#ff7f00" },
}

interface Piece { shape: number[][]; color: string; x: number; y: number }

export default function TetrisGame({ onBack, themeColor }: { onBack: () => void; themeColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const dropTimeRef = useRef<number>(0)
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const gameStateRef = useRef<"menu" | "playing" | "gameOver">("menu")

  const gs = useRef({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)) as (string | number)[][],
    currentPiece: null as Piece | null,
    nextPiece: null as Piece | null,
    score: 0, level: 1, lines: 0, dropTime: 1000,
    canvas: null as HTMLCanvasElement | null,
    ctx: null as CanvasRenderingContext2D | null,
  })

  const createPiece = useCallback((): Piece => {
    const types = Object.keys(PIECES) as (keyof typeof PIECES)[]
    const p = PIECES[types[Math.floor(Math.random() * types.length)]]
    return { shape: p.shape, color: p.color, x: Math.floor(BOARD_WIDTH / 2) - Math.floor(p.shape[0].length / 2), y: 0 }
  }, [])

  const isValidMove = (piece: Piece, board: (string | number)[][]): boolean => {
    for (let y = 0; y < piece.shape.length; y++)
      for (let x = 0; x < piece.shape[y].length; x++)
        if (piece.shape[y][x]) {
          const nx = piece.x + x, ny = piece.y + y
          if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT || (ny >= 0 && board[ny][nx])) return false
        }
    return true
  }

  const placePiece = (piece: Piece, board: (string | number)[][]) => {
    piece.shape.forEach((row, y) => row.forEach((v, x) => { if (v && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.color }))
  }

  const clearLines = (board: (string | number)[][]): number => {
    let cleared = 0
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--)
      if (board[y].every((c) => c !== 0)) { board.splice(y, 1); board.unshift(Array(BOARD_WIDTH).fill(0)); cleared++; y++ }
    return cleared
  }

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_WIDTH + 200
    canvas.height = CANVAS_HEIGHT
    gs.current = {
      board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)),
      currentPiece: createPiece(),
      nextPiece: createPiece(),
      score: 0, level: 1, lines: 0, dropTime: 1000,
      canvas, ctx: canvas.getContext("2d"),
    }
    setScore(0); setLevel(1); setLines(0)
    dropTimeRef.current = 0
  }, [createPiece])

  const startGame = useCallback(() => {
    initGame()
    setGameState("playing")
  }, [initGame])

  const movePiece = useCallback((dx: number, dy: number) => {
    const { currentPiece, board } = gs.current
    if (!currentPiece) return false
    const np = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy }
    if (isValidMove(np, board)) { gs.current.currentPiece = np; return true }
    return false
  }, [])

  const rotatePieceInGame = useCallback(() => {
    const { currentPiece, board } = gs.current
    if (!currentPiece) return
    const rs = currentPiece.shape[0].map((_, i) => currentPiece.shape.map((r) => r[i]).reverse())
    const rp = { ...currentPiece, shape: rs }
    if (isValidMove(rp, board)) gs.current.currentPiece = rp
  }, [])

  const dropPiece = useCallback(() => {
    if (movePiece(0, 1)) return
    const { currentPiece, nextPiece, board } = gs.current
    if (!currentPiece) return
    placePiece(currentPiece, board)
    const cleared = clearLines(board)
    if (cleared > 0) {
      gs.current.lines += cleared
      gs.current.score += cleared * 100 * gs.current.level
      gs.current.level = Math.floor(gs.current.lines / 10) + 1
      gs.current.dropTime = Math.max(50, 1000 - (gs.current.level - 1) * 80)
      setLines(gs.current.lines)
      setScore(gs.current.score)
      setLevel(gs.current.level)
    }
    gs.current.currentPiece = nextPiece
    gs.current.nextPiece = createPiece()
    if (gs.current.currentPiece && !isValidMove(gs.current.currentPiece, board)) {
      gameStateRef.current = "gameOver"
      setGameState("gameOver")
      setScore(gs.current.score)
      setHighScore((prev) => Math.max(prev, gs.current.score))
    }
  }, [movePiece, createPiece])

  const updateGame = useCallback((currentTime: number) => {
    const { canvas, ctx, board, currentPiece, nextPiece } = gs.current
    if (!canvas || !ctx) return
    if (currentTime - dropTimeRef.current > gs.current.dropTime) { dropPiece(); dropTimeRef.current = currentTime }

    ctx.fillStyle = "#fafafa"; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = themeColor; ctx.lineWidth = 2; ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.strokeStyle = "#f0f0f0"; ctx.lineWidth = 1
    for (let x = 0; x <= BOARD_WIDTH; x++) { ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, 0); ctx.lineTo(x * BLOCK_SIZE, CANVAS_HEIGHT); ctx.stroke() }
    for (let y = 0; y <= BOARD_HEIGHT; y++) { ctx.beginPath(); ctx.moveTo(0, y * BLOCK_SIZE); ctx.lineTo(CANVAS_WIDTH, y * BLOCK_SIZE); ctx.stroke() }
    board.forEach((row, y) => row.forEach((v, x) => { if (v !== 0) { ctx.fillStyle = v as string; ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2) } }))
    if (currentPiece) { ctx.fillStyle = currentPiece.color; currentPiece.shape.forEach((row, y) => row.forEach((v, x) => { if (v) ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE + 1, (currentPiece.y + y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2) })) }
    ctx.fillStyle = "#171717"; ctx.font = "20px sans-serif"; ctx.textAlign = "left"
    ctx.fillText(`Score: ${gs.current.score}`, CANVAS_WIDTH + 20, 40)
    ctx.fillText(`Level: ${gs.current.level}`, CANVAS_WIDTH + 20, 70)
    ctx.fillText(`Lines: ${gs.current.lines}`, CANVAS_WIDTH + 20, 100)
    if (nextPiece) { ctx.fillText("Next:", CANVAS_WIDTH + 20, 140); ctx.fillStyle = nextPiece.color; nextPiece.shape.forEach((row, y) => row.forEach((v, x) => { if (v) ctx.fillRect(CANVAS_WIDTH + 20 + x * 20, 150 + y * 20, 18, 18) })) }
    if (gameStateRef.current === "playing") gameLoopRef.current = requestAnimationFrame(updateGame)
  }, [dropPiece, themeColor])

  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameStateRef.current !== "playing") return
      switch (e.key.toLowerCase()) {
        case "arrowleft": case "a": e.preventDefault(); movePiece(-1, 0); break
        case "arrowright": case "d": e.preventDefault(); movePiece(1, 0); break
        case "arrowdown": case "s": e.preventDefault(); dropPiece(); break
        case "arrowup": case "w": case " ": e.preventDefault(); rotatePieceInGame(); break
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [movePiece, dropPiece, rotatePieceInGame])

  useEffect(() => {
    if (gameState === "playing") gameLoopRef.current = requestAnimationFrame(updateGame)
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current) }
  }, [gameState, updateGame])

  useEffect(() => {
    if (gameState !== "gameOver") return
    const handleKeys = (e: KeyboardEvent) => { if (e.key === "Enter") startGame(); else if (e.key === "Escape") setGameState("menu") }
    window.addEventListener("keydown", handleKeys)
    return () => window.removeEventListener("keydown", handleKeys)
  }, [gameState, startGame])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8">
      <div className="relative">
        <canvas ref={canvasRef} className="border border-gray-200 rounded-lg shadow-sm" style={{ maxWidth: "100%", height: "auto" }} />
        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-200 shadow-sm w-96">
              <div className="mb-6">
                <div className="w-8 h-8 mx-auto mb-4 rounded flex items-center justify-center" style={{ backgroundColor: themeColor }}><Square className="w-5 h-5 text-white" /></div>
                <h1 className="text-2xl font-medium text-gray-900 mb-2">Tetris</h1>
                <p className="text-sm text-gray-600 mb-4">Stack blocks to clear lines</p>
                <div className="bg-gray-50 rounded-lg p-3 text-left text-xs text-gray-600 space-y-1">
                  <div className="font-medium text-gray-800">Controls:</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">&#8592;&#8594;</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">A D</kbd> to Move</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">&#8593;</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">W</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">Space</kbd> to Rotate</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">&#8595;</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">S</kbd> to Drop</div>
                </div>
              </div>
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-white px-6 py-2 text-sm font-medium">Start Game</Button>
              {highScore > 0 && <p className="mt-4 text-xs text-gray-500">Best Score: {highScore}</p>}
            </Card>
          </div>
        )}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-200 shadow-sm w-96">
              <h2 className="text-lg font-medium text-gray-500 mb-1">Tetris</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-4">Game Over</h3>
              <p className="text-2xl font-mono mb-2" style={{ color: themeColor }}>{score}</p>
              <p className="text-sm text-gray-600">Level {level} &middot; {lines} lines</p>
              <p className="text-xs text-gray-500 mb-6">Best: {highScore}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-white px-4 py-2 text-sm font-medium">Play Again</Button>
                <Button onClick={() => setGameState("menu")} variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium">Menu</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
