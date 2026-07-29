"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { categories } from "@/lib/game-registry"
import { Moon, Sun, Gamepad2, Menu, X } from "lucide-react"

const SearchBar = dynamic(() => import("./search-bar"), { ssr: false })

export default function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover:opacity-80 transition-opacity">
              <Gamepad2 className="w-6 h-6" />
              <span className="hidden sm:inline">GameHub</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {categories.filter(c => c.id !== "All").slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/games?category=${cat.id}`}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === "/games" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <SearchBar />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-4 py-3 space-y-1">
            {categories.filter(c => c.id !== "All").map((cat) => (
              <Link
                key={cat.id}
                href={`/games?category=${cat.id}`}
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
