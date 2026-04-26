import { FaArrowLeft, FaCheck } from "react-icons/fa6";
import { MdOutlineAdsClick } from "react-icons/md";
import { LuClock } from "react-icons/lu";
import { formatPriceAbbreviated, t } from "@/utils";

const PACKAGE_THEMES = {
  without: {
    primary: "#00ABBF",
    primaryDark: "#008A9A",
    accent: "#D4AF37",
    accentDark: "#AA771C",
    // cardGradient: "linear-gradient(180deg, rgba(0, 171, 191, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)",
    titleClassName: "",
    featuredBadge: false,
    icon: "bolt",
  },
  bronze: {
    primary: "#CD7F32",
    primaryDark: "#8D5524",
    accent: "#E8A869",
    accentDark: "#B06D33",
    cardGradient: "linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)",
    titleClassName: "",
    featuredBadge: false,
    icon: "layers",
  },
  silver: {
    primary: "#B8C2CC",
    primaryDark: "#5f666c",
    accent: "#B8C2CC",
    accentDark: "#7A8794",
    cardGradient: "linear-gradient(180deg, rgba(184, 194, 204, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)",
    titleClassName: "",
    featuredBadge: false,
    icon: "bolt",
  },
  gold: {
    primary: "#D4AF37",
    primaryDark: "#AA771C",
    accent: "#F5D76E",
    accentDark: "#8F6B10",
    cardGradient: "linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)",
    titleClassName: "subscription-design-exclusive-title",
    featuredBadge: true,
    icon: "layers",
  },
  platinum: {
    primary: "#7B8FA1",
    primaryDark: "#425B70",
    accent: "#A8BCC8",
    accentDark: "#324A5E",
    cardGradient: "linear-gradient(180deg, rgba(123, 143, 161, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)",
    titleClassName: "",
    featuredBadge: true,
    icon: "layers",
  },
  diamond: {
    primary: "#00B4D8",
    primaryDark: "#0077B6",
    accent: "#90E0EF",
    accentDark: "#005C8A",
    cardGradient: "linear-gradient(180deg, rgba(0, 180, 216, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)",
    titleClassName: "",
    featuredBadge: true,
    icon: "layers",
  },
};

const splitPrice = (formatted) => {
  if (!formatted) return { symbol: '', amount: '' };
  const parts = formatted.trim().split(/\s+/);
  if (parts.length < 2) return { symbol: '', amount: formatted };
  const last = parts[parts.length - 1];
  const isNumericLast = /^[\d.,٠-٩]+$/.test(last);
  return isNumericLast
    ? { symbol: parts.slice(0, -1).join(' '), amount: last }
    : { symbol: last, amount: parts.slice(0, -1).join(' ') };
};

const getFeatureList = (data) => {
  if (Array.isArray(data?.features) && data.features.length > 0) {
    return data.features.filter(Boolean);
  }

  const description = data?.description ?? "";
  return description
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const getPackageStatus = (data) => {
  const normalizedStatus = String(data?.payment_status || "").toLowerCase().trim();

  if (data?.is_active || normalizedStatus === "succeed") {
    return "active";
  }

  if (normalizedStatus === "pending" || normalizedStatus === "under review") {
    return "pending";
  }

  if (normalizedStatus === "failed" || normalizedStatus === "rejected") {
    return "retry";
  }

  return "default";
};

const renderPackageIcon = (iconType, className) => {
  if (iconType === "layers") {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.645 2.091a.75.75 0 01.71 0l7.5 4.25a.75.75 0 010 1.318l-7.5 4.25a.75.75 0 01-.71 0l-7.5-4.25a.75.75 0 010-1.318l7.5-4.25z" />
        <path d="M2.135 11.61a.75.75 0 01.623-.11l7.5 1.765a.75.75 0 00.344 0l7.5-1.765a.75.75 0 01.278 1.474l-7.5 1.765a2.25 2.25 0 01-1.031 0L2.33 13.084a.75.75 0 01-.195-1.473z" />
        <path d="M2.135 15.86a.75.75 0 01.623-.11l7.5 1.765a.75.75 0 00.344 0l7.5-1.765a.75.75 0 01.278 1.474l-7.5 1.765a2.25 2.25 0 01-1.031 0L2.33 17.334a.75.75 0 01-.195-1.473z" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

const SubscriptionCard = ({
  data,
  handlePurchasePackage,
  onViewPaymentDetails,
  hideActions = false,
}) => {
  const packageColor = data?.color && PACKAGE_THEMES[data.color] ? data.color : "without";
  const theme = PACKAGE_THEMES[packageColor];
  const features = getFeatureList(data);
  const packageStatus = getPackageStatus(data);
  const isFeatured = Number(data?.featured ?? 0) === 1;
  const isHighlighted = isFeatured;
  const isActive = packageStatus === "active";
  const isPending = packageStatus === "pending";
  const shouldRetry = packageStatus === "retry";

  const title = data?.display_title || data?.name;
  const slogan =
    data?.display_slogan ||
    data?.display_subtitle ||
    data?.slogan ||
    data?.sub_title ||
    "";

  const fallbackButtonLabel = isActive
    ? "الباقة مفعلة"
    : isPending
      ? "قيد المراجعة"
      : shouldRetry
        ? "إعادة المحاولة"
        : isHighlighted || packageColor === "gold"
          ? "ميّز إعلانك الآن"
          : "تفعيل الحزمة";

  const buttonLabel =
    (isActive && data?.active_button_text) ||
    (isPending && data?.pending_button_text) ||
    (shouldRetry && data?.retry_button_text) ||
    ((shouldRetry || packageStatus === "default") && data?.button_text) ||
    fallbackButtonLabel;

  const cardStyle = {
    "--package-primary": theme.primary,
    "--package-primary-dark": theme.primaryDark,
    "--package-accent": theme.accent,
    "--package-accent-dark": theme.accentDark,
    background: theme.cardGradient,
  };

  const handlePrimaryAction = (event) => {
    if (isActive) {
      return;
    }

    if (isPending) {
      if (!window.confirm(t('pendingPaymentConfirm'))) return;
    }

    handlePurchasePackage(event, data);
  };

  const shouldHideButton = Boolean(hideActions) && !isActive;

  return (
    <article
      className={`subscription-design-card ${isHighlighted ? "subscription-design-card-highlighted" : ""} ${isActive ? "subscription-design-card-active" : ""} ${isPending ? "subscription-design-card-pending" : ""}`}
      style={cardStyle}
    >
      {isHighlighted && <div className="subscription-design-shimmer" aria-hidden="true" />}
      {isFeatured && <div className="subscription-design-popular-badge">الاكثر طلبا</div>}

      <div className="subscription-design-card-inner">
        <div className="subscription-design-card-header">
          <div>
            <h3 className={`subscription-design-card-title ${theme.titleClassName}`}>{title}</h3>
            {slogan ? (
              <p className="subscription-design-card-subtitle">{slogan}</p>
            ) : null}
          </div>

          <div className="subscription-design-card-icon">
            {renderPackageIcon(theme.icon, "subscription-design-card-icon-svg")}
          </div>
        </div>

        <div className="subscription-design-features">
          {features.map((feature, index) => (
            <div className="subscription-design-feature-row" key={`${data?.id}-${index}`}>
              <span className="subscription-design-check-icon">
                <FaCheck size={12} />
              </span>
              <span className="subscription-design-feature-text">{feature}</span>
            </div>
          ))}
        </div>

        <div className="subscription-design-stats">
          <div className="subscription-design-stat-item">
            <span className="subscription-design-stat-icon"><MdOutlineAdsClick size={16} /></span>
            <div className="subscription-design-stat-body">
              <span className="subscription-design-stat-label">
                {isActive ? t("adsRemaining") : t("adsAllowed")}
              </span>
              <span className="subscription-design-stat-value">
                {isActive && data?.remaining_limit !== undefined && data?.remaining_limit !== null
                  ? `${data.remaining_limit} / ${data.total_limit ?? data?.item_limit}`
                  : data?.item_limit === "unlimited" || data?.item_limit == null
                    ? t("unlimited")
                    : data?.item_limit}
              </span>
            </div>
          </div>

          <div className="subscription-design-stat-item">
            <span className="subscription-design-stat-icon"><LuClock size={16} /></span>
            <div className="subscription-design-stat-body">
              <span className="subscription-design-stat-label">{t("featuredDuration")}</span>
              <span className="subscription-design-stat-value">
                {data?.duration === "unlimited" || data?.duration == null
                  ? t("unlimited")
                  : `${data.duration} ${t("days")}`}
              </span>
            </div>
          </div>
        </div>

        <div className="subscription-design-price-row">
          <div className="subscription-design-price-wrap">
            <span className="subscription-design-price">
              {(() => {
                const { symbol, amount } = splitPrice(formatPriceAbbreviated(data?.final_price));
                return <>
                  <strong className="subscription-design-price-amount">{amount}</strong>
                  <span className="subscription-design-price-symbol">{symbol}</span>
                </>;
              })()}
            </span>
            {Number(data?.price) > Number(data?.final_price) ? (
              <span className="subscription-design-price-before">{formatPriceAbbreviated(data?.price)}</span>
            ) : null}
          </div>
        </div>

        {!shouldHideButton ? (
          <button
            type="button"
            className={`subscription-design-button ${isHighlighted ? "subscription-design-button-highlighted" : ""} ${isActive ? "subscription-design-button-active" : ""}`}
            onClick={handlePrimaryAction}
            disabled={isActive}
            style={packageColor === 'without' ? { background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#1f2937', boxShadow: 'none' } : undefined}
          >
            <span>{buttonLabel}</span>
            {!isActive ? <FaArrowLeft size={18} /> : null}
          </button>
        ) : null}
      </div>
    </article>
  );
};

export default SubscriptionCard;
