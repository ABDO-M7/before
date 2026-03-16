'use client'
import React, { useState, useCallback, useEffect } from "react";
import { Modal } from "antd";
import Image from "next/image";
import { FaAngleRight, FaCopy, FaQrcode } from "react-icons/fa6";
import { MdClose, MdCheckCircle } from "react-icons/md";
import { t, placeholderImage } from "@/utils";
import { createPaymentIntentApi } from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Styles for payment modals
const paymentModalStyles = `
  .sham-cash-modal .ant-modal-content,
  .third-party-modal .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
  }
  
  .sham-cash-payment-container,
  .third-party-payment-container {
    padding: 20px;
  }
  
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
    gap: 10px;
  }
  
  .step-indicator .step {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #999;
    transition: all 0.3s ease;
  }
  
  .step-indicator .step.active {
    background: #1890ff;
    color: white;
  }
  
  .step-indicator .step-line {
    flex: 1;
    height: 2px;
    background: #f0f0f0;
    max-width: 100px;
    transition: all 0.3s ease;
  }
  
  .step-indicator .step-line.active {
    background: #1890ff;
  }
  
  .sham-cash-step,
  .third-party-step {
    min-height: 400px;
  }
  
  .step-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
    color: #333;
  }
  
  .explanation-image {
    text-align: center;
    margin: 20px 0;
  }
  
  .explanation-image img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .instruction-content {
    margin: 20px 0;
    padding: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    border-left: 4px solid #1890ff;
    line-height: 1.8;
    color: #333;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  
  .instruction-content h1,
  .instruction-content h2,
  .instruction-content h3,
  .instruction-content h4,
  .instruction-content h5,
  .instruction-content h6 {
    color: #1890ff;
    margin-top: 15px;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  .instruction-content h1:first-child,
  .instruction-content h2:first-child,
  .instruction-content h3:first-child {
    margin-top: 0;
  }
  
  .instruction-content p {
    margin-bottom: 12px;
    color: #555;
  }
  
  .instruction-content p:last-child {
    margin-bottom: 0;
  }
  
  .instruction-content ul,
  .instruction-content ol {
    margin: 12px 0;
    padding-left: 25px;
    color: #555;
  }
  
  .instruction-content li {
    margin-bottom: 8px;
  }
  
  .instruction-content strong,
  .instruction-content b {
    color: #333;
    font-weight: 600;
  }
  
  .instruction-content a {
    color: #1890ff;
    text-decoration: none;
    transition: color 0.3s ease;
  }
  
  .instruction-content a:hover {
    color: #40a9ff;
    text-decoration: underline;
  }
  
  .instruction-content blockquote {
    border-left: 3px solid #1890ff;
    padding-left: 15px;
    margin: 15px 0;
    color: #666;
    font-style: italic;
  }
  
  .instruction-content code {
    background: #f1f3f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    color: #e83e8c;
  }
  
  .payment-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 30px 0;
  }
  
  .payment-method-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }
  
  .payment-method-card:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  }
  
  .method-icon {
    color: #1890ff;
    margin-bottom: 15px;
  }
  
  .payment-method-card h4 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    color: #333;
  }
  
  .barcode-image {
    margin: 15px 0;
  }
  
  .barcode-image img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  
  .address-container {
    margin-top: 15px;
  }
  
  .address-box {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    word-break: break-all;
  }
  
  .address-text {
    margin: 0;
    font-size: 14px;
    color: #666;
    font-family: monospace;
  }
  
  .copy-btn {
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 auto;
    transition: all 0.3s ease;
  }
  
  .copy-btn:hover {
    background: #40a9ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
  }
  
  .receiver-info {
    margin: 30px 0;
  }
  
  .info-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .info-icon {
    color: #1890ff;
    flex-shrink: 0;
  }
  
  .info-content {
    flex: 1;
  }
  
  .info-content label {
    display: block;
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .info-value {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  
  .confirmation-question {
    text-align: center;
    margin: 30px 0;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;
  }
  
  .question-text {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  .order-id-input {
    margin: 30px 0;
  }
  
  .order-id-input label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
  
  .order-id-input .form-control {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
  }
  
  .order-id-input .form-control:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  }
  
  .step-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 30px;
    flex-wrap: wrap;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
  }
  
  .btn-primary {
    background: #1890ff;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #40a9ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #f0f0f0;
    color: #666;
  }
  
  .btn-secondary:hover {
    background: #e0e0e0;
  }
  
  .cancel-btn {
    background: #ff4d4f;
    color: white;
  }
  
  .cancel-btn:hover {
    background: #ff7875;
  }
  
  .success-message {
    text-align: center;
    padding: 40px 20px;
  }
  
  .success-message h4 {
    font-size: 24px;
    font-weight: 600;
    margin: 20px 0 10px;
    color: #52c41a;
  }
  
  .success-message p {
    font-size: 16px;
    color: #666;
    margin: 0;
    line-height: 1.6;
  }
  
  .payment-icon-placeholder {
    width: 30px;
    height: 30px;
    background: #1890ff;
    color: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
  }
  
  @media (max-width: 768px) {
    .sham-cash-modal .ant-modal,
    .third-party-modal .ant-modal {
      width: 95% !important;
      max-width: 95% !important;
    }
    
    .payment-methods {
      grid-template-columns: 1fr;
    }
    
    .step-title {
      font-size: 20px;
    }
    
    .step-actions {
      flex-direction: column;
    }
    
    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }
  }
`;

const ShamCashPayment = ({
  priceData,
  packageSettings,
  PaymentModalClose,
  updateActivePackage,
  isReadonly = false,
}) => {
  const router = useRouter();
  const [isShamCashModal, setIsShamCashModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Auto-open modal if readonly mode
  useEffect(() => {
    if (isReadonly) {
      setIsShamCashModal(true);
      setCurrentStep(1);
    }
  }, [isReadonly]);

  // Inject styles on component mount
  useEffect(() => {
    const styleId = 'payment-modal-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = paymentModalStyles;
      document.head.appendChild(style);
    }
  }, []);

  const shamCashSettings = packageSettings?.ShamCash;
  const hasIcon = shamCashSettings?.icon;
  const iconUrl = hasIcon ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${hasIcon}` : null;

  const handleShamCashClick = () => {
    setIsShamCashModal(true);
    setCurrentStep(1);
    setOrderId("");
    setIsConfirmed(false);
  };

  const handleClose = () => {
    setIsShamCashModal(false);
    setCurrentStep(1);
    setOrderId("");
    setIsConfirmed(false);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(shamCashSettings?.address_account || "");
      toast.success(t("copyToClipboard"));
    } catch (error) {
      toast.error(t("errorOccurred"));
    }
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
      const res = await createPaymentIntentApi.createIntent({
        package_id: priceData.id,
        payment_method: "ShamCash",
        order_id: orderId.trim(),
      });

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
          <div className="sham-cash-step">
            <h3 className="step-title">{t("paymentInstructions")}</h3>
            {shamCashSettings?.instruction && (
              <div className="instruction-content" dangerouslySetInnerHTML={{ __html: shamCashSettings.instruction }} />
            )}
            {shamCashSettings?.photos_explanation && (
              <div className="explanation-image">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${shamCashSettings.photos_explanation}`}
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
          <div className="sham-cash-step">
            <h3 className="step-title">{t("choosePaymentMethod")}</h3>
            <div className="payment-methods">
              {shamCashSettings?.photo_barcode && (
                <div className="payment-method-card">
                  <div className="method-icon">
                    <FaQrcode size={40} />
                  </div>
                  <h4>{t("scanBarcode")}</h4>
                  <div className="barcode-image">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${shamCashSettings.photo_barcode}`}
                      alt={t("barcode")}
                      width={300}
                      height={300}
                      className="img-fluid"
                      onError={placeholderImage}
                    />
                  </div>
                </div>
              )}
              
              {shamCashSettings?.address_account && (
                <div className="payment-method-card">
                  <div className="method-icon">
                    <FaCopy size={40} />
                  </div>
                  <h4>{t("copyAddress")}</h4>
                  <div className="address-container">
                    <div className="address-box">
                      <p className="address-text">{shamCashSettings.address_account}</p>
                    </div>
                    <button className="copy-btn" onClick={handleCopyAddress}>
                      <FaCopy /> {t("copy")}
                    </button>
                  </div>
                </div>
              )}
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
          <div className="sham-cash-step">
            <h3 className="step-title">{t("confirmPayment")}</h3>
            <div className="confirmation-question">
              <p className="question-text">{t("didYouCompletePayment")}</p>
            </div>
            
            {!isConfirmed ? (
              <>
                <div className="order-id-input">
                  <label>{t("orderId")}</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => !isReadonly && setOrderId(e.target.value)}
                    placeholder={t("enterOrderId")}
                    className="form-control"
                    disabled={isReadonly}
                    readOnly={isReadonly}
                  />
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
          <button onClick={handleShamCashClick}>
          <div className="payment_details">
            {iconUrl ? (
              <Image
                loading="lazy"
                src={iconUrl}
                alt="Sham Cash"
                width={30}
                height={30}
                onError={placeholderImage}
              />
            ) : (
              <div className="payment-icon-placeholder">SC</div>
            )}
            <span>{t("shamCash")}</span>
          </div>
          <div className="payment_icon">
            <FaAngleRight size={18} />
          </div>
        </button>
        </div>
      )}

      <Modal
        centered
        open={isShamCashModal}
        closeIcon={CloseIcon}
        onCancel={handleClose}
        footer={null}
        maskClosable={false}
        className="sham-cash-modal"
        width={600}
      >
        <div className="sham-cash-payment-container">
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

export default ShamCashPayment;

