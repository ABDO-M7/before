"use client";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import { placeholderImage, useIsRtl, getCompressedImage, normalizeImageUrl } from "@/utils";
import { RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";
import Link from "next/link";
import { userSignUpData } from "@/redux/reuducer/authSlice";
import { useSelector } from "react-redux";

const OfferSlider = ({ sliderData }) => {
  const swiperRef = useRef();
  const isRtl = useIsRtl();
  const userData = useSelector(userSignUpData);

  const swipePrev = () => {
    if (swiperRef?.current) {
      swiperRef.current.slidePrev();
    }
  };

  const swipeNext = () => {
    if (swiperRef?.current) {
      swiperRef.current.slideNext();
    }
  };

  const breakpoints = {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 1.2,
    },
    1400: {
      slidesPerView: 1.5,
    },
  };

  // ✅ CLS Fix: Reserve same height as skeleton (493px + padding) so no shift when data loads.
  if (!sliderData || sliderData.length === 0) {
    return null;  
    
  }

  return (
    <div className="offer_slider pop_categ_mrg_btm my-0" style={{ minHeight: '540px' }}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            {sliderData && sliderData.length > 0 && (
              <div className="offer_slider_swiper">
                <Swiper
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  dir={isRtl ? "rtl" : "ltr"}
                  spaceBetween={20}
                  slidesPerView={1}
                  modules={[Navigation, Autoplay]}
                  breakpoints={breakpoints}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                    stopOnLastSlide: false,
                  }}
                  slideToClickedSlide={true}
                  key={isRtl}
                >
                  {sliderData.map((ele, index) => {
                    let href;
                    if (ele?.model_type === "App\\Models\\Item") {
                      if (userData && userData?.id === ele?.model?.user_id) {
                        href = `/my-listing/${encodeURIComponent(ele?.model?.slug || '')}`;
                      } else {
                        // Otherwise, link to the product details page
                        href = `/product-details/${encodeURIComponent(ele?.model?.slug || '')}`;
                      }
                    } else if (ele?.model_type === null) {
                      href = ele?.third_party_link;
                    } else if (ele?.model_type === "App\\Models\\Category") {
                      href = `/category/${ele.model.slug}`;
                    } else if (ele?.model_type === "App\\Models\\Blog") {
                      href = `/blogs/${encodeURIComponent(ele?.model?.slug || '')}`;
                    } else if (ele?.model_type === "App\\Models\\FeatureSection") {
                      href = `/featured-sections/${encodeURIComponent(ele?.model?.slug || '')}`;
                    } else {
                      href = "/";
                    }
                    // Use 'medium' compressed image for slider, fallback to original image if compressed doesn't exist
                    const compressedImage = getCompressedImage(ele, 'medium', ele?.image);
                    // If compressed path doesn't exist or is invalid, use original image
                    const finalImage = (compressedImage && compressedImage !== ele?.image) ? compressedImage : (ele?.image || null);
                    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : finalImage;
                    
                    return (
                      <SwiperSlide key={index}>
                        <Link
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src={imageSrc}
                            width={983}
                            height={493}
                            alt={ele.id}
                            className="offer_slider_img"
                            priority={index === 0} // ✅ Priority for first slide (above fold, LCP)
                            loading={index === 0 ? undefined : "lazy"} // Lazy load other slides
                            onError={placeholderImage}
                          />
                        </Link>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
                {sliderData.length > 1 && (
                  <>
                    <button
                      className="pop_cat_btns pop_cat_left_btn"
                      onClick={swipePrev}
                      aria-label="Previous slide"
                    >
                      <RiArrowLeftLine size={24} color="white" aria-hidden="true" />
                    </button>
                    <button
                      className="pop_cat_btns pop_cat_right_btn"
                      onClick={swipeNext}
                      aria-label="Next slide"
                    >
                      <RiArrowRightLine size={24} color="white" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferSlider;
