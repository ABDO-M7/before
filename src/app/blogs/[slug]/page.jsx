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

    // ✅ إذا لم توجد بيانات، أعد 404 فوراً (لا تحمل Client Component فارغ)
    if (!singleBlog) {
        return (
            <Layout initialQuickSearchItems={initialQuickSearchItems}>
                <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <h3>Blog not found</h3>
                </div>
            </Layout>
        );
    }

    // ─── LCP Preload via ReactDOM.preload() ───────────────────────────────────
    if (singleBlog?.image && singleBlog?.show_image !== 0) {
      const rawImg = serverGetCompressedImage(singleBlog, 'large', singleBlog.image);
      const normalized = serverNormalizeImageUrl(rawImg);
      
      if (normalized) {
        // ✅ استخدم الرابط الأصلي مباشرة (أسرع)
        ReactDOM.preload(normalized, {
          as: 'image',
          fetchPriority: 'high',
          // ✅ srcset متوافق مع next.config.js deviceSizes
          imageSrcSet: [
            `${normalized}?w=640&q=75 640w`,
            `${normalized}?w=828&q=75 828w`, 
            `${normalized}?w=1080&q=75 1080w`,
          ].join(', '),
          imageSizes: '(max-width: 768px) 100vw, 838px',
        });
        
        // ✅ preconnect للدومين الخارجي
        if (normalized.startsWith('http')) {
          try {
            const domain = new URL(normalized).origin;
            ReactDOM.preconnect(domain, { crossOrigin: 'anonymous' });
          } catch {}
        }
      }
    }

    // ─── JSON-LD ──────────────────────────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
    const blogUrl = `${baseUrl}/blogs/${encodeURIComponent(singleBlog?.slug || slug || '')}`;

    const CompanyName = process.env.NEXT_PUBLIC_META_TITLE || 'Arablaza';

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: singleBlog?.title,
        description: singleBlog?.description ? stripHtml(singleBlog.description).slice(0, 500) : '',
        url: blogUrl,
        image: singleBlog?.image ? [serverNormalizeImageUrl(singleBlog.image)] : undefined,
        datePublished: singleBlog?.created_at ? formatDate(singleBlog.created_at) : '',
        dateModified: singleBlog?.updated_at ? formatDate(singleBlog.updated_at) : formatDate(singleBlog?.created_at),
        author: {
            '@type': 'Organization',
            name: CompanyName || 'Arablaza'
        },
        publisher: {
            '@type': 'Organization',
            name: CompanyName || 'Arablaza',
            logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/icon-512.png`
            }
        },
        keywords: singleBlog?.tags ? singleBlog.tags.join(', ') : '',
        // ✅ تحسين الظهور في البحث
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': blogUrl
        }
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
