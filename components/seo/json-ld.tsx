import React from 'react'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://games-ladestack.vercel.app'

export function WebSiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GameHub',
    alternateName: ['GameHub Free Games', 'GameHub Online Games'],
    url: baseUrl,
    description: 'Play free online browser games instantly with no downloads or registration.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/games?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GameHub',
    url: baseUrl,
    logo: `${baseUrl}/placeholder-logo.png`,
    sameAs: [],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export interface VideoGameJsonLdProps {
  id: string
  title: string
  description: string
  longDescription?: string
  category: string
  tags?: string[]
  themeColor?: string
}

export function VideoGameJsonLd({
  id,
  title,
  description,
  longDescription,
  category,
  tags = [],
}: VideoGameJsonLdProps) {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function CollectionPageJsonLd({ count }: { count: number }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Online Games Directory',
    description: `Browse our full collection of ${count}+ free browser games across Arcade, Puzzle, Action, Strategy, Card, and Word categories.`,
    url: `${baseUrl}/games`,
    numberOfItems: count,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
