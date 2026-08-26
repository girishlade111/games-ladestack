import type { ReactElement } from "react"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://games.ladestack.in'

/**
 * Serializes structured data for embedding inside a <script type="application/ld+json">
 * tag. Escapes "<", ">", "&" and line separators so a value containing "</script>"
 * can never break out of the script context (XSS hardening).
 */
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function JsonLdScript({ data }: { data: unknown }): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}

export function WebSiteJsonLd(): ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GameHub',
    alternateName: ['GameHub Free Games', 'GameHub Online Games'],
    url: baseUrl,
    description: 'Play 50+ free online browser games instantly with no downloads or registration.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/games?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLdScript data={jsonLd} />
}

export function OrganizationJsonLd(): ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GameHub',
    url: baseUrl,
    logo: `${baseUrl}/placeholder-logo.png`,
    sameAs: [],
  }

  return <JsonLdScript data={jsonLd} />
}

export interface VideoGameJsonLdProps {
  id: string
  title: string
  description: string
  longDescription?: string
  category: string
  tags?: string[]
}

export function GameJsonLd({
  id,
  title,
  description,
  longDescription,
  category,
  tags = [],
}: VideoGameJsonLdProps): ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    applicationCategory: 'GameApplication',
    name: title,
    operatingSystem: 'Any (Web Browser)',
    url: `${baseUrl}/games/${id}`,
    description: longDescription || description,
    genre: category,
    keywords: tags.join(', '),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Organization',
      name: 'GameHub',
    },
  }

  return <JsonLdScript data={jsonLd} />
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }): ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return <JsonLdScript data={jsonLd} />
}

export function CollectionPageJsonLd({
  count,
  games,
}: {
  count: number
  games?: Array<{ id: string; title: string }>
}): ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Online Games Directory',
    description: `Browse our full collection of ${count}+ free browser games across Arcade, Puzzle, Action, Strategy, Card, and Word categories.`,
    url: `${baseUrl}/games`,
    numberOfItems: count,
    ...(games && games.length > 0
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: games.length,
            itemListElement: games.map((game, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: game.title,
              url: `${baseUrl}/games/${game.id}`,
            })),
          },
        }
      : {}),
  }

  return <JsonLdScript data={jsonLd} />
}

export interface FAQItem {
  question: string
  answer: string
}

export function FAQPageJsonLd({ mainEntity }: { mainEntity: FAQItem[] }): ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mainEntity.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return <JsonLdScript data={jsonLd} />
}
