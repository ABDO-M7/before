import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import OurBlogCardSkeleton from './OurBlogCardSkeleton';

/**
 * Shimmer for the home page "Our Blogs" row (header + 3 blog cards).
 * Used as dynamic import loading state and for consistent skeleton styling.
 */
const BlogsRowSkeleton = () => {
  return (
    <div className="container" style={{ minHeight: '350px' }}>
      <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0">
        <div className="pop_categ_mrg_btm w-100 d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <Skeleton width={160} height={28} />
          <Skeleton width={80} height={20} />
        </div>
      </SkeletonTheme>
      <div className="row product_card_card_gap home_blogs_row">
        {[1, 2, 3].map((key) => (
          <div className="col-12 col-lg-4" key={key}>
            <OurBlogCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogsRowSkeleton;
