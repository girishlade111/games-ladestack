"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PawPrint } from "lucide-react"

interface Sheep { x: number; y: number; velocity: number; width: number; height: number; onGround: boolean; animFrame: number }
interface Hazard { x: number; y: number; width: number; height: number; type: "bush" | "wolf" }

const GRAVITY = 0.9; const JUMP_FORCE = -18; const GROUND_Y = 500
const SHEEP_WIDTH = 50; const SHEEP_HEIGHT = 50
const WOLF_WIDTH = 60; const WOLF_HEIGHT = 40
const WOLF_Y_HIGH = GROUND_Y - 100; const WOLF_Y_MIDDLE = GROUND_Y - 60

function drawSheep(ctx: CanvasRenderingContext2D, sheep: Sheep, themeColor: string) {
  ctx.fillStyle = themeColor
  const legFrame = sheep.onGround ? Math.floor(sheep.animFrame / 4) % 2 : 0
  ctx.beginPath(); ctx.ellipse(sheep.x + sheep.width / 2, sheep.y + sheep.height / 2, sheep.width / 2, sheep.height / 2 - 5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillRect(sheep.x + sheep.width - 15, sheep.y + 10, 20, 15)
  ctx.fillRect(sheep.x + sheep.width - 10, sheep.y + 5, 5, 5); ctx.fillRect(sheep.x + sheep.width + 5, sheep.y + 5, 5, 5)
  ctx.fillStyle = "#171717"
  if (legFrame === 0) { ctx.fillRect(sheep.x + 10, sheep.y + sheep.height - 15, 10, 15); ctx.fillRect(sheep.x + 30, sheep.y + sheep.height - 15, 10, 15) }
  else { ctx.fillRect(sheep.x + 5, sheep.y + sheep.height - 15, 10, 15); ctx.fillRect(sheep.x + 35, sheep.y + sheep.height - 15, 10, 15) }
  ctx.fillStyle = "#fafafa"; ctx.fillRect(sheep.x + sheep.width - 5, sheep.y + 15, 3, 3)
}

function drawBush(ctx: CanvasRenderingContext2D, h: Hazard) {
  ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.ellipse(h.x + h.width / 2, h.y + h.height / 2, h.width / 2, h.height / 2, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = "#16a34a"; ctx.beginPath(); ctx.arc(h.x + h.width * 0.2, h.y + h.height * 0.4, h.width * 0.15, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(h.x + h.width * 0.7, h.y + h.height * 0.6, h.width * 0.1, 0, Math.PI * 2); ctx.fill()
}

function drawWolf(ctx: CanvasRenderingContext2D, h: Hazard, animFrame: number) {
  ctx.fillStyle = "#404040"; const wy = Math.sin(animFrame / 5) * 5
  ctx.fillRect(h.x, h.y + 10 + wy, h.width, h.height - 20); ctx.fillRect(h.x + h.width - 20, h.y + wy, 20, 20)
  ctx.fillRect(h.x + h.width - 10, h.y + 15 + wy, 10, 5); ctx.fillRect(h.x + h.width - 15, h.y + wy, 5, 5)
  ctx.fillRect(h.x + h.width, h.y + wy, 5, 5); ctx.fillRect(h.x + 10, h.y + h.height - 10 + wy, 5, 10)
  ctx.fillRect(h.x + h.width - 15, h.y + h.height - 10 + wy, 5, 10)
}

export default function SheepRunGame({ onBack, themeColor }: { onBack: () => void; themeColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const gsRef = useRef<"menu" | "playing" | "gameOver">("menu")

  const gs = useRef({
    sheep: { x: 80, y: GROUND_Y - SHEEP_HEIGHT, velocity: 0, width: SHEEP_WIDTH, height: SHEEP_HEIGHT, onGround: true, animFrame: 0 } as Sheep,
    hazards: [] as Hazard[], distance: 0, speed: 6,
    canvas: null as HTMLCanvasElement | null, ctx: null as CanvasRenderingContext2D | null,
  })

  const createHazard = useCallback((x: number) => {
    const isWolf = Math.random() > 0.65
    if (isWolf) gs.current.hazards.push({ x, y: Math.random() > 0.5 ? WOLF_Y_MIDDLE : WOLF_Y_HIGH, width: WOLF_WIDTH, height: WOLF_HEIGHT, type: "wolf" })
    else { const bt = [{ w: 30, h: 30 }, { w: 50, h: 30 }, { w: 70, h: 30 }]; const t = bt[Math.floor(Math.random() * bt.length)]; gs.current.hazards.push({ x, y: GROUND_Y - t.h, width: t.w, height: t.h, type: "bush" }) }
  }, [])

  const initGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = 800; canvas.height = 600
    gs.current = { sheep: { x: 80, y: GROUND_Y - SHEEP_HEIGHT, velocity: 0, width: SHEEP_WIDTH, height: SHEEP_HEIGHT, onGround: true, animFrame: 0 }, hazards: [], distance: 0, speed: 6, canvas, ctx: canvas.getContext("2d") }
    createHazard(canvas.width)
  }, [createHazard])

  const startGame = useCallback(() => { initGame(); setGameState("playing"); setScore(0) }, [initGame])

  const updateGame = useCallback(() => {
    const { sheep, hazards, canvas, ctx } = gs.current
    if (!canvas || !ctx) return
    gs.current.distance += gs.current.speed / 10; gs.current.speed += 0.003; sheep.animFrame++
    ctx.fillStyle = "#fafafa"; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#171717"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(canvas.width, GROUND_Y); ctx.stroke()
    sheep.velocity += GRAVITY; sheep.y += sheep.velocity
    if (sheep.y + sheep.height >= GROUND_Y) { sheep.y = GROUND_Y - sheep.height; sheep.velocity = 0; sheep.onGround = true }
    drawSheep(ctx, sheep, themeColor)
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i]; h.x -= gs.current.speed
      if (h.x + h.width < 0) hazards.splice(i, 1)
      else if (h.type === "bush") drawBush(ctx, h); else drawWolf(ctx, h, sheep.animFrame)
    }
    if (hazards.length === 0 || hazards[hazards.length - 1].x < canvas.width - 250 - Math.random() * 200) createHazard(canvas.width)
    for (const h of hazards) {
      if (sheep.x < h.x + h.width && sheep.x + sheep.width > h.x && sheep.y < h.y + h.height && sheep.y + sheep.height > h.y) {
        gsRef.current = "gameOver"; setGameState("gameOver")
        const fs = Math.floor(gs.current.distance); setScore(fs); setHighScore((p) => Math.max(p, fs))
        return
      }
    }
    ctx.fillStyle = "#171717"; ctx.font = "20px sans-serif"; ctx.textAlign = "right"
    ctx.fillText(`HI ${Math.floor(highScore)}  ${Math.floor(gs.current.distance)}`, canvas.width - 20, 30)
    if (gsRef.current === "playing") gameLoopRef.current = requestAnimationFrame(updateGame)
  }, [themeColor, highScore, createHazard])

  useEffect(() => { gsRef.current = gameState }, [gameState])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); if (gsRef.current === "playing") { if (gs.current.sheep.onGround) { gs.current.sheep.velocity = JUMP_FORCE; gs.current.sheep.onGround = false } } else startGame() }
    }
    const click = () => { if (gsRef.current === "playing") { if (gs.current.sheep.onGround) { gs.current.sheep.velocity = JUMP_FORCE; gs.current.sheep.onGround = false } } else startGame() }
    window.addEventListener("keydown", handle); canvasRef.current?.addEventListener("click", click)
    return () => { window.removeEventListener("keydown", handle); canvasRef.current?.removeEventListener("click", click); if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current) }
  }, [startGame])

  useEffect(() => {
    if (gameState === "playing") gameLoopRef.current = requestAnimationFrame(updateGame)
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current) }
  }, [gameState, updateGame])

  useEffect(() => {
    if (gameState !== "gameOver") return
    const h = (e: KeyboardEvent) => { if (e.key === "Enter" || e.code === "Space") startGame(); else if (e.key === "Escape") setGameState("menu") }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [gameState, startGame])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8">
      <div className="relative">
        <canvas ref={canvasRef} className="border border-gray-200 rounded-lg shadow-sm" style={{ maxWidth: "100%", height: "auto" }} />
        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-200 shadow-sm w-96">
              <div className="mb-6">
                <div className="w-8 h-8 mx-auto mb-4 flex items-center justify-center" style={{ color: themeColor }}><PawPrint className="w-full h-full" /></div>
                <h1 className="text-2xl font-medium text-gray-900 mb-2">Sheep Run</h1>
                <p className="text-sm text-gray-600 mb-4">Jump over bushes and dodge wolves to survive.</p>
                <div className="bg-gray-50 rounded-lg p-3 text-left text-xs text-gray-600 space-y-1">
                  <div className="font-medium text-gray-800">Controls:</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Space</kbd>, <kbd className="px-2 py-1 bg-white rounded border text-xs">&#8593;</kbd>, or <kbd className="px-2 py-1 bg-white rounded border text-xs">Click</kbd> to Jump</div>
                </div>
              </div>
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-white px-6 py-2 text-sm font-medium">Start</Button>
              {highScore > 0 && <p className="mt-4 text-xs text-gray-500">High Score: {Math.floor(highScore)}</p>}
            </Card>
          </div>
        )}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-200 shadow-sm w-96">
              <h2 className="text-lg font-medium text-gray-500 mb-1">Sheep Run</h2><h3 className="text-xl font-medium text-gray-900 mb-4">Game Over</h3>
              <p className="text-2xl font-mono mb-2" style={{ color: themeColor }}>{score}</p>
              <p className="text-xs text-gray-500 mb-6">High Score: {highScore}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-white px-4 py-2 text-sm font-medium">Again</Button>
                <Button onClick={() => setGameState("menu")} variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium">Menu</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
