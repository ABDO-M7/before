'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { t, useIsRtl } from '@/utils';
import { getBlogsApi } from '@/utils/api';
import OurBlogCard from '@/components/Cards/OurBlogCard';
import OurBlogCardSkeleton from '@/components/Skeleton/OurBlogCardSkeleton';
import ComponentErrorBoundary from '@/components/ErrorBoundary/ComponentErrorBoundary';

const HomeBlogsRow = ({ initialBlogsData }) => {
  const isRtl = useIsRtl();
  const hasInitial = Array.isArray(initialBlogsData) && initialBlogsData.length > 0;
  const [blogs, setBlogs] = useState(hasInitial ? initialBlogsData : []);
  const [isLoading, setIsLoading] = useState(!hasInitial);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasInitial) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        const res = await getBlogsApi.getBlogs({
          sort_by: 'new-to-old',
          limit: 3,
          hub: 'web',
        });
        const list = res?.data?.data?.data ?? [];
        setBlogs(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('HomeBlogsRow fetch error:', error);
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, [hasInitial]);

  // ✅ CLS Fix: Return empty fragment instead of null to avoid layout collapse
  if (!isLoading && (!blogs || blogs.length === 0)) {
    return <></>;
  }

  return (
    <div className="container">
      <div className="pop_categ_mrg_btm w-100 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h2 className="pop_cat_head text-dark mb-0">
          <i className="fas fa-newspaper me-2" aria-hidden />
          {t('ourBlogs')}
        </h2>
        <Link
          href="/blogs"
          className="view_all_link"
          prefetch={false}
        >
          <span className="view_all">{t('viewAll')}</span>
          <span className="view_all_arrow" aria-hidden>
            {isRtl ? (
              <FaArrowLeft size={14} />
            ) : (
              <FaArrowRight size={14} />
            )}
          </span>
        </Link>
      </div>
      <div className="row product_card_card_gap home_blogs_row">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div className="col-12 col-lg-4" key={index}>
                <OurBlogCardSkeleton />
              </div>
            ))
          : blogs.map((item, index) => (
              <div className="col-12 col-lg-4" key={item?.id ?? item?.slug ?? index}>
                <OurBlogCard data={item} showMeta />
              </div>
            ))}
      </div>
    </div>
  );
};

const HomeBlogsRowWithBoundary = (props) => (
  <ComponentErrorBoundary componentName="HomeBlogsRow">
    <HomeBlogsRow {...props} />
  </ComponentErrorBoundary>
);

export default HomeBlogsRowWithBoundary;
