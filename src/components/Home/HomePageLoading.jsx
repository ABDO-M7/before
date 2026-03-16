'use client';

import React, { useState, useEffect } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Bubble loader: faded circles that move (pulse + slight motion).
 * Shown first, then transitions to shimmer. RTL from first paint.
 */
const BubbleLoader = () => (
  <div className="home-loading-bubbles" role="status" aria-label="Loading">
    <span />
    <span />
    <span />
  </div>
);

/**
 * Full-page loading: (1) Bubble loader first, (2) then shimmer.
 * Wrapped in dir="rtl" from first paint so no LTR→RTL flash.
 */
const HomePageLoading = () => {
  const [showBubbles, setShowBubbles] = useState(true);

  // RTL from first paint: set document dir as soon as this component mounts
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowBubbles(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div dir="rtl" className="home-page-loading-root" style={{ minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .home-page-loading-root { text-align: right; }
        .home-loading-bubbles {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          min-height: 60vh;
          padding: 2rem;
        }
        .home-loading-bubbles span {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--primary-color, #0d6efd);
          opacity: 0.4;
          animation: home-loading-bubble 1.4s ease-in-out infinite both;
        }
        .home-loading-bubbles span:nth-child(1) { animation-delay: -0.32s; }
        .home-loading-bubbles span:nth-child(2) { animation-delay: -0.16s; }
        .home-loading-bubbles span:nth-child(3) { animation-delay: 0s; }
        @keyframes home-loading-bubble {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 0.9; }
        }
      `}} />

      {showBubbles ? (
        <BubbleLoader />
      ) : (
        <SkeletonTheme baseColor="#e8e8e8" highlightColor="#f5f5f5">
          <div className="container main_padding" style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
            <Skeleton width={120} height={24} />
          </div>
          <div className="container main_padding" style={{ minHeight: '400px' }}>
            <div className="row">
              <div className="col-12">
                <Skeleton width={280} height={32} style={{ marginBottom: '1rem' }} />
                <Skeleton
                  width="100%"
                  height={240}
                  style={{ borderRadius: '12px', marginBottom: '1.5rem' }}
                />
                <Skeleton count={3} style={{ marginTop: '0.5rem' }} />
                <Skeleton count={2} style={{ marginTop: '0.5rem' }} />
              </div>
            </div>
          </div>
          <div className="container" style={{ minHeight: '180px', marginTop: '1rem' }}>
            <div className="row">
              <div className="col-12">
                <Skeleton width={180} height={28} style={{ marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {Array.from({ length: 8 }, (_, i) => (
                    <Skeleton key={i} height={72} width={72} style={{ borderRadius: '50%' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="container main_padding" style={{ minHeight: '320px', marginTop: '2rem' }}>
            <Skeleton width={200} height={28} style={{ marginBottom: '1rem' }} />
            <div className="row" style={{ gap: '1rem', justifyContent: 'flex-end', flexDirection: 'row-reverse' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ flex: '1 1 160px', minWidth: '140px' }}>
                  <Skeleton height={180} style={{ borderRadius: '12px', marginBottom: '0.5rem' }} />
                  <Skeleton count={1.5} />
                </div>
              ))}
            </div>
          </div>
        </SkeletonTheme>
      )}
    </div>
  );
};

export default HomePageLoading;
