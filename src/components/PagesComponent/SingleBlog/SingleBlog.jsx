'use client'
// import OurBlogCard from "@/components/Cards/OurBlogCard" (Replaced with dynamic import below)
import Tags from "@/components/OurBlogPage/Tags"
import Image from "next/image"
import { FaEye } from "react-icons/fa6"
import { t, truncate, getCompressedImage, normalizeImageUrl } from "@/utils"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice"
import toast from "@/utils/toast";
import Link from "next/link"
import React from "react"
import dynamic from 'next/dynamic'
import { store } from "@/redux/store"
import { useIsRtl } from '@/utils'

const BlogSocialShare = dynamic(
    () => import('./BlogSocialShare'), 
    { 
        ssr: false,
        loading: () => <div style={{ minHeight: '40px' }} /> // ✅ Skeleton بسيط
    }
)

const BlogProductsCarousel = dynamic(
    () => import('./BlogProductsCarousel'), 
    { 
        ssr: false,
        loading: () => <div className="carousel-skeleton" style={{ minHeight: '430px', background: '#f5f5f5' }} />
    }
)

// ✅ أضف هذا للمكونات اللي تحت الـ fold (مثل المقالات ذات الصلة)
const RelatedArticles = dynamic(
    () => import('@/components/Cards/OurBlogCard'),
    { 
        ssr: false,
        loading: () => null 
    }
)

