'use client'
import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa6'
import { placeholderImage, t, getCompressedImage, normalizeImageUrl } from '@/utils'
// import { formatDateMonth } from '@/utils' // unused (only in commented date block)
import { store } from '@/redux/store'

const OurBlogCard = ({ data, showMeta = false }) => {
    // Get placeholder image from settings
    const settings = store.getState()?.Settings?.data?.data;
    const placeholderImageUrl = settings?.placeholder_image || '/assets/Transperant_Placeholder.png';
    
    // Priority: compressed image -> original image
    let finalImage = null;
    // Fallback to compressed image using getCompressedImage
    const compressedImage = getCompressedImage(data, 'small', data?.image);
    finalImage = (compressedImage && compressedImage !== data?.image) ? compressedImage : (data?.image || null);
    // If no image, use placeholder for blog cards
    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : placeholderImageUrl;
    
    const firstTag = Array.isArray(data?.tags) ? data.tags[0] : (data?.tags ? [].concat(data.tags)[0] : null);
    // const metaDate = data?.created_at ? formatDateMonth(data.created_at) : null; // Date on card - re-enable to show again

    return (
        <div className='ourblog_card'>
            <Link href={`/blogs/${encodeURIComponent(data?.slug || '')}`} className='ourblog_card_img_cont' style={{ display: 'block', cursor: 'pointer' }}>
                <Image loading="lazy" src={imageSrc} width={388} height={200} alt={data?.title} className='blog_card_img' onErrorCapture={placeholderImage} />
            </Link>
            {showMeta && (firstTag /* || metaDate */) && (
                <div className='ourblog_card_meta'>
                    {firstTag && <span className='ourblog_card_meta_tag'>{firstTag}</span>}
                    {/* Date on card - re-enable to show again: {firstTag && metaDate && <span className='ourblog_card_meta_sep'> - </span>}
                    {metaDate && <span className='ourblog_card_meta_date'>{metaDate}</span> */}
                </div>
            )}
            <h3 className='ourblog_card_title'>
                {data?.title}
            </h3>
            <p className='ourblog_card_desc'>
                {(() => {
                    const desc = data?.short_description || data?.description || '';
                    return typeof desc === 'string' ? desc.replace(/<[^>]*>/g, '') : '';
                })()}
            </p>
            <Link href={`/blogs/${encodeURIComponent(data?.slug || '')}`} className='read_article' >
                <span>
                    {t('readArticle')}
                </span>
                <span> <FaArrowRight size={20} className='read_icon' /></span>
            </Link>
        </div>

    )
}

export default OurBlogCard