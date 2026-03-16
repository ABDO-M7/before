import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Shimmer skeleton for the AI Tools section on the home page.
 * Fixed 400px height to prevent layout shift (CLS).
 */
const AiToolsSkeleton = () => {
  return (
    <div className="container main_padding" style={{ minHeight: '600px' }}>
      <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0">
        <div className="row">
          <div className="col-12">
            <div className="single_blog border-0 p-0">
              <div className="blog_content p-0">
                <Skeleton width={280} height={32} style={{ marginBottom: '1rem' }} />
                <Skeleton
                  width="100%"
                  height={240}
                  style={{ borderRadius: '12px', marginBottom: '1.5rem' }}
                />
                <Skeleton count={3} style={{ marginTop: '0.5rem' }} />
                <Skeleton count={2} style={{ marginTop: '0.5rem' }} />
                <Skeleton count={1.5} style={{ marginTop: '0.5rem' }} />
              </div>
            </div>
          </div>
        </div>
      </SkeletonTheme>
    </div>
  );
};

export default AiToolsSkeleton;
