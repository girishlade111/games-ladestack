import Link from "next/link"
import GameIcon from "@/components/game-icon"

type RelatedGameData = { id: string; color: string; title: string }

export default function RelatedGames({ data }: { data: { games: RelatedGameData[] } }) {
  return (
    <div className="border-t bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-lg font-semibold mb-6">More Games You Might Like</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.games.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${g.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <GameIcon gameId={g.id} size={20} />
                </div>
                <span className="text-xs font-medium text-center">{g.title}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
