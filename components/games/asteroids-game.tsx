"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw, Rocket } from "lucide-react"

const W = 600; const H = 500
const SHIP_SIZE = 15; const ROT_SPEED = 0.08; const THRUST = 0.15; const FRICTION = 0.99
const BULLET_SPEED = 6; const BULLET_LIFE = 60; const ASTEROID_SIZES = [25, 18, 12]

interface Vec { x: number; y: number }
interface Ship { pos: Vec; vel: Vec; angle: number; thrusting: boolean; alive: boolean }
interface Bullet { pos: Vec; vel: Vec; life: number }
interface Asteroid { pos: Vec; vel: Vec; size: number; angle: number; radii: number[] }

function vec(x: number, y: number): Vec { return { x, y } }
function add(a: Vec, b: Vec): Vec { return { x: a.x + b.x, y: a.y + b.y } }
function mul(a: Vec, s: number): Vec { return { x: a.x * s, y: a.y * s } }
function dist(a: Vec, b: Vec): number { return Math.hypot(a.x - b.x, a.y - b.y) }

function wrap(v: Vec): Vec { return { x: ((v.x % W) + W) % W, y: ((v.y % H) + H) % H } }

// Stable per-asteroid silhouette so shapes rotate instead of "boiling".
function makeRadii(): number[] {
  return Array.from({ length: 11 }, () => 0.8 + Math.random() * 0.2)
}

function randomAsteroid(avoid?: Vec): Asteroid {
  let pos: Vec = vec(0, 0)
  for (let attempt = 0; attempt < 20; attempt++) {
    const edge = Math.floor(Math.random() * 4)
    if (edge === 0) pos = vec(Math.random() * W, 0)
    else if (edge === 1) pos = vec(Math.random() * W, H)
    else if (edge === 2) pos = vec(0, Math.random() * H)
    else pos = vec(W, Math.random() * H)
    // Keep respawning waves clear of the ship's spawn point so death is avoidable.
    if (!avoid || dist(pos, avoid) > ASTEROID_SIZES[2] + SHIP_SIZE + 60) break
  }
  return { pos, vel: vec((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2), size: 2, angle: 0, radii: makeRadii() }
}

const STARS = Array.from({ length: 30 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  alpha: Math.random() * 0.5 + 0.5,
}))

