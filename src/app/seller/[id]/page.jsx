import Layout from "@/components/Layout/Layout";
import SellerProfile from "@/components/PagesComponent/SellerProfile/SellerProfile"
import JsonLd from "@/components/SEO/JsonLd";


export const generateMetadata = async ({ params }) => {
    try {
        const resolvedParams = await params;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-seller?id=${resolvedParams?.id}`,
            {
                next: { revalidate: 3600, tags: ['items', resolvedParams?.id] }, // Revalidate every 1 hour
            }
        );
// seller data
        const data = await res.json();
        const seller = data?.data?.seller;
        const title = seller?.name;
        const image = seller?.profile;
        return {
            title: title ? title : process.env.NEXT_PUBLIC_META_TITLE,
            description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
            openGraph: {
                images: image ? [image] : [],
            },
            keywords: process.env.NEXT_PUBLIC_META_kEYWORDS
        };
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};




// seller items

const getSellerItems = async (id) => {
    try {

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?page=1&user_id=${id}`,
            {
                next: { revalidate: 86400, tags: ['items', id] }, // Revalidate every 1 day
            }
        );
        const data = await res.json();
        return data?.data?.data || [];
    } catch (error) {
        console.error('Error fetching Product Items Data:', error);
        return [];
    }
}
const SellerProfilePage = async ({ params }) => {
    const resolvedParams = await params;
    const sellerItems = await getSellerItems(resolvedParams?.id)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: sellerItems?.map((product, index) => ({
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
            <JsonLd data={jsonLd} />
            <Layout>
                <SellerProfile id={resolvedParams?.id} />
            </Layout>
        </>
    )
}

export default SellerProfilePage