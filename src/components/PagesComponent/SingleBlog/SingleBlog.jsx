'use client'
import React, { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { FaEye, FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import { useDispatch, useSelector } from "react-redux"
import { settingsData } from "@/redux/reuducer/settingSlice"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
import { t, truncate } from "@/utils"
import OurBlogCard from "@/components/Cards/OurBlogCard"
import Tags from "@/components/OurBlogPage/Tags"
import BlogProductsCarousel from "./BlogProductsCarousel"
import BlogSocialShare from "./BlogSocialShare"
import { getCompressedImage, normalizeImageUrl } from "@/utils/imageUtils"

const SingleBlog = ({ initialBlogData, initialRelatedBlogs, initialTags, CompanyName }) => {
    const pathname = usePathname()
    const dispatch = useDispatch()
    const systemSettings = useSelector(settingsData)
    const [currentUrl, setCurrentUrl] = useState("")

    const blogData = initialBlogData
    const relatedBlogs = initialRelatedBlogs
    const blogTags = initialTags

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentUrl(window.location.href)
        }
    }, [])

    useEffect(() => {
        const title = blogData?.title
        if (title) {
            dispatch(setBreadcrumbPath([
                { name: t("ourBlogs"), slug: '/blogs' },
                { name: truncate(title, 30) }
            ]))
        }
    }, [blogData?.title])

    const isRtl = document.documentElement.dir === "rtl"

    const handleSectionLike = (sectionIndex, id) => {
        // Implementation for handling like in sections if needed
    }

    if (!blogData) return null

    return (
        <>
            <section className="single_blog" style={{ overflowX: 'hidden' }}>
                <div className="container">
                    <div className="row">
                        <div className="col-12 col-lg-9 mx-auto">
                            <div className="blog_content">
                                {/* Title */}
                                {blogData?.show_title !== 0 && blogData?.show_title !== false && (
                                    <h1 className="blog_heading" style={{ marginTop: '30px', fontWeight: 'bold' }}>
                                        {blogData?.title}
                                    </h1>
                                )}

                                {/* Main Image */}
                                {blogData?.show_image !== 0 && blogData?.show_image !== false && (() => {
                                    const compressedLarge = getCompressedImage(blogData, 'large', blogData?.image)
                                    const finalImage = (compressedLarge && compressedLarge !== blogData?.image)
                                        ? compressedLarge
                                        : (blogData?.image || null)
                                    if (!finalImage) return null
                                    return (
                                        <Image
                                            priority={true}
                                            fetchPriority="high"
                                            src={normalizeImageUrl(finalImage)}
                                            width={838}
                                            height={500}
                                            className="blog_main_img"
                                            alt={blogData?.title || "Blog Image"}
                                            onError={(e) => { e.target.style.display = 'none' }}
                                            style={{ width: '100%', height: 'auto', borderRadius: '12px', marginBottom: '2rem' }}
                                        />
                                    )
                                })()}

                                {/* HTML Content */}
                                <div
                                    className="blog_html_content"
                                    dangerouslySetInnerHTML={{ __html: blogData?.description || '' }}
                                    suppressHydrationWarning={true}
                                    style={{ wordBreak: 'break-word', overflowX: 'hidden' }}
                                />

                                {/* Main Items Carousel */}
                                {blogData?.item_ids && (
                                    <div className="blog_main_items" style={{ marginTop: '2rem', marginBottom: '2rem', minHeight: '430px', position: 'relative' }}>
                                        <BlogProductsCarousel
                                            itemIds={blogData.item_ids}
                                            isRtl={isRtl}
                                            containerClassPrefix="blog_main_items"
                                        />
                                    </div>
                                )}

                                {/* Blog Sections */}
                                {blogData?.sections?.length > 0 && (
                                    <div className="blog_sections_container" style={{ marginTop: '2rem' }}>
                                        {blogData.sections.map((section, sectionIndex) => (
                                            <div
                                                key={sectionIndex}
                                                className="blog_section_item"
                                                style={{ marginBottom: '2rem' }}
                                            >
                                                {section.description && (
                                                    <div className="blog_section_description" style={{ marginBottom: '1.5rem' }}>
                                                        <div
                                                            className="blog_html_content"
                                                            dangerouslySetInnerHTML={{ __html: section.description || '' }}
                                                        />
                                                    </div>
                                                )}
                                                {section.items?.length > 0 && (
                                                    <div className="blog_section_items">
                                                        <BlogProductsCarousel
                                                            items={section.items}
                                                            isRtl={isRtl}
                                                            handleLike={(id) => handleSectionLike(sectionIndex, id)}
                                                            containerClassPrefix="blog_section"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Views */}
                                <div className="admin_details" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {blogData?.views !== 0 && (
                                        <div className="date_of_blog_cont" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FaEye size={16} color="rgba(0, 0, 0, 0.64)" />
                                            <p className="date_of_blog" style={{ margin: 0 }}>{t('views')}: {blogData?.views}</p>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '2rem' }}>
                                    <BlogSocialShare blogUrl={currentUrl} blogTitle={blogData?.title} CompanyName={CompanyName} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags Section */}
                    {blogTags?.length > 0 && (
                        <div className="row" style={{ marginTop: '3rem' }}>
                            <div className="col-12 col-lg-9 mx-auto">
                                <div className="our_blog_rightbar_wrapper">
                                    <Tags data={blogTags} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Related Articles */}
                    {relatedBlogs?.length > 0 && (
                        <div className="related_articles_section" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
                            <div className="row">
                                <div className="col-12 col-lg-9 mx-auto">
                                    <h4 className="pop_cat_head" style={{ marginBottom: '2rem', fontWeight: 'bold' }}>{t('relatedArticle')}</h4>
                                    <div className="row product_card_card_gap home_blogs_row">
                                        {relatedBlogs.map((data, index) => (
                                            <div className="col-12 col-md-6 col-lg-4 mb-4" key={data?.id ?? data?.slug ?? index}>
                                                <OurBlogCard data={data} showMeta priority={index === 0 && !blogData?.show_image} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    )
}

export default SingleBlog
