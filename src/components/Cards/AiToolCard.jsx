'use client'
import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa6'
// import { FaStar } from 'react-icons/fa6' // unused
import { placeholderImage, t, getCompressedImage, normalizeImageUrl } from '@/utils'
import { store } from '@/redux/store'
import '../PagesComponent/AiTools/AiTools.css'

const AiToolCard = ({ data }) => {
    // Get placeholder image from settings
    const settings = store.getState()?.Settings?.data?.data;
    const placeholderImageUrl = settings?.placeholder_image || '/assets/Transperant_Placeholder.png';
    
    // Priority: compressed image -> original image
    let finalImage = null;
    const compressedImage = getCompressedImage(data, 'small', data?.image);
    finalImage = (compressedImage && compressedImage !== data?.image) ? compressedImage : (data?.image || null);
    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : placeholderImageUrl;
    
    return (
        <Link href={`/ai-tools/${encodeURIComponent(data?.slug || '')}`} className={`tool-icon-card ${data?.featured ? 'active' : ''}`}>
            <div className="icon-box">
                {imageSrc ? (
                    <Image 
                        loading="lazy"
                        src={imageSrc} 
                        width={60} 
                        height={60} 
                        alt={data?.title} 
                        className='tool_icon_img' 
                        onErrorCapture={placeholderImage} 
                        style={{ objectFit: 'contain' }}
                    />
                ) : (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                )}
            </div>
            <h3 className='tool-card-title'>
                {data?.title}
            </h3>
            {data?.featured && (
                <span className="status-badge">{t('featured')}</span>
            )}
        </Link>
    )
}

export default AiToolCard
