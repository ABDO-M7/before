'use client'
import { t } from "@/utils/translate";
import { getCompressedImage, normalizeImageUrl } from "@/utils/imageUtils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";
import { IoIosMore } from "react-icons/io";


const HeaderCategories = ({ cateData, headerCatSelected, settings }) => {

    const containerRef = useRef(null);
    const [fitCategoriesCount, setFitCategoriesCount] = useState(0);
    const [IsShowCatDrop, setIsShowCatDrop] = useState(false)
    const [MenuData, setMenuData] = useState(null)
    const [IsShowOtherCat, setIsShowOtherCat] = useState(false)
    const gap = 25;

    // Defer layout read/write to next frame to avoid forced reflow (read offsetHeight after paint)
    useEffect(() => {
        if (!IsShowCatDrop && !IsShowOtherCat) return;
        let cancelled = false;
        const rafId = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (cancelled) return;
                const allCatWrapper = document.querySelector('.allCatWrapper');
                const cateCont = document.querySelector('.cate_cont');
                if (allCatWrapper && cateCont) {
                    cateCont.style.height = `${allCatWrapper.offsetHeight}px`;
                }
            });
        });
        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
        };
    }, [MenuData, IsShowCatDrop, IsShowOtherCat]);

    // ✅ Performance Fix: Removed expensive dummy DOM node creation and offsetWidth measurements.
    // Instead of forcing the browser to recalculate layout mid-hydration, we use a 
    // simple estimate for the first paint and adjust asynchronously if needed.
    useEffect(() => {
        if (!containerRef.current || !cateData?.length) return;
        
        let cancelled = false;
        // Move measurement to ResizeObserver (async) - no more forced reflows!
        const observer = new ResizeObserver((entries) => {
            if (cancelled) return;
            const containerWidth = entries[0].contentRect.width;
            
            // Simplified calculation: Estimate ~120px per category including gap.
            // This is a zero-latency heuristic that prevents the "Hydration Wall".
            const estimatedCount = Math.floor(containerWidth / 130);
            setFitCategoriesCount(Math.max(1, Math.min(estimatedCount, cateData.length)));
        });

        observer.observe(containerRef.current);
        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [cateData]);

    const handleCatClick = (cat) => {
        setIsShowCatDrop(true)
        setMenuData(cat)
        if (IsShowOtherCat) {
            setIsShowOtherCat(false)
        }
    }

    const handleCatLinkClick = () => {
        if (IsShowOtherCat) {
            setIsShowOtherCat(false)
        }
        if (IsShowCatDrop) {
            setIsShowCatDrop(false)
        }
    }

    const handleOtherCat = () => {
        setIsShowOtherCat(true)
        setMenuData({})
        if (IsShowCatDrop) {
            setIsShowCatDrop(false)
        }
    }

    const selectCat = () => {
        setIsShowCatDrop(false)
    }

    return (
        <div className='shopping_items_cont' style={{
            // position: 'sticky',
            // top removed - natural flow
            zIndex: 29,
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: "20px"
        }}>
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="shopping_items" ref={containerRef}>
                            {
                                cateData.slice(0, fitCategoriesCount).map((cat) => {
                                    return cat.subcategories_count > 0 ? (

                                        <div className={`shopping_cat ${headerCatSelected === cat?.slug && 'brdrShop'}`} onMouseEnter={() => handleCatClick(cat)} key={cat?.id} onMouseLeave={() => setIsShowCatDrop(false)}>
                                            <span>{cat?.translated_name}</span>
                                            {
                                                cat?.translated_name === MenuData?.translated_name && IsShowCatDrop
                                                    ?
                                                    <span><FaAngleUp className='prof_down_arrow' /></span>
                                                    :
                                                    <span><FaAngleDown className='prof_down_arrow' /></span>
                                            }
                                        </div>
                                    ) : (
                                        <Link href={`/category/${cat?.slug}`} className={`shopping_cat ${headerCatSelected === cat?.slug && 'brdrShop'}`} key={cat?.id} onMouseEnter={handleCatLinkClick}>
                                            {cat?.translated_name}
                                        </Link>
                                    );
                                })
                            }

                            {
                                cateData && cateData.length > fitCategoriesCount &&
                                <div className={`shopping_cat ${IsShowOtherCat || headerCatSelected === 'products' && 'brdrShop'}`} onMouseLeave={() => setIsShowOtherCat(false)} onMouseEnter={handleOtherCat}>

                                    <span>{t('other')}</span>
                                    {
                                        IsShowOtherCat ?
                                            <span><FaAngleUp className='prof_down_arrow' /></span>
                                            :
                                            <span><FaAngleDown className='prof_down_arrow' /></span>
                                    }
                                </div>
                            }

                            {
                                IsShowCatDrop &&
                                <div className="cate_cont_wrap">
                                    <div
                                        className='cate_cont'
                                        onMouseEnter={() => setIsShowCatDrop(true)}
                                        onMouseLeave={() => setIsShowCatDrop(false)}
                                    >

                                        <div className='selected_cat'>
                                            <div className='cat_link_cont'>
                                                {(() => {
                                                    // Use 'small' compressed image for category, fallback to original if compressed doesn't exist
                                                    const originalImage = MenuData?.image || null;
                                                    const compressedImage = getCompressedImage(MenuData, 'small', originalImage);
                                                    const finalImage = (compressedImage && compressedImage !== originalImage) ? compressedImage : (originalImage || null);
                                                    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : (settings?.placeholder_image || null);

                                                    return (
                                                        <Image
                                                            loading="lazy"
                                                            src={imageSrc || settings?.placeholder_image}
                                                            width={22}
                                                            height={22}
                                                            alt={MenuData?.translated_name || "Category"}
                                                        />
                                                    );
                                                })()}
                                                <span>
                                                    {MenuData?.translated_name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='allCatWrapper'>
                                            {
                                                MenuData?.subcategories_count > 0 && (
                                                    <>
                                                        <Link onClick={selectCat} href={`/category/${MenuData?.slug}`} className='see_all_cat'>{t('seeAllIn')} {MenuData?.translated_name}</Link>
                                                        {
                                                            MenuData?.subcategories.map((sub) => (
                                                                <div className="cate_item cate_subcate" key={sub?.slug}>
                                                                    <Link href={`/category/${sub?.slug}`} className='main_cat' onClick={() => setIsShowCatDrop(false)}>
                                                                        {sub?.translated_name}
                                                                    </Link>
                                                                    {
                                                                        sub?.subcategories_count > 0 &&
                                                                        sub.subcategories.slice(0, 5).map((nestedSub) => (
                                                                            <Link onClick={() => setIsShowCatDrop(false)} href={`/category/${nestedSub?.slug}`} className='subcat' key={nestedSub?.slug}>{nestedSub?.translated_name}</Link>
                                                                        ))
                                                                    }
                                                                    {
                                                                        sub?.subcategories_count > 5 &&
                                                                        <Link onClick={() => setIsShowCatDrop(false)} href={`/category/${sub?.slug}`} className='subcat'>{t('viewAll')}</Link>
                                                                    }
                                                                </div>
                                                            ))
                                                        }
                                                    </>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                            }

                            {
                                IsShowOtherCat &&
                                <div className="cate_cont_wrap">
                                    <div
                                        className='cate_cont'
                                        onMouseLeave={() => setIsShowOtherCat(false)}
                                        onMouseEnter={() => setIsShowOtherCat(true)}
                                    >
                                        <div className='selected_cat'>
                                            <div className='cat_link_cont'>
                                                <IoIosMore size={22} />
                                                <span>
                                                    {t('other')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='allCatWrapper'>

                                            <Link onClick={() => setIsShowOtherCat(false)} href='/products' className='see_all_cat'>{t('seeAllIn')} {t('other')}</Link>

                                            {
                                                cateData && cateData.slice(fitCategoriesCount).map((sub) => (
                                                    <div className="cate_item cate_subcate" key={sub?.slug}>
                                                        <Link onClick={() => setIsShowOtherCat(false)} href={`/category/${sub?.slug}`} className='main_cat'>
                                                            {sub?.translated_name}
                                                        </Link>
                                                        {
                                                            sub?.subcategories_count > 0 &&
                                                            sub.subcategories.slice(0, 5).map((nestedSub) => (
                                                                <Link onClick={() => setIsShowOtherCat(false)} href={`/category/${nestedSub?.slug}`} className='subcat' key={nestedSub?.slug}>{nestedSub?.translated_name}</Link>
                                                            ))
                                                        }
                                                        {
                                                            sub?.subcategories_count > 5 &&
                                                            <Link onClick={() => setIsShowOtherCat(false)} href={`/category/${sub?.slug}`} className='subcat' key={sub?.slug}>{t('viewAll')}</Link>
                                                        }
                                                    </div>
                                                ))
                                            }

                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeaderCategories