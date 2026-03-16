'use client'
import OurBlogCard from '../Cards/OurBlogCard';
import PopularPosts from '../OurBlogPage/PopularPosts';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { getBlogsApi } from '@/utils/api';
import OurBlogCardSkeleton from '../Skeleton/OurBlogCardSkeleton';
import PopularPostsSkeleton from '../Skeleton/PopularPostsSkeleton';
import { t, useIsRtl } from '@/utils';


const OurBlogs = () => {
  const [Blogs, setBlogs] = useState([])
  const [popularBlogs, setPopularBlogs] = useState([])
  const [IsLoading, setIsLoading] = useState(true)
  const [isPopularLoading, setIsPopularLoading] = useState(true)
  const isRtl = useIsRtl();

  const getBlogsData = async () => {
    try {
      setIsLoading(true)
      const res = await getBlogsApi.getBlogs({ hub: 'web', limit: 3, sort_by: 'new-to-old' })
      setBlogs(res?.data?.data?.data ?? [])
      setIsLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  const getPopularBlogsData = async () => {
    try {
      setIsPopularLoading(true)
      const res = await getBlogsApi.getBlogs({ hub: 'web', sort_by: 'popular', limit: 1 })
      setPopularBlogs(res?.data?.data?.data ?? [])
      setIsPopularLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getBlogsData()
    getPopularBlogsData()
  }, [])

  if (!IsLoading && (!Blogs || Blogs.length === 0)) {
    return null;
  }

  return (
    <div className="ourblogs_wrapper" id="ourBlogs">
      <div className="container main_padding">
        <div className="pop_categ_mrg_btm w-100 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="pop_cat_head text-dark mb-0">
            <i className="fas fa-newspaper me-2" aria-hidden />
            {t('ourBlogs')}
          </h4>
          <Link href="/blogs" className="view_all_link" prefetch={false}>
            <span className="view_all">{t('viewAll')}</span>
            <span className="view_all_arrow" aria-hidden>
              {isRtl ? <FaArrowLeft size={14} /> : <FaArrowRight size={14} />}
            </span>
          </Link>
        </div>

        <div className="row product_card_card_gap home_blogs_row">
          <div className="col-12 col-lg-9">
            <div className="row product_card_card_gap">
              {IsLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                  <div className="col-12 col-lg-4" key={index}>
                    <OurBlogCardSkeleton />
                  </div>
                ))
                : Blogs.map((item, index) => (
                  <div className="col-12 col-lg-4" key={item?.id ?? item?.slug ?? index}>
                    <OurBlogCard data={item} showMeta />
                  </div>
                ))}
            </div>
          </div>
          <div className="col-12 col-lg-3">
            {isPopularLoading ? (
              <PopularPostsSkeleton />
            ) : (
              popularBlogs?.length > 0 && <PopularPosts data={popularBlogs} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OurBlogs
