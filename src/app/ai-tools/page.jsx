import React from 'react'
import Layout from '@/components/Layout/Layout'
import AiTools from '@/components/PagesComponent/AiTools/AiTools'

export const metadata = {
    title: 'AI Tools | Arablaza',
    description: 'Explore the best AI tools on Arablaza.'
}

const page = () => {
    return (
        <Layout>
            <AiTools />
        </Layout>
    )
}

export default page
