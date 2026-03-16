'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import ProductCard from '../Cards/ProductCard';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { FreeMode } from 'swiper/modules';
import { t, useIsRtl } from '@/utils';
import { allItemApi } from '@/utils/api';


const NearbyProducts = ({ productData }) => {

    const [nearbyData, setNearbyData] = useState([]);
    const swiperRef = useRef();
    const isRtl = useIsRtl();
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    const fetchNearbyData = async (latitude, longitude) => {
        try {
            const response = await allItemApi.getItems({
                latitude: latitude,
                longitude: longitude,
                radius: 50, // You can adjust the radius as needed (in km)
                limit: 10, // Limit to 10 items
            });
            const responseData = response?.data;
            if (responseData && responseData.error !== true) {
                const { data } = responseData;
                // Filter out the current product and limit to 10 items
                const filteredData = data?.data
                    ?.filter(item => item.id !== productData?.id)
                    .slice(0, 10) || [];
                setNearbyData(filteredData);
            } else {
                setNearbyData([]);
            }
        } catch (error) {
            console.error("Error:", error);
            setNearbyData([]);
        }
    }

    useEffect(() => {
        // Only fetch if both latitude and longitude are available
        if (productData?.latitude && productData?.longitude) {
            fetchNearbyData(productData.latitude, productData.longitude);
        }
    }, [productData?.latitude, productData?.longitude])


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
        576: { slidesPerView: Math.min(2, nearbyData.length), spaceBetween: 16 },
        768: { slidesPerView: Math.min(3, nearbyData.length), spaceBetween: 20 },
        992: { slidesPerView: 4, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 30 },
    };

    const handleLike = (id) => {
        const updatedItems = nearbyData.map((item) => {
            if (item.id === id) {
                return { ...item, is_liked: !item.is_liked };
            }
            return item;
        });
        setNearbyData(updatedItems);
    }

    // Don't show the block if latitude/longitude are null or if no data
    if (!productData?.latitude || !productData?.longitude || nearbyData.length === 0) {
        return null;
    }

    return (
        <>
          <div className="row related_prod_head">
            <div className="col-12">
              <h4 className="pop_cat_head">{t("nearbyAds") || "Nearby Ads"}</h4>
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
                  {nearbyData &&
                    nearbyData.map((data, index) => (
                      <SwiperSlide key={index}>
                          <ProductCard data={data} handleLike={handleLike} />
                      </SwiperSlide>
                    ))}
                </Swiper>

                {nearbyData?.length > 4 && (
                  <>
                    <div 
                      className={`pag_leftarrow_cont leftarrow similar_prod_nav_mobile ${
                        isBeginning ? "hideArrow" : ""
                      }`}
                      onClick={swipePrev}
                    >
                      <FaArrowLeft size={24} className="arrowLeft" />
                    </div>
                    <div 
                      className={`pag_rightarrow_cont rightarrow similar_prod_nav_mobile ${
                        isEnd ? "hideArrow" : ""
                      }`}
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

export default NearbyProducts

