"use client";
import { useState } from "react";
import Image from "next/image";
import Img1 from "../../../public/assets/landing_page_photos/Image1.png";
import Img2 from "../../../public/assets/landing_page_photos/Image2.png";
import Img3 from "../../../public/assets/landing_page_photos/Image3.png";
import Img4 from "../../../public/assets/landing_page_photos/Image4.png";
import Img5 from "../../../public/assets/landing_page_photos/Image5.png";
import Img6 from "../../../public/assets/landing_page_photos/Image6.png";
import { SlLocationPin } from "react-icons/sl";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { IoSearchOutline, IoAddCircleOutline } from "react-icons/io5";
import { placeholderImage, t } from "@/utils";
import { settingsData } from "@/redux/reuducer/settingSlice";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import dynamic from "next/dynamic";
const LocationModal = dynamic(() => import('./LocationModal'), { ssr: false });
import useSearchAutocomplete from "./useSearchAutocomplete";
import { useRouter } from "next/navigation";
import { saveCity } from "@/redux/reuducer/locationSlice";
import toast from "@/utils/toast";
const SearchAutocomplete = dynamic(() => import('./SearchAutocomplete'), { ssr: false });
import Link from "next/link";

const AnythingYouWant = () => {

  const router = useRouter();
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const systemSettingsData = useSelector(settingsData);
  const settings = systemSettingsData?.data;
  const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const saveOnSuggestionClick = false;

  const {
    search,
    handleSearchChange,
    handleInputFocus,
    handleInputBlur,
    handleSuggestionClick,
    autoState,
    KmRange,
    selectedLocation
  } = useSearchAutocomplete(saveOnSuggestionClick);


  const handleExploreAds = (e) => {
    e.preventDefault();
    // Save location if selected, then navigate
    if (selectedLocation && (selectedLocation?.lat || selectedLocation?.areaId)) {
      saveCity(selectedLocation);
    }
    router.push("/products");
  };

  return (
    <>
      <section id="anything_you_want" className="landing_hero">
        <div className="container">
          <div className="main_wrapper">
            <div className="left_side_images">
              <Image
                src={Img1}
                className="upper_img"
                height={200}
                width={180}
                alt="Featured listing"
                priority
                loading="eager"
                onErrorCapture={placeholderImage}
                style={{ height: 'auto', width: 'auto' }}
              />
              <Image
                src={Img2}
                className="center_img"
                height={200}
                width={180}
                alt="Featured listing"
                priority
                loading="eager"
                onErrorCapture={placeholderImage}
                style={{ height: 'auto', width: 'auto' }}
              />
              <Image
                src={Img3}
                className="down_img"
                height={200}
                width={180}
                alt="Featured listing"
                loading="lazy"
                onErrorCapture={placeholderImage}
                style={{ height: 'auto', width: 'auto' }}
              />
            </div>
            <div className="center_content">
              {/* <div className="landing_hero_badge">
                <span className="landing_hero_badge_dot" aria-hidden="true" />
                <span className="landing_hero_badge_text">{t("buySell")}</span>
              </div> */}
              <div className="main_heading">
                <h1>{t("buySell")} </h1>
                <h1 style={{ height: "75px" }}>{t("anythingYouWant")}</h1>
              </div>
              <div className="main_decs">
                <p>
                  {t("discoverEndlessPossibilitiesAt")} {""}{" "}
                  {settings?.company_name} {""} {t("goToMarketplace")}
                </p>
              </div>
              
              {/* Location Selector Section */}
              <div className="hero_location_section">
                <label className="hero_location_label">{t("selectLocation")}</label>
                <div className="hero_location_input_wrapper">
                  <div className="hero_location_input_container">
                    <SlLocationPin className="hero_location_pin" size={20} />
                    <SearchAutocomplete
                      search={search}
                      handleSearchChange={handleSearchChange}
                      handleInputFocus={handleInputFocus}
                      handleInputBlur={handleInputBlur}
                      autoState={autoState}
                      handleSuggestionClick={handleSuggestionClick}
                      onInputClick={() => setIsLocationModalOpen(true)}
                    />
                    <button
                      className="hero_location_trigger_btn"
                      onClick={() => setIsLocationModalOpen(true)}
                      type="button"
                      aria-label={t("selectLocation")}
                    >
                      <FaLocationCrosshairs size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main CTA Buttons */}
              <div className="hero_cta_buttons">
                <a 
                  href="/products" 
                  className="hero_cta_btn hero_cta_btn_explore"
                  onClick={handleExploreAds}
                >
                  <IoSearchOutline size={20} />
                  <span>{t("explore_ads")}</span>
                </a>
                <Link href="/ad-listing" className="hero_cta_btn hero_cta_btn_post">
                  <IoAddCircleOutline size={20} />
                  <span>{t("post_ads")}</span>
                </Link>
              </div>
            </div>
            <div className="right_side_images">
              <Image
                src={Img4}
                className="upper_img"
                // height={200}
                // width={180}
                alt="Featured listing"
                priority
                loading="eager"
                onErrorCapture={placeholderImage}
                // style={{ height: 'auto', width: 'auto' }}
              />
              <Image
                src={Img5}
                className="center_img"
                // height={200}
                // width={180}
                alt="Featured listing"
                loading="lazy"
                onErrorCapture={placeholderImage}
                // style={{ height: 'auto', width: 'auto' }}
              />
              <Image
                src={Img6}
                className="down_img"
                // height={200}
                // width={180}
                alt="Featured listing"
                loading="lazy"
                onErrorCapture={placeholderImage}
                // style={{ height: 'auto', width: 'auto' }}
              />
            </div>
          </div>
        </div>
      </section>
      {IsLocationModalOpen ? (
        <LocationModal
          key={IsLocationModalOpen}
          IsLocationModalOpen={IsLocationModalOpen}
          OnHide={() => setIsLocationModalOpen(false)}
        />
      ) : null}
    </>
  );
};

export default AnythingYouWant;
