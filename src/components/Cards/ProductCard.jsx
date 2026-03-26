"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaRegHeart } from "react-icons/fa";
import {
  // formatDate, // unused (only in commented date block)
  formatPriceAbbreviated,
  formatSalaryRange,
  // placeholderImage, // unused (using placeholderImageUrl from settings)
  t,
  useIsRtl,
  toArabicDigits,
  toLatinDigits,
  formatNumberByLang,
  normalizeImageUrl,
  getCompressedImage,
} from "@/utils";
import { BiBadgeCheck, BiPhoneCall } from "react-icons/bi";
import { LuMapPin } from "react-icons/lu";
import { FaHeart, FaWhatsapp } from "react-icons/fa6";
import { manageFavouriteApi } from "@/utils/api";
import toast from "react-hot-toast";
import { userSignUpData } from "../../redux/reuducer/authSlice";
import { useSelector } from "react-redux";
import { toggleLoginModal } from "@/redux/reuducer/globalStateSlice";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { settingsData } from "@/redux/reuducer/settingSlice";
import { useEffect, useState, useMemo, memo } from "react";
// import { store } from "@/redux/store"; // unused
import { usePrefetchOnHover } from "@/utils/prefetchUtils";
// ✅ TBT Fix: Lazy-load antd Modal (only needed when image gallery opens)

/**
 * Darken a hex color by a factor to ensure WCAG AA contrast on white/light backgrounds.
 * Factor 0.5 for badges (green/orange) to meet 4.5:1 on light tints.
 */
const darkenForContrast = (color, factor = 0.5) => {
  if (!color || typeof color !== 'string') return color;
  const hex = color.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return color;
  const r = Math.round(parseInt(hex.substr(0, 2), 16) * factor);
  const g = Math.round(parseInt(hex.substr(2, 2), 16) * factor);
  const b = Math.round(parseInt(hex.substr(4, 2), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const ProductCard = ({ data, handleLike, priority = false }) => {
  const router = useRouter();
  const userData = useSelector(userSignUpData);
  const currentLanguage = useSelector(CurrentLanguageData);
  const systemSettingsData = useSelector(settingsData);
  const settings = systemSettingsData?.data;
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const isRtl = useIsRtl();
  const isJobCategory = Number(data?.category?.is_job_category) === 1;

  // Category label: use translation for current language when available, else translated_name or name
  const categoryDisplayName = useMemo(() => {
    const cat = data?.category;
    if (!cat) return null;
    const langId = currentLanguage?.id;
    if (langId && Array.isArray(cat.translations) && cat.translations.length > 0) {
      const translation = cat.translations.find((t) => Number(t.language_id) === Number(langId));
      if (translation?.name) return translation.name;
    }
    return cat.translated_name || cat.name || null;
  }, [data?.category, data?.category?.translations, data?.category?.translated_name, data?.category?.name, currentLanguage?.id]);

  // Get placeholder image from settings
  const placeholderImageUrl = useMemo(() => {
    return settings?.placeholder_image || '/assets/Transperant_Placeholder.png';
  }, [settings?.placeholder_image]);

  // Get all images (main + gallery) - ✅ Use compressed images: 'small' for card, 'medium' for modal
  const allImages = useMemo(() => {
    // For card display, use 'small' compressed version
    const mainImage = getCompressedImage(data, 'small', data?.image);
    const mainImageNormalized = mainImage ? normalizeImageUrl(mainImage) : null;
    
    // For gallery in modal, use 'medium' compressed versions
    const galleryImages = data?.gallery_images?.map((img) => {
      const compressedImg = getCompressedImage(img, 'medium', typeof img === 'string' ? img : img?.image);
      return compressedImg ? normalizeImageUrl(compressedImg) : null;
    }).filter(Boolean) || [];
    
    return [mainImageNormalized, ...galleryImages].filter(Boolean);
  }, [data?.image, data?.compressed, data?.gallery_images]);

  // Get the main image with fallback to placeholder - ✅ Use 'small' compressed
  const mainImageSrc = useMemo(() => {
    // Try to get compressed 'small' image, fallback to original image if compressed doesn't exist
    const compressedSmall = getCompressedImage(data, 'small', data?.image);
    // If compressed path doesn't exist or is invalid, use original image
    const image = (compressedSmall && compressedSmall !== data?.image) ? compressedSmall : (data?.image || allImages[0]);
    return image ? normalizeImageUrl(image) : placeholderImageUrl;
  }, [allImages, data?.image, data?.compressed, placeholderImageUrl]);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobileDevice(
        /Mobi|Android|iP(hone|od|ad)|Phone/i.test(
          window.navigator?.userAgent || ""
        )
      );
    }
  }, []);

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
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    try {
      if (!userData) {
        toggleLoginModal(true)
        return;
      }
      const response = await manageFavouriteApi.manageFavouriteApi({
        item_id: data?.id,
      });
      if (response?.data?.error === false) {
        toast.success(response?.data?.message);
        handleLike(data?.id);
      } else {
        toast.success(t("failedToLike"));
      }
    } catch (error) {
      console.log(error);
      toast.success(t("failedToLike"));
    }
  };

  // Helper function to get contact info
  const getContactInfo = useMemo(() => {
    // Check item first, then fallback to user
    const itemPhone = data?.phone || data?.user?.phone || data?.user?.mobile;
    const itemCountryCode = data?.country_code || data?.user?.country_code;
    // const canShowContact =
    //   (data?.user?.show_personal_details === 1 ||
    //     data?.show_personal_details === 1) &&
    //   itemPhone;

    // if (!canShowContact) {
    //   return { canShow: false, telNumber: "", whatsappLink: "" };
    // }

    const rawCountryCode = itemCountryCode || "";
    const rawPhone = itemPhone || "";
    const trimmedCountryCode = rawCountryCode.trim();
    const digitsCountryCode = trimmedCountryCode.replace(/[^\d+]/g, "");
    const digitsOnlyPhone = rawPhone.replace(/\D/g, "");

    const telNumber = `${digitsCountryCode}${digitsOnlyPhone}`.replace(/\s+/g, "");
    const whatsappNumber = `${digitsCountryCode}${digitsOnlyPhone}`.replace(/\D/g, "");

    const applicationName = settings?.application_name || "Arablaza";
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const itemUrl = data?.slug ? `${baseUrl.replace(/\/$/, "")}/product-details/${data.slug}` : "";
    const intro = (t("whatsappMessageIntro") || "").replace(/\{\{appName\}\}/g, applicationName);
    const outreachMessage = itemUrl ? `${intro}\n\n${itemUrl}` : intro;

    const whatsappLink = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(outreachMessage)}`
      : "";
        // console.log(isArabic);
    return { /*canShow: true,*/ telNumber, whatsappLink };
  }, [data?.phone, data?.country_code, data?.user?.phone, data?.user?.mobile, data?.user?.country_code, data?.user?.show_personal_details, data?.show_personal_details, data?.slug, settings?.application_name, currentLanguage?.language?.code]);

  const handleCallClick = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const contactInfo = getContactInfo;
    if (/*!contactInfo.canShow ||*/ !contactInfo.telNumber) return;
    
    const telUrl = `tel:${contactInfo.telNumber}`;
    if (typeof window === "undefined") return;
    if (isMobileDevice) {
      window.location.href = telUrl;
    } else {
      window.open(telUrl, "_self");
    }
  };

  const handleWhatsappClick = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const contactInfo = getContactInfo;
    if (/*!contactInfo.canShow ||*/ !contactInfo.whatsappLink) return;
    
    if (typeof window === "undefined") return;
    window.open(contactInfo.whatsappLink, "_blank");
  };

  const productDetailsUrl = userData?.id == data?.user_id
    ? `/my-listing/${encodeURIComponent(data?.slug || '')}`
    : `/product-details/${encodeURIComponent(data?.slug || '')}`;

  const handleCardImageClick = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    router.push(productDetailsUrl);
  };

  // ✅ Prefetch on hover for faster navigation
  const prefetchHandlers = usePrefetchOnHover(productDetailsUrl, 150);

  // Get language code with proper fallback (default to "en")
  const getLanguageCode = () => {
    return currentLanguage?.language?.code || "en";
  };


  // Translate date format to Arabic using currentLanguage for consistency
  const translateDate = (dateString) => {
    if (!dateString) return "";
    
    const langCode = getLanguageCode();
    const original = String(dateString).trim();
    const lower = original.toLowerCase();

    // If the token is 'now' or similar, use translation to ensure proper localization
    if (lower === "now" || lower === "just now" || lower.includes("الآن")) {
      return t("now");
    }

    // If Arabic language is active
    if (langCode === "ar") {
      // If input contains English time tokens like '3h', '2d', etc., translate them
      if (/\b\d+\s*(d|mo|h|m|w|y)\b/i.test(original)) {
        let translated = original
          .replace(/\b(\d+)\s*d\b/gi, "$1 ي")  // days
          .replace(/\b(\d+)\s*mo\b/gi, "$1 ش")  // months
          .replace(/\b(\d+)\s*h\b/gi, "$1 س")  // hours
          .replace(/\b(\d+)\s*m\b/gi, "$1 د")  // minutes
          .replace(/\b(\d+)\s*w\b/gi, "$1 أ")  // weeks
          .replace(/\b(\d+)\s*y\b/gi, "$1 ع");  // years
        return toArabicDigits(translated);
      }

      // Otherwise, assume the string may already be localized to Arabic; ensure digits are Arabic-Indic
      return toArabicDigits(original);
    }

    // Default: ensure Latin digits for non-Arabic languages
    return toLatinDigits(original);
  };

  // Format distance with proper unit
  const formatDistance = (distance) => {
    if (!distance || distance === 0 || distance === null || distance === undefined) {
      return null;
    }
    const langCode = getLanguageCode();
    
    // Use translation function for unit
    const unit = t("km") || (langCode === "ar" ? "كم" : "Km");
    
    // Use Intl.NumberFormat via helper for correct digits and decimal separator per language
    const formattedNumber = formatNumberByLang(distance, distance % 1 === 0 ? 0 : 1, false);
    const distanceWithUnit = `${formattedNumber} ${unit}`;
    return distanceWithUnit;
  };

  return (
    <article className="product_card_new card-shadow" role="article" aria-label={data?.name || "Product"}>
      <button 
        className={`favorite_btn_new ${data?.is_liked ? 'isLiked' : ''}`}
        onClick={(e) => handleLikeItem(e)}
        aria-label={data?.is_liked ? "Remove from favorites" : "Add to favorites"}
      >
        {data?.is_liked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
      </button>

      <div 
        className="product_card_img_cont"
        onClick={handleCardImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardImageClick(e);
          }
        }}
        {...prefetchHandlers}
      >
        {data?.is_feature && (
          <span className="featured_badge_new">
            <BiBadgeCheck size={16} /> {t("featured")}
          </span>
        )}
        
        {/* Verification Badge - using a field like is_verified if exists, or show it based on category/data */}
        {(data?.is_verified || data?.category?.is_verified) && (
          <span className="verified_badge">
            <BiBadgeCheck size={14} /> {t("verified") || "Verified"}
          </span>
        )}

        {/* Custom Fields on Image */}
        <div className="image_custom_fields">
          {data?.custom_fields?.filter(cf => 
            cf.show_on_image_card == 1 && 
            cf.value && 
            ['radio', 'dropdown', 'checkbox', 'number'].includes(cf.type)
          ).map((cf) => (
            <span 
              key={cf.id} 
              className="image_cf_badge"
              style={{ backgroundColor: cf.bg_color ? darkenForContrast(cf.bg_color) : 'rgba(0, 0, 0, 0.6)' }}
            >
              {cf.image && (
                <img src={cf.image} alt="" width={12} height={12} loading="lazy" style={{ width: '12px', height: '12px', objectFit: 'contain' }} />
              )}
              {Array.isArray(cf.value) ? cf.value.join(', ') : cf.value}
            </span>
          ))}
        </div>

        <Image
          src={mainImageSrc}
          width={400}
          height={224}
          alt={data?.name || "Product"}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" } : {})}
          // Reduce bytes for listing thumbnails (helps LCP on mobile category/search pages).
          quality={priority ? 55 : 40}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNCIgZmlsbD0iI2YxZjVmOSIvPjwvc3ZnPg=="
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          onError={(e) => {
            if (e.target.src !== placeholderImageUrl) {
              e.target.src = placeholderImageUrl;
            }
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {allImages.length > 1 && (
          <div 
            className="product_card_image_count"
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 500,
              zIndex: 3,
              pointerEvents: 'none'
            }}
          >
            {allImages.length} {t('images') || 'Images'}
          </div>
        )}
      </div>

      <div className="product_card_body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="text-brand font-black" style={{ fontSize: '1.25rem', fontWeight: 900 }}>
            {isJobCategory
              ? formatSalaryRange(data?.min_salary, data?.max_salary)
              : formatPriceAbbreviated(data?.price)}
          </span>
          {categoryDisplayName && (
            <span className="category_badge">
              {categoryDisplayName}
            </span>
          )}
        </div>

        <Link 
          href={productDetailsUrl}
          className="product_title_new"
          style={{ textDecoration: 'none' }}
          {...prefetchHandlers}
        >
          {data?.name}
        </Link>

        {/* Tags & Custom Fields Section */}
        <div className="d-flex flex-wrap gap-1 mb-3">
          {data?.is_feature && (
            <span className="tag_badge tag_yellow">
              <i className="fas fa-star me-1"></i>{t("featured")}
            </span>
          )}
          {isJobCategory && (
             <span className="tag_badge tag_blue">
              {t("job")}
           </span>
          )}
          {/* Render custom fields if show_on_card_details is checked and match specific types */}
          {data?.custom_fields?.filter(cf => 
            cf.show_on_card_details == 1 &&
            cf.value && 
            ['radio', 'dropdown', 'checkbox', 'number'].includes(cf.type)
          ).slice(0, 2).map((cf, idx) => (
            <span 
              key={cf.id} 
              className="custom_field_badge"
              style={{ 
                backgroundColor: cf.bg_color ? `${cf.bg_color}15` : '', 
                color: cf.bg_color ? darkenForContrast(cf.bg_color, 0.45) : '',
                border: cf.bg_color ? `1px solid ${cf.bg_color}30` : ''
              }}
            >
              {cf.name}: {Array.isArray(cf.value) ? cf.value.join(', ') : cf.value}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3">
          <div className="d-flex align-items-center text-secondary mb-3 flex-wrap gap-1" style={{ fontSize: '12px' }}>
            <LuMapPin size={14} className="text-accent  me-1" />
            <span className="text-truncate" style={{ maxWidth: '350px' }}>
              {(data?.state || data?.city)
                ? [data?.state, data?.city].filter(Boolean).join(', ')
                : (data?.address || '')}
            </span>
            {formatDistance(data?.distance) ? (
              <>
                <span className="mx-2 text-gray-300">|</span>
                <span className="distance_badge">{formatDistance(data.distance)}</span>
                <span className="mx-2 text-gray-300">|</span>
              </>
            ) : null}
            {/* Date on card - re-enable to show again
            <span className="mx-2 text-gray-300">|</span>
            <i className="far fa-clock me-1 text-gray-400"></i>
            <span>{translateDate(formatDate(data?.created_at))}</span>
            */}
          </div>

          <div className="row g-2">
            <div className="col-6">
              <button 
                className="action_btn_call w-100"
                onClick={handleCallClick}
              >
                <BiPhoneCall size={18} /> {t('callDirect') || 'Call'}
              </button>
            </div>
            <div className="col-6">
              <button 
                className="action_btn_whatsapp w-100"
                onClick={handleWhatsappClick}
              >
                <FaWhatsapp size={18} /> {t('whatsappBtnLabel')?.split(' ')[0] || 'WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image modal/gallery removed from cards to reduce initial JS on home. */}
      {/* Unused: targets product_card_prod_name_link / product_card_prod_name; this component uses product_title_new
      <style dangerouslySetInnerHTML={{
        __html: `
          .product_card_prod_name_link {
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .product_card_prod_name_link:hover .product_card_prod_name {
            color: var(--primary-color, #007bff) !important;
            transform: translateX(2px);
            transition: all 0.2s ease;
          }
          .product_card_prod_name_link:active .product_card_prod_name {
            transform: translateX(2px) scale(0.98);
            transition: all 0.1s ease;
          }
          .product_card_prod_name {
            transition: all 0.2s ease;
            cursor: pointer;
          }
        `
      }} />
      */}
    </article>
  );
};

// ✅ Memoize ProductCard to prevent unnecessary re-renders
// This is the most used component, so memoization will have significant impact
export default memo(ProductCard, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.data?.id === nextProps.data?.id &&
    prevProps.data?.image === nextProps.data?.image &&
    prevProps.data?.compressed === nextProps.data?.compressed &&
    prevProps.data?.price === nextProps.data?.price &&
    prevProps.data?.name === nextProps.data?.name &&
    prevProps.handleLike === nextProps.handleLike &&
    prevProps.priority === nextProps.priority
  );
});
