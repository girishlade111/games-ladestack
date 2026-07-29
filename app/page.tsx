import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { gameRegistry, categories } from "@/lib/game-registry"
import FeaturedGameCard from "@/components/featured-game-card"
import { ArrowRight, Trophy, Gamepad2, Zap, Users, Brain, Timer, Target, BookOpen, LayoutGrid } from "lucide-react"

export const metadata: Metadata = {
  title: "GameHub - Play 50+ Free Online Browser Games (No Downloads)",
  description:
    "Play over 50+ high-quality free online browser games. Instant play with zero downloads or registration required. Play 2048, Solitaire, Snake, Tetris, Minesweeper, Pac-Man, Sudoku, and more!",
  alternates: {
    canonical: "/",
  },
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Arcade: Zap,
  Puzzle: Brain,
  Strategy: Target,
  Action: Timer,
  Card: LayoutGrid,
  Word: BookOpen,
}

const stats = [
  { label: "Games", value: gameRegistry.length.toString(), icon: Gamepad2 },
  { label: "Categories", value: categories.filter((c) => c.id !== "All").length.toString(), icon: Zap },
  { label: "New This Month", value: "5+", icon: Brain },
]

const featuredGames = gameRegistry.filter((g) => g.isNew).slice(0, 3)

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Trophy className="w-4 h-4" />
              Over {gameRegistry.length} Free Games
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Play Free Browser Games{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover and play hundreds of free online games right in your browser. No downloads, no sign-up required -
              just pure gaming fun.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/games">
                <Button size="lg" className="text-base px-8 h-12">
                  Browse All Games
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/games?category=Arcade">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  Play Arcade Games
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Featured Games</h2>
          <p className="text-muted-foreground">Check out our newest additions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredGames.map((game) => (
            <FeaturedGameCard key={game.id} game={game} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/games">
            <Button variant="outline" size="lg">
              View All Games
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Game Categories</h2>
            <p className="text-muted-foreground">Find the perfect game for your mood</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.filter((c) => c.id !== "All").map((cat) => {
              const CatIcon = categoryIcons[cat.id] || Gamepad2
              return (
                <Link
                  key={cat.id}
                  href={`/games?category=${cat.id}`}
                  className="group flex flex-col items-center gap-3 p-6 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CatIcon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{cat.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 sm:p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-6 text-primary-foreground/80" />
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Play?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Jump into our collection of {gameRegistry.length}+ free games. No ads, no downloads, just instant fun.
          </p>
          <Link href="/games">
            <Button size="lg" variant="secondary" className="text-base px-8 h-12">
              Start Playing Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
