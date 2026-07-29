"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Rocket } from "lucide-react"

const CANVAS_WIDTH = 800; const CANVAS_HEIGHT = 600
const PLAYER_WIDTH = 40; const PLAYER_HEIGHT = 30; const PLAYER_SPEED = 6
const BULLET_WIDTH = 4; const BULLET_HEIGHT = 10; const BULLET_SPEED = 8
const INVADER_WIDTH = 30; const INVADER_HEIGHT = 20
const INVADER_ROWS = 5; const INVADER_COLS = 10; const INVADER_SPEED = 1

interface Player { x: number; y: number; width: number; height: number }
interface Bullet { x: number; y: number; width: number; height: number; speed: number; isPlayerBullet: boolean }
interface Invader { x: number; y: number; width: number; height: number; alive: boolean; type: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }

export default function SpaceInvadersGame({ onBack, themeColor }: { onBack: () => void; themeColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const waveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver" | "won">("menu")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [highScore, setHighScore] = useState(0)
  const gsRef = useRef<"menu" | "playing" | "gameOver" | "won">("menu")

  const gs = useRef({
    player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 60, width: PLAYER_WIDTH, height: PLAYER_HEIGHT } as Player,
    bullets: [] as Bullet[], invaders: [] as Invader[], particles: [] as Particle[],
    score: 0, lives: 3, wave: 1, invaderDirection: 1, lastInvaderMove: 0, lastInvaderShot: 0,
    canvas: null as HTMLCanvasElement | null, ctx: null as CanvasRenderingContext2D | null, keys: new Set<string>(),
  })

  const createParticles = useCallback((x: number, y: number, color = "#fff", count = 8) => {
    for (let i = 0; i < count; i++) gs.current.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 30, maxLife: 30, size: Math.random() * 3 + 1, color })
  }, [])

  const createInvaders = useCallback((): Invader[] => {
    const invaders: Invader[] = []
    for (let row = 0; row < INVADER_ROWS; row++)
      for (let col = 0; col < INVADER_COLS; col++)
        invaders.push({ x: 100 + col * 50, y: 80 + row * 40, width: INVADER_WIDTH, height: INVADER_HEIGHT, alive: true, type: row })
    return invaders
  }, [])

  const initGame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT
    gs.current = { player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 60, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, bullets: [], invaders: createInvaders(), particles: [], score: 0, lives: 3, wave: 1, invaderDirection: 1, lastInvaderMove: 0, lastInvaderShot: 0, canvas, ctx: canvas.getContext("2d"), keys: new Set() }
    setScore(0); setLives(3); setWave(1)
    if (waveTimerRef.current) { clearTimeout(waveTimerRef.current); waveTimerRef.current = null }
  }, [createInvaders])

  const startGame = useCallback(() => { initGame(); setGameState("playing") }, [initGame])

  const checkCollision = (r1: any, r2: any) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y

  const shoot = useCallback(() => {
    const { player, bullets } = gs.current
    if (bullets.filter((b) => b.isPlayerBullet).length < 3) bullets.push({ x: player.x + player.width / 2 - BULLET_WIDTH / 2, y: player.y, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: -BULLET_SPEED, isPlayerBullet: true })
  }, [])

  const updateGame = useCallback(() => {
    const { player, bullets, invaders, particles, canvas, ctx, keys } = gs.current
    if (!canvas || !ctx || gsRef.current !== "playing") return
    const t = Date.now()

    if (keys.has("arrowleft") || keys.has("a")) player.x = Math.max(0, player.x - PLAYER_SPEED)
    if (keys.has("arrowright") || keys.has("d")) player.x = Math.min(canvas.width - player.width, player.x + PLAYER_SPEED)

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]; b.y += b.speed
      if (b.y < 0 || b.y > canvas.height) { bullets.splice(i, 1); continue }
      if (b.isPlayerBullet) {
        for (let j = 0; j < invaders.length; j++) {
          const inv = invaders[j]
          if (inv.alive && checkCollision(b, inv)) { inv.alive = false; bullets.splice(i, 1); gs.current.score += (4 - inv.type) * 10 + gs.current.wave * 5; setScore(gs.current.score); createParticles(inv.x + inv.width / 2, inv.y + inv.height / 2, themeColor, 12); break }
        }
      } else if (checkCollision(b, player)) {
        bullets.splice(i, 1); gs.current.lives--; setLives(gs.current.lives); createParticles(player.x + player.width / 2, player.y + player.height / 2, "#ff4444", 15)
        if (gs.current.lives <= 0) { gsRef.current = "gameOver"; setGameState("gameOver"); setHighScore((p) => Math.max(p, gs.current.score)); return }
      }
    }

    if (t - gs.current.lastInvaderMove > Math.max(200, 800 - gs.current.wave * 50)) {
      let down = false; const alive = invaders.filter((i) => i.alive)
      for (const inv of alive) { if ((gs.current.invaderDirection > 0 && inv.x + inv.width >= canvas.width - 20) || (gs.current.invaderDirection < 0 && inv.x <= 20)) { down = true; break } }
      if (down) {
        gs.current.invaderDirection *= -1
        for (const inv of alive) { inv.y += 20; if (inv.y + inv.height >= player.y) { gsRef.current = "gameOver"; setGameState("gameOver"); setHighScore((p) => Math.max(p, gs.current.score)); return } }
      } else for (const inv of alive) inv.x += INVADER_SPEED * gs.current.invaderDirection
      gs.current.lastInvaderMove = t
    }

    if (t - gs.current.lastInvaderShot > 1000 + Math.random() * 2000) {
      const alive = invaders.filter((i) => i.alive)
      if (alive.length > 0) { const s = alive[Math.floor(Math.random() * alive.length)]; bullets.push({ x: s.x + s.width / 2 - BULLET_WIDTH / 2, y: s.y + s.height, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED * 0.6, isPlayerBullet: false }) }
      gs.current.lastInvaderShot = t
    }

    if (invaders.filter((i) => i.alive).length === 0) {
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current)
      waveTimerRef.current = setTimeout(() => { gs.current.wave++; gs.current.invaders = createInvaders(); gs.current.bullets = []; gs.current.invaderDirection = 1; setWave(gs.current.wave) }, 1000)
    }

    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.vy *= 0.98; p.life--; if (p.life <= 0) particles.splice(i, 1) }

    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#fff"
    for (let i = 0; i < 50; i++) ctx.fillRect((i * 137.5) % canvas.width, (i * 73.3) % canvas.height, 1, 1)
    particles.forEach((p) => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill() }); ctx.globalAlpha = 1
    ctx.fillStyle = themeColor; ctx.fillRect(player.x, player.y, player.width, player.height)
    ctx.fillRect(player.x + 5, player.y - 5, 5, 5); ctx.fillRect(player.x + player.width - 10, player.y - 5, 5, 5); ctx.fillRect(player.x + player.width / 2 - 2, player.y - 8, 4, 8)
    const ic = ["#ff4444", "#ff8844", "#ffcc44", "#44ff44", "#44ccff"]
    invaders.forEach((inv) => { if (inv.alive) { ctx.fillStyle = ic[inv.type] || "#fff"; ctx.fillRect(inv.x, inv.y, inv.width, inv.height); ctx.fillStyle = "#000"; ctx.fillRect(inv.x + 5, inv.y + 5, 4, 4); ctx.fillRect(inv.x + inv.width - 9, inv.y + 5, 4, 4); ctx.fillRect(inv.x + 8, inv.y + 12, inv.width - 16, 3) } })
    bullets.forEach((b) => { ctx.fillStyle = b.isPlayerBullet ? themeColor : "#ff4444"; ctx.fillRect(b.x, b.y, b.width, b.height) })
    ctx.fillStyle = "#fff"; ctx.font = "20px sans-serif"; ctx.textAlign = "left"
    ctx.fillText(`Score: ${gs.current.score}`, 20, 30); ctx.fillText(`Lives: ${gs.current.lives}`, 20, 55); ctx.fillText(`Wave: ${gs.current.wave}`, 20, 80)
    gameLoopRef.current = requestAnimationFrame(updateGame)
  }, [themeColor, createParticles, createInvaders, shoot])

  useEffect(() => { gsRef.current = gameState }, [gameState])

  useEffect(() => {
    const down = (e: KeyboardEvent) => { gs.current.keys.add(e.key.toLowerCase()); if (gsRef.current === "playing" && e.key === " ") { e.preventDefault(); shoot() } }
    const up = (e: KeyboardEvent) => gs.current.keys.delete(e.key.toLowerCase())
    window.addEventListener("keydown", down); window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); if (waveTimerRef.current) clearTimeout(waveTimerRef.current) }
  }, [shoot])

  useEffect(() => {
    if (gameState === "playing") gameLoopRef.current = requestAnimationFrame(updateGame)
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current) }
  }, [gameState, updateGame])

  useEffect(() => {
    if (gameState !== "gameOver" && gameState !== "won") return
    const h = (e: KeyboardEvent) => { if (e.key === "Enter") startGame(); else if (e.key === "Escape") setGameState("menu") }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [gameState, startGame])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-8">
      <div className="relative">
        <canvas ref={canvasRef} className="border border-gray-800 rounded-lg shadow-sm" style={{ maxWidth: "100%", height: "auto" }} />
        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-800 shadow-sm bg-black text-white w-96">
              <div className="mb-6">
                <div className="w-8 h-8 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor }}><Rocket className="w-5 h-5 text-black" /></div>
                <h1 className="text-2xl font-medium text-white mb-2">Space Invaders</h1>
                <p className="text-sm text-gray-400 mb-4">Defend Earth from the alien invasion!</p>
                <div className="bg-gray-900 rounded-lg p-3 text-left text-xs text-gray-300 space-y-1">
                  <div className="font-medium text-white">Controls:</div>
                  <div><kbd className="px-2 py-1 bg-gray-700 rounded border border-gray-600 text-xs">&#8592;&#8594;</kbd> or <kbd className="px-2 py-1 bg-gray-700 rounded border border-gray-600 text-xs">A D</kbd> to Move</div>
                  <div><kbd className="px-2 py-1 bg-gray-700 rounded border border-gray-600 text-xs">Space</kbd> to Shoot</div>
                </div>
              </div>
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-black px-6 py-2 text-sm font-medium">Start Defense</Button>
              {highScore > 0 && <p className="mt-4 text-xs text-gray-500">High Score: {highScore}</p>}
            </Card>
          </div>
        )}
        {(gameState === "gameOver" || gameState === "won") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-sm rounded-lg">
            <Card className="p-8 text-center border-gray-800 shadow-sm bg-black text-white w-96">
              <h2 className="text-lg font-medium text-gray-500 mb-1">Space Invaders</h2>
              <h3 className="text-xl font-medium text-white mb-4">{gameState === "won" ? "Victory!" : "Earth Invaded!"}</h3>
              <p className="text-2xl font-mono mb-2" style={{ color: themeColor }}>{gs.current.score}</p>
              <p className="text-sm text-gray-400">Wave {wave}</p>
              <p className="text-xs text-gray-500 mb-6">High Score: {highScore}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startGame} style={{ backgroundColor: themeColor }} className="text-black px-4 py-2 text-sm font-medium">Defend Again</Button>
                <Button onClick={() => setGameState("menu")} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-4 py-2 text-sm font-medium">Menu</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
