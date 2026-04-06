'use client'
import OurBlogCard from "@/components/Cards/OurBlogCard"
import Tags from "@/components/OurBlogPage/Tags"
import Image from "next/image"
// Ali has commented it cause it is not used or not have to import it - Redundant import, already imported globally
import { FaEye, FaRegCalendarCheck } from "react-icons/fa6"
// import { FaEye, FaRegCalendarCheck, FaWhatsapp } from "react-icons/fa6"
// Ali has commented it cause it is not used or not have to import it - Redundant import, already imported globally
import { formatDateMonth, t, truncate, getCompressedImage, normalizeImageUrl } from "@/utils"
// import { formatDateMonth, placeholderImage, t, truncate, isLogin } from "@/utils"
import { useParams, usePathname } from "next/navigation"
import { getBlogTagsApi, getBlogsApi } from "@/utils/api"
import { useEffect, useState, useRef } from "react"
import { store } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
// import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent"
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice"
// Ali has commented it cause it is not used or not have to import it - Redundant import, already imported globally




// import parse, { domToReact } from 'html-react-parser';
import Link from "next/link"
import React from "react"
import dynamic from 'next/dynamic'
const BlogSocialShare = dynamic(() => import('./BlogSocialShare'), { ssr: false })
const BlogProductsCarousel = dynamic(() => import('./BlogProductsCarousel'), { ssr: false })

import { userSignUpData } from "@/redux/reuducer/authSlice"
// Ali has commented it cause it is not used or not have to import it - Redundant import, already imported globally
// import { toggleLoginModal } from "@/redux/reuducer/globalStateSlice"




import { useIsRtl } from '@/utils';


