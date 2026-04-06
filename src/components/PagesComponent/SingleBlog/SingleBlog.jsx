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
import { getBlogTagsApi, getBlogsApi, allItemApi } from "@/utils/api"
import { useEffect, useState, useRef } from "react"
import { store } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
// import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent"
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice"
// Ali has commented it cause it is not used or not have to import it - Redundant import, already imported globally
import { BiLink, BiLogoFacebook, BiLogoWhatsapp } from "react-icons/bi"
// import { BiLink, BiLogoFacebook, BiLogoLinkedin, BiLogoWhatsapp, BiPhoneCall } from "react-icons/bi"
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from "react-share"
import { RiTwitterXLine } from "react-icons/ri"
import toast from "react-hot-toast"
// import parse, { domToReact } from 'html-react-parser';
import Link from "next/link"
import React from "react"
import ProductCard from "@/components/Cards/ProductCard"
import { userSignUpData } from "@/redux/reuducer/authSlice"
// Ali has commented it cause it is not used or not have to import it - Redundant import, already imported globally
// import { toggleLoginModal } from "@/redux/reuducer/globalStateSlice"
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
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
    const [blogItems, setBlogItems] = useState([])
    const [isLoadingItems, setIsLoadingItems] = useState(false)
    const [isMobileDevice, setIsMobileDevice] = useState(false)
    const sectionSwiperRefs = useRef({})
    const [sectionNavStates, setSectionNavStates] = useState({})
    const mainItemsSwiperRef = useRef()
    const [mainItemsNavState, setMainItemsNavState] = useState({ isBeginning: true, isEnd: false })
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

    const getBlogItems = async (itemIds) => {
        if (!itemIds) return;

        // Handle different formats: array, comma-separated string, or single value
        let idsArray = [];
        if (Array.isArray(itemIds)) {
            idsArray = itemIds.filter(id => id != null && id !== '');
        } else if (typeof itemIds === 'string') {
            // Split comma-separated string into array
            idsArray = itemIds.split(',').map(id => id.trim()).filter(id => id !== '');
        } else {
            idsArray = [String(itemIds)];
        }

        if (idsArray.length === 0) return;

        setIsLoadingItems(true);
        try {
            // Try fetching all items at once first with comma-separated IDs
            const idsString = idsArray.join(',');
            const res = await allItemApi.getItems({ id: idsString, limit: 100 });

            let items = [];
            if (res?.data?.error !== true) {
                // When using id parameter, items are directly in res.data.data (array)
                // When using other parameters, items are in res.data.data.data
                if (Array.isArray(res?.data?.data)) {
                    items = res.data.data;
                } else if (Array.isArray(res?.data?.data?.data)) {
                    items = res.data.data.data;
                }
            }

            // If we didn't get all items, try fetching each ID individually
            if (items.length < idsArray.length) {
                console.log(`Only got ${items.length} items out of ${idsArray.length} requested. Fetching individually...`);
                const fetchedIds = new Set(items.map(item => item.id));
                const missingIds = idsArray.filter(id => !fetchedIds.has(Number(id)));

                // Fetch missing items individually
                const individualPromises = missingIds.map(async (id) => {
                    try {
                        const individualRes = await allItemApi.getItems({ id: String(id) });
                        if (individualRes?.data?.error !== true) {
                            if (Array.isArray(individualRes?.data?.data)) {
                                return individualRes.data.data[0] || null;
                            } else if (Array.isArray(individualRes?.data?.data?.data)) {
                                return individualRes.data.data.data[0] || null;
                            }
                        }
                    } catch (error) {
                        console.log(`Error fetching item ${id}:`, error);
                    }
                    return null;
                });

                const individualItems = await Promise.all(individualPromises);
                const validIndividualItems = individualItems.filter(item => item !== null);
                items = [...items, ...validIndividualItems];
            }

            console.log(`Total items fetched: ${items.length} out of ${idsArray.length} requested`);
            setBlogItems(items);
        } catch (error) {
            console.log('Error fetching blog items:', error);
        } finally {
            setIsLoadingItems(false);
        }
    }

    useEffect(() => {
        if (blogData?.item_ids) {
            getBlogItems(blogData.item_ids);
        } else {
            setBlogItems([]);
        }
    }, [blogData?.item_ids])

    const handleLike = (id) => {
        setBlogItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, is_liked: !item.is_liked } : item
            )
        );
    }

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

    const swipePrev = (sectionIndex) => {
        const ref = sectionSwiperRefs.current[`section_${sectionIndex}`];
        if (ref?.current) {
            ref.current.slidePrev();
        }
    }

    const swipeNext = (sectionIndex) => {
        const ref = sectionSwiperRefs.current[`section_${sectionIndex}`];
        if (ref?.current) {
            ref.current.slideNext();
        }
    }

    const handleSectionSlideChange = (sectionIndex) => {
        const ref = sectionSwiperRefs.current[`section_${sectionIndex}`];
        if (ref?.current) {
            setSectionNavStates(prev => ({
                ...prev,
                [`section_${sectionIndex}`]: {
                    isBeginning: ref.current.isBeginning,
                    isEnd: ref.current.isEnd
                }
            }));
        }
    }

    const swipeMainItemsPrev = () => {
        if (mainItemsSwiperRef.current) {
            mainItemsSwiperRef.current.slidePrev();
        }
    }

    const swipeMainItemsNext = () => {
        if (mainItemsSwiperRef.current) {
            mainItemsSwiperRef.current.slideNext();
        }
    }

    const handleMainItemsSlideChange = () => {
        if (mainItemsSwiperRef.current) {
            setMainItemsNavState({
                isBeginning: mainItemsSwiperRef.current.isBeginning,
                isEnd: mainItemsSwiperRef.current.isEnd
            });
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
            toast.success(t("copyToClipboard"));
        } catch (error) {
            console.error("Error copying to clipboard:", error);
        }
    };




    return (
        <>
            {/* <BreadcrumbComponent /> */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    body{
                        overflow: clip !important;
                    }
                    .blog_sidebar_card .product_card {
                        border: none !important;
                        padding: 0 !important;
                        gap: 6px !important;
                    }
                    .blog_sidebar_card .product_card_prod_img {
                        aspect-ratio: 1/0.75 !important;
                        border-radius: 8px !important;
                    }
                    .blog_sidebar_card .product_card_prod_price {
                        font-size: 15px !important;
                    }
                    .blog_sidebar_card .product_card_prod_name {
                        font-size: 14px !important;
                        line-height: 1.4 !important;
                    }
                    .blog_sidebar_card .product_card_prod_det {
                        font-size: 12px !important;
                    }
                    .blog_sidebar_card .product_card_prod_date {
                        font-size: 11px !important;
                    }
                    .blog_sidebar_card .product_card_black_heart_cont {
                        width: 36px !important;
                        height: 36px !important;
                        right: 6px !important;
                        top: 6px !important;
                    }
                    .blog_sidebar_card .product_card_black_heart_cont button {
                        width: 100% !important;
                        height: 100% !important;
                    }
                    .blog_sidebar_card .like_icon {
                        width: 18px !important;
                        height: 18px !important;
                    }
                    .blog_section_swiper_container,
                    .blog_main_items_swiper_container {
                        /* padding: 0 50px; */
                    }
                    .blog_section_nav_arrow,
                    .blog_main_items_nav_arrow {
                        transition: opacity 0.3s ease;
                    }
                    .blog_section_nav_arrow.hideArrow,
                    .blog_main_items_nav_arrow.hideArrow {
                        opacity: 0;
                        pointer-events: none;
                    }
                    .blog_section_nav_arrow:hover,
                    .blog_main_items_nav_arrow:hover {
                        background-color: rgba(255, 255, 255, 1) !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
                    }
                    .row {
                        /* margin-right: 0px !important;
                        margin-left: 0px !important;*/
                    }
                    @media (max-width: 768px) {
                        .blog_section_swiper_container,
                        .blog_main_items_swiper_container {
                           /* padding: 0 40px; */
                        }
                        .blog_section_nav_arrow,
                        .blog_main_items_nav_arrow {
                            width: 35px !important;
                            height: 35px !important;
                        }
                    }
                    /* CMS generated HTML styles to avoid iframe requirement */
                    .blog_html_content img {
                        max-width: 100% !important;
                        height: auto !important;
                        display: block;
                        margin: 10px 0;
                        border-radius: 8px;
                    }
                    .blog_html_content iframe {
                        max-width: 100% !important;
                    }
                    .blog_html_content a {
                        color: #0056b3;
                        text-decoration: underline;
                    }
                    .blog_html_content p {
                        margin-bottom: 15px;
                        line-height: 1.6;
                    }
                `
            }} />
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
                            {(blogData?.item_ids?.length > 0) && (
                                <div className="blog_main_items" style={{ marginTop: '1rem', marginBottom: '1rem', minHeight: '430px', position: 'relative' }}>
                                    {(isLoadingItems || blogItems?.length === 0) ? (
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                            <div className="loader"></div>
                                        </div>
                                    ) : (
                                        blogItems.length >= 2 ? (
                                            <div className="blog_main_items_swiper_container" style={{ position: 'relative' }}>
                                                <Swiper
                                                    dir={isRtl ? "rtl" : "ltr"}
                                                    className="blog_main_items_swiper"
                                                    slidesPerView={Math.min(2, blogItems.length)}
                                                    spaceBetween={20}
                                                    breakpoints={{
                                                        0: { slidesPerView: 1, spaceBetween: 12 },
                                                        576: { slidesPerView: Math.min(2, blogItems.length), spaceBetween: 16 },
                                                        768: { slidesPerView: Math.min(3, blogItems.length), spaceBetween: 20 },
                                                        992: { slidesPerView: 4, spaceBetween: 24 },
                                                        1200: { slidesPerView: 4, spaceBetween: 30 },
                                                    }}
                                                    onSlideChange={handleMainItemsSlideChange}
                                                    modules={[FreeMode]}
                                                    freeMode={true}
                                                    onSwiper={(swiper) => {
                                                        mainItemsSwiperRef.current = swiper;
                                                        setMainItemsNavState({
                                                            isBeginning: swiper.isBeginning,
                                                            isEnd: swiper.isEnd
                                                        });
                                                    }}
                                                    key={`main_${isRtl}`}
                                                >
                                                    {blogItems.map((item, itemIndex) => (
                                                        <SwiperSlide key={itemIndex}>
                                                            <ProductCard
                                                                data={item}
                                                                handleLike={handleLike}
                                                            />
                                                        </SwiperSlide>
                                                    ))}
                                                </Swiper>

                                                {/* Navigation Arrows - Hide based on slide position */}
                                                <div
                                                    className={`blog_main_items_nav_arrow blog_main_items_nav_prev ${mainItemsNavState.isBeginning ? "hideArrow" : ""
                                                        }`}
                                                    onClick={swipeMainItemsPrev}
                                                    style={{
                                                        position: 'absolute',
                                                        left: isRtl ? 'auto' : '10px',
                                                        right: isRtl ? '10px' : 'auto',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        zIndex: 10,
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {isRtl ? <FaArrowRight size={20} color="#333" /> : <FaArrowLeft size={20} color="#333" />}
                                                </div>
                                                <div
                                                    className={`blog_main_items_nav_arrow blog_main_items_nav_next ${mainItemsNavState.isEnd ? "hideArrow" : ""
                                                        }`}
                                                    onClick={swipeMainItemsNext}
                                                    style={{
                                                        position: 'absolute',
                                                        right: isRtl ? 'auto' : '10px',
                                                        left: isRtl ? '10px' : 'auto',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        zIndex: 10,
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {isRtl ? <FaArrowLeft size={20} color="#333" /> : <FaArrowRight size={20} color="#333" />}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="blog_main_items_swiper_container" style={{ position: 'relative' }}>
                                                <Swiper
                                                    dir={isRtl ? "rtl" : "ltr"}
                                                    className="blog_main_items_swiper"
                                                    slidesPerView={1}
                                                    spaceBetween={12}
                                                    breakpoints={{
                                                        0: { slidesPerView: 1, spaceBetween: 12 },
                                                        576: { slidesPerView: 2, spaceBetween: 16 },
                                                        768: { slidesPerView: 3, spaceBetween: 20 },
                                                        992: { slidesPerView: 4, spaceBetween: 24 },
                                                        1200: { slidesPerView: 4, spaceBetween: 30 },
                                                    }}
                                                    modules={[FreeMode]}
                                                    freeMode={true}
                                                    allowTouchMove={false}
                                                    // centeredSlides={true}
                                                    key={`main_single_${isRtl}`}
                                                >
                                                    <SwiperSlide>
                                                        <ProductCard
                                                            data={blogItems[0]}
                                                            handleLike={handleLike}
                                                        />
                                                    </SwiperSlide>
                                                </Swiper>
                                            </div>
                                        )
                                    )}
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

                                                {/* Section Items Carousel - EXACT SAME AS MAIN ITEMS */}
                                                {section.items && section.items.length > 0 && (
                                                    <div className="blog_section_items" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                                        {section.items.length >= 2 ? (
                                                            <div className="blog_section_swiper_container" style={{ position: 'relative' }}>
                                                                <Swiper
                                                                    dir={isRtl ? "rtl" : "ltr"}
                                                                    className="blog_section_swiper"
                                                                    slidesPerView={Math.min(2, section.items.length)}
                                                                    spaceBetween={20}
                                                                    breakpoints={{
                                                                        0: { slidesPerView: 1, spaceBetween: 12 },
                                                                        576: { slidesPerView: Math.min(2, section.items.length), spaceBetween: 16 },
                                                                        768: { slidesPerView: Math.min(3, section.items.length), spaceBetween: 20 },
                                                                        992: { slidesPerView: 4, spaceBetween: 24 },
                                                                        1200: { slidesPerView: 4, spaceBetween: 30 },
                                                                    }}
                                                                    onSlideChange={() => handleSectionSlideChange(sectionIndex)}
                                                                    modules={[FreeMode]}
                                                                    freeMode={true}
                                                                    onSwiper={(swiper) => {
                                                                        const refKey = `section_${sectionIndex}`;
                                                                        sectionSwiperRefs.current[refKey] = { current: swiper };
                                                                        setSectionNavStates(prev => ({
                                                                            ...prev,
                                                                            [refKey]: {
                                                                                isBeginning: swiper.isBeginning,
                                                                                isEnd: swiper.isEnd
                                                                            }
                                                                        }));
                                                                    }}
                                                                    key={`section_${sectionIndex}_${isRtl}`}
                                                                >
                                                                    {section.items.map((item, itemIndex) => (
                                                                        <SwiperSlide key={itemIndex}>
                                                                            <ProductCard
                                                                                data={item}
                                                                                handleLike={(id) => handleSectionLike(sectionIndex, id)}
                                                                            />
                                                                        </SwiperSlide>
                                                                    ))}
                                                                </Swiper>

                                                                {/* Navigation Arrows - Hide based on slide position */}
                                                                <div
                                                                    className={`blog_section_nav_arrow blog_section_nav_prev ${sectionNavStates[`section_${sectionIndex}`]?.isBeginning ? "hideArrow" : ""
                                                                        }`}
                                                                    onClick={() => swipePrev(sectionIndex)}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left: isRtl ? 'auto' : '10px',
                                                                        right: isRtl ? '10px' : 'auto',
                                                                        top: '50%',
                                                                        transform: 'translateY(-50%)',
                                                                        zIndex: 10,
                                                                        width: '40px',
                                                                        height: '40px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease'
                                                                    }}
                                                                >
                                                                    {isRtl ? <FaArrowRight size={20} color="#333" /> : <FaArrowLeft size={20} color="#333" />}
                                                                </div>
                                                                <div
                                                                    className={`blog_section_nav_arrow blog_section_nav_next ${sectionNavStates[`section_${sectionIndex}`]?.isEnd ? "hideArrow" : ""
                                                                        }`}
                                                                    onClick={() => swipeNext(sectionIndex)}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        right: isRtl ? 'auto' : '10px',
                                                                        left: isRtl ? '10px' : 'auto',
                                                                        top: '50%',
                                                                        transform: 'translateY(-50%)',
                                                                        zIndex: 10,
                                                                        width: '40px',
                                                                        height: '40px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease'
                                                                    }}
                                                                >
                                                                    {isRtl ? <FaArrowLeft size={20} color="#333" /> : <FaArrowRight size={20} color="#333" />}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="blog_section_swiper_container" style={{ position: 'relative' }}>
                                                                <Swiper
                                                                    dir={isRtl ? "rtl" : "ltr"}
                                                                    className="blog_section_swiper"
                                                                    slidesPerView={1}
                                                                    spaceBetween={12}
                                                                    breakpoints={{
                                                                        0: { slidesPerView: 1, spaceBetween: 12 },
                                                                        576: { slidesPerView: 2, spaceBetween: 16 },
                                                                        768: { slidesPerView: 3, spaceBetween: 20 },
                                                                        992: { slidesPerView: 4, spaceBetween: 24 },
                                                                        1200: { slidesPerView: 4, spaceBetween: 30 },
                                                                    }}
                                                                    modules={[FreeMode]}
                                                                    freeMode={true}
                                                                    allowTouchMove={false}
                                                                    // centeredSlides={true}
                                                                    key={`section_single_${sectionIndex}_${isRtl}`}
                                                                >
                                                                    <SwiperSlide>
                                                                        <ProductCard
                                                                            data={section.items[0]}
                                                                            handleLike={(id) => handleSectionLike(sectionIndex, id)}
                                                                        />
                                                                    </SwiperSlide>
                                                                </Swiper>
                                                            </div>
                                                        )}
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

                            <div className="link_tag_cont" style={{ marginTop: '1rem' }}>
                                <div className="share_cont">
                                    <p className="share_blog">{t('shareThisBlogOnSocialMedia')}</p>
                                    <div className="share_icons_cont">
                                        <button onClick={handleCopyUrl} className="copyClipboardBtn">
                                            <BiLink size={24} color="#595B6C" />
                                        </button>

                                        <FacebookShareButton url={currentUrl} title={currentUrl + CompanyName} hashtag={CompanyName}>
                                            <BiLogoFacebook size={24} color="#595B6C" />
                                        </FacebookShareButton>


                                        <TwitterShareButton url={currentUrl}>
                                            <RiTwitterXLine size={21} color="#595B6C" />
                                        </TwitterShareButton>

                                        <WhatsappShareButton url={currentUrl} title={blogData?.title + "" + " - " + "" + CompanyName} hashtag={CompanyName}>
                                            <BiLogoWhatsapp size={24} color="#595B6C" />
                                        </WhatsappShareButton>
                                    </div>
                                </div>
                                {/* {blogData?.tags &&
                                    <div className="tags_item_wrapper single_blog_tag_wrapper">
                                        {blogData?.tags?.map((e, index) => (
                                            <span key={index}>
                                                {e}
                                            </span>
                                        ))}
                                    </div>
                                } */}
                            </div>
                        </div>
                    </div>

                    {/* Tags Sidebar */}
                    <div className="col-12">
                        <div className="our_blog_rightbar_wrapper" style={{ marginTop: '2rem' }}>
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
                        <div className="row product_card_card_gap home_blogs_row">
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