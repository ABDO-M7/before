import Layout from '@/components/Layout/Layout';
import SingleBlog from '@/components/PagesComponent/SingleBlog/SingleBlog'
import JsonLd from '@/components/SEO/JsonLd';
import { generateBlogMetadata } from '@/utils/metadataHelpers';

export const generateMetadata = async ({ params }) => {
    const resolvedParams = await params;
    // ✅ Use cached metadata generation for better performance
    return await generateBlogMetadata(resolvedParams?.slug);
};

const fetchSingleBlogItem = async (slug) => {
    try {
        const slugParam = slug ? encodeURIComponent(slug) : '';
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs?slug=${slugParam}`,
            { next: { revalidate: 86400 } } // 1 day
        );
        const data = await res.json();
        return data?.data?.data?.[0] || [];
    } catch (error) {
        console.error('Error fetching Blog Item Data:', error);
        return [];
    }
};


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
    const singleBlog = await fetchSingleBlogItem(resolvedParams?.slug);
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
            <JsonLd data={jsonLd} />
            <Layout>
                <SingleBlog />
            </Layout>
        </>
    )
}

export default SingleBlogPage