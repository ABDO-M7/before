"use client";
import React, { useEffect, useState } from 'react';
import { IoIosArrowUp } from 'react-icons/io';
import { FaWhatsapp } from 'react-icons/fa6';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { t } from '@/utils';
import { allItemApi } from '@/utils/api';

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [productData, setProductData] = useState(null);
    const pathname = usePathname();
    const systemSettingsData = useSelector((state) => state?.Settings);
    const isProductDetailPage = pathname?.includes('/product-details/');

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsMobileDevice(
                /Mobi|Android|iP(hone|od|ad)|Phone/i.test(
                    window.navigator?.userAgent || ""
                )
            );
        }
    }, []);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    // Fetch product data if on product detail page
    useEffect(() => {
        if (isProductDetailPage && isMobileDevice) {
            const rawSlug = pathname?.split('/product-details/')[1];
            const slug = rawSlug && rawSlug.includes('%') ? decodeURIComponent(rawSlug) : rawSlug;
            if (slug) {
                const fetchProduct = async () => {
                    try {
                        const response = await allItemApi.getItems({ slug });
                        const responseData = response?.data?.data;
                        if (responseData?.data?.[0]) {
                            setProductData(responseData.data[0]);
                        }
                    } catch (error) {
                        console.error('Error fetching product data:', error);
                    }
                };
                fetchProduct();
            }
        }
    }, [isProductDetailPage, isMobileDevice, pathname]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleWhatsappClick = () => {
        if (!productData) return;

        const settingsData = systemSettingsData?.data?.data || {};
        const applicationName = settingsData?.application_name || "Arablaza";
        const currentPageUrl = typeof window !== "undefined" ? window.location.href : "";
        const intro = (t("whatsappMessageIntro") || "").replace(/\{\{appName\}\}/g, applicationName);
        const outreachMessage = currentPageUrl ? `${intro}\n\n${currentPageUrl}` : intro;

        const itemPhone = productData?.phone;
        const itemCountryCode = productData?.country_code;
        // const canShowContact =
        //     (productData?.user?.show_personal_details === 1 ||
        //         productData?.show_personal_details === 1) &&
        //     itemPhone;

        // if (!canShowContact) return;

        const rawCountryCode = itemCountryCode || "";
        const rawPhone = itemPhone || "";
        const trimmedCountryCode = rawCountryCode.trim();
        const digitsCountryCode = trimmedCountryCode.replace(/[^\d+]/g, "");

        const digitsOnlyPhone = rawPhone.replace(/\D/g, "");
        const whatsappNumber = `${digitsCountryCode}${digitsOnlyPhone}`.replace(/\D/g, "");

        if (whatsappNumber) {
            const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(outreachMessage)}`;
            window.open(whatsappLink, "_blank");
        }
    };

    const showWhatsAppButton = isProductDetailPage && 
                                isMobileDevice && 
                                productData &&
                                ((productData?.user?.show_personal_details === 1 ||
                                  productData?.show_personal_details === 1) &&
                                 productData?.phone);

    // Position buttons: WhatsApp always on left, ScrollToTop always on right
    const whatsappPosition = { left: '16px', right: 'auto' };
    const scrollTopPosition = { right: '16px', left: 'auto' };
    const bottomPosition = isMobileDevice ? '80px' : '110px'; // Closer to bottom nav on mobile

    return (
        <>
            {showWhatsAppButton && (
                <button
                    className='scrollTop whatsappFloatBtn'
                    onClick={handleWhatsappClick}
                    style={{
                        display: 'block',
                        bottom: bottomPosition,
                        ...whatsappPosition,
                    }}
                >
                    <FaWhatsapp size={22} />
                </button>
            )}
            <button
                className='scrollTop'
                onClick={scrollToTop}
                style={{
                    display: isVisible ? 'block' : 'none',
                    bottom: bottomPosition,
                    ...scrollTopPosition,
                }}
            >
                <IoIosArrowUp size={22} />
            </button>
        </>
    );
};

export default ScrollToTopButton;
