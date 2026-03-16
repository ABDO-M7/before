"use client";
import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getInvitationApi } from "@/utils/api";
import { toggleRegisterModal } from "@/redux/reuducer/globalStateSlice";

const OpenInAppDrawer = dynamic(
  () => import("@/components/PagesComponent/SingleProductDetail/OpenInAppDrawer"),
  { ssr: false }
);

export default function InvitationHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [invitationCode, setInvitationCode] = useState(null);
  const [invitationName, setInvitationName] = useState("");
  const [isOpenInApp, setIsOpenInApp] = useState(false);

  const setWithExpiry = (key, value, ttl) => {
    const item = { value, expiry: Date.now() + ttl };
    localStorage.setItem(key, JSON.stringify(item));
  };

  const getWithExpiry = (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  };

  useEffect(() => {
    let token = searchParams.get("invitation");
    if (token) {
      setWithExpiry("invitationCode", token, 24 * 60 * 60 * 1000);
    } else {
      token = getWithExpiry("invitationCode");
    }
    if (!token) return;

    setInvitationCode(token);

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isMobileDevice = isAndroid || isIOS;

    const fetchInvitation = async () => {
      try {
        const res = await getInvitationApi.getInvitation({ token });
        if (res?.data?.error === false) {
          setInvitationName(res.data.data.inviter_name);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchInvitation();

    if (!pathname.startsWith("/invitation/")) {
      if (isMobileDevice) {
        setIsOpenInApp(true);
      } else {
        toggleRegisterModal(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (isOpenInApp || pathname.startsWith("/invitation/")) return;
    const hiddenUntil = localStorage.getItem("openInAppDrawerHiddenUntil");
    if (hiddenUntil && Date.now() < hiddenUntil) return;

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    if (isAndroid || isIOS) {
      setIsOpenInApp(true);
    }
  }, [pathname, isOpenInApp]);

  return (
    <>
      {isOpenInApp && (
        <OpenInAppDrawer
          isOpen={isOpenInApp}
          onClose={() => setIsOpenInApp(false)}
          invitationCode={invitationCode}
          invitationName={invitationName}
        />
      )}
    </>
  );
}
