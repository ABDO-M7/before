export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const staticRoutes = [
        'about-us', 'ad-listing', 'ads', 'blogs', 'chat', 'contact-us', 'faqs',
        'favourites', 'home', 'notifications', 'privacy-policy', 'products',
        'profile/edit-profile', 'reviews', 'subscription', 'terms-and-condition',
        'transactions', 'user-subscription', 'user-verification', 'job-applications'
    ];

    const staticSitemapEntries = staticRoutes.map(route => ({
        url: `${baseUrl}/${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
    }));

    // Add the base URL entry
    const baseEntry = {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
    };

    // Fetch only first page of products
    let productEntries = [];
    try {
        const res = await fetch(
            `${apiUrl}${process.env.NEXT_PUBLIC_END_POINT}get-item?page=1`,
            { next: { revalidate: 604800 } } // Revalidate weekly
        );

        if (res.ok) {
            const json = await res.json();
            const products = json?.data?.data || [];
            productEntries = products.map(product => ({
                url: `${baseUrl}/product-details/${encodeURIComponent(product?.slug || '')}`,
                lastModified: new Date(product?.updated_at || 0),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));
        }
    } catch (error) {
        console.error('Error fetching products for sitemap:', error);
    }

    // Fetch only first page of categories
    let categoryEntries = [];
    try {
        const res = await fetch(
            `${apiUrl}${process.env.NEXT_PUBLIC_END_POINT}get-categories?page=1`,
            { next: { revalidate: 604800 } } // Revalidate weekly
        );

        if (res.ok) {
            const json = await res.json();
            const categories = json?.data?.data || [];
            categoryEntries = categories.map(category => ({
                url: `${baseUrl}/category/${encodeURIComponent(category?.slug || '')}`,
                lastModified: new Date(category?.updated_at || 0),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
        }
    } catch (error) {
        console.error('Error fetching categories for sitemap:', error);
    }

    // Fetch only first page of blogs
    let blogEntries = [];
    try {
        const res = await fetch(
            `${apiUrl}${process.env.NEXT_PUBLIC_END_POINT}blogs?page=1`,
            { next: { revalidate: 604800 } } // Revalidate weekly
        );

        if (res.ok) {
            const json = await res.json();
            const blogs = json?.data?.data || [];
            blogEntries = blogs.map(blog => ({
                url: `${baseUrl}/blogs/${encodeURIComponent(blog?.slug || '')}`,
                lastModified: new Date(blog?.updated_at || 0),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
        }
    } catch (error) {
        console.error('Error fetching blogs for sitemap:', error);
    }

    // AI tools (first page)
    let aiToolEntries = [];
    try {
        const res = await fetch(
            `${apiUrl}${process.env.NEXT_PUBLIC_END_POINT}ai-tools?page=1&limit=50`,
            { next: { revalidate: 604800 } }
        );
        if (res.ok) {
            const json = await res.json();
            const tools = json?.data?.data || [];
            aiToolEntries = tools.map((tool) => ({
                url: `${baseUrl}/ai-tools/${encodeURIComponent(tool?.slug || '')}`,
                lastModified: new Date(tool?.updated_at || 0),
                changeFrequency: 'weekly',
                priority: 0.6,
            }));
        }
    } catch (error) {
        console.error('Error fetching AI tools for sitemap:', error);
    }

    return [baseEntry, ...staticSitemapEntries, ...productEntries, ...categoryEntries, ...blogEntries, ...aiToolEntries];
}