'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PlaceCard from '@/components/Cards/PlaceCard'
import { t } from '@/utils'
import { getPlacesApi } from '@/utils/api'
import NoData from '@/components/NoDataFound/NoDataFound'
import OurBlogCardSkeleton from '@/components/Skeleton/OurBlogCardSkeleton'
import '@/components/PagesComponent/AiTools/AiTools.css'

const Places = () => {
    const searchParams = useSearchParams()
    const stateSlug = useMemo(() => {
        const raw = searchParams.get('state')
        if (raw == null) return undefined
        const trimmed = raw.trim()
        return trimmed !== '' ? trimmed : undefined
    }, [searchParams.toString()])

    const [places, setPlaces] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false)

    const getPlacesData = useCallback(async (page = 1) => {
        if (page === 1) setIsLoading(true)
        else setIsLoadMoreLoading(true)

        try {
            const res = await getPlacesApi.getPlaces({
                page,
                limit: 12,
                hub: 'web',
                ...(stateSlug ? { state: stateSlug } : {}),
            })
            const newPlaces = res?.data?.data?.data || []
            if (page === 1) setPlaces(newPlaces)
            else setPlaces((prev) => [...prev, ...newPlaces])
            setLastPage(res?.data?.data?.last_page || 1)
            setCurrentPage(page)
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
            setIsLoadMoreLoading(false)
        }
    }, [stateSlug])

    useEffect(() => {
        getPlacesData(1)
    }, [getPlacesData])

    const handleLoadMore = () => {
        if (currentPage < lastPage) {
            getPlacesData(currentPage + 1)
        }
    }

    return (
        <section className='ai-tools-page'>
            <div className="hero-section">
                <div className="container">
                    <h1 className="hero-title">
                        {t('explore')} <span className="text-primary">{t('places')}</span>
                    </h1>
                    <p className="hero-desc">
                        {t('placesHeroDesc')}
                    </p>
                </div>
            </div>

            <div className='container'>
                <div className="page_content">
                    <div className="row blog_separator home_blogs_row">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, index) => (
                                    <div className="col-12 col-md-6 col-lg-3" key={index}>
                                        <OurBlogCardSkeleton />
                                    </div>
                                ))
                            ) : places && places.length > 0 ? (
                                <>
                                    {places.map((item, index) => (
                                        <div className="col-12 col-md-6 col-lg-3" key={item?.id ?? item?.slug ?? index}>
                                            <PlaceCard data={item} showLocation priority={index === 0} />
                                        </div>
                                    ))}
                                    {currentPage < lastPage && (
                                        <div className="col-12 loadMore">
                                            <button type="button" onClick={handleLoadMore} disabled={isLoadMoreLoading}>
                                                {isLoadMoreLoading ? <div className="loader"></div> : t('loadMore')}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <NoData name={t('places')} />
                            )}
                        </div>
                </div>
            </div>
        </section>
    )
}

export default Places
