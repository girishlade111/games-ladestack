"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw, Delete } from "lucide-react"

/**
 * Each puzzle has 7 letters; the centre letter is mandatory in every answer.
 * A pangram uses all seven and is worth a bonus.
 */
const PUZZLES: Array<{ center: string; outer: string[]; words: string[]; pangrams: string[] }> = [
  {
    center: "t",
    outer: ["c", "a", "i", "n", "o", "l"],
    words: ["action", "atonic", "cation", "coital", "notic", "tonal", "total", "tonic", "toil", "tail", "tali", "coat", "coil", "colt", "cost", "cant", "clot", "int", "into", "lion", "loin", "lint", "lilt", "loot", "riot", "taco", "talc", "toll", "tool", "tint", "titan", "octal", "oat", "tan", "ton", "tin", "tic", "cat", "act", "lot", "not", "nit", "ait", "oat"],
    pangrams: ["catlion"],
  },
  {
    center: "r",
    outer: ["e", "a", "d", "i", "n", "g"],
    words: ["reading", "gainer", "regina", "grader", "daring", "gradin", "danger", "garden", "gander", "grain", "grand", "grade", "grade", "range", "anger", "regna", "rider", "aider", "rain", "rang", "ring", "rind", "read", "rear", "rage", "rein", "ride", "dear", "dare", "gear", "near", "earn", "iron", "rid", "ran", "rag", "rid", "err", "ire", "are", "ear", "era"],
    pangrams: ["reading", "grained"],
  },
  {
    center: "s",
    outer: ["t", "o", "n", "e", "l", "i"],
    words: ["stolen", "listen", "silent", "enlist", "tinsel", "lesion", "insole", "eloins", "stone", "notes", "onset", "tones", "steno", "islet", "inlet", "stein", "tiles", "lines", "liens", "stole", "toles", "notes", "lense", "sonnet", "lens", "list", "silt", "slit", "tins", "nest", "nets", "sent", "site", "ties", "lest", "lets", "lost", "lots", "slot", "sole", "toes", "eons", "noes", "nose", "ones", "sin", "son", "set", "its", "sit", "tis", "sol", "ins"],
    pangrams: ["nostile", "instole"],
  },
  {
    center: "e",
    outer: ["p", "l", "a", "y", "r", "s"],
    words: ["players", "parleys", "sparely", "parsley", "replays", "player", "replay", "pearly", "parley", "sleepy", "layers", "relays", "slayer", "splay", "spray", "relay", "layer", "early", "yeas", "years", "pears", "spear", "spare", "reaps", "pales", "leaps", "lapse", "pearl", "peal", "real", "earl", "sale", "seal", "leap", "pale", "pear", "reap", "rape", "year", "aery", "eyas", "prey", "pyre", "lyre", "yea", "yes", "sea", "ale", "ape", "are", "ear", "era", "lea", "pea", "per", "rye", "aye", "ley"],
    pangrams: ["players", "parsley", "parleys", "replays", "sparely"],
  },
]

const MIN_LEN = 4

