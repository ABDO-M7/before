import Tags from "@/components/OurBlogPage/Tags"
import Image from "next/image"
import { FaEye } from "react-icons/fa6"
import { truncate } from "@/utils/textUtils"
import { getCompressedImage, normalizeImageUrl } from "@/utils/imageUtils"
import Link from "next/link"
import React from "react"
import HTMLContentRenderer from "@/components/DynamicHTMLContent/HTMLContentRenderer"
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
    try {
        // ─── Data Preparation ──────────────────────────────────────────────────
        const blogData = initialBlogData || {}
        const blogTags = Array.isArray(initialTags) ? initialTags : []
        const relatedBlogs = Array.isArray(initialRelatedBlogs) ? initialRelatedBlogs : []
        const CompanyName = String(settings?.company_name || "Arablaza")

        const blogBaseHref = (() => {
            try {
                // Prefer currentUrl (canonical) if available; fallback to env.
                if (currentUrl) return new URL(String(currentUrl)).origin;
            } catch {}
            try {
                const envUrl = process.env.NEXT_PUBLIC_WEB_URL;
                if (envUrl) return new URL(String(envUrl)).origin;
            } catch {}
            return undefined;
        })();

        const blogAssetOrigin = (() => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (apiUrl) return new URL(String(apiUrl)).origin;
            } catch {}
            return undefined;
        })();

        const blogDescriptionHtml = blogData?.description ? String(blogData.description) : '';
        const shouldUseIframeRenderer = (() => {
            const html = blogDescriptionHtml;
            if (!html) return false;
            // Use iframe when the content relies on scripts/embeds or common heavy third-party libs.
            return /<script\b|<iframe\b|cdn\.tailwindcss\.com|chart\.js/i.test(html);
        })();

        const shouldInjectTailwindInIframe = (() => {
            const html = blogDescriptionHtml;
            if (!html) return false;
            if (/cdn\.tailwindcss\.com/i.test(html)) return false;
            // Heuristic: Tailwind utility classes commonly used by AI-generated blocks.
            return /class\s*=\s*['"][^'"]*\b(bg-|text-|rounded-|shadow-|grid\b|flex\b|items-center\b|justify-)/i.test(html);
        })();

        const shouldInjectDefaultTableStylesInIframe = (() => {
            const html = blogDescriptionHtml;
            if (!html) return false;
            // If the content contains tables but doesn't appear to bring its own framework,
            // inject a minimal, good-looking table style so it doesn't render as raw HTML.
            const hasTable = /<table\b/i.test(html);
            if (!hasTable) return false;
            const alreadyStyled = /<style\b|<link\b[^>]*rel\s*=\s*['"]stylesheet['"]/i.test(html);
            return !alreadyStyled;
        })();

        const shouldRenderInIframe = shouldUseIframeRenderer || shouldInjectTailwindInIframe || /<table\b/i.test(blogDescriptionHtml);

        return (
            <>
                {/* ✅ Side Effect Handler (Client Component) */}
                <BlogBreadcrumbHandler title={String(blogData?.title || '')} tOurBlogs={t.ourBlogs} />

                <div className="single_blog">
                    <div className="row">
                        <div className="col-12">
                            <div className="blog_content">

                                {/* Title */}
                                {(blogData?.show_title !== 0 && blogData?.show_title !== false) && (
                                    <h2 className="blog_heading" style={{ marginTop: '30px' }}>
                                        {String(blogData?.title || '')}
                                    </h2>
                                )}

                                {/* Main Image */}
                                {(blogData?.show_image !== 0 && blogData?.show_image !== false) && (() => {
                                    try {
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
                                                src={normalizeImageUrl(String(finalImage))}
                                                width={838}
                                                height={500}
                                                className="blog_main_img"
                                                alt={String(blogData?.title || "Blog Image")}
                                                loading="eager"
                                                quality={75}
                                                sizes="(max-width: 768px) 100vw, 838px"
                                            />
                                        )
                                    } catch {
                                        return null;
                                    }
                                })()}

                                {/* HTML Content */}
                                <div className="blog_html_content" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
                                    {shouldRenderInIframe ? (
                                        <HTMLContentRenderer
                                            htmlContent={blogDescriptionHtml}
                                            contentId={`blog-desc-${blogData?.id || blogData?.slug || 'default'}`}
                                            baseHref={blogBaseHref}
                                            assetOrigin={blogAssetOrigin}
                                            placeholderMinHeightPx={800}
                                            deferIframeLoadMs={200}
                                            iframeLoading="lazy"
                                            iframeFetchPriority="auto"
                                            injectGoogleFonts={false}
                                            injectTailwindCdn={shouldInjectTailwindInIframe}
                                            injectDefaultTableStyles={shouldInjectDefaultTableStylesInIframe}
                                            deferUntilInView={true}
                                            inViewRootMarginPx={800}
                                        />
                                    ) : (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: blogDescriptionHtml }}
                                            suppressHydrationWarning={true}
                                        />
                                    )}
                                </div>

                                {/* Main Items Carousel */}
                                {blogData?.item_ids && (
                                    <div className="blog_main_items" style={{ marginTop: '1rem', marginBottom: '1rem', position: 'relative' }}>
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
                                                        <HTMLContentRenderer
                                                            htmlContent={String(section.description || '')}
                                                            contentId={`blog-section-${blogData?.id || blogData?.slug || 'default'}-${sectionIndex}`}
                                                            baseHref={blogBaseHref}
                                                            assetOrigin={blogAssetOrigin}
                                                            placeholderMinHeightPx={800}
                                                            deferIframeLoadMs={200}
                                                            iframeLoading="lazy"
                                                            iframeFetchPriority="auto"
                                                            deferUntilInView={true}
                                                            inViewRootMarginPx={800}
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
                                                <p className="date_of_blog">{String(t.views)}: {blogData?.views}</p>
                                            </div>
                                            <div className="vLine"></div>
                                        </>
                                    )}
                                </div>

                                <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}>
                                    <BlogSocialShare 
                                        blogUrl={String(currentUrl)} 
                                        blogTitle={String(blogData?.title)} 
                                        CompanyName={CompanyName} 
                                        tShare={t.shareInfo}
                                        tCopySuccess={t.linkCopied}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tags Sidebar */}
                        <div className="col-12">
                            <div
                                className="our_blog_rightbar_wrapper"
                                style={{ marginTop: '2rem', minHeight: blogTags?.length > 0 ? '120px' : '0px' }}
                            >
                                {blogTags?.length > 0 && <Tags data={blogTags} tTags={t.tags} tAll={t.all} />}
                            </div>
                        </div>
                    </div>

                    {/* Related Articles */}
                    {relatedBlogs?.length > 0 && (
                        <>
                            <div className="row my_prop_title_spacing">
                                <h4 className="pop_cat_head">{String(t.relatedArticle)}</h4>
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
    } catch (error) {
        console.error("SingleBlog Render Error:", error);
        return <div className="container p-5 text-center"><h3>عذراً، حدث خطأ في عرض المقال</h3></div>;
    }
}

export default SingleBlog;
