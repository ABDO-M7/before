'use client'
import Image from 'next/image'
import { FaRegHeart } from 'react-icons/fa6'
import { formatDate, formatPriceAbbreviated, formatSalaryRange, t, getCompressedImage, normalizeImageUrl } from '@/utils'
// import { placeholderImage } from '@/utils' // unused (using placeholderImageUrl from settings)
import { BiBadgeCheck } from 'react-icons/bi'
import { FaHeart } from "react-icons/fa6";
import { manageFavouriteApi } from "@/utils/api";
import toast from "react-hot-toast";
import { userSignUpData } from '../../redux/reuducer/authSlice';
import { useSelector } from "react-redux";
import { toggleLoginModal } from '@/redux/reuducer/globalStateSlice'
import { settingsData } from '@/redux/reuducer/settingSlice';


const ProdcutHorizontalCard = ({ data, handleLike, priority = false }) => {
    const userData = useSelector(userSignUpData)
    const systemSettingsData = useSelector(settingsData);
    const settings = systemSettingsData?.data;
    const placeholderImageUrl = settings?.placeholder_image || '/assets/Transperant_Placeholder.png';
    // Use 'small' compressed image for card, fallback to original image if compressed doesn't exist
    const compressedImage = getCompressedImage(data, 'small', data?.image);
    // If compressed path doesn't exist or is invalid, use original image
    const finalImage = (compressedImage && compressedImage !== data?.image) ? compressedImage : (data?.image || null);
    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : placeholderImageUrl;
    const isJobCategory = Number(data?.category?.is_job_category) === 1;
    const isHidePrice = isJobCategory
        ? [data?.min_salary, data?.max_salary].every(
            val =>
                val === null ||
                val === undefined ||
                (typeof val === "string" && val.trim() === "")
        )
        : data?.price === null ||
        data?.price === undefined ||
        (typeof data?.price === "string" && data?.price.trim() === "");



    const handleLikeItem = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userData) {
            toggleLoginModal(true)
        }
        else {

            try {
                const response = await manageFavouriteApi.manageFavouriteApi({ item_id: data?.id })
                if (response?.data?.error === false) {
                    toast.success(response?.data?.message)
                    handleLike(data?.id)
                }
                else {
                    toast.success(t('failedToLike'))
                }

            } catch (error) {
                console.log(error)
                toast.success(t('failedToLike'))
            }
        }

    }

    return (
        <>
            <div className='product_horizontal_card card'>
                <div className="product_img_div">
                    <Image 
                        src={imageSrc} 
                        width={220} 
                        height={190} 
                        alt={data?.name || "Product"} 
                        className="prodcut_img" 
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                        {...(priority ? { fetchPriority: "high" } : {})}
                        onError={(e) => {
                            if (e.target.src !== placeholderImageUrl) {
                                e.target.src = placeholderImageUrl;
                            }
                        }}
                    />
                </div>
                <div className="product_details">
                    <div className="product_featured_header">
                        {data?.is_feature ? (
                            <div className='product_featured'>
                                <BiBadgeCheck size={16} color="white" />
                                <p className="product_card_featured">{t('featured')}</p>
                            </div>
                        ) : null}
                        <div className="like_div product_card_black_heart_cont" onClick={(e) => handleLikeItem(e)}>
                            {data?.is_liked ? (
                                <button className="isLiked" >
                                    <FaHeart size={24} className="like_icon" />
                                </button>
                            ) : (

                                <button >
                                    <FaRegHeart size={24} className="like_icon" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="title_details">
                        {!isHidePrice && <span className='product_card_prod_price'>{isJobCategory ?
                            formatSalaryRange(data?.min_salary, data?.max_salary) : formatPriceAbbreviated(data?.price)}
                        </span>}
                        <span className='title'>
                            {data?.name}
                        </span>
                        {/* <span className='decs'>{data?.description}</span> */}
                        <p className="product_card_prod_det">
                            {data?.city}{data?.city ? "," : null}{data?.state}{data?.state ? "," : null}{data?.country}
                        </p>
                    </div>
                    {/* Date on card - re-enable to show again
                    <div className="post_time">
                        <span className='time_ago'>{formatDate(data?.created_at)}</span>
                    </div>
                    */}
                </div>
            </div>
        </>
    )
}

export default ProdcutHorizontalCard
