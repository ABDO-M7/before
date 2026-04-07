"use client";
import { useEffect, useState, useRef, memo, useTransition, Suspense, useMemo } from "react";
// import { useDeferredValue } from "react"; // unused (deferredSearchQuery was never used in render)
// import dynamic from "next/dynamic";
import Image from "next/image";
import { IoIosAddCircleOutline } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
// ✅ TBT Fix: Lazy-load antd components to reduce initial JS bundle
import dynamic from "next/dynamic";
const Drawer = dynamic(() => import("antd").then(mod => mod.Drawer), { ssr: false });
import { FaSearch, FaUserCircle } from "react-icons/fa";
import Link from "next/link";
// ✅ TBT Fix: Removed "swiper/css" import — Swiper is not used in Header
import { getSlug, isEmptyObject } from "@/utils/helpers";
import { placeholderImage } from "@/utils/imageHandlers";
import { t } from "@/utils/translate";
import { truncate } from "@/utils/textUtils";
import { getCompressedImage, normalizeImageUrl } from "@/utils/imageUtils";
import { BiPlanet } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { MdClose } from "react-icons/md";
import { logoutSuccess, userSignUpData } from "../../redux/reuducer/authSlice";

// ✅ TBT Fix: Lazy-load SweetAlert2 (only needed on logout click)
// Usage: const Swal = (await import('sweetalert2')).default; Swal.fire(...)

// ✅ TBT Fix: Firebase lazy-loaded — only needed for signOut on logout click
// const { signOut } = FirebaseData() — moved to handleLogout()
import { settingsData } from "@/redux/reuducer/settingSlice";
import { getLanguageApi, getLimitsApi } from "@/utils/api";
import {
  CurrentLanguageData,
  setCurrentLanguage,
} from "@/redux/reuducer/languageSlice";
const LanguageDropdown = dynamic(() => import("../HeaderDropdowns/LanguageDropdown"), { ssr: true });
import { useRouter, usePathname } from "next/navigation";
import { setSearch, SearchData } from "@/redux/reuducer/searchSlice";
import {
  CategoryData,
  CurrentPage,
  LastPage,
  setCatCurrentPage,
  setCatLastPage,
  setCateData,
  setTreeData,
} from "@/redux/reuducer/categorySlice";
import { categoryApi, quickSearchesApi } from "@/utils/api";
// FilterTree removed — commented out in drawer, import antd Tree unnecessarily
const LocationModal = dynamic(() => import("../LandingPage/LocationModal"), { ssr: false });
import { saveOfferData } from "@/redux/reuducer/offerSlice";
const HeaderCategories = dynamic(() => import("./HeaderCategories"), { ssr: false });
const ProfileDropdown = dynamic(() => import("../Profile/ProfileDropdown"), { ssr: false });
const MailSentSucessfully = dynamic(() => import("../Auth/MailSentSucessfully"), { ssr: false });
// ✅ Lazy load auth modals (heavy: react-phone-input-2, antd) - load only when needed
const RegisterModal = dynamic(() => import("../Auth/RegisterModal"), { ssr: false });
const LoginModal = dynamic(() => import("../Auth/LoginModal"), { ssr: false });
import {
  getIsLoginModalOpen,
  getIsRegisterModalOpen,
  getIsDrawerOpen,
  toggleLoginModal,
  toggleRegisterModal,
  toggleDrawer,
} from "@/redux/reuducer/globalStateSlice";
import InvitationHandler from "./InvitationHandler";
import { LuLanguages, LuLayoutGrid, LuMapPin } from "react-icons/lu";
import QuickSearchRow from "./QuickSearchRow";

