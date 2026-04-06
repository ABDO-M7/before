"use client";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { FaArrowLeft, FaArrowRight, FaRegLightbulb } from "react-icons/fa6";
import { MdKeyboardArrowDown, MdOutlineAttachFile } from "react-icons/md";
import adIcon from "../../../../public/assets/ad_icon.svg";
import NoPackageModal from "@/components/MyListing/NoPackageModal";
import Image from "next/image";
import {
  IsAdExpired,
  isLogin,
  isPdf,
  placeholderImage,
  t,
  useIsRtl,
  getCompressedImage,
  normalizeImageUrl,
} from "@/utils";
import {
  chanegItemStatusApi,
  getLimitsApi,
  getMyItemsApi,
  getPackageApi,
  renewItemApi
} from "@/utils/api";
import Link from "next/link";
import toast from "@/utils/toast";
import { FaPlayCircle } from "react-icons/fa";
// ✅ Lazy load ReactPlayer to reduce initial bundle size
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });
import { useDispatch, useSelector } from "react-redux";
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice";
import { settingsData } from "@/redux/reuducer/settingSlice";
// import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent";
import SoldOutModal from "./SoldOutModal";
import SoldOutConfirmModal from "./SoldOutConfirmModal";
import CustomLightBox from "@/components/ProductDetails/CustomLightBox";
import ProductDescription from "../SingleProductDetail/ProductDescription";
import MyProdDetail from "./MyProdDetail";
import UpdateMyItemStatus from "./UpdateMyItemStatus";
import LocationCardInProdDet from "../SingleProductDetail/LocationCardInProdDet";
import { useRouter } from "next/navigation";
import AdEditedByAdmin from "./AdEditedByAdmin";


