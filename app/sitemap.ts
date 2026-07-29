import type { MetadataRoute } from 'next'
import { gameRegistry } from '@/lib/game-registry'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://games-ladestack.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString()

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // Game detail routes
  const gameRoutes: MetadataRoute.Sitemap = gameRegistry.map((game) => ({
    url: `${baseUrl}/games/${game.id}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: game.isNew ? 0.85 : 0.8,
  }))

  return [...routes, ...gameRoutes]
}
