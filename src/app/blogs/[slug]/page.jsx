import ar from '@/utils/locale/ar.json';
import en from '@/utils/locale/en.json';
import Layout from '@/components/Layout/Layout';
import SingleBlog from '@/components/PagesComponent/SingleBlog/SingleBlog';
import JsonLd from '@/components/SEO/JsonLd';
import { fetchBlogBySlug, buildBlogMetadata } from '@/utils/blogDataFetcher';
import { serverNormalizeImageUrl } from '@/utils/serverImageUtils';

const fetchWithTimeout = (url, options = {}, timeoutMs = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

// ─── Metadata ─────────────────────────────────────────────────────────────────
// ✅ Uses the same fetch URL as the page — Next.js deduplicates it (zero extra request)
export const generateMetadata = async ({ params }) => {
    try {
        const { slug } = await params;
        
        // Safety: handle encoded/decoded Arabic slugs
        const decodedSlug = typeof slug === 'string' && slug.includes('%') 
            ? decodeURIComponent(slug) 
            : slug;

        const rawData = await fetchBlogBySlug(decodedSlug);
        const singleBlog = rawData?.data?.data?.[0] || null;
        return buildBlogMetadata(singleBlog, decodedSlug);
    } catch (error) {
        console.error("Error in generateMetadata for blog:", error);
        return buildBlogMetadata(null, "");
    }
};

// ─── Data Fetching ────────────────────────────────────────────────────────────

const fetchBlogTagsData = async () => {
    try {
        const res = await fetchWithTimeout(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blog-tags`,
            { next: { revalidate: 86400, tags: ['blogs'] } },
            8000
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
        const res = await fetchWithTimeout(url.toString(), { next: { revalidate: 86400, tags: ['quick-searches'] } }, 8000);
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
        const json = await res.json();
        const list = json?.data?.data ?? json?.data;
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '');
const formatDate = (dateString) => (dateString || '').slice(0, 19) + 'Z';

const fetchSettings = async () => {
    try {
        const url = new URL(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-system-settings`
        );
        const res = await fetchWithTimeout(url.toString(), { next: { revalidate: 86400, tags: ['settings'] } }, 8000);
        if (!res.ok) return null;
        const json = await res.json();
        return json || null;
    } catch (e) {
        console.error('Error fetching settings:', e?.message || e);
        return null;
    }
};

// ─── Component ────────────────────────────────────────────────────────────────

const SingleBlogPage = async ({ params }) => {
    let slug = '';
    try {
        const resolvedParams = await params;
        slug = resolvedParams?.slug || '';
        
        // Safety: handle encoded/decoded Arabic slugs
        const decodedSlug = typeof slug === 'string' && slug.includes('%') 
            ? decodeURIComponent(slug) 
            : slug;

        // ✅ fetchBlogBySlug is deduplicated with generateMetadata's call — one network request
        const [rawData, initialTags, initialQuickSearchItems, settingsData] = await Promise.all([
            fetchBlogBySlug(decodedSlug),
            fetchBlogTagsData(),
            fetchQuickSearches(),
            fetchSettings()
        ]);

        const singleBlog = rawData?.data?.data?.[0] || null;
        const relatedBlogs = rawData?.other_blogs || [];
        
        // ✅ تحضير الترجمات والإعدادات للسيرفر
        const isRtl = true; 
        const langCode = 'ar';
        const translations = (langCode === 'ar' ? ar : en) || {};
        
        // قاموس الترجمات المطلوبة لهذه الصفحة
        const t = {
            ourBlogs: translations.ourBlogs || "Property Insights",
            views: translations.views || "Views",
            relatedArticle: translations.relatedArticle || "Related Article",
            whatsappMessageIntro: translations.whatsappMessageIntro || "Hello...",
            copyToClipboard: translations.copyToClipboard || "Copied to clipboard",
            googleMap: translations.googleMap || "Google Map",
            shareInfo: translations.shareThisBlogOnSocialMedia || translations.shareThisOnSocialMedia || "Share",
            linkCopied: translations.copyToClipboard || "Link copied",
            tags: translations.tags || "Tags",
            all: translations.all || "All"
        };

        // ✅ إذا لم توجد بيانات، أعد 404 فوراً
        if (!singleBlog) {
            return (
                <Layout initialQuickSearchItems={initialQuickSearchItems}>
                    <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h3>{translations.blogNotFound || "Blog not found"}</h3>
                    </div>
                </Layout>
            );
        }

        // ─── JSON-LD ──────────────────────────────────────────────────────────────
        const baseUrl = (process.env.NEXT_PUBLIC_WEB_URL || '').replace(/\/$/, '');
        const blogUrl = `${baseUrl}/blogs/${encodeURIComponent(String(singleBlog?.slug || slug || ''))}`;
        const CompanyName = process.env.NEXT_PUBLIC_META_TITLE || 'Arablaza';

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: String(singleBlog?.title || ''),
            description: singleBlog?.description ? stripHtml(String(singleBlog.description)).slice(0, 500) : '',
            url: blogUrl,
            image: singleBlog?.image ? [serverNormalizeImageUrl(String(singleBlog.image))] : undefined,
            datePublished: singleBlog?.created_at ? formatDate(String(singleBlog.created_at)) : '',
            dateModified: singleBlog?.updated_at ? formatDate(String(singleBlog.updated_at)) : formatDate(String(singleBlog?.created_at)),
            author: {
                '@type': 'Organization',
                name: String(CompanyName || 'Arablaza')
            },
            publisher: {
                '@type': 'Organization',
                name: String(CompanyName || 'Arablaza'),
                logo: {
                    '@type': 'ImageObject',
                    url: `${baseUrl}/icon-512.png`
                }
            },
            keywords: Array.isArray(singleBlog?.tags) ? singleBlog.tags.join(', ') : (singleBlog?.tags || ''),
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
                        settings={settingsData?.data}
                        isRtl={isRtl}
                        t={t}
                        currentUrl={blogUrl}
                        viewPingSlug={decodedSlug}
                    />
                </Layout>
            </>
        );
    } catch (error) {
        console.error(`Serious error rendering blog ${slug}:`, error);
        // Fallback to avoid complete crash
        return (
            <Layout initialQuickSearchItems={[]}>
                <div className="container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <h3>حدث خطأ أثناء تحميل المقال</h3>
                    <p style={{ opacity: 0.7 }}>يرجى المحاولة مرة أخرى لاحقاً</p>
                    <a href="/" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>العودة للرئيسية</a>
                </div>
            </Layout>
        );
    }
};

export default SingleBlogPage;
