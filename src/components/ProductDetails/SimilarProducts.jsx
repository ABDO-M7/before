'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import ProductCard from '../Cards/ProductCard';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { FreeMode } from 'swiper/modules';
import { t, useIsRtl } from '@/utils';
import { allItemApi } from '@/utils/api';

/**
 * Merged "Related + Nearby" section: one list with priority
 * (nearby+same category → nearby+parent category → nearby → same category).
 * Items from radius steps include distance; ProductCard shows it when present.
 */
const SimilarProducts = ({ productData }) => {

    const [similarData, setSimilarData] = useState([]);
    const swiperRef = useRef();
    const isRtl = useIsRtl();
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    const fetchRelatedData = async () => {
        if (!productData?.category_id || !productData?.id) return;
        try {
            const params = {
                related_items: 1,
                item_id: productData.id,
                category_id: productData.category_id,
                radius: 20,
                limit: 10,
            };
            if (productData?.latitude != null && productData?.longitude != null) {
                params.latitude = productData.latitude;
                params.longitude = productData.longitude;
            }
            const response = await allItemApi.getItems(params);
            const responseData = response?.data;
            if (responseData && responseData.error !== true) {
                const data = responseData?.data;
                const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
                setSimilarData(list);
            } else {
                setSimilarData([]);
            }
        } catch (error) {
            console.error("Error fetching related items:", error);
            setSimilarData([]);
        }
    };

    useEffect(() => {
        fetchRelatedData();
    }, [productData?.id, productData?.category_id, productData?.latitude, productData?.longitude])

    const swipePrev = () => {
        swiperRef?.current?.slidePrev()
    }
    const swipeNext = () => {
        swiperRef?.current?.slideNext()
    }

    const handleSlideChange = () => {
        setIsEnd(swiperRef?.current?.isEnd);
        setIsBeginning(swiperRef?.current?.isBeginning);
    };

    const breakpoints = {
        0: { slidesPerView: 1, spaceBetween: 12 },
        576: { slidesPerView: Math.min(2, similarData.length), spaceBetween: 16 },
        768: { slidesPerView: Math.min(3, similarData.length), spaceBetween: 20 },
        992: { slidesPerView: 4, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 30 },
    };

    const handleLike = (id) => {
        const updatedItems = similarData.map((item) => {
            if (item.id === id) {
                return { ...item, is_liked: !item.is_liked };
            }
            return item;
        });
        setSimilarData(updatedItems);
    }

    if (similarData.length === 0) return null;

    return (
        <>
            <div className="row related_prod_head">
                <div className="col-12">
                    <h4 className="pop_cat_head">{t("relatedAds")}</h4>
                </div>
            </div>
            <div className="row blog_card_row_gap">
                <div className="col-12">
                    <div className="similar_prod_swiper">
                        <Swiper
                            dir={isRtl ? "rtl" : "ltr"}
                            className="similar_product_swiper"
                            slidesPerView={4}
                            spaceBetween={30}
                            breakpoints={breakpoints}
                            onSlideChange={handleSlideChange}
                            modules={[FreeMode]}
                            freeMode={true}
                            onSwiper={(swiper) => {
                                swiperRef.current = swiper;
                                setIsEnd(swiper.isEnd);
                                setIsBeginning(swiper.isBeginning);
                            }}
                            key={isRtl}
                        >
                            {similarData.map((data, index) => (
                                <SwiperSlide key={data?.id ?? index}>
                                    <ProductCard data={data} handleLike={handleLike} />
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {similarData?.length > 4 && (
                            <>
                                <div 
                                    className={`pag_leftarrow_cont leftarrow ${isBeginning ? "hideArrow" : ""}`}
                                    onClick={swipePrev}
                                >
                                    <FaArrowLeft size={24} className="arrowLeft" />
                                </div>
                                <div
                                    className={`pag_rightarrow_cont rightarrow ${isEnd ? "hideArrow" : ""}`}
                                    onClick={swipeNext}
                                >
                                    <FaArrowRight size={24} className="arrowRight" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default SimilarProducts
