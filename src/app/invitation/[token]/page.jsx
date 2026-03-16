"use client";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout/Layout";
import HomePage from "@/components/Home";
import OpenInAppDrawer from "@/components/PagesComponent/SingleProductDetail/OpenInAppDrawer";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import MailSentSucessfully from "@/components/Auth/MailSentSucessfully";
// ✅ Lazy load auth modals (heavy: react-phone-input-2, antd)
const RegisterModal = dynamic(() => import("@/components/Auth/RegisterModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/Auth/LoginModal"), { ssr: false });
import { getInvitationApi } from "@/utils/api";
import { getIsLoggedIn } from "@/redux/reuducer/authSlice";
import { getIsLoginModalOpen, getIsRegisterModalOpen, toggleLoginModal, toggleRegisterModal } from "@/redux/reuducer/globalStateSlice";

// ✅ Helper functions
const setWithExpiry = (key, value, ttl) => {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
};

const InvitationPage = ({ params }) => {
  const router = useRouter();
  const [isOpenInApp, setIsOpenInApp] = useState(false);
  const IsRegisterModalOpen = useSelector(getIsRegisterModalOpen); // ✅ استخدام الحالة العامة من Redux
  const IsLoginModalOpen = useSelector(getIsLoginModalOpen); // ✅ استخدام الحالة العامة من Redux
  const [IsMailSentOpen, setIsMailSentOpen] = useState(false);
  const [invitationName, setInvitationName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const systemSettingsData = useSelector((state) => state?.Settings);
  const isLoggedIn = useSelector(getIsLoggedIn);

  // ✅ Redirect logged-in users to homepage
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/home");
    }
  }, [isLoggedIn, router]);

  // 👇 Detect mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth <= 768);
    }
  }, []);

  // 👇 Handle token and always show LoginModal when not logged in
  useEffect(() => {
    // Don't show modals if user is logged in (will be redirected)
    if (isLoggedIn) return;

    let finalToken = "";

    if (params?.token) {
      finalToken = params.token;
      setWithExpiry("invitationCode", finalToken, 3 * 60 * 60 * 1000); // 3 ساعات
    } else {
      const savedToken = getWithExpiry("invitationCode");
      if (savedToken) finalToken = savedToken;
    }

    if (finalToken) {
      setInvitationCode(finalToken);

      // ✅ Always show LoginModal on desktop when not logged in
      if (!isMobile) {
        toggleLoginModal(true);
      } else {
        // On mobile, show OpenInAppDrawer
        setIsOpenInApp(true);
      }

      // ✅ fetch inviter name safely
      let isMounted = true;
      const fetchInvitation = async () => {
        try {
          const res = await getInvitationApi.getInvitation({ token: finalToken });
          if (!isMounted) return;
          if (res?.data?.error === false) {
            setInvitationName(res.data.data.inviter_name);
          } else {
            console.log(res.data.message);
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchInvitation();

      return () => { isMounted = false; };
    }
  }, [params?.token, isMobile, isLoggedIn]);

  return (
    <Layout>
      {/* Homepage Content */}
      <HomePage />

      {/* Drawer (Mobile) */}
      <OpenInAppDrawer
        IsOpenInApp={isOpenInApp}
        OnHide={() => setIsOpenInApp(false)}
        systemSettingsData={systemSettingsData}
        invitationCode={invitationCode}
      />

      {/* Register Modal (Desktop) */}
      <RegisterModal
        IsRegisterModalOpen={IsRegisterModalOpen}
        setIsLoginModalOpen={toggleLoginModal}
        CloseRegisterModal={() => {
          toggleRegisterModal(false);
        }}
        setIsMailSentOpen={setIsMailSentOpen}
        invitationName={invitationName}
        invitationCode={invitationCode}
        maskClosable={true} // ✅ السماح بالنقر على العناصر خلف المودال
      />

      {/* Login Modal */}
      <LoginModal
        IsLoginModalOpen={IsLoginModalOpen}
        setIsLoginModalOpen={toggleLoginModal}
        setIsRegisterModalOpen={toggleRegisterModal}
        IsMailSentOpen={IsMailSentOpen}
        setIsMailSentOpen={setIsMailSentOpen}
        invitationName={invitationName}
        invitationCode={invitationCode}
      />

      {/* Mail Sent Modal */}
      <MailSentSucessfully
        IsMailSentOpen={IsMailSentOpen}
        OnHide={() => setIsMailSentOpen(false)}
        IsLoginModalOpen={() => toggleLoginModal(true)}
      />
    </Layout>
  );
};

export default InvitationPage;
