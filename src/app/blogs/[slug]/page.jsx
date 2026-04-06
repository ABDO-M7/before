import Layout from '@/components/Layout/Layout';
import SingleBlog from '@/components/PagesComponent/SingleBlog/SingleBlog'
import JsonLd from '@/components/SEO/JsonLd';
import { generateBlogMetadata } from '@/utils/metadataHelpers';

export const generateMetadata = async ({ params }) => {
    const resolvedParams = await params;
    // ✅ Use cached metadata generation for better performance
    return await generateBlogMetadata(resolvedParams?.slug);
};

import { serverGetCompressedImage, serverNormalizeImageUrl, serverGetOptimizedImageUrl } from "@/utils/serverImageUtils";

const fetchSingleBlogData = async (slug) => {
    try {
        const decodeSafeSlug = typeof slug === 'string' && slug.includes('%') ? decodeURIComponent(slug) : slug;
        const slugParam = decodeSafeSlug ? encodeURIComponent(decodeSafeSlug) : '';
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs?slug=${slugParam}`,
            { next: { revalidate: 3600 } } 
        );
        const data = await res.json();
        return data || null;
    } catch (error) {
        return null;
    }
};

const fetchBlogTagsData = async () => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blog-tags`, // ✅ Correct endpoint - prevents client-side refetch CLS
            { next: { revalidate: 86400 } } 
        );
        const data = await res.json();
        // ✅ blog-tags returns { data: [...] } — a direct array of tag strings
        return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
        return [];
    }
};

// Removed fetchBlogItems from server side to unblock HTML generation


const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, ''); // Regular expression to remove HTML tags
};

// Function to format the date correctly (ISO 8601)
const formatDate = (dateString) => {
    // Remove microseconds and ensure it follows ISO 8601 format
    const validDateString = dateString.slice(0, 19) + 'Z'; // Remove microseconds and add 'Z' for UTC
    return validDateString;
};


// Quick searches for header (needed immediately for Layout/Header)
const fetchQuickSearches = async () => {
    try {
        const url = new URL(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}quick-searches`
        );
        url.searchParams.set('featured', '1');
        const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
        const json = await res.json();
        const list = json?.data?.data ?? json?.data;
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
};

const SingleBlogPage = async ({ params }) => {
    const resolvedParams = await params;
    const [rawData, initialTags, initialQuickSearchItems] = await Promise.all([
        fetchSingleBlogData(resolvedParams?.slug),
        fetchBlogTagsData(),
        fetchQuickSearches()
    ]);
    const singleBlog = rawData?.data?.[0] || null;
    const relatedBlogs = rawData?.other_blogs || [];
    
    // Compute LCP Image
    let lcpImageUrl = null;
    if (singleBlog?.image && singleBlog?.show_image !== 0 && singleBlog?.show_image !== false) {
        const rawImg = serverGetCompressedImage(singleBlog, 'large', singleBlog.image);
        const normalized = serverNormalizeImageUrl(rawImg);
        // Next.js Image with width={838} maps to deviceSizes: 1080
        lcpImageUrl = serverGetOptimizedImageUrl(normalized, 1080, 75);
    } else if (relatedBlogs && relatedBlogs.length > 0 && relatedBlogs[0]?.image) {
        // If no main image, first related blog image becomes LCP
        const firstRelated = relatedBlogs[0];
        const rawImg = serverGetCompressedImage(firstRelated, 'medium', firstRelated.image);
        const normalized = serverNormalizeImageUrl(rawImg);
        // Next.js Image with width={388} maps to deviceSizes: 640
        lcpImageUrl = serverGetOptimizedImageUrl(normalized, 640, 75);
    }

    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
    const blogUrl = singleBlog?.slug
      ? `${baseUrl}/blogs/${encodeURIComponent(singleBlog.slug)}`
      : `${baseUrl}/blogs/${encodeURIComponent(resolvedParams?.slug || '')}`;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: singleBlog?.title,
        description: singleBlog?.description ? stripHtml(singleBlog.description).slice(0, 500) : "No description available",
        url: blogUrl,
        image: singleBlog?.image ? [singleBlog.image] : undefined,
        datePublished: singleBlog?.created_at ? formatDate(singleBlog.created_at) : "",
        keywords: singleBlog?.tags ? singleBlog.tags.join(', ') : "",
    };

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
            <JsonLd data={jsonLd} />
            <Layout initialQuickSearchItems={initialQuickSearchItems}>
                <SingleBlog 
                    initialBlogData={singleBlog} 
                    initialRelatedBlogs={relatedBlogs}
                    initialTags={initialTags}
                />
            </Layout>
        </>
    )
}

export default SingleBlogPage