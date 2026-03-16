"use client";
import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import FeaturedSectionsSkeleton from "../Skeleton/FeaturedSectionsSkeleton";
import ComponentErrorBoundary from "@/components/ErrorBoundary/ComponentErrorBoundary";

const UpperFeaturedSection = dynamic(() => import("./UpperFeaturedSection"), { ssr: true });
const AdListingBanner = dynamic(() => import("./AdListingBanner"), { ssr: true });
const MiddleFeaturedSection = dynamic(() => import("./MiddleFeaturedSection"), { ssr: false });
const DownFeaturedSection = dynamic(() => import("./DownFeaturedSection"), { ssr: false });

export default function FeaturedSectionsBlock({ initialFeaturedData, children }) {
  const hasData = Array.isArray(initialFeaturedData) && initialFeaturedData.length > 0;
  const [featuredData, setFeaturedData] = useState(hasData ? initialFeaturedData : []);

  const { upSections, middleSections, downSections } = useMemo(() => {
    const list = featuredData || [];
    return {
      upSections: list.filter((s) => (s?.placement || "up") === "up"),
      middleSections: list.filter((s) => s?.placement === "middle"),
      downSections: list.filter((s) => s?.placement === "down"),
    };
  }, [featuredData]);

  const handleSetFeaturedData = useCallback((newData) => {
    setFeaturedData(newData);
  }, []);

  if (!hasData) {
    return <FeaturedSectionsSkeleton />;
  }

  return (
    <>
      <ComponentErrorBoundary componentName="UpperFeaturedSection">
        <UpperFeaturedSection
          sections={upSections}
          featuredData={featuredData}
          setFeaturedData={handleSetFeaturedData}
        />
      </ComponentErrorBoundary>

      <AdListingBanner />

      <ComponentErrorBoundary componentName="MiddleFeaturedSection">
        <MiddleFeaturedSection
          sections={middleSections}
          featuredData={featuredData}
          setFeaturedData={handleSetFeaturedData}
        />
      </ComponentErrorBoundary>

      {/* Blogs slot -- passed as children, can have its own Suspense boundary */}
      {children}

      <ComponentErrorBoundary componentName="DownFeaturedSection">
        <DownFeaturedSection
          sections={downSections}
          featuredData={featuredData}
          setFeaturedData={handleSetFeaturedData}
        />
      </ComponentErrorBoundary>
    </>
  );
}
