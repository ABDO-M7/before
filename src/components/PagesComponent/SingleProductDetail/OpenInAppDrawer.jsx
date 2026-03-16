"use client";
import { t } from "@/utils";
import { Button, Drawer, Typography } from "antd";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OpenInAppDrawer = ({
  IsOpenInApp,
  OnHide,
  systemSettingsData,
  invitationCode,
}) => {
  const path = usePathname();
  const companyName = systemSettingsData?.data?.data?.company_name;
  const scheme = systemSettingsData?.data?.data?.deep_link_scheme;
  
  const drawerEnabled = false;

  const primaryColor =
    getComputedStyle(document.documentElement).getPropertyValue(
      "--primary-color"
    ) || "#00A8A8";

  useEffect(() => {
    // Only freeze body if drawer is enabled and open
    if (drawerEnabled && IsOpenInApp) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.position = "static";
      document.body.style.width = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.position = "static";
      document.body.style.width = "auto";
    };
  }, [IsOpenInApp, drawerEnabled]);

  // ✅ منع ظهور النافذة لمدة 5 دقائق بعد الإغلاق
  const handleHideWithTimer = () => {
    localStorage.setItem("openInAppDrawerHiddenUntil", Date.now() + 5 * 60 * 1000);
    OnHide();
  };

  // ✅ التحقق إذا كان وقت الإخفاء لم ينتهِ بعد
  useEffect(() => {
    const hiddenUntil = localStorage.getItem("openInAppDrawerHiddenUntil");
    if (hiddenUntil && Date.now() < hiddenUntil) {
      OnHide();
    }
  }, [OnHide]);

  function openInApp() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    var isAndroid = /android/i.test(userAgent);
    var isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    let appScheme = `${scheme}://${window.location.hostname}${path}`;
    let applicationLink;

    if (isAndroid) {
      applicationLink = systemSettingsData?.data?.data?.play_store_link;
    } else if (isIOS) {
      applicationLink = systemSettingsData?.data?.data?.app_store_link;
    } else {
      applicationLink =
        systemSettingsData?.data?.data?.app_store_link ||
        systemSettingsData?.data?.data?.play_store_link;
    }

    if (isAndroid || isIOS) {
      window.location.href = appScheme;
    } else {
      if (invitationCode) {
        window.location.href = `${scheme}:?invitation=${invitationCode}`;
      } else {
        window.location.href = `${scheme}://${window.location.hostname}${path}`;
      }
    }

    setTimeout(function () {
      if (document.hidden || document.webkitHidden) {
        toast.error(`${companyName} ${t("appStoreLinkNotAvailable")}`);
        return;
      } else {
        if (confirm(`${t("download_from_app")} ${t("note_for_syria")}`)) {
          if (!applicationLink) {
            toast.error(`${companyName} ${t("appStoreLinkNotAvailable")}`);
            return;
          }

          if (invitationCode) {
            const separator = applicationLink.includes("?") ? "&" : "?";
            applicationLink = `${applicationLink}${separator}referrer=inviteCode%3D${invitationCode}`;
          }

          window.location.href = applicationLink;
        }
      }
    }, 1000);
  }

  return (
    <Drawer
      title={`${t("viewInCompanyNameApp")}`}
      placement="bottom"
      size={420}
      onClose={handleHideWithTimer}
      open={drawerEnabled && IsOpenInApp}
      maskClosable={false}
      styles={{
        content: {
          backgroundColor: "rgba(255, 255, 255, 0.8)", // ✅ خلفية شفافة بنسبة 20%
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          paddingBottom: "40px",
        },
        body: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "20px",
        },
      }}
    >
      <div style={{ textAlign: "center", width: "100%" }}>
        <Typography.Paragraph style={{ marginBottom: 24, fontSize: 16 }}>
          {t("openAppDescription") || t("openAppForMoreFeatures")}
        </Typography.Paragraph>

        <Button
          type="primary"
          size="large"
          style={{
            backgroundColor: primaryColor,
            color: "white",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "320px",
            height: "48px",
            fontSize: "16px",
            fontWeight: "600",
          }}
          onClick={openInApp}
        >
          {t("BetterOnTheApp")}
        </Button>

        {/* ✅ نص "Continue on web" أسفل الزر */}
        <Typography.Text
          style={{
            display: "block",
            marginTop: "16px",
            color: "#555",
            cursor: "pointer",
            fontSize: "15px",
            textDecoration: "underline",
          }}
          onClick={handleHideWithTimer}
        >
          {t("continueOnWeb")}
        </Typography.Text>
      </div>
    </Drawer>
  );
};

export default OpenInAppDrawer;
