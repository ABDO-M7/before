import Layout from '@/components/Layout/Layout'
import SingleListing from '@/components/PagesComponent/SingleListing/SingleListing'

export const metadata = {
    title: process.env.NEXT_PUBLIC_META_TITLE,
    description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
    keywords: process.env.NEXT_PUBLIC_META_kEYWORDS,
    openGraph: {
        title: process.env.NEXT_PUBLIC_META_TITLE,
        description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
        keywords: process.env.NEXT_PUBLIC_META_kEYWORDS,
    },
}
const SingleListingPage = async ({ params }) => {
    const resolvedParams = await params;
    return (
        <Layout>
            <SingleListing slug={resolvedParams.slug} />
        </Layout>
    )
}

export default SingleListingPage