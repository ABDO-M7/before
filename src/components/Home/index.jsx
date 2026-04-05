"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { FeaturedSectionApi, sliderApi } from "@/utils/api";
import { useDispatch, useSelector } from "react-redux";
import { SliderData, setSlider } from "@/redux/reuducer/sliderSlice";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { settingsData } from "@/redux/reuducer/settingSlice";
import FeaturedSectionsSkeleton from "../Skeleton/FeaturedSectionsSkeleton";
import AiToolsSkeleton from "../Skeleton/AiToolsSkeleton";
import { getKilometerRange } from "@/redux/reuducer/locationSlice";
import ComponentErrorBoundary from "@/components/ErrorBoundary/ComponentErrorBoundary";
// import AnythingYouWant from "@/components/LandingPage/AnythingYouWant";

const AdListingBanner = dynamic(() => import("./AdListingBanner"), {
  ssr: true,
  loading: () => <div style={{ minHeight: '200px' }} />,
});

// ✅ Slider & categories in separate chunks so Swiper isn’t in main bundle – faster TTI
const OfferSlider = dynamic(() => import("./OfferSlider"), {
  ssr: true,
  loading: () => <div style={{ minHeight: '300px' }} />,
});
const PopularCategories = dynamic(() => import("./PopularCategories"), {
  ssr: true,
  loading: () => <div style={{ minHeight: '140px' }} />,
});

// ✅ Lazy-load below-the-fold sections – smaller initial JS bundle, faster LCP
// ✅ Shimmer: 400px height skeleton for AI tools section
const PopularAiTools = dynamic(() => import("./PopularAiTools"), {
  ssr: true,
  loading: () => <AiToolsSkeleton />,
});
const UpperFeaturedSection = dynamic(() => import("./UpperFeaturedSection"), { ssr: true });
const MiddleFeaturedSection = dynamic(() => import("./MiddleFeaturedSection"), { ssr: false });
const DownFeaturedSection = dynamic(() => import("./DownFeaturedSection"), { ssr: false });
const HomeBlogsRow = dynamic(() => import("./HomeBlogsRow"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '300px' }} />,
});
const HomeAllItem = dynamic(() => import("./HomeAllItem"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '400px' }} />,
});


