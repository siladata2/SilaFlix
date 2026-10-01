import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/settings', '/downloads', '/history'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
