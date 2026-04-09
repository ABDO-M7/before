"use client";
import { useState, useTransition, useEffect, useRef } from "react";
// import Image from "next/image";
// import Img1 from "../../../public/assets/landing_page_photos/Image1.png";
// import Img2 from "../../../public/assets/landing_page_photos/Image2.png";
// import Img3 from "../../../public/assets/landing_page_photos/Image3.png";
// import Img4 from "../../../public/assets/landing_page_photos/Image4.png";
// import Img5 from "../../../public/assets/landing_page_photos/Image5.png";
// import Img6 from "../../../public/assets/landing_page_photos/Image6.png";
import { IoSearchOutline, IoAddCircleOutline, IoChevronForward } from "react-icons/io5";
import { t } from "@/utils";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setSearch } from "@/redux/reuducer/searchSlice";
import QuickSearchRow from "@/components/Layout/QuickSearchRow";
import { quickSearchesApi } from "@/utils/api";

const HERO_TYPEWRITER_KEYS = [
  "heroTypewriterPhrase1",
  "heroTypewriterPhrase2",
  "heroTypewriterPhrase3",
  "heroTypewriterPhrase4",
  "heroTypewriterPhrase5",
];

const AnythingYouWant = ({ initialQuickSearchItems = null }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentLang = useSelector(CurrentLanguageData);
  const isRtl = Boolean(currentLang?.rtl ?? currentLang?.code === "ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [quickSearchItems, setQuickSearchItems] = useState(null);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  // Fetch quick searches
  useEffect(() => {
    let mounted = true;

    if (Array.isArray(initialQuickSearchItems)) {
      setQuickSearchItems(initialQuickSearchItems);
      return;
    }

    const fetchQuickSearches = async () => {
      try {
        const res = await quickSearchesApi.getQuickSearches();
        if (res?.data?.data && mounted) {
          setQuickSearchItems(res.data.data);
        } else if (mounted) setQuickSearchItems([]);
      } catch (e) {
        if (mounted) setQuickSearchItems([]);
      }
    };

    fetchQuickSearches();

    return () => {
      mounted = false;
    };
  }, [initialQuickSearchItems]);

  useEffect(() => {
    if (searchQuery !== "") {
      setAnimatedPlaceholder("");
      return;
    }

    const phrases = HERO_TYPEWRITER_KEYS.map((key) => t(key)).filter(
      (p) => typeof p === "string" && p.length > 0
    );
    if (phrases.length === 0) return;

    let cancelled = false;
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const TYPE_MS = 78;
    const DELETE_MS = 40;
    const HOLD_MS = 2600;
    const BETWEEN_MS = 420;

    const tick = () => {
      if (cancelled || searchQueryRef.current !== "") {
        return;
      }

      const phrase = phrases[phraseIndex % phrases.length];

      if (!isDeleting) {
        if (charIndex < phrase.length) {
          charIndex += 1;
          setAnimatedPlaceholder(phrase.slice(0, charIndex));
          timeoutId = setTimeout(tick, TYPE_MS);
        } else {
          timeoutId = setTimeout(() => {
            isDeleting = true;
            tick();
          }, HOLD_MS);
        }
      } else if (charIndex > 0) {
        charIndex -= 1;
        setAnimatedPlaceholder(phrase.slice(0, charIndex));
        timeoutId = setTimeout(tick, DELETE_MS);
      } else {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timeoutId = setTimeout(tick, BETWEEN_MS);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, currentLang?.code, currentLang?.rtl]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchNav = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    startTransition(() => {
      if (!q) {
        dispatch(setSearch(""));
        router.push("/products");
        return;
      }
      dispatch(setSearch(q));
      router.push(`/${encodeURIComponent(q)}`);
    });
  };

  const handleExploreAds = (e) => {
    e.preventDefault();
    router.push("/products");
  };

  return (
    <>
      <section
        id="anything_you_want"
        className="landing_hero"
        dir={isRtl ? "rtl" : "ltr"}
        lang={currentLang?.code === "ar" ? "ar" : "en"}
      >
        <div className="container">
          <div className="main_wrapper">
            {/* <div className="left_side_images">
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
            </div> */}
            <div className="center_content">
              <div className="main_heading">
                <h1>{t("buySell")} </h1>
                <h1 style={{ height: "75px" }}>{t("anythingYouWant")}</h1>
              </div>
              <div className="main_decs">
                
                <p>{t("anythingYouWantHeroTagline")}</p>
                
              </div>

              <div className="hero_location_section">
                {/* <label className="hero_location_label" htmlFor="hero-landing-search">
                  {t("searchPropertiesLabel")}
                </label> */}
                <div className="hero_location_input_wrapper">
                  <form
                    className="hero_location_input_container"
                    onSubmit={handleSearchNav}
                    role="search"
                    aria-label={t("searchPropertiesLabel") || "Search properties"}
                  >
                    <IoSearchOutline className="hero_location_pin" size={20} aria-hidden />
                    <input
                      id="hero-landing-search"
                      type="text"
                      className="autocomplete-input hero-typewriter-input"
                      dir={isRtl ? "rtl" : "ltr"}
                      placeholder={searchQuery === "" ? animatedPlaceholder : ""}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      autoComplete="off"
                      aria-label={t("searchPropertiesLabel") || "Search properties"}
                      aria-describedby="hero-search-description"
                    />
                    <button
                      className="hero_location_trigger_btn"
                      type="submit"
                      aria-label={t("search") || "Search"}
                    >
                      <IoChevronForward
                        size={20}
                        aria-hidden
                        style={isRtl ? { transform: "scaleX(-1)" } : undefined}
                      />
                    </button>
                    <span id="hero-search-description" className="sr-only">
                      {t("searchInputDescription")}
                    </span>
                  </form>
                </div>
                {/* Quick Search Row - below search input with 10px gap, scrollable horizontal */}
                <div style={{ marginTop: "10px" }}>
                  <QuickSearchRow mobile items={quickSearchItems} />
                </div>
              </div>

              

              <div className="hero_cta_buttons">
                <a
                  href="/products"
                  className="hero_cta_btn hero_cta_btn_explore"
                  onClick={handleExploreAds}
                >
                  {/* <IoSearchOutline size={20} /> */}
                  <span>{t("explore_ads")}</span>
                </a>
                <Link href="/ad-listing" className="hero_cta_btn hero_cta_btn_post">
                  {/* <IoAddCircleOutline size={20} /> */}
                  <span>{t("post_ads")}</span>
                </Link>
              </div>
            </div>
            {/* <div className="right_side_images">
              <Image
                src={Img4}
                className="upper_img"
                alt="Featured listing"
                priority
                loading="eager"
                onErrorCapture={placeholderImage}
              />
              <Image
                src={Img5}
                className="center_img"
                alt="Featured listing"
                loading="lazy"
                onErrorCapture={placeholderImage}
              />
              <Image
                src={Img6}
                className="down_img"
                alt="Featured listing"
                loading="lazy"
                onErrorCapture={placeholderImage}
              />
            </div> */}
          </div>
        </div>
      </section>
    </>
  );
};

export default AnythingYouWant;
