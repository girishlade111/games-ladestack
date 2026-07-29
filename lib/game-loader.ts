import { lazy, type ComponentType } from "react"
import type { GameProps } from "./types"

type GameLoader = () => Promise<{ default: ComponentType<GameProps> }>

const gameLoaders: Record<string, GameLoader> = {
  snake: () => import("@/components/games/snake-game"),
  tetris: () => import("@/components/games/tetris-game"),
  pong: () => import("@/components/games/pong-game"),
  flappy: () => import("@/components/games/flappy-triangle"),
  dino: () => import("@/components/games/dino-game"),
  breakout: () => import("@/components/games/breakout-game"),
  reaction: () => import("@/components/games/reaction-game"),
  "color-match": () => import("@/components/games/color-match-game"),
  "space-invaders": () => import("@/components/games/space-invaders-game"),
  "simon-says": () => import("@/components/games/simon-says-game"),
  "whack-a-mole": () => import("@/components/games/whack-a-mole-game"),
  "2048": () => import("@/components/games/puzzle-2048-game"),
  "memory-match": () => import("@/components/games/memory-match-game"),
  "word-scramble": () => import("@/components/games/word-scramble-game"),
  minesweeper: () => import("@/components/games/minesweeper-game"),
  "tic-tac-toe": () => import("@/components/games/tic-tac-toe-game"),
  "connect-four": () => import("@/components/games/connect-four-game"),
  "orbit-defense": () => import("@/components/games/orbit-defense"),
  "coin-collector": () => import("@/components/games/coin-collector-game"),
  "bubble-pop": () => import("@/components/games/bubble-pop-game"),
  "typing-speed": () => import("@/components/games/typing-speed-game"),
  sudoku: () => import("@/components/games/sudoku-game"),
  pacman: () => import("@/components/games/pacman-game"),
  solitaire: () => import("@/components/games/solitaire-game"),
  "trivia-quiz": () => import("@/components/games/trivia-quiz-game"),
  blackjack: () => import("@/components/games/blackjack-game"),
  poker: () => import("@/components/games/poker-game"),
  hangman: () => import("@/components/games/hangman-game"),
  "word-search": () => import("@/components/games/word-search-game"),
  checkers: () => import("@/components/games/checkers-game"),
  battleship: () => import("@/components/games/battleship-game"),
  asteroids: () => import("@/components/games/asteroids-game"),
  match3: () => import("@/components/games/match3-game"),
  "stack-tower": () => import("@/components/games/stack-tower-game"),
  "lane-racer": () => import("@/components/games/lane-racer-game"),
  "road-crossing": () => import("@/components/games/road-crossing-game"),
  "sliding-puzzle": () => import("@/components/games/sliding-puzzle-game"),
  "lights-out": () => import("@/components/games/lights-out-game"),
  "tower-of-hanoi": () => import("@/components/games/tower-of-hanoi-game"),
  reversi: () => import("@/components/games/reversi-game"),
  gomoku: () => import("@/components/games/gomoku-game"),
  "dots-and-boxes": () => import("@/components/games/dots-and-boxes-game"),
  "aim-trainer": () => import("@/components/games/aim-trainer-game"),
  "rhythm-tap": () => import("@/components/games/rhythm-tap-game"),
  "meteor-dodge": () => import("@/components/games/meteor-dodge-game"),
  "card-war": () => import("@/components/games/card-war-game"),
  "hi-lo": () => import("@/components/games/hi-lo-game"),
  "crazy-eights": () => import("@/components/games/crazy-eights-game"),
  wordle: () => import("@/components/games/wordle-game"),
  "anagram-hunt": () => import("@/components/games/anagram-hunt-game"),
  "spelling-bee": () => import("@/components/games/spelling-bee-game"),
}

const lazyComponentCache: Record<string, ComponentType<GameProps>> = {}

export function getGameComponent(id: string): ComponentType<GameProps> {
  if (!gameLoaders[id]) {
    return () => null
  }
  if (!lazyComponentCache[id]) {
    lazyComponentCache[id] = lazy(gameLoaders[id]) as ComponentType<GameProps>
  }
  return lazyComponentCache[id]
}

export function preloadGame(id: string): void {
  if (gameLoaders[id]) {
    void gameLoaders[id]()
  }
}

export function isValidGameId(id: string): boolean {
  return id in gameLoaders
}