const HomePage = ({ initialSliderData, initialFeaturedData, initialAiToolData, initialCategoriesData, initialBlogsData }) => {
  const dispatch = useDispatch();
  const reduxSlider = useSelector(SliderData);
  // ✅ LCP Fix: Use server-fetched slider data immediately (no waterfall)
  const slider = (initialSliderData && initialSliderData.length > 0) ? initialSliderData : reduxSlider;
  const KmRange = useSelector(getKilometerRange);
  const [IsLoading, setIsLoading] = useState(!initialSliderData || initialSliderData.length === 0);
  // ✅ CLS Fix: Use server-fetched featured data for first paint so we don't show skeleton → content shift
  const hasInitialFeatured = Array.isArray(initialFeaturedData) && initialFeaturedData.length > 0;
  const [IsFeaturedLoading, setIsFeaturedLoading] = useState(!hasInitialFeatured);
  const [featuredData, setFeaturedData] = useState(hasInitialFeatured ? initialFeaturedData : []);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const systemSettingsData = useSelector(settingsData);
  const cityData = useSelector((state) => state?.Location?.cityData);

  // ✅ Memoize settings to prevent unnecessary re-renders
  const settings = useMemo(() => systemSettingsData?.data, [systemSettingsData]);
  const isDemoMode = useMemo(() => settings?.demo_mode, [settings]);

  useEffect(() => {
    if (initialSliderData && initialSliderData.length > 0) {
      dispatch(setSlider(initialSliderData));
      setIsLoading(false);
      return;
    }
    // Home page ignores get-slider: do not call API when server passed empty slider data
    if (Array.isArray(initialSliderData) && initialSliderData.length === 0) {
      setIsLoading(false);
      return;
    }
    const fetchSliderData = async () => {
      try {
        setIsLoading(true);
        const response = await sliderApi.getSlider({ hub: "web" });
        const data = response.data;
        dispatch(setSlider(data.data));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSliderData();
  }, [dispatch, initialSliderData]);

  // ✅ Memoize baseParams calculation
  const baseParams = useMemo(() => {
    const params = {};
    if (!isDemoMode) {
      if (KmRange > 0) {
        params.radius = KmRange;
        if (cityData?.lat) params.latitude = cityData.lat;
        if (cityData?.long) params.longitude = cityData.long;
      }

      if (cityData?.areaId) {
        params.area_id = cityData.areaId;
      } else if (cityData?.city) {
        params.city = cityData.city;
      } else if (cityData?.state) {
        params.state = cityData.state;
      } else if (cityData?.country) {
        params.country = cityData.country;
      }
    }
    return params;
  }, [isDemoMode, KmRange, cityData]);

  useEffect(() => {
    // Use server-passed data only on home to avoid duplicate get-featured-section call
    if (hasInitialFeatured) {
      setIsFeaturedLoading(false);
      return;
    }
    const fetchFeaturedSectionData = async () => {
      setIsFeaturedLoading(true);
      try {
        const response = await FeaturedSectionApi.getFeaturedSections({
          ...baseParams,
          hub: "web",
          limit: 4,
        });
        const { data } = response.data;
        setFeaturedData(
          (data || []).map((section) => ({
            ...section,
            section_data: Array.isArray(section?.section_data) ? section.section_data : [],
          }))
        );
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsFeaturedLoading(false);
      }
    };
    fetchFeaturedSectionData();
  }, [baseParams, CurrentLanguage, hasInitialFeatured]);

  // Group featured sections by placement (up, middle, down)
  const { upSections, middleSections, downSections } = useMemo(() => {
    const list = featuredData || [];
    return {
      upSections: list.filter((s) => (s?.placement || "up") === "up"),
      middleSections: list.filter((s) => s?.placement === "middle"),
      downSections: list.filter((s) => s?.placement === "down"),
    };
  }, [featuredData]);

  const allEmpty = useMemo(
    () => featuredData?.every((ele) => !ele?.section_data?.length),
    [featuredData]
  );

  // ✅ Memoize setFeaturedData callback to prevent unnecessary re-renders
  const handleSetFeaturedData = useCallback((newData) => {
    setFeaturedData(newData);
  }, []);

  return (
    <>
      {/* ✅ CLS: Fixed-height wrapper so skeleton → slider swap doesn't shift layout */}
      {/* <div style={{ minHeight: '540px' }}>
        <ComponentErrorBoundary componentName="OfferSlider">
          {IsLoading ? <SliderSkeleton /> : <OfferSlider sliderData={slider} />}
        </ComponentErrorBoundary>
      </div> */}

      {/* First section of the landing page */}
      {/* <AnythingYouWant /> */}

      {/* ✅ Error Boundary - Prevents AI Tools errors from crashing page */}
      <ComponentErrorBoundary componentName="PopularAiTools">
        <PopularAiTools initialAiToolData={initialAiToolData} />
      </ComponentErrorBoundary>

      {/* ✅ CLS: Reserve ~full expected height so sections filling in don't shift layout */}
      <div
        className="home_page_sections"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2.75rem",
          paddingTop: "1.25rem",
          paddingBottom: "2rem",
          maxWidth: "100%",
          // ✅ CLS Fix: Reduced from min(2400px, 200vh) — individual sections reserve their own space
          minHeight: "100vh",
        }}
      >

          {/* Categories: min-height only when loading/empty (inside PopularCategories) to avoid empty gap when content is short */}
          <ComponentErrorBoundary componentName="PopularCategories">
          <PopularCategories initialCategoriesData={initialCategoriesData} />
        </ComponentErrorBoundary>


        {/* ✅ Upper featured sections (placement = up) */}
        <ComponentErrorBoundary componentName="UpperFeaturedSection">
          {IsFeaturedLoading ? (
            <div style={{ minHeight: '400px' }}><FeaturedSectionsSkeleton /></div>
          ) : (
            <UpperFeaturedSection
              sections={upSections}
              featuredData={featuredData}
              setFeaturedData={handleSetFeaturedData}
            />
          )}
        </ComponentErrorBoundary>

      
        {/* ✅ Ad Listing Banner - min-height reserved in layout.css + component so dynamic load doesn't shift */}
        <AdListingBanner />

        {/* ✅ Middle featured sections (placement = middle) */}
        <ComponentErrorBoundary componentName="MiddleFeaturedSection">
          <MiddleFeaturedSection
            sections={middleSections}
            featuredData={featuredData}
            setFeaturedData={handleSetFeaturedData}
          />
        </ComponentErrorBoundary>

        {/* ✅ Blogs row (tag + date) - under ad listing banner */}
        <HomeBlogsRow initialBlogsData={initialBlogsData} />

        {/* ✅ Down featured sections (placement = down) */}
        <ComponentErrorBoundary componentName="DownFeaturedSection">
          <DownFeaturedSection
            sections={downSections}
            featuredData={featuredData}
            setFeaturedData={handleSetFeaturedData}
          />
        </ComponentErrorBoundary>

        {/* ✅ Error Boundary - Prevents product list errors from crashing page */}
        {/* <ComponentErrorBoundary componentName="HomeAllItem">
          <HomeAllItem cityData={cityData} allEmpty={allEmpty} />
        </ComponentErrorBoundary> */}
      </div>
    </>
  );
};

export default HomePage;
