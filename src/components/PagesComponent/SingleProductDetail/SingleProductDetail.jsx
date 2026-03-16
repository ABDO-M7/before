"use client";
import SimilarProducts from "@/components/ProductDetails/SimilarProducts";
import NearbyProducts from "@/components/ProductDetails/NearbyProducts";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaRegLightbulb } from "react-icons/fa6";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import {
  getImageClass,
  getYouTubeVideoId,
  isPdf,
  placeholderImage,
  t,
  useIsRtl,
  getCompressedImage,
  normalizeImageUrl,
} from "@/utils";
import { allItemApi, setItemTotalClickApi } from "@/utils/api";
import { useSelector } from "react-redux";
import ReportModal from "@/components/User/ReportModal";
import { FaPlayCircle } from "react-icons/fa";
import NoData from "@/components/NoDataFound/NoDataFound";
// import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent";
// ✅ Lazy load ReactPlayer to reduce initial bundle size
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });
import Loader from "@/components/Loader/Loader";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { MdOutlineAttachFile } from "react-icons/md";
import Link from "next/link";
import CustomLightBox from "@/components/ProductDetails/CustomLightBox";
import ProductDescription from "./ProductDescription";
import ProductDetailCard from "./ProductDetailCard";
import SellerCardInProdDet from "./SellerCardInProdDet";
import LocationCardInProdDet from "./LocationCardInProdDet";
import ReportAdCard from "./ReportAdCard";
import OpenInAppDrawer from "./OpenInAppDrawer";
import { useSearchParams } from "next/navigation";



