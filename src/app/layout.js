// ✅ Ant Design v6 supports React 19 natively - no patch needed

import AppProviders from "./providers";
import initFetchLogger from "@/utils/fetchLogger";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Cairo } from "next/font/google";

if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    initFetchLogger();
}

// ✅ Cairo — Arabic + Latin, only weights used in the app
// display: 'swap' prevents invisible text during font load (critical for LCP/CLS)
const cairo = Cairo({
    subsets: ["arabic", "latin"],
    weight: ["400", "700"],
    display: "optional",  // ✅ يمنع الـ layout shift تماماً
    variable: "--primary-font",
    preload: true,
    // ✅ Explicitly declare used weights to avoid downloading all variants
    adjustFontFallback: true, // reduces CLS by adjusting fallback metrics
});

import "bootstrap/dist/css/bootstrap.min.css";
import "../../public/css/style.css";
import Toaster from "@/components/ToastProvider";
import CSSLoader from "@/components/CSSLoader";
import DeferredPrefetcher from "@/components/DeferredPrefetcher";
import ErrorBoundary from "@/components/ErrorBoundary";
import DeferredAnalytics from "@/components/DeferredAnalytics";

const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://arablaza.com';
const SITE_NAME = process.env.NEXT_PUBLIC_META_TITLE || 'Arablaza';
const DEFAULT_DESCRIPTION = process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Buy and sell with confidence.';

const API_ORIGIN = (() => {
    try {
        const url = process.env.NEXT_PUBLIC_API_URL || '';
        return url ? new URL(url).origin : '';
    } catch {
        return '';
    }
})();

// ✅ Image CDN origin for preconnect (speeds up LCP image on first load)
const IMAGE_CDN_ORIGIN = (() => {
    try {
        // Extract from NEXT_PUBLIC_API_URL — images are served from same host
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
        locale: 'ar_AR',
        siteName: SITE_NAME,
        url: SITE_URL,
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
    other: {
        ...(process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION && {
            'facebook-domain-verification': process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION,
        }),
    },
};

const DeferredWebVitals = process.env.NODE_ENV === 'development'
    ? (await import('@/components/DeferredWebVitals')).default
    : null;

export default async function RootLayout({ children }) {
    return (
        <html lang="ar" dir="rtl" web-version={process.env.NEXT_PUBLIC_WEB_VERSION} className={cairo.variable}>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#000000" />

                {/* ✅ Preconnect to API/image CDN — reduces LCP resource load delay */}
                {API_ORIGIN && (
                    <>
                        <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
                        <link rel="dns-prefetch" href={API_ORIGIN} />
                    </>
                )}

                {process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION && (
                    <meta name="facebook-domain-verification" content={process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION} />
                )}

                {/*
                    COMMENTED OUT — Early gtag queue (not needed in current setup)

                    Only restore this if you add gtag('event', ...) calls in page/component code
                    that runs BEFORE DeferredAnalytics mounts. In that case, events fired before
                    the real GA script loads would be lost without this queue.

                    Currently safe to omit because:
                    - DeferredAnalytics defines window.gtag itself when GA script loads
                    - No page/component code calls gtag() early
                    - Keeping it as a parser-blocking <script> in <head> hurts TBT for no gain

                    {process.env.NODE_ENV === 'production' && (
                        <script dangerouslySetInnerHTML={{__html: `window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};`}} />
                    )}
                */}

                {/* ✅ Critical above-the-fold styles only */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                        body{min-height:100vh;margin:0;font-family:var(--primary-font),sans-serif;}
                        #main-content,main{min-height:70vh;}
                        .container{width:100%;margin:0 auto;max-width:1320px;padding-left:12px;padding-right:12px;}
                        .header_logo,.drawer_title_logo{max-width:140px;height:auto;aspect-ratio:140/50;}
                        .d-none{display:none!important;}
                        @media (max-width: 991px){#main-content,main{padding-top:0;}}
                    `
                }} />
            </head>

            <body>
                {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
                    <noscript>
                        <img
                            height="1" width="1"
                            style={{ display: "none" }}
                            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1`}
                            alt="" loading="lazy"
                        />
                    </noscript>
                )}

                <AppProviders>
                    <ErrorBoundary name="RootLayout">
                        <Toaster position="top-center" reverseOrder={false} />
                        {children}
                        <DeferredAnalytics />
                        {process.env.NODE_ENV === 'development' && <DeferredWebVitals />}
                        <CSSLoader />
                        <DeferredPrefetcher />
                        <SpeedInsights />
                    </ErrorBoundary>
                </AppProviders>
            </body>
        </html>
    );
}