export default function AsteroidsGame({ themeColor = "#06b6d4" }: { onBack?: () => void; themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [bestScore, setBestScore] = useState(0)
  const gsRef = useRef<"menu" | "playing" | "gameOver">("menu")
  const shipRef = useRef<Ship>({ pos: vec(W / 2, H / 2), vel: vec(0, 0), angle: -Math.PI / 2, thrusting: false, alive: true })
  const bulletsRef = useRef<Bullet[]>([])
  const asteroidsRef = useRef<Asteroid[]>([])
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const animRef = useRef(0)
  const keysRef = useRef<Set<string>>(new Set())

  const spawnAsteroids = useCallback((count: number) => {
    for (let i = 0; i < count; i++) asteroidsRef.current.push(randomAsteroid(shipRef.current.pos))
  }, [])

  const initShip = () => { shipRef.current = { pos: vec(W / 2, H / 2), vel: vec(0, 0), angle: -Math.PI / 2, thrusting: false, alive: true } }

  const startGame = useCallback(() => {
    bulletsRef.current = []; asteroidsRef.current = []; scoreRef.current = 0; livesRef.current = 3
    initShip(); spawnAsteroids(4); setScore(0); setLives(3); setGameState("playing"); gsRef.current = "playing"
  }, [spawnAsteroids])

  const fire = () => {
    if (!shipRef.current.alive) return
    const s = shipRef.current
    const tip = add(s.pos, mul(vec(Math.cos(s.angle), Math.sin(s.angle)), SHIP_SIZE))
    const bv = add(s.vel, mul(vec(Math.cos(s.angle), Math.sin(s.angle)), BULLET_SPEED))
    bulletsRef.current.push({ pos: tip, vel: bv, life: BULLET_LIFE })
  }

  const gameLoop = useCallback(() => {
    if (gsRef.current !== "playing") { animRef.current = requestAnimationFrame(gameLoop); return }
    const keys = keysRef.current; const ship = shipRef.current

    if (keys.has("ArrowLeft")) ship.angle -= ROT_SPEED
    if (keys.has("ArrowRight")) ship.angle += ROT_SPEED
    if (keys.has("ArrowUp")) { ship.thrusting = true; ship.vel = add(ship.vel, mul(vec(Math.cos(ship.angle), Math.sin(ship.angle)), THRUST)) } else ship.thrusting = false
    ship.vel = mul(ship.vel, FRICTION); ship.pos = wrap(add(ship.pos, ship.vel))

    if (keys.has(" ") && bulletsRef.current.length < 6) { fire(); keysRef.current.delete(" ") }

    for (const b of bulletsRef.current) { b.pos = wrap(add(b.pos, b.vel)); b.life-- }
    bulletsRef.current = bulletsRef.current.filter(b => b.life > 0)

    for (const a of asteroidsRef.current) { a.pos = wrap(add(a.pos, a.vel)); a.angle += 0.02 }

    if (ship.alive) {
      for (const a of asteroidsRef.current) {
        if (dist(ship.pos, a.pos) < ASTEROID_SIZES[a.size] + SHIP_SIZE - 5) {
          ship.alive = false
          livesRef.current -= 1
          setLives(livesRef.current)
          if (livesRef.current <= 0) {
            gsRef.current = "gameOver"
            setGameState("gameOver")
            setBestScore(prev => (scoreRef.current > prev ? scoreRef.current : prev))
          } else {
            initShip()
            if (asteroidsRef.current.length < 2) spawnAsteroids(4)
          }
          break
        }
      }
    }

    for (let bi = bulletsRef.current.length - 1; bi >= 0; bi--) {
      const b = bulletsRef.current[bi]
      for (let ai = asteroidsRef.current.length - 1; ai >= 0; ai--) {
        const a = asteroidsRef.current[ai]
        if (dist(b.pos, a.pos) < ASTEROID_SIZES[a.size]) {
          bulletsRef.current.splice(bi, 1)
          let pts = 0
          if (a.size === 2) { pts = 20; if (Math.random() < 0.7) { asteroidsRef.current.push({ pos: { ...a.pos }, vel: vec((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3), size: 1, angle: 0, radii: makeRadii() }); asteroidsRef.current.push({ pos: { ...a.pos }, vel: vec((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3), size: 1, angle: 0, radii: makeRadii() }) } }
          else if (a.size === 1) { pts = 50; asteroidsRef.current.push({ pos: { ...a.pos }, vel: vec((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4), size: 0, angle: 0, radii: makeRadii() }); asteroidsRef.current.push({ pos: { ...a.pos }, vel: vec((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4), size: 0, angle: 0, radii: makeRadii() }) }
          else pts = 100
          asteroidsRef.current.splice(ai, 1); scoreRef.current += pts; setScore(scoreRef.current)
          if (asteroidsRef.current.length === 0) { spawnAsteroids(4 + Math.floor(scoreRef.current / 200)) }
          break
        }
      }
    }

    // Always schedule the next frame — even after a death — or the loop dies.
    animRef.current = requestAnimationFrame(gameLoop)
  }, [spawnAsteroids])

  useEffect(() => { animRef.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(animRef.current) }, [gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext("2d"); if (!ctx) return
    let fid: number
    const draw = () => {
      ctx.fillStyle = "#0a0a2e"; ctx.fillRect(0, 0, W, H)
      // Precomputed static starfield (no per-frame flicker).
      for (const star of STARS) { ctx.fillStyle = `rgba(255,255,255,${star.alpha})`; ctx.fillRect(star.x, star.y, 1.5, 1.5) }
      const ship = shipRef.current
      if (ship.alive) {
        ctx.save(); ctx.translate(ship.pos.x, ship.pos.y); ctx.rotate(ship.angle)
        ctx.strokeStyle = themeColor; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(SHIP_SIZE, 0); ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6); ctx.lineTo(-SHIP_SIZE * 0.4, 0); ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6); ctx.closePath(); ctx.stroke()
        if (ship.thrusting) { ctx.strokeStyle = "#ff6600"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-SHIP_SIZE * 0.5, -SHIP_SIZE * 0.3); ctx.lineTo(-SHIP_SIZE * 1.2, 0); ctx.lineTo(-SHIP_SIZE * 0.5, SHIP_SIZE * 0.3); ctx.stroke() }
        ctx.restore()
      }
      for (const b of bulletsRef.current) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, 2, 0, Math.PI * 2); ctx.fill() }
      for (const a of asteroidsRef.current) {
        const r = ASTEROID_SIZES[a.size]; ctx.strokeStyle = "#aaa"; ctx.lineWidth = 1.5; ctx.beginPath()
        for (let i = 0; i < a.radii.length; i++) { const angle = a.angle + (i * Math.PI * 2) / (a.radii.length - 1); const rad = r * a.radii[i]; i === 0 ? ctx.moveTo(a.pos.x + Math.cos(angle) * rad, a.pos.y + Math.sin(angle) * rad) : ctx.lineTo(a.pos.x + Math.cos(angle) * rad, a.pos.y + Math.sin(angle) * rad) }
        ctx.closePath(); ctx.stroke()
      }
      ctx.fillStyle = "#fff"; ctx.font = "14px monospace"; ctx.textAlign = "left"
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20)
      ctx.textAlign = "right"; ctx.fillText(`Lives: ${"♥".repeat(livesRef.current)}`, W - 10, 20)
      fid = requestAnimationFrame(draw)
    }
    fid = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(fid)
  }, [themeColor])

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); keysRef.current.add(e.key) }
      if (e.key === " ") { e.preventDefault(); keysRef.current.add(" ") }
    }
    const ku = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    const onBlur = () => { keysRef.current.clear() }
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku); window.addEventListener("blur", onBlur)
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("blur", onBlur) }
  }, [])

  return (
    <div className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <canvas ref={canvasRef} width={W} height={H} className="border-2 border-cyan-700 rounded-xl shadow-2xl mx-auto block" />
      {gameState === "menu" && (
        <div className="absolute inset-0 flex items-center justify-start overflow-y-auto bg-black/70 backdrop-blur-sm rounded-xl z-10">
          <div className="text-center text-white p-8 max-w-sm my-auto bg-gray-900/90 rounded-xl border border-cyan-700">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
            <h1 className="text-2xl font-bold mb-2">Asteroids</h1>
            <p className="text-gray-400 mb-4 text-sm">Destroy asteroids. Survive.</p>
            <div className="text-left text-xs text-gray-500 mb-6 space-y-1">
              <div><kbd className="px-2 py-0.5 bg-gray-800 rounded text-cyan-300">↑</kbd> Thrust</div>
              <div><kbd className="px-2 py-0.5 bg-gray-800 rounded text-cyan-300">← →</kbd> Rotate</div>
              <div><kbd className="px-2 py-0.5 bg-gray-800 rounded text-cyan-300">Space</kbd> Fire</div>
            </div>
            {bestScore > 0 && <p className="text-cyan-400 text-sm mb-4">Best: {bestScore}</p>}
            <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="px-6"><Play className="w-4 h-4 mr-2" />Launch</Button>
          </div>
        </div>
      )}
      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-start overflow-y-auto bg-black/70 backdrop-blur-sm rounded-xl z-10">
          <div className="text-center text-white p-8 max-w-sm my-auto bg-gray-900/90 rounded-xl border border-red-700">
            <h2 className="text-xl font-bold mb-2 text-red-400 flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" /> Game Over</h2>
            <p className="text-3xl font-bold text-white mb-2">{score}</p>
            {score === bestScore && score > 0 && <p className="text-yellow-400 text-sm mb-4">New Best!</p>}
            <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="px-6">Play Again</Button>
          </div>
        </div>
      )}
    </div>
  )
}
