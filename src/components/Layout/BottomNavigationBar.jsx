"use client";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getIsLoggedIn } from "@/redux/reuducer/authSlice";
import { toggleLoginModal, toggleDrawer } from "@/redux/reuducer/globalStateSlice";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { t } from '@/utils';

import { 
  FaHome, 
  FaPlusCircle, 
  FaBook, 
  FaBullhorn, 
  FaUser,
  FaRegUser,
  FaRobot
} from "react-icons/fa";
import styles from "./BottomNavigationBar.module.css";
import { IoClose } from "react-icons/io5";

const BottomNavigationBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const currentLanguage = useSelector(CurrentLanguageData);
  const [authPrompt, setAuthPrompt] = useState({ visible: false, feature: "" });
  const [isClient, setIsClient] = useState(false);

  // Add padding to body on mobile to prevent content from being hidden behind nav bar
  useEffect(() => {
    const addBodyPadding = () => {
      if (window.innerWidth < 768) {
        document.body.style.paddingBottom = "60px";
      } else {
        document.body.style.paddingBottom = "0";
      }
    };

    addBodyPadding();
    window.addEventListener("resize", addBodyPadding);

    return () => {
      window.removeEventListener("resize", addBodyPadding);
      document.body.style.paddingBottom = "0";
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if current route matches the nav item
  const isActive = (route) => {
    if (route === "/home") {
      return pathname === "/home";
    }
    if (route === "/profile/edit-profile") {
      // Match any profile route
      return pathname.startsWith("/profile");
    }
    return pathname.startsWith(route);
  };

  // Handle navigation with auth check
  const handleNavigation = (item) => {
    const { route, requiresAuth, id } = item;
    
    // If it's the profile icon, open drawer instead of navigating
    if (id === "profile") {
      // Check if mobile (window width < 768)
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        toggleDrawer(true);
        return;
      }
      // On desktop, navigate normally
      if (requiresAuth && !isLoggedIn) {
        setAuthPrompt({ visible: true, feature: item.label });
        return;
      }
      router.push(route);
      return;
    }
    
    // For other items, check auth and navigate
    if (requiresAuth && !isLoggedIn) {
      setAuthPrompt({ visible: true, feature: item.label });
      return;
    }
    router.push(route);
  };

  useEffect(() => {
    if (isLoggedIn && authPrompt.visible) {
      setAuthPrompt({ visible: false, feature: "" });
    }
  }, [isLoggedIn, authPrompt.visible]);

  const handleClosePrompt = () => setAuthPrompt({ visible: false, feature: "" });

  const handleOpenLogin = () => {
    toggleLoginModal(true);
    handleClosePrompt();
  };

  const isArabic = currentLanguage?.code === "ar" || currentLanguage?.language?.code === "ar";
  const authTitleText = isArabic ? "يتطلب تسجيل الدخول" : t("bottomNavAuthTitle") || "Sign in required";
  const authDescriptionText = isArabic
    ? `يرجى تسجيل الدخول للمتابعة إلى ${authPrompt.feature}.`
    : `Please sign in to continue to ${authPrompt.feature}.`;
  const authButtonText = isArabic ? "تسجيل الدخول" : t("login");

  const navItems = [
    {
      id: "home",
      label: t("home"),
      route: "/home",
      icon: FaHome,
      activeIcon: FaHome,
      requiresAuth: false,
    },
    {
      id: "ai-tools",
      label: t("tools"),
      route: "/ai-tools",
      icon: FaRobot,
      activeIcon: FaRobot,
      requiresAuth: false,
    },
    {
      id: "ad-listing",
      label: t("add"),
      route: "/ad-listing",
      icon: FaPlusCircle,
      activeIcon: FaPlusCircle,
      requiresAuth: false,
      featured: true,
    },
    {
      id: "blog",
      label: t("insights") || t("blog") || "Blog",
      route: "/blogs",
      icon: FaBook,
      activeIcon: FaBook,
      requiresAuth: false,
    },
    {
      id: "profile",
      label: t("myProfile"),
      route: "/profile/edit-profile",
      icon: FaRegUser,
      activeIcon: FaUser,
      requiresAuth: true,
    },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const active = isActive(item.route);
        const IconComponent = active ? item.activeIcon : item.icon;

        return (
          <button
            key={item.id}
            className={`${styles.navItem} ${active ? styles.active : ""} ${
              item.featured ? styles.featured : ""
            }`}
            onClick={() => handleNavigation(item)}
            aria-label={item.label}
          >
            <div className={styles.iconWrapper}>
              <IconComponent 
                className={styles.icon} 
                size={item.featured ? 32 : 22}
              />
              {item.featured && <span className={styles.featuredBadge}></span>}
            </div>
            {!item.featured && <span className={styles.label}>{item.label}</span>}
          </button>
        );
      })}
      {authPrompt.visible &&
        isClient &&
        createPortal(
          <div className={styles.authPromptPortal}>
            <div
              className={styles.authPromptOverlay}
              onClick={handleClosePrompt}
              aria-hidden="true"
            />
            <div className={styles.authPrompt} role="dialog" aria-live="assertive">
              <div className={styles.authPromptContent}>
                <button
                  type="button"
                  className={styles.authPromptClose}
                  onClick={handleClosePrompt}
                  aria-label="Close"
                >
                  <IoClose size={18} />
                </button>
                <p className={styles.authPromptTitle}>{authTitleText}</p>
                <p className={styles.authPromptDescription}>
                  {authDescriptionText}
                </p>
                <button
                  type="button"
                  className={styles.authPromptAction}
                  onClick={handleOpenLogin}
                >
                  {authButtonText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </nav>
  );
};

export default BottomNavigationBar;
