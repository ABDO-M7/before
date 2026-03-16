import QuickSearchResults from '@/components/PagesComponent/QuickSearchResults/QuickSearchResults';
import { generateQuickSearchMetadata } from '@/utils/metadataHelpers';

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

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug) return { title: 'Quick Search' };

  const metadata = await generateQuickSearchMetadata(slug);
  if (metadata?.title) return metadata;

  const decoded = decodeSlug(slug);
  return {
    title: `${decoded.replace(/-/g, ' ')}`,
  };
};

const SlugPage = async ({ params }) => {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';

  return <QuickSearchResults slug={slug} />;
};

export default SlugPage;
