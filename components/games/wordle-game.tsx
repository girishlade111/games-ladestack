"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw, Delete } from "lucide-react"

const WORDS = [
  "crane", "slate", "audio", "house", "plant", "brick", "chair", "dream", "flute", "ghost",
  "input", "jolly", "knife", "lemon", "mirth", "noble", "ocean", "pride", "quilt", "raven",
  "storm", "tiger", "ultra", "vivid", "wharf", "xenon", "yacht", "zebra", "amber", "blaze",
  "cider", "delta", "ember", "fable", "gauge", "haven", "ivory", "joker", "koala", "lunar",
  "maple", "nudge", "orbit", "pearl", "quest", "rider", "sonic", "torch", "unity", "vapor",
]

const ROWS = 6
const LEN = 5

type Mark = "correct" | "present" | "absent"

/** Standard Wordle scoring - duplicate letters only mark as many as remain. */
function scoreGuess(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(LEN).fill("absent")
  const pool: Record<string, number> = {}

  for (let i = 0; i < LEN; i++) {
    if (guess[i] === answer[i]) marks[i] = "correct"
    else pool[answer[i]] = (pool[answer[i]] || 0) + 1
  }
  for (let i = 0; i < LEN; i++) {
    if (marks[i] === "correct") continue
    if (pool[guess[i]] > 0) {
      marks[i] = "present"
      pool[guess[i]] -= 1
    }
  }
  return marks
}

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]

export default function WordleGame({ themeColor = "#15803d" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won" | "lost">("menu")
  const [answer, setAnswer] = useState("")
  const [guesses, setGuesses] = useState<string[]>([])
  const [current, setCurrent] = useState("")
  const [message, setMessage] = useState("")
  const [stats, setStats] = useState({ played: 0, won: 0, streak: 0 })

  const start = useCallback(() => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)])
    setGuesses([])
    setCurrent("")
    setMessage("")
    setPhase("playing")
  }, [])

  const submit = useCallback(() => {
    if (phase !== "playing") return
    if (current.length !== LEN) {
      setMessage("Needs 5 letters")
      setTimeout(() => setMessage(""), 1200)
      return
    }

    const next = [...guesses, current]
    setGuesses(next)
    setCurrent("")

    if (current === answer) {
      setPhase("won")
      setStats((s) => ({ played: s.played + 1, won: s.won + 1, streak: s.streak + 1 }))
    } else if (next.length >= ROWS) {
      setPhase("lost")
      setStats((s) => ({ played: s.played + 1, won: s.won, streak: 0 }))
    }
  }, [phase, current, guesses, answer])

  const typeLetter = useCallback(
    (letter: string) => {
      if (phase !== "playing") return
      setCurrent((c) => (c.length < LEN ? c + letter : c))
    },
    [phase]
  )

  const backspace = useCallback(() => {
    if (phase !== "playing") return
    setCurrent((c) => c.slice(0, -1))
  }, [phase])

  useEffect(() => {
    if (phase !== "playing") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit()
      else if (e.key === "Backspace") backspace()
      else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toLowerCase())
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, submit, backspace, typeLetter])

  // Best-known status per letter, for colouring the on-screen keyboard.
  const keyMarks: Record<string, Mark> = {}
  guesses.forEach((g) => {
    scoreGuess(g, answer).forEach((m, i) => {
      const prev = keyMarks[g[i]]
      if (m === "correct" || (m === "present" && prev !== "correct") || !prev) keyMarks[g[i]] = m
    })
  })

  const markStyle = (m: Mark | undefined) => {
    if (m === "correct") return { backgroundColor: themeColor, color: "#fff", borderColor: themeColor }
    if (m === "present") return { backgroundColor: "#eab308", color: "#fff", borderColor: "#eab308" }
    if (m === "absent") return { backgroundColor: "#6b7280", color: "#fff", borderColor: "#6b7280" }
    return {}
  }

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md my-auto py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl">🟩</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Word Guess</h2>
          <p className="text-muted-foreground mb-2">
            Six tries to find the five-letter word. Green means right spot, yellow means wrong spot.
          </p>
          {stats.played > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              {stats.won}/{stats.played} solved · streak {stats.streak}
            </p>
          )}
          <Button onClick={start} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="py-4 w-full max-w-sm my-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">
              Guess {Math.min(guesses.length + 1, ROWS)} of {ROWS}
            </span>
            <Button variant="ghost" size="sm" onClick={start}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>

          <div className="grid gap-1.5 mb-4">
            {Array.from({ length: ROWS }, (_, r) => {
              const guess = guesses[r]
              const marks = guess ? scoreGuess(guess, answer) : null
              const text = guess ?? (r === guesses.length ? current : "")
              return (
                <div key={r} className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: LEN }, (_, c) => (
                    <div
                      key={c}
                      className="aspect-square rounded-md border-2 flex items-center justify-center text-xl font-bold uppercase transition-colors"
                      style={marks ? markStyle(marks[c]) : { borderColor: text[c] ? "#9ca3af" : "#d1d5db" }}
                    >
                      {text[c] ?? ""}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="text-center text-sm font-medium mb-3 h-5">
            {message ||
              (phase === "won"
                ? "Solved it!"
                : phase === "lost"
                  ? `The word was ${answer.toUpperCase()}`
                  : "")}
          </div>

          {phase === "playing" && (
            <div className="space-y-1.5">
              {KEY_ROWS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1">
                  {i === 2 && (
                    <button onClick={submit} className="px-2.5 rounded text-xs font-semibold border bg-muted hover:bg-accent">
                      ENTER
                    </button>
                  )}
                  {row.split("").map((k) => (
                    <button
                      key={k}
                      onClick={() => typeLetter(k)}
                      className="w-8 h-10 rounded text-sm font-semibold border uppercase bg-muted hover:bg-accent transition-colors"
                      style={markStyle(keyMarks[k])}
                    >
                      {k}
                    </button>
                  ))}
                  {i === 2 && (
                    <button onClick={backspace} className="px-2.5 rounded border bg-muted hover:bg-accent flex items-center">
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {(phase === "won" || phase === "lost") && (
            <div className="text-center">
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