const SingleListing = ({ slug }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const swiperRef = useRef();
  const isRtl = useIsRtl();
  const systemSettingsData = useSelector(settingsData);
  const settings = systemSettingsData?.data;
  const placeholderImageUrl = settings?.placeholder_image || '/assets/Transperant_Placeholder.png';
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [SingleListing, setSingleListing] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [Status, setStatus] = useState("");
  const [displayedImage, setDisplayedImage] = useState();
  const [IsNoPackageModal, setIsNoPackageModal] = useState(false);
  const [IsGranted, setIsGranted] = useState(false);
  const [IsShowCreateFeaturedAd, setIsShowCreateFeaturedAd] = useState(false);
  const [images, setImages] = useState([]); // For lightbox (large)
  const [galleryThumbnails, setGalleryThumbnails] = useState([]); // For gallery row (small)
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isVideClicked, setIsVideClicked] = useState(false);
  const [IsCallSingleListing, setIsCallSingleListing] = useState(false);
  const [IsSoldOutModalOpen, setIsSoldOutModalOpen] = useState(false);
  const [IsSoldOutConfirmModal, setIsSoldOutConfirmModal] = useState(false);
  const [selectedRadioValue, setSelectedRadioValue] = useState(null);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const displayedImageIndex = images.findIndex(
    (image) => image === displayedImage
  );
  const [currentImage, setCurrentImage] = useState(1);
  const [RenewId, setRenewId] = useState("");
  const [ItemPackages, setItemPackages] = useState([]);
  const isExpired = IsAdExpired(SingleListing);
  const isEditedByAdmin = SingleListing?.is_edited_by_admin === 1;



  const getSingleListingData = async () => {
    try {
      const res = await getMyItemsApi.getMyItems({ slug: slug });
      setSingleListing(res?.data?.data?.data?.[0]);

      res?.data?.data?.data?.[0];

      const adName = res?.data?.data?.data?.[0]?.name;
      setStatus(res?.data?.data?.data?.[0]?.status);
      const itemData = res?.data?.data?.data?.[0];
      // Use 'medium' compressed image for main displayed image
      const mainImageMedium = getCompressedImage(itemData, 'medium', itemData?.image);
      const mainImage = mainImageMedium || itemData?.image;
      setDisplayedImage(mainImage && mainImage !== "" ? mainImage : placeholderImageUrl);
      dispatch(
        setBreadcrumbPath([
          {
            name: t("ads"),
            slug: "/ads",
          },
          {
            name: adName,
          },
        ])
      );
      if (
        res?.data?.data?.data?.[0]?.status === "approved" &&
        res?.data?.data?.data?.[0]?.is_feature === false
      ) {
        setIsShowCreateFeaturedAd(true);
      } else {
        setIsShowCreateFeaturedAd(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isLogin()) {
      getSingleListingData();
    }
  }, [IsNoPackageModal, IsCallSingleListing]);

  useEffect(() => {
    // For lightbox, use 'large' compressed images, fallback to original if compressed doesn't exist
    const mainImageLarge = getCompressedImage(SingleListing, 'large', SingleListing?.image);
    const finalMainLarge = (mainImageLarge && mainImageLarge !== SingleListing?.image) ? mainImageLarge : (SingleListing?.image || null);
    const galleryImagesLarge = SingleListing?.gallery_images?.map((img) => {
      const originalImg = typeof img === 'string' ? img : img?.image;
      const compressedImg = getCompressedImage(img, 'large', originalImg);
      return (compressedImg && compressedImg !== originalImg) ? compressedImg : originalImg;
    }).filter(Boolean) || [];
    const validImagesLarge = [finalMainLarge, ...galleryImagesLarge].filter(
      (img) => img && img !== "" && img !== null && img !== undefined
    );
    setImages(validImagesLarge.length > 0 ? validImagesLarge : [placeholderImageUrl]);
    
    // For gallery thumbnails, use 'small' compressed images, fallback to original if compressed doesn't exist
    const mainImageSmall = getCompressedImage(SingleListing, 'small', SingleListing?.image);
    const finalMainSmall = (mainImageSmall && mainImageSmall !== SingleListing?.image) ? mainImageSmall : (SingleListing?.image || null);
    const galleryImagesSmall = SingleListing?.gallery_images?.map((img) => {
      const originalImg = typeof img === 'string' ? img : img?.image;
      const compressedImg = getCompressedImage(img, 'small', originalImg);
      return (compressedImg && compressedImg !== originalImg) ? compressedImg : originalImg;
    }).filter(Boolean) || [];
    const validImagesSmall = [finalMainSmall, ...galleryImagesSmall].filter(
      (img) => img && img !== "" && img !== null && img !== undefined
    );
    setGalleryThumbnails(validImagesSmall.length > 0 ? validImagesSmall : [placeholderImageUrl]);
    
    // Set displayed image to 'medium' compressed version, fallback to original if compressed doesn't exist
    const mainImageMedium = getCompressedImage(SingleListing, 'medium', SingleListing?.image);
    const finalMainMedium = (mainImageMedium && mainImageMedium !== SingleListing?.image) ? mainImageMedium : (SingleListing?.image || null);
    if (finalMainMedium && finalMainMedium !== displayedImage) {
      setDisplayedImage(finalMainMedium);
    } else if (validImagesSmall.length > 0) {
      const firstValidImage = validImagesSmall[0];
      if (firstValidImage && firstValidImage !== displayedImage) {
        setDisplayedImage(firstValidImage);
      }
    } else if (!displayedImage || displayedImage === placeholderImageUrl) {
      setDisplayedImage(placeholderImageUrl);
    }
    
    if (SingleListing?.video_link !== null && SingleListing?.video_link !== "") {
      setVideoUrl(SingleListing?.video_link);
      const videoId = getYouTubeVideoId(SingleListing?.video_link);
      if (videoId === false) {
        setThumbnailUrl("");
      } else {
        setThumbnailUrl(
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        );
      }
    } else {
      setVideoUrl("");
      setThumbnailUrl("");
    }
  }, [SingleListing, placeholderImageUrl]);

  useEffect(() => {
    if (isExpired) {
      getItemsPackageData();
    }
  }, [isExpired]);


  const getItemsPackageData = async () => {
    try {
      const res = await getPackageApi.getPackage({ type: "item_listing" });
      const { data } = res.data;
      setItemPackages(data);
      setRenewId(data[0]?.id);
    } catch (error) {
      console.log(error);
    }
  };

  const getYouTubeVideoId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    if (match) {
      return match && match[2].length === 11 ? match[2] : null;
    } else {
      return false;
    }
  };

  const swipePrev = () => {
    if (displayedImageIndex > 0) {
      // Check if there's a previous image
      swiperRef?.current?.slidePrev();
      // Get medium compressed version for displayed image
      const prevIndex = displayedImageIndex - 1;
      const prevItem = prevIndex === 0 ? SingleListing : SingleListing?.gallery_images?.[prevIndex - 1];
      const prevImageMedium = getCompressedImage(prevItem, 'medium', images[prevIndex]);
      setDisplayedImage(prevImageMedium || images[prevIndex]);
      setActiveIndex(prevIndex);
    }
  };

  const swipeNext = () => {
    if (displayedImageIndex < images.length - 1) {
      // Check if there's a next image
      swiperRef?.current?.slideNext();
      // Get medium compressed version for displayed image
      const nextIndex = displayedImageIndex + 1;
      const nextItem = nextIndex === 0 ? SingleListing : SingleListing?.gallery_images?.[nextIndex - 1];
      const nextImageMedium = getCompressedImage(nextItem, 'medium', images[nextIndex]);
      setDisplayedImage(nextImageMedium || images[nextIndex]);
      setActiveIndex(nextIndex);
    }
  };

  const handleSlideChange = () => {
    setIsEnd(swiperRef?.current?.isEnd);
    setIsBeginning(swiperRef?.current?.isBeginning);
  };

  const handleImageClick = (index, item) => {
    setIsVideClicked(false);
    setActiveIndex(index); // Update active slide index
    // Use 'medium' compressed image for displayed image, fallback to original if compressed doesn't exist
    const itemData = index === 0 ? SingleListing : SingleListing?.gallery_images?.[index - 1];
    const compressedMedium = getCompressedImage(itemData, 'medium', item);
    const finalImage = (compressedMedium && compressedMedium !== item) ? compressedMedium : item;
    if (images[index]) {
      setDisplayedImage(finalImage);
    }
  };

  const handleVideoClick = () => {
    setIsVideClicked(true);
  };

  const breakpoints = {
    0: {
      slidesPerView: 2,
    },
    430: {
      slidesPerView: 3,
    },
    576: {
      slidesPerView: 3.5,
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

  const getLimitsData = async () => {
    try {
      const res = await getLimitsApi.getLimits({
        package_type: "advertisement",
      });
      if (res?.data?.error === false) {
        setIsGranted(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateFeaturedAd = () => {
    setIsNoPackageModal(true);
    getLimitsData();
  };

  const handleRenewChange = (e) => {
    setRenewId(e.target.value);
  };

  const handleSoldOut = () => {
    setIsSoldOutModalOpen(false);
    setIsSoldOutConfirmModal(true);
  };

  const makeItemSoldOut = async () => {
    const res = await chanegItemStatusApi.changeItemStatus({
      item_id: SingleListing?.id,
      status: "sold out",
      sold_to: selectedRadioValue,
    });
    if (res?.data?.error === false) {
      toast.success(t("statusUpdated"));
      setIsSoldOutConfirmModal(false);
      setIsCallSingleListing((prev) => !prev);
    } else {
      toast.error(t("failedToUpdateStatus"));
    }
  };

  const openLightbox = () => {
    setViewerIsOpen(true);
    setCurrentImage(displayedImageIndex);
  };

  const handleRenewItem = async () => {
    try {
      const subPackage = ItemPackages.find(
        (p) => Number(p.id) === Number(RenewId)
      );
      if (subPackage.is_active === false) {
        toast.error(t("purchasePackageFirst"));
        router.push("/user-subscription");
        return;
      }
      const res = await renewItemApi.renewItem({
        item_id: SingleListing?.id,
        package_id: RenewId,
      });

      if (res?.data?.error === false) {
        setSingleListing((prev) => ({
          ...prev,
          status: res?.data?.data?.status,
          expiry_date: res?.data?.data?.expiry_date,
        }));
        setStatus(res?.data?.data?.status);
        toast.success(res?.data?.message);
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {/* <BreadcrumbComponent /> */}
      <section id="product_details_page">
        <div className="container">
          <div className="main_details">
            <div className="row" id="details_main_row">
              <div className="col-md-12 col-lg-8">
                <div className="gallary_section">
                  <div className="display_img">
                    {isVideClicked == false ? (
                      <Image
                        src={displayedImage ? normalizeImageUrl(displayedImage) : placeholderImageUrl}
                        alt={SingleListing?.name || "Product image"}
                        loading="lazy"
                        width={870}
                        height={500}
                        sizes="(max-width: 768px) 100vw, 66vw"
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
                      />
                    )}
                  </div>
                  <div
                    className={`${galleryThumbnails.length + (videoUrl ? 1 : 0) > 1
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
                      {[...galleryThumbnails.filter(img => img && img !== ""), ...(videoUrl ? [videoUrl] : [])]?.map(
                        (item, index) => (
                          <SwiperSlide
                            key={index}
                            className={
                              index === activeIndex ? "swiper-slide-active" : ""
                            }
                          >
                            <div
                              className={`swiper_img_div ${index === activeIndex ? "selected" : ""
                                }`}
                            >
                              {index === galleryThumbnails.length && videoUrl ? (
                                <div className="video-thumbnail">
                                  <div
                                    className="thumbnail-container"
                                    style={{ height: "8rem" }}
                                    onClick={handleVideoClick}
                                  >
                                    {thumbnailUrl && thumbnailUrl !== "" ? (
                                      <Image
                                        src={thumbnailUrl}
                                        alt="Video thumbnail"
                                        width={160}
                                        height={128}
                                        sizes="160px"
                                        className="swiper_images"
                                        loading="lazy"
                                        onError={(e) => {
                                          if (e.target.src !== placeholderImageUrl) {
                                            e.target.src = placeholderImageUrl;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <Image
                                        src={placeholderImageUrl}
                                        alt="Video placeholder"
                                        width={160}
                                        height={128}
                                        sizes="160px"
                                        className="swiper_images"
                                        loading="lazy"
                                      />
                                    )}
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
                                <Image
                                  src={item && item !== "" ? normalizeImageUrl(item) : placeholderImageUrl}
                                  alt={`Product image ${index + 1}`}
                                  width={160}
                                  height={128}
                                  sizes="160px"
                                  className="swiper_images"
                                  loading="lazy"
                                  onError={(e) => {
                                    if (e.target.src !== placeholderImageUrl) {
                                      e.target.src = placeholderImageUrl;
                                    }
                                  }}
                                  onClick={() => {
                                    // Get original image for medium compression
                                    const originalImg = index === 0 
                                      ? SingleListing?.image 
                                      : SingleListing?.gallery_images?.[index - 1]?.image;
                                    if (originalImg && originalImg !== "") {
                                      handleImageClick(index, originalImg);
                                    }
                                  }}
                                />
                              )}
                            </div>
                          </SwiperSlide>
                        )
                      )}
                    </Swiper>
                    <button
                      className="pag_leftarrow_cont leftarrow"
                      onClick={swipePrev}
                    >
                      <FaArrowLeft size={24} />
                    </button>
                    <button
                      className="pag_rightarrow_cont rightarrow"
                      onClick={swipeNext}
                    >
                      <FaArrowRight size={24} />
                    </button>
                  </div>
                </div>

                {IsShowCreateFeaturedAd && (
                  <div className="feature_ad_section">
                    <div className="ad_content">
                      <div className="adicon_cont">
                        <Image
                          loading="lazy"
                          src={adIcon}
                          alt="Ad"
                          width={62}
                          height={75}
                          onErrorCapture={placeholderImage}
                        />
                      </div>
                      <p>{t("featureAdPrompt")}</p>
                    </div>
                    <button onClick={handleCreateFeaturedAd}>
                      {t("createFeaturedAd")}
                    </button>
                  </div>
                )}

                {SingleListing?.custom_fields?.length !== 0 && (
                  <div className="product_spacs card">
                    <div className="highlights">
                      <span>
                        <FaRegLightbulb size={22} />
                      </span>
                      <span>{t("highlights")}</span>
                    </div>
                    <div className="spacs_list">
                      {SingleListing?.custom_fields?.map((e, index) => {
                        const isValueEmptyArray =
                          e.value === null ||
                          e.value === "" ||
                          (Array.isArray(e.value) &&
                            (e.value.length === 0 ||
                              (e.value.length === 1 &&
                                (e.value[0] === "" || e.value[0] === null))));

                        return (
                          !isValueEmptyArray && (
                            <div className="spac_item" key={index}>
                              <div className="spac_img_title">
                                <div className="spac_item_img">
                                  <Image
                                    src={e?.image}
                                    loading="lazy"
                                    alt="spacs_item_img"
                                    width={24}
                                    height={24}
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
                                  <p>
                                    {Array.isArray(e?.value)
                                      ? e?.value.join(", ")
                                      : e?.value}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        );
                      })}
                    </div>
                  </div>
                )}
                <ProductDescription productData={SingleListing} t={t} />

                <div className="product_spacs card" style={{ marginTop: "1rem" }}>
                  <div className="highlights">
                    <span>{t("notesPlaceholder")}</span>
                  </div>
                  <div className="spacs_list">
                    <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                      {SingleListing?.notes && SingleListing.notes.trim() !== ""
                        ? SingleListing.notes
                        : t("noNotes")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-12 col-lg-4">
                <MyProdDetail
                  SingleListing={SingleListing}
                  t={t}
                  Status={Status}
                  slug={slug}
                />

                <UpdateMyItemStatus
                  SingleListing={SingleListing}
                  t={t}
                  Status={Status}
                  setStatus={setStatus}
                  setSingleListing={setSingleListing}
                  setIsSoldOutModalOpen={setIsSoldOutModalOpen}
                  setIsCallSingleListing={setIsCallSingleListing}
                />

                {isEditedByAdmin && (
                  <AdEditedByAdmin admin_edit_reason={SingleListing?.admin_edit_reason} />
                )}

                {isExpired && (
                  <div className="change_status">
                    <p className="status">{t("renewAd")}</p>
                    <div className="change_status_content">
                      <div className="status_select_wrapper">
                        <select
                          name="renew"
                          id="renew"
                          value={RenewId}
                          onChange={handleRenewChange}
                          className="status_select"
                        >
                          {ItemPackages.map((item) => (
                            <option value={item?.id} key={item?.id}>
                              {item?.name} - {item.duration} {t("days")}
                            </option>
                          ))}
                        </select>
                        <MdKeyboardArrowDown
                          size={20}
                          className="down_select_arrow"
                        />
                      </div>
                      <button onClick={handleRenewItem} className="save_btn">
                        {t("save")}
                      </button>
                    </div>
                  </div>
                )}
                <LocationCardInProdDet productData={SingleListing} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CustomLightBox
        lightboxOpen={viewerIsOpen}
        currentImages={images}
        currentImageIndex={currentImage}
        handleCloseLightbox={() => setViewerIsOpen(false)}
        setCurrentImage={setCurrentImage}
      />

      <NoPackageModal
        IsNoPackageModal={IsNoPackageModal}
        OnHide={() => setIsNoPackageModal(false)}
        IsGranted={IsGranted}
        item_id={SingleListing?.id}
      />

      <SoldOutModal
        SingleListing={SingleListing}
        IsSoldOutModalOpen={IsSoldOutModalOpen}
        OnHide={() => setIsSoldOutModalOpen(false)}
        handleSoldOut={handleSoldOut}
        selectedRadioValue={selectedRadioValue}
        setSelectedRadioValue={setSelectedRadioValue}
        isJobCategory={SingleListing?.category?.is_job_category === 1}
      />

      <SoldOutConfirmModal
        isOpen={IsSoldOutConfirmModal}
        OnHide={() => setIsSoldOutConfirmModal(false)}
        makeItemSoldOut={makeItemSoldOut}
        isJobCategory={SingleListing?.category?.is_job_category === 1}
      />
    </>
  );
};

export default SingleListing;
