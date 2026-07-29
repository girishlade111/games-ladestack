"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

/** Each puzzle is a 6-letter base word plus the valid words hidden inside it. */
const PUZZLES: Array<{ letters: string; words: string[] }> = [
  { letters: "master", words: ["master", "stream", "tamers", "steam", "meats", "mates", "teams", "tears", "rates", "stare", "arms", "star", "rats", "arts", "east", "seat", "team", "meat", "tame", "mast", "sear"] },
  { letters: "planet", words: ["planet", "platen", "plate", "petal", "leapt", "plant", "plan", "plea", "pale", "leap", "tale", "late", "neat", "pant", "leant", "lane", "pane", "tape", "peat"] },
  { letters: "garden", words: ["garden", "danger", "gander", "ranged", "grade", "grand", "range", "anger", "regna", "read", "dear", "dare", "gear", "rage", "dean", "near", "earn", "rend", "gone"] },
  { letters: "silent", words: ["silent", "listen", "enlist", "tinsel", "inlets", "islet", "inlet", "stein", "tiles", "lines", "liens", "lens", "list", "silt", "lint", "tins", "nest", "nets", "site"] },
  { letters: "castle", words: ["castle", "cleats", "eclats", "cates", "cleat", "steal", "least", "slate", "stale", "tales", "scale", "laces", "case", "lace", "seal", "sale", "cast", "cats", "acts", "late"] },
  { letters: "orange", words: ["orange", "onager", "groan", "organ", "argon", "range", "anger", "genoa", "gone", "gore", "rage", "near", "earn", "gear", "roan", "nag", "ego", "ore", "one"] },
  { letters: "player", words: ["player", "replay", "pearly", "parley", "relay", "layer", "royal", "early", "pray", "play", "pale", "leap", "year", "aery", "real", "earl", "pyre", "prey", "lyre"] },
  { letters: "friend", words: ["friend", "finder", "refind", "fried", "fired", "rifed", "finer", "infer", "diner", "fern", "fire", "ride", "rind", "find", "fine", "dire", "dine", "nerd", "rend"] },
]

const ROUND_SECONDS = 90

function shuffled(letters: string): string[] {
  const arr = letters.split("")
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function AnagramHuntGame({ themeColor = "#c2410c" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu")
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [tiles, setTiles] = useState<string[]>([])
  const [entry, setEntry] = useState("")
  const [found, setFound] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [seconds, setSeconds] = useState(ROUND_SECONDS)
  const [message, setMessage] = useState("")

  const puzzle = PUZZLES[puzzleIdx]

  const start = useCallback(() => {
    const idx = Math.floor(Math.random() * PUZZLES.length)
    setPuzzleIdx(idx)
    setTiles(shuffled(PUZZLES[idx].letters))
    setEntry("")
    setFound([])
    setScore(0)
    setSeconds(ROUND_SECONDS)
    setMessage("")
    setPhase("playing")
  }, [])

  useEffect(() => {
    if (phase !== "playing") return
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setPhase("over")
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === "over") setBest((b) => Math.max(b, score))
  }, [phase, score])

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(""), 1100)
  }

  const submit = useCallback(() => {
    if (phase !== "playing") return
    const word = entry.toLowerCase().trim()
    setEntry("")

    if (word.length < 3) return flash("Words need at least 3 letters")
    if (found.includes(word)) return flash("Already found")
    if (!puzzle.words.includes(word)) return flash("Not in this puzzle")

    const nextFound = [...found, word]
    setFound(nextFound)
    // Longer words are worth disproportionately more.
    const points = word.length === puzzle.letters.length ? 100 : word.length * 10
    setScore((s) => s + points)
    flash(`+${points} for ${word.toUpperCase()}`)

    if (nextFound.length === puzzle.words.length) {
      setScore((s) => s + seconds * 5)
      setPhase("over")
    }
  }, [phase, entry, found, puzzle, seconds])

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🔤</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Anagram Hunt</h2>
          <p className="text-muted-foreground mb-2">
            Find as many words as you can from six scrambled letters in {ROUND_SECONDS} seconds. Using all six scores big.
          </p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best score: {best}</p>}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Hunt
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">Score: {score}</span>
            <span className={`text-sm font-mono ${seconds <= 15 ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
              0:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-muted-foreground">
              {found.length}/{puzzle.words.length}
            </span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            {tiles.map((l, i) => (
              <div
                key={i}
                className="w-11 h-11 rounded-lg flex items-center justify-center text-xl font-bold text-white shadow"
                style={{ backgroundColor: themeColor }}
              >
                {l.toUpperCase()}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-2">
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value.replace(/[^a-zA-Z]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              disabled={phase !== "playing"}
              placeholder="Type a word..."
              autoFocus
              maxLength={puzzle.letters.length}
              className="flex-1 h-11 px-3 rounded-md border bg-background text-lg uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={submit} disabled={phase !== "playing"} style={{ backgroundColor: themeColor }} className="h-11">
              Submit
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setTiles(shuffled(puzzle.letters))} className="mb-3 w-full">
            Shuffle letters
          </Button>

          <div className="text-center text-sm font-medium mb-3 h-5">{message}</div>

          <div className="flex flex-wrap gap-1.5 justify-center min-h-16">
            {found.map((w) => (
              <span key={w} className="px-2 py-1 rounded-md bg-muted text-xs font-medium uppercase">
                {w}
              </span>
            ))}
          </div>

          {phase === "over" && (
            <div className="text-center mt-6">
              <div className="text-lg font-bold mb-1">Time's Up!</div>
              <div className="text-sm text-muted-foreground mb-2">
                Final score {score} — found {found.length} of {puzzle.words.length}
              </div>
              <details className="text-xs text-muted-foreground mb-4">
                <summary className="cursor-pointer">Show missed words</summary>
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  {puzzle.words
                    .filter((w) => !found.includes(w))
                    .map((w) => (
                      <span key={w} className="px-1.5 py-0.5 rounded bg-muted uppercase">
                        {w}
                      </span>
                    ))}
                </div>
              </details>
              <Button onClick={start} style={{ backgroundColor: themeColor }} size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
