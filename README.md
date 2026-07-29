# GameHub

A professional-grade browser gaming platform built with Next.js 15, React 19, and TypeScript. Play 33 free browser games instantly -- no downloads, no sign-up required.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3 (CSS variables), shadcn/ui |
| Theming | next-themes (dark/light/system) |
| Icons | lucide-react + custom SVG game icons |
| Build | Webpack (Next.js turbopack compatible) |

## Project Structure

```
/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with ThemeProvider, Header, Footer
│   ├── page.tsx                  # Landing page (hero, stats, featured, categories)
│   ├── globals.css               # Tailwind + CSS variable theme definitions
│   ├── loading.tsx               # Global loading skeleton
│   └── games/
│       ├── page.tsx              # Server page wrapping GamesPageClient
│       ├── games-page-client.tsx  # Client component: filters, search, game grid
│       ├── loading.tsx           # Skeleton loading state
│       └── [id]/
│           ├── page.tsx           # Server page wrapping GamePageClient
│           ├── game-page-client.tsx  # Dynamic game loader + fullscreen toggle
│           └── related-games.tsx  # Related games section
├── components/
│   ├── game-icon.tsx             # Custom SVG logos for all 33 games
│   ├── theme-provider.tsx        # next-themes wrapper
│   ├── games/                    # 33 game components (one per game)
│   │   ├── snake-game.tsx
│   │   ├── tetris-game.tsx
│   │   ├── pong-game.tsx
│   │   ├── ... (30 more games)
│   │   └── word-search-game.tsx
│   ├── layout/                   # Shared layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── search-bar.tsx        # Lazy-loaded game search
│   └── ui/                       # shadcn/ui primitives
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   ├── game-registry.ts          # Central metadata for all games + categories
│   ├── game-loader.ts            # Module-level React.lazy declarations (code splitting)
│   ├── types.ts                  # TypeScript interfaces (GameMeta, GameProps, Category)
│   ├── icons.ts                  # Lucide icon map + getIcon() utility
│   └── utils.ts                  # Shared utility functions
└── public/                       # Static assets
```

## Games (33 total)

### Arcade (8)
Snake, Pong, Flappy Triangle, Sheep Run (Dino), Breakout, Coin Collector, Bubble Pop, Pac-Man

### Puzzle (6)
Tetris, 2048, Memory Match, Sudoku, Trivia Quiz, Match-3

### Action (6)
Reaction Time, Color Match, Space Invaders, Simon Says, Whack-a-Mole, Asteroids

### Strategy (6)
Minesweeper, Tic Tac Toe, Connect Four, Orbit Defense, Checkers, Battleship

### Word (4)
Word Scramble, Typing Speed Test, Hangman, Word Search

### Card (3)
Solitaire, Blackjack, Video Poker

## Architecture

### Code Splitting
Every game is loaded lazily via module-level `React.lazy()` with automatic Webpack chunk splitting. The search bar is also lazy-loaded via `next/dynamic({ ssr: false })` to keep the game registry out of the initial bundle. Each game lives in its own chunk, so users only download the code for the game they play.

### Game Loop Pattern
All canvas-based games (Snake, Tetris, Pong, Breakout, Space Invaders, Dino, Pac-Man, Flappy Triangle, Asteroids) use a **ref-based game loop** to avoid stale closures:

- Mutable game state stored in `useRef` (position, velocity, obstacles, etc.)
- Separate `requestAnimationFrame` loops for game logic (updates refs + React state for UI) and rendering (reads refs + draws canvas)
- React state used only for UI-rendered values (score, lives, gameOver)
- All timers and animation frame IDs cleaned up on unmount

### Fullscreen Mode
Every game page includes a fullscreen toggle button. When activated, the header, controls bar, footer, and related games section are hidden -- the game fills the entire viewport. Press `Escape` or click the exit button to return to normal view.

## Getting Started

### Prerequisites
- Node.js 18+
- npm (or pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/ladestack/games-ladestack.git
cd games-ladestack

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start the production server
npm start
```

## Adding a New Game

1. Create a game component in `components/games/your-game.tsx`:
   ```tsx
   "use client"
   export default function YourGame({ onBack, themeColor }: { onBack?: () => void; themeColor?: string }) {
     return <div>Your game here</div>
   }
   ```

2. Register metadata in `lib/game-registry.ts`:
   ```ts
   {
     id: "your-game",
     title: "Your Game",
     description: "Brief description",
     icon: "some-icon",
     color: "bg-blue-500",
     themeColor: "#3b82f6",
     category: "Arcade",
     difficulty: "Medium",
     controls: ["Arrow Keys"],
     tags: ["custom", "game"],
     playerCount: "1 Player",
     avgPlayTime: "3-5 min",
   }
   ```

3. Wire up in `lib/game-loader.ts`:
   ```ts
   const YourGame = lazy(() => import("@/components/games/your-game"))
   // Add to gameComponentMap:
   "your-game": YourGame as unknown as ComponentType<GameProps>,
   ```

4. Add a custom icon to `components/game-icon.tsx` under the `icons` record.

## Features

- **33 browser games** across 6 categories
- **Dark/light/system theme** support
- **Fullscreen mode** for every game (Esc to exit)
- **Category filters** and **text search** in the game library
- **Responsive design** -- works on desktop, tablet, and mobile
- **Code splitting** -- each game lazy-loaded for optimal performance
- **Custom SVG logos** for every game (no generic duplicates)
- **SEO optimized** with metadata, descriptions, and semantic HTML
- **Professional UI** with shadcn/ui components and smooth animations

## License

MIT
