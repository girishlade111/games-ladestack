"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, RotateCcw, Check, X, Timer, Trophy } from "lucide-react"

type Question = {
  question: string
  options: string[]
  correctIndex: number
  category: string
  difficulty: "easy" | "medium" | "hard"
}

const QUESTIONS: Question[] = [
  { question: "What is the largest planet in our solar system?", options: ["Earth", "Jupiter", "Saturn", "Mars"], correctIndex: 1, category: "Science", difficulty: "easy" },
  { question: "Which element has the chemical symbol 'O'?", options: ["Osmium", "Oxygen", "Gold", "Iron"], correctIndex: 1, category: "Science", difficulty: "easy" },
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctIndex: 2, category: "Geography", difficulty: "easy" },
  { question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], correctIndex: 2, category: "Art", difficulty: "easy" },
  { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctIndex: 2, category: "History", difficulty: "medium" },
  { question: "What is the square root of 144?", options: ["10", "11", "12", "14"], correctIndex: 2, category: "Math", difficulty: "easy" },
  { question: "Which programming language was created by Guido van Rossum?", options: ["Java", "Python", "C++", "JavaScript"], correctIndex: 1, category: "Technology", difficulty: "easy" },
  { question: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Eagle", "Horse"], correctIndex: 1, category: "Nature", difficulty: "easy" },
  { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctIndex: 2, category: "Geography", difficulty: "easy" },
  { question: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transport Platform", "Home Tool Transfer Protocol"], correctIndex: 0, category: "Technology", difficulty: "easy" },
  { question: "Which country has the most people?", options: ["USA", "China", "India", "Russia"], correctIndex: 2, category: "Geography", difficulty: "medium" },
  { question: "What is the chemical formula for water?", options: ["CO2", "H2O", "NaCl", "O2"], correctIndex: 1, category: "Science", difficulty: "easy" },
  { question: "Who wrote Romeo and Juliet?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correctIndex: 1, category: "Literature", difficulty: "easy" },
  { question: "What is the speed of light approximately?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], correctIndex: 0, category: "Science", difficulty: "medium" },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], correctIndex: 1, category: "Science", difficulty: "easy" },
  { question: "What is the currency of Japan?", options: ["Won", "Yuan", "Yen", "Ringgit"], correctIndex: 2, category: "Geography", difficulty: "easy" },
  { question: "In what year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], correctIndex: 1, category: "History", difficulty: "medium" },
  { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Membrane"], correctIndex: 2, category: "Science", difficulty: "easy" },
  { question: "Which sport is played at Wimbledon?", options: ["Cricket", "Tennis", "Golf", "Soccer"], correctIndex: 1, category: "Sports", difficulty: "easy" },
  { question: "What is the main component of the Sun?", options: ["Oxygen", "Carbon", "Hydrogen", "Helium"], correctIndex: 2, category: "Science", difficulty: "medium" },
  { question: "Who discovered penicillin?", options: ["Marie Curie", "Alexander Fleming", "Louis Pasteur", "Isaac Newton"], correctIndex: 1, category: "Science", difficulty: "medium" },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3, category: "Geography", difficulty: "easy" },
  { question: "How many bits are in a byte?", options: ["4", "8", "16", "32"], correctIndex: 1, category: "Technology", difficulty: "easy" },
  { question: "Which country is home to the kangaroo?", options: ["New Zealand", "Australia", "South Africa", "Brazil"], correctIndex: 1, category: "Geography", difficulty: "easy" },
  { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Quartz"], correctIndex: 2, category: "Science", difficulty: "easy" },
  { question: "Who was the first person to walk on the moon?", options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], correctIndex: 1, category: "History", difficulty: "medium" },
  { question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], correctIndex: 0, category: "Technology", difficulty: "easy" },
  { question: "Which musical instrument has 88 keys?", options: ["Guitar", "Violin", "Piano", "Drums"], correctIndex: 2, category: "Music", difficulty: "easy" },
  { question: "What is the boiling point of water in Celsius?", options: ["90°C", "100°C", "110°C", "120°C"], correctIndex: 1, category: "Science", difficulty: "easy" },
  { question: "How many players are on a soccer team?", options: ["9", "10", "11", "12"], correctIndex: 2, category: "Sports", difficulty: "easy" },
]

const TIME_PER_QUESTION = 15

export default function TriviaQuizGame({ themeColor = "#f43f5e" }: { onBack?: () => void; themeColor?: string }) {
  const [phase, setPhase] = useState<"menu" | "playing" | "finished">("menu")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<{ correct: boolean; timeLeft: number }[]>([])
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
  const [streak, setStreak] = useState(0)
  const [bestScore, setBestScore] = useState(0)

  const startGame = useCallback(() => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
    setQuestions(shuffled)
    setCurrentQuestion(0)
    setScore(0)
    setAnswers([])
    setSelectedAnswer(null)
    setTimeLeft(TIME_PER_QUESTION)
    setStreak(0)
    setPhase("playing")
  }, [])

  const handleAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(optionIndex)
    const correct = optionIndex === questions[currentQuestion].correctIndex
    const timeBonus = Math.floor(timeLeft / 3)
    const points = correct ? 100 + timeBonus : 0
    if (correct) {
      setScore((s) => s + points)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
    setAnswers((a) => [...a, { correct, timeLeft }])

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((c) => c + 1)
        setSelectedAnswer(null)
        setTimeLeft(TIME_PER_QUESTION)
      } else {
        const finalScore = score + points
        const best = parseInt(localStorage.getItem("trivia-best") || "0")
        if (finalScore > best) {
          localStorage.setItem("trivia-best", finalScore.toString())
          setBestScore(finalScore)
        } else {
          setBestScore(best)
        }
        setPhase("finished")
      }
    }, 1500)
  }

  const handleTimeout = useCallback(() => {
    if (selectedAnswer !== null) return
    handleAnswer(-1)
  }, [selectedAnswer, currentQuestion, questions])

  const getGrade = (s: number) => {
    const max = questions.length * 110
    const pct = (s / max) * 100
    if (pct >= 90) return { label: "Genius", color: "text-yellow-500" }
    if (pct >= 70) return { label: "Expert", color: "text-emerald-500" }
    if (pct >= 50) return { label: "Good", color: "text-blue-500" }
    return { label: "Keep Learning", color: "text-muted-foreground" }
  }

  const q = questions[currentQuestion]

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-4">
      {phase === "menu" && (
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Trivia Quiz</h2>
          <p className="text-muted-foreground mb-4">Test your knowledge across multiple categories</p>
          <div className="text-sm text-muted-foreground mb-4 space-y-1">
            <p>10 questions per round</p>
            <p>15 seconds per question</p>
            <p>Bonus points for fast answers</p>
          </div>
          {bestScore > 0 && <p className="text-sm font-medium mb-4" style={{ color: themeColor }}>Best Score: {bestScore}</p>}
          <Button onClick={startGame} style={{ backgroundColor: themeColor }} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Start Quiz
          </Button>
        </div>
      )}

      {phase === "playing" && q && (
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentQuestion + 1}/{questions.length}
              </span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{q.category}</span>
            </div>
            <div className="flex items-center gap-4">
              {streak >= 3 && (
                <span className="text-xs text-yellow-500 font-medium flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {streak}x Streak!
                </span>
              )}
              <span className="text-sm font-bold text-muted-foreground">Score: {score}</span>
            </div>
          </div>

          <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(timeLeft / TIME_PER_QUESTION) * 100}%`,
                backgroundColor: timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : themeColor,
              }}
            />
          </div>

          <Card className="p-6 mb-4">
            <h3 className="text-lg font-semibold mb-6">{q.question}</h3>
            <div className="space-y-3">
              {q.options.map((option, i) => {
                let variant: "outline" | "default" | "ghost" = "outline"
                let className = ""
                if (selectedAnswer !== null) {
                  if (i === q.correctIndex) {
                    variant = "default"
                    className = "bg-emerald-500 hover:bg-emerald-500 text-white border-emerald-500"
                  } else if (i === selectedAnswer && selectedAnswer !== q.correctIndex) {
                    variant = "default"
                    className = "bg-red-500 hover:bg-red-500 text-white border-red-500"
                  }
                }
                return (
                  <Button
                    key={i}
                    variant={variant}
                    className={`w-full justify-start text-left h-auto py-3 px-4 ${className}`}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold mr-3 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </Button>
                )
              })}
            </div>
          </Card>

          <div className="flex justify-center">
            <div className="flex items-center gap-1">
              {Array.from({ length: questions.length }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < currentQuestion
                      ? answers[i]?.correct
                        ? "bg-emerald-500"
                        : "bg-red-500"
                      : i === currentQuestion
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "finished" && (
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: themeColor }}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <div className={`text-lg font-bold mb-2 ${getGrade(score).color}`}>
            {getGrade(score).label}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold" style={{ color: themeColor }}>{score}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-emerald-500">
                {answers.filter((a) => a.correct).length}/{answers.length}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </Card>
          </div>

          <div className="mb-6 space-y-1 text-sm">
            {answers.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                {a.correct ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
                <span className="text-muted-foreground">Question {i + 1}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={startGame} style={{ backgroundColor: themeColor }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
