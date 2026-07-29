"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Zap } from "lucide-react"

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PADDLE_WIDTH = 100
const PADDLE_HEIGHT = 15
const BALL_RADIUS = 8
const PADDLE_SPEED = 8
const BRICK_WIDTH = 75
const BRICK_HEIGHT = 20
const BRICK_ROWS = 8
const BRICK_COLS = 10
const BRICK_PADDING = 5

interface Paddle { x: number; y: number; width: number; height: number }
interface Ball { x: number; y: number; radius: number; dx: number; dy: number }
interface Brick { x: number; y: number; width: number; height: number; visible: boolean; color: string }

export default function BreakoutGame({ onBack, themeColor }: { onBack: () => void; themeColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver" | "won">("menu")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [highScore, setHighScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const gsRef = useRef<"menu" | "playing" | "gameOver" | "won">("menu")

  const gs = useRef({
    paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 40, width: PADDLE_WIDTH, height: PADDLE_HEIGHT } as Paddle,
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, radius: BALL_RADIUS, dx: 4, dy: -4 } as Ball,
    bricks: [] as Brick[][],
    score: 0, lives: 3,
    canvas: null as HTMLCanvasElement | null,
    ctx: null as CanvasRenderingContext2D | null,
    keys: new Set<string>(),
    isPaused: false,
  })

  const createBricks = useCallback((): Brick[][] => {
    const colors = ["#ff4444", "#ff8844", "#ffcc44", "#44ff44", "#44ccff", "#4488ff", "#8844ff", "#ff44cc"]
    const bricks: Brick[][] = []
    for (let row = 0; row < BRICK_ROWS; row++) {
      bricks[row] = []
      for (let col = 0; col < BRICK_COLS; col++)
        bricks[row][col] = { x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING + 25, y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 60, width: BRICK_WIDTH, height: BRICK_HEIGHT, visible: true, color: colors[row] || "#ffffff" }
    }
    return bricks
  }, [])

  const resetBall = useCallback(() => {
    gs.current.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, radius: BALL_RADIUS, dx: (Math.random() > 0.5 ? 1 : -1) * 4, dy: -4 }
  }, [])

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT
    gs.current.paddle = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 40, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
    gs.current.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, radius: BALL_RADIUS, dx: 4, dy: -4 }
    gs.current.bricks = createBricks()
    gs.current.score = 0; gs.current.lives = 3; gs.current.canvas = canvas; gs.current.ctx = canvas.getContext("2d")
    gs.current.isPaused = false
    setScore(0); setLives(3); setIsPaused(false)
  }, [createBricks])

  const startGame = useCallback(() => { initGame(); setGameState("playing") }, [initGame])

  const checkCollision = (ball: Ball, rect: { x: number; y: number; width: number; height: number }) =>
    ball.x + ball.radius > rect.x && ball.x - ball.radius < rect.x + rect.width && ball.y + ball.radius > rect.y && ball.y - ball.radius < rect.y + rect.height

  const updateGame = useCallback(() => {
    const { paddle, ball, bricks, canvas, ctx, keys } = gs.current
    if (!canvas || !ctx || gsRef.current !== "playing") return

    if (gs.current.isPaused) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#ffffff"; ctx.font = "48px sans-serif"; ctx.textAlign = "center"
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2)
      ctx.font = "16px sans-serif"; ctx.fillText("Press P or Space to resume", canvas.width / 2, canvas.height / 2 + 40)
      gameLoopRef.current = requestAnimationFrame(updateGame)
      return
    }

    if (["arrowleft", "a"].some((k) => keys.has(k))) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED)
    if (["arrowright", "d"].some((k) => keys.has(k))) paddle.x = Math.min(CANVAS_WIDTH - paddle.width, paddle.x + PADDLE_SPEED)

    ctx.fillStyle = "#fafafa"; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ball.x += ball.dx; ball.y += ball.dy
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx *= -1
    if (ball.y - ball.radius < 0) ball.dy *= -1
    if (checkCollision(ball, paddle) && ball.dy > 0) { ball.dy *= -1; ball.dx = ((ball.x - paddle.x) / paddle.width - 0.5) * 8 }

    for (let row = 0; row < BRICK_ROWS; row++)
      for (let col = 0; col < BRICK_COLS; col++) {
        const brick = bricks[row][col]
        if (brick.visible && checkCollision(ball, brick)) { brick.visible = false; ball.dy *= -1; gs.current.score += 10; setScore(gs.current.score) }
      }

    if (ball.y + ball.radius > canvas.height) {
      gs.current.lives--; setLives(gs.current.lives)
      if (gs.current.lives <= 0) { gsRef.current = "gameOver"; setGameState("gameOver"); setHighScore((p) => Math.max(p, gs.current.score)); return }
      else resetBall()
    }

    if (bricks.flat().every((b) => !b.visible)) { gsRef.current = "won"; setGameState("won"); setHighScore((p) => Math.max(p, gs.current.score)); return }

    bricks.forEach((row) => row.forEach((brick) => {
      if (brick.visible) { ctx.fillStyle = brick.color; ctx.fillRect(brick.x, brick.y, brick.width, brick.height); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.strokeRect(brick.x, brick.y, brick.width, brick.height) }
    }))
    ctx.fillStyle = themeColor; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "#171717"; ctx.font = "20px sans-serif"; ctx.textAlign = "left"
    ctx.fillText(`Score: ${gs.current.score}`, 20, 30); ctx.fillText(`Lives: ${gs.current.lives}`, 20, 55)
    gameLoopRef.current = requestAnimationFrame(updateGame)
  }, [resetBall, themeColor])

  useEffect(() => { gsRef.current = gameState; gs.current.isPaused = isPaused }, [gameState, isPaused])

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      gs.current.keys.add(e.key.toLowerCase())
      if (gsRef.current === "playing" && (e.key === "p" || e.key === "P" || e.key === " ")) { e.preventDefault(); setIsPaused((p) => !p) }
    }
    const handleUp = (e: KeyboardEvent) => gs.current.keys.delete(e.key.toLowerCase())
    window.addEventListener("keydown", handleDown); window.addEventListener("keyup", handleUp)
    return () => { window.removeEventListener("keydown", handleDown); window.removeEventListener("keyup", handleUp); if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current) }
  }, [])

  useEffect(() => {
    if (gameState === "playing") gameLoopRef.current = requestAnimationFrame(updateGame)
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current) }
  }, [gameState, updateGame])

  useEffect(() => {
    if (gameState !== "gameOver" && gameState !== "won") return
    const h = (e: KeyboardEvent) => { if (e.key === "Enter") startGame(); else if (e.key === "Escape") setGameState("menu") }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [gameState, startGame])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (gsRef.current !== "playing" || gs.current.isPaused) return
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    gs.current.paddle.x = Math.max(0, Math.min(canvas.width - gs.current.paddle.width, e.clientX - rect.left - gs.current.paddle.width / 2))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8">
      <div className="relative">
        <canvas ref={canvasRef} className="border border-gray-200 rounded-lg shadow-sm cursor-none" style={{ maxWidth: "100%", height: "auto" }} onMouseMove={handleMouseMove} />
        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-200 shadow-sm w-96">
              <div className="mb-6">
                <div className="w-8 h-8 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor }}><Zap className="w-5 h-5 text-white" /></div>
                <h1 className="text-2xl font-medium text-gray-900 mb-2">Breakout</h1>
                <p className="text-sm text-gray-600 mb-4">Break all the bricks with your ball</p>
                <div className="bg-gray-50 rounded-lg p-3 text-left text-xs text-gray-600 space-y-1">
                  <div className="font-medium text-gray-800">Controls:</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">&#8592;&#8594;</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">A D</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">Mouse</kbd> to Move</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">P</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">Space</kbd> to Pause</div>
                </div>
              </div>
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-white px-6 py-2 text-sm font-medium">Start Game</Button>
            </Card>
          </div>
        )}
        {(gameState === "gameOver" || gameState === "won") && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-200 shadow-sm w-96">
              <h2 className="text-lg font-medium text-gray-500 mb-1">Breakout</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-4">{gameState === "won" ? "You Win!" : "Game Over"}</h3>
              <p className="text-2xl font-mono mb-2" style={{ color: themeColor }}>{gs.current.score}</p>
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
