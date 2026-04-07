import Tags from "@/components/OurBlogPage/Tags"
import Image from "next/image"
import { FaEye } from "react-icons/fa6"
import { truncate } from "@/utils/textUtils"
import { getCompressedImage, normalizeImageUrl } from "@/utils/imageUtils"
import Link from "next/link"
import React from "react"
import { 
  BlogSocialShareWrapper as BlogSocialShare,
  BlogProductsCarouselWrapper as BlogProductsCarousel,
  RelatedArticlesWrapper as RelatedArticles
} from './BlogClientWrappers'
import BlogBreadcrumbHandler from './BlogBreadcrumbHandler'
import BlogCopyUrl from './BlogCopyUrl'

const SingleBlog = ({ 
    initialBlogData, 
    initialRelatedBlogs, 
    initialTags, 
    settings, 
    isRtl, 
    t, 
    currentUrl 
}) => {
    // ─── Data Preparation ──────────────────────────────────────────────────
    const blogData = initialBlogData || {}
    const blogTags = initialTags || []
    const relatedBlogs = initialRelatedBlogs || []
    const CompanyName = settings?.company_name || "Arablaza"

    return (
        <>
            {/* ✅ Side Effect Handler (Client Component) */}
            <BlogBreadcrumbHandler title={blogData?.title} tOurBlogs={t.ourBlogs} />

            <div className="single_blog">
                <div className="row">
                    <div className="col-12">
                        <div className="blog_content">

                            {/* Title */}
                            {(blogData?.show_title !== 0 && blogData?.show_title !== false) && (
                                <h2 className="blog_heading" style={{ marginTop: '30px' }}>
                                    {blogData?.title}
                                </h2>
                            )}

                            {/* Main Image */}
                            {(blogData?.show_image !== 0 && blogData?.show_image !== false) && (() => {
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
                                        blurDataURL="data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA="
                                        src={normalizeImageUrl(finalImage)}
                                        width={838}
                                        height={500}
                                        className="blog_main_img"
                                        alt={blogData?.title || "Blog Image"}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                        loading="eager"
                                        quality={75}
                                        sizes="(max-width: 768px) 100vw, 838px"
                                    />
                                )
                            })()}

                            {/* HTML Content - Rendered on Server */}
                            <div
                                className="blog_html_content"
                                dangerouslySetInnerHTML={{ 
                                    __html: blogData?.description 
                                        ? blogData.description.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') 
                                        : '' 
                                }}
                                suppressHydrationWarning={true}
                                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
                            />

                            {/* Main Items Carousel */}
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
                                            {/* ✅ Section items: handled internally by carousel client-side state */}
                                            {section.items?.length > 0 && (
                                                <div className="blog_section_items" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                                    <BlogProductsCarousel
                                                        items={section.items}
                                                        isRtl={isRtl}
                                                        containerClassPrefix="blog_section"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Views & Social Share */}
                            <div className="admin_details" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <div className="vLine"></div>
                                {blogData?.views !== 0 && (
                                    <>
                                        <div className="date_of_blog_cont">
                                            <FaEye size={16} color="rgba(0, 0, 0, 0.64)" />
                                            <p className="date_of_blog">{t.views}: {blogData?.views}</p>
                                        </div>
                                        <div className="vLine"></div>
                                    </>
                                )}
                            </div>

                            <BlogSocialShare 
                                blogUrl={currentUrl} 
                                blogTitle={blogData?.title} 
                                CompanyName={CompanyName} 
                                tShare={t.shareInfo}
                                tCopySuccess={t.linkCopied}
                            />
                        </div>
                    </div>

                    {/* Tags Sidebar */}
                    <div className="col-12">
                        <div className="our_blog_rightbar_wrapper" style={{ marginTop: '2rem', minHeight: blogTags?.length > 0 ? undefined : '0px' }}>
                            {blogTags?.length > 0 && <Tags data={blogTags} tTags={t.tags} tAll={t.all} />}
                        </div>
                    </div>
                </div>

                {/* Related Articles */}
                {relatedBlogs?.length > 0 && (
                    <>
                        <div className="row my_prop_title_spacing">
                            <h4 className="pop_cat_head">{t.relatedArticle}</h4>
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