const Header = ({ initialQuickSearchItems }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const UserData = useSelector(userSignUpData);
  const systemSettings = useSelector(settingsData);
  const settings = systemSettings?.data;
  const cateData = useSelector(CategoryData);
  const catCurrentPage = useSelector(CurrentPage);
  const catLastPage = useSelector(LastPage);
  // signOut is now lazy-loaded in handleLogout()
  const IsRegisterModalOpen = useSelector(getIsRegisterModalOpen);
  const IsLoginModalOpen = useSelector(getIsLoginModalOpen);
  const [IsMailSentOpen, setIsMailSentOpen] = useState(false);
  const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [catId, setCatId] = useState("");
  const [slug, setSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // ✅ Use useDeferredValue for search input - keeps UI responsive during typing
  // const deferredSearchQuery = useDeferredValue(searchQuery); // unused (not used in input value)
  // ✅ Use useTransition for non-urgent updates (search navigation)
  const [isPending, startTransition] = useTransition();
  const isDrawerOpen = useSelector(getIsDrawerOpen);
  const handleClose = () => toggleDrawer(false);
  const handleShow = () => toggleDrawer(true);
  const cityData = useSelector((state) => state?.Location?.cityData);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const headerCatSelected = getSlug(pathname);
  const [isAdListingClicked, setIsAdListingClicked] = useState(false);
  const [quickSearchItems, setQuickSearchItems] = useState(null);
  const systemSettingsData = useSelector((state) => state?.Settings);
  const searchFromRedux = useSelector(SearchData);

  useEffect(() => {
    if (Array.isArray(initialQuickSearchItems)) {
      setQuickSearchItems(initialQuickSearchItems);
      return;
    }
    let mounted = true;
    const fetchQuickSearches = async () => {
      try {
        const res = await quickSearchesApi.getQuickSearches();
        if (mounted && res?.data?.error === false && Array.isArray(res?.data?.data)) {
          setQuickSearchItems(res.data.data);
        } else if (mounted) setQuickSearchItems([]);
      } catch {
        if (mounted) setQuickSearchItems([]);
      }
    };
    fetchQuickSearches();
    return () => { mounted = false; };
  }, [initialQuickSearchItems]);

  // Invitation and OpenInApp logic moved to InvitationHandler (wrapped in Suspense)
  const getLanguageData = async (language_code) => {
    try {
      const res = await getLanguageApi.getLanguage({
        language_code,
        type: "web",
      });

      if (res?.data?.error === true) {
        import("react-hot-toast").then((mod) => mod.default.error(res?.data?.message));
      } else {
        if (isDrawerOpen) {
          toggleDrawer(false);
        }
        dispatch(setCurrentLanguage(res?.data?.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const setDefaultLanguage = async () => {
    try {
      const language_code = "ar";
      const res = await getLanguageApi.getLanguage({
        language_code,
        type: "web",
      });
      if (res?.data?.error === true) {
        import("react-hot-toast").then((mod) => mod.default.error(res?.data?.message));
      } else {
        dispatch(setCurrentLanguage(res?.data?.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isEmptyObject(CurrentLanguage)) {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => setDefaultLanguage());
      } else {
        setTimeout(setDefaultLanguage, 100);
      }
    }
  }, []);

  // this api call only in pop cate swiper
  const getCategoriesData = async (page) => {
    try {
      const response = await categoryApi.getCategory({ page: `${page}` });
      const { data } = response.data;

      if (data && Array.isArray(data.data)) {
        if (page > 1) {
          dispatch(setCateData([...cateData, ...data.data]));
        } else {
          dispatch(setCateData(data.data));
          dispatch(setTreeData([]));
        }
      }
      dispatch(setCatLastPage(data?.last_page));
      dispatch(setCatCurrentPage(data?.current_page));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    // Categories are only needed for the header dropdown/search. 
    // Defer fetching them on listing pages to prioritize LCP.
    if (pathname === "/" || pathname === "/products" || pathname.startsWith('/category/')) return;
    if (cateData.length === 0) {
      getCategoriesData(1);
    }
  }, [pathname]);

  const translateCategories = (categories) => {
    return categories.map((category) => {
      const translation = category.translations?.find(
        (trans) => trans.language_id === CurrentLanguage.id
      );
      return {
        ...category,
        translated_name: translation ? translation.name : category.name, // Update the category name directly
        subcategories:
          category.subcategories?.length > 0
            ? translateCategories(category.subcategories) // Recursively translate subcategories
            : [], // Default to empty array if no subcategories
      };
    });
  };

  // ✅ Performance Fix: Translate categories in a useMemo instead of a dispatch-back-to-redux effect.
  // This avoids infinite update loops and heavy main-thread work during hydration.
  const translatedCateData = useMemo(() => {
    if (!cateData || cateData.length === 0) return [];
    return translateCategories(cateData);
  }, [cateData, CurrentLanguage?.id]);

  useEffect(() => {
    document.documentElement.lang = CurrentLanguage?.code?.toLowerCase() || "ar";
  }, [CurrentLanguage?.code]);

  useEffect(() => {
    const categoryPathRegex = /^\/category(\/|$)/;
    if (pathname != "/products" && !categoryPathRegex.test(pathname)) {
      dispatch(setSearch(""));
      setSearchQuery("");
      setCatId("");
    }
  }, [pathname]);

  // Sync header search input with Redux when on listing pages so user can see/edit/clear current search
  useEffect(() => {
    const categoryPathRegex = /^\/category(\/|$)/;
    if (pathname === "/products" || categoryPathRegex.test(pathname)) {
      setSearchQuery(typeof searchFromRedux === "string" ? searchFromRedux : "");
    }
  }, [pathname, searchFromRedux]);

  const closeDrawer = () => {
    if (isDrawerOpen) {
      toggleDrawer(false);
    }
  };

  const openRegisterModal = () => {
    if (isDrawerOpen) {
      toggleDrawer(false);
    }
    if (IsLoginModalOpen) {
      toggleLoginModal(false);
    }
    toggleRegisterModal(true);
  };
  const openLoginModal = () => {
    if (isDrawerOpen) {
      toggleDrawer(false);
    }
    if (IsRegisterModalOpen) {
      toggleRegisterModal(false);
    }
    toggleLoginModal(true);
  };

  const openLocationEditModal = () => {
    if (isDrawerOpen) {
      toggleDrawer(false);
    }
    setIsLocationModalOpen(true);
  };

  const handleLogout = async () => {
    if (isDrawerOpen) {
      toggleDrawer(false);
    }
    const Swal = (await import('sweetalert2')).default;
    Swal.fire({
      title: `${t("areYouSure")} \u200E`,
      text: `${t("logoutConfirmation")} \u200E`,
      icon: "warning",
      showCancelButton: true,
      customClass: {
        confirmButton: "Swal-confirm-buttons",
        cancelButton: "Swal-cancel-buttons",
      },
      confirmButtonText: t("yes"),
      cancelButtonText: t("cancel"),
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Perform the logout action
        logoutSuccess();
        // ✅ Lazy-load Firebase signOut only when actually logging out
        try {
          const FirebaseData = (await import('@/utils/Firebase')).default;
          const { signOut } = FirebaseData();
          signOut();
        } catch (e) {
          console.error('Firebase signOut error:', e);
        }
        saveOfferData([]);
        import("react-hot-toast").then((mod) => mod.default.success(t("signOutSuccess")));
      } else {
        import("react-hot-toast").then((mod) => mod.default.error(t("signOutCancelled")));
      }
    });
  };

  const CloseIcon = (
    <div className="close_icon_cont">
      <MdClose size={24} color="black" />
    </div>
  );

  const handleCategoryChange = (value) => {
    if (value?.value === "") {
      setCatId("");
      return;
    }
    const category = cateData.find((item) => item?.id === Number(value.key));
    const catId = category?.id;
    const slug = category?.slug;

    if (catId) {
      setCatId(catId);
    }
    if (slug) {
      setSlug(slug);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchNav = (e) => {
    e.preventDefault();
    // ✅ Use startTransition for non-urgent navigation - keeps UI responsive
    startTransition(() => {
      if (catId) {
        dispatch(setSearch(searchQuery));
        router.push(`/category/${slug}`);
      } else {
        dispatch(setSearch(searchQuery));
        router.push(`/products`);
      }
    });
  };

  const getLimitsData = async () => {
    try {
      setIsAdListingClicked(true);
      const res = await getLimitsApi.getLimits({
        package_type: "item_listing",
      });
      if (res?.data?.error === false) {
        router.push("/ad-listing");
      } else {
        import("react-hot-toast").then((mod) => mod.default.error(t("purchasePlan")));
        router.push("/subscription");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsAdListingClicked(false);
    }
  };
  const handleAdListing = async (e) => {
    e.preventDefault();
    // Give access to ad-listing page without login or profile complete
    router.push("/ad-listing");
    handleClose();
  };

  const handleCategoryScroll = (event) => {
    const { target } = event;
    if (
      target.scrollTop + target.offsetHeight >= target.scrollHeight &&
      catCurrentPage < catLastPage
    ) {
      getCategoriesData(catCurrentPage + 1);
    }
  };

  const locationSegments = [
    cityData?.area,
    cityData?.city,
    cityData?.state,
    cityData?.country,
  ].filter(Boolean);
  const locationFull = locationSegments.join(", ");
  const hasLocation = locationSegments.length > 0;
  const languageLabel = t("languagee") || (CurrentLanguage?.code === "ar" ? "اللغة" : "Language");
  const currentLanguageName =
    CurrentLanguage?.code === "ar"
      ? "العربية"
      : CurrentLanguage?.code === "en"
        ? "English"
        : CurrentLanguage?.name ||
        CurrentLanguage?.code?.toUpperCase() ||
        "—";
  const locationDisplay = hasLocation
    ? truncate(locationFull, 40)
    : t("addLocation");
  const accountTitle = UserData
    ? UserData?.name && UserData?.name !== "null"
      ? truncate(UserData?.name, 24)
      : UserData?.email && UserData?.email !== "null"
        ? UserData?.email
        : UserData?.mobile || t("myProfile")
    : t("login");
  const accountSubtitle = UserData
    ? UserData?.email && UserData?.email !== "null"
      ? UserData?.email
      : UserData?.mobile || ""
    : t("register");
  const categoriesSubtitle = t("allCategories");
  const languageTriggerRef = useRef(null);
  const profileTriggerRef = useRef(null);

  const handleLocationKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLocationEditModal();
    }
  };

  const handleLanguageDropdownToggle = () => {
    if (!languageTriggerRef.current) return;
    const trigger =
      languageTriggerRef.current.querySelector(".language_dropdown > span") ||
      languageTriggerRef.current.querySelector(".language_dropdown");
    trigger?.click();
  };

  const handleLanguageItemClick = (event) => {
    if (languageTriggerRef.current?.contains(event.target)) {
      return;
    }
    handleLanguageDropdownToggle();
  };

  const handleLanguageKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLanguageDropdownToggle();
    }
  };

  const handleProfileDropdownToggle = () => {
    if (!profileTriggerRef.current) return;
    const trigger =
      profileTriggerRef.current.querySelector(".ant-btn") ||
      profileTriggerRef.current.querySelector("button");
    trigger?.click();
  };

  const handleProfileItemClick = (event) => {
    if (profileTriggerRef.current?.contains(event.target)) {
      return;
    }
    handleProfileDropdownToggle();
  };

  const handleProfileKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleProfileDropdownToggle();
    }
  };

  const drawerPlacement = CurrentLanguage?.rtl ? "left" : "right";

  // Live header: stronger shadow on scroll for a more dynamic feel
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ TBT Fix: matchMedia avoids forced layout reflow (window.innerWidth causes synchronous layout)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 992px)');
    const listener = (e) => setIsDesktop(e.matches);
    setIsDesktop(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const headerCSS = `.cat_select_wrapper .ant-select-selector{border:0!important;box-shadow:none!important;background-color:transparent!important}.cat_select_wrapper .ant-select-focused .ant-select-selector{border:0!important;box-shadow:none!important}.cat_select_wrapper .ant-select:hover .ant-select-selector{border:0!important}.d-lg-flex{display:none!important}.d-none{display:none!important}.d-sm-inline{display:none!important}@media(min-width:576px){.d-sm-inline{display:inline!important}}@media(min-width:992px){.d-lg-none{display:none!important}.d-lg-flex{display:flex!important}}`;

  // Header styles: fixed on desktop, normal on mobile/tablet; prevent header from causing horizontal overflow
  const headerStyle = isDesktop
    ? {
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1030,
    backgroundColor: '#ffffff',
    boxShadow: isScrolled
      ? '0 4px 12px rgba(0, 0, 0, 0.08)'
      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'box-shadow 0.25s ease',
    overflowX: 'hidden',
    maxWidth: '100vw',
    width: '100%',
    }
    : {
      position: 'relative',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      overflowX: 'hidden',
      maxWidth: '100vw',
      width: '100%',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: headerCSS }} />
      <header style={headerStyle}>
        <nav className="navbar navbar-expand-lg" style={{
          backgroundColor: '#ffffff',
          boxShadow: 'none',
          // borderTop: '4px solid #06aabd',
          // borderBottom: '1px solid #e5e7eb',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
        }}>
          <div style={{ width: '100%', maxWidth: '100%', padding: '2px 8px', margin: '0 auto', overflowX: 'hidden' }}>
            {/* First Line: Logo and Hamburger (visible on all) + Nav Items (desktop only) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }} className="d-lg-none">
              {/* Logo - Left */}
              <Link href="/" prefetch={true} style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {settings?.header_logo2 ? (
                  <Image
                    src={settings.header_logo2}
                    alt="Website logo"
                    width={140}
                    height={50}
                    sizes="140px"
                    className="header_logo"
                    onErrorCapture={placeholderImage}
                    style={{
                      aspectRatio: '140/50',
                      maxWidth: '140px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    priority
                    fetchPriority="high"
                  />
                ) : (
                  <div style={{
                    width: '140px',
                    height: '50px',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    color: '#797b7c',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Logo
                  </div>
                )}
              </Link>

              {/* Hamburger - Right */}
              <span
                onClick={handleShow}
                id="hamburg"
                className="header-hamburg-menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  color: '#797b7c'
                }}
              >
                <GiHamburgerMenu size={25} />
              </span>
            </div>

            {/* Desktop: Logo, Search, Nav Items + Quick Search row under search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', width: '100%' }} className="d-none d-lg-flex">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', minHeight: '60px' }}>
                {/* Logo - Before Search Container */}
                <Link href="/" prefetch={true} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', minWidth: '140px' }}>
                  {settings?.header_logo2 ? (
                    <Image
                      src={settings.header_logo2}
                      alt="Website logo"
                      width={140}
                      height={50}
                      sizes="140px"
                      className="header_logo"
                      onErrorCapture={placeholderImage}
                      style={{
                        aspectRatio: '140/50',
                        maxWidth: '140px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      priority
                      fetchPriority="high"
                    />
                  ) : (
                    <div style={{
                      width: '140px',
                      height: '50px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      color: '#797b7c',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      Logo
                    </div>
                  )}
                </Link>

                {/* Blog & AI Tools - after logo, before search */}
                <Link
                  href="/blogs"
                  className="nav-item nav-linkS d-lg-block"
                  style={{
                    textDecoration: 'none',
                    color: '#797b7c',
                    fontWeight: '600',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'transparent',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#06aabd';
                    e.currentTarget.style.backgroundColor = '#f0fdfd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#797b7c';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {t("blog")}
                </Link>
                <Link
                  href="/ai-tools"
                  className="nav-item nav-link d-lg-block"
                  style={{
                    textDecoration: 'none',
                    color: '#797b7c',
                    fontWeight: '600',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'transparent',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#06aabd';
                    e.currentTarget.style.backgroundColor = '#f0fdfd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#797b7c';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {t("aiTools")}
                </Link>

                {/* Search Container with Category, Input, Location Icon */}
                <div className="select_search_cont search_lg" style={{
                  flex: '1',
                  maxWidth: '650px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px',
                  backgroundColor: '#f7fbf9',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  {/* <div className="cat_select_wrapper" style={{ minWidth: '150px', flexShrink: 0, backgroundColor: '#ffffff', borderRadius: '8px', padding: '4px' }}>
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  onChange={handleCategoryChange}
                  labelInValue
                  placeholder={t("categorySelect")}
                  filterOption={true}
                  defaultValue=""
                  className="web_ant_select"
                  onPopupScroll={handleCategoryScroll}
                  aria-label={t("categorySelect") || "Select category"}
                  aria-describedby="category-select-description"
                  classNames={{ popup: { root: 'category-select-popup' } }}
                >
                  <Select.Option value="">{t("allCategories")}</Select.Option>
                  {cateData &&
                    cateData?.map((cat, index) => (
                      <Select.Option key={cat?.id} value={cat.name}>
                        {cat?.translated_name}
                      </Select.Option>
                    ))}
                </Select>
                <span id="category-select-description" className="sr-only">
                  {t("categorySelect") || "Select a category to filter products"}
                </span>
              </div> */}
                  <form className="search_cont" onSubmit={handleSearchNav} role="search" aria-label={t("searchAd") || "Search"} style={{ flex: '1', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '8px', padding: '4px' }}>
                    <div className="srchIconinput_cont" style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BiPlanet size={16} color="#595B6C" className="planet" aria-hidden="true" />
                      <input
                        type="text"
                        placeholder={t("searchAd")}
                        onChange={(e) => handleSearch(e)}
                        value={searchQuery}
                        aria-label={t("searchAd") || "Search input"}
                        aria-describedby="search-description"
                        autoComplete="off"
                        style={{ border: 'none', outline: 'none', padding: '6px 8px', width: '100%', backgroundColor: 'transparent', fontSize: '14px' }}
                      />
                      <span id="search-description" className="sr-only">
                        {t("searchAd") || "Enter search terms to find products"}
                      </span>
                    </div>
                    <button
                      type="submit"
                      aria-label={t("search") || "Search button"}
                      disabled={isPending}
                      style={{
                        padding: '8px 20px',
                        flexShrink: 0,
                        backgroundColor: '#005f6b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isPending) {
                          e.currentTarget.style.backgroundColor = '#004d56';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPending) {
                          e.currentTarget.style.backgroundColor = '#005f6b';
                        }
                      }}
                    >
                      <FaSearch size={14} aria-hidden="true" />
                      <span className="srch">{t("search")}</span>
                    </button>
                  </form>
                  {/* Location Icon */}
                  <button
                    onClick={openLocationEditModal}
                    title={hasLocation ? locationFull : t("addLocation")}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      color: '#797b7c',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                      padding: 0,
                      margin: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#06aabd';
                      e.currentTarget.style.borderColor = '#06aabd';
                      e.currentTarget.style.backgroundColor = '#f0fdfd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#797b7c';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <LuMapPin size={18} />
                  </button>
                </div>

                {/* Navigation Items - Desktop Only (Login, Ad listing, Language) — min-height to avoid CLS when auth/lang load */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minHeight: '48px' }}>
                  {/* Login/Profile */}
                  {UserData ? (
                    <div style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      backgroundColor: 'transparent'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdfd';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ProfileDropdown
                        closeDrawer={closeDrawer}
                        settings={settings}
                        handleLogout={handleLogout}
                        isDrawer={false}
                      />
                    </div>
                  ) : (
                    <a
                      href="#"
                      className="nav-item nav-link lg_in"
                      onClick={(e) => {
                        e.preventDefault();
                        openLoginModal();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#797b7c',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#06aabd';
                        e.currentTarget.style.backgroundColor = '#f0fdfd';
                        const iconDiv = e.currentTarget.querySelector('div');
                        if (iconDiv) {
                          iconDiv.style.backgroundColor = '#06aabd';
                          iconDiv.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#797b7c';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        const iconDiv = e.currentTarget.querySelector('div');
                        if (iconDiv) {
                          iconDiv.style.backgroundColor = '#f3f4f6';
                          iconDiv.style.color = '#797b7c';
                        }
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#797b7c',
                        transition: 'all 0.3s ease',
                        flexShrink: 0
                      }}>
                        <FaUserCircle size={16} />
                      </div>
                      <span>{t("login")}</span>
                    </a>
                  )}

                  {/* Ad Listing Button */}
                  <button
                    className="ad_listing"
                    disabled={isAdListingClicked}
                    onClick={handleAdListing}
                  >
                    <IoIosAddCircleOutline size={18} />
                    <span className="adlist_btn" title={t("adListing")}>
                      {truncate(t("adListing"), 12)}
                    </span>
                  </button>

                  {/* Language Dropdown */}
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'transparent'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdfd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <LanguageDropdown
                      getLanguageData={getLanguageData}
                      settings={settings}
                    />
                  </div>

                </div>
              </div>
              {/* Quick Search row - full width below search bar (single fetch shared with mobile) */}
              <QuickSearchRow items={quickSearchItems} />
            </div>

            {/* Second Line: Search Container for Tablet/Mobile */}
            {/* Mobile Search Container - Second Line */}
            <div className="d-lg-none" style={{ width: '100%' }}>
              <div className="select_search_cont search_xs_xl" style={{
                width: '100%',
                display: 'flex !important',
                flexDirection: 'row !important',
                alignItems: 'center !important',
                // gap: '4px',
                padding: '4px',
                backgroundColor: '#f7fbf9',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                {/* Category Select - Compact on Mobile */}
                {/* <div className="cat_select_wrapper" style={{
                  width: '100px',
                  flexShrink: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  // padding: '2px'
                }}>
                  <Select
                    showSearch
                    style={{ width: "100%" }}
                    onChange={handleCategoryChange}
                    labelInValue
                    placeholder={t("categorySelect")}
                    filterOption={true}
                    defaultValue=""
                    className="web_ant_select"
                    onPopupScroll={handleCategoryScroll}
                    aria-label={t("categorySelect") || "Select category"}
                    aria-describedby="category-select-description-mobile"
                    size="middle"
                  >
                    <Select.Option value="">{t("allCategories")}</Select.Option>
                    {cateData &&
                      cateData?.map((cat, index) => (
                        <Select.Option key={cat?.id} value={cat.name}>
                          {cat?.translated_name}
                        </Select.Option>
                      ))}
                  </Select>
                  <span id="category-select-description-mobile" className="sr-only">
                    {t("categorySelect") || "Select a category to filter products"}
                  </span>
                </div> */}

                {/* Search Input and Button Row */}
                <div style={{
                  display: 'flex',
                  // gap: '4px', 
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0
                }}>
                  <form
                    className="search_cont"
                    onSubmit={handleSearchNav}
                    role="search"
                    aria-label={t("searchAd") || "Search"}
                    style={{
                      flex: '1',
                      display: 'flex',
                      // gap: '4px', 
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      // padding: '4px 6px',
                      minWidth: 0
                    }}
                  >
                    <BiPlanet size={14} color="#595B6C" className="planet" aria-hidden="true" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder={t("searchAd")}
                      onChange={(e) => handleSearch(e)}
                      value={searchQuery}
                      aria-label={t("searchAd") || "Search input"}
                      aria-describedby="search-description-mobile"
                      autoComplete="off"
                      style={{
                        border: 'none',
                        outline: 'none',
                        padding: '4px 2px',
                        width: '100%',
                        backgroundColor: 'transparent',
                        fontSize: '13px',
                        minWidth: 0,
                        flex: 1
                      }}
                    />
                  </form>

                  {/* Search Button - Compact */}
                  <button
                    type="submit"
                    onClick={handleSearchNav}
                    aria-label={t("search") || "Search button"}
                    disabled={isPending}
                    style={{
                      padding: '8px 12px',
                      flexShrink: 0,
                      backgroundColor: '#06aabd',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px'
                    }}
                  >
                    <FaSearch size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            {/* Quick Search row for Mobile/Tablet - swipeable (uses same data as desktop) */}
            <div className="d-lg-none" style={{ width: '100%' }}>
              <QuickSearchRow mobile items={quickSearchItems} />
            </div>
          </div>
        </nav>
      </header>

      {/* HeaderCategories scrolls with the page (not fixed) */}
      {/* {
        cateData.length > 0 && (
          <HeaderCategories
            cateData={cateData}
            headerCatSelected={headerCatSelected}
            settings={settings}
          />
        )
      } */}



{/* Drawer is the side menu for mobile and tablet */}
      {isDrawerOpen ? (
        <Drawer
          className="eclassify_drawer mobile_drawer"
          maskClosable={true}
          styles={{ wrapper: { width: '80%' }, body: { padding: 0 } }
          }
          zIndex={1050}
          placement={drawerPlacement}
          title={
            <Image
              src={settings?.header_logo2}
              loading="eager"
              width={160}
              height={60}
              alt="logo"
              style={{
                height: 'auto',
                // width: 'auto',
                maxWidth: '140px',
                objectFit: 'contain',
                display: 'block',
              }}
              onErrorCapture={placeholderImage}
              className="drawer_title_logo"
            />
          }
          onClose={handleClose}
          open={isDrawerOpen}
          closeIcon={CloseIcon}
        >
          <div className="mobile_drawer_body" style={{ paddingTop: '10px' }}>
            <ul className="drawer_menu" dir={CurrentLanguage?.rtl ? "rtl" : "ltr"}>
            <li className="drawer_menu_item drawer_menu_item--single">
              <button
                type="button"
                className="drawer_single_button"
                onClick={handleAdListing}
                disabled={isAdListingClicked}
              >
                <IoIosAddCircleOutline size={20} />
                <span>{t("adListing")}</span>
              </button>
            </li>

            <li
              className="drawer_menu_item drawer_menu_item--actionable"
              onClick={handleLanguageItemClick}
              role="button"
              tabIndex={0}
              onKeyDown={handleLanguageKeyDown}
            >
              <span className="drawer_menu_icon">
                <LuLanguages size={20} />
              </span>
              <div className="drawer_menu_info">
                <span className="drawer_menu_title">{languageLabel}</span>
                <span className="drawer_menu_subtitle">
                  {currentLanguageName}
                </span>
              </div>
              <div
                className="drawer_menu_action"
                ref={languageTriggerRef}
                onClick={(event) => event.stopPropagation()}
              >
                <LanguageDropdown
                  getLanguageData={getLanguageData}
                  settings={settings}
                />
              </div>
            </li>

            {UserData && (
              <>
                <li
                  className="drawer_menu_item drawer_menu_item--stack"
                >
                  <div className="drawer_menu_header">
                    <span className="drawer_menu_icon">
                      {(() => {
                        // Use 'small' compressed image for profile, fallback to original if compressed doesn't exist
                        const originalProfile = UserData?.profile || null;
                        if (!originalProfile) {
                          return (
                            <Image
                              loading="lazy"
                              src={settings?.placeholder_image}
                              alt={UserData?.name || "Profile"}
                              width={36}
                              height={36}
                              onErrorCapture={placeholderImage}
                              style={{
                                borderRadius: "12px",
                              }}
                            />
                          );
                        }

                        // Try to get compressed version
                        const compressedProfile = getCompressedImage(UserData, 'small', originalProfile);
                        // If compressed exists and is different from original, use it; otherwise use original
                        const finalProfile = (compressedProfile && compressedProfile !== originalProfile && compressedProfile !== null)
                          ? compressedProfile
                          : originalProfile;
                        const profileSrc = normalizeImageUrl(finalProfile);

                        return (
                          <Image
                            loading="lazy"
                            src={profileSrc}
                            alt={UserData?.name || "Profile"}
                            width={36}
                            height={36}
                            onErrorCapture={placeholderImage}
                            style={{
                              borderRadius: "12px",
                              objectFit: "cover",
                              width: "36px",
                              height: "36px"
                            }}
                          />
                        );
                      })()}
                    </span>
                    <div className="drawer_menu_info">
                      <span className="drawer_menu_title">{accountTitle}</span>
                      {accountSubtitle && (
                        <span className="drawer_menu_subtitle">
                          {accountSubtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="drawer_menu_stack">
                    <ProfileDropdown
                      closeDrawer={closeDrawer}
                      settings={settings}
                      handleLogout={handleLogout}
                      isDrawer={true}
                    />
                  </div>
                </li>
              </>
            )}

            {/* <li className="drawer_menu_item drawer_menu_item--stack">
              <div className="drawer_menu_header">
                <span className="drawer_menu_icon">
                  <LuLayoutGrid size={20} />
                </span>
                <div className="drawer_menu_info">
                  <span className="drawer_menu_title">{t("category")}</span>
                  <span className="drawer_menu_subtitle">
                    {categoriesSubtitle}
                  </span>
                </div>
              </div>
              <div className="drawer_menu_stack">
                <FilterTree show={isDrawerOpen} setShow={(value) => toggleDrawer(value)} />
              </div>
            </li> */}

            {!UserData && (
              <>
                <li className="drawer_menu_item drawer_menu_item--single">
                  <button
                    type="button"
                    className="drawer_single_button"
                    onClick={openLoginModal}
                  >
                    <FaUserCircle size={20} />
                    <span>{t("login")}</span>
                  </button>
                </li>
                {/* <li className="drawer_menu_item drawer_menu_item--single">
                  <button
                    type="button"
                    className="drawer_single_button drawer_single_button--register"
                    onClick={openRegisterModal}
                  >
                    <FaUserCircle size={20} />
                    <span>{t("register")}</span>
                  </button>
                </li> */}
              </>
            )}
            </ul>
          </div>
        </Drawer>
      ) : null}
      <Suspense fallback={null}>
        <InvitationHandler />
      </Suspense>

      {/* Hide LoginModal on invitation pages - handled by the invitation page itself */}
      {
        !pathname.startsWith('/invitation/') && IsLoginModalOpen && (
          <LoginModal
            IsLoginModalOpen={IsLoginModalOpen}
            setIsLoginModalOpen={toggleLoginModal}
            setIsRegisterModalOpen={toggleRegisterModal}
            IsMailSentOpen={IsMailSentOpen}
            setIsMailSentOpen={setIsMailSentOpen}
          />
        )
      }

      {/* Hide RegisterModal on invitation pages - handled by the invitation page itself */}
      {
        !pathname.startsWith('/invitation/') && IsRegisterModalOpen && (
          <RegisterModal
            IsRegisterModalOpen={IsRegisterModalOpen}
            setIsLoginModalOpen={toggleLoginModal}
            CloseRegisterModal={() => toggleRegisterModal(false)}
            setIsMailSentOpen={setIsMailSentOpen}
          />
        )
      }

      {/* Hide MailSentSucessfully on invitation pages - handled by the invitation page itself */}
      {
        !pathname.startsWith('/invitation/') && IsMailSentOpen && (
          <MailSentSucessfully
            IsMailSentOpen={IsMailSentOpen}
            OnHide={() => setIsMailSentOpen(false)}
            IsLoginModalOpen={() => toggleLoginModal(true)}
          />
        )
      }

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

// ✅ Memoize Header to prevent unnecessary re-renders
// Header renders on every page, so memoization will improve performance
export default memo(Header);
