import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://getsynoptic.com';
  
  const routes = [
    '',
    '/learn',
    '/publish',
    '/models',
    '/about',
    '/privacy',
    '/terms',
    '/library',
    '/pricing',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
