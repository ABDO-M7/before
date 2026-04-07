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
 * Fetch the exact data needed for Quick Search (Config + First Page of Items + LCP Image).
 * Fully bypasses the hydration and API waterfalls completely.
 */
const fetchQuickSearchData = async (slug) => {
    try {
        const encodedSlug = encodeURIComponent(slug);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}quick-searches?slug=${encodedSlug}`,
          { next: { revalidate: 3600, tags: ['quick-searches'] } }
        );
        const json = await res.json();
        const quickSearchData = json?.data?.data;
        if (!quickSearchData) return { quickSearchData: null, itemsData: null, lcpImageUrl: null };
        
        // Build search params using the exact parameters from Quick Search
        const params = new URLSearchParams();
        if (quickSearchData.search) params.append('search', quickSearchData.search);
        if (quickSearchData.category_slug) params.append('category_slug', quickSearchData.category_slug);
        params.append('page', "1");

        const itemsRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?${params.toString()}`,
            { next: { revalidate: 3600, tags: ['items'] } }
        );
        const itemsJson = await itemsRes.json();
        const itemsData = itemsJson?.data;
        const firstItem = itemsData?.data?.[0];

        let lcpImageUrl = null;
        if (firstItem) {
            const rawImg = serverGetCompressedImage(firstItem, 'small', firstItem.image);
            const normalized = serverNormalizeImageUrl(rawImg);
            lcpImageUrl = serverGetOptimizedImageUrl(normalized, 640, 65);
        }

        return { quickSearchData, itemsData, lcpImageUrl };
    } catch(e) {
        return { quickSearchData: null, itemsData: null, lcpImageUrl: null };
    }
};

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug) return { title: 'Quick Search' };

  // Run metadata fetch and LCP fetch in parallel for zero latency cost
  const [metadata, dataResponse] = await Promise.all([
     generateQuickSearchMetadata(slug),
     fetchQuickSearchData(slug)
  ]);
  const lcpImageUrl = dataResponse?.lcpImageUrl;

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
  
  const { quickSearchData, itemsData, lcpImageUrl } = await fetchQuickSearchData(slug);

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
      <QuickSearchResults 
        slug={slug} 
        quickSearchData={quickSearchData} 
        itemsData={itemsData} 
      />
    </>
  );
};

export default SlugPage;
