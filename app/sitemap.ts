import type { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://planai.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
    },
    {
      url: `${SITE_URL}/blog`,
    },
    {
      url: `${SITE_URL}/blog/premium`,
    },
  ]

  // Paginated blog index: 6 posts per page
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(blogPosts.length / pageSize))
  for (let p = 2; p <= totalPages; p++) {
    routes.push({ url: `${SITE_URL}/blog?page=${p}` })
  }

  // Blog post detail pages
  for (const post of blogPosts) {
    routes.push({ url: `${SITE_URL}/blog/${post.id}` })
  }

  return routes
}
