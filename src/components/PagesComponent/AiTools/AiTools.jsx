'use client'
import React, { useEffect, useState } from 'react'
// import BreadcrumbComponent from '@/components/Breadcrumb/BreadcrumbComponent'
import AiToolCard from '@/components/Cards/AiToolCard'
import { t } from '@/utils'
import { getAiToolsApi } from '@/utils/api'
import NoData from '@/components/NoDataFound/NoDataFound'
import AiToolCardSkeleton from '@/components/Skeleton/AiToolCardSkeleton'

const AiTools = () => {
    const [tools, setTools] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false)

    const getToolsData = async (page = 1) => {
        if (page === 1) setIsLoading(true)
        else setIsLoadMoreLoading(true)

        try {
            const res = await getAiToolsApi.getAiTools({
                page: page,
                limit: 12, // Increased limit for the new grid
                hub: 'web'
            })

            const newTools = res?.data?.data?.data || []
            if (page === 1) setTools(newTools)
            else setTools(prev => [...prev, ...newTools])

            setLastPage(res?.data?.data?.last_page || 1)
            setCurrentPage(page)
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
            setIsLoadMoreLoading(false)
        }
    }

    useEffect(() => {
        getToolsData(1)
    }, [])

    const handleLoadMore = () => {
        if (currentPage < lastPage) {
            getToolsData(currentPage + 1)
        }
    }

    return (
        <section className='ai-tools-page'>
            {/* <BreadcrumbComponent title2={t("aiTools")} /> */}
            
            {/* Hero Section */}
            <div className="hero-section">
                <div className="container">
                    <h1 className="hero-title">
                        {t('explore')} <span className="text-primary">{t('futureTools')}</span>
                    </h1>
                    <p className="hero-desc">
                        {t('aiToolsDesc')}
                    </p>
                </div>
            </div>

            <div className='container'>
                <div className="tools-grid">
                    {isLoading ? (
                        Array.from({ length: 12 }).map((_, index) => (
                            <AiToolCardSkeleton key={index} />
                        ))
                    ) : (
                        tools && tools.length > 0 ? (
                            <>
                                {tools.map((item, index) => (
                                    <AiToolCard key={index} data={item} />
                                ))}
                                
                                {/* Coming Soon Placeholder */}
                                <div className="tool-icon-card coming-soon">
                                    <div className="icon-box">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h3 className="tool-card-title">{t('comingSoon')}</h3>
                                </div>
                            </>
                        ) : (
                            <div className="col-12">
                                <NoData name={t('aiTool')} />
                            </div>
                        )
                    )}
                </div>

                {currentPage < lastPage && (
                    <div className="loadMore mb-5">
                        <button onClick={handleLoadMore} disabled={isLoadMoreLoading}>
                            {isLoadMoreLoading ? <div className="loader"></div> : t('loadMore')}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default AiTools
