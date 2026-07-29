"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react"

interface Position { x: number; y: number }

const GRID_SIZE = 20
const CANVAS_SIZE = 400
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const GAME_SPEED = 150

export default function SnakeGame({ onBack, themeColor = "#22c55e" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameRunning, setGameRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const snakeRef = useRef<Position[]>(INITIAL_SNAKE)
  const directionRef = useRef<Position>(INITIAL_DIRECTION)
  const foodRef = useRef<Position>({ x: 15, y: 15 })
  const lastMoveRef = useRef(0)
  const animFrameRef = useRef(0)
  const gameRunningRef = useRef(false)
  const gameOverRef = useRef(false)
  const scoreRef = useRef(0)
  const bestScoreRef = useRef(0)

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      }
    } while (snakeBody.some((s) => s.x === newFood.x && s.y === newFood.y))
    return newFood
  }, [])

  const resetGame = useCallback(() => {
    snakeRef.current = [...INITIAL_SNAKE]
    directionRef.current = { ...INITIAL_DIRECTION }
    foodRef.current = { x: 15, y: 15 }
    scoreRef.current = 0
    gameRunningRef.current = false
    gameOverRef.current = false
    setScore(0)
    setGameRunning(false)
    setGameOver(false)
    lastMoveRef.current = 0
  }, [])

  const gameLoop = useCallback((timestamp: number) => {
    if (!gameRunningRef.current || gameOverRef.current) {
      animFrameRef.current = requestAnimationFrame(gameLoop)
      return
    }

    if (timestamp - lastMoveRef.current < GAME_SPEED) {
      animFrameRef.current = requestAnimationFrame(gameLoop)
      return
    }
    lastMoveRef.current = timestamp

    const snake = snakeRef.current
    const head = { ...snake[0] }
    const dir = directionRef.current
    head.x += dir.x
    head.y += dir.y

    if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE || head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
      gameOverRef.current = true
      gameRunningRef.current = false
      if (scoreRef.current > bestScoreRef.current) {
        bestScoreRef.current = scoreRef.current
        setBestScore(scoreRef.current)
      }
      setGameRunning(false)
      setGameOver(true)
      return
    }

    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOverRef.current = true
      gameRunningRef.current = false
      if (scoreRef.current > bestScoreRef.current) {
        bestScoreRef.current = scoreRef.current
        setBestScore(scoreRef.current)
      }
      setGameRunning(false)
      setGameOver(true)
      return
    }

    snake.unshift(head)

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 10
      setScore(scoreRef.current)
      foodRef.current = generateFood(snake)
    } else {
      snake.pop()
    }

    snakeRef.current = snake
    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [generateFood])

  useEffect(() => {
    gameRunningRef.current = gameRunning
    gameOverRef.current = gameOver
  }, [gameRunning, gameOver])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    bestScoreRef.current = bestScore
  }, [bestScore])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let frameId: number

    const draw = () => {
      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke()
      }
      ctx.fillStyle = themeColor
      const snake = snakeRef.current
      snake.forEach((s, i) => {
        ctx.fillRect(s.x * GRID_SIZE + 1, s.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
        if (i === 0) {
          ctx.fillStyle = "#fff"
          ctx.fillRect(s.x * GRID_SIZE + 4, s.y * GRID_SIZE + 4, 3, 3)
          ctx.fillRect(s.x * GRID_SIZE + 13, s.y * GRID_SIZE + 4, 3, 3)
          ctx.fillStyle = themeColor
        }
      })
      ctx.fillStyle = "#ef4444"
      const food = foodRef.current
      ctx.fillRect(food.x * GRID_SIZE + 1, food.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
      if (gameOverRef.current) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
        ctx.fillStyle = "#fff"
        ctx.font = "24px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Game Over!", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30)
        ctx.font = "16px Arial"
        ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2)
        ctx.fillText(`Best: ${bestScoreRef.current}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 25)
        ctx.textAlign = "left"
      }
      frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [themeColor])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        if (!gameRunningRef.current && !gameOverRef.current) {
          setGameRunning(true)
          return
        }
        if (gameOverRef.current) {
          resetGame()
          return
        }
      }
      if (!gameRunningRef.current) return
      const dir = directionRef.current
      switch (e.key) {
        case "ArrowUp": if (dir.y !== 1) directionRef.current = { x: 0, y: -1 }; break
        case "ArrowDown": if (dir.y !== -1) directionRef.current = { x: 0, y: 1 }; break
        case "ArrowLeft": if (dir.x !== 1) directionRef.current = { x: -1, y: 0 }; break
        case "ArrowRight": if (dir.x !== -1) directionRef.current = { x: 1, y: 0 }; break
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [resetGame])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Snake</h1>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />Reset
          </Button>
        </div>
        <Card className="p-4 mb-4">
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="border border-gray-300 mx-auto block" />
        </Card>
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-4 text-sm text-gray-700">
            <span>Score: {score}</span>
            <span>Best: {bestScore}</span>
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={() => { if (gameOver) resetGame(); else setGameRunning(!gameRunning) }} disabled={false} size="sm" style={{ backgroundColor: gameRunning ? undefined : themeColor }}>
              {gameRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {gameRunning ? "Pause" : "Start"}
            </Button>
          </div>
          <p className="text-sm text-gray-600">Use arrow keys to control the snake</p>
        </div>
      </div>
    </div>
  )
}
