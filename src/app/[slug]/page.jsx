import QuickSearchResults from '@/components/PagesComponent/QuickSearchResults/QuickSearchResults';
import { generateQuickSearchMetadata } from '@/utils/metadataHelpers';
import { serverGetCompressedImage, serverNormalizeImageUrl, serverGetOptimizedImageUrl } from "@/utils/serverImageUtils";

/** Safely decode slug for fallback title (handles Arabic/Unicode). */
function decodeSlug(s) {
  if (!s || typeof s !== 'string') return s;
  try {
    if (/^[0-9A-Fa-f]+%[0-9A-Fa-f]{2}/.test(s)) return decodeURIComponent('%' + s);
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Fetch the LCP Image URL for a given Quick Search slug
 * This allows the browser to bypass the hydration and API waterfalls completely
 */
const fetchQuickSearchLcp = async (slug) => {
    try {
        const encodedSlug = encodeURIComponent(slug);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}quick-searches?slug=${encodedSlug}`,
          { next: { revalidate: 3600 } }
        );
        const json = await res.json();
        const item = json?.data?.data;
        if (!item) return null;
        
        // Build search params using the exact parameters from Quick Search
        const params = new URLSearchParams();
        if (item.search) params.append('search', item.search);
        if (item.category_slug) params.append('category_slug', item.category_slug);
        params.append('page', "1");
        params.append('limit', "1");

        const itemsRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?${params.toString()}`,
            { next: { revalidate: 3600 } }
        );
        const itemsJson = await itemsRes.json();
        const firstItem = itemsJson?.data?.data?.[0];
        if (!firstItem) return null;

        const rawImg = serverGetCompressedImage(firstItem, 'small', firstItem.image);
        const normalized = serverNormalizeImageUrl(rawImg);
        return serverGetOptimizedImageUrl(normalized, 640, 65);
    } catch(e) {
        return null;
    }
};

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug) return { title: 'Quick Search' };

  // Run metadata fetch and LCP fetch in parallel for zero latency cost
  const [metadata, lcpImageUrl] = await Promise.all([
     generateQuickSearchMetadata(slug),
     fetchQuickSearchLcp(slug)
  ]);

  const decoded = decodeSlug(slug);
  const baseData = metadata?.title ? metadata : { title: `${decoded.replace(/-/g, ' ')}` };

  return {
      ...baseData,
      other: {
          ...(baseData.other || {}),
          ...(lcpImageUrl && {
              'fetchpriority': 'high',
          })
      }
  };
};

const SlugPage = async ({ params }) => {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  
  const lcpImageUrl = await fetchQuickSearchLcp(slug);

  return (
    <>
      {lcpImageUrl && (
          <link 
              rel="preload" 
              as="image" 
              href={lcpImageUrl} 
              fetchPriority="high" 
          />
      )}
      <QuickSearchResults slug={slug} />
    </>
  );
};

export default SlugPage;
