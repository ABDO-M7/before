// ✅ Ant Design v6 supports React 19 natively - no patch needed

import AppProviders from "./providers";
import initFetchLogger from "@/utils/fetchLogger";
// ✅ Font is fetched at build time from Google Fonts. If you see "Failed to download Cairo",
// it's a network/build-environment issue (not related to robots.js). Ensure build can reach
// fonts.googleapis.com/fonts.gstatic.com, or switch to next/font/local with files in public/fonts.
import { Cairo } from "next/font/google";

// Initialize server-side fetch logger only in development
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  initFetchLogger();
}

// ✅ Cairo font for entire website (supports both Latin and Arabic)
const cairo = Cairo({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--primary-font",
  preload: true,
});

// ✅ Critical CSS only – above-the-fold (accessibility.css loaded deferred via CSSLoader)
// Bootstrap: full CSS loaded deferred via CSSLoader to reduce unused CSS; minimal grid inlined below
import "../../public/css/style.css";
import { Toaster } from "react-hot-toast";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import DeferredPrefetcher from "@/components/DeferredPrefetcher";
import CSSLoader from "@/components/CSSLoader";
import ErrorBoundary from "@/components/ErrorBoundary";

const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://arablaza.com';
const SITE_NAME = process.env.NEXT_PUBLIC_META_TITLE || 'Arablaza';
const DEFAULT_DESCRIPTION = process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Buy and sell with confidence. Arablaza marketplace for classifieds and more.';
// API origin for preconnect (no hardcoded production domain in source)
const API_ORIGIN = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL || '';
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
})();

export const metadata = {
  metadataBase: new URL(SITE_URL.replace(/\/$/, '')),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: process.env.NEXT_PUBLIC_META_kEYWORDS || undefined,
  icons: [{ url: '/favicon.ico' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    ...(process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION && {
      'facebook-domain-verification': process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION,
    }),
  },
};

export default async function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" web-version={process.env.NEXT_PUBLIC_WEB_VERSION} className={cairo.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        {/* ✅ Resource Hints - Preconnect to API domain from env (no hardcoded URL) */}
        {API_ORIGIN && (
          <>
            <link rel="preconnect" href={API_ORIGIN} />
            <link rel="dns-prefetch" href={API_ORIGIN} />
          </>
        )}
        {/* Analytics/pixel are deferred; avoid early preconnects on initial critical path */}
        {/* ✅ Facebook Domain Verification - from env so no production value in source */}
        {process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION && (
          <meta name="facebook-domain-verification" content={process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION} />
        )}
        {/* ✅ GTM + Facebook: loaded by DeferredAnalytics (after 5s or first interaction) to reduce main-thread work */}

        {/* ✅ Critical CSS (inline) – reserve space + minimal Bootstrap grid so deferred Bootstrap doesn't cause FOUC */}
        <style dangerouslySetInnerHTML={{ __html: `
          body{min-height:100vh;margin:0;}
          #main-content,main{min-height:50vh;}
          .offer_slider,.pop_categ_mrg_btm{min-height:1px;}
          .product_card_img_cont{min-height:180px;}
          .header_logo,.drawer_title_logo{max-width:140px;height:auto;}
          .container{width:100%;margin:0 auto;padding-left:12px;padding-right:12px;max-width:1320px;}
          .row{display:flex;flex-wrap:wrap;margin-left:-12px;margin-right:-12px;}
          .col-12{flex:0 0 100%;max-width:100%;padding-left:12px;padding-right:12px;}
          .d-none{display:none!important;}
          @media(min-width:992px){.d-lg-flex{display:flex!important;}}
          .ad_promo_section{min-height:200px;}
          .home_page_sections{min-height:min(2400px,200vh);}
          .popular_cat_slider,.cate_skel{min-height:140px;}
          .product_card_card_gap .col.card_col_gap,.product_card_card_gap .col{min-height:360px;}
        ` }} />
      </head>

      <body>
        {/* Ali has commented it cause it is not used or not have to import it - Redundant import, already imported globally */}
        {/* <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" /> */}
        {/* Facebook Pixel Noscript Fallback - Only in production, ID from env */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
              loading="lazy"
            />
          </noscript>
        )}
        <AppProviders>
          {/* ✅ Global Error Boundary - Catches any unhandled errors */}
          <ErrorBoundary name="RootLayout">
            <Toaster position="top-center" reverseOrder={false} />
            <DeferredAnalytics />
            <CSSLoader />
            <DeferredPrefetcher />
            {children}
          </ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