const SingleBlog = ({ initialBlogData, initialRelatedBlogs, initialTags }) => {

    const dispatch = useDispatch()
    const router = useParams()
    // Slug from URL: decode if percent-encoded (e.g. /blogs/%D9%85%D9%85) so we always have the actual string for the API
    const rawSlug = router?.slug
    const blogSlug = typeof rawSlug === 'string' && rawSlug.includes('%')
        ? decodeURIComponent(rawSlug)
        : (rawSlug || '')
    const settingsData = store.getState().Settings?.data
    const admin = settingsData?.data?.admin
    const path = usePathname()
    const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
    const CompanyName = settingsData?.data?.company_name
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const userData = useSelector(userSignUpData)
    const placeholderImageUrl = settingsData?.data?.placeholder_image || '/assets/Transperant_Placeholder.png'
    
    const [blogData, setBlogData] = useState(initialBlogData || {})
    const [blogTags, setBlogTags] = useState(initialTags || [])
    const [relatedBlogs, setRelatedBlogs] = useState(initialRelatedBlogs || [])

    const [isMobileDevice, setIsMobileDevice] = useState(false)
    const isRtl = useIsRtl()

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsMobileDevice(
                /Mobi|Android|iP(hone|od|ad)|Phone/i.test(
                    window.navigator?.userAgent || ""
                )
            );
        }
    }, []);

    const getBlogsData = async () => {
        if (!blogSlug || typeof blogSlug !== 'string' || blogSlug.trim() === '') return;
        try {
           // Pass slug as-is; Axios encodes it in the query string so API receives correct UTF-8
           const res = await getBlogsApi.getBlogs({ slug: blogSlug.trim(), hub: 'web' })
            const firstBlog = res?.data?.data?.data?.[0]
            setBlogData(firstBlog ?? {})
            const title = firstBlog?.title
            if (title) {
                dispatch(setBreadcrumbPath([{
                    name: t("ourBlogs"),
                    slug: '/blogs'
                }, {
                    name: truncate(title, 30)
                }]))
            }
            setRelatedBlogs(res?.data?.other_blogs ?? [])

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (blogSlug && (!initialBlogData || Object.keys(initialBlogData).length === 0)) {
            getBlogsData()
        }
        
        // Dispatch breadcrumb if we already have the title from initialBlogData
        if (initialBlogData?.title) {
            dispatch(setBreadcrumbPath([{
                name: t("ourBlogs"),
                slug: '/blogs'
            }, {
                name: truncate(initialBlogData.title, 30)
            }]))
        }
    }, [blogSlug, initialBlogData])



    const handleSectionLike = (sectionIndex, itemId) => {
        if (blogData?.sections && blogData.sections[sectionIndex]) {
            const updatedSections = blogData.sections.map((section, idx) => {
                if (idx === sectionIndex && section.items) {
                    return {
                        ...section,
                        items: section.items.map(item =>
                            item.id === itemId ? { ...item, is_liked: !item.is_liked } : item
                        )
                    };
                }
                return section;
            });
            setBlogData({ ...blogData, sections: updatedSections });
        }
    }

                            // Helper function to format phone numbers and create WhatsApp link
    const getContactInfo = (item) => {
        const itemPhone = item?.phone;
        const itemCountryCode = item?.country_code;
        // const canShowContact =
        //     (item?.user?.show_personal_details === 1 ||
        //         item?.show_personal_details === 1) &&
        //     itemPhone;

        // if (!canShowContact) {
        //     return { canShow: false, telNumber: "", whatsappLink: "" };
        // }

        const rawCountryCode = itemCountryCode || "";
        const rawPhone = itemPhone || "";
        const trimmedCountryCode = rawCountryCode.trim();
        const digitsCountryCode = trimmedCountryCode.replace(/[^\d+]/g, "");
        const digitsOnlyPhone = rawPhone.replace(/\D/g, "");

        const telNumber = `${digitsCountryCode}${digitsOnlyPhone}`.replace(/\s+/g, "");
        const whatsappNumber = `${digitsCountryCode}${digitsOnlyPhone}`.replace(/\D/g, "");

        const applicationName = settingsData?.data?.application_name || CompanyName || "Arablaza";
        const itemUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/product-details/${item?.slug}`;
        const intro = (t("whatsappMessageIntro") || "").replace(/\{\{appName\}\}/g, applicationName);
        const outreachMessage = itemUrl ? `${intro}\n\n${itemUrl}` : intro;

        const whatsappLink = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(outreachMessage)}`
            : "";

        return { /*canShow: true,*/ telNumber, whatsappLink };
    }

    const handleCallClick = (item) => {
        const contactInfo = getContactInfo(item);
        if (/*!contactInfo.canShow ||*/ !contactInfo.telNumber) return;

        const telUrl = `tel:${contactInfo.telNumber}`;
        if (typeof window === "undefined") return;
        if (isMobileDevice) {
            window.location.href = telUrl;
        } else {
            window.open(telUrl, "_self");
        }
    };

    const handleWhatsappClick = (item) => {
        const contactInfo = getContactInfo(item);
        if (/*!contactInfo.canShow ||*/ !contactInfo.whatsappLink) return;

        if (typeof window === "undefined") return;
        window.open(contactInfo.whatsappLink, "_blank");
    };
    const getBlogTagsData = async () => {
        if (blogTags && blogTags.length > 0) return; // Prevent network rewrite if we have server data
        try {
            const res = await getBlogTagsApi.getBlogs({})
            setBlogTags(res?.data?.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!initialTags || initialTags.length === 0) {
            getBlogTagsData()
        }
    }, [initialTags])

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            const { toast } = await import('react-hot-toast');
            toast.success(t("copyToClipboard"));
        } catch (error) {
            console.error("Error copying to clipboard:", error);
        }
    };




    return (
        <>
            {/* <BreadcrumbComponent /> */}
            <div className="single_blog">
                <div className="row">
                    <div className="col-12">
                        <div className="blog_content">
                            {blogData?.show_title !== 0 && blogData?.show_title !== false && (
                                <h2 className="blog_heading" style={{ marginTop: '30px' }}>{blogData?.title}</h2>
                            )}
                            {blogData?.show_image !== 0 && blogData?.show_image !== false && (() => {
                                // Use 'large' compressed image for blog page, fallback to original if compressed doesn't exist
                                const compressedLarge = getCompressedImage(blogData, 'large', blogData?.image);
                                const finalImage = (compressedLarge && compressedLarge !== blogData?.image) ? compressedLarge : (blogData?.image || null);
                                // Only show image if it exists - don't show placeholder
                                if (finalImage) {
                                    return (
                                        <Image
                                            priority={true}
                                            fetchPriority="high"
                                            src={normalizeImageUrl(finalImage)}
                                            width={838}
                                            height={500}
                                            className="blog_main_img"
                                            alt={blogData?.title || "Blog Image"}
                                            onError={(e) => {
                                                // Hide image on error instead of showing placeholder
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    );
                                }
                                return null;
                            })()}

                            <div 
                                className="blog_html_content" 
                                dangerouslySetInnerHTML={{ __html: blogData?.description || '' }} 
                                suppressHydrationWarning={true}
                            />

                            {/* Main Blog Items Slider */}
                            {blogData?.item_ids && blogData?.item_ids.length > 0 && (
                                <div className="row my_prop_title_spacing">
                                    <h4 className="pop_cat_head">{t('blogFeaturedProducts')}</h4>
                                    <div className="col-12 mt-3">
                                        <BlogProductsCarousel 
                                            itemIds={blogData.item_ids} 
                                            isRtl={isRtl} 
                                        />
                                    </div>
                                </div>
                            )}


                            {/* Blog Sections */}

                            {blogData?.sections && blogData.sections.length > 0 && (
                                <div className="blog_sections_container" style={{ marginTop: '1rem' }}>
                                    {blogData.sections.map((section, sectionIndex) => {
                                        // Debug: Log section items to verify data structure
                                        if (section.items && section.items.length > 0) {
                                            // console.log(`Section ${sectionIndex} items:`, section.items[0]);
                                        }
                                        return (
                                            <div
                                                key={sectionIndex}
                                                className="blog_section_item"
                                                style={{
                                                    marginBottom: '1rem',
                                                    paddingBottom: '1rem',
                                                    // borderBottom: sectionIndex < blogData.sections.length - 1 ? '1px solid #e0e0e0' : 'none'
                                                }}
                                            >
                                                {/* Section Description */}
                                                {section.description && (
                                                    <div className="blog_section_description" style={{ marginBottom: '2rem' }}>
                                                        <div 
                                                            className="blog_html_content" 
                                                            dangerouslySetInnerHTML={{ __html: section.description || '' }} 
                                                        />
                                                    </div>
                                                )}

                                                {/* Section Items Carousel */}
                                                {section.items && section.items.length > 0 && (
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
                                        );
                                    })}
                                </div>
                            )}

                            <div className="admin_details" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                {/* <div className="admin_img_cont">
                                    <Image
                                        loading="lazy"
                                        src={admin?.profile && admin?.profile.trim() !== '' ? admin.profile : placeholderImageUrl}
                                        width={28}
                                        height={28}
                                        alt={admin?.name || "Admin"}
                                        className="admin_img"
                                        onError={(e) => {
                                            if (e.target.src !== placeholderImageUrl) {
                                                e.target.src = placeholderImageUrl;
                                            }
                                        }}
                                    />
                                    <p>{admin?.name}</p>
                                </div> */}
                                <div className="vLine"></div>
                                {blogData?.views !== 0 &&
                                    <>
                                        <div className="date_of_blog_cont">
                                            <FaEye size={16} color="rgba(0, 0, 0, 0.64)" />
                                            <p className="date_of_blog">{t('views')}: {blogData?.views}</p>
                                        </div>
                                        <div className="vLine"></div>
                                    </>
                                }
                                {/* Date on single blog page - re-enable to show again
                                <div className="date_of_blog_cont">
                                    <FaRegCalendarCheck size={16} color="rgba(0, 0, 0, 0.64)" />
                                    <p className="date_of_blog">{t('postedOn')}: {formatDateMonth(blogData?.created_at)}</p>
                                </div>
                                */}
                            </div>
                            <BlogSocialShare blogUrl={currentUrl} blogTitle={blogData?.title} CompanyName={CompanyName} />
                        </div>
                    </div>

                    {/* Tags Sidebar */}
                    <div className="col-12">
                        <div className="our_blog_rightbar_wrapper" style={{ marginTop: '2rem', minHeight: blogTags?.length > 0 ? undefined : '0px' }}>
                            {blogTags && blogTags?.length > 0 &&
                                <Tags data={blogTags} />
                            }
                        </div>
                    </div>
                </div>
                {relatedBlogs && relatedBlogs.length > 0 &&
                    <>
                        <div className="row my_prop_title_spacing">
                            <h4 className="pop_cat_head">{t('relatedArticle')}</h4>
                        </div>
                        <div className="row product_card_card_gap home_blogs_row" style={{ contain: 'layout' }}>
                            {relatedBlogs.map((data, index) => (
                                <div className="col-12 col-lg-4" key={data?.id ?? data?.slug ?? index}>
                                    <OurBlogCard data={data} showMeta priority={index === 0 && !blogData?.show_image} />
                                </div>
                            ))}
                        </div>
                    </>
                }
            </div >
        </>
    )
}

export default SingleBlog