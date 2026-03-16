import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Shimmer skeleton for the Ad Listing Banner section.
 * Matches approximate banner height to prevent layout shift.
 */
const AdListingBannerSkeleton = () => {
  return (
    <div className="container main_padding" style={{ minHeight: '200px' }}>
      <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div className="flex-grow-1">
            <Skeleton width={100} height={28} style={{ marginBottom: '0.75rem' }} />
            <Skeleton width={280} height={36} style={{ marginBottom: '0.5rem' }} />
            <Skeleton width={320} height={20} style={{ marginBottom: '1rem' }} />
            <Skeleton width={140} height={44} style={{ borderRadius: '8px' }} />
          </div>
          <Skeleton width={120} height={120} style={{ borderRadius: '50%' }} />
        </div>
      </SkeletonTheme>
    </div>
  );
};

export default AdListingBannerSkeleton;
