'use client'
import Image from "next/image"
import { placeholderImage, t, truncate, getCompressedImage, normalizeImageUrl } from "@/utils"
import Link from "next/link"
import { store } from "@/redux/store"

const PopularAiTools = ({ data }) => {
    const settingsData = store.getState().Settings?.data
    const placeholderImageUrl = settingsData?.data?.placeholder_image || '/assets/Transperant_Placeholder.png'

    return (
        <div className="popular_posts">
            <h6 className="pop_post_title">{t('popularTools')}</h6>
            <div className="popular_posts_item_wrapper">
                {data?.map((item, index) => {
                    const compressedImage = getCompressedImage(item, 'small', item?.image);
                    const finalImage = (compressedImage && compressedImage !== item?.image) ? compressedImage : (item?.image || null);
                    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : placeholderImageUrl;
                    const validImageSrc = imageSrc && imageSrc.trim() !== '' ? imageSrc : placeholderImageUrl;
                    
                    return (
                        <Link href={`/ai-tools/${encodeURIComponent(item?.slug || '')}`} key={index}>
                            <div className="popular_posts_item">
                                <Image 
                                    loading="lazy"
                                    src={validImageSrc} 
                                    width={66} 
                                    height={55} 
                                    alt="AI Tool" 
                                    className="popular_posts_img" 
                                    onError={(e) => {
                                        if (e.target.src !== placeholderImageUrl) {
                                            e.target.src = placeholderImageUrl;
                                        }
                                    }} 
                                />
                                <h6 className="popular_posts_title">{truncate(item?.title, 40)}</h6>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    )
}

export default PopularAiTools
