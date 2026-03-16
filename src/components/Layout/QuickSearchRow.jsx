'use client';

import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setSearch, setPendingQuickSearchFilters } from '@/redux/reuducer/searchSlice';
import { t } from '@/utils';
import { HiFire } from 'react-icons/hi';

const QuickSearchRow = ({ mobile = false, items: itemsProp = null }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const items = itemsProp ?? [];
  const loading = itemsProp === null;

  const handleClick = (item) => {
    // If slug exists: navigate to /{slug} — API will fetch full data and increment clicks
    if (item?.slug) {
      router.push(`/${encodeURIComponent(item.slug)}`);
      return;
    }

    // Fallback for items without slug: use Redux + direct navigate (legacy) 
    const search = item?.search || '';
    const categorySlug = item?.category_slug || '';
    const minPrice = item?.min_price != null ? String(item.min_price) : '';
    const maxPrice = item?.max_price != null ? String(item.max_price) : '';
    const latitude = item?.latitude != null ? parseFloat(item.latitude) : null;
    const longitude = item?.longitude != null ? parseFloat(item.longitude) : null;
    const radius = item?.radius != null ? Number(item.radius) : null;
    const postedSince = item?.posted_since || '';
    const sortBy = item?.sort_by || '';
    const customFields = item?.custom_fields && Object.keys(item.custom_fields).length > 0
      ? item.custom_fields
      : {};

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

    dispatch(setSearch(search));
    dispatch(setPendingQuickSearchFilters({
      search,
      city,
      state,
      country,
      area_id: areaId,
      area,
      min_price: minPrice,
      max_price: maxPrice,
      latitude,
      longitude,
      radius,
      posted_since: postedSince,
      sort_by: sortBy,
      custom_fields: customFields,
    }));
    if (categorySlug) {
      router.push(`/category/${categorySlug}`);
    } else {
      router.push('/products');
    }
  };

  // const isHome = pathname === '/' || pathname === '';
  // if (!isHome || loading || !items.length) return null;
  if (loading || !items.length) return null;

  return (
    <div
      className={`quick-search-row ${mobile ? 'quick-search-row--mobile' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: mobile ? 'nowrap' : 'wrap',
        gap: mobile ? '8px' : '10px',
        marginTop: '10px',
        padding: '8px 0',
        overflow: mobile ? 'hidden' : 'visible',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#06aabd',
          fontSize: mobile ? '12px' : '13px',
          fontWeight: '600',
          flexShrink: 0,
        }}
      >
        <HiFire size={mobile ? 14 : 16} style={{ color: '#f59e0b' }} aria-hidden />
        {t('quickSearch') || 'بحث سريع:'}
      </span>
      <div
        style={{
          display: 'flex',
          flexWrap: mobile ? 'nowrap' : 'wrap',
          gap: '8px',
          alignItems: 'center',
          flex: mobile ? '1 1 0' : undefined,
          minWidth: mobile ? 0 : undefined,
          overflowX: mobile ? 'auto' : 'visible',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: mobile ? 'none' : 'auto',
          msOverflowStyle: mobile ? 'none' : 'auto',
          paddingBottom: mobile ? '4px' : 0,
        }}
        className={mobile ? 'quick-search-row__scroll' : ''}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item)}
            style={{
              padding: mobile ? '6px 12px' : '6px 14px',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              color: '#374151',
              fontSize: mobile ? '12px' : '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0fdfd';
              e.currentTarget.style.borderColor = '#06aabd';
              e.currentTarget.style.color = '#06aabd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#374151';
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {mobile && (
        <style dangerouslySetInnerHTML={{
          __html: '.quick-search-row__scroll::-webkit-scrollbar { display: none; }',
        }}
        />
      )}
    </div>
  );
};

export default QuickSearchRow;
