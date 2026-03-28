"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ✅ Lazy-load Header & Footer (antd, Swiper, SweetAlert2, Firebase, react-icons) – separate chunks for faster initial load
const MainHeader = dynamic(() => import("./MainHeader"), { ssr: true });
const Footer = dynamic(() => import("./Footer"), { ssr: false });
const BottomNavigationBar = dynamic(() => import("./BottomNavigationBar"), { ssr: false });
const PushNotificationLayout = dynamic(() => import("../firebaseNotification/PushNotificationLayout"), { ssr: false });
import { settingsData, settingsSucess } from "@/redux/reuducer/settingSlice";
import { settingsApi } from "@/utils/api";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import ScrollToTopButton from "./ScrollToTopButton";
import {
  getKilometerRange,
  setIsBrowserSupported,
  setKilometerRange,
} from "@/redux/reuducer/locationSlice";
import { protectedRoutes } from "@/app/routes/routes";
import Image from "next/image";
import UnderMaitenance from "../../../public/assets/something_went_wrong.svg";
import { getIsLoggedIn } from "@/redux/reuducer/authSlice";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { getIsVisitedLandingPage, setIsVisitedLandingPage } from "@/redux/reuducer/globalStateSlice";
import { t } from "@/utils";

const Layout = ({ children, initialQuickSearchItems, initialSettings }) => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const data = useSelector(settingsData);
  const lang = useSelector(CurrentLanguageData);
  const router = useRouter();
  // ✅ CLS Fix: Don't block rendering with a full-screen loader.
  // Redux Persist rehydrates settings from localStorage instantly,
  // so the page can render immediately. Settings API refreshes in the background.
  const [settingsReady, setSettingsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showNonCriticalChrome, setShowNonCriticalChrome] = useState(false);
  const requiresAuth = protectedRoutes.some((route) => route.test(pathname));
  const appliedRange = useSelector(getKilometerRange);
  const IsLoggedIn = useSelector(getIsLoggedIn);
  const IsVisitedLandingPage = useSelector(getIsVisitedLandingPage);
  const handleNotificationReceived = (data) => {
    console.log("notification received");
  };

  // ✅ Performance Fix: Use matchMedia instead of window.innerWidth 
  // to avoid forced reflows during hydration.
  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const listener = (e) => setIsMobile(e.matches);
    
    setIsMobile(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Keep body from horizontal overflow without a MutationObserver loop
  // (observer caused repeated style invalidations and extra reflow work).
  useEffect(() => {
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.maxWidth = '100vw';
  }, [pathname]);

  useEffect(() => {
    handleRouteAccess();
  }, [pathname, IsLoggedIn]);

  useEffect(() => {
    // Keep header/main immediate; defer footer/bottom-nav on home to reduce
    // initial JS work on mobile Lighthouse runs.
    if (pathname !== "/") {
      setShowNonCriticalChrome(true);
      return;
    }

    const reveal = () => setShowNonCriticalChrome(true);

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(reveal, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    }

    const t = setTimeout(reveal, 3000);
    return () => clearTimeout(t);
  }, [pathname]);

  const handleRouteAccess = () => {
    if (requiresAuth && !IsLoggedIn) {
      router.push("/");
    }
  };

  useEffect(() => {
    if (lang && lang.rtl === true) {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [lang]);

  useEffect(() => {
    const applySettings = (settingsObj) => {
      const min_range = Number(settingsObj?.min_length);
      const max_range = Number(settingsObj?.max_length);
      if (appliedRange < min_range) {
        dispatch(setKilometerRange(min_range));
      } else if (appliedRange > max_range) {
        dispatch(setKilometerRange(max_range));
      }
      document.documentElement.style.setProperty(
        "--primary-color",
        settingsObj?.web_theme_color
      );
      const LandingPage = Number(settingsObj?.show_landing_page);
      if (LandingPage === 1 && pathname === "/" && !IsVisitedLandingPage) {
        dispatch(setIsVisitedLandingPage(true));
      }
    };

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      dispatch(setIsBrowserSupported(false));
    }

    if (initialSettings) {
      dispatch(settingsSucess({ data: initialSettings }));
      applySettings(initialSettings?.data);
      setSettingsReady(true);
      return;
    }

    const getSystemSettings = async () => {
      try {
        const response = await settingsApi.getSettings({ type: "" });
        const data = response.data;
        dispatch(settingsSucess({ data }));
        applySettings(data?.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setSettingsReady(true);
      }
    };
    getSystemSettings();
  }, []);


  // ✅ CLS Fix: Always render the page structure immediately.
  // Maintenance mode is only shown AFTER settings confirm it (settingsReady + maintenance_mode=1).
  // This eliminates the full-screen Loader → Content swap that caused CLS ~1.3.
  const isMaintenance = settingsReady && Number(data?.data?.maintenance_mode) === 1;

  if (isMaintenance) {
    return (
      <div className="underMaitenance">
        <Image loading="lazy" src={UnderMaitenance} height={255} width={255} alt="Under Maintenance" />
        <p className="maintenance_label">
          {t('underMaintenance')}
        </p>
      </div>
    );
  }

  return (
    <>
      {pathname === "/chat" ? (
        <>
          <MainHeader initialQuickSearchItems={initialQuickSearchItems} />
          {/* CLS: minHeight reserves space so main doesn't grow from 0; shift is from children loading - reserve space in page components (slider, sections) */}
          <main id="main-content" role="main" style={{ minHeight: '100vh' }}>{children}</main>
          {showNonCriticalChrome ? <Footer /> : null}
        </>
      ) : pathname === "/ad-listing" && isMobile ? (
        <PushNotificationLayout
          onNotificationReceived={handleNotificationReceived}
        >
          {/* CLS: minHeight reserves space so main doesn't grow from 0; shift is from children loading - reserve space in page components (slider, sections) */}
          <main id="main-content" role="main" style={{ minHeight: '100vh' }}>{children}</main>
        </PushNotificationLayout>
      ) : (
        <>
          <MainHeader initialQuickSearchItems={initialQuickSearchItems} />
          {/* ✅ CLS Fix: Match padding-top to critical CSS header reservation (fixed on desktop, relative on mobile) */}
          <main id="main-content" role="main" style={{ 
            minHeight: '100vh', 
            paddingTop: !isMobile ? '140px' : '7px' 
          }}>{children}</main>
          {showNonCriticalChrome ? <Footer /> : null}
          {showNonCriticalChrome ? <BottomNavigationBar /> : null}
        </>
      )}
      {pathname === "/chat" && showNonCriticalChrome && <BottomNavigationBar />}
      {pathname === "/ad-listing" && !isMobile && showNonCriticalChrome && <BottomNavigationBar />}
      <ScrollToTopButton />
    </>
  );
};

export default Layout;
