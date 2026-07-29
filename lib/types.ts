import type { LucideIcon } from "lucide-react"

export type Category = "All" | "Arcade" | "Puzzle" | "Strategy" | "Action" | "Card" | "Word"

export interface GameMeta {
  id: string
  title: string
  description: string
  longDescription?: string
  icon: string
  color: string
  themeColor: string
  category: Category
  isNew?: boolean
  difficulty?: "Easy" | "Medium" | "Hard"
  controls?: string[]
  tags?: string[]
  playerCount?: string
  avgPlayTime?: string
}

export interface GameProps {
  onBack?: () => void
  themeColor?: string
}
