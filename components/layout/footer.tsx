import Link from "next/link"
import { Gamepad2, Github, Twitter } from "lucide-react"

const footerLinks = [
  {
    title: "Games",
    links: [
      { label: "All Games", href: "/games" },
      { label: "Arcade", href: "/games?category=Arcade" },
      { label: "Puzzle", href: "/games?category=Puzzle" },
      { label: "Action", href: "/games?category=Action" },
      { label: "Strategy", href: "/games?category=Strategy" },
      { label: "Card Games", href: "/games?category=Card" },
      { label: "Word Games", href: "/games?category=Word" },
    ],
  },
  {
    title: "New Games",
    links: [
      { label: "Typing Speed Test", href: "/games/typing-speed" },
      { label: "Sudoku", href: "/games/sudoku" },
      { label: "Pac-Man", href: "/games/pacman" },
      { label: "Solitaire", href: "/games/solitaire" },
      { label: "Trivia Quiz", href: "/games/trivia-quiz" },
    ],
  },
  {
    title: "Popular",
    links: [
      { label: "2048", href: "/games/2048" },
      { label: "Snake", href: "/games/snake" },
      { label: "Tetris", href: "/games/tetris" },
      { label: "Minesweeper", href: "/games/minesweeper" },
      { label: "Space Invaders", href: "/games/space-invaders" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <Gamepad2 className="w-6 h-6" />
              GameHub
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Your destination for free, instant-play browser games. No downloads, no sign-up required.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GameHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
