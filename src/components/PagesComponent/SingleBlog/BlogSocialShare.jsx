'use client'
import React from 'react'
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share'
import { RiTwitterXLine } from 'react-icons/ri'
import { BiLink, BiLogoFacebook, BiLogoWhatsapp } from 'react-icons/bi'
import toast from 'react-hot-toast'
import { t } from '@/utils'

const BlogSocialShare = ({ blogUrl, blogTitle, CompanyName }) => {
    const handleCopyUrl = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(blogUrl);
        toast.success(t('linkCopied'));
    }

    return (
        <div className="single_blog_content share_container">
            <div className="custom_share">
                <h6 className="tags_title">{t('shareInfo')} :</h6>
                <div className="tags_item_wrapper blog_single_detail_tags">
                    <button onClick={handleCopyUrl} className="blog_single_link_icon" aria-label="Copy Link">
                        <BiLink size={24} color="#595B6C" />
                    </button>
                    
                    <FacebookShareButton url={blogUrl} title={blogUrl + CompanyName} hashtag={CompanyName}>
                        <BiLogoFacebook size={24} color="#595B6C" />
                    </FacebookShareButton>

                    <TwitterShareButton url={blogUrl}>
                        <RiTwitterXLine size={21} color="#595B6C" />
                    </TwitterShareButton>

                    <WhatsappShareButton url={blogUrl} title={`${blogTitle || ''} - ${CompanyName}`} hashtag={CompanyName}>
                        <BiLogoWhatsapp size={24} color="#595B6C" />
                    </WhatsappShareButton>
                </div>
            </div>
        </div>
    )
}

export default BlogSocialShare
