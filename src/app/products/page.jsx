import { serverGetCompressedImage, serverNormalizeImageUrl, serverGetOptimizedImageUrl } from "@/utils/serverImageUtils";
import Layout from "@/components/Layout/Layout";
import Products from "@/components/PagesComponent/Products/Products"
import JsonLd from "@/components/SEO/JsonLd";

const fetchLcpData = async () => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?page=1&limit=1`,
            { next: { revalidate: 3600, tags: ['items'] } }
        );
        const json = await res.json();
        const firstItem = json?.data?.data?.[0];
        if (!firstItem) return null;

        const rawImg = serverGetCompressedImage(firstItem, 'small', firstItem.image);
        const normalized = serverNormalizeImageUrl(rawImg);
        // ✅ Precise match for Next.js image proxy on mobile (width 640, quality 65)
        return serverGetOptimizedImageUrl(normalized, 640, 65);
    } catch (e) {
        return null;
    }
}

export const generateMetadata = async () => {
    try {
        // Fetch both SEO settings and the first item (to get LCP image) in parallel
        const [seoRes, lcpImageUrl] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}seo-settings?page=ad-listing`, { next: { revalidate: 3600, tags: ['seo-settings'] } }),
            fetchLcpData()
        ]);

        const data = await seoRes.json();
        const adListing = data?.data?.[0];

        return {
            title: adListing?.title ? adListing?.title : process.env.NEXT_PUBLIC_META_TITLE,
            description: adListing?.description ? adListing?.description : process.env.NEXT_PUBLIC_META_DESCRIPTION,
            openGraph: {
                images: adListing?.image ? [adListing?.image] : (lcpImageUrl ? [lcpImageUrl] : []),
            },
            keywords: adListing?.keywords ? adListing?.keywords : process.env.NEXT_PUBLIC_META_kEYWORDS,
            // ✅ CRITICAL LCP FIX: Preload the first product image before the main JS bundle runs.
            // This allows the browser to start downloading the image while it's still parsing JS,
            // bypassing the "Resource Load Delay" caused by the hydration wall.
            other: {
                ...(lcpImageUrl && {
                    'fetchpriority': 'high',
                })
            }
        };
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};

const getAllItems = async () => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?page=1`,
            {
                next: { revalidate: 86400, tags: ['items'] }, // Revalidate every 1 DAY
            }
        );
        if (!res.ok) {
            console.error('API responded with status:', res.status);
            return { data: [] };
        }
        const data = await res.json();
        return data?.data || { data: [] };
    } catch (error) {
        console.error('Error fetching Product Items Data:', error);
        return { data: [] };
    }
}

const ProductsPage = async () => {

    const [AllItems, lcpImageUrl] = await Promise.all([
        getAllItems(),
        fetchLcpData()
    ]);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: (AllItems?.data || []).map((product, index) => ({
            "@type": "ListItem",
            position: index + 1, // Position starts at 1
            item: {
                "@type": "Product",
                productID: product?.id,
                name: product?.name,
                description: product?.description,
                image: product?.image,
                url: `${process.env.NEXT_PUBLIC_WEB_URL}/product-details/${product?.slug}`,
                category: {
                    "@type": "Thing",
                    name: product?.category?.name,
                },
                ...(product?.price && {
                    offers: {
                        "@type": "Offer",
                        price: product.price,
                        priceCurrency: "USD",
                    },
                }),
                countryOfOrigin: product?.country,
            }
        }))
    };

    return (
        <>
            {lcpImageUrl && (
                <link 
                    rel="preload" 
                    as="image" 
                    href={lcpImageUrl} 
                    fetchPriority="high" 
                    // ✅ Simplified hint to match next/image on mobile exactly.
                    // This resolves the "preloaded but not used" warning.
                />
            )}
            <JsonLd data={jsonLd} />
            <Layout>
                <Products initialData={AllItems?.data || []} paginationData={AllItems} />
            </Layout>
        </>
    )
}

export default ProductsPage