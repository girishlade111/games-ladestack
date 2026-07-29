"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Triangle, Trophy, RotateCcw } from "lucide-react"

const CANVAS_WIDTH = 800; const CANVAS_HEIGHT = 600
const TRIANGLE_SIZE = 20; const GRAVITY = 0.6; const JUMP_FORCE = -12
const OBSTACLE_WIDTH = 60; const OBSTACLE_GAP = 150; const OBSTACLE_SPEED = 3

interface Obstacle { x: number; topHeight: number; bottomHeight: number; width: number; passed: boolean }

export default function FlappyTriangle({ onBack, themeColor = "#f59e0b" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const gsRef = useRef<"menu" | "playing" | "gameOver">("menu")

  const tRef = useRef({ x: 100, y: CANVAS_HEIGHT / 2, velocity: 0 })
  const obstaclesRef = useRef<Obstacle[]>([])
  const scoreRef = useRef(0)
  const animFrameRef = useRef(0)

  const generateObstacle = useCallback((x: number): Obstacle => {
    const th = Math.random() * (CANVAS_HEIGHT - OBSTACLE_GAP - 100) + 50
    return { x, topHeight: th, bottomHeight: CANVAS_HEIGHT - th - OBSTACLE_GAP, width: OBSTACLE_WIDTH, passed: false }
  }, [])

  const checkCollision = (t: { x: number; y: number }, obs: Obstacle[]) => {
    if (t.y <= 0 || t.y >= CANVAS_HEIGHT - TRIANGLE_SIZE) return true
    for (const o of obs) if (t.x + TRIANGLE_SIZE > o.x && t.x < o.x + o.width && (t.y < o.topHeight || t.y + TRIANGLE_SIZE > CANVAS_HEIGHT - o.bottomHeight)) return true
    return false
  }

  const startGame = useCallback(() => {
    tRef.current = { x: 100, y: CANVAS_HEIGHT / 2, velocity: 0 }
    obstaclesRef.current = []; scoreRef.current = 0
    setScore(0); setGameState("playing"); gsRef.current = "playing"
  }, [])

  const jump = useCallback(() => {
    const s = gsRef.current
    if (s === "menu") startGame()
    else if (s === "gameOver") { tRef.current = { x: 100, y: CANVAS_HEIGHT / 2, velocity: 0 }; obstaclesRef.current = []; scoreRef.current = 0; setScore(0); setGameState("menu"); gsRef.current = "menu" }
    else tRef.current.velocity = JUMP_FORCE
  }, [startGame])

  const gameLoop = useCallback(() => {
    if (gsRef.current !== "playing") { animFrameRef.current = requestAnimationFrame(gameLoop); return }

    const t = tRef.current; const obs = obstaclesRef.current
    t.velocity += GRAVITY; t.y += t.velocity

    for (const o of obs) o.x -= OBSTACLE_SPEED
    while (obs.length && obs[0].x + obs[0].width < 0) obs.shift()
    if (obs.length === 0 || obs[obs.length - 1].x < CANVAS_WIDTH - 200) obs.push(generateObstacle(CANVAS_WIDTH))
    for (const o of obs) { if (!o.passed && o.x + o.width < t.x) { o.passed = true; scoreRef.current++; setScore(scoreRef.current) } }

    if (checkCollision(t, obs)) {
      gsRef.current = "gameOver"; setGameState("gameOver")
      if (scoreRef.current > bestScore) setBestScore(scoreRef.current)
      return
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [generateObstacle, bestScore])

  useEffect(() => { gsRef.current = gameState }, [gameState])
  useEffect(() => { animFrameRef.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(animFrameRef.current) }, [gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext("2d"); if (!ctx) return
    let fid: number
    const draw = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT); grad.addColorStop(0, "#87ceeb"); grad.addColorStop(1, "#e0f6ff")
      ctx.fillStyle = grad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = "rgba(255,255,255,0.8)"
      for (let i = 0; i < 5; i++) { const x = (i * 200 + Date.now() * 0.02) % (CANVAS_WIDTH + 100); const y = 50 + i * 30; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.arc(x + 25, y, 30, 0, Math.PI * 2); ctx.arc(x + 50, y, 20, 0, Math.PI * 2); ctx.fill() }
      const obs = obstaclesRef.current
      obs.forEach((o) => {
        const og = ctx.createLinearGradient(o.x, 0, o.x + o.width, 0); og.addColorStop(0, "#22c55e"); og.addColorStop(1, "#16a34a")
        ctx.fillStyle = og; ctx.fillRect(o.x, 0, o.width, o.topHeight); ctx.fillRect(o.x, CANVAS_HEIGHT - o.bottomHeight, o.width, o.bottomHeight)
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(o.x, 0, 5, o.topHeight); ctx.fillRect(o.x, CANVAS_HEIGHT - o.bottomHeight, 5, o.bottomHeight)
      })
      const tt = tRef.current
      ctx.shadowColor = themeColor; ctx.shadowBlur = 10; ctx.fillStyle = themeColor; ctx.beginPath()
      ctx.moveTo(tt.x, tt.y); ctx.lineTo(tt.x + TRIANGLE_SIZE, tt.y + TRIANGLE_SIZE / 2); ctx.lineTo(tt.x, tt.y + TRIANGLE_SIZE); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
      ctx.fillStyle = "#000"; ctx.font = "bold 32px sans-serif"; ctx.textAlign = "center"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4
      ctx.strokeText(`${scoreRef.current}`, CANVAS_WIDTH / 2, 60); ctx.fillText(`${scoreRef.current}`, CANVAS_WIDTH / 2, 60); ctx.textAlign = "left"
      fid = requestAnimationFrame(draw)
    }
    fid = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(fid)
  }, [themeColor])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump() } }
    const c = () => jump()
    window.addEventListener("keydown", k); canvasRef.current?.addEventListener("click", c)
    return () => { window.removeEventListener("keydown", k); canvasRef.current?.removeEventListener("click", c) }
  }, [jump])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border-2 border-amber-200 rounded-xl shadow-2xl cursor-pointer mx-auto block bg-white" onClick={jump} />
        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
            <Card className="p-8 text-center border-amber-200 shadow-xl w-96">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: themeColor }}><Triangle className="w-8 h-8 text-white" /></div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Flappy Triangle</h1>
              <p className="text-gray-600 mb-4">Navigate through obstacles and score high!</p>
              <div className="bg-amber-50 rounded-lg p-4 text-left text-sm text-gray-700 space-y-2 mb-6">
                <div className="font-semibold text-amber-800">Controls:</div>
                <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Space</kbd> or <kbd className="px-2 py-1 bg-white rounded border text-xs">&#8593;</kbd> to jump</div>
                <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Click</kbd> anywhere to jump</div>
              </div>
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-white px-8 py-3 text-lg font-semibold shadow-lg">Start Flying</Button>
              {bestScore > 0 && <div className="mt-4 flex items-center justify-center gap-2 text-amber-700"><Trophy className="w-4 h-4" /><span className="text-sm font-medium">Best: {bestScore}</span></div>}
            </Card>
          </div>
        )}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
            <Card className="p-8 text-center border-amber-200 shadow-xl w-96">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Over!</h2>
              <div className="bg-amber-50 rounded-lg p-4 mb-4"><div className="text-3xl font-bold" style={{ color: themeColor }}>{score}</div><div className="text-sm text-gray-600">Final Score</div></div>
              {score === bestScore && score > 0 && <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-2 mb-4"><Trophy className="w-5 h-5" /><span className="font-semibold">New Best!</span></div>}
              {bestScore > 0 && score !== bestScore && <div className="text-sm text-gray-500 mb-4">Best: {bestScore}</div>}
              <div className="flex gap-3 justify-center">
                <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-white px-6 py-2 font-semibold shadow-lg">Play Again</Button>
                <Button onClick={() => { setGameState("menu"); scoreRef.current = 0; setScore(0); obstaclesRef.current = []; tRef.current = { x: 100, y: CANVAS_HEIGHT / 2, velocity: 0 }; gsRef.current = "menu" }} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 px-6 py-2 font-semibold">Menu</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
