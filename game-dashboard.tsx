"use client"

import { useState, lazy, Suspense } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Play,
  Triangle,
  PawPrint,
  Grid3X3,
  Gamepad2,
  Timer,
  Zap,
  Target,
  Square,
  Palette,
  Rocket,
  Brain,
  Bomb,
  BookOpen,
  Sparkles,
  Coins,
  Circle,
} from "lucide-react"

const VirtualGamepad = dynamic(() => import("@/components/virtual-gamepad"), { ssr: false })

const FlappyTriangle = lazy(() => import("@/components/games/flappy-triangle"))
const DinoGame = lazy(() => import("@/components/games/dino-game"))
const SnakeGame = lazy(() => import("@/components/games/snake-game"))
const PongGame = lazy(() => import("@/components/games/pong-game"))
const ReactionGame = lazy(() => import("@/components/games/reaction-game"))
const TetrisGame = lazy(() => import("@/components/games/tetris-game"))
const BreakoutGame = lazy(() => import("@/components/games/breakout-game"))
const OrbitDefense = lazy(() => import("@/components/games/orbit-defense"))
const ColorMatchGame = lazy(() => import("@/components/games/color-match-game"))
const SpaceInvadersGame = lazy(() => import("@/components/games/space-invaders-game"))
const TicTacToeGame = lazy(() => import("@/components/games/tic-tac-toe-game"))
const MemoryMatchGame = lazy(() => import("@/components/games/memory-match-game"))
const MinesweeperGame = lazy(() => import("@/components/games/minesweeper-game"))
const WordScrambleGame = lazy(() => import("@/components/games/word-scramble-game"))
const BubblePopGame = lazy(() => import("@/components/games/bubble-pop-game"))
const CoinCollectorGame = lazy(() => import("@/components/games/coin-collector-game"))
const ConnectFourGame = lazy(() => import("@/components/games/connect-four-game"))
const WhackAMoleGame = lazy(() => import("@/components/games/whack-a-mole-game"))
const SimonSaysGame = lazy(() => import("@/components/games/simon-says-game"))
const Puzzle2048Game = lazy(() => import("@/components/games/puzzle-2048-game"))

type GameType =
  | "menu"
  | "2048"
  | "simon-says"
  | "whack-a-mole"
  | "coin-collector"
  | "bubble-pop"
  | "word-scramble"
  | "flappy"
  | "dino"
  | "snake"
  | "pong"
  | "reaction"
  | "tetris"
  | "breakout"
  | "orbit-defense"
  | "color-match"
  | "space-invaders"
  | "tic-tac-toe"
  | "memory-match"
  | "minesweeper"
  | "connect-four"

type Category = "All" | "Arcade" | "Puzzle" | "Strategy" | "Action"

