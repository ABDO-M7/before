'use client'
import React, { useState, useCallback, useEffect } from "react";
import { Modal } from "antd";
import Image from "next/image";
import { FaAngleRight, FaPhone, FaUser } from "react-icons/fa6";
import { MdClose, MdCheckCircle } from "react-icons/md";
import { t, placeholderImage } from "@/utils";
import { createPaymentIntentApi } from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Styles for instruction content are already injected by ShamCashPayment component

const ThirdPartyTransferPayment = ({
  priceData,
  packageSettings,
  PaymentModalClose,
  updateActivePackage,
  isReadonly = false,
}) => {
  const router = useRouter();
  const [isThirdPartyModal, setIsThirdPartyModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [transferCompanyName, setTransferCompanyName] = useState("");
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Auto-open modal if readonly mode
  useEffect(() => {
    if (isReadonly) {
      setIsThirdPartyModal(true);
      setCurrentStep(1);
    }
  }, [isReadonly]);

  const thirdPartySettings = packageSettings?.ThirdPartyTransfer;
  const hasIcon = thirdPartySettings?.icon;
  const iconUrl = hasIcon ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${hasIcon}` : null;

  const handleThirdPartyClick = () => {
    setIsThirdPartyModal(true);
    setCurrentStep(1);
    setOrderId("");
    setTransferCompanyName("");
    setPaymentReceipt(null);
    setIsConfirmed(false);
  };

  const handleClose = () => {
    setIsThirdPartyModal(false);
    setCurrentStep(1);
    setOrderId("");
    setTransferCompanyName("");
    setPaymentReceipt(null);
    setIsConfirmed(false);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderId.trim()) {
      toast.error(t("orderIdRequired"));
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append("package_id", priceData.id);
      formData.append("payment_method", "ThirdPartyTransfer");
      formData.append("order_id", orderId.trim());
      formData.append("more_info", transferCompanyName.trim());
      
      if (paymentReceipt) {
        formData.append("payment_receipt", paymentReceipt);
      }

      const res = await createPaymentIntentApi.createIntentWithFormData(formData);

      if (res?.data?.error === false) {
        setIsConfirmed(true);
        updateActivePackage();
        toast.success(t("paymentSubmitted"));
        setTimeout(() => {
          handleClose();
          PaymentModalClose();
          router.push("/transactions");
        }, 3000);
      } else {
        toast.error(res?.data?.message || t("errorOccurred"));
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error(t("errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const CloseIcon = (
    <div className="close_icon_cont">
      <MdClose size={24} color="black" />
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="third-party-step">
            <h3 className="step-title">{t("paymentInstructions")}</h3>
            {thirdPartySettings?.instruction && (
              <div className="instruction-content" dangerouslySetInnerHTML={{ __html: thirdPartySettings.instruction }} />
            )}
            {thirdPartySettings?.photos_explanation && (
              <div className="explanation-image">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${thirdPartySettings.photos_explanation}`}
                  alt={t("paymentInstructions")}
                  width={500}
                  height={400}
                  className="img-fluid"
                  onError={placeholderImage}
                />
              </div>
            )}
            <div className="step-actions">
              {!isReadonly && (
                <button className="btn-primary" onClick={handleNext}>
                  {t("next")} <FaAngleRight />
                </button>
              )}
              {isReadonly && (
                <button className="btn-secondary" onClick={handleClose}>
                  {t("close")}
                </button>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="third-party-step">
            <h3 className="step-title">{t("receiverInformation")}</h3>
            <div className="receiver-info">
              <div className="info-card">
                <div className="info-icon">
                  <FaUser size={24} />
                </div>
                <div className="info-content">
                  <label>{t("receiverName")}</label>
                  <p className="info-value">{thirdPartySettings?.name_receivers || "-"}</p>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">
                  <FaPhone size={24} />
                </div>
                <div className="info-content">
                  <label>{t("phone")}</label>
                  <p className="info-value">{thirdPartySettings?.phone || "-"}</p>
                </div>
              </div>
            </div>
            <div className="step-actions">
              {!isReadonly && (
                <>
                  <button className="btn-secondary" onClick={handleBack}>
                    {t("back")}
                  </button>
                  <button className="btn-primary" onClick={handleNext}>
                    {t("next")} <FaAngleRight />
                  </button>
                </>
              )}
              {isReadonly && (
                <>
                  <button className="btn-secondary" onClick={handleBack}>
                    {t("back")}
                  </button>
                  <button className="btn-secondary" onClick={handleClose}>
                    {t("close")}
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="third-party-step">
            <h3 className="step-title">{t("confirmPayment")}</h3>
            <div className="confirmation-question">
              <p className="question-text">{t("didYouCompletePayment")}</p>
            </div>
            
            {!isConfirmed ? (
              <>
                <div className="order-id-input">
                  <label>{t("orderIdOrTransferId")}</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => !isReadonly && setOrderId(e.target.value)}
                    placeholder={t("enterOrderIdOrTransferId")}
                    className="form-control"
                    disabled={isReadonly}
                    readOnly={isReadonly}
                  />
                </div>
                <div className="order-id-input">
                  <label>{t("transferCompanyName")}</label>
                  <input
                    type="text"
                    value={transferCompanyName}
                    onChange={(e) => !isReadonly && setTransferCompanyName(e.target.value)}
                    placeholder={t("enterTransferCompanyName")}
                    className="form-control"
                    disabled={isReadonly}
                    readOnly={isReadonly}
                  />
                </div>
                <div className="order-id-input">
                  <label>{t("paymentReceipt")}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => !isReadonly && setPaymentReceipt(e.target.files[0])}
                    className="form-control"
                    disabled={isReadonly}
                  />
                  {paymentReceipt && (
                    <div className="mt-2">
                      <p className="text-muted small">{t("selectedFile")}: {paymentReceipt.name}</p>
                    </div>
                  )}
                </div>
                <div className="step-actions">
                  {!isReadonly ? (
                    <>
                      <button className="btn-secondary" onClick={handleBack}>
                        {t("back")}
                      </button>
                      <button
                        className="btn-secondary cancel-btn"
                        onClick={handleClose}
                      >
                        {t("cancel")}
                      </button>
                      <button
                        className="btn-primary"
                        onClick={handleConfirmPayment}
                        disabled={isSubmitting || !orderId.trim()}
                      >
                        {isSubmitting ? t("submitting") : t("yesConfirm")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-secondary" onClick={handleBack}>
                        {t("back")}
                      </button>
                      <button className="btn-secondary" onClick={handleClose}>
                        {t("close")}
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="success-message">
                <MdCheckCircle size={60} color="#52c41a" />
                <h4>{t("paymentSubmitted")}</h4>
                <p>{t("reviewMessage")}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {!isReadonly && (
        <div className="col-12">
          <button onClick={handleThirdPartyClick}>
            <div className="payment_details">
              {iconUrl ? (
                <Image
                  loading="lazy"
                  src={iconUrl}
                  alt="Third Party Transfer"
                  width={30}
                  height={30}
                  onError={placeholderImage}
                />
              ) : (
                <div className="payment-icon-placeholder">TPT</div>
              )}
              <span>{t("thirdPartyTransfer")}</span>
            </div>
            <div className="payment_icon">
              <FaAngleRight size={18} />
            </div>
          </button>
        </div>
      )}

      <Modal
        centered
        open={isThirdPartyModal}
        closeIcon={CloseIcon}
        onCancel={handleClose}
        footer={null}
        maskClosable={false}
        className="third-party-modal"
        width={600}
      >
        <div className="third-party-payment-container">
          <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
              <span>1</span>
            </div>
            <div className={`step-line ${currentStep >= 2 ? "active" : ""}`}></div>
            <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
              <span>2</span>
            </div>
            <div className={`step-line ${currentStep >= 3 ? "active" : ""}`}></div>
            <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
              <span>3</span>
            </div>
          </div>
          {renderStepContent()}
        </div>
      </Modal>
    </>
  );
};

export default ThirdPartyTransferPayment;

