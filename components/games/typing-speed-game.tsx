"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, RotateCcw, Timer, Zap } from "lucide-react"

const WORD_SETS = {
  easy: [
    "the quick brown fox jumps over the lazy dog",
    "all good things must come to an end",
    "early bird catches the worm but the second mouse gets the cheese",
    "practice makes perfect so keep typing every day",
    "the sun rises in the east and sets in the west",
    "a journey of a thousand miles begins with a single step",
    "knowledge is power and learning never stops",
    "every cloud has a silver lining so stay positive",
    "music is the universal language of mankind",
    "reading is to the mind what exercise is to the body",
  ],
  medium: [
    "programming is the art of telling a computer what to do",
    "the complexity of the algorithm depends on the size of the input",
    "debugging is twice as hard as writing the code in the first place",
    "success is not final failure is not fatal it is the courage to continue",
    "technology is best when it brings people together",
    "the best way to predict the future is to invent it yourself",
    "innovation distinguishes between a leader and a follower",
    "simplicity is the ultimate sophistication in software development",
    "great things in business are never done by one person",
    "design is not just what it looks like it is how it works",
  ],
  hard: [
    "extraordinary claims require extraordinary evidence and rigorous scientific scrutiny",
    "the incomprehensible magnitude of the universe humbles our terrestrial ambitions",
    "synchronization of distributed systems requires careful consideration of consensus algorithms",
    "philosophical quandaries about consciousness persist despite neurological advancement",
    "cryptographic protocols ensure confidentiality integrity and authenticity simultaneously",
    "the juxtaposition of classical and quantum mechanics remains philosophically perplexing",
    "existential contemplation frequently accompanies the recognition of cosmic insignificance",
    "sophisticated neural architectures approximate universal function approximation theorems",
    "thermodynamic entropy inexorably increases toward maximum equilibrium",
    "psycholinguistic phenomena demonstrate the extraordinary plasticity of neural cognition",
  ],
}

const DIFFICULTY_TIMES = { easy: 60, medium: 45, hard: 30 }

export default function TypingSpeedGame({ themeColor = "#8b5cf6" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "finished">("menu")
  const [difficulty, setDifficulty] = useState<keyof typeof WORD_SETS>("easy")
  const [timeLeft, setTimeLeft] = useState(DIFFICULTY_TIMES.easy)
  const [currentText, setCurrentText] = useState("")
  const [input, setInput] = useState("")
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [correctChars, setCorrectChars] = useState(0)
  const [totalKeystrokes, setTotalKeystrokes] = useState(0)
  const [results, setResults] = useState<{ wpm: number; accuracy: number; chars: number }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const generateText = useCallback((diff: keyof typeof WORD_SETS) => {
    const texts = WORD_SETS[diff]
    return texts[Math.floor(Math.random() * texts.length)]
  }, [])

  const startGame = useCallback((diff: keyof typeof WORD_SETS) => {
    setDifficulty(diff)
    setCurrentText(generateText(diff))
    setInput("")
    setTimeLeft(DIFFICULTY_TIMES[diff])
    setWpm(0)
    setAccuracy(100)
    setCorrectChars(0)
    setTotalKeystrokes(0)
    setPhase("playing")
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [generateText])

  useEffect(() => {
    if (phase !== "playing") return
    if (timeLeft <= 0) {
      const finalWpm = Math.round((correctChars / 5) / (DIFFICULTY_TIMES[difficulty] / 60))
      setWpm(finalWpm)
      setResults((prev) => [{ wpm: finalWpm, accuracy, chars: correctChars }, ...prev].slice(0, 5))
      setPhase("finished")
      return
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [phase, timeLeft, correctChars, accuracy, difficulty])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const prevLen = input.length
    setInput(val)

    if (val.length > prevLen) {
      const newChars = val.length
      setTotalKeystrokes((k) => k + (val.length - prevLen))
      const newCorrect = val.split("").filter((c, i) => c === currentText[i]).length
      setCorrectChars(newCorrect)
      const totalKeystrokesNow = totalKeystrokes + (val.length - prevLen)
      setAccuracy(totalKeystrokesNow > 0 ? Math.round((newCorrect / totalKeystrokesNow) * 100) : 100)
      setWpm(Math.round((newCorrect / 5) / ((DIFFICULTY_TIMES[difficulty] - timeLeft + 1) / 60)))

      if (val.length >= currentText.length) {
        const finalWpm = Math.round((newCorrect / 5) / ((DIFFICULTY_TIMES[difficulty] - timeLeft) / 60))
        const finalAcc = Math.round((newCorrect / (totalKeystrokesNow || 1)) * 100)
        setWpm(finalWpm)
        setAccuracy(finalAcc)
        setResults((prev) => [{ wpm: finalWpm, accuracy: finalAcc, chars: newCorrect }, ...prev].slice(0, 5))
        setPhase("finished")
      }
    }
  }

  const getWpmGrade = (w: number) => {
    if (w >= 80) return { label: "Expert", color: "text-emerald-500" }
    if (w >= 60) return { label: "Pro", color: "text-blue-500" }
    if (w >= 40) return { label: "Good", color: "text-amber-500" }
    if (w >= 20) return { label: "Beginner", color: "text-orange-500" }
    return { label: "Newbie", color: "text-red-500" }
  }

  const progress = currentText ? (input.length / currentText.length) * 100 : 0

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            <KeyboardIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Typing Speed Test</h2>
          <p className="text-muted-foreground mb-8">Choose your difficulty and test your typing skills</p>
          <div className="space-y-3">
            {(["easy", "medium", "hard"] as const).map((diff) => (
              <Card
                key={diff}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => startGame(diff)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-semibold capitalize">{diff}</div>
                    <div className="text-sm text-muted-foreground">{DIFFICULTY_TIMES[diff]}s limit</div>
                  </div>
                  <Play className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {phase === "playing" && (
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5" style={{ color: themeColor }} />
              <span className={`text-2xl font-bold ${timeLeft <= 10 ? "text-red-500" : ""}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">WPM: </span>
                <span className="font-bold">{wpm}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Acc: </span>
                <span className="font-bold">{accuracy}%</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-6 mb-4 min-h-[80px]">
            <p className="text-lg leading-relaxed">
              {currentText.split("").map((char, i) => {
                let color = "text-muted-foreground"
                if (i < input.length) {
                  color = input[i] === char ? "text-green-500" : "text-red-500 bg-red-500/10"
                }
                if (i === input.length) {
                  color = "text-primary bg-primary/20 rounded-sm"
                }
                return (
                  <span key={i} className={color}>
                    {char}
                  </span>
                )
              })}
            </p>
          </div>

          <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%`, backgroundColor: themeColor }}
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            className="w-full p-4 rounded-lg border bg-background text-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Start typing..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
      )}

      {phase === "finished" && (
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            <TrophyIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Test Complete!</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-3xl font-bold" style={{ color: themeColor }}>{wpm}</div>
              <div className="text-sm text-muted-foreground">WPM</div>
              <div className={`text-xs mt-1 font-medium ${getWpmGrade(wpm).color}`}>{getWpmGrade(wpm).label}</div>
            </Card>
            <Card className="p-4">
              <div className="text-3xl font-bold" style={{ color: themeColor }}>{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
          </div>

          {results.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Recent Results</h3>
              {results.slice(0, 3).map((r, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-muted-foreground">#{i + 1}</span>
                  <span>{r.wpm} WPM</span>
                  <span>{r.accuracy}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={() => startGame(difficulty)} style={{ backgroundColor: themeColor }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => setPhase("menu")}>
              Change Difficulty
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button variant="ghost" onClick={() => setPhase("menu")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Menu
        </Button>
      </div>
    </div>
  )
}

function KeyboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" />
      <path d="M6 11h2v2H6zM10 11h2v2h-2zM14 11h2v2h-2zM18 11h2v2h-2zM7 14h10" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5A2.5 2.5 0 012 6.5v-.5A2 2 0 014 4h2M18 9h1.5A2.5 2.5 0 0022 6.5V6a2 2 0 00-2-2h-2" />
      <path d="M6 4h12v8a6 6 0 01-12 0V4z" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  )
}
