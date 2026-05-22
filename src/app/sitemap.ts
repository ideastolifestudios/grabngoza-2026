import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shopgrabngo.co.za';

  const routes = [
    '',
    '/our-story',
    '/returns',
    '/help',
    '/shipping-policy',
    '/legal',
    '/faq',
    '/track-order',
    '/bundles',
    '/search',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