export default function GameDashboard() {
  const [currentGame, setCurrentGame] = useState<GameType>("menu")
  const [selectedCategory, setSelectedCategory] = useState<Category>("All")

  const games = [
    {
      id: "2048" as const,
      title: "2048",
      description: "Slide numbered tiles to reach 2048 - addictive puzzle challenge!",
      icon: Grid3X3,
      color: "bg-amber-500",
      themeColor: "#f59e0b",
      category: "Puzzle" as const,
      isNew: true,
    },
    {
      id: "simon-says" as const,
      title: "Simon Says",
      description: "Watch the pattern and repeat it back - test your memory!",
      icon: Brain,
      color: "bg-purple-600",
      themeColor: "#9333ea",
      category: "Action" as const,
      isNew: true,
    },
    {
      id: "whack-a-mole" as const,
      title: "Whack-a-Mole",
      description: "Quick reflexes needed - whack the moles before they hide!",
      icon: Target,
      color: "bg-green-500",
      themeColor: "#22c55e",
      category: "Action" as const,
      isNew: true,
    },
    {
      id: "connect-four" as const,
      title: "Connect Four",
      description: "Drop pieces to get four in a row - play vs friends or CPU",
      icon: Circle,
      color: "bg-red-500",
      themeColor: "#ef4444",
      category: "Strategy" as const,
      isNew: true,
    },
    {
      id: "word-scramble" as const,
      title: "Word Scramble",
      description: "Unscramble letters to form words quickly",
      icon: BookOpen,
      color: "bg-purple-500",
      themeColor: "#8b5cf6",
      category: "Puzzle" as const,
      isNew: true,
    },
    {
      id: "memory-match" as const,
      title: "Memory Match",
      description: "Match pairs of cards with memory",
      icon: Brain,
      color: "bg-pink-500",
      themeColor: "#ec4899",
      category: "Puzzle" as const,
    },
    {
      id: "coin-collector" as const,
      title: "Coin Collector",
      description: "Jump and collect coins in this platformer adventure",
      icon: Coins,
      color: "bg-yellow-500",
      themeColor: "#f59e0b",
      category: "Arcade" as const,
    },
    {
      id: "bubble-pop" as const,
      title: "Bubble Pop",
      description: "Pop colorful bubbles and build combos",
      icon: Sparkles,
      color: "bg-cyan-500",
      themeColor: "#4ecdc4",
      category: "Arcade" as const,
    },
    {
      id: "minesweeper" as const,
      title: "Minesweeper",
      description: "Clear the board without hitting mines",
      icon: Bomb,
      color: "bg-gray-700",
      themeColor: "#374151",
      category: "Strategy" as const,
    },
    {
      id: "flappy" as const,
      title: "Triangle",
      description: "Navigate through obstacles with precise timing.",
      icon: Triangle,
      color: "bg-yellow-500",
      themeColor: "#f59e0b",
      category: "Arcade" as const,
    },
    {
      id: "dino" as const,
      title: "Sheep Run",
      description: "Jump over cacti and dodge flying birds.",
      icon: PawPrint,
      color: "bg-gray-700",
      themeColor: "#374151",
      category: "Arcade" as const,
    },
    {
      id: "snake" as const,
      title: "Snake",
      description: "A modern, minimalistic take on the classic.",
      icon: Grid3X3,
      color: "bg-green-500",
      themeColor: "#22c55e",
      category: "Arcade" as const,
    },
    {
      id: "pong" as const,
      title: "Pong",
      description: "The timeless arcade classic. Play against an AI.",
      icon: Gamepad2,
      color: "bg-blue-500",
      themeColor: "#3b82f6",
      category: "Arcade" as const,
    },
    {
      id: "reaction" as const,
      title: "Reaction Time",
      description: "Test your reflexes. How fast can you click?",
      icon: Timer,
      color: "bg-red-500",
      themeColor: "#ef4444",
      category: "Action" as const,
    },
    {
      id: "tetris" as const,
      title: "Tetris",
      description: "Stack falling blocks to clear lines and score high.",
      icon: Square,
      color: "bg-purple-500",
      themeColor: "#a855f7",
      category: "Puzzle" as const,
    },
    {
      id: "breakout" as const,
      title: "Breakout",
      description: "Break all the bricks with your ball and paddle.",
      icon: Zap,
      color: "bg-orange-500",
      themeColor: "#f97316",
      category: "Arcade" as const,
    },
    {
      id: "orbit-defense" as const,
      title: "Orbit Defense",
      description: "Strategic tower defense in the vastness of space.",
      icon: Target,
      color: "bg-indigo-500",
      themeColor: "#6366f1",
      category: "Strategy" as const,
    },
    {
      id: "color-match" as const,
      title: "Color Match",
      description: "Match the target color as fast as you can!",
      icon: Palette,
      color: "bg-pink-500",
      themeColor: "#ec4899",
      category: "Action" as const,
    },
    {
      id: "space-invaders" as const,
      title: "Space Invaders",
      description: "Defend Earth from waves of alien invaders in this classic arcade shooter.",
      icon: Rocket,
      color: "bg-cyan-500",
      themeColor: "#06b6d4",
      category: "Action" as const,
    },
    {
      id: "tic-tac-toe" as const,
      title: "Tic Tac Toe",
      description: "Classic strategy game - get three in a row to win!",
      icon: Grid3X3,
      color: "bg-emerald-500",
      themeColor: "#10b981",
      category: "Strategy" as const,
    },
  ]

  const categories: Category[] = ["All", "Arcade", "Puzzle", "Strategy", "Action"]

  const filteredGames = selectedCategory === "All" ? games : games.filter((game) => game.category === selectedCategory)

  const renderGame = () => {
    const gameData = games.find((g) => g.id === currentGame)
    const commonProps = {
      onBack: () => setCurrentGame("menu"),
      themeColor: gameData ? gameData.themeColor : "#000000",
    }
    switch (currentGame) {
      case "2048":
        return <Puzzle2048Game {...commonProps} />
      case "simon-says":
        return <SimonSaysGame {...commonProps} />
      case "whack-a-mole":
        return <WhackAMoleGame {...commonProps} />
      case "coin-collector":
        return <CoinCollectorGame {...commonProps} />
      case "bubble-pop":
        return <BubblePopGame {...commonProps} />
      case "word-scramble":
        return <WordScrambleGame {...commonProps} />
      case "connect-four":
        return <ConnectFourGame {...commonProps} />
      case "memory-match":
        return <MemoryMatchGame {...commonProps} />
      case "minesweeper":
        return <MinesweeperGame {...commonProps} />
      case "flappy":
        return <FlappyTriangle {...commonProps} />
      case "dino":
        return <DinoGame {...commonProps} />
      case "snake":
        return <SnakeGame {...commonProps} />
      case "pong":
        return <PongGame {...commonProps} />
      case "reaction":
        return <ReactionGame {...commonProps} />
      case "tetris":
        return <TetrisGame {...commonProps} />
      case "breakout":
        return <BreakoutGame {...commonProps} />
      case "orbit-defense":
        return <OrbitDefense {...commonProps} />
      case "color-match":
        return <ColorMatchGame {...commonProps} />
      case "space-invaders":
        return <SpaceInvadersGame {...commonProps} />
      case "tic-tac-toe":
        return <TicTacToeGame {...commonProps} />
      default:
        return null
    }
  }

  if (currentGame !== "menu") {
    return (
      <div className="relative w-full min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-b flex items-center">
          <Button
            onClick={() => setCurrentGame("menu")}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-100 text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>
        <div className="w-full flex-1 flex flex-col items-center justify-start pb-40 pt-4">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Loading game assets...</p>
              </div>
            }
          >
            {renderGame()}
          </Suspense>
        </div>
        <VirtualGamepad />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-gray-500 mb-4">
            Crafted on v0.dev by{" "}
            <a
              href="https://x.com/shribuilds"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline underline-offset-2"
            >
              shrix1
            </a>
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">v0 Mini Game Arcade</h1>
          <p className="text-gray-600 text-lg">A collection of simple games build with v0.dev</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                selectedCategory === category
                  ? "bg-black text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <Card
              key={game.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer bg-white hover:shadow-lg"
              onClick={() => setCurrentGame(game.id)}
            >
              {game.isNew && (
                <div className="absolute top-3 right-3 bg-black text-white text-xs font-medium px-2 py-1 rounded-full z-10">
                  NEW
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${game.color} text-white`}>
                    <game.icon className="w-5 h-5" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Play className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-semibold text-black">{game.title}</CardTitle>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{game.category}</span>
                  </div>
                  <CardDescription className="text-gray-600 text-sm leading-relaxed">
                    {game.description}
                  </CardDescription>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
