import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/dashboard',
        '/schedule',
        '/bookmarks',
        '/settings',
        '/onboarding',
        '/checkout',
      ],
    },
    sitemap: 'https://daechi-planner.vercel.app/sitemap.xml',
  }
}
