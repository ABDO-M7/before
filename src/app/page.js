import { Suspense } from 'react';
import Layout from '@/components/Layout/Layout';
import JsonLd from '@/components/SEO/JsonLd';
import AiToolsSkeleton from '@/components/Skeleton/AiToolsSkeleton';
import PopularCategoriesSkeleton from '@/components/Skeleton/PopularCategoriesSkeleton';
import FeaturedSectionsSkeleton from '@/components/Skeleton/FeaturedSectionsSkeleton';

import ServerPopularAiTools from '@/components/Home/ServerPopularAiTools';
import ServerPopularCategories from '@/components/Home/ServerPopularCategories';
import ServerFeaturedSectionsLoader from '@/components/Home/ServerFeaturedSectionsLoader';
import ServerHomeBlogsRow from '@/components/Home/ServerHomeBlogsRow';
import AnythingYouWant from '@/components/LandingPage/AnythingYouWant';

import { generateHomeMetadata } from '@/utils/metadataHelpers';

export const revalidate = 86400; // 1 day default fallback

export const generateMetadata = async () => {
  return await generateHomeMetadata();
};

// Quick searches for header (needed immediately for Layout/Header)
const fetchQuickSearches = async () => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}quick-searches`
    );
    url.searchParams.set('featured', '1');
    const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ['quick-searches'] } });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
    const json = await res.json();
    const list = json?.data?.data ?? json?.data;
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Error fetching quick searches:', e?.message || e);
    return [];
  }
};

// System settings (needed immediately for Layout -- logo, theme color, footer)
const fetchSettings = async () => {
    try {
        const url = new URL(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-system-settings`
        );
        const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ['seo-settings'] } });
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
        const json = await res.json();
        return json || null;
    } catch (e) {
        console.error('Error fetching settings:', e?.message || e);
        return null;
    }
};

// Sliders for Home Page
const fetchSliders = async () => {
    try {
        const url = new URL(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-slider`
        );
        url.searchParams.set('hub', 'web');
        const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ['sliders'] } });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
    } catch (e) {
        console.error('Error fetching sliders:', e?.message || e);
        return [];
    }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: process.env.NEXT_PUBLIC_META_TITLE || "Arablaza",
  url: process.env.NEXT_PUBLIC_WEB_URL,
  logo: `${process.env.NEXT_PUBLIC_WEB_URL}/logo.png`,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: process.env.NEXT_PUBLIC_META_TITLE || "Arablaza",
  url: process.env.NEXT_PUBLIC_WEB_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${process.env.NEXT_PUBLIC_WEB_URL}/products?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const HomePageRoute = async () => {
  // Only settings + quick searches block the shell (header/footer need them immediately)
  const [initialQuickSearchItems, initialSettings] = await Promise.all([
    fetchQuickSearches(),
    fetchSettings(),
  ]);

  return (
    <>
      <JsonLd data={organizationSchema} id="organization-schema" />
      <JsonLd data={websiteSchema} id="website-schema" />
      <Layout initialQuickSearchItems={initialQuickSearchItems} initialSettings={initialSettings}>
        
        {/* Hero Section */}
        <AnythingYouWant />

        {/* Below-the-fold sections: each streams independently */}
        <div
          className="home_page_sections"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2.75rem",
            paddingTop: "1.25rem",
            paddingBottom: "2rem",
            maxWidth: "100%",
          }}
        >
          {/* AI Tools -- Moved above categories per user request */}
          <Suspense fallback={<AiToolsSkeleton />}>
            <ServerPopularAiTools />
          </Suspense>

          {/* Categories */}
          <Suspense fallback={<PopularCategoriesSkeleton />}>
            <ServerPopularCategories />
          </Suspense>


          {/* Featured Sections (up + ad banner + middle + blogs + down) */}
          {/* All featured sections depend on the same API call, so they stream together. */}
          {/* Blogs stream independently INSIDE the featured block via nested Suspense. */}
          <Suspense fallback={<FeaturedSectionsSkeleton />}>
            <ServerFeaturedSectionsLoader>
              {/* Blogs slot: streams independently even though it's placed between middle & down featured */}
              <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
                <ServerHomeBlogsRow />
              </Suspense>
            </ServerFeaturedSectionsLoader>
          </Suspense>
        </div>


      </Layout>
    </>
  );
};

export default HomePageRoute;
