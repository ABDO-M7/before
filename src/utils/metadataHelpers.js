/**
 * ✅ Metadata Generation Helpers
 * Centralized utilities for generating metadata efficiently.
 * Ensures full Open Graph and Twitter Card support for social sharing and search engines.
 */

import { getCachedMetadata, setCachedMetadata } from './metadataCache';

const fetchWithTimeout = (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const SITE_URL = (process.env.NEXT_PUBLIC_WEB_URL || 'https://arablaza.com').replace(/\/$/, '');
const SITE_NAME = process.env.NEXT_PUBLIC_META_TITLE || 'Arablaza';

/**
 * Default metadata fallbacks
 */
const DEFAULT_METADATA = {
  title: SITE_NAME,
  description: process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Buy and sell with confidence. Arablaza marketplace.',
  keywords: process.env.NEXT_PUBLIC_META_kEYWORDS || '',
};

/**
 * Ensure image URL is absolute for social crawlers
 */
function toAbsoluteImageUrl(image) {
  if (!image || typeof image !== 'string') return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
}

/**
 * Build Open Graph and Twitter metadata for sharing and SEO
 */
function buildSocialMetadata({ title, description, url, images = [], type = 'website' }) {
  const ogImages = [].concat(images).filter(Boolean).slice(0, 4).map((img) => ({
    url: toAbsoluteImageUrl(img),
    width: 1200,
    height: 630,
  })).filter((i) => i.url);

  return {
    title: title || DEFAULT_METADATA.title,
    description: (description || DEFAULT_METADATA.description).slice(0, 160),
    openGraph: {
      title: title || DEFAULT_METADATA.title,
      description: (description || DEFAULT_METADATA.description).slice(0, 160),
      url: url || SITE_URL,
      siteName: SITE_NAME,
      type,
      locale: 'en_US',
      images: ogImages.length ? ogImages : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: title || DEFAULT_METADATA.title,
      description: (description || DEFAULT_METADATA.description).slice(0, 160),
      images: ogImages.length ? [ogImages[0].url] : undefined,
    },
  };
}

/**
 * Generate metadata with caching
 * @param {string} type - Metadata type (e.g., 'product', 'blog', 'home')
 * @param {string|object} identifier - Unique identifier (slug, id, etc.)
 * @param {Function} fetchFn - Function to fetch metadata if not cached
 * @param {number} ttl - Cache TTL in seconds (default: 3600)
 * @returns {Promise<object>} Metadata object
 */
export async function generateMetadataWithCache(type, identifier, fetchFn, ttl = 3600) {
  // Only use server-side metadata cache in production (dev gets fresh data every time)
  const useCache = process.env.NODE_ENV === 'production';
  if (useCache) {
    const cached = getCachedMetadata(type, identifier);
    if (cached) {
      return cached;
    }
  }

  try {
    // Fetch metadata
    const metadata = await fetchFn();

    // Cache the result (production only)
    if (useCache && metadata) {
      setCachedMetadata(type, identifier, metadata, ttl);
    }

    return metadata || null;
  } catch (error) {
    console.error(`Error generating metadata for ${type}:`, error);
    return null;
  }
}

/**
 * Generate metadata for home page
 * @returns {Promise<object>} Metadata object
 */
export async function generateHomeMetadata() {
  return generateMetadataWithCache(
    'home',
    'home',
    async () => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}seo-settings?page=home`,
          { next: { revalidate: 3600, tags: ['seo-settings'] } },
          8000
        );
        
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          return null;
        }
        
        const data = await res.json();
        const home = data?.data?.[0];
        const title = home?.title || DEFAULT_METADATA.title;
        const description = home?.description || DEFAULT_METADATA.description;
        const social = buildSocialMetadata({
          title,
          description,
          url: SITE_URL,
          images: home?.image ? [home.image] : [],
          type: 'website',
        });
        return {
          title,
          description,
          keywords: home?.keywords || DEFAULT_METADATA.keywords,
          ...social,
        };
      } catch (error) {
        console.error('Error fetching metadata for home:', error.message);
        return null;
      }
    },
    3600 // 1 hour cache
  );
}

/**
 * Generate metadata for product details
 * @param {string} slug - Product slug
 * @returns {Promise<object>} Metadata object
 */
export async function generateProductMetadata(slug) {
  return generateMetadataWithCache(
    'product',
    slug,
    async () => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?slug=${encodeURIComponent(slug || '')}`,
          { next: { revalidate: 3600, tags: ['items', slug] } },
          8000
        );
        
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          return null;
        }
        
        const data = await res.json();
        const item = data?.data?.data?.[0];

        if (!item) {
          return null;
        }

        const title = item?.name || DEFAULT_METADATA.title;
        const plainDesc = typeof item?.description === 'string'
          ? item.description.replace(/<[^>]*>/g, '').slice(0, 160)
          : (item?.description || DEFAULT_METADATA.description);
        const description = plainDesc || DEFAULT_METADATA.description;
        const keywords = generateKeywords(item?.description);
        const canonicalUrl = `${SITE_URL}/product-details/${encodeURIComponent(String(item?.slug || slug))}`;
        const social = buildSocialMetadata({
          title,
          description,
          url: canonicalUrl,
          images: item?.image ? [item.image] : [],
          type: 'website',
        });
        return {
          title,
          description,
          keywords,
          alternates: { canonical: canonicalUrl },
          ...social,
        };
      } catch (error) {
        console.error(`Error fetching metadata for product ${slug}:`, error.message);
        return null;
      }
    },
    3600 // 1 hour cache
  );
}

