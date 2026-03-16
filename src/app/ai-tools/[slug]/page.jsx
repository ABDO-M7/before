import React from 'react'
import Layout from '@/components/Layout/Layout'
import SingleAiTool from '@/components/PagesComponent/AiTools/SingleAiTool'
import { generateAiToolMetadata } from '@/utils/metadataHelpers'

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params
  const slug = resolvedParams?.slug
  if (!slug) return { title: 'AI Tool | Arablaza' }
  return await generateAiToolMetadata(slug)
}

const page = () => {
    return (
        <Layout>
            <SingleAiTool />
        </Layout>
    )
}

export default page
