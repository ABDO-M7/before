import React from 'react'
import Layout from '@/components/Layout/Layout'
import SinglePlace from '@/components/PagesComponent/Places/SinglePlace'
import { generatePlaceMetadata } from '@/utils/metadataHelpers'

export const generateMetadata = async ({ params }) => {
    const resolvedParams = await params
    const slug = resolvedParams?.slug
    if (!slug) return { title: 'Place | Arablaza' }
    return await generatePlaceMetadata(slug)
}

const page = () => {
    return (
        <Layout>
            <SinglePlace />
        </Layout>
    )
}

export default page
