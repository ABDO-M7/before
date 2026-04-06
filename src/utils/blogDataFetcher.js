/**
 * Shared blog data fetcher used by BOTH generateMetadata and the page component.
 * Next.js deduplicates fetch() calls with identical URLs within the same render pass,
 * so calling this twice costs zero extra network requests as long as the URL matches.
 *
 * Place this file at: src/utils/blogDataFetcher.js
 */

const SITE_URL = (process.env.NEXT_PUBLIC_WEB_URL || 'https://arablaza.com').replace(/\/$/, '');
const SITE_NAME = process.env.NEXT_PUBLIC_META_TITLE || 'Arablaza';
const DEFAULT_DESCRIPTION = process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Arablaza marketplace.';

/**
 * Single source of truth for fetching blog data by slug.
 * Used by both generateMetadata and the page component.
 * Next.js caches identical fetch() URLs within the same request — zero double-fetch.
 */
export async function fetchBlogBySlug(slug) {
    if (!slug) return null;
    try {
        // ✅ Normalize slug ONCE here — both metadata and page use this function
        const decoded = typeof slug === 'string' && slug.includes('%') ? decodeURIComponent(slug) : slug;
        const encoded = encodeURIComponent(decoded.trim());
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs?slug=${encoded}`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data || null;
    } catch {
        return null;
    }
}

/**
 * Build blog metadata from already-fetched blog data.
 * Call this instead of generateBlogMetadata() when you already have the data,
 * to avoid an extra fetch() in the metadata function.
 */
export function buildBlogMetadata(singleBlog, slug) {
    if (!singleBlog) return { title: SITE_NAME, description: DEFAULT_DESCRIPTION };

    const plainDesc = (singleBlog.description || '').replace(/<[^>]*>/g, '').slice(0, 160) || DEFAULT_DESCRIPTION;
    const title = singleBlog.title || SITE_NAME;
    const canonicalSlug = singleBlog.slug || slug || '';
    const canonicalUrl = `${SITE_URL}/blogs/${encodeURIComponent(canonicalSlug)}`;
    const imageUrl = singleBlog.image || undefined;

    return {
        title,
        description: plainDesc,
        keywords: singleBlog.tags || '',
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title,
            description: plainDesc,
            url: canonicalUrl,
            siteName: SITE_NAME,
            type: 'article',
            locale: 'ar_AR',
            publishedTime: singleBlog.created_at || undefined,
            images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: plainDesc,
            images: imageUrl ? [imageUrl] : undefined,
        },
    };
}
