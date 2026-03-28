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
import CSSLoader from "@/components/CSSLoader";
import DeferredPrefetcher from "@/components/DeferredPrefetcher";
import ErrorBoundary from "@/components/ErrorBoundary";
import Script from "next/script";
import DeferredAnalytics from "@/components/DeferredAnalytics";

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
        {/* ✅ Resource Hints - Preconnect to API and Auth domains (no hardcoded URLs) */}
        {API_ORIGIN && (
          <>
            <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={API_ORIGIN} />
          </>
        )}
        <link rel="preconnect" href="https://arablaza.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://arablaza.firebaseapp.com" />
        
        {/* Specific fonts preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ✅ Facebook Domain Verification */}
        {process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION && (
          <meta name="facebook-domain-verification" content={process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION} />
        )}

        {/* ✅ Critical Min-Style – only basic typography/scrolling, NO GRID classes that might conflict */}
        <style dangerouslySetInnerHTML={{ __html: `
            body{min-height:100vh;margin:0;font-family:var(--primary-font),sans-serif;overflow-x:hidden;}
            #main-content,main{min-height:70vh;padding-top:140px;}
            .main-header-reserve{height:140px;position:fixed;top:0;left:0;right:0;background:#fff;z-index:100;box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);}
            .container{width:100%;margin:0 auto;max-width:1320px;padding-left:12px;padding-right:12px;}
            .header_logo,.drawer_title_logo{max-width:140px;height:auto;aspect-ratio:140/50;}
            .d-none{display:none!important;}
            @media (max-width: 991px) {
              #main-content,main{padding-top:0;}
              .main-header-reserve{height:120px;position:relative;}
            }
          ` }} />
      </head>

      <body>
        {/* Placeholder to reserve space and prevent layout shifts during hydration */}
        <div className="main-header-reserve sticky-top" />
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

            {/* ✅ Optimized Analytics: Load ONLY during idle time (lazyOnload) */}
            {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
                strategy="lazyOnload"
              />
            )}
            {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <Script id="google-analytics" strategy="lazyOnload">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
                `}
              </Script>
            )}
            {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
              <Script id="fb-pixel" strategy="lazyOnload">
                {`
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                  fbq('track', 'PageView');
                `}
              </Script>
            )}

            {/* ✅ Defer non-critical hydration blocks */}
            <CSSLoader />
            <DeferredPrefetcher />
          </ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
