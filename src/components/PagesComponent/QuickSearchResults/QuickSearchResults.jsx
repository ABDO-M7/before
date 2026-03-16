'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSearch, setPendingQuickSearchFilters } from '@/redux/reuducer/searchSlice';
import { quickSearchesApi } from '@/utils/api';
import Layout from '@/components/Layout/Layout';
import Products from '@/components/PagesComponent/Products/Products';
import Loader from '@/components/Loader/Loader';
import { t } from "@/utils"


/** Safely decode slug for display/search (handles Arabic and other Unicode). */
const decodeSlug = (s) => {
  if (!s || typeof s !== 'string') return s;
  try {
    if (/^[0-9A-Fa-f]+%[0-9A-Fa-f]{2}/.test(s)) {
      return decodeURIComponent('%' + s);
    }
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/**
 * Fetches quick-searches?slug={slug}, increments clicks, applies filters to Redux, and renders Products.
 * If slug does not exist as quick search: fallback to get-items with search=slug (treat as search term).
 */
const QuickSearchResults = ({ slug }) => {
  const dispatch = useDispatch();
  const [applied, setApplied] = useState(false);
  const [label, setLabel] = useState('');

  const displaySlug = decodeSlug(slug);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    const applySlugAsSearch = () => {
      const searchTerm = displaySlug.replace(/-/g, ' ');
      dispatch(setSearch(searchTerm));
      dispatch(setPendingQuickSearchFilters({
        search: searchTerm,
        category_slug: '',
        city: null,
        state: null,
        country: null,
        area_id: null,
        area: null,
        min_price: '',
        max_price: '',
        latitude: null,
        longitude: null,
        radius: null,
        posted_since: '',
        sort_by: '',
        custom_fields: {},
      }));
      setLabel(searchTerm);
      setApplied(true);
    };

    const fetchAndApply = async () => {
      try {
        // Pass decoded slug so API receives the actual string (Arabic/Unicode)
        const res = await quickSearchesApi.getQuickSearchBySlug(displaySlug);
        if (!mounted) return;
        if (res?.data?.error === true) {
          applySlugAsSearch();
          return;
        }
        const item = res?.data?.data;
        if (!item) {
          applySlugAsSearch();
          return;
        }

        const city = item?.city != null && item.city !== ''
          ? { name: item.city, name_ar: item?.city_ar ?? item.city }
          : null;
        const state = item?.state != null && item.state !== ''
          ? { name: item.state, name_ar: item?.state_ar ?? item.state }
          : null;
        const country = item?.country != null && item.country !== ''
          ? { name: item.country, name_ar: item?.country_ar ?? item.country }
          : null;
        const areaId = item?.area_id != null ? item.area_id : null;
        const area = areaId != null
          ? { id: Number(areaId), name: item?.area ?? '', name_ar: item?.area_ar ?? item?.area ?? '' }
          : null;

        dispatch(setSearch(item?.search ?? ''));
        dispatch(setPendingQuickSearchFilters({
          search: item?.search ?? '',
          category_slug: item?.category_slug ?? '',
          city,
          state,
          country,
          area_id: areaId,
          area,
          min_price: item?.min_price != null ? String(item.min_price) : '',
          max_price: item?.max_price != null ? String(item.max_price) : '',
          latitude: item?.latitude != null ? parseFloat(item.latitude) : null,
          longitude: item?.longitude != null ? parseFloat(item.longitude) : null,
          radius: item?.radius != null ? Number(item.radius) : null,
          posted_since: item?.posted_since ?? '',
          sort_by: item?.sort_by ?? '',
          custom_fields: item?.custom_fields && Object.keys(item.custom_fields).length > 0 ? item.custom_fields : {},
        }));
        setLabel(item?.label ?? displaySlug);
        setApplied(true);
      } catch (err) {
        if (mounted) applySlugAsSearch();
      }
    };
    fetchAndApply();
    return () => { mounted = false; };
  }, [slug, displaySlug, dispatch]);

  if (!applied) {
    return (
      <Layout>
        <Loader />
      </Layout>
    );
  }

  return (
    <Layout>
      <Products
        breadcrumbPath={[
          { name: t("allCategory"), slug: '/products' },  
          { name: label || displaySlug, slug: `/${slug}` },
        ]}
      />
    </Layout>
  );
};

export default QuickSearchResults;