export default function SpellingBeeGame({ themeColor = "#ca8a04" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing">("menu")
  const [idx, setIdx] = useState(0)
  const [entry, setEntry] = useState("")
  const [found, setFound] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [message, setMessage] = useState("")

  const puzzle = PUZZLES[idx]
  const allLetters = [puzzle.center, ...puzzle.outer]

  const start = useCallback(() => {
    const i = Math.floor(Math.random() * PUZZLES.length)
    setIdx(i)
    setEntry("")
    setFound([])
    setScore(0)
    setMessage("")
    setPhase("playing")
  }, [])

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(""), 1200)
  }

  const submit = useCallback(() => {
    const word = entry.toLowerCase()
    setEntry("")

    if (word.length < MIN_LEN) return flash(`At least ${MIN_LEN} letters`)
    if (!word.includes(puzzle.center)) return flash(`Must use the centre letter "${puzzle.center.toUpperCase()}"`)
    if (found.includes(word)) return flash("Already found")

    const valid = puzzle.words.includes(word) || puzzle.pangrams.includes(word)
    if (!valid) return flash("Not in the word list")

    const isPangram = new Set(word).size === 7
    // 1 point for a 4-letter word, then a point per extra letter, +7 for pangrams.
    const points = (word.length === 4 ? 1 : word.length) + (isPangram ? 7 : 0)

    setFound((f) => [...f, word].sort())
    setScore((s) => {
      const ns = s + points
      setBest((b) => Math.max(b, ns))
      return ns
    })
    flash(isPangram ? `PANGRAM! +${points}` : `+${points}`)
  }, [entry, puzzle, found])

  const addLetter = useCallback((l: string) => setEntry((e) => e + l), [])

  useEffect(() => {
    if (phase !== "playing") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit()
      else if (e.key === "Backspace") setEntry((v) => v.slice(0, -1))
      else if (/^[a-zA-Z]$/.test(e.key) && allLetters.includes(e.key.toLowerCase())) addLetter(e.key.toLowerCase())
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, submit, addLetter, allLetters])

  const total = puzzle.words.length + puzzle.pangrams.length
  const rank =
    score >= 60 ? "Genius" : score >= 40 ? "Amazing" : score >= 25 ? "Great" : score >= 12 ? "Good" : score >= 5 ? "Moving Up" : "Beginner"

  // Hex ring positions for the six outer letters.
  const ring = [
    { x: 0, y: -74 },
    { x: 64, y: -37 },
    { x: 64, y: 37 },
    { x: 0, y: 74 },
    { x: -64, y: 37 },
    { x: -64, y: -37 },
  ]

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🐝</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Spelling Bee</h2>
          <p className="text-muted-foreground mb-2">
            Build words of {MIN_LEN}+ letters that always include the centre letter. Letters may repeat. Use all seven for a pangram bonus.
          </p>
          {best > 0 && <p className="text-sm text-muted-foreground mb-6">Best score: {best}</p>}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase === "playing" && (
        <div className="py-4 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">
              {score} pts · {rank}
            </span>
            <span className="text-sm text-muted-foreground">
              {found.length}/{total} words
            </span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="h-11 mb-4 flex items-center justify-center border-b-2 border-dashed">
            <span className="text-2xl font-bold uppercase tracking-widest">{entry || <span className="text-muted-foreground/40">type…</span>}</span>
          </div>

          <div className="text-center text-sm font-medium mb-4 h-5" style={{ color: message.startsWith("+") || message.startsWith("PANGRAM") ? themeColor : undefined }}>
            {message}
          </div>

          {/* Honeycomb */}
          <div className="relative h-56 flex items-center justify-center mb-4">
            <button
              onClick={() => addLetter(puzzle.center)}
              className="absolute w-16 h-[70px] flex items-center justify-center text-2xl font-bold text-white transition-transform active:scale-95"
              style={{ backgroundColor: themeColor, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              {puzzle.center.toUpperCase()}
            </button>
            {puzzle.outer.map((l, i) => (
              <button
                key={l}
                onClick={() => addLetter(l)}
                className="absolute w-16 h-[70px] flex items-center justify-center text-2xl font-bold bg-muted hover:bg-accent transition-transform active:scale-95"
                style={{
                  transform: `translate(${ring[i].x}px, ${ring[i].y}px)`,
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-center mb-5">
            <Button variant="outline" size="sm" onClick={() => setEntry((v) => v.slice(0, -1))}>
              <Delete className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button onClick={submit} style={{ backgroundColor: themeColor }} size="sm">
              Enter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEntry("")}>
              Clear
            </Button>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Found words ({found.length})</div>
            <div className="flex flex-wrap gap-1.5 min-h-16">
              {found.map((w) => (
                <span
                  key={w}
                  className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${new Set(w).size === 7 ? "bg-yellow-200 dark:bg-yellow-700 font-bold" : "bg-muted"}`}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
