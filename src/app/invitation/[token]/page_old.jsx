"use client";
import Layout from "@/components/Layout/Layout";
import OpenInAppDrawer from "@/components/PagesComponent/SingleProductDetail/OpenInAppDrawer";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import RegisterModal from "@/components/Auth/RegisterModal";
import LoginModal from "@/components/Auth/LoginModal";
import MailSentSucessfully from "@/components/Auth/MailSentSucessfully";
import { toggleLoginModal } from "@/redux/reuducer/globalStateSlice";
import { getInvitationApi } from "@/utils/api";

const InvitationPage = ({ params }) => {
  const [isOpenInApp, setIsOpenInApp] = useState(false);
  const [IsRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [IsMailSentOpen, setIsMailSentOpen] = useState(false);
  const [invitationName, setInvitationName] = useState("");
  const [invitationToken, setInvitationToken] = useState(params?.token || "");
  const [isMobile, setIsMobile] = useState(false); // ✅ جديد

  // ✅ جلب systemSettingsData من Redux
  const systemSettingsData = useSelector((state) => state?.Settings);

  // 👇 تحديد إذا المستخدم موبايل أو لا
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = window.innerWidth <= 768; // أو تقدر تستخدم regex مع userAgent
      setIsMobile(checkMobile);
    }
  }, []);

  // 👇 فتح RegisterModal أو Drawer حسب نوع الجهاز + جلب بيانات الدعوة
  useEffect(() => {
    if (params?.token) {
      if (isMobile) {
        setIsOpenInApp(true);          // 📱 موبايل → Drawer
      } else {
        setIsRegisterModalOpen(true);  // 💻 ديسكتوب → Register Modal
      }
      setInvitationToken(params.token);

      const fetchInvitation = async () => {
        try {
          const res = await getInvitationApi.getInvitation({ token: params.token });
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
    }
  }, [params?.token, isMobile]);

  return (
    <Layout>
      <section id="invitation_page" className="container py-5">

        {/* ✅ Drawer (للموبايل) */}
        <OpenInAppDrawer
          IsOpenInApp={isOpenInApp}
          OnHide={() => setIsOpenInApp(false)}
          systemSettingsData={systemSettingsData}
        />

        {/* ✅ Register Modal (للديسكتوب فقط) */}
        <RegisterModal
          IsRegisterModalOpen={IsRegisterModalOpen}
          setIsLoginModalOpen={toggleLoginModal}
          CloseRegisterModal={() => setIsRegisterModalOpen(false)}
          setIsMailSentOpen={setIsMailSentOpen}
          invitationName={invitationName}
          invitationToken={invitationToken}
        />

        {/* ✅ Login Modal */}
        <LoginModal
          IsLoginModalOpen={false}
          setIsLoginModalOpen={toggleLoginModal}
          setIsRegisterModalOpen={setIsRegisterModalOpen}
          IsMailSentOpen={IsMailSentOpen}
          setIsMailSentOpen={setIsMailSentOpen}
        />

        {/* ✅ Mail Sent Modal */}
        <MailSentSucessfully
          IsMailSentOpen={IsMailSentOpen}
          OnHide={() => setIsMailSentOpen(false)}
          IsLoginModalOpen={() => toggleLoginModal(true)}
        />
      </section>
    </Layout>
  );
};

export default InvitationPage;