const SingleBlog = ({ initialBlogData, initialRelatedBlogs, initialTags }) => {

    const dispatch = useDispatch()
    const settingsData = store.getState().Settings?.data
    const admin = settingsData?.data?.admin
    const path = usePathname()
    const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`
    const CompanyName = settingsData?.data?.company_name
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const placeholderImageUrl = settingsData?.data?.placeholder_image || '/assets/Transperant_Placeholder.png'
    const isRtl = useIsRtl()

    const [blogData, setBlogData] = useState(initialBlogData || {})
    const [blogTags, setBlogTags] = useState(initialTags || [])
    const [relatedBlogs, setRelatedBlogs] = useState(initialRelatedBlogs || [])

    // ─── Breadcrumb ───────────────────────────────────────────────────────────
    useEffect(() => {
        const title = blogData?.title || initialBlogData?.title
        if (title) {
            dispatch(setBreadcrumbPath([
                { name: t("ourBlogs"), slug: '/blogs' },
                { name: truncate(title, 30) }
            ]))
        }
    }, [blogData?.title])

    // ─── Section like handler ─────────────────────────────────────────────────
    const handleSectionLike = (sectionIndex, itemId) => {
        if (!blogData?.sections?.[sectionIndex]) return
        const updatedSections = blogData.sections.map((section, idx) => {
            if (idx !== sectionIndex || !section.items) return section
            return {
                ...section,
                items: section.items.map(item =>
                    item.id === itemId ? { ...item, is_liked: !item.is_liked } : item
                )
            }
        })
        setBlogData({ ...blogData, sections: updatedSections })
    }

    // ─── Copy URL ─────────────────────────────────────────────────────────────
    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl)
            toast.success(t("copyToClipboard"))
        } catch (error) {
            console.error("Error copying to clipboard:", error)
        }
    }

    // ─── Contact helpers (kept for WhatsApp/call buttons in product cards) ────
    const getContactInfo = (item) => {
        const rawPhone = item?.phone || ""
        const rawCode = item?.country_code || ""
        const digitsCode = rawCode.trim().replace(/[^\d+]/g, "")
        const digitsPhone = rawPhone.replace(/\D/g, "")
        const telNumber = `${digitsCode}${digitsPhone}`.replace(/\s+/g, "")
        const whatsappNumber = `${digitsCode}${digitsPhone}`.replace(/\D/g, "")
        const applicationName = settingsData?.data?.application_name || CompanyName || "Arablaza"
        const itemUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/product-details/${item?.slug}`
        const intro = (t("whatsappMessageIntro") || "").replace(/\{\{appName\}\}/g, applicationName)
        const outreachMessage = itemUrl ? `${intro}\n\n${itemUrl}` : intro
        const whatsappLink = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(outreachMessage)}`
            : ""
        return { telNumber, whatsappLink }
    }

    return (
        <>
            <div className="single_blog">
                <div className="row">
                    <div className="col-12">
                        <div className="blog_content">

                            {/* Title */}
                            {blogData?.show_title !== 0 && blogData?.show_title !== false && (
                                <h2 className="blog_heading" style={{ marginTop: '30px' }}>
                                    {blogData?.title}
                                </h2>
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
                                        placeholder="blur"
                                        blurDataURL="data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=" // ✅ blur أصغر
                                        src={normalizeImageUrl(finalImage)}
                                        width={838}
                                        height={500}
                                        className="blog_main_img"
                                        alt={blogData?.title || "Blog Image"}
                                        onError={(e) => { e.target.style.display = 'none'; e.target.src = placeholderImageUrl; }}
                                        // ✅ تحسينات إضافية
                                        loading="eager"
                                        quality={85} // ✅ رفع الجودة قليلاً لتقليل إعادة التحميل
                                        sizes="(max-width: 768px) 100vw, 838px"
                                    />
                                )
                            })()}

                            {/* HTML Content - مع تحسين الأداء */}
                            <div
                                className="blog_html_content"
                                dangerouslySetInnerHTML={{ 
                                    __html: blogData?.description 
                                        ? blogData.description.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // ✅ إزالة السكربتات
                                        : '' 
                                }}
                                suppressHydrationWarning={true}
                                // ✅ إضافة content-visibility لتسريع rendering المحتوى الطويل
                                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
                            />

                            {/* Main Items Carousel */}
                            {/* ✅ Pass item_ids to carousel — it handles its own fetch client-side */}
                            {blogData?.item_ids && (
                                <div className="blog_main_items" style={{ marginTop: '1rem', marginBottom: '1rem', minHeight: '430px', position: 'relative' }}>
                                    <BlogProductsCarousel
                                        itemIds={blogData.item_ids}
                                        isRtl={isRtl}
                                        containerClassPrefix="blog_main_items"
                                        aboveFold={true}
                                    />
                                </div>
                            )}

                            {/* Blog Sections */}
                            {blogData?.sections?.length > 0 && (
                                <div className="blog_sections_container" style={{ marginTop: '1rem' }}>
                                    {blogData.sections.map((section, sectionIndex) => (
                                        <div
                                            key={sectionIndex}
                                            className="blog_section_item"
                                            style={{ marginBottom: '1rem', paddingBottom: '1rem' }}
                                        >
                                            {section.description && (
                                                <div className="blog_section_description" style={{ marginBottom: '2rem' }}>
                                                    <div
                                                        className="blog_html_content"
                                                        dangerouslySetInnerHTML={{ __html: section.description || '' }}
                                                    />
                                                </div>
                                            )}
                                            {/* ✅ Section items: pass item_ids if available, or use pre-loaded items */}
                                            {section.items?.length > 0 && (
                                                <div className="blog_section_items" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
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
                            <div className="admin_details" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <div className="vLine"></div>
                                {blogData?.views !== 0 && (
                                    <>
                                        <div className="date_of_blog_cont">
                                            <FaEye size={16} color="rgba(0, 0, 0, 0.64)" />
                                            <p className="date_of_blog">{t('views')}: {blogData?.views}</p>
                                        </div>
                                        <div className="vLine"></div>
                                    </>
                                )}
                            </div>

                            <BlogSocialShare blogUrl={currentUrl} blogTitle={blogData?.title} CompanyName={CompanyName} />
                        </div>
                    </div>

                    {/* Tags Sidebar */}
                    <div className="col-12">
                        <div className="our_blog_rightbar_wrapper" style={{ marginTop: '2rem', minHeight: blogTags?.length > 0 ? undefined : '0px' }}>
                            {blogTags?.length > 0 && <Tags data={blogTags} />}
                        </div>
                    </div>
                </div>

                {/* Related Articles */}
                {relatedBlogs?.length > 0 && (
                    <>
                        <div className="row my_prop_title_spacing">
                            <h4 className="pop_cat_head">{t('relatedArticle')}</h4>
                        </div>
                        <div className="row product_card_card_gap home_blogs_row" style={{ contain: 'layout' }}>
                            {relatedBlogs.map((data, index) => (
                                <div className="col-12 col-lg-4" key={data?.id ?? data?.slug ?? index}>
                                    <RelatedArticles data={data} showMeta priority={index === 0 && !blogData?.show_image} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default SingleBlog
