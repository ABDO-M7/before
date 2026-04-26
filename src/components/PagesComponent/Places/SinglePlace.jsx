'use client'
import BreadcrumbComponent from '@/components/Breadcrumb/BreadcrumbComponent'
import PlaceCard from '@/components/Cards/PlaceCard'
import Image from 'next/image'
import { FaEye } from 'react-icons/fa6'
import { t, truncate, getCompressedImage, normalizeImageUrl } from '@/utils'
import { useParams, usePathname } from 'next/navigation'
import { getPlacesApi } from '@/utils/api'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setBreadcrumbPath } from '@/redux/reuducer/breadCrumbSlice'
import { BiLink, BiLogoFacebook, BiLogoWhatsapp } from 'react-icons/bi'
import { RiTwitterXLine } from 'react-icons/ri'
import toast from '@/utils/toast'
import React from 'react'
import dynamic from 'next/dynamic'
import BlogProductsCarousel from '@/components/PagesComponent/SingleBlog/BlogProductsCarousel'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice'

const FacebookShareButton = dynamic(() => import('react-share').then((mod) => mod.FacebookShareButton), { ssr: false })
const TwitterShareButton = dynamic(() => import('react-share').then((mod) => mod.TwitterShareButton), { ssr: false })
const WhatsappShareButton = dynamic(() => import('react-share').then((mod) => mod.WhatsappShareButton), { ssr: false })
const HTMLContentRenderer = dynamic(() => import('@/components/DynamicHTMLContent/HTMLContentRenderer'), { ssr: false })

