"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, RotateCcw } from "lucide-react"

const WORDS = ["javascript","typescript","python","react","angular","vue","svelte","nextjs","nodejs","express","mongodb","postgresql","redis","docker","kubernetes","algorithm","function","variable","component","interface","database","framework","developer","frontend","backend"]

export default function HangmanGame({ themeColor = "#8b5cf6" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "won" | "lost">("menu")
  const [word, setWord] = useState("")
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const maxWrong = 6

  const startGame = useCallback(() => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)]
    setWord(w); setGuessed(new Set()); setWrongGuesses(0); setPhase("playing")
  }, [])

  const guess = useCallback((letter: string) => {
    if (phase !== "playing" || guessed.has(letter)) return
    const g = new Set(guessed); g.add(letter); setGuessed(g)
    if (!word.includes(letter)) {
      const w = wrongGuesses + 1
      setWrongGuesses(w)
      if (w >= maxWrong) {
        setPhase("lost")
        const newScore = score - 1
        setScore(Math.max(0, newScore))
      }
    } else {
      const won = [...word].every(l => g.has(l))
      if (won) {
        setPhase("won")
        const newScore = score + 10 - wrongGuesses
        setScore(newScore)
        if (newScore > bestScore) setBestScore(newScore)
      }
    }
  }, [phase, guessed, word, wrongGuesses, score, bestScore])

  const displayWord = [...word].map(l => guessed.has(l) ? l : "_").join(" ")

  const hangmanParts = [
    <line key="1" x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="2"/>,
    <line key="2" x1="140" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="2"/>,
    <line key="3" x1="60" y1="20" x2="60" y2="230" stroke="currentColor" strokeWidth="2"/>,
    <line key="4" x1="20" y1="230" x2="100" y2="230" stroke="currentColor" strokeWidth="2"/>,
    <circle key="5" cx="140" cy="70" r="20" stroke="currentColor" strokeWidth="2" fill="none"/>,
    <line key="6" x1="140" y1="90" x2="140" y2="150" stroke="currentColor" strokeWidth="2"/>,
    <line key="7" x1="140" y1="100" x2="120" y2="130" stroke="currentColor" strokeWidth="2"/>,
    <line key="8" x1="140" y1="100" x2="160" y2="130" stroke="currentColor" strokeWidth="2"/>,
    <line key="9" x1="140" y1="150" x2="120" y2="190" stroke="currentColor" strokeWidth="2"/>,
    <line key="10" x1="140" y1="150" x2="160" y2="190" stroke="currentColor" strokeWidth="2"/>,
  ]

  const keyboard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

  return (
    <div className="flex flex-col items-center min-h-[550px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <span className="text-3xl text-white font-bold">H</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Hangman</h2>
          <p className="text-muted-foreground mb-4">Guess the word before the stickman hangs!</p>
          {bestScore > 0 && <p className="text-sm text-muted-foreground mb-6">Best Score: {bestScore}</p>}
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg"><Play className="w-5 h-5 mr-2" />Start Game</Button>
        </div>
      )}

      {phase !== "menu" && (
        <div className="w-full max-w-md py-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">Score: {score}</span>
            <Button variant="ghost" size="sm" onClick={startGame}><RotateCcw className="w-3.5 h-3.5 mr-1" />New</Button>
          </div>
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 200 250" className="w-40 h-50 stroke-gray-700 dark:stroke-gray-300">{hangmanParts.slice(0, wrongGuesses)}</svg>
          </div>
          <div className="text-center mb-6">
            <span className="text-3xl font-mono tracking-widest font-bold">{displayWord}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {keyboard.map(l => (
              <button key={l} onClick={() => guess(l.toLowerCase())}
                disabled={guessed.has(l.toLowerCase()) || phase === "won" || phase === "lost"}
                className={`py-1.5 rounded text-xs font-semibold border transition-colors ${
                  guessed.has(l.toLowerCase())
                    ? word.includes(l.toLowerCase()) ? "bg-green-100 border-green-300 text-green-700" : "bg-red-50 border-red-200 text-red-400"
                    : "bg-white dark:bg-gray-800 border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >{l}</button>
            ))}
          </div>
          {(phase === "won" || phase === "lost") && (
            <div className="text-center mt-6">
              <div className={`text-lg font-bold mb-2 ${phase === "won" ? "text-green-500" : "text-red-500"}`}>
                {phase === "won" ? "You saved them!" : `The word was: ${word}`}
              </div>
              <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="sm"><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