/**
 * Generate metadata for blog post
 * @param {string} slug - Blog slug
 * @returns {Promise<object>} Metadata object
 */
export async function generateBlogMetadata(slug) {
  return generateMetadataWithCache(
    'blog',
    slug,
    async () => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs?slug=${encodeURIComponent(slug || '')}`,
          { next: { revalidate: 3600, tags: ['blogs', slug] } },
          8000
        );
        
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          return null;
        }
        
        const json = await res.json();
        const data = json?.data?.data?.[0];

        if (!data) {
          return null;
        }

        const plainTextDescription = (data?.description || '').replace(/<[^>]*>/g, '').slice(0, 160) || DEFAULT_METADATA.description;
        const title = data?.title || DEFAULT_METADATA.title;
        const canonicalUrl = `${SITE_URL}/blogs/${encodeURIComponent(String(data?.slug || slug))}`;
        const social = buildSocialMetadata({
          title,
          description: plainTextDescription,
          url: canonicalUrl,
          images: data?.image ? [data.image] : [],
          type: 'article',
        });
        return {
          title,
          description: plainTextDescription,
          keywords: data?.tags || DEFAULT_METADATA.keywords,
          alternates: { canonical: canonicalUrl },
          openGraph: {
            ...social.openGraph,
            type: 'article',
            publishedTime: data?.created_at || undefined,
          },
          twitter: social.twitter,
        };
      } catch (error) {
        console.error(`Error fetching metadata for blog ${slug}:`, error.message);
        return null;
      }
    },
    3600 // 1 hour cache
  );
}

/**
 * Generate metadata for quick search page (uses label from API for exact Arabic display)
 * @param {string} slug - Quick search slug
 * @returns {Promise<object>} Metadata object
 */
export async function generateQuickSearchMetadata(slug) {
  return generateMetadataWithCache(
    'quick_search',
    slug,
    async () => {
      try {
        const encodedSlug = encodeURIComponent(slug);
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}quick-searches?slug=${encodedSlug}`,
          { next: { revalidate: 3600, tags: ['quick-searches'] } },
          8000
        );

        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          return null;
        }

        const json = await res.json();
        const item = json?.data?.data;

        if (!item) {
          return null;
        }

        const title = item?.label || slug;
        const canonicalUrl = `${SITE_URL}/${encodeURIComponent(String(slug))}`;
        const social = buildSocialMetadata({
          title: String(title),
          description: DEFAULT_METADATA.description,
          url: canonicalUrl,
          images: [],
          type: 'website',
        });
        return {
          title: String(title),
          description: DEFAULT_METADATA.description,
          keywords: DEFAULT_METADATA.keywords,
          alternates: { canonical: canonicalUrl },
          ...social,
        };
      } catch (error) {
        console.error(`Error fetching metadata for quick search ${slug}:`, error.message);
        return null;
      }
    },
    3600 // 1 hour cache
  );
}

/**
 * Generate metadata for AI tool detail page
 * @param {string} slug - AI tool slug
 * @returns {Promise<object>} Metadata object
 */
