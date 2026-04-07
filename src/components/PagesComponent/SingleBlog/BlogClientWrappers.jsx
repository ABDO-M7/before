'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// ✅ BlogSocialShare - defer social icons + browser-only logic
export const BlogSocialShareWrapper = dynamic(
  () => import('./BlogSocialShare'),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: '40px', opacity: 0.6 }} aria-hidden="true" />
  }
)

// ✅ BlogProductsCarousel - defer Swiper hydration
export const BlogProductsCarouselWrapper = dynamic(
  () => import('./BlogProductsCarousel'),
  {
    ssr: false,
    loading: () => (
      <div 
        className="carousel-skeleton" 
        style={{ 
          minHeight: '430px', 
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'loading 1.5s infinite',
          borderRadius: '12px'
        }} 
        aria-hidden="true"
      />
    )
  }
)

// ✅ RelatedArticles - defer below-the-fold content
export const RelatedArticlesWrapper = dynamic(
  () => import('@/components/Cards/OurBlogCard'),
  {
    ssr: false,
    loading: () => null
  }
)
