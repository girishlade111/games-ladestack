"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react"

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 10
const PADDLE_HEIGHT = 80
const BALL_SIZE = 10
const INITIAL_BALL_SPEED = 4
const MAX_BALL_SPEED = 10

export default function PongGame({ onBack, themeColor = "#3b82f6" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [gameRunning, setGameRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: INITIAL_BALL_SPEED, dy: INITIAL_BALL_SPEED, speed: INITIAL_BALL_SPEED })
  const playerRef = useRef({ x: 20, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, speed: 6 })
  const aiRef = useRef({ x: CANVAS_WIDTH - 30, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, speed: 4 })
  const keysRef = useRef<Record<string, boolean>>({})
  const gameRunningRef = useRef(false)
  const gameOverRef = useRef(false)
  const playerScoreRef = useRef(0)
  const aiScoreRef = useRef(0)
  const animFrameRef = useRef(0)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetBall = useCallback(() => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2,
      dx: Math.random() > 0.5 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED,
      dy: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
      speed: INITIAL_BALL_SPEED,
    }
  }, [])

  const resetGame = useCallback(() => {
    playerScoreRef.current = 0; aiScoreRef.current = 0
    gameRunningRef.current = false; gameOverRef.current = false
    setPlayerScore(0); setAiScore(0); setGameRunning(false); setGameOver(false)
    playerRef.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
    aiRef.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
    resetBall()
    if (resetTimerRef.current) { clearTimeout(resetTimerRef.current); resetTimerRef.current = null }
  }, [resetBall])

  const checkCollision = (bx: number, by: number, px: number, py: number, pw: number, ph: number) =>
    bx < px + pw && bx + BALL_SIZE > px && by < py + ph && by + BALL_SIZE > py

  const gameLoop = useCallback(() => {
    if (!gameRunningRef.current || gameOverRef.current) { animFrameRef.current = requestAnimationFrame(gameLoop); return }

    const player = playerRef.current
    const ai = aiRef.current
    const keys = keysRef.current

    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed
    if (keys["ArrowDown"] && player.y < CANVAS_HEIGHT - player.height) player.y += player.speed

    const ball = ballRef.current
    const ballCY = ball.y + BALL_SIZE / 2
    const aiCY = ai.y + ai.height / 2
    if (ballCY < aiCY - 10) ai.y -= ai.speed
    else if (ballCY > aiCY + 10) ai.y += ai.speed
    ai.y = Math.max(0, Math.min(CANVAS_HEIGHT - ai.height, ai.y))

    ball.x += ball.dx
    ball.y += ball.dy

    if (ball.y <= 0 || ball.y >= CANVAS_HEIGHT - BALL_SIZE) ball.dy = -ball.dy

    if (checkCollision(ball.x, ball.y, player.x, player.y, player.width, player.height)) {
      ball.dx = Math.abs(ball.dx)
      ball.speed = Math.min(MAX_BALL_SPEED, ball.speed + 0.1)
      ball.dx = ball.speed
    }
    if (checkCollision(ball.x, ball.y, ai.x, ai.y, ai.width, ai.height)) {
      ball.dx = -Math.abs(ball.dx)
      ball.speed = Math.min(MAX_BALL_SPEED, ball.speed + 0.1)
      ball.dx = -ball.speed
    }

    if (ball.x <= 0) {
      aiScoreRef.current++
      setAiScore(aiScoreRef.current)
      if (aiScoreRef.current >= 5) { gameOverRef.current = true; gameRunningRef.current = false; setGameOver(true); setGameRunning(false); return }
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(resetBall, 1000)
      ball.x = -100
    }
    if (ball.x >= CANVAS_WIDTH) {
      playerScoreRef.current++
      setPlayerScore(playerScoreRef.current)
      if (playerScoreRef.current >= 5) { gameOverRef.current = true; gameRunningRef.current = false; setGameOver(true); setGameRunning(false); return }
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(resetBall, 1000)
      ball.x = CANVAS_WIDTH + 100
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [resetBall])

  useEffect(() => { gameRunningRef.current = gameRunning; gameOverRef.current = gameOver }, [gameRunning, gameOver])
  useEffect(() => { playerScoreRef.current = playerScore; aiScoreRef.current = aiScore }, [playerScore, aiScore])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => { cancelAnimationFrame(animFrameRef.current); if (resetTimerRef.current) clearTimeout(resetTimerRef.current) }
  }, [gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let frameId: number
    const draw = () => {
      ctx.fillStyle = "#1f2937"; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.strokeStyle = "#374151"; ctx.lineWidth = 2; ctx.setLineDash([10, 10])
      ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH / 2, 0); ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT); ctx.stroke(); ctx.setLineDash([])
      const p = playerRef.current; const a = aiRef.current; const b = ballRef.current
      ctx.fillStyle = themeColor; ctx.fillRect(p.x, p.y, p.width, p.height); ctx.fillRect(a.x, a.y, a.width, a.height)
      ctx.fillStyle = "#fff"; ctx.fillRect(b.x, b.y, BALL_SIZE, BALL_SIZE)
      ctx.fillStyle = "#fff"; ctx.font = "32px Arial"; ctx.textAlign = "center"
      ctx.fillText(String(playerScoreRef.current), CANVAS_WIDTH / 4, 50)
      ctx.fillText(String(aiScoreRef.current), (3 * CANVAS_WIDTH) / 4, 50)
      if (gameOverRef.current) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.fillStyle = "#fff"; ctx.font = "24px Arial"
        ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)
        ctx.font = "18px Arial"
        ctx.fillText(playerScoreRef.current > aiScoreRef.current ? "You Win!" : "AI Wins!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      }
      ctx.textAlign = "left"
      frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [themeColor])

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; if (e.key === " " && !gameRunningRef.current && !gameOverRef.current) { e.preventDefault(); setGameRunning(true) } }
    const handleUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false }
    window.addEventListener("keydown", handleDown); window.addEventListener("keyup", handleUp)
    return () => { window.removeEventListener("keydown", handleDown); window.removeEventListener("keyup", handleUp) }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBack} variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <h1 className="text-2xl font-bold text-gray-800">Pong</h1>
          <Button onClick={resetGame} variant="outline" size="sm"><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
        </div>
        <Card className="p-4 mb-4">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-gray-300 mx-auto block" />
        </Card>
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-8 text-lg font-semibold text-gray-700"><span>You: {playerScore}</span><span>AI: {aiScore}</span></div>
          <div className="flex justify-center gap-2">
            <Button onClick={() => { if (gameOver) resetGame(); else setGameRunning(!gameRunning) }} disabled={false} size="sm" style={{ backgroundColor: gameRunning ? undefined : themeColor }}>
              {gameRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}{gameRunning ? "Pause" : "Start"}
            </Button>
          </div>
          <p className="text-sm text-gray-600">Use arrow keys to move your paddle &middot; First to 5 wins!</p>
        </div>
      </div>
    </div>
  )
}
