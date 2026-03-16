'use client'
import Image from "next/image"
import { t, truncate, getCompressedImage, normalizeImageUrl } from "@/utils"
// import { placeholderImage } from "@/utils" // unused (using placeholderImageUrl from settings + onError)
import Link from "next/link"
import { store } from "@/redux/store"

const PopularPosts = ({ data }) => {
    const settingsData = store.getState().Settings?.data
    const placeholderImageUrl = settingsData?.data?.placeholder_image || '/assets/Transperant_Placeholder.png'

    return (
        <div className="popular_posts">
            <h6 className="pop_post_title">{t('popularPosts')}</h6>
            <div className="popular_posts_item_wrapper">
                {data?.map((data, index) => {
                    // Use 'small' compressed image for popular posts thumbnails, fallback to original if compressed doesn't exist
                    const compressedImage = getCompressedImage(data, 'small', data?.image);
                    const finalImage = (compressedImage && compressedImage !== data?.image) ? compressedImage : (data?.image || null);
                    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : placeholderImageUrl;
                    
                    // Ensure imageSrc is never empty - use placeholder if it's empty or invalid
                    const validImageSrc = imageSrc && imageSrc.trim() !== '' ? imageSrc : placeholderImageUrl;
                    
                    return (
                        <Link href={`/blogs/${encodeURIComponent(data?.slug || '')}`} key={index}>
                            <div className="popular_posts_item">
                                <Image 
                                    loading="lazy"
                                    src={validImageSrc} 
                                    width={66} 
                                    height={55} 
                                    alt="Product" 
                                    className="popular_posts_img" 
                                    onError={(e) => {
                                        if (e.target.src !== placeholderImageUrl) {
                                            e.target.src = placeholderImageUrl;
                                        }
                                    }} 
                                />
                                <h6 className="popular_posts_title">{truncate(data?.title, 40)}</h6>
                            </div>
                        </Link>
                    );
                })}
            </div>

        </div>
    )
}

export default PopularPosts