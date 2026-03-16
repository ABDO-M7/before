import { FaArrowRight, FaCheck, FaEye } from "react-icons/fa6";
import Image from "next/image";
import { formatPriceAbbreviated, placeholderImage, t } from "@/utils";
import { useEffect } from "react";

// Styles for status badges
const statusBadgeStyles = `
  .status_badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 8px;
  }
  .success_badge {
    background-color: #52c41a;
    color: white;
  }
  .review_badge {
    background-color: #faad14;
    color: white;
  }
  .review_card {
    border: 2px solid #faad14;
  }
  .view_payment_btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    justify-content: center;
    background: #1890ff;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  .view_payment_btn:hover {
    background: #40a9ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
  }
  .resend_payment_btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    justify-content: center;
    background: #faad14;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    margin-bottom: 8px;
  }
  .resend_payment_btn:hover {
    background: #ffc53d;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(250, 173, 20, 0.3);
  }
`;

const SubscriptionCard = ({ data, handlePurchasePackage, onViewPaymentDetails }) => {
  // Inject styles on component mount
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('subscription-card-styles')) {
      const style = document.createElement('style');
      style.id = 'subscription-card-styles';
      style.textContent = statusBadgeStyles;
      document.head.appendChild(style);
    }
  }, []);
  const descriptionItems = data?.description
    ? data.description.split("\r\n")
    : [];

  // Determine package state based on payment_status
  const paymentStatus = data?.payment_status;
  // Normalize payment status to lowercase for comparison
  const normalizedStatus = paymentStatus ? String(paymentStatus).toLowerCase().trim() : null;
  const isSubscribed = normalizedStatus === 'succeed';
  const isUnderReview = normalizedStatus === 'pending' || normalizedStatus === 'under review';
  const canPurchase = !normalizedStatus || normalizedStatus === 'failed' || normalizedStatus === 'rejected';
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Package:', data?.name, 'Payment Status:', paymentStatus, 'Normalized:', normalizedStatus, 'isUnderReview:', isUnderReview, 'canPurchase:', canPurchase);
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className={`card regular_card ${isSubscribed ? "active_card" : ""} ${isUnderReview ? "review_card" : ""}`}>
      <div className="card-header">
        <div className="sub_icon_div">
          <Image
            src={data?.icon}
            alt={data?.name}
            width={80}
            height={80}
            className="sub_icon"
            onErrorCapture={placeholderImage}
          />
        </div>
        <div className="sub_details">
          <span className="name">{data?.name}</span>
          <div className="price">
            <span className="price">
              {formatPriceAbbreviated(data?.final_price)}
            </span>
            {data?.price > data?.final_price && (
              <span className="sale_price">
                {formatPriceAbbreviated(data?.price)}
              </span>
            )}
          </div>
          {!isSubscribed && !isUnderReview
            ? data?.discount_in_percentage !== 0 && (
              <span className="sale_tag">
                {data?.discount_in_percentage}% {t("off")}
              </span>
            )
            : null}
          {/* Status badge */}
          {isSubscribed && (
            <span className="status_badge success_badge">
              {t("subscribed")}
            </span>
          )}
          {isUnderReview && (
            <span className="status_badge review_badge">
              {t("underReview")}
            </span>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="details_list">
          <div className="list_menu">
            <div>
              <FaCheck size={24} className="right" />
            </div>
            <div>
              <span>
                {data?.item_limit} {t("adsListing")}
              </span>
            </div>
          </div>
          <div className="list_menu">
            <div>
              <FaCheck size={24} className="right" />
            </div>
            <div>
              <span>
                {data?.duration !== "unlimited"
                  ? `${data?.duration}  ${t("days")}`
                  : `${data?.duration}  ${t("days")}`}{" "}
              </span>
            </div>
          </div>

          {descriptionItems.map((item, index) => (
            <div className="list_menu" key={index}>
              <div>
                <FaCheck size={24} className="right" />
              </div>
              <div>
                <span>{item}</span>
              </div>
            </div>
          ))}

          {/* Show package dates for subscribed packages */}
          {isSubscribed && (
            <>
              <div className="list_menu">
                <div>
                  <FaCheck size={24} className="right" />
                </div>
                <div>
                  <span>
                    <strong>{t("startDate")}:</strong> {formatDate(data?.package_start_date)}
                  </span>
                </div>
              </div>
              <div className="list_menu">
                <div>
                  <FaCheck size={24} className="right" />
                </div>
                <div>
                  <span>
                    <strong>{t("endDate")}:</strong> {formatDate(data?.package_end_date) || t("unlimited")}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Show submit date for under review packages */}
          {isUnderReview && (
            <div className="list_menu">
              <div>
                <FaCheck size={24} className="right" />
              </div>
              <div>
                <span>
                  <strong>{t("submitDate")}:</strong> {formatDate(data?.payment_submit_date)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        {canPurchase && !isSubscribed && !isUnderReview && (
          <button
            onClick={(e) => handlePurchasePackage(e, data)}
          >
            <span>{t("choosePlan")}</span>
            <FaArrowRight size={24} className="sub_card_arrow" />
          </button>
        )}
        {isUnderReview && handlePurchasePackage && (
          <button
            onClick={(e) => {
              const confirmMessage = t("resendPaymentConfirmMessage");
              const confirmTitle = t("resendPaymentConfirmTitle");
              const fullMessage = `${confirmTitle}\n\n${confirmMessage}`;
              
              if (window.confirm(fullMessage)) {
                handlePurchasePackage(e, data);
              }
            }}
            className="resend_payment_btn"
          >
            <span>{t("resendPayment")}</span>
            <FaArrowRight size={24} className="sub_card_arrow" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
