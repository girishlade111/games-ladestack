import { lazy, type ComponentType } from "react"
import type { GameProps } from "./types"

const SnakeGame = lazy(() => import("@/components/games/snake-game"))
const TetrisGame = lazy(() => import("@/components/games/tetris-game"))
const PongGame = lazy(() => import("@/components/games/pong-game"))
const FlappyTriangle = lazy(() => import("@/components/games/flappy-triangle"))
const DinoGame = lazy(() => import("@/components/games/dino-game"))
const BreakoutGame = lazy(() => import("@/components/games/breakout-game"))
const ReactionGame = lazy(() => import("@/components/games/reaction-game"))
const ColorMatchGame = lazy(() => import("@/components/games/color-match-game"))
const SpaceInvadersGame = lazy(() => import("@/components/games/space-invaders-game"))
const SimonSaysGame = lazy(() => import("@/components/games/simon-says-game"))
const WhackAMoleGame = lazy(() => import("@/components/games/whack-a-mole-game"))
const Puzzle2048Game = lazy(() => import("@/components/games/puzzle-2048-game"))
const MemoryMatchGame = lazy(() => import("@/components/games/memory-match-game"))
const WordScrambleGame = lazy(() => import("@/components/games/word-scramble-game"))
const MinesweeperGame = lazy(() => import("@/components/games/minesweeper-game"))
const TicTacToeGame = lazy(() => import("@/components/games/tic-tac-toe-game"))
const ConnectFourGame = lazy(() => import("@/components/games/connect-four-game"))
const OrbitDefense = lazy(() => import("@/components/games/orbit-defense"))
const CoinCollectorGame = lazy(() => import("@/components/games/coin-collector-game"))
const BubblePopGame = lazy(() => import("@/components/games/bubble-pop-game"))
const TypingSpeedGame = lazy(() => import("@/components/games/typing-speed-game"))
const SudokuGame = lazy(() => import("@/components/games/sudoku-game"))
const PacmanGame = lazy(() => import("@/components/games/pacman-game"))
const SolitaireGame = lazy(() => import("@/components/games/solitaire-game"))
const TriviaQuizGame = lazy(() => import("@/components/games/trivia-quiz-game"))

const gameComponentMap: Record<string, ComponentType<GameProps>> = {
  snake: SnakeGame as unknown as ComponentType<GameProps>,
  tetris: TetrisGame as unknown as ComponentType<GameProps>,
  pong: PongGame as unknown as ComponentType<GameProps>,
  flappy: FlappyTriangle as unknown as ComponentType<GameProps>,
  dino: DinoGame as unknown as ComponentType<GameProps>,
  breakout: BreakoutGame as unknown as ComponentType<GameProps>,
  reaction: ReactionGame as unknown as ComponentType<GameProps>,
  "color-match": ColorMatchGame as unknown as ComponentType<GameProps>,
  "space-invaders": SpaceInvadersGame as unknown as ComponentType<GameProps>,
  "simon-says": SimonSaysGame as unknown as ComponentType<GameProps>,
  "whack-a-mole": WhackAMoleGame as unknown as ComponentType<GameProps>,
  "2048": Puzzle2048Game as unknown as ComponentType<GameProps>,
  "memory-match": MemoryMatchGame as unknown as ComponentType<GameProps>,
  "word-scramble": WordScrambleGame as unknown as ComponentType<GameProps>,
  minesweeper: MinesweeperGame as unknown as ComponentType<GameProps>,
  "tic-tac-toe": TicTacToeGame as unknown as ComponentType<GameProps>,
  "connect-four": ConnectFourGame as unknown as ComponentType<GameProps>,
  "orbit-defense": OrbitDefense as unknown as ComponentType<GameProps>,
  "coin-collector": CoinCollectorGame as unknown as ComponentType<GameProps>,
  "bubble-pop": BubblePopGame as unknown as ComponentType<GameProps>,
  "typing-speed": TypingSpeedGame as unknown as ComponentType<GameProps>,
  sudoku: SudokuGame as unknown as ComponentType<GameProps>,
  pacman: PacmanGame as unknown as ComponentType<GameProps>,
  solitaire: SolitaireGame as unknown as ComponentType<GameProps>,
  "trivia-quiz": TriviaQuizGame as unknown as ComponentType<GameProps>,
}

export function getGameComponent(id: string): ComponentType<GameProps> {
  return gameComponentMap[id] || (() => null)
}

export function isValidGameId(id: string): boolean {
  return id in gameComponentMap
}