export async function generateAiToolMetadata(slug) {
  return generateMetadataWithCache(
    'ai_tool',
    slug,
    async () => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}ai-tools?slug=${encodeURIComponent(slug || '')}`,
          { next: { revalidate: 3600, tags: ['ai-tools', slug] } },
          8000
        );
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
        const data = await res.json();
        const tool = data?.data;
        if (!tool) return null;
        const title = tool?.title || DEFAULT_METADATA.title;
        const description = (tool?.description || '').replace(/<[^>]*>/g, '').slice(0, 160) || DEFAULT_METADATA.description;
        const canonicalUrl = `${SITE_URL}/ai-tools/${encodeURIComponent(String(tool?.slug || slug))}`;
        const social = buildSocialMetadata({
          title,
          description,
          url: canonicalUrl,
          images: tool?.image ? [tool.image] : [],
          type: 'website',
        });
        return {
          title,
          description,
          alternates: { canonical: canonicalUrl },
          ...social,
        };
      } catch (error) {
        console.error(`Error fetching metadata for AI tool ${slug}:`, error.message);
        return null;
      }
    },
    3600
  );
}

/**
 * Generate metadata for place (city guide) detail page
 * @param {string} slug - Place slug
 * @returns {Promise<object>} Metadata object
 */
export async function generatePlaceMetadata(slug) {
  return generateMetadataWithCache(
    'place',
    slug,
    async () => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}places?slug=${encodeURIComponent(slug || '')}&hub=web`,
          { next: { revalidate: 3600, tags: ['places', slug] } },
          8000
        );
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
        const data = await res.json();
        const place = data?.data;
        if (!place) return null;
        const title = place?.title || DEFAULT_METADATA.title;
        const rawDesc = place?.short_description || place?.description || '';
        const description = String(rawDesc).replace(/<[^>]*>/g, '').slice(0, 160) || DEFAULT_METADATA.description;
        const canonicalUrl = `${SITE_URL}/places/${encodeURIComponent(String(place?.slug || slug))}`;
        const social = buildSocialMetadata({
          title,
          description,
          url: canonicalUrl,
          images: place?.image ? [place.image] : [],
          type: 'website',
        });
        return {
          title,
          description,
          alternates: { canonical: canonicalUrl },
          ...social,
        };
      } catch (error) {
        console.error(`Error fetching metadata for place ${slug}:`, error.message);
        return null;
      }
    },
    3600
  );
}

/**
 * Generate metadata for system settings (favicon, etc.)
 * @returns {Promise<object>} Metadata object
 */
export async function generateSystemMetadata() {
  return generateMetadataWithCache(
    'system',
    'settings',
    async () => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-system-settings`,
          { next: { revalidate: 3600, tags: ['seo-settings'] } },
          8000
        );
        
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          return null;
        }
        
        const data = await res.json();
        const favicon = data?.data?.favicon_icon;

        return {
          icons: favicon ? [{ url: favicon }] : [],
          other: {
            ...(process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION && {
              'facebook-domain-verification': process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION,
            }),
          },
        };
      } catch (error) {
        console.error('Error fetching system metadata:', error.message);
        return null;
      }
    },
    3600 // 1 hour cache
  );
}

/**
 * Generate keywords from description
 * @param {string} description - Description text
 * @returns {string|array} Keywords
 */
function generateKeywords(description) {
  if (!description) {
    return DEFAULT_METADATA.keywords
      ? DEFAULT_METADATA.keywords.split(',').map((keyword) => keyword.trim())
      : [];
  }

  const stopWords = [
    'the', 'is', 'in', 'and', 'a', 'to', 'as', 'of', 'it', 'that', 'for', 'with', 'on', 'at', 'from',
    'by', 'this', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'an', 'or', 'but', 'not',
  ];

  // Extract words from description
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.includes(word));

  // Get unique words and limit to top 10
  const uniqueWords = [...new Set(words)].slice(0, 10);

  return uniqueWords.length > 0 ? uniqueWords.join(', ') : DEFAULT_METADATA.keywords;
}

/**
 * Create static metadata object
 * @param {object} options - Metadata options
 * @returns {object} Metadata object
 */
export function createStaticMetadata(options = {}) {
  return {
    title: options.title || DEFAULT_METADATA.title,
    description: options.description || DEFAULT_METADATA.description,
    keywords: options.keywords || DEFAULT_METADATA.keywords,
    ...(options.openGraph && { openGraph: options.openGraph }),
    ...(options.icons && { icons: options.icons }),
    ...(options.other && { other: options.other }),
  };
}
