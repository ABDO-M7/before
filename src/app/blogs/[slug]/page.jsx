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
        const slugParam = slug ? encodeURIComponent(slug) : '';
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs?slug=${slugParam}`,
            { next: { revalidate: 3600 } } 
        );
        const data = await res.json();
        return data?.data || null;
    } catch (error) {
        return null;
    }
};

const fetchBlogTagsData = async () => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}tags`, // Assuming tags endpoint
            { next: { revalidate: 86400 } } 
        );
        const data = await res.json();
        return data?.data || [];
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


const SingleBlogPage = async ({ params }) => {
    const resolvedParams = await params;
    const [rawData, initialTags] = await Promise.all([
        fetchSingleBlogData(resolvedParams?.slug),
        fetchBlogTagsData()
    ]);
    const singleBlog = rawData?.data?.[0] || null;
    const relatedBlogs = rawData?.other_blogs || [];
    
    // Compute LCP Image
    let lcpImageUrl = null;
    if (singleBlog?.image && singleBlog?.show_image !== 0 && singleBlog?.show_image !== false) {
        const rawImg = serverGetCompressedImage(singleBlog, 'large', singleBlog.image);
        const normalized = serverNormalizeImageUrl(rawImg);
        lcpImageUrl = serverGetOptimizedImageUrl(normalized, 838, 75);
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
            <Layout>
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