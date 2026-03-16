/**
 * Generates robots.txt for crawlers.
 * Served at /robots.txt. References sitemap (sitemap.xml).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots() {
  const baseUrl = (process.env.NEXT_PUBLIC_WEB_URL || 'https://arablaza.com').replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Optional: uncomment to block crawlers from auth/token routes
      disallow: ['/api/', '/invitation/', '/reset-password', '/email-verified'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
