"use client";
import toast from "@/utils/toast";
import { store } from "../redux/store";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { useSelector } from "react-redux";
import { logoutSuccess } from "../redux/reuducer/authSlice";

export { t } from "./translate";

// javascript-time-ago: lazy-initialized on first use (saves ~20KB from initial bundle)
let _TimeAgo = null;
function getTimeAgo() {
  if (_TimeAgo) return _TimeAgo;
  const TimeAgo = require("javascript-time-ago").default;
  const en = require("javascript-time-ago/locale/en").default;
  const ar = require("javascript-time-ago/locale/ar").default;
  try { TimeAgo.addDefaultLocale(en); } catch (_) {}
  try { TimeAgo.addLocale(ar); } catch (_) {}
  _TimeAgo = TimeAgo;
  return TimeAgo;
}

// Digit conversion helpers
export const toLatinDigits = (text) => {
  if (!text) return text;
  const arabicToLatin = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    // Extended Persian digits (used in some locales)
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  // Match Arabic-Indic and Persian digit ranges
  return String(text).replace(/[٠-٩۰-۹]/g, (char) => arabicToLatin[char] || char);
};

export const toArabicDigits = (text) => {
  if (!text) return text;
  const latinToArabic = {
    // ASCII digits -> Arabic-Indic
    '0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩',
    // Persian digits -> Arabic-Indic
    '۰':'٠','۱':'١','۲':'٢','۳':'٣','۴':'٤','۵':'٥','۶':'٦','۷':'٧','۸':'٨','۹':'٩',
    // keep Arabic-Indic as-is
    '٠':'٠','١':'١','٢':'٢','٣':'٣','٤':'٤','٥':'٥','٦':'٦','٧':'٧','٨':'٨','٩':'٩'
  };

  // Replace ASCII, Persian and Arabic-Indic digits with Arabic-Indic digits
  return String(text).replace(/[0-9۰-۹٠-٩]/g, (ch) => latinToArabic[ch] || ch);
};

// Format a plain number according to current app language and desired fraction digits
export const formatNumberByLang = (number, maxFractionDigits = 1, useGrouping = false) => {
  if (number === null || number === undefined || number === "") return "";
  const currentLanguage = store.getState()?.CurrentLanguage?.language?.code;
  const isArabic = currentLanguage === "ar";
  const locale = isArabic
    ? (countryLocaleMap[process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toUpperCase()] || "ar-SA")
    : "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: maxFractionDigits,
      useGrouping,
      numberingSystem: "latn",
    }).format(Number(number));
  } catch (err) {
    const fixed = Number(number) % 1 === 0 ? Number(number).toString() : Number(number).toFixed(maxFractionDigits);
    return fixed;
  }
};

// t() is now in utils/translate.js for smaller bundle when only translation is needed
// Re-imported here for internal use by functions below (ERROR_CODES, exactPrice, etc.)
import { t } from "./translate";

export const placeholderImage = (e) => {
  if (e.target.dataset.fallback) return;
  e.target.dataset.fallback = '1';

  let settings = store.getState()?.Settings?.data?.data;
  const placeholderLogo = settings?.placeholder_image;

  if (placeholderLogo) {
    e.target.src = placeholderLogo;
  }
};

export const favicon_icon = (e) => {
  let settings = store.getState()?.Settings?.data?.data;

  const Favicon = settings?.favicon_icon;

  if (Favicon) {
    e.target.src = Favicon;
  }
};

// check user login
// is login user check
export const isLogin = () => {
  // Use the selector to access user data
  const userData = store.getState()?.UserSignup?.data;
  // Check if the token exists
  if (userData?.token) {
    return true;
  }

  return false;
};

export const getDefaultLatLong = () => {
  let settings = store.getState()?.Settings?.data?.data;
  const default_latitude = Number(settings?.default_latitude);
  const default_longitude = Number(settings?.default_longitude);

  const defaultLetLong = {
    latitude: default_latitude,
    longitude: default_longitude,
  };
  return defaultLetLong;
};

export const getPlaceApiKey = () => {
  let settings = store.getState()?.Settings?.data?.data;
  return settings?.place_api_key;
};

export const getSlug = (pathname) => {
  const segments = pathname.split("/");
  return segments[segments.length - 1];
};

// function for formate date or time
export const formatDate = (createdAt) => {
  // Check if createdAt is undefined or null
  if (!createdAt) {
    return ""; // Return empty string or any default value
  }
  // Determine current app language to pick TimeAgo locale
  const currentLanguage = store.getState()?.CurrentLanguage?.language?.code;
  // Accept variants like 'ar', 'ar-SA', etc.
  const isArabicLang = typeof currentLanguage === 'string' && currentLanguage.startsWith('ar');
  const timeAgoLocale = isArabicLang ? 'ar' : 'en-US';
  const TimeAgo = getTimeAgo();
  const timeAgo = new TimeAgo(timeAgoLocale);
  const date = new Date(createdAt);

  try {
    // Use the built-in mini style which is designed for short labels
    const formatted = timeAgo.format(date, "mini-now");
    return toLatinDigits(formatted);
  } catch (error) {
    console.error("Error formatting date:", error);
    return ""; // Return empty string on error
  }
};

const countryLocaleMap = {
  AF: "ps-AF", // Afghanistan
  AL: "sq-AL", // Albania
  DZ: "ar-DZ", // Algeria
  AS: "en-AS", // American Samoa
  AD: "ca-AD", // Andorra
  AO: "pt-AO", // Angola
  AI: "en-AI", // Anguilla
  AG: "en-AG", // Antigua and Barbuda
  AR: "es-AR", // Argentina
  AM: "hy-AM", // Armenia
  AU: "en-AU", // Australia
  AT: "de-AT", // Austria
  AZ: "az-AZ", // Azerbaijan
  BS: "en-BS", // Bahamas
  BH: "ar-BH", // Bahrain
  BD: "bn-BD", // Bangladesh
  BB: "en-BB", // Barbados
  BY: "be-BY", // Belarus
  BE: "nl-BE", // Belgium
  BZ: "en-BZ", // Belize
  BJ: "fr-BJ", // Benin
  BM: "en-BM", // Bermuda
  BT: "dz-BT", // Bhutan
  BO: "es-BO", // Bolivia
  BA: "bs-BA", // Bosnia and Herzegovina
  BW: "en-BW", // Botswana
  BR: "pt-BR", // Brazil
  BN: "ms-BN", // Brunei
  BG: "bg-BG", // Bulgaria
  BF: "fr-BF", // Burkina Faso
  BI: "fr-BI", // Burundi
  KH: "km-KH", // Cambodia
  CM: "fr-CM", // Cameroon
  CA: "en-CA", // Canada
  CV: "pt-CV", // Cape Verde
  KY: "en-KY", // Cayman Islands
  CF: "fr-CF", // Central African Republic
  TD: "fr-TD", // Chad
  CL: "es-CL", // Chile
  CN: "zh-CN", // China
  CO: "es-CO", // Colombia
  KM: "ar-KM", // Comoros
  CG: "fr-CG", // Congo
  CR: "es-CR", // Costa Rica
  HR: "hr-HR", // Croatia
  CU: "es-CU", // Cuba
  CY: "el-CY", // Cyprus
  CZ: "cs-CZ", // Czech Republic
  DK: "da-DK", // Denmark
  DJ: "fr-DJ", // Djibouti
  DM: "en-DM", // Dominica
  DO: "es-DO", // Dominican Republic
  EC: "es-EC", // Ecuador
  EG: "ar-EG", // Egypt
  SV: "es-SV", // El Salvador
  GQ: "es-GQ", // Equatorial Guinea
  ER: "ti-ER", // Eritrea
  EE: "et-EE", // Estonia
  SZ: "en-SZ", // Eswatini
  ET: "am-ET", // Ethiopia
  FJ: "en-FJ", // Fiji
  FI: "fi-FI", // Finland
  FR: "fr-FR", // France
  GA: "fr-GA", // Gabon
  GM: "en-GM", // Gambia
  GE: "ka-GE", // Georgia
  DE: "de-DE", // Germany
  GH: "en-GH", // Ghana
  GR: "el-GR", // Greece
  GD: "en-GD", // Grenada
  GU: "en-GU", // Guam
  GT: "es-GT", // Guatemala
  GN: "fr-GN", // Guinea
  GW: "pt-GW", // Guinea-Bissau
  GY: "en-GY", // Guyana
  HT: "fr-HT", // Haiti
  HN: "es-HN", // Honduras
  HU: "hu-HU", // Hungary
  IS: "is-IS", // Iceland
  IN: "en-IN", // India
  ID: "id-ID", // Indonesia
  IR: "fa-IR", // Iran
  IQ: "ar-IQ", // Iraq
  IE: "en-IE", // Ireland
  IL: "he-IL", // Israel
  IT: "it-IT", // Italy
  JM: "en-JM", // Jamaica
  JP: "ja-JP", // Japan
  JO: "ar-JO", // Jordan
  KZ: "kk-KZ", // Kazakhstan
  KE: "en-KE", // Kenya
  KI: "en-KI", // Kiribati
  KP: "ko-KP", // North Korea
  KR: "ko-KR", // South Korea
  KW: "ar-KW", // Kuwait
  KG: "ky-KG", // Kyrgyzstan
  LA: "lo-LA", // Laos
  LV: "lv-LV", // Latvia
  LB: "ar-LB", // Lebanon
  LS: "en-LS", // Lesotho
  LR: "en-LR", // Liberia
  LY: "ar-LY", // Libya
  LI: "de-LI", // Liechtenstein
  LT: "lt-LT", // Lithuania
  LU: "fr-LU", // Luxembourg
  MG: "fr-MG", // Madagascar
  MW: "en-MW", // Malawi
  MY: "ms-MY", // Malaysia
  MV: "dv-MV", // Maldives
  ML: "fr-ML", // Mali
  MT: "mt-MT", // Malta
  MH: "en-MH", // Marshall Islands
  MR: "ar-MR", // Mauritania
  MU: "en-MU", // Mauritius
  MX: "es-MX", // Mexico
  FM: "en-FM", // Micronesia
  MD: "ro-MD", // Moldova
  MC: "fr-MC", // Monaco
  MN: "mn-MN", // Mongolia
  ME: "sr-ME", // Montenegro
  MA: "ar-MA", // Morocco
  MZ: "pt-MZ", // Mozambique
  MM: "my-MM", // Myanmar
  NA: "en-NA", // Namibia
  NR: "en-NR", // Nauru
  NP: "ne-NP", // Nepal
  NL: "nl-NL", // Netherlands
  NZ: "en-NZ", // New Zealand
  NI: "es-NI", // Nicaragua
  NE: "fr-NE", // Niger
  NG: "en-NG", // Nigeria
  NO: "no-NO", // Norway
  OM: "ar-OM", // Oman
  PK: "ur-PK", // Pakistan
  PW: "en-PW", // Palau
  PS: "ar-PS", // Palestine
  PA: "es-PA", // Panama
  PG: "en-PG", // Papua New Guinea
  PY: "es-PY", // Paraguay
  PE: "es-PE", // Peru
  PH: "en-PH", // Philippines
  PL: "pl-PL", // Poland
  PT: "pt-PT", // Portugal
  QA: "ar-QA", // Qatar
  RO: "ro-RO", // Romania
  RU: "ru-RU", // Russia
  RW: "rw-RW", // Rwanda
  KN: "en-KN", // Saint Kitts and Nevis
  LC: "en-LC", // Saint Lucia
  VC: "en-VC", // Saint Vincent and the Grenadines
  WS: "en-WS", // Samoa
  SM: "it-SM", // San Marino
  ST: "pt-ST", // Sao Tome and Principe
  SA: "ar-SA", // Saudi Arabia
  SN: "fr-SN", // Senegal
  RS: "sr-RS", // Serbia
  SC: "en-SC", // Seychelles
  SL: "en-SL", // Sierra Leone
  SG: "en-SG", // Singapore
  SK: "sk-SK", // Slovakia
  SI: "sl-SI", // Slovenia
  SB: "en-SB", // Solomon Islands
  SO: "so-SO", // Somalia
  ZA: "en-ZA", // South Africa
  ES: "es-ES", // Spain
  LK: "si-LK", // Sri Lanka
  SD: "ar-SD", // Sudan
  SR: "nl-SR", // Suriname
  SE: "sv-SE", // Sweden
  CH: "de-CH", // Switzerland
  SY: "ar-SY", // Syria
  TW: "zh-TW", // Taiwan
  TJ: "tg-TJ", // Tajikistan
  TZ: "sw-TZ", // Tanzania
  TH: "th-TH", // Thailand
  TG: "fr-TG", // Togo
  TO: "en-TO", // Tonga
  TT: "en-TT", // Trinidad and Tobago
  TN: "ar-TN", // Tunisia
  TR: "tr-TR", // Turkey
  TM: "tk-TM", // Turkmenistan
  UG: "en-UG", // Uganda
  UA: "uk-UA", // Ukraine
  AE: "ar-AE", // United Arab Emirates
  GB: "en-GB", // United Kingdom
  US: "en-US", // United States
  UY: "es-UY", // Uruguay
  UZ: "uz-UZ", // Uzbekistan
  VU: "en-VU", // Vanuatu
  VE: "es-VE", // Venezuela
  VN: "vi-VN", // Vietnam
  YE: "ar-YE", // Yemen
  ZM: "en-ZM", // Zambia
  ZW: "en-ZW", // Zimbabwe
};

// const countrySuffixMap = {
//   US: { K: 'K', M: 'M', B: 'B', divisor: [1000, 1000000, 1000000000] }, // United States: Thousand, Million, Billion
//   IN: { K: 'K', M: 'L', B: 'Cr', divisor: [1000, 100000, 10000000] }, // India: Thousand, Lakh, Crore
//   JP: { K: 'K', M: '万', B: '億', divisor: [1000, 10000, 100000000] }, // Japan: Thousand, Ten Thousand (万), Hundred Million (億)
//   CN: { K: 'K', M: '万', B: '亿', divisor: [1000, 10000, 100000000] }, // China: Thousand, Ten Thousand (万), Hundred Million (亿)
//   KR: { K: 'K', M: '만', B: '억', divisor: [1000, 10000, 100000000] }, // South Korea: Thousand, Ten Thousand (만), Hundred Million (억)
//   DE: { K: 'Tsd', M: 'Mio', B: 'Mrd', divisor: [1000, 1000000, 1000000000] }, // Germany: Tausend (Thousand), Million (Million), Milliarde (Billion)
//   FR: { K: 'k', M: 'M', B: 'Md', divisor: [1000, 1000000, 1000000000] }, // France: Thousand, Million, Milliard
//   RU: { K: 'K', M: 'М', B: 'Млрд', divisor: [1000, 1000000, 1000000000] }, // Russia: Thousand, Million (Миллион), Billion (Миллиард)
//   AR: { K: 'mil', M: 'MM', B: 'MMM', divisor: [1000, 1000000, 1000000000] }, // Argentina: Mil (Thousand), Millón (Million), Mil millones (Billion)
//   SA: { K: 'K', M: 'M', B: 'B', divisor: [1000, 1000000, 1000000000] }, // Saudi Arabia: Standard Thousand, Million, Billion
//   BR: { K: 'mil', M: 'M', B: 'Bi', divisor: [1000, 1000000, 1000000000] }, // Brazil: Mil (Thousand), Milhão (Million), Bilhão (Billion)
//   IT: { K: 'K', M: 'Mln', B: 'Mld', divisor: [1000, 1000000, 1000000000] }, // Italy: Thousand, Million (Milione), Billion (Miliardo)
//   ES: { K: 'mil', M: 'M', B: 'MilM', divisor: [1000, 1000000, 1000000000] }, // Spain: Mil (Thousand), Millón (Million), Mil millones
//   TH: { K: 'พัน', M: 'ล้าน', B: 'พันล้าน', divisor: [1000, 1000000, 1000000000] }, // Thailand: Thousand (พัน), Million (ล้าน), Billion (พันล้าน)
//   VN: { K: 'Nghìn', M: 'Triệu', B: 'Tỷ', divisor: [1000, 1000000, 1000000000] }, // Vietnam: Thousand, Million, Billion
//   ID: { K: 'Ribu', M: 'Juta', B: 'Miliar', divisor: [1000, 1000000, 1000000000] }, // Indonesia: Thousand (Ribu), Million (Juta), Billion (Miliar)
// };

export const exactPrice = (price) => {
  if (price === null || price === undefined || (typeof price === "string" && price.trim() === "")) {
    return ''
  }

  if (Number(price) === 0) {
    return t("noPrice");
  }

  // Get current language to determine numbering system
  const currentLanguage = store.getState()?.CurrentLanguage?.language?.code;
  const isArabic = currentLanguage === "ar";
  
  // Use en-US locale for English to force Latin digits, or Arabic locale for Arabic
  const locale = isArabic 
    ? (countryLocaleMap[process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toUpperCase()] || "ar-SA")
    : "en-US";

  const settingsData = store.getState()?.Settings?.data?.data;
  const currencyPosition = settingsData?.currency_symbol_position;
  const currencySymbol = settingsData?.currency_symbol;

  const formattedNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    useGrouping: true,
    numberingSystem: 'latn',
  }).format(Number(price));

  return currencyPosition === "right"
    ? `${formattedNumber} ${currencySymbol}`
    : `${currencySymbol} ${formattedNumber}`;
};

export const formatSalaryRange = (minSalary, maxSalary) => {
  const hasMin =
    minSalary !== undefined && minSalary !== null && minSalary !== "";
  const hasMax =
    maxSalary !== undefined && maxSalary !== null && maxSalary !== "";

  if (hasMin && hasMax) {
    return `${exactPrice(minSalary)} – ${exactPrice(maxSalary)}`;
  }

  if (hasMin) {
    return `${t("from")} ${exactPrice(minSalary)}`;
  }

  if (hasMax) {
    return `${t("upTo")} ${exactPrice(maxSalary)}`;
  }

  return '';
};

export const formatPriceAbbreviated = (price) => {

  if (price === null || price === undefined || (typeof price === "string" && price.trim() === "")) {
    return ''
  }

  if (Number(price) === 0) {
    return t("noPrice");
  }

  const settingsData = store.getState()?.Settings?.data?.data;
  const currencySymbol = settingsData?.currency_symbol;
  const currencyPosition =
    store.getState()?.Settings?.data?.data?.currency_symbol_position;
  
  // Get current language to determine numbering system
  const currentLanguage = store.getState()?.CurrentLanguage?.language?.code;
  const isArabic = currentLanguage === "ar";
  
  // Use en-US locale for English to force Latin digits, or Arabic locale for Arabic
  const locale = isArabic 
    ? (countryLocaleMap[process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toUpperCase()] || "ar-SA")
    : "en-US";

  const formattedNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    useGrouping: true,
    numberingSystem: 'latn',
  }).format(Number(price));

  return currencyPosition === "right"
    ? `${formattedNumber} ${currencySymbol}`
    : `${currencySymbol} ${formattedNumber}`;
};

// utils/stickyNote.js
export const createStickyNote = () => {
  const stickyNote = document.createElement("div");
  stickyNote.style.position = "fixed";
  stickyNote.style.bottom = "0";
  stickyNote.style.width = "100%";
  stickyNote.style.backgroundColor = "#ffffff";
  stickyNote.style.color = "#000000";
  stickyNote.style.padding = "10px";
  stickyNote.style.textAlign = "center";
  stickyNote.style.fontSize = "14px";
  stickyNote.style.zIndex = "99999";

  const closeButton = document.createElement("span");
  closeButton.style.cursor = "pointer";
  closeButton.style.float = "right";
  closeButton.innerHTML = "&times;";

  closeButton.onclick = function () {
    document.body.removeChild(stickyNote);
  };

  const playStoreLink = store.getState()?.Settings?.data?.data?.play_store_link;
  const appStoreLink = store.getState()?.Settings?.data?.data?.app_store_link;

  const message = document.createElement("span");
  message.innerText = t("chatAndNotificationNotSupported");

  const linkContainer = document.createElement("div"); // Changed to 'div' for better spacing
  linkContainer.style.display = "inline-block"; // Keeps links inline while allowing space

  const linkStyle = "text-decoration: underline !important; color: #3498db";

  if (playStoreLink) {
    const playStoreAnchor = document.createElement("a");
    playStoreAnchor.style.cssText = linkStyle;
    playStoreAnchor.innerText = t("playStore");
    playStoreAnchor.href = playStoreLink;
    playStoreAnchor.target = "_blank";
    linkContainer.appendChild(playStoreAnchor);
  }

  if (appStoreLink) {
    const appStoreAnchor = document.createElement("a");
    appStoreAnchor.style.cssText = linkStyle;
    appStoreAnchor.style.marginLeft = "5px"; // Space before this link
    appStoreAnchor.innerText = t("appStore");
    appStoreAnchor.href = appStoreLink;
    appStoreAnchor.target = "_blank";
    linkContainer.appendChild(appStoreAnchor);
  }

  stickyNote.appendChild(closeButton);
  stickyNote.appendChild(message);
  stickyNote.appendChild(linkContainer);

  document.body.appendChild(stickyNote);
};

const ERROR_CODES = {
  "auth/user-not-found": t("userNotFound"),
  "auth/wrong-password": t("invalidPassword"),
  "auth/email-already-in-use": t("emailInUse"),
  "auth/invalid-email": t("invalidEmail"),
  "auth/user-disabled": t("userAccountDisabled"),
  "auth/too-many-requests": t("tooManyRequests"),
  "auth/operation-not-allowed": t("operationNotAllowed"),
  "auth/internal-error": t("internalError"),
  "auth/invalid-login-credentials": t("incorrectDetails"),
  "auth/invalid-credential": t("incorrectDetails"),
  "auth/admin-restricted-operation": t("adminOnlyOperation"),
  "auth/already-initialized": t("alreadyInitialized"),
  "auth/app-not-authorized": t("appNotAuthorized"),
  "auth/app-not-installed": t("appNotInstalled"),
  "auth/argument-error": t("argumentError"),
  "auth/captcha-check-failed": t("captchaCheckFailed"),
  "auth/code-expired": t("codeExpired"),
  "auth/cordova-not-ready": t("cordovaNotReady"),
  "auth/cors-unsupported": t("corsUnsupported"),
  "auth/credential-already-in-use": t("credentialAlreadyInUse"),
  "auth/custom-token-mismatch": t("customTokenMismatch"),
  "auth/requires-recent-login": t("requiresRecentLogin"),
  "auth/dependent-sdk-initialized-before-auth": t(
    "dependentSdkInitializedBeforeAuth"
  ),
  "auth/dynamic-link-not-activated": t("dynamicLinkNotActivated"),
  "auth/email-change-needs-verification": t("emailChangeNeedsVerification"),
  "auth/emulator-config-failed": t("emulatorConfigFailed"),
  "auth/expired-action-code": t("expiredActionCode"),
  "auth/cancelled-popup-request": t("cancelledPopupRequest"),
  "auth/invalid-api-key": t("invalidApiKey"),
  "auth/invalid-app-credential": t("invalidAppCredential"),
  "auth/invalid-app-id": t("invalidAppId"),
  "auth/invalid-user-token": t("invalidUserToken"),
  "auth/invalid-auth-event": t("invalidAuthEvent"),
  "auth/invalid-cert-hash": t("invalidCertHash"),
  "auth/invalid-verification-code": t("invalidVerificationCode"),
  "auth/invalid-continue-uri": t("invalidContinueUri"),
  "auth/invalid-cordova-configuration": t("invalidCordovaConfiguration"),
  "auth/invalid-custom-token": t("invalidCustomToken"),
  "auth/invalid-dynamic-link-domain": t("invalidDynamicLinkDomain"),
  "auth/invalid-emulator-scheme": t("invalidEmulatorScheme"),
  "auth/invalid-message-payload": t("invalidMessagePayload"),
  "auth/invalid-multi-factor-session": t("invalidMultiFactorSession"),
  "auth/invalid-oauth-client-id": t("invalidOauthClientId"),
  "auth/invalid-oauth-provider": t("invalidOauthProvider"),
  "auth/invalid-action-code": t("invalidActionCode"),
  "auth/unauthorized-domain": t("unauthorizedDomain"),
  "auth/invalid-persistence-type": t("invalidPersistenceType"),
  "auth/invalid-phone-number": t("invalidPhoneNumber"),
  "auth/invalid-provider-id": t("invalidProviderId"),
  "auth/invalid-recaptcha-action": t("invalidRecaptchaAction"),
  "auth/invalid-recaptcha-token": t("invalidRecaptchaToken"),
  "auth/invalid-recaptcha-version": t("invalidRecaptchaVersion"),
  "auth/invalid-recipient-email": t("invalidRecipientEmail"),
  "auth/invalid-req-type": t("invalidReqType"),
  "auth/invalid-sender": t("invalidSender"),
  "auth/invalid-verification-id": t("invalidVerificationId"),
  "auth/invalid-tenant-id": t("invalidTenantId"),
  "auth/multi-factor-info-not-found": t("multiFactorInfoNotFound"),
  "auth/multi-factor-auth-required": t("multiFactorAuthRequired"),
  "auth/missing-android-pkg-name": t("missingAndroidPkgName"),
  "auth/missing-app-credential": t("missingAppCredential"),
  "auth/auth-domain-config-required": t("authDomainConfigRequired"),
  "auth/missing-client-type": t("missingClientType"),
  "auth/missing-verification-code": t("missingVerificationCode"),
  "auth/missing-continue-uri": t("missingContinueUri"),
  "auth/missing-iframe-start": t("missingIframeStart"),
  "auth/missing-ios-bundle-id": t("missingIosBundleId"),
  "auth/missing-multi-factor-info": t("missingMultiFactorInfo"),
  "auth/missing-multi-factor-session": t("missingMultiFactorSession"),
  "auth/missing-or-invalid-nonce": t("missingOrInvalidNonce"),
  "auth/missing-phone-number": t("missingPhoneNumber"),
  "auth/missing-recaptcha-token": t("missingRecaptchaToken"),
  "auth/missing-recaptcha-version": t("missingRecaptchaVersion"),
  "auth/missing-verification-id": t("missingVerificationId"),
  "auth/app-deleted": t("appDeleted"),
  "auth/account-exists-with-different-credential": t(
    "accountExistsWithDifferentCredential"
  ),
  "auth/network-request-failed": t("networkRequestFailed"),
  "auth/no-auth-event": t("noAuthEvent"),
  "auth/no-such-provider": t("noSuchProvider"),
  "auth/null-user": t("nullUser"),
  "auth/operation-not-supported-in-this-environment": t(
    "operationNotSupportedInThisEnvironment"
  ),
  "auth/popup-blocked": t("popupBlocked"),
  "auth/popup-closed-by-user": t("popupClosedByUser"),
  "auth/provider-already-linked": t("providerAlreadyLinked"),
  "auth/quota-exceeded": t("quotaExceeded"),
  "auth/recaptcha-not-enabled": t("recaptchaNotEnabled"),
  "auth/redirect-cancelled-by-user": t("redirectCancelledByUser"),
  "auth/redirect-operation-pending": t("redirectOperationPending"),
  "auth/rejected-credential": t("rejectedCredential"),
  "auth/second-factor-already-in-use": t("secondFactorAlreadyInUse"),
  "auth/maximum-second-factor-count-exceeded": t(
    "maximumSecondFactorCountExceeded"
  ),
  "auth/tenant-id-mismatch": t("tenantIdMismatch"),
  "auth/timeout": t("timeout"),
  "auth/user-token-expired": t("userTokenExpired"),
  "auth/unauthorized-continue-uri": t("unauthorizedContinueUri"),
  "auth/unsupported-first-factor": t("unsupportedFirstFactor"),
  "auth/unsupported-persistence-type": t("unsupportedPersistenceType"),
  "auth/unsupported-tenant-operation": t("unsupportedTenantOperation"),
  "auth/unverified-email": t("unverifiedEmail"),
  "auth/user-cancelled": t("userCancelled"),
  "auth/user-mismatch": t("userMismatch"),
  "auth/user-signed-out": t("userSignedOut"),
  "auth/weak-password": t("weakPassword"),
  "auth/web-storage-unsupported": t("webStorageUnsupported"),
};

// Error handling function
export const handleFirebaseAuthError = (errorCode) => {
  // Check if the error code exists in the global ERROR_CODES object
  if (ERROR_CODES.hasOwnProperty(errorCode)) {
    // If the error code exists, log the corresponding error message
    toast.error(ERROR_CODES[errorCode]);
  } else {
    // If the error code is not found, log a generic error message
    toast.error(`${t("errorOccurred")}:${errorCode}`);
  }
  // Optionally, you can add additional logic here to handle the error
  // For example, display an error message to the user, redirect to an error page, etc.
};

export const truncate = (text, maxLength) => {
  // Check if text is undefined or null
  if (!text) {
    return ""; // or handle the case as per your requirement
  }

  const stringText = String(text);

  // If the text length is less than or equal to maxLength, return the original text
  if (stringText.length <= maxLength) {
    return text;
  } else {
    // Otherwise, truncate the text to maxLength characters and append ellipsis
    return stringText?.slice(0, maxLength) + "...";
  }
};

export const formatDateMonth = (timestamp) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${month} ${parseInt(day, 10)}, ${year}`;

  return formattedDate;
};

export const loadStripeApiKey = () => {
  const STRIPEData = store.getState()?.Settings;
  const StripeKey = STRIPEData?.data?.stripe_publishable_key;
  if (StripeKey) {
    ``;
    return StripeKey;
  }
  return false;
};

// check is Rtl
export const useIsRtl = () => {
  const lang = useSelector(CurrentLanguageData);
  return lang?.rtl === true;
};

export const logout = () => {
  // Dispatch the logout action
  store.dispatch(logoutSuccess());

  // Redirect to the home page
  // Router.push('/');
};

// Google Maps: moved to dedicated module to avoid pulling ~150KB into every page
// import { loadGoogleMaps } from '@/utils/googleMaps' where needed

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove all characters that are not lowercase letters, digits, spaces, or hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading or trailing hyphens
};

export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};


export const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return t("now");
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays === 1) {
    return t("yesterday");
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  } else {
    return `${diffInYears}y`;
  }
};

export const isValidURL = (url) => {
  const pattern = /^(ftp|http|https):\/\/[^ "]+$/;
  return pattern.test(url);
};

export const formatDuration = (duration) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

export const formatChatMessageTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatMessageDate = (dateString) => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return t("today");
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return t("yesterday");
  } else {
    return messageDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
};

export const validateForm = (formData) => {
  const { name, email, subject, message } = formData;

  if (!name) {
    toast.error(t("nameRequired"));
    return false;
  }

  if (!email) {
    toast.error(t("emailRequired"));
    return false;
  }

  if (!subject) {
    toast.error(t("subjectRequired"));
    return false;
  }

  if (!message) {
    toast.error(t("messageRequired"));
    return false;
  }

  return true;
};

export const isPdf = (url) => url?.toLowerCase().endsWith(".pdf");

export const IsAdExpired = (SingleListing) => {
  if (!SingleListing?.expiry_date) {
    return false;
  }

  const expiryDate = new Date(SingleListing?.expiry_date);
  const currentDate = new Date();
  return expiryDate < currentDate;
};

export const formatMyListingDate = (dateStr) => {
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const options = { month: "short", day: "2-digit", year: "numeric" };

  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(date);

  const [month, day, year] = formattedDate.split(" ");

  return `${month}, ${day.slice(0, -1)}, ${year}`;
};

export const getYouTubeVideoId = (url) => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url?.match(regExp);
  if (match) {
    return match && match[2].length === 11 ? match[2] : null;
  } else {
    return false;
  }
};

export const getImageClass = (src) => {
  if (src?.endsWith(".svg") || src?.endsWith(".png")) {
    return "svgPngBackground"; // Apply background for SVG or PNG
  }
  return "jpgNoBackround"; // No background for other types like JPG
};

/**
 * ✅ Normalize image URL - Add API URL prefix if image is relative
 * Fixes double slashes and ensures proper URL formatting
 * @param {string} imageUrl - Image URL from API (can be relative or absolute)
 * @returns {string} - Normalized image URL
 */
export const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  // Keep already valid non-http URL schemes unchanged.
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }

  // If already absolute URL (http:// or https://), clean and return
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Remove double slashes (except after http:// or https://)
    return imageUrl.replace(/([^:]\/)\/+/g, '$1');
  }

  // Relative path handling:
  // - "/storage/..." (leading slash)
  // - "storage/..." (no leading slash)
  // - "/public/storage/..." while base URL already ends with "/public"
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

  if (!cleanApiUrl) {
    return imageUrl;
  }

  let cleanImagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const baseEndsWithPublic = /\/public$/i.test(cleanApiUrl);
  if (baseEndsWithPublic && /^\/public(\/|$)/i.test(cleanImagePath)) {
    cleanImagePath = cleanImagePath.replace(/^\/public/i, '');
  }

  return `${cleanApiUrl}${cleanImagePath}`.replace(/([^:]\/)\/+/g, '$1');
};

export const formatProdDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

export const extractYear = (dateString) => {
  const date = new Date(dateString);
  return date.getFullYear();
};

export const calculateRatingPercentages = (ratings) => {
  // Initialize counters for each star rating
  const ratingCount = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  // Count the number of each star rating
  ratings?.forEach((rating) => {
    const roundedRating = Math.round(rating?.ratings); // Round down to the nearest whole number
    if (roundedRating >= 1 && roundedRating <= 5) {
      ratingCount[roundedRating] += 1;
    }
  });

  // Get the total number of ratings
  const totalRatings = ratings.length;

  // Calculate the percentage for each rating
  const ratingPercentages = {
    5: (ratingCount[5] / totalRatings) * 100,
    4: (ratingCount[4] / totalRatings) * 100,
    3: (ratingCount[3] / totalRatings) * 100,
    2: (ratingCount[2] / totalRatings) * 100,
    1: (ratingCount[1] / totalRatings) * 100,
  };

  return { ratingCount, ratingPercentages };
};

export function getRoundedRating(rating) {
  if (!rating) return 0;

  const integerPart = Math.floor(rating); // Get the integer part
  const decimalPart = rating - integerPart; // Get the decimal part

  // If the decimal part is greater than 0, show a half star
  if (decimalPart > 0) {
    return integerPart + 0.5;
  } else {
    return integerPart; // Otherwise, show just the whole star
  }
}

/**
 * Get compressed image path based on size preference
 * @param {object|string} item - Item object with compressed field, or image string
 * @param {string} size - 'small', 'medium', or 'large'
 * @param {string} fallbackImage - Fallback image if compressed not available
 * @returns {string} - Compressed image URL or fallback
 */
export const getCompressedImage = (item, size = 'small', fallbackImage = null) => {
  // Handle string input (direct image URL)
  if (typeof item === 'string') {
    return item || fallbackImage;
  }

  // Handle object with compressed field
  if (item && typeof item === 'object') {
    const compressed = item?.compressed;
    
    // If compressed exists and is an object/array
    if (compressed && typeof compressed === 'object' && !Array.isArray(compressed)) {
      // Handle nested structure (e.g., Chat model with file/audio)
      if (compressed.file && typeof compressed.file === 'object') {
        // For chat files, use the file compressed
        const fileCompressed = compressed.file[size];
        // Check if path exists and is not empty
        if (fileCompressed && fileCompressed !== '' && fileCompressed !== null && fileCompressed !== undefined) {
          return fileCompressed;
        }
      }
      
      // Handle direct compressed paths (small, medium, large)
      const compressedPath = compressed[size];
      // Check if path exists and is not empty
      if (compressedPath && compressedPath !== '' && compressedPath !== null && compressedPath !== undefined) {
        return compressedPath;
      }
      
      // Fallback: try to get any available size
      if (compressed.small && compressed.small !== '' && compressed.small !== null && compressed.small !== undefined) {
        return compressed.small;
      }
      if (compressed.medium && compressed.medium !== '' && compressed.medium !== null && compressed.medium !== undefined) {
        return compressed.medium;
      }
      if (compressed.large && compressed.large !== '' && compressed.large !== null && compressed.large !== undefined) {
        return compressed.large;
      }
    }
    
    // Fallback to main image field if compressed doesn't exist or paths are invalid
    if (item.image && item.image !== '' && item.image !== null && item.image !== undefined) {
      return item.image;
    }
  }
  
  // Final fallback
  return fallbackImage || null;
};