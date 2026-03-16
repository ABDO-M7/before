'use client'
import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent"
import ProdcutHorizontalCard from "@/components/Cards/ProdcutHorizontalCard"
import ProductCard from "@/components/Cards/ProductCard"
import FilterCard from "@/components/ProductPageUI/FilterCard"
import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { IoCloseCircle, IoGrid } from "react-icons/io5"
import { CgArrowsExchangeAltV } from "react-icons/cg";
import { Select, MenuItem } from '@mui/material';
import { useDispatch, useSelector } from "react-redux"
import { t } from "@/utils"
import { SearchData, setSearch, pendingQuickSearchFiltersData, clearPendingQuickSearchFilters } from "@/redux/reuducer/searchSlice"
import { allItemApi } from "@/utils/api"
import ProductHorizontalCardSkeleton from "@/components/Skeleton/ProductHorizontalCardSkeleton"
import ProductCardSkeleton from "@/components/Skeleton/ProductCardSkeleton"
import NoData from "@/components/NoDataFound/NoDataFound";
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import Link from "next/link"
import { userSignUpData } from "@/redux/reuducer/authSlice"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
import { ViewCategory, setCategoryView } from "@/redux/reuducer/categorySlice"
import { getCityData } from "@/redux/reuducer/locationSlice"
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice"
import { categorySortBy, setCategorySortBy } from "@/redux/reuducer/filterSlice"
import ComponentErrorBoundary from '@/components/ErrorBoundary/ComponentErrorBoundary';



