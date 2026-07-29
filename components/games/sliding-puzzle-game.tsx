"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

type Size = 3 | 4 | 5

/** Solved layout with the blank (0) in the last cell. */
function solved(n: number): number[] {
  return [...Array.from({ length: n * n - 1 }, (_, i) => i + 1), 0]
}

/** Shuffle by walking the blank backwards, which guarantees solvability. */
function shuffle(n: number): number[] {
  const tiles = solved(n)
  let blank = n * n - 1
  for (let i = 0; i < n * n * 40; i++) {
    const r = Math.floor(blank / n)
    const c = blank % n
    const moves: number[] = []
    if (r > 0) moves.push(blank - n)
    if (r < n - 1) moves.push(blank + n)
    if (c > 0) moves.push(blank - 1)
    if (c < n - 1) moves.push(blank + 1)
    const pick = moves[Math.floor(Math.random() * moves.length)]
    ;[tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]]
    blank = pick
  }
  return tiles
}

function isSolved(tiles: number[]): boolean {
  const goal = solved(Math.round(Math.sqrt(tiles.length)))
  return tiles.every((t, i) => t === goal[i])
}

export default function SlidingPuzzleGame({ themeColor = "#4338ca" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won">("menu")
  const [size, setSize] = useState<Size>(3)
  const [tiles, setTiles] = useState<number[]>(solved(3))
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [bests, setBests] = useState<Record<number, number>>({})

  const start = useCallback((n: Size) => {
    setSize(n)
    setTiles(shuffle(n))
    setMoves(0)
    setSeconds(0)
    setPhase("playing")
  }, [])

  useEffect(() => {
    if (phase !== "playing") return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const slide = useCallback(
    (index: number) => {
      if (phase !== "playing") return
      const blank = tiles.indexOf(0)
      const sameRow = Math.floor(index / size) === Math.floor(blank / size)
      const sameCol = index % size === blank % size
      const adjacent = (sameRow && Math.abs(index - blank) === 1) || (sameCol && Math.abs(index - blank) === size)
      if (!adjacent) return

      const next = [...tiles]
      ;[next[blank], next[index]] = [next[index], next[blank]]
      setTiles(next)
      const m = moves + 1
      setMoves(m)

      if (isSolved(next)) {
        setPhase("won")
        setBests((b) => (b[size] === undefined || m < b[size] ? { ...b, [size]: m } : b))
      }
    },
    [phase, tiles, size, moves]
  )

  const tilePx = size === 3 ? 92 : size === 4 ? 72 : 58

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md my-auto py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🧩</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sliding Puzzle</h2>
          <p className="text-muted-foreground mb-6">Slide the numbered tiles back into order. Every shuffle is guaranteed solvable.</p>
          <div className="flex flex-col gap-3 items-center">
            {([3, 4, 5] as Size[]).map((n) => (
              <Button key={n} onClick={() => start(n)} style={{ backgroundColor: themeColor }} size="lg" className="w-52">
                <Play className="w-5 h-5 mr-2" />
                {n}×{n} {n === 3 ? "Easy" : n === 4 ? "Classic" : "Hard"}
              </Button>
            ))}
          </div>
          {Object.keys(bests).length > 0 && (
            <div className="mt-6 text-sm text-muted-foreground">
              {([3, 4, 5] as Size[]).filter((n) => bests[n] !== undefined).map((n) => (
                <div key={n}>
                  Best {n}×{n}: {bests[n]} moves
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4">
          <div className="flex justify-between items-center mb-3 gap-4">
            <span className="text-sm font-medium">Moves: {moves}</span>
            <span className="text-sm text-muted-foreground">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
            <Button variant="ghost" size="sm" onClick={() => start(size)}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>
          <div
            className="grid gap-1.5 p-2 rounded-xl bg-muted"
            style={{ gridTemplateColumns: `repeat(${size}, ${tilePx}px)` }}
          >
            {tiles.map((t, i) => (
              <button
                key={i}
                onClick={() => slide(i)}
                disabled={t === 0}
                className={`rounded-lg font-bold transition-all ${t === 0 ? "invisible" : "text-white hover:brightness-110 active:scale-95"}`}
                style={{
                  width: tilePx,
                  height: tilePx,
                  fontSize: tilePx * 0.35,
                  backgroundColor: t === 0 ? "transparent" : themeColor,
                }}
              >
                {t !== 0 ? t : ""}
              </button>
            ))}
          </div>
          {phase === "won" && (
            <div className="text-center mt-6">
              <div className="text-lg font-bold text-green-500 mb-1">Solved!</div>
              <div className="text-sm text-muted-foreground mb-4">
                {moves} moves in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => start(size)} style={{ backgroundColor: themeColor }} size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPhase("menu")}>
                  Menu
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
