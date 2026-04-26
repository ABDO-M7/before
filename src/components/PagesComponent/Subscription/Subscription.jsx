"use client";
import "./subscription-design.css";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import SubscriptionCard from "@/components/Cards/SubscriptionCard";
import {
  assigFreePackageApi,
  getPackageApi,
  getPaymentSettingsApi,
} from "@/utils/api";
import { t } from "@/utils";
import PaymentModal from "./PaymentModal";
import SubscriptionCardSkeleton from "@/components/Skeleton/SubscriptionCardSkeleton";
import { store } from "@/redux/store";
import toast from "@/utils/toast";
import { isLogin } from "@/utils";
// import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent";
import { useSelector } from "react-redux";
import { getIsLoggedIn } from "@/redux/reuducer/authSlice";
import BankDetailsModal from "./BankDetailsModal";
import { toggleLoginModal } from "@/redux/reuducer/globalStateSlice";
import NoData from "@/components/NoDataFound/NoDataFound";

const Subscription = () => {
  const router = useRouter();
  const settingsData = store.getState().Settings?.data;
  const UserData = store.getState().UserSignup?.data?.data;
  const [isLoading, setIsLoading] = useState(false);
  const [, setItemPackages] = useState([]);
  const [advertisementPackage, setAdvertisementPackage] = useState([]);
  const [packageSettings, setPackageSettings] = useState([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [priceData, setPriceData] = useState({});
  const [isPaymentModal, setIsPaymentModal] = useState(false);
  const [isReadonlyModal, setIsReadonlyModal] = useState(false);
  const IsLoggedIn = useSelector(getIsLoggedIn);

  const getPackageSettingsData = async () => {
    try {
      setIsLoadingSettings(true);
      const res = await getPaymentSettingsApi.getPaymentSettings();
      const { data } = res.data;
      setPackageSettings(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingSettings(false);
    }
  };
  // Commented out: item-listing packages are hidden because they are free
  // I don't want to see them cause they are free
  // const getItemsPackageData = async () => {
  //   try {
  //     setIsLoading(true);
  //     const res = await getPackageApi.getPackage({ type: "item_listing" });
  //     const { data } = res.data;
  //     setItemPackages(data);
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  const getAdvertisementPackageData = async () => {
    try {
      setIsLoading(true);
      const res = await getPackageApi.getPackage({ type: "advertisement" });
      const { data } = res.data;
      setAdvertisementPackage(data);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // Commented out: item-listing packages are hidden because they are free
    // I don't want to see them cause they are free
    // if (isFreeAdListing === 0) {
    //   getItemsPackageData();
    // }
    getAdvertisementPackageData();
  }, [IsLoggedIn]);
  useEffect(() => {
    if (isPaymentModal) {
      getPackageSettingsData();
    }
  }, [isPaymentModal]);

  const assignPackage = async (id) => {
    try {
      const res = await assigFreePackageApi.assignFreePackage({
        package_id: id,
      });
      const data = res?.data;
      if (data?.error === true) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        router.push("/home");
      }
    } catch (error) {
      toast.error(error?.message || t("errorOccurred"));
      console.log(error);
    }
  };

  const handlePurchasePackage = (e, data) => {
    e.preventDefault();
    if (!isLogin()) {
      toggleLoginModal(true);
      return;
    }
    if (data?.final_price === 0) {
      assignPackage(data.id);
    } else {
      setIsPaymentModal(true);
      setIsReadonlyModal(false);
      setPriceData(data);
    }
  };

  const handleViewPaymentDetails = (data) => {
    setIsPaymentModal(true);
    setIsReadonlyModal(true);
    setPriceData(data);
    getPackageSettingsData();
  };

  useEffect(() => {}, [isPaymentModal, priceData]);

  return (
    <section className="static_pages subscription-design-section">
      {/* <BreadcrumbComponent title2={t("subscription")} /> */}
      <div className="container">
        <div className="subscription-design-page-wrapper">
          {/* <div className="subscription-design-orb subscription-design-orb-cyan" />
          <div className="subscription-design-orb subscription-design-orb-gold" /> */}

          <div className="subscription-design-header">
            <span className="subscription-design-header-badge">استثمر في عقارك</span>
            <h1>باقات التمييز الاحترافية</h1>
            <p>
              ضاعف فرص بيع عقارك بالوصول إلى آلاف المشترين الجادين عبر حلولنا
              التسويقية المبتكرة.
            </p>
          </div>

          {isLoading ? (
            <div className="subscription-design-grid">
              {Array(4)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="subscription-design-skeleton">
                    <SubscriptionCardSkeleton />
                  </div>
                ))}
            </div>
          ) : advertisementPackage?.length > 0 ? (
            <div className="subscription-design-grid">
              {(() => {
                const hasActivePackage = advertisementPackage.some((pkg) => {
                  const status = String(pkg?.payment_status || "").toLowerCase().trim();
                  return Boolean(pkg?.is_active) || status === "succeed";
                });

                return [...advertisementPackage]
                .sort((a, b) => {
                  const aFeatured = Number(a?.featured ?? 0);
                  const bFeatured = Number(b?.featured ?? 0);
                  if (aFeatured !== bFeatured) return aFeatured - bFeatured; // non-featured first
                  return Number(a?.id ?? 0) - Number(b?.id ?? 0);
                })
                .map((data) => (
                <SubscriptionCard
                  key={data.id}
                  data={data}
                  handlePurchasePackage={handlePurchasePackage}
                  onViewPaymentDetails={handleViewPaymentDetails}
                  hideActions={hasActivePackage}
                />
                ));
              })()}
            </div>
          ) : (
            <NoData name={t("packages")} />
          )}
        </div>
      </div>
      {isPaymentModal ? (
        <PaymentModal
          isPaymentModal={isPaymentModal}
          OnHide={() => {
            setIsPaymentModal(false);
            setIsReadonlyModal(false);
          }}
          packageSettings={packageSettings}
          priceData={priceData}
          settingsData={settingsData}
          user={UserData}
          setItemPackages={setItemPackages}
          setAdvertisementPackage={setAdvertisementPackage}
          isReadonly={isReadonlyModal}
          IsPaymentModalOpening={isLoadingSettings}
        />
      ) : null}

      {isPaymentModal ? (
        <BankDetailsModal
          priceData={priceData}
          bankDetails={packageSettings?.bankTransfer}
        />
      ) : null}
    </section>
  );
};

export default Subscription;
