import Layout from '@/components/Layout/Layout';
import SingleBlog from '@/components/PagesComponent/SingleBlog/SingleBlog';
import JsonLd from '@/components/SEO/JsonLd';
import ReactDOM from 'react-dom';
import { fetchBlogBySlug, buildBlogMetadata } from '@/utils/blogDataFetcher';
import { serverGetCompressedImage, serverNormalizeImageUrl } from '@/utils/serverImageUtils';

// ─── Metadata ─────────────────────────────────────────────────────────────────
// ✅ Uses the same fetch URL as the page — Next.js deduplicates it (zero extra request)
export const generateMetadata = async ({ params }) => {
    const { slug } = await params;
    const rawData = await fetchBlogBySlug(slug);
    const singleBlog = rawData?.data?.data?.[0] || null;
    return buildBlogMetadata(singleBlog, slug);
};

// ─── Data Fetching ────────────────────────────────────────────────────────────

const fetchBlogTagsData = async () => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blog-tags`,
            { next: { revalidate: 86400 } }
        );
        const data = await res.json();
        return Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
};

const fetchQuickSearches = async () => {
    try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}quick-searches`);
        url.searchParams.set('featured', '1');
        const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
        const json = await res.json();
        const list = json?.data?.data ?? json?.data;
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

const stripHtml = (html) => html.replace(/<[^>]*>/g, '');
const formatDate = (dateString) => dateString.slice(0, 19) + 'Z';

// ─── Page ─────────────────────────────────────────────────────────────────────

const SingleBlogPage = async ({ params }) => {
    const { slug } = await params;

    // ✅ fetchBlogBySlug is deduplicated with generateMetadata's call — one network request
    const [rawData, initialTags, initialQuickSearchItems] = await Promise.all([
        fetchBlogBySlug(slug),
        fetchBlogTagsData(),
        fetchQuickSearches(),
    ]);

    const singleBlog = rawData?.data?.data?.[0] || null;
    const relatedBlogs = rawData?.other_blogs || [];

    // ─── LCP Preload via ReactDOM.preload() ───────────────────────────────────
    // ReactDOM.preload() is the ONLY reliable method in Next.js App Router
    // that injects a preload link into <head>. A <link> tag in JSX return
    // always ends up in <body> and is ignored by browsers for preloading.
    //
    // Width math:
    //   next.config deviceSizes: [640, 750, 828, 1080, 1200, ...]
    //   <Image width={838}> → Next.js generates srcset with 828w, 1080w, etc.
    //   Lighthouse test device (Moto G Power) = 360px CSS width, 1x DPR
    //   → browser picks 828w from srcset (smallest bucket >= 838*1 = 838 → 828 is closest)
    //   So preload href must be w=828 to match what the browser fetches.
    if (singleBlog?.image && singleBlog?.show_image !== 0 && singleBlog?.show_image !== false) {
        const rawImg = serverGetCompressedImage(singleBlog, 'large', singleBlog.image);
        const normalized = serverNormalizeImageUrl(rawImg);
        if (normalized) {
            ReactDOM.preload(
                `/_next/image?url=${encodeURIComponent(normalized)}&w=828&q=75`,
                {
                    as: 'image',
                    fetchPriority: 'high',
                    imageSrcSet: [
                        `/_next/image?url=${encodeURIComponent(normalized)}&w=828&q=75 828w`,
                        `/_next/image?url=${encodeURIComponent(normalized)}&w=1080&q=75 1080w`,
                        `/_next/image?url=${encodeURIComponent(normalized)}&w=1200&q=75 1200w`,
                    ].join(', '),
                    imageSizes: '100vw',
                }
            );
        }
    } else if (relatedBlogs?.length > 0 && relatedBlogs[0]?.image) {
        const firstRelated = relatedBlogs[0];
        const rawImg = serverGetCompressedImage(firstRelated, 'medium', firstRelated.image);
        const normalized = serverNormalizeImageUrl(rawImg);
        if (normalized) {
            ReactDOM.preload(
                `/_next/image?url=${encodeURIComponent(normalized)}&w=640&q=75`,
                {
                    as: 'image',
                    fetchPriority: 'high',
                    imageSrcSet: [
                        `/_next/image?url=${encodeURIComponent(normalized)}&w=640&q=75 640w`,
                        `/_next/image?url=${encodeURIComponent(normalized)}&w=828&q=75 828w`,
                    ].join(', '),
                    imageSizes: '(max-width: 768px) 100vw, 33vw',
                }
            );
        }
    }

    // ─── JSON-LD ──────────────────────────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
    const blogUrl = `${baseUrl}/blogs/${encodeURIComponent(singleBlog?.slug || slug || '')}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: singleBlog?.title,
        description: singleBlog?.description ? stripHtml(singleBlog.description).slice(0, 500) : '',
        url: blogUrl,
        image: singleBlog?.image ? [singleBlog.image] : undefined,
        datePublished: singleBlog?.created_at ? formatDate(singleBlog.created_at) : '',
        keywords: singleBlog?.tags ? singleBlog.tags.join(', ') : '',
    };

    return (
        <>
            <JsonLd data={jsonLd} />
            <Layout initialQuickSearchItems={initialQuickSearchItems}>
                <SingleBlog
                    initialBlogData={singleBlog}
                    initialRelatedBlogs={relatedBlogs}
                    initialTags={initialTags}
                />
            </Layout>
        </>
    );
};

export default SingleBlogPage;
