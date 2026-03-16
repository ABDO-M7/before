'use client'
import Image from 'next/image'
import { placeholderImage, normalizeImageUrl } from '@/utils'
import Link from 'next/link'

const PLACEHOLDER = '/assets/img_placeholder.jpeg';

const PopularCategory = ({ data }) => {
    // Use original image directly for tiny 45px icons — compressed variants
    // may not exist on the server and Next.js proxy retries endlessly on 404s.
    const imageSrc = data?.image ? normalizeImageUrl(data.image) : PLACEHOLDER;
    
    return (
        <Link href={`/category/${data?.slug}`} className='pop_cat_cont'>
            <div className="pop_cat_icon_cont">
                <Image 
                  src={imageSrc} 
                  width={45} 
                  height={45} 
                  sizes="45px"
                  alt={data?.translated_name || 'Category Icon'} 
                  className='pop_cat_icon' 
                  loading="lazy" 
                  onErrorCapture={(e) => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = '1';
                      e.target.src = PLACEHOLDER;
                    }
                  }}
                />
            </div>
            <span className='pop_cat_name'>{data?.translated_name}</span>
        </Link>
    )
}

export default PopularCategory