'use client'
import React, { useState, useCallback, useEffect } from "react";
import { Modal } from "antd";
import Image from "next/image";
import { FaAngleRight, FaPhone, FaUser, FaWhatsapp } from "react-icons/fa6";
import { MdClose, MdCheckCircle } from "react-icons/md";
import { t, placeholderImage } from "@/utils";
import { createPaymentIntentApi } from "@/utils/api";
import toast from "@/utils/toast";
import { useRouter } from "next/navigation";

// Styles for instruction content are already injected by ShamCashPayment component

const PACKAGE_COLORS = {
  without:  { primary: "#00ABBF", dark: "#008A9A" },
  bronze:   { primary: "#CD7F32", dark: "#8D5524" },
  silver:   { primary: "#B8C2CC", dark: "#5f666c" },
  gold:     { primary: "#D4AF37", dark: "#AA771C" },
  platinum: { primary: "#7B8FA1", dark: "#425B70" },
  diamond:  { primary: "#00B4D8", dark: "#0077B6" },
};

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
    if (isConfirmed) {
      PaymentModalClose();
      toast.custom((toastInst) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '14px', color: '#1f2937' }}>{t('paymentSubmitted')}</span>
          <button
            onClick={() => { router.push('/transactions'); toast.dismiss(toastInst.id); }}
            style={{ whiteSpace: 'nowrap', background: 'var(--primary-color, #00ABBF)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {t('viewTransactions')}
          </button>
        </div>
      ), { duration: 5000 });
    }
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
        updateActivePackage("under review");
        toast.success(t("paymentSubmitted"));
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
            {/* <div className="confirmation-question">
              <p className="question-text">{t("didYouCompletePayment")}</p>
            </div> */}
            
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
                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #e8e8e8" }}>
                  <p style={{ margin: "0 0 0.6rem", color: "#555", fontSize: "14px" }}>{t("supportInquiryText")}</p>
                  <a
                    href={`https://wa.me/971547399982?text=${encodeURIComponent(t("supportWhatsappMessage"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#25D366", color: "#fff", padding: "9px 18px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}
                  >
                    <FaWhatsapp size={18} />
                    <span>{t("contactSupportWhatsapp")}</span>
                  </a>
                </div>
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
          {priceData?.name && (() => {
            const color = priceData.color && PACKAGE_COLORS[priceData.color] ? priceData.color : "without";
            const { primary, dark } = PACKAGE_COLORS[color];
            return (
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <span style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${primary}, ${dark})`,
                  color: "#fff",
                  padding: "6px 22px",
                  borderRadius: "30px",
                  fontWeight: 700,
                  fontSize: "15px",
                  letterSpacing: "0.5px",
                  boxShadow: `0 3px 10px ${primary}55`,
                }}>
                  <span style={{ fontWeight: 400, opacity: 0.85 }}>{t("packageLabel")}:</span>{" "}{priceData.name}
                </span>
              </div>
            );
          })()}
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

