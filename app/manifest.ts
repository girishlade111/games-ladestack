import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GameHub - Free Online Browser Games',
    short_name: 'GameHub',
    description: 'Play hundreds of free online browser games instantly with no downloads or sign-up required. Arcade, puzzle, card, word, and strategy games.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/placeholder-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/placeholder-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
