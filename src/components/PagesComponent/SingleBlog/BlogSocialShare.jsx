
'use client'
import React from 'react'
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share'
import { RiTwitterXLine } from 'react-icons/ri'
import { BiLink, BiLogoFacebook, BiLogoWhatsapp } from 'react-icons/bi'
import toast from 'react-hot-toast'
import { t } from '@/utils'

const BlogSocialShare = ({ blogUrl, blogTitle }) => {
    const handleCopyUrl = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(blogUrl);
        toast.success(t('linkCopied'));
    }

    return (
        <div className="blog_social_links">
            <h6 className="blog_social_links_title">{t('shareInfo')} :</h6>
            <div className="blog_social_links_wrapper">
                <button onClick={handleCopyUrl} className="blog_single_link" style={{ background: '#F2F2F2' ,  padding: '6px' , outline: 'none' , border: 'none' , borderRadius: '50%'}}>
                    <BiLink size={24} color="#000" />
                </button>
                <FacebookShareButton url={blogUrl}>
                    <div className="blog_single_link" style={{ background: '#F2F2F2' ,  padding: '6px' , outline: 'none' , border: 'none' , borderRadius: '50%'}}>
                        <BiLogoFacebook size={24} color="#1877F2" />
                    </div>
                </FacebookShareButton>
                <TwitterShareButton url={blogUrl}>
                    <div className="blog_single_link" style={{ background: '#F2F2F2' ,  padding: '6px' , outline: 'none' , border: 'none' , borderRadius: '50%'}}>
                        <RiTwitterXLine size={24} color="#000" />
                    </div>
                </TwitterShareButton>

                <WhatsappShareButton url={blogUrl} title={blogTitle}>
                    <div className="blog_single_link" style={{ background: '#F2F2F2' ,  padding: '6px' , outline: 'none' , border: 'none' , borderRadius: '50%'}}>
                        <BiLogoWhatsapp size={24} color="#25D366" />
                    </div>
                </WhatsappShareButton>
            </div>
        </div>
    )
}

export default BlogSocialShare