const SingleProductDetail = ({ slug: slugFromParams }) => {
  // Decode slug if percent-encoded (e.g. Arabic) so API receives the actual string
  const slug = typeof slugFromParams === 'string' && slugFromParams.includes('%')
    ? decodeURIComponent(slugFromParams)
    : (slugFromParams || '');
  const swiperRef = useRef();
  const isRtl = useIsRtl();
  const searchParams = useSearchParams();
  const isShare = searchParams.get('share') === 'true' ? true : false;
  const systemSettingsData = useSelector((state) => state?.Settings);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const settingsData = systemSettingsData?.data?.data || {};
  const placeholderImageUrl = settingsData?.placeholder_image || '/assets/Transperant_Placeholder.png';
  const [productData, setProductData] = useState({});
  const [isBeginning, setIsBeginning] = useState(null);
  const [isEnd, setIsEnd] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedImage, setDisplayedImage] = useState();
  const [images, setImages] = useState([]); // For lightbox (large)
  const [galleryThumbnails, setGalleryThumbnails] = useState([]); // For gallery row (small)
  const [isLoading, setIsLoading] = useState(false);
  const [isReportModal, setIsReportModal] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isVideClicked, setIsVideClicked] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [currentImage, setCurrentImage] = useState(1);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const displayedImageIndex = images.findIndex(
    (image) => image === displayedImage
  );
  const [IsOpenInApp, setIsOpenInApp] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 768 && isShare) {
      setIsOpenInApp(true);
    }
  }, []);

  const incrementViews = async (item_id) => {
    try {
      if (!item_id) {
        console.error("Invalid item_id for incrementViews");
        return;
      }
      const res = await setItemTotalClickApi.setItemTotalClick({ item_id });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const fetchProductData = async () => {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') return;
    try {
      setIsLoading(true); // Set loading to true when fetching data
      const response = await allItemApi.getItems({
        slug: slug.trim(),
        // sort_by: sort_by === "default" ? "" : sort_by // Map "default" to ""
      });
      const responseData = response?.data?.data;
      if (responseData) {
        const { data } = responseData;
        setProductData(data[0]);
        // Use 'medium' compressed image for main displayed image, fallback to original if compressed doesn't exist
        const mainImageMedium = getCompressedImage(data[0], 'medium', data[0]?.image);
        const finalMainImage = (mainImageMedium && mainImageMedium !== data[0]?.image) ? mainImageMedium : (data[0]?.image || null);
        setDisplayedImage(finalMainImage);
        await incrementViews(data[0]?.id);
      } else {
        console.error("Invalid response:", response);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false); // Set loading to false after data is fetched
    }
  };

  useEffect(() => {
    fetchProductData();
  }, []);

  const swipePrev = () => {
    if (displayedImageIndex > 0) {
      // Check if there's a previous image
      swiperRef?.current?.slidePrev();
      // Get 'medium' compressed version for displayed image (big photo), check each image individually
      const prevIndex = displayedImageIndex - 1;
      const prevItem = prevIndex === 0 ? productData : productData?.gallery_images?.[prevIndex - 1];
      const originalPrevImg = prevIndex === 0 ? productData?.image : (productData?.gallery_images?.[prevIndex - 1]?.image || null);
      if (originalPrevImg) {
        const prevImageMedium = getCompressedImage(prevItem, 'medium', originalPrevImg);
        const finalPrevImg = (prevImageMedium && prevImageMedium !== originalPrevImg) ? prevImageMedium : originalPrevImg;
        setDisplayedImage(finalPrevImg);
      }
      setActiveIndex(prevIndex);
    }
  };

  const swipeNext = () => {
    if (displayedImageIndex < images.length - 1) {
      // Check if there's a next image
      swiperRef?.current?.slideNext();
      // Get 'medium' compressed version for displayed image (big photo), check each image individually
      const nextIndex = displayedImageIndex + 1;
      const nextItem = nextIndex === 0 ? productData : productData?.gallery_images?.[nextIndex - 1];
      const originalNextImg = nextIndex === 0 ? productData?.image : (productData?.gallery_images?.[nextIndex - 1]?.image || null);
      if (originalNextImg) {
        const nextImageMedium = getCompressedImage(nextItem, 'medium', originalNextImg);
        const finalNextImg = (nextImageMedium && nextImageMedium !== originalNextImg) ? nextImageMedium : originalNextImg;
        setDisplayedImage(finalNextImg);
      }
      setActiveIndex(nextIndex);
    }
  };

  const handleSlideChange = () => {
    const newIndex = swiperRef?.current?.realIndex;
    setIsEnd(swiperRef?.current?.isEnd);
    setIsBeginning(swiperRef?.current?.isBeginning);
  };

  useEffect(() => {
    // For lightbox, use 'large' compressed images, fallback to original if compressed doesn't exist
    const mainImageLarge = getCompressedImage(productData, 'large', productData?.image);
    const finalMainLarge = (mainImageLarge && mainImageLarge !== productData?.image) ? mainImageLarge : (productData?.image || null);
    const galleryImagesLarge = productData?.gallery_images?.map((img) => {
      const originalImg = typeof img === 'string' ? img : img?.image;
      const compressedImg = getCompressedImage(img, 'large', originalImg);
      return (compressedImg && compressedImg !== originalImg) ? compressedImg : originalImg;
    }).filter(Boolean) || [];
    setImages([finalMainLarge, ...galleryImagesLarge].filter(Boolean));
    
    // For gallery row thumbnails, use 'small' compressed images, fallback to original if compressed doesn't exist
    const mainImageSmall = getCompressedImage(productData, 'small', productData?.image);
    const finalMainSmall = (mainImageSmall && mainImageSmall !== productData?.image) ? mainImageSmall : (productData?.image || null);
    const galleryImagesSmall = productData?.gallery_images?.map((img) => {
      const originalImg = typeof img === 'string' ? img : img?.image;
      const compressedImg = getCompressedImage(img, 'small', originalImg);
      return (compressedImg && compressedImg !== originalImg) ? compressedImg : originalImg;
    }).filter(Boolean) || [];
    setGalleryThumbnails([finalMainSmall, ...galleryImagesSmall].filter(Boolean));
    
    if (productData?.video_link !== null) {
      setVideoUrl(productData?.video_link);
      const videoId = getYouTubeVideoId(productData?.video_link);
      if (videoId === false) {
        setThumbnailUrl("");
      } else {
        setThumbnailUrl(
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        );
      }
    }
  }, [productData]);

  const handleImageClick = (img, index) => {
    if (isVideClicked) {
      setIsVideClicked(false);
    }
    setActiveIndex(index); // Update active slide index
    // Use 'medium' compressed image for displayed image, fallback to original if compressed doesn't exist
    const compressedMedium = getCompressedImage(
      index === 0 ? productData : productData?.gallery_images?.[index - 1],
      'medium',
      img
    );
    const finalImage = (compressedMedium && compressedMedium !== img) ? compressedMedium : img;
    setDisplayedImage(finalImage); // Update displayed image
  };

  const handleVideoClick = () => {
    setIsVideClicked(true);
  };

  const breakpoints = {
    0: {
      slidesPerView: 2,
    },
    430: {
      slidesPerView: 2,
    },
    576: {
      slidesPerView: 2.5,
    },
    768: {
      slidesPerView: 4,
    },
    1200: {
      slidesPerView: 6,
    },
    1400: {
      slidesPerView: 6,
    },
  };

  // Fire Facebook Pixel ViewContent with the catalog ID (only in production)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== 'production') return; // Skip in development
    if (!productData?.id || typeof window.fbq !== "function") return;

    const contentId = String(productData.id); // must match XML feed <id>
    const currency = systemSettingsData?.data?.currency_code || "USD";
    const value = Number(productData?.price);

    const payload = {
      content_ids: [contentId],
      content_type: "product",
      content_name: productData?.name,
    };

    if (!Number.isNaN(value)) {
      payload.value = value;
      payload.currency = currency;
    }

    window.fbq("track", "ViewContent", payload);
  }, [productData?.id, productData?.name, productData?.price, systemSettingsData?.data?.currency_code]);

  const openLightbox = () => {
    setViewerIsOpen(true);
    setCurrentImage(displayedImageIndex);
  };

  return isLoading ? (
    <Loader />
  ) : (
    <>
      {/* <BreadcrumbComponent title2={productData?.name} /> */}
      <section id="product_details_page">
        {productData ? (
          <div className="container">
            <div className="main_details">
              <div className="row" id="details_main_row">
                <div className="col-md-12 col-lg-8">
                  <div className="gallary_section">
                    <div className="display_img" style={{ position: 'relative', width: '100%', minHeight: '400px' }}>
                      {isVideClicked == false ? (
                        <Image
                          loading="lazy"
                          src={displayedImage ? normalizeImageUrl(displayedImage) : placeholderImageUrl}
                          fill
                          alt="display_img"
                          style={{ objectFit: 'contain' }}
                          onError={(e) => {
                            if (e.target.src !== placeholderImageUrl) {
                              e.target.src = placeholderImageUrl;
                            }
                          }}
                          onClick={openLightbox}
                        />
                      ) : (
                        <ReactPlayer
                          url={videoUrl}
                          controls
                          className="react-player"
                          width="100%"
                          height="500px"
                          config={{
                            file: {
                              attributes: { controlsList: "nodownload" },
                            },
                          }}
                        />
                      )}
                    </div>
                    <div
                      className={`${
                        galleryThumbnails.length + (videoUrl ? 1 : 0) > 1
                          ? "gallary_slider"
                          : "hide_gallery_slider"
                      }`}
                    >
                      <Swiper
                        dir={isRtl ? "rtl" : "ltr"}
                        slidesPerView={6}
                        className="gallary-swiper"
                        spaceBetween={20}
                        freeMode={true}
                        loop={false}
                        pagination={false}
                        modules={[FreeMode, Pagination]}
                        breakpoints={breakpoints}
                        onSlideChange={handleSlideChange}
                        onSwiper={(swiper) => {
                          swiperRef.current = swiper;
                          setIsBeginning(swiper.isBeginning);
                          setIsEnd(swiper.isEnd);
                        }}
                        key={isRtl}
                      >
                        {[...galleryThumbnails, ...(videoUrl ? [videoUrl] : [])]?.map(
                          (item, index) => (
                            <SwiperSlide
                              key={index}
                              className={
                                index === activeIndex
                                  ? "swiper-slide-active"
                                  : ""
                              }
                            >
                              <div
                                className={`swiper_img_div ${
                                  index === activeIndex ? "selected" : ""
                                }`}
                              >
                                {index === galleryThumbnails.length && videoUrl ? (
                                  <div className="video-thumbnail">
                                    <div
                                      className="thumbnail-container"
                                      style={{ height: "8rem", position: "relative" }}
                                      onClick={handleVideoClick}
                                    >
                                      <Image
                                        src={thumbnailUrl || placeholderImageUrl}
                                        fill
                                        className="swiper_images"
                                        loading="lazy"
                                        alt="Video thumbnail"
                                        style={{ objectFit: 'cover' }}
                                        onError={(e) => {
                                          if (e.target.src !== placeholderImageUrl) {
                                            e.target.src = placeholderImageUrl;
                                          }
                                        }}
                                      />
                                      <div
                                        className="video-overlay"
                                        style={{
                                          position: "relative",
                                          bottom: "5rem",
                                          left: "3rem",
                                        }}
                                      >
                                        <FaPlayCircle size={24} />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ position: "relative", width: "100%", height: "8rem" }}>
                                    <Image
                                      src={item ? normalizeImageUrl(item) : placeholderImageUrl}
                                      fill
                                      className="swiper_images"
                                      loading="lazy"
                                      alt={`Product image ${index + 1}`}
                                      style={{ objectFit: 'cover' }}
                                      onError={(e) => {
                                        if (e.target.src !== placeholderImageUrl) {
                                          e.target.src = placeholderImageUrl;
                                        }
                                      }}
                                      onClick={() => {
                                        // Get the original image path first
                                        const originalImg = index === 0 
                                          ? productData?.image 
                                          : productData?.gallery_images?.[index - 1]?.image;
                                        // handleImageClick will get 'medium' compressed for displayedImage (big photo)
                                        // Each image is checked individually for compressed version
                                        handleImageClick(originalImg, index);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </SwiperSlide>
                          )
                        )}
                      </Swiper>
                      {galleryThumbnails.length + (videoUrl ? 1 : 0) > 1 && (
                        <>
                          <button
                            className="pag_leftarrow_cont leftarrow"
                            onClick={swipePrev}
                          >
                            <FaArrowLeft className="arrowLeft" />
                          </button>
                          <button
                            className="pag_rightarrow_cont rightarrow"
                            onClick={swipeNext}
                          >
                            <FaArrowRight className="arrowRight" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {productData?.custom_fields?.length > 0 && (
                    <div className="product_spacs card">
                      <div className="highlights">
                        <span>
                          <FaRegLightbulb size={22} />
                        </span>
                        <span>{t("highlights")}</span>
                      </div>
                      <div className="spacs_list">
                        {productData?.custom_fields &&
                          productData.custom_fields.map((e, index) => {
                            const isValueEmptyArray =
                              e.value === null ||
                              e.value === "" ||
                              (Array.isArray(e.value) &&
                                (e.value.length === 0 ||
                                  (e.value.length === 1 &&
                                    (e.value[0] === "" ||
                                      e.value[0] === null))));

                            return (
                              !isValueEmptyArray && (
                                <div className="spac_item" key={index}>
                                  <div className="spac_img_title">
                                    <div className={getImageClass(e?.image)}>
                                      <Image
                                        src={e?.image}
                                        loading="lazy"
                                        alt="spacs_item_img"
                                        width={34}
                                        height={34}
                                        onErrorCapture={placeholderImage}
                                      />
                                    </div>
                                    <span>{e?.name}</span>
                                  </div>
                                  <div className="spacs_value">
                                    <div className="diveder">:</div>
                                    {e.type === "fileinput" ? (
                                      isPdf(e?.value[0]) ? (
                                        <div>
                                          <MdOutlineAttachFile className="file_icon" />
                                          <Link
                                            href={e?.value[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {t("viewPdf")}
                                          </Link>
                                        </div>
                                      ) : (
                                        <Link
                                          href={e?.value[0]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Image
                                            loading="lazy"
                                            src={e?.value[0]}
                                            alt="Preview"
                                            width={36}
                                            height={36}
                                            className="file_preview"
                                          />
                                        </Link>
                                      )
                                    ) : (
                                      <p>{e?.value}</p>
                                    )}
                                  </div>
                                </div>
                              )
                            );
                          })}
                      </div>
                    </div>
                  )}
                  <ProductDescription productData={productData} t={t} />
                </div>
                <div className="col-md-12 col-lg-4">
                  <ProductDetailCard
                    productData={productData}
                    setProductData={setProductData}
                    systemSettingsData={systemSettingsData}
                  />
                  <SellerCardInProdDet
                    productData={productData}
                    systemSettingsData={systemSettingsData}
                    setProductData={setProductData}
                  />
                  <LocationCardInProdDet productData={productData} />
                  {!productData?.is_already_reported && (
                    <ReportAdCard
                      productData={productData}
                      setIsReportModal={setIsReportModal}
                    />
                  )}
                </div>
              </div>
            </div>
            <SimilarProducts productData={productData} />
            <NearbyProducts productData={productData} />
          </div>
        ) : (
          <div>
            <NoData name={t("data")} />
          </div>
        )}
      </section>
      <CustomLightBox
        lightboxOpen={viewerIsOpen}
        currentImages={images}
        currentImageIndex={currentImage}
        handleCloseLightbox={() => setViewerIsOpen(false)}
        setCurrentImage={setCurrentImage}
      />
      {isReportModal && (
        <ReportModal
          IsReportModalOpen={isReportModal}
          OnHide={() => setIsReportModal(false)}
          itemID={productData?.id}
          setProductData={setProductData}
        />
      )}
      <OpenInAppDrawer
        IsOpenInApp={IsOpenInApp}
        OnHide={() => setIsOpenInApp(false)}
        systemSettingsData={systemSettingsData}
      />
    </>
  );
};

export default SingleProductDetail;