const Products = ({ breadcrumbPath: breadcrumbPathProp } = {}) => {
    const searchParams = useSearchParams()
    const { lat, long } = useSelector(getCityData)
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const dispatch = useDispatch()
    const search = useSelector(SearchData)
    const pendingQuickSearchFilters = useSelector(pendingQuickSearchFiltersData)
    const userData = useSelector(userSignUpData);
    const [IsLoading, setIsLoading] = useState(false)
    const [searchedData, setSearchedData] = useState([])
    const sortBy = useSelector(categorySortBy)
    const view = useSelector(ViewCategory)
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [selectedLocationKey, setSelectedLocationKey] = useState(['all_countries'])
    const [MinMaxPrice, setMinMaxPrice] = useState({
        min_price: '',
        max_price: '',
    })
    const [Country, setCountry] = useState('')
    const [State, setState] = useState('')
    const [City, setCity] = useState('')
    const [Area, setArea] = useState('')
    const [IsShowBudget, setIsShowBudget] = useState(false)
    const [DatePosted, setDatePosted] = useState('')
    const [IsFetchSingleCatItem, setIsFetchSingleCatItem] = useState(false)
    const [KmRange, setKmRange] = useState(0)
    const [IsShowKmRange, setIsShowKmRange] = useState(false)
    const [urlLat, setUrlLat] = useState(null)
    const [urlLng, setUrlLng] = useState(null)
    const [urlCustomFields, setUrlCustomFields] = useState(null)
    const [IsLoadMore, setIsLoadMore] = useState(false)
    const initialUrlParamsRef = useRef(null)

    const getProducts = async (page) => {
        let data = "";
        try {
            const params = { page, limit: 12 };
            const fromUrl = initialUrlParamsRef.current;
            if (fromUrl) {
                initialUrlParamsRef.current = null;
                if (fromUrl.category_slug) params.category_slug = fromUrl.category_slug;
                if (fromUrl.sort_by) params.sort_by = fromUrl.sort_by;
                if (fromUrl.min_price != null && fromUrl.min_price !== '') params.min_price = fromUrl.min_price;
                if (fromUrl.max_price != null && fromUrl.max_price !== '') params.max_price = fromUrl.max_price;
                if (fromUrl.posted_since) params.posted_since = fromUrl.posted_since;
                if (fromUrl.custom_fields && Object.keys(fromUrl.custom_fields).length > 0) params.custom_fields = fromUrl.custom_fields;
                if (fromUrl.latitude != null && fromUrl.longitude != null && fromUrl.radius != null) {
                    params.latitude = fromUrl.latitude;
                    params.longitude = fromUrl.longitude;
                    params.radius = fromUrl.radius;
                } else {
                    // Only one location: most specific first (area → city → state → country)
                    if (fromUrl.area_id != null) params.area_id = fromUrl.area_id;
                    else if (fromUrl.city) params.city = fromUrl.city;
                    else if (fromUrl.state) params.state = fromUrl.state;
                    else if (fromUrl.country) params.country = fromUrl.country;
                }
                if (fromUrl.search) params.search = fromUrl.search;
            } else {
                if (sortBy) params.sort_by = sortBy;
                if (MinMaxPrice?.min_price) params.min_price = MinMaxPrice?.min_price;
                if (MinMaxPrice?.max_price) params.max_price = MinMaxPrice?.max_price;
                if (DatePosted) params.posted_since = DatePosted;
                if (urlCustomFields && Object.keys(urlCustomFields).length > 0) params.custom_fields = urlCustomFields;
                if (IsShowKmRange) {
                    const useLat = urlLat != null ? urlLat : lat;
                    const useLong = urlLng != null ? urlLng : long;
                    params.latitude = useLat;
                    params.longitude = useLong;
                    params.radius = KmRange;
                } else {
                    // Only one location: most specific first (area → city → state → country)
                    const cityVal = typeof City === 'object' && City != null ? City?.name : City;
                    const stateVal = typeof State === 'object' && State != null ? State?.name : State;
                    const countryVal = typeof Country === 'object' && Country != null ? Country?.name : Country;
                    if (Area?.id) params.area_id = Area?.id;
                    else if (cityVal) params.city = cityVal;
                    else if (stateVal) params.state = stateVal;
                    else if (countryVal) params.country = countryVal;
                }
                if (search !== "") params.search = search;
            }
            if (page === 1) {
                setIsLoading(true);
            }
            const res = await allItemApi.getItems(params);
            data = res?.data;
            if (data.error !== true) {
                if (page > 1) {
                    setSearchedData([...searchedData, ...data?.data?.data]);
                } else {
                    setSearchedData(data?.data?.data);
                }
                setCurrentPage(data?.data?.current_page)
                setLastPage(data?.data?.last_page)
            } else {
                setIsLoading(false)
            }
        } catch (error) {
            console.log(error)
        }
        finally {
            setIsLoading(false);
            setIsLoadMore(false)
        }
    }
    // Default view

    const handleChange = (event) => {
        dispatch(setCategorySortBy(event.target.value))
    };

    const handleGridClick = (viewType) => {
        dispatch(setCategoryView(viewType))
    };

    useEffect(() => {
        // Skip initial fetch when pending quick search filters exist — they will be applied first,
        // then setIsFetchSingleCatItem will trigger this effect again with correct params.
        // Prevents two overlapping fetches (one wrong, one correct) where the wrong one can overwrite.
        if (pendingQuickSearchFilters) return
        getProducts(1)
    }, [search, sortBy, IsFetchSingleCatItem, pendingQuickSearchFilters])

    useEffect(() => {
        if (breadcrumbPathProp) {
            dispatch(setBreadcrumbPath(breadcrumbPathProp))
        } else {
            dispatch(setBreadcrumbPath([{ name: t('allCategories'), slug: '/products' }]))
        }
    }, [breadcrumbPathProp, dispatch])

    // Apply Quick Search filters from Redux (no URL) — same as filter box
    useEffect(() => {
        if (!pendingQuickSearchFilters) return
        const f = pendingQuickSearchFilters
        if (f.search != null) dispatch(setSearch(f.search))
        if (f.city != null) setCity(f.city)
        if (f.state != null) setState(f.state)
        if (f.country != null) setCountry(f.country)
        if (f.area != null) setArea(f.area)
        else if (f.area_id != null) setArea({ id: Number(f.area_id), name: f.area?.name ?? '', name_ar: f.area?.name_ar ?? '' })
        if (f.min_price != null || f.max_price != null) {
            setMinMaxPrice(prev => ({ ...prev, min_price: f.min_price ?? prev.min_price, max_price: f.max_price ?? prev.max_price }))
            const hasPrices = (f.min_price != null && f.min_price !== '') && (f.max_price != null && f.max_price !== '')
            setIsShowBudget(!!hasPrices)
        }
        if (f.posted_since != null) setDatePosted(f.posted_since)
        if (f.sort_by != null) dispatch(setCategorySortBy(f.sort_by))
        if (f.latitude != null) setUrlLat(String(f.latitude))
        if (f.longitude != null) setUrlLng(String(f.longitude))
        if (f.radius != null) { setKmRange(Number(f.radius)); setIsShowKmRange(true) }
        if (f.custom_fields != null && Object.keys(f.custom_fields).length > 0) {
            setUrlCustomFields(f.custom_fields)
        }
        initialUrlParamsRef.current = {
            search: f.search ?? '',
            category_slug: f.category_slug ?? '',
            city: f.city != null ? (typeof f.city === 'object' ? f.city?.name : f.city) : '',
            state: f.state != null ? (typeof f.state === 'object' ? f.state?.name : f.state) : '',
            country: f.country != null ? (typeof f.country === 'object' ? f.country?.name : f.country) : '',
            area_id: f.area_id != null ? f.area_id : null,
            min_price: f.min_price ?? '',
            max_price: f.max_price ?? '',
            posted_since: f.posted_since ?? '',
            sort_by: f.sort_by ?? '',
            latitude: f.latitude ?? null,
            longitude: f.longitude ?? null,
            radius: f.radius ?? null,
            custom_fields: f.custom_fields ?? {},
        }
        dispatch(clearPendingQuickSearchFilters())
        setIsFetchSingleCatItem((prev) => !prev)
    }, [pendingQuickSearchFilters, dispatch])

    // Apply URL params from Quick Search (or shared links) — same behaviour as filter box (AJAX, no stale state)
    const appliedUrlParams = useRef(false)
    useEffect(() => {
        if (appliedUrlParams.current) return
        const qSearch = searchParams.get('search')
        const qCity = searchParams.get('city')
        const qState = searchParams.get('state')
        const qCountry = searchParams.get('country')
        const qAreaId = searchParams.get('area_id')
        const qMinPrice = searchParams.get('min_price')
        const qMaxPrice = searchParams.get('max_price')
        const qPostedSince = searchParams.get('posted_since')
        const qSortBy = searchParams.get('sort_by')
        const qLat = searchParams.get('latitude')
        const qLng = searchParams.get('longitude')
        const qRadius = searchParams.get('radius')
        const qCustomFields = searchParams.get('custom_fields')
        const hasAny = qSearch != null || qCity != null || qState != null || qCountry != null || qAreaId != null ||
            qMinPrice != null || qMaxPrice != null || qPostedSince != null || qSortBy != null || qLat != null || qLng != null || qRadius != null || qCustomFields != null
        if (!hasAny) return
        appliedUrlParams.current = true
        if (qSearch != null) dispatch(setSearch(qSearch))
        if (qCity != null) setCity(qCity)
        if (qState != null) setState(qState)
        if (qCountry != null) setCountry(qCountry)
        if (qAreaId != null) setArea({ id: Number(qAreaId) })
        if (qMinPrice != null || qMaxPrice != null) {
            setMinMaxPrice(prev => ({ ...prev, min_price: qMinPrice ?? prev.min_price, max_price: qMaxPrice ?? prev.max_price }))
            const hasPrices = (qMinPrice != null && qMinPrice !== '') && (qMaxPrice != null && qMaxPrice !== '')
            setIsShowBudget(!!hasPrices)
        }
        if (qPostedSince != null) setDatePosted(qPostedSince)
        if (qSortBy != null) dispatch(setCategorySortBy(qSortBy))
        if (qLat != null) setUrlLat(qLat)
        if (qLng != null) setUrlLng(qLng)
        if (qRadius != null) { setKmRange(Number(qRadius)); setIsShowKmRange(true) }
        if (qCustomFields != null) {
            try { setUrlCustomFields(JSON.parse(decodeURIComponent(qCustomFields))) } catch (_) { /* ignore */ }
        }
        initialUrlParamsRef.current = {
            search: qSearch ?? '',
            city: qCity ?? '',
            state: qState ?? '',
            country: qCountry ?? '',
            area_id: qAreaId != null ? Number(qAreaId) : null,
            min_price: qMinPrice ?? '',
            max_price: qMaxPrice ?? '',
            posted_since: qPostedSince ?? '',
            sort_by: qSortBy ?? '',
            latitude: qLat != null ? parseFloat(qLat) : null,
            longitude: qLng != null ? parseFloat(qLng) : null,
            radius: qRadius != null ? Number(qRadius) : null,
            custom_fields: (() => {
                if (qCustomFields == null) return {}
                try { return JSON.parse(decodeURIComponent(qCustomFields)) } catch (_) { return {} }
            })(),
        }
        setIsFetchSingleCatItem((prev) => !prev)
    }, [searchParams, dispatch])


    const clearLocation = () => {
        setCountry('')
        setState('')
        setCity('')
        setArea('')
        setSelectedLocationKey(['all_countries'])
        setIsFetchSingleCatItem((prev) => !prev)
    }

    // Display location name in active language (name_ar when Arabic, else name) — same as SingleCategory
    const getLocationDisplayName = (val) => {
        if (val == null || val === '') return ''
        const isArabic = CurrentLanguage?.code === 'ar'
        if (typeof val === 'object') {
            const ar = (val.name_ar || val.title_ar || '').trim()
            const en = (val.name || val.title || val.name_ar || val.title_ar || '').trim()
            return isArabic && ar ? ar : (en || ar)
        }
        return String(val)
    }
    const locationDisplayName = getLocationDisplayName(Area) || getLocationDisplayName(City) || getLocationDisplayName(State) || getLocationDisplayName(Country)

    const clearBudget = () => {
        setIsShowBudget(false)
        setMinMaxPrice({
            min_price: '',
            max_price: '',
        })
        setIsFetchSingleCatItem((prev) => !prev)
    }

    const clearDatePosted = () => {
        setDatePosted('');
        setIsFetchSingleCatItem((prev) => !prev)
    }

    const clearAll = () => {
        setSelectedLocationKey(['all_countries']);
        setCountry('');
        setState('');
        setCity('');
        setArea('')
        setMinMaxPrice({
            min_price: '',
            max_price: '',
        });
        setIsShowBudget(false);
        setIsShowKmRange(false);
        setDatePosted('');
        setKmRange(0);
        setUrlLat(null);
        setUrlLng(null);
        setUrlCustomFields(null);
        dispatch(setSearch(''));
        setIsFetchSingleCatItem((prev) => !prev);
    };

    const clearSearch = () => {
        dispatch(setSearch(''));
        setIsFetchSingleCatItem((prev) => !prev);
    };

    const postedSince = DatePosted === 'all-time' ? t('allTime') :
        DatePosted === 'today' ? t('today') :
            DatePosted === 'within-1-week' ? t('within1Week') :
                DatePosted === 'within-2-week' ? t('within2Weeks') :
                    DatePosted === 'within-1-month' ? t('within1Month') :
                        DatePosted === 'within-3-month' ? t('within3Months') : '';

    const hasValidBudget = (MinMaxPrice?.min_price !== '' && MinMaxPrice?.min_price != null) && (MinMaxPrice?.max_price !== '' && MinMaxPrice?.max_price != null)

    const isClearAll = (selectedLocationKey.length === 0 || selectedLocationKey.includes('all_countries')) && !IsShowBudget && DatePosted === '' && !IsShowKmRange && !search

    const handleLike = (id) => {
        const updatedItems = searchedData.map((item) => {
            if (item.id === id) {
                return { ...item, is_liked: !item.is_liked };
            }
            return item;
        });
        setSearchedData(updatedItems);
    }

    const handleLoadMore = () => {
        setIsLoadMore(true)
        getProducts(currentPage + 1); // Pass current sorting option
    };

    // Sorting the searchedData to prioritize items with is_feature set to true
    // const sortedSearchedData = searchedData?.sort((a, b) => b.is_feature - a.is_feature);

    const clearKmRange = () => {
        setKmRange(0)
        setIsShowKmRange(false)
        setSelectedLocationKey(['all_countries'])
        setIsFetchSingleCatItem((prev) => !prev)
    }

    return (
        <>
           <BreadcrumbComponent />
            <section className='all_products_page'>
                <div className="container">
                    <div className="all_products_page_main_content">
                        {/* <div className="heading">
                            <h3>{search}</h3>
                        </div> */}
                        <div className="row" id='main_row'>
                            <div className="col-12 col-md-6 col-lg-3" id='filter_sec'>
                                <FilterCard setMinMaxPrice={setMinMaxPrice} setIsFetchSingleCatItem={setIsFetchSingleCatItem} setCountry={setCountry} setState={setState} setCity={setCity} setArea={setArea} selectedLocationKey={selectedLocationKey} setSelectedLocationKey={setSelectedLocationKey} setIsShowBudget={setIsShowBudget} DatePosted={DatePosted} setDatePosted={setDatePosted} setKmRange={setKmRange} setIsShowKmRange={setIsShowKmRange} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-9" id='listing_sec'>
                                <div className="sortby_header">
                                    <div className="sortby_dropdown">
                                        <span>
                                            <CgArrowsExchangeAltV size={25} /> {t('sortBy')}{' '}
                                        </span>
                                        <Select
                                            value={sortBy || 'new-to-old'}
                                            onChange={handleChange}
                                            variant="outlined"
                                        >

                                            <MenuItem value="new-to-old">{t('newestToOldest')}</MenuItem>
                                            <MenuItem value="old-to-new">{t('oldestToNewest')}</MenuItem>
                                            <MenuItem value="price-high-to-low">{t('priceHighToLow')}</MenuItem>
                                            <MenuItem value="price-low-to-high">{t('priceLowToHigh')}</MenuItem>
                                            <MenuItem value="popular_items">{t('popular')}</MenuItem>
                                        </Select>
                                    </div>
                                    <div className="gird_buttons">
                                        <button
                                            className={view === 'list' ? 'active' : 'deactive'}
                                            onClick={() => handleGridClick('list')}
                                        >
                                            <ViewStreamIcon size={24} />
                                        </button>
                                        <button
                                            className={view === 'grid' ? 'active' : 'deactive'}
                                            onClick={() => handleGridClick('grid')}
                                        >
                                            <IoGrid size={24} />
                                        </button>
                                    </div>
                                </div>
                                <div className="filter_header">
                                    <div className="filterList">
                                        {
                                            search &&
                                            <div className="filter_item">
                                                <span>{t('search') || 'Search'}: {search}</span>
                                                <button onClick={clearSearch}>
                                                    <IoCloseCircle size={24} />
                                                </button>
                                            </div>
                                        }
                                        {
                                            (Country || State || City || Area) &&
                                            <div className="filter_item">
                                                <span>{t('location')}: {locationDisplayName}</span>
                                                <button onClick={clearLocation}>
                                                    <IoCloseCircle size={24} />
                                                </button>
                                            </div>
                                        }

                                        {
                                            IsShowBudget && hasValidBudget && (
                                                <div className="filter_item">
                                                    <span>{t('budget')}: {MinMaxPrice.min_price}-{MinMaxPrice.max_price}</span>
                                                    <button onClick={clearBudget} className="budget_btn">
                                                        <IoCloseCircle size={24} />
                                                    </button>
                                                </div>
                                            )
                                        }
                                        {
                                            DatePosted &&
                                            <div className="filter_item">
                                                <span>{postedSince}</span>
                                                <button onClick={clearDatePosted}>
                                                    <IoCloseCircle size={24} />
                                                </button>
                                            </div>
                                        }
                                        {
                                            IsShowKmRange &&
                                            <div className="filter_item">
                                                <span>{t("nearByKmRange")} : {KmRange} {t("km")}</span>
                                                <button onClick={clearKmRange}>
                                                    <IoCloseCircle size={24} />
                                                </button>
                                            </div>
                                        }

                                    </div>

                                    {
                                        !isClearAll &&
                                        <div className="removeAll">
                                            <button onClick={clearAll}>{t('clearAll')}</button>
                                        </div>
                                    }

                                </div>
                                <div className="listing_items">
                                    {/* ✅ Error Boundary - Prevents product listing errors from crashing page */}
                                    <ComponentErrorBoundary componentName="ProductListing">
                                        {
                                            IsLoading && searchedData.length === 0 ? (
                                                <div className={`row ${view === 'grid' ? 'row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 row-cols-xxl-3 product_card_card_gap' : ''}`}>
                                                    {Array.from({ length: view === 'list' ? 10 : 12 }).map((_, index) => (
                                                        view === "list" ? (
                                                            <div className="col-12" key={index}>
                                                                <ProductHorizontalCardSkeleton />
                                                            </div>
                                                        ) : (
                                                            <div className="col-12 col-md-6 col-lg-4 col-xxl-4" key={index}>
                                                                <ProductCardSkeleton />
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            ) : searchedData && searchedData.length > 0 ? (
                                                <>
                                                    <div className={`row ${view === 'grid' ? 'row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 row-cols-xxl-3 product_card_card_gap' : ''}`}>
                                                        {searchedData?.map((item, index) => (
                                                            view === "list" ? (
                                                                <div className="col-12" key={item.id || index}>
                                                                    <Link href={userData?.id === item?.user_id ? `/my-listing/${encodeURIComponent(item?.slug || '')}` : `/product-details/${encodeURIComponent(item?.slug || '')}`} prefetch={false} target="_blank">
                                                                        <ProdcutHorizontalCard data={item} handleLike={handleLike} />
                                                                    </Link>
                                                                </div>
                                                            ) : (
                                                                <div className="col-12 col-md-6 col-lg-4 col-xxl-4" key={item.id || index}>
                                                                    <ComponentErrorBoundary componentName="ProductCard">
                                                                        <ProductCard data={item} handleLike={handleLike} priority={index === 0} />
                                                                    </ComponentErrorBoundary>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                    {IsLoadMore ? (
                                                        <div className="loader adListingLoader"></div>
                                                    ) : (
                                                        currentPage < lastPage && searchedData.length > 0 && (
                                                            <div className="loadMore">
                                                                <button onClick={handleLoadMore}>{t('loadMore')}</button>
                                                            </div>
                                                        )
                                                    )}
                                                </>
                                            ) : (
                                                <NoData name={t('ads')} />
                                            )
                                        }
                                    </ComponentErrorBoundary>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Products