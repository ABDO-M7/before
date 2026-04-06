"use client";
import { userSignUpData } from "@/redux/reuducer/authSlice";
import { toggleLoginModal } from "@/redux/reuducer/globalStateSlice";
import { saveOfferData } from "@/redux/reuducer/offerSlice";
import { extractYear, isLogin, t } from "@/utils"; // favicon_icon unused (using settingsData?.favicon_icon)
import { itemOfferApi } from "@/utils/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "@/utils/toast";
import { BiPhoneCall } from "react-icons/bi";
import {
  FaArrowRight,
  FaPaperPlane,
  FaWhatsapp,
  FaRegCommentDots,
} from "react-icons/fa6";
import { IoMdStar } from "react-icons/io";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { MdVerifiedUser } from "react-icons/md";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import ApplyJobModal from "./ApplyJobModal";

const SellerCardInProdDet = ({
  productData,
  systemSettingsData,
  setProductData,
}) => {
  const router = useRouter();
  const userData = productData && productData?.user;
  const currentLanguage = useSelector(CurrentLanguageData);
  const [IsStartingChat, setIsStartingChat] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [currentPageUrl, setCurrentPageUrl] = useState("");
  const loggedInUser = useSelector(userSignUpData);
  const loggedInUserId = loggedInUser?.id;
  const [showApplyModal, setShowApplyModal] = useState(false);
  const item_id = productData?.id;
  const isApplied = productData?.is_already_job_applied;

  const settingsData = systemSettingsData?.data?.data || {};
  const applicationName = settingsData?.application_name || "Arablaza";

  const isArabic = currentLanguage?.language?.code === "ar";
  // Check item phone first, then fallback to seller/user phone
  const itemPhone = productData?.phone || productData?.user?.phone || productData?.user?.mobile;
  // Check item country_code first, then fallback to seller/user country_code
  const itemCountryCode = productData?.country_code || productData?.user?.country_code;
  // const canShowContact =
  //   (productData?.user?.show_personal_details === 1 ||
  //     productData?.show_personal_details === 1) &&
  //   itemPhone;
  // const showContactInfo = Boolean(canShowContact);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobileDevice(
        /Mobi|Android|iP(hone|od|ad)|Phone/i.test(
          window.navigator?.userAgent || ""
        )
      );
      setCurrentPageUrl(window.location.href);
    }
  }, []);

  const outreachMessage = useMemo(() => {
    const intro = (t("whatsappMessageIntro") || "").replace(/\{\{appName\}\}/g, applicationName);
    return currentPageUrl ? `${intro}\n\n${currentPageUrl}` : intro;
  }, [applicationName, currentPageUrl]);

  const formattedNumbers = useMemo(() => {
    // if (!showContactInfo) {
    //   return {
    //     displayNumber: "",
    //     telNumber: "",
    //     whatsappLink: "",
    //     smsLink: "",
    //   };
    // }

    const rawCountryCode = itemCountryCode || "";
    const rawPhone = itemPhone || "";
    const trimmedCountryCode = rawCountryCode.trim();
    const digitsCountryCode = trimmedCountryCode.replace(/[^\d+]/g, "");
    const displayCountryCode =
      digitsCountryCode && digitsCountryCode.startsWith("+")
        ? digitsCountryCode
        : digitsCountryCode
        ? `+${digitsCountryCode}`
        : "";

    const digitsOnlyPhone = rawPhone.replace(/\D/g, "");
    const groupedPhone = digitsOnlyPhone.replace(/(\d{3})(?=\d)/g, "$1 ");

    const displayNumber = [displayCountryCode, groupedPhone]
      .filter(Boolean)
      .join(" ")
      .trim();

    const telNumber = `${digitsCountryCode}${digitsOnlyPhone}`.replace(
      /\s+/g,
      ""
    );

    const whatsappNumber = `${digitsCountryCode}${digitsOnlyPhone}`.replace(
      /\D/g,
      ""
    );
    const whatsappLink = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          outreachMessage
        )}`
      : "";

    const smsLink = telNumber
      ? `sms:${telNumber}?&body=${encodeURIComponent(outreachMessage)}`
      : "";

    return { displayNumber, telNumber, whatsappLink, smsLink };
  }, [itemCountryCode, itemPhone, /* showContactInfo, */ outreachMessage]);

  const ensureLogin = () => {
    if (!isLogin()) {
      toggleLoginModal(true);
      return false;
    }
    return true;
  };

  const handleCallClick = () => {
    if (!ensureLogin()) return;
    if (!formattedNumbers.telNumber) return;
    const telUrl = `tel:${formattedNumbers.telNumber}`;
    if (typeof window === "undefined") return;
    if (isMobileDevice) {
      window.location.href = telUrl;
    } else {
      window.open(telUrl, "_self");
    }
  };

  const handleWhatsappClick = () => {
    if (!formattedNumbers.whatsappLink) return;
    if (typeof window === "undefined") return;
    window.open(formattedNumbers.whatsappLink, "_blank");
  };

  const handleSmsClick = () => {
    if (!ensureLogin()) return;
    if (!formattedNumbers.smsLink) return;
    if (typeof window === "undefined") return;
    window.location.href = formattedNumbers.smsLink;
  };

  const memberSinceYear = userData?.created_at
    ? extractYear(userData.created_at)
    : "";

  const offerData = {
    itemPrice: productData?.price,
    itemId: productData?.id,
  };

  const handleChat = async () => {
    if (!isLogin()) {
      toggleLoginModal(true);
      return;
    }

    if (!productData?.is_already_offered) {
      try {
        setIsStartingChat(true);
        const response = await itemOfferApi.offer({
          item_id: offerData.itemId,
        });
        const { data } = response.data;
        const modifiedData = {
          ...data,
          tab: "buying",
        };
        saveOfferData(modifiedData);
      } catch (error) {
        toast.error(t("unableToStartChat"));
        console.log(error);
      }
    } else {
      setIsStartingChat(true);
      const offer = productData.item_offers.find(
        (item) => loggedInUserId === item?.buyer_id
      );
      const offerAmount = offer?.amount;
      const offerId = offer?.id;

      const selectedChat = {
        amount: offerAmount,
        id: offerId,
        item: {
          status: productData?.status,
          price: productData?.price,
          image: productData?.image,
          name: productData?.name,
          review: null,
        },
        user_blocked: false,
        item_id: productData?.id,
        seller: {
          profile: productData?.user?.profile,
          name: productData?.user?.name,
          id: productData?.user?.id,
        },
        tab: "buying",
      };
      saveOfferData(selectedChat);
    }
    router.push("/chat");
  };



  const handleApplyJob = () => {
    if (isLogin()) {
      setShowApplyModal(true)
    } else {
      toggleLoginModal(true);
    }
  };


  return (
    <div className="user_profile_card card">
      {(userData?.is_verified === 1 || memberSinceYear) && (
        <div className="seller_verified_cont">
          {userData?.is_verified === 1 && (
            <div className="verfied_cont">
              <MdVerifiedUser size={16} />
              <p className="verified_text">{t("verified")}</p>
            </div>
          )}
          {memberSinceYear && (
            <p className="member_since">
              {t("memberSince")}: {memberSinceYear}
            </p>
          )}
        </div>
      )}
      <div className="card-body">
        <div className="profile_sec_Cont">
          <div className="profile_sec">
            <Link href={`/seller/${productData?.user_id}`}>
              <Image
                loading="lazy"
                src={userData?.profile || settingsData?.favicon_icon || '/assets/Transperant_Placeholder.png'}
                alt="profile"
                className="profImage"
                width={60}
                height={60}
                style={{ border: "1px solid #ccc", borderRadius: "50%" }}
                onError={(e) => {
                  const fallbackSrc = settingsData?.favicon_icon || '/assets/Transperant_Placeholder.png';
                  if (e.target.src !== fallbackSrc) {
                    e.target.src = fallbackSrc;
                  }
                }}
              />
            </Link>

            <div className="user_details">
              <Link
                href={`/seller/${productData?.user_id}`}
                className="user_name"
                title={userData?.name}
              >
                {userData?.name}
              </Link>
              <div className="seller_Rating_cont">
                {productData?.user?.reviews_count > 0 &&
                  productData?.user?.average_rating && (
                    <>
                      <IoMdStar size={16} />
                      <p className="seller_rating">
                        {Math.round(productData?.user?.average_rating)} |{" "}
                        {productData?.user?.reviews_count} {t("ratings")}
                      </p>
                    </>
                  )}
              </div>
              {productData?.user?.show_personal_details === 1 &&
                productData?.user?.email && (
                  <Link
                    href={`mailto:${productData?.user?.email}`}
                    className="seller_rating"
                  >
                    {productData?.user?.email}
                  </Link>
                )}
            </div>
          </div>
          <FaArrowRight size={24} className="arrow_right" />
        </div>
      </div>
      <div className="card-footer">
        {/* {showContactInfo && ( */}
          {itemPhone && (
          <button
            className="chatBtn whatsappBtn"
            style={{ backgroundColor: "#25D366", borderColor: "#25D366" }}
            onClick={handleWhatsappClick}
          >
            {isArabic ? (
              <>
                <FaWhatsapp size={20} />
                <span>{t("whatsappBtnLabel")}</span>
              </>
            ) : (
              <>
                <span>{t("whatsappBtnLabel")}</span>
                <FaWhatsapp size={20} />
              </>
            )}
          </button>
        )}
        <div
          className="seller_secondary_actions"
          style={{
            display: "flex",
            gap: "12px",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          {/* {showContactInfo && ( */}
          {itemPhone && (
            <button
              className="chatBtn callBtn"
              onClick={handleCallClick}
              style={{ flex: 1, minWidth: 180 }}
            >
              <BiPhoneCall size={21} />
              <span
                className="callBtnContent"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.2,
                }}
              >
                <span>{t("callDirect")}</span>
                {/* {formattedNumbers.displayNumber && (
                  <span
                    className="callBtnNumber"
                    style={{ fontSize: 12, opacity: 0.85 }}
                    dir="ltr"
                  >
                    {formattedNumbers.displayNumber}
                  </span>
                )} */}
              </span>
            </button>
          )}
          {/* {showContactInfo && isMobileDevice && ( */}
          {itemPhone && isMobileDevice && (
            <button
              className="chatBtn smsBtn"
              onClick={handleSmsClick}
              style={{ flex: 1, minWidth: 160 }}
            >
              {isArabic ? (
                <>
                  <FaRegCommentDots size={20} />
                  <span>{t("smsBtnLabel")}</span>
                </>
              ) : (
                <>
                  <span>{t("smsBtnLabel")}</span>
                  <FaRegCommentDots size={20} />
                </>
              )}
            </button>
          )}
          <div
            className="chat_apply_actions"
            style={{
              display: "flex",
              gap: "8px",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <button
              disabled={IsStartingChat}
              className="chatBtn startChatBtn"
              onClick={handleChat}
              style={{ flex: 1, minWidth: 160 }}
            >
              {isArabic ? (
                <>
                  <IoChatboxEllipsesOutline size={20} />
                  <span>
                    {IsStartingChat ? t("startingChat") : t("startChat")}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {IsStartingChat ? t("startingChat") : t("startChat")}
                  </span>
                  <IoChatboxEllipsesOutline size={20} />
                </>
              )}
            </button>
            <button
              className={`applyBtn ${isApplied ? "appliedBtn" : ""}`}
              disabled={isApplied}
              onClick={handleApplyJob}
              style={{ flex: 1, minWidth: 160 }}
            >
              {isArabic ? (
                <>
                  <FaPaperPlane size={20} />
                  <span>
                    {isApplied ? t("applied") : t("submitOfferNow")}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {isApplied ? t("applied") : t("submitOfferNow")}
                  </span>
                  <FaPaperPlane size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Apply Now Modal */}
      <ApplyJobModal
        key={showApplyModal}
        showApplyModal={showApplyModal}
        OnHide={() => setShowApplyModal(false)}
        item_id={item_id}
        setProductData={setProductData}
      />
    </div>
  );
};

export default SellerCardInProdDet;
