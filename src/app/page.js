import { Suspense } from 'react';
import Layout from '@/components/Layout/Layout';
import JsonLd from '@/components/SEO/JsonLd';
import ComponentErrorBoundary from '@/components/ErrorBoundary/ComponentErrorBoundary';
import AiToolsSkeleton from '@/components/Skeleton/AiToolsSkeleton';
import PopularCategoriesSkeleton from '@/components/Skeleton/PopularCategoriesSkeleton';
import FeaturedSectionsSkeleton from '@/components/Skeleton/FeaturedSectionsSkeleton';

import ServerPopularAiTools from '@/components/Home/ServerPopularAiTools';
import ServerPopularCategories from '@/components/Home/ServerPopularCategories';
import ServerFeaturedSectionsLoader from '@/components/Home/ServerFeaturedSectionsLoader';
import ServerHomeBlogsRow from '@/components/Home/ServerHomeBlogsRow';

import { generateHomeMetadata } from '@/utils/metadataHelpers';

export const revalidate = 3600;

export const generateMetadata = async () => {
  return await generateHomeMetadata();
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
  // Do not block first paint on external API calls.
  // Header/settings are fetched on the client by Layout/Header after initial render.
  const initialQuickSearchItems = [];
  const initialSettings = null;

  return (
    <>
      <JsonLd data={organizationSchema} id="organization-schema" />
      <JsonLd data={websiteSchema} id="website-schema" />
      <Layout initialQuickSearchItems={initialQuickSearchItems} initialSettings={initialSettings}>

        {/* AI Tools -- above the fold, LCP element. Streams as soon as its API responds */}
        <ComponentErrorBoundary componentName="PopularAiTools">
          <Suspense fallback={<AiToolsSkeleton />}>
            <ServerPopularAiTools />
          </Suspense>
        </ComponentErrorBoundary>

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
          {/* Categories -- streams independently */}
          <div className="container main_padding">
            <div className="row mrg_btm">
              <div className="col-12">
                <div className="pop_cat_header">
                  {/* Render this immediately (not blocked by categories API call) */}
                  <h2
                    className="pop_cat_head text-dark"
                    style={{
                      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                      fontWeight: 800,
                    }}
                  >
                    تصفح اقسام الاعلانات
                  </h2>
                </div>
              </div>
            </div>
          </div>
          <ComponentErrorBoundary componentName="PopularCategories">
            <Suspense fallback={<PopularCategoriesSkeleton />}>
              <ServerPopularCategories />
            </Suspense>
          </ComponentErrorBoundary>

          {/* Featured Sections (up + ad banner + middle + blogs + down) */}
          {/* All featured sections depend on the same API call, so they stream together. */}
          {/* Blogs stream independently INSIDE the featured block via nested Suspense. */}
          <ComponentErrorBoundary componentName="FeaturedSections">
            <Suspense fallback={<FeaturedSectionsSkeleton />}>
              <ServerFeaturedSectionsLoader>
                {/* Blogs slot: streams independently even though it's placed between middle & down featured */}
                <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
                  <ServerHomeBlogsRow />
                </Suspense>
              </ServerFeaturedSectionsLoader>
            </Suspense>
          </ComponentErrorBoundary>
        </div>

      </Layout>
    </>
  );
};

export default HomePageRoute;