const SinglePlace = () => {
    const dispatch = useDispatch()
    const currentLang = useSelector(CurrentLanguageData)
    const isRtl = Boolean(currentLang?.rtl ?? currentLang?.code === 'ar')
    const [isIframeLoaded, setIsIframeLoaded] = useState(false)
    const router = useParams()
    const rawSlug = router?.slug
    const placeSlug = typeof rawSlug === 'string' && rawSlug.includes('%')
        ? decodeURIComponent(rawSlug)
        : (rawSlug || '')
    const path = usePathname()
    const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`
    const [placeData, setPlaceData] = useState({})
    const [otherPlaces, setOtherPlaces] = useState([])

    const isAr = currentLang?.code === 'ar'
    // const cityName = isAr && placeData?.city?.name_ar ? placeData.city.name_ar : (placeData?.city?.name || '')
    // const stateName = isAr && placeData?.state?.name_ar ? placeData.state.name_ar : (placeData?.state?.name || '')
    // const locationLine = [cityName, stateName].filter(Boolean).join(', ')

    const getPlaceData = async () => {
        if (!placeSlug || typeof placeSlug !== 'string' || placeSlug.trim() === '') return
        try {
            const res = await getPlacesApi.getPlaces({ slug: placeSlug.trim(), hub: 'web' })
            const data = res?.data?.data
            setPlaceData(data || {})
            setOtherPlaces(Array.isArray(res?.data?.other_places) ? res.data.other_places : [])

            const cityName = isAr && data?.city?.name_ar ? data.city.name_ar : (data?.city?.name || '')
            const stateName = isAr && data?.state?.name_ar ? data.state.name_ar : (data?.state?.name || '')

            dispatch(setBreadcrumbPath([
                { name: t('places'), slug: '/places' },
                { name: truncate(stateName, 30), slug: `/places?state=${data?.state?.slug}` },
                { name: truncate(cityName, 30) },
            ]))
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (placeSlug) getPlaceData()
    }, [placeSlug])

    useEffect(() => {
        if (placeData && typeof placeData.description !== 'undefined' && !placeData.description) {
            setIsIframeLoaded(true)
        }
    }, [placeData])

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl)
            toast.success(t('copyToClipboard'))
        } catch (error) {
            console.error('Error copying to clipboard:', error)
        }
    }

    const rawRelated = placeData?.related_items
    const relatedItems = Array.isArray(rawRelated)
        ? rawRelated
        : (rawRelated && typeof rawRelated === 'object' ? Object.values(rawRelated) : [])
    const showRelatedListings = placeData?.show_related_items === true
        || placeData?.show_related_items === 1
        || placeData?.show_related_items === '1'

    return (
        <>
            <BreadcrumbComponent />
            <div className="single_blog">
            <div className="row">
                <div className="col-12">
                    <div className="blog_content">
                        {/* <h2 className="blog_heading">{placeData?.title}</h2> */}
                        {(placeData?.show_title !== 0 && placeData?.show_title !== false) && (
                            <h2 className="blog_heading">{placeData?.title}</h2>
                        )}

                        {/* {locationLine && (
                            <p style={{ color: 'rgba(0,0,0,0.6)', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                {locationLine}
                            </p>
                        )} */}

                        {(placeData?.show_image !== 0 && placeData?.show_image !== false) && placeData?.image && (
                            <Image
                                priority={true}
                                src={normalizeImageUrl(getCompressedImage(placeData, 'large', placeData.image))}
                                width={838}
                                height={500}
                                className="blog_main_img"
                                alt={placeData?.title || ''}
                            />
                        )}

                        <div>
                            <HTMLContentRenderer
                                htmlContent={placeData?.description || ''}
                                contentId={`place-description-${placeSlug}`}
                                injectGoogleFonts={false}
                                onLoadComplete={() => setIsIframeLoaded(true)}
                            />
                        </div>

                        {showRelatedListings && relatedItems.length > 0 && (
                            <div className="blog_main_items" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                                <h4 className="pop_cat_head" style={{ marginBottom: '1rem' }}>{t('listingsInThisArea')}</h4>
                                <BlogProductsCarousel
                                    initialItems={relatedItems}
                                    isRtl={isRtl}
                                    containerClassPrefix="place_related_items"
                                    aboveFold={true}
                                />
                            </div>
                        )}

                        {placeData?.sections?.length > 0 && (
                            <div className="blog_sections_container" style={{ marginTop: '1rem' }}>
                                {placeData.sections.map((section, sectionIndex) => (
                                    section?.description ? (
                                        <div
                                            key={section.id ?? sectionIndex}
                                            className="blog_section_item"
                                            style={{ marginBottom: '1rem', paddingBottom: '1rem' }}
                                        >
                                            <div className="blog_section_description" style={{ marginBottom: '1rem' }}>
                                                <HTMLContentRenderer
                                                    htmlContent={String(section.description || '')}
                                                    contentId={`place-section-${placeData?.id || placeData?.slug || 'default'}-${sectionIndex}`}
                                                    injectGoogleFonts={false}
                                                    onLoadComplete={() => setIsIframeLoaded(true)}
                                                />
                                            </div>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        )}

                        {isIframeLoaded && (
                            <>
                                <div className="admin_details mt-4">
                                    {placeData?.views > 0 && (
                                        <>
                                            <div className="date_of_blog_cont">
                                                <FaEye size={16} color="rgba(0, 0, 0, 0.64)" />
                                                <p className="date_of_blog">{t('views')}: {placeData?.views}</p>
                                            </div>
                                            <div className="vLine"></div>
                                        </>
                                    )}
                                </div>

                                <div className="link_tag_cont mt-4">
                                    <div className="share_cont">
                                        <p className="share_blog">{t('shareThisOnSocialMedia')}</p>
                                        <div className="share_icons_cont">
                                            <button type="button" onClick={handleCopyUrl} className="copyClipboardBtn">
                                                <BiLink size={24} color="#595B6C" />
                                            </button>
                                            <FacebookShareButton url={currentUrl}>
                                                <BiLogoFacebook size={24} color="#595B6C" />
                                            </FacebookShareButton>
                                            <TwitterShareButton url={currentUrl}>
                                                <RiTwitterXLine size={21} color="#595B6C" />
                                            </TwitterShareButton>
                                            <WhatsappShareButton url={currentUrl} title={placeData?.title}>
                                                <BiLogoWhatsapp size={24} color="#595B6C" />
                                            </WhatsappShareButton>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isIframeLoaded && otherPlaces?.length > 0 && (
                <div className="mt-5">
                    <h4 className="pop_cat_head mb-4">{t('relatedPlaces')}</h4>
                    <div className="row blog_separator home_blogs_row">
                        {otherPlaces.map((item, index) => (
                            <div className="col-12 col-md-6 col-lg-3" key={item?.id ?? item?.slug ?? index}>
                                <PlaceCard data={item} showLocation />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        </>
    )
}

export default SinglePlace
