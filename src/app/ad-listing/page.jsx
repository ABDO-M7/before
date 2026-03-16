import Layout from '@/components/Layout/Layout';
import dynamic from "next/dynamic"
import { Suspense } from "react"

// ✅ Lazy load AdListing component for better code splitting
const AdListing = dynamic(
  () => import('@/components/PagesComponent/AdListing/AdListing'),
  {
    loading: () => <div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>,
  }
)




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


const AdListingPage = async () => {


    return (
        <>
            <Layout>
                <Suspense fallback={<div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
                    <AdListing />
                </Suspense>
            </Layout>
        </>
    )
}

export default AdListingPage