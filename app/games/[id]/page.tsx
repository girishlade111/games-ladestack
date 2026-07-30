import type { Metadata } from "next"
import { Suspense } from "react"
import GamePageClient from "./game-page-client"
import { gameRegistry, getGameById } from "@/lib/game-registry"
import { VideoGameJsonLd, BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/seo/json-ld"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://games.ladestack.in"

export function generateStaticParams() {
  return gameRegistry.map((game) => ({
    id: game.id,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const game = getGameById(id)

  if (!game) {
    return {
      title: "Game Not Found | GameHub",
      description: "The requested game could not be found on GameHub.",
    }
  }

  const shortTitle = `Play ${game.title} Online - Free Browser Game`
  const longTitle = `${game.title} - Play Free Online Browser Game (No Download)`
  const shortDescription = `${game.description} Play ${game.title} free in your web browser.`
  const longDescription = `${game.longDescription || game.description} Play ${game.title} online for free in your browser with zero downloads, no installation, and no sign-up required. Features ${game.category} gameplay, ${game.difficulty || "multiple"} difficulty settings, and high score tracking.`

  const gameKeywords = [
    game.title.toLowerCase(),
    `play ${game.title.toLowerCase()} online`,
    `free ${game.title.toLowerCase()}`,
    `${game.title.toLowerCase()} browser game`,
    `${game.category.toLowerCase()} games`,
    "free online games",
    "no download games",
    "instant play games",
    ...(game.tags || []).map((t) => t.toLowerCase()),
  ]

  return {
    title: shortTitle,
    description: shortDescription,
    keywords: gameKeywords,
    alternates: {
      canonical: `/games/${game.id}`,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: longTitle,
      description: longDescription,
      url: `${baseUrl}/games/${game.id}`,
      siteName: "GameHub",
      type: "website",
      images: [
        {
          url: "/placeholder.jpg",
          width: 1200,
          height: 630,
          alt: `Play ${game.title} Online - Free Browser Game`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shortTitle,
      description: shortDescription,
      images: ["/placeholder.jpg"],
    },
  }
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = getGameById(id)

  const faqItems = game ? [
    {
      question: `Is ${game.title} free to play online?`,
      answer: `Yes! ${game.title} is completely free to play in your browser with zero paywalls or mandatory sign-ups.`
    },
    {
      question: `Do I need to download or install software to play ${game.title}?`,
      answer: `No downloads or installation are needed. It runs instantly inside modern HTML5 compliant web browsers.`
    },
    {
      question: `Does ${game.title} support mobile phones and tablets?`,
      answer: `Yes, ${game.title} is fully optimized for mobile touchscreens as well as desktop keyboards and mice.`
    }
  ] : []

  return (
    <>
      {game && (
        <>
          <VideoGameJsonLd
            id={game.id}
            title={game.title}
            description={game.description}
            longDescription={game.longDescription}
            category={game.category}
            tags={game.tags}
            themeColor={game.themeColor}
          />
          <BreadcrumbJsonLd
            items={[
              { name: "Home", url: "/" },
              { name: "Games Directory", url: "/games" },
              { name: game.title, url: `/games/${game.id}` },
            ]}
          />
          <FAQPageJsonLd mainEntity={faqItems} />
        </>
      )}
      <Suspense fallback={<GameSkeleton />}>
        <GamePageClient params={params} />
      </Suspense>
    </>
  )
}

function GameSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-9 bg-muted rounded-md" />
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="w-32 h-6 bg-muted rounded" />
              <div className="w-48 h-4 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 py-6">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    </div>
  )
}
