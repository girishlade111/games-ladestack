import type React from "react"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { WebSiteJsonLd, OrganizationJsonLd } from "@/components/seo/json-ld"
import "./globals.css"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://games-ladestack.vercel.app"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GameHub - Play 50+ Free Online Browser Games",
    template: "%s | GameHub - Free Online Games",
  },
  description:
    "Play 50+ free online games instantly in your web browser. No downloads, installs, or registration required! Play retro arcade classics, 3D puzzle challenges, solitaire, word puzzles, and strategy games online.",
  keywords: [
    "online games",
    "free online games",
    "browser games",
    "free browser games",
    "no download games",
    "play games online",
    "arcade games",
    "puzzle games",
    "strategy games",
    "card games",
    "word games",
    "action games",
    "2048 game online",
    "solitaire online free",
    "minesweeper online",
    "snake game browser",
    "pacman online free",
    "sudoku online free",
  ],
  authors: [{ name: "GameHub Team" }],
  creator: "GameHub",
  publisher: "GameHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "GameHub",
    title: "GameHub - Play Free Browser Games Online",
    description:
      "Play hundreds of free online games instantly in your browser with no downloads or registration. Enjoy arcade classics, strategy, word, and puzzle games.",
    images: [
      {
        url: "/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "GameHub - Free Online Browser Games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GameHub - Play Free Browser Games Online",
    description:
      "Instant access to 50+ free online browser games. No downloads, no installs. Arcade, puzzle, action, card & strategy games.",
    images: ["/placeholder.jpg"],
    creator: "@gamehub",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <WebSiteJsonLd />
        <OrganizationJsonLd />
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

