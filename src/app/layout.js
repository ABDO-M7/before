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

// ✅ Critical CSS only – above-the-fold
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
            <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={API_ORIGIN} />
          </>
        )}

        {/* ✅ Facebook Domain Verification */}
        {process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION && (
          <meta name="facebook-domain-verification" content={process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION} />
        )}

        {/* ✅ Critical Min-Style – only basic typography/scrolling, NO GRID classes that might conflict */}
        <style dangerouslySetInnerHTML={{ __html: `
            body{min-height:100vh;margin:0;font-family:var(--primary-font),sans-serif;overflow-x:hidden;}
            #main-content,main{min-height:50vh;}
            .container{width:100%;margin:0 auto;max-width:1320px;padding-left:12px;padding-right:12px;}
            .header_logo,.drawer_title_logo{max-width:140px;height:auto;aspect-ratio:140/50;}
            .d-none{display:none!important;}
          ` }} />
      </head>

      <body>
        {/* Facebook Pixel Noscript Fallback */}
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
          <ErrorBoundary name="RootLayout">
            <Toaster position="top-center" reverseOrder={false} />
            
            {/* ✅ Prioritize Page Content: Render children FIRST */}
            {children}

            {/* ✅ Defer non-critical hydration blocks to clear main-thread for LCP */}
            <CSSLoader />
            <DeferredPrefetcher />
            <DeferredAnalytics />
          </ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
