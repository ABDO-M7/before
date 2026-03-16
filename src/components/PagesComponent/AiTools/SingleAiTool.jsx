'use client'
import AiToolCard from "@/components/Cards/AiToolCard"
import Image from "next/image"
import { FaEye, FaRegCalendarCheck } from "react-icons/fa6"
// import { FaStar } from "react-icons/fa6" // unused (only in commented badge)
import { formatDateMonth, t, truncate, getCompressedImage, normalizeImageUrl } from "@/utils"
import { useParams, usePathname } from "next/navigation"
import { getAiToolsApi } from "@/utils/api"
import { useEffect, useState } from "react"
import { store } from "@/redux/store"
import { useDispatch } from "react-redux"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
import { BiLink, BiLogoFacebook, BiLogoWhatsapp } from "react-icons/bi"
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from "react-share"
import { RiTwitterXLine } from "react-icons/ri"
import toast from "react-hot-toast"
import React from "react"
import HTMLContentRenderer from '@/components/DynamicHTMLContent/HTMLContentRenderer';

const SingleAiTool = () => {
    const dispatch = useDispatch()
    const router = useParams()
    // Decode slug if percent-encoded (e.g. Arabic) so API receives the actual string
    const rawSlug = router?.slug
    const toolSlug = typeof rawSlug === 'string' && rawSlug.includes('%')
        ? decodeURIComponent(rawSlug)
        : (rawSlug || '')
    const settingsData = store.getState().Settings?.data
    const CompanyName = settingsData?.data?.company_name
    const path = usePathname()
    const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
    const [toolData, setToolData] = useState({})
    const [relatedTools, setRelatedTools] = useState([])

    const getToolData = async () => {
        if (!toolSlug || typeof toolSlug !== 'string' || toolSlug.trim() === '') return;
        try {
            const res = await getAiToolsApi.getAiTools({ slug: toolSlug.trim(), hub: 'web' })
            const data = res?.data?.data
            setToolData(data)
            
            dispatch(setBreadcrumbPath([{
                name: t("aiTools"),
                slug: '/ai-tools'
            }, {
                name: truncate(data?.title, 30)
            }]))

            // Get related tools
            const relatedRes = await getAiToolsApi.getAiTools({ limit: 4, hub: 'web' })
            setRelatedTools(relatedRes?.data?.data?.data?.filter(t => t.slug !== toolSlug) || [])
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (toolSlug) {
            getToolData()
        }
    }, [toolSlug])

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            toast.success(t("copyToClipboard"));
        } catch (error) {
            console.error("Error copying to clipboard:", error);
        }
    };

    return (
        // <section className='static_pages'>
            // <div className='container'>
                <div className="single_blog"> 
                    <div className="row">
                        <div className="col-12">
                            <div className="blog_content">
                                {toolData?.show_title && (
                                    //
                                    <h2 className="blog_heading">{toolData?.title}</h2>
                                )}
                                
                                {/* <div className="tool_meta_top d-flex gap-3 mb-3 flex-wrap"> */}
                                    {/* {toolData?.featured && <span className="badge bg-warning text-dark"><FaStar /> {t('featured')}</span>} */}
                                {/* </div> */}

                                {toolData?.show_image && toolData?.image && (
                                    <Image
                                        loading="lazy"
                                        src={normalizeImageUrl(getCompressedImage(toolData, 'large', toolData.image))}
                                        width={838}
                                        height={500}
                                        className="blog_main_img"
                                        alt={toolData?.title}
                                    />
                                )}

                                <div>
                                    <HTMLContentRenderer
                                        htmlContent={toolData?.description || ''}
                                        contentId={`tool-description-${toolSlug}`}
                                    />
                                </div>

                                <div className="admin_details mt-4">
                                    {toolData?.views > 0 && (
                                        <>
                                            <div className="date_of_blog_cont">
                                                <FaEye size={16} color="rgba(0, 0, 0, 0.64)" />
                                                <p className="date_of_blog">{t('views')}: {toolData?.views}</p>
                                            </div>
                                            <div className="vLine"></div>
                                        </>
                                    )}
                                    {/* Date on single AI tool page - re-enable to show again
                                    <div className="date_of_blog_cont">
                                        <FaRegCalendarCheck size={16} color="rgba(0, 0, 0, 0.64)" />
                                        <p className="date_of_blog">{t('postedOn')}: {formatDateMonth(toolData?.created_at)}</p>
                                    </div>
                                    */}
                                </div>

                                <div className="link_tag_cont mt-4">
                                    <div className="share_cont">
                                        <p className="share_blog">{t('shareThisOnSocialMedia')}</p>
                                        <div className="share_icons_cont">
                                            <button onClick={handleCopyUrl} className="copyClipboardBtn">
                                                <BiLink size={24} color="#595B6C" />
                                            </button>
                                            <FacebookShareButton url={currentUrl}>
                                                <BiLogoFacebook size={24} color="#595B6C" />
                                            </FacebookShareButton>
                                            <TwitterShareButton url={currentUrl}>
                                                <RiTwitterXLine size={21} color="#595B6C" />
                                            </TwitterShareButton>
                                            <WhatsappShareButton url={currentUrl} title={toolData?.title}>
                                                <BiLogoWhatsapp size={24} color="#595B6C" />
                                            </WhatsappShareButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {relatedTools?.length > 0 && (
                        <div className="mt-5">
                            <h4 className="pop_cat_head mb-4">{t('relatedTools')}</h4>
                            <div className="row blog_card_row_gap">
                                {relatedTools.map((item, index) => (
                                    <div className="col-xl-3 col-md-6 col-6" key={index}>
                                        <AiToolCard data={item} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            // {/* </div> */}
        // </section>
    )
}

export default SingleAiTool
