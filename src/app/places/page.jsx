import React from 'react'
import Layout from '@/components/Layout/Layout'
import Places from '@/components/PagesComponent/Places/Places'

export const metadata = {
    title: 'Places | Arablaza',
    description: 'Explore city guides and local highlights on Arablaza.',
}

const page = () => {
    return (
        <Layout>
            <Places />
        </Layout>
    )
}

export default page
