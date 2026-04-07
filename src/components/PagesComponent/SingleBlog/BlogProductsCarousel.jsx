'use client'
import React, { useState, useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import ProductCard from "@/components/Cards/ProductCard";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { allItemApi } from "@/utils/api";
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer'; // ✅ Defer fetching until in view

const BlogProductsCarousel = ({ itemIds, isRtl, containerClassPrefix = "blog_main_items", aboveFold = false }) => {
    const swiperRef = useRef(null);
    const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
    const [navState, setNavState] = useState({ isBeginning: true, isEnd: false });
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getBlogItems = async () => {
            // ✅ Only fetch if above fold OR in view
            if (!aboveFold && !inView) return;
            
            if (!itemIds) {
                setItems([]);
                setIsLoading(false);
                return;
            }

            let idsArray = [];
            if (Array.isArray(itemIds)) idsArray = itemIds.filter(id => id != null && id !== '');
            else if (typeof itemIds === 'string') idsArray = itemIds.split(',').map(id => id.trim()).filter(id => id !== '');
            else idsArray = [String(itemIds)];

            if (idsArray.length === 0) {
                setItems([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const idsString = idsArray.join(',');
                const res = await allItemApi.getItems({ id: idsString, limit: 100 });
                let fetchedItems = [];
                if (res?.data?.error !== true) {
                    if (Array.isArray(res?.data?.data)) fetchedItems = res.data.data;
                    else if (Array.isArray(res?.data?.data?.data)) fetchedItems = res.data.data.data;
                }

                if (fetchedItems.length < idsArray.length) {
                    const fetchedIds = new Set(fetchedItems.map(item => item.id));
                    const missingIds = idsArray.filter(id => !fetchedIds.has(Number(id)));
                    const individualPromises = missingIds.map(async (id) => {
                        try {
                            const individualRes = await allItemApi.getItems({ id: String(id) });
                            if (individualRes?.data?.error !== true) {
                                if (Array.isArray(individualRes?.data?.data)) return individualRes.data.data[0] || null;
                                else if (Array.isArray(individualRes?.data?.data?.data)) return individualRes.data.data.data[0] || null;
                            }
                        } catch (error) { console.warn(error); }
                        return null;
                    });
                    const individualItems = (await Promise.all(individualPromises)).filter(Boolean);
                    fetchedItems = [...fetchedItems, ...individualItems];
                }
                setItems(fetchedItems);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        getBlogItems();
    }, [itemIds, inView, aboveFold]);

    const handleLike = (id) => {
        setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, is_liked: !item.is_liked } : item));
    };

    const handleSlideChange = useCallback(() => {
        if (swiperRef.current) {
            setNavState({
                isBeginning: swiperRef.current.isBeginning,
                isEnd: swiperRef.current.isEnd
            });
        }
    }, []);

    const swipePrev = useCallback(() => {
        if (swiperRef.current) swiperRef.current.slidePrev();
    }, []);

    const swipeNext = useCallback(() => {
        if (swiperRef.current) swiperRef.current.slideNext();
    }, []);

    if (!aboveFold && !inView) {
        return (
            <div ref={ref} className={`${containerClassPrefix}_swiper_container`} style={{ position: 'relative', minHeight: '430px' }}>
                <div className="carousel-skeleton" style={{ minHeight: '430px', background: '#f5f5f5', borderRadius: '12px' }} />
            </div>
        );
    }

    if (!items || items.length === 0) {
        if (isLoading) {
            return (
                <div ref={ref} className={`${containerClassPrefix}_swiper_container`} style={{ position: 'relative', minHeight: '430px' }}>
                    <div className="carousel-skeleton" style={{ minHeight: '430px', background: '#f5f5f5', borderRadius: '12px' }} />
                </div>
            );
        }
        return null;
    }

    if (items.length < 2) {
        return (
            <div ref={ref} className={`${containerClassPrefix}_swiper_container`} style={{ position: 'relative' }}>
                <Swiper
                    dir={isRtl ? "rtl" : "ltr"}
                    className={`${containerClassPrefix}_swiper`}
                    slidesPerView={1}
                    spaceBetween={12}
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 12 },
                        576: { slidesPerView: 2, spaceBetween: 16 },
                        768: { slidesPerView: 3, spaceBetween: 20 },
                        992: { slidesPerView: 4, spaceBetween: 24 },
                        1200: { slidesPerView: 4, spaceBetween: 30 },
                    }}
                    modules={[FreeMode]}
                    freeMode={true}
                    allowTouchMove={false}
                    key={`single_${isRtl}`}
                >
                    <SwiperSlide>
                        <ProductCard data={items[0]} handleLike={handleLike} />
                    </SwiperSlide>
                </Swiper>
            </div>
        );
    }

    return (
        <div ref={ref} className={`${containerClassPrefix}_swiper_container`} style={{ position: 'relative' }}>
            <Swiper
                dir={isRtl ? "rtl" : "ltr"}
                className={`${containerClassPrefix}_swiper`}
                slidesPerView={Math.min(2, items.length)}
                spaceBetween={20}
                breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 12 },
                    576: { slidesPerView: Math.min(2, items.length), spaceBetween: 16 },
                    768: { slidesPerView: Math.min(3, items.length), spaceBetween: 20 },
                    992: { slidesPerView: 4, spaceBetween: 24 },
                    1200: { slidesPerView: 4, spaceBetween: 30 },
                }}
                onSlideChange={handleSlideChange}
                modules={[FreeMode]}
                freeMode={true}
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                    setNavState({
                        isBeginning: swiper.isBeginning,
                        isEnd: swiper.isEnd
                    });
                }}
                key={`multiple_${isRtl}`}
            >
                {items.map((item, itemIndex) => (
                    <SwiperSlide key={itemIndex}>
                        <ProductCard data={item} handleLike={handleLike} />
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Navigation Arrows */}
            <div
                className={`${containerClassPrefix}_nav_arrow ${containerClassPrefix}_nav_prev ${navState.isBeginning ? "hideArrow" : ""}`}
                onClick={swipePrev}
                style={{
                    position: 'absolute',
                    left: isRtl ? 'auto' : '10px',
                    right: isRtl ? '10px' : 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
            >
                {isRtl ? <FaArrowRight size={20} color="#333" /> : <FaArrowLeft size={20} color="#333" />}
            </div>
            <div
                className={`${containerClassPrefix}_nav_arrow ${containerClassPrefix}_nav_next ${navState.isEnd ? "hideArrow" : ""}`}
                onClick={swipeNext}
                style={{
                    position: 'absolute',
                    right: isRtl ? 'auto' : '10px',
                    left: isRtl ? '10px' : 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
            >
                {isRtl ? <FaArrowLeft size={20} color="#333" /> : <FaArrowRight size={20} color="#333" />}
            </div>
        </div>
    );
};

export default BlogProductsCarousel;
