"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
// ✅ swiper/css is loaded lazily with the component chunk — no top-level blocking import
import { RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";
import { t, useIsRtl } from "@/utils";
import { categoryApi } from "@/utils/api";
import { useDispatch, useSelector } from "react-redux";
import { CurrentPage, setCatCurrentPage, setCatLastPage, setCateData } from "@/redux/reuducer/categorySlice";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import PopularCategoriesSkeleton from "../Skeleton/PopularCategoriesSkeleton";
import PopularCategory from "./PopularCategory";

const PopularCategories = ({ initialCategoriesData, showTitle = true }) => {

  const dispatch = useDispatch()
  const swiperRef = useRef()
  const isRtl = useIsRtl();
  const hasInitialData = initialCategoriesData?.list && Array.isArray(initialCategoriesData.list) && initialCategoriesData.list.length > 0;
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [cateData, setCatData] = useState(() => {
    if (!hasInitialData) return [];
    const list = initialCategoriesData.list;
    return Array.isArray(list) ? list : Object.values(list).flat();
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(initialCategoriesData?.last_page ?? 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cachedData, setCachedData] = useState(() => {
    if (!hasInitialData) return {};
    const list = initialCategoriesData.list;
    return { 1: Array.isArray(list) ? list : Object.values(list).flat() };
  });
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const CurrentLanguage = useSelector(CurrentLanguageData)
  const catCurrentPage = useSelector(CurrentPage)
  const [prevLang, setPrevLang] = useState(CurrentLanguage)
  const lastFetchedLangIdRef = useRef(null);

  // this api call only in pop cate swiper 
  const getCategoriesData = (async (page) => {
    if (prevLang?.id !== CurrentLanguage?.id) {
      setIsLoadingMore(true);
      try {
        const response = await categoryApi.getCategory({ page: `${page}`, featured: '1' });
        const { data } = response.data;
        if (data && Array.isArray(data.data)) {
          setCachedData(prev => ({
            ...prev,
            [page]: data.data
          }));
          // ✅ Single setCatData call — duplicate was causing two re-renders
          setCatData(Object.values(data.data).flat());
          if (page > catCurrentPage) {
            dispatch(setCateData(data.data));
            dispatch(setCatCurrentPage(data?.current_page))
            dispatch(setCatLastPage(data?.last_page))
          }
          setLastPage(data.last_page);

        }
      } catch (error) {

        console.error("Error:", error);
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false);
      }
    } else {

      if (cachedData[page]) {
        setCatData(Object.values(cachedData).flat());
        return;
      }
      setIsLoadingMore(true);
      try {
        const response = await categoryApi.getCategory({ page: `${page}`, featured: '1' });
        const { data } = response.data;
        if (data && Array.isArray(data.data)) {
          setCachedData(prev => ({
            ...prev,
            [page]: data.data
          }));

          // ✅ Single setCatData call — duplicate was causing two re-renders
          setCatData(Object.values({ ...cachedData, [page]: data.data }).flat());

          if (page > catCurrentPage) {
            dispatch(setCateData([...cateData, ...data.data]));
            dispatch(setCatCurrentPage(data?.current_page))
            dispatch(setCatLastPage(data?.last_page))
          }
          setLastPage(data.last_page);
        }
      } catch (error) {
        console.error("Error:", error);

      } finally {
        setIsLoading(false)
        setIsLoadingMore(false);
      }
    }
  });

  // Sync server initial data to Redux only on initial load (same language). When language
  // has changed, do not overwrite with stale initial data and do not set lastFetchedLangIdRef,
  // so the effect below will call getCategoriesData(1) to refetch for the new language.
  useEffect(() => {
    if (!hasInitialData) return;
    const refLangId = lastFetchedLangIdRef.current;
    const currentLangId = CurrentLanguage?.id;
    if (refLangId != null && refLangId !== currentLangId) {
      return; // Language changed — let the fetch effect handle refetch; don't overwrite or set ref
    }
    const list = initialCategoriesData.list;
    const arr = Array.isArray(list) ? list : Object.values(list).flat();
    dispatch(setCateData(arr));
    dispatch(setCatCurrentPage(initialCategoriesData.current_page ?? 1));
    dispatch(setCatLastPage(initialCategoriesData.last_page ?? 1));
    lastFetchedLangIdRef.current = currentLangId;
  }, [hasInitialData, initialCategoriesData, CurrentLanguage?.id, dispatch]);

  useEffect(() => {
    if (lastFetchedLangIdRef.current === CurrentLanguage?.id) return;
    lastFetchedLangIdRef.current = CurrentLanguage?.id;
    getCategoriesData(1);
  }, [CurrentLanguage]);

  useEffect(() => {
    if (prevLang?.id !== CurrentLanguage?.id) {
      // Don't treat Redux rehydration as a language change: if we have initial data and
      // prevLang was never set to a real value yet, just sync prevLang and keep showing initial data.
      if (hasInitialData && (prevLang == null || prevLang?.id == null)) {
        setPrevLang(CurrentLanguage);
        return;
      }
      setPrevLang(CurrentLanguage);
      setCachedData({});
      setCatData([]);
      setCurrentPage(1);
      setLastPage(1);
      setIsLoading(true);
    }
  }, [CurrentLanguage, getCategoriesData, prevLang?.id, hasInitialData]);

  const handleNextPage = useCallback(() => {
    if (currentPage < lastPage) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getCategoriesData(nextPage);
    }
    if (swiperRef?.current) swiperRef?.current?.slideNext();
  }, [currentPage, lastPage, getCategoriesData]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      getCategoriesData(prevPage);
    }
    if (swiperRef?.current) swiperRef?.current?.slidePrev();
  }, [currentPage, getCategoriesData]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < lastPage && !isLoadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getCategoriesData(nextPage);
    }
  }, [currentPage, lastPage, isLoadingMore, getCategoriesData]);

  const handleSlideChange = useCallback((swiper) => {
    setIsEnd(swiper.isEnd);
    setIsBeginning(swiper.isBeginning);
    if (swiper.isEnd) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  const breakpoints = {
    0: { slidesPerView: 1 },
    320: { slidesPerView: 3 },
    400: { slidesPerView: 3 },
    576: { slidesPerView: 4 },
    768: { slidesPerView: 5 },
    992: { slidesPerView: 7 },
    1200: { slidesPerView: 8 },
    1400: { slidesPerView: 9 }
  };

  return (
    <div className="container main_padding" style={{ minHeight: isLoading || !cateData?.length ? '220px' : undefined }}>
      {isLoading ? (
        <PopularCategoriesSkeleton />
      ) : cateData?.length > 0 ? (
        <>
          <div className="row mrg_btm">
            <div className="col-12">
              <div className="pop_cat_header">
                {showTitle ? (
                  <h2 className="pop_cat_head text-dark">{t("popularCategories")}</h2>
                ) : (
                  <div aria-hidden="true" />
                )}

                <div className="pop_cat_arrow">
                  <button
                    className={`pop_cat_btns ${isBeginning && "PagArrowdisabled"
                      }`}
                    onClick={handlePrevPage}
                    aria-label={t("previous") || "Previous"}
                  >
                    <RiArrowLeftLine size={24} color="white" aria-hidden="true" />
                  </button>
                  <button
                    className={`pop_cat_btns ${isEnd && "PagArrowdisabled"}`}
                    onClick={handleNextPage}
                    aria-label={t("next") || "Next"}
                  >
                    <RiArrowRightLine size={24} color="white" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <Swiper
                dir={isRtl ? "rtl" : "ltr"}
                spaceBetween={30}
                slidesPerView={9}
                onSlideChange={handleSlideChange}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                  setIsEnd(swiper?.isEnd);
                  setIsBeginning(swiper?.isBeginning);
                }}
                breakpoints={breakpoints}
                className="popular_cat_slider"
                key={isRtl}
              >
                {cateData?.map((ele, index) => (
                  <SwiperSlide key={index}>
                    <PopularCategory data={ele} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </>
      ) : (
        <PopularCategoriesSkeleton />
      )}
    </div>
  );
};

export default PopularCategories;