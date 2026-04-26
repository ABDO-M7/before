import { placeholderImage, normalizeImageUrl, useIsRtl } from '@/utils';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';


const CustomLightBox = ({ lightboxOpen, handleCloseLightbox, currentImages, currentImageIndex, setCurrentImage }) => {

    const isRtl = useIsRtl();
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPanSize, setZoomPanSize] = useState(null);
    const [zoomScale, setZoomScale] = useState(2);
    const viewportRef = useRef(null);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const apply = () => setZoomScale(mq.matches ? 1.5 : 2);
        apply();
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, []);

    useEffect(() => {
        setCurrentImage(currentImageIndex);
    }, [currentImageIndex]);

    useEffect(() => {
        // Disable scrolling when lightbox is open
        document.body.style.overflow = lightboxOpen ? 'hidden' : 'auto';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCloseLightbox();
            } else if (e.key === 'ArrowLeft') {
                handleLeftArrow();
            } else if (e.key === 'ArrowRight') {
                handleRightArrow();
            }
        };

        if (lightboxOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        // Cleanup scroll lock and event listener on component unmount
        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [lightboxOpen]);

    useEffect(() => {
        if (!lightboxOpen) {
            setIsZoomed(false);
            setZoomPanSize(null);
        }
    }, [lightboxOpen]);

    useEffect(() => {
        setIsZoomed(false);
        setZoomPanSize(null);
    }, [currentImageIndex]);

    useLayoutEffect(() => {
        if (!isZoomed || !viewportRef.current || !zoomPanSize) return;
        const vp = viewportRef.current;
        vp.scrollLeft = Math.max(0, (vp.scrollWidth - vp.clientWidth) / 2);
        vp.scrollTop = Math.max(0, (vp.scrollHeight - vp.clientHeight) / 2);
    }, [isZoomed, zoomPanSize, currentImageIndex]);

    const goToPrevious = () => setCurrentImage((prevIndex) => (prevIndex - 1 + currentImages.length) % currentImages.length);
    const goToNext = () => setCurrentImage((prevIndex) => (prevIndex + 1) % currentImages.length);

    const handleLeftArrow = isRtl ? goToNext : goToPrevious;
    const handleRightArrow = isRtl ? goToPrevious : goToNext;

    if (!lightboxOpen || !currentImages.length) return null;

    const currentImage = currentImages[currentImageIndex];

    if (!currentImage) return null;
    
    // Normalize image URL (product detail passes original full-size URLs)
    const normalizedImage = normalizeImageUrl(currentImage);


    const handleImageClick = (e) => {
        const img = e.currentTarget;
        const rect = img.getBoundingClientRect();
        setIsZoomed((prev) => {
            if (!prev) {
                setZoomPanSize({
                    w: rect.width * zoomScale,
                    h: rect.height * zoomScale,
                });
            } else {
                setZoomPanSize(null);
            }
            return !prev;
        });
    };

    return (
        <div
            className="lightbox-overlay"
            style={{ "--lightbox-zoom": zoomScale }}
        >
            <div className="lightbox-modal" onClick={handleCloseLightbox}>
                <div className="lightbox-header">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCloseLightbox();
                        }}
                        className="lightbox-close-button"
                    >
                        <IoMdClose size={24} />
                    </button>
                </div>
                <div className="lightbox-content">
                    <div
                        ref={viewportRef}
                        className={`lightbox-image-viewport${isZoomed ? " is-zoomed" : ""}`}
                    >
                        <div
                            className="lightbox-image-pan"
                            style={
                                zoomPanSize
                                    ? {
                                          width: zoomPanSize.w,
                                          height: zoomPanSize.h,
                                      }
                                    : undefined
                            }
                        >
                            <img
                                src={normalizedImage}
                                alt={`Image ${currentImageIndex + 1}`}
                                className={`lightbox-image ${isZoomed ? "zoomed" : ""}`}
                                loading="lazy"
                                onError={placeholderImage}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageClick(e);
                                }}
                            />
                        </div>
                    </div>
                    {currentImages && currentImages?.length > 1 && (
                        <div
                            className="lightbox-counter"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="lightbox-counter-current">{currentImageIndex + 1}</span>
                            <span className="lightbox-counter-sep">/</span>
                            <span className="lightbox-counter-total">{currentImages.length}</span>
                        </div>
                    )}
                    {currentImages && currentImages?.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeftArrow();
                                }}
                                className="lightbox-prev-button"
                            >
                                <FaChevronLeft />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRightArrow();
                                }}
                                className="lightbox-next-button"
                            >
                                <FaChevronRight />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomLightBox;
