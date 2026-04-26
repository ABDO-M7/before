'use client'
import "./place-card.css";
import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight, FaLocationDot } from 'react-icons/fa6'
import { useSelector } from 'react-redux'
import { placeholderImage, t, getCompressedImage, normalizeImageUrl } from '@/utils'
import { store } from '@/redux/store'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice'

const PlaceCard = ({ data, showLocation = true, priority = false }) => {
    const currentLang = useSelector(CurrentLanguageData)
    const settings = store.getState()?.Settings?.data?.data
    const placeholderImageUrl = settings?.placeholder_image || '/assets/Transperant_Placeholder.png'

    const compressedImage = getCompressedImage(data, 'small', data?.image)
    const finalImage = (compressedImage && compressedImage !== data?.image) ? compressedImage : (data?.image || null)
    const imageSrc = finalImage ? normalizeImageUrl(finalImage) : placeholderImageUrl

    const isAr = currentLang?.code === 'ar'
    const stateName = isAr && data?.state?.name_ar ? data.state.name_ar : (data?.state?.name || '')
    const href = `/places/${encodeURIComponent(data?.slug || '')}`

    const rawExcerpt = data?.short_description || data?.description || ''
    const excerpt =
        typeof rawExcerpt === 'string'
            ? rawExcerpt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
            : ''

    return (
        <article className="place-card">
            <Link href={href} className="place-card__link" aria-label={data?.title ? `${data.title} — ${t('viewDetails')}` : t('viewDetails')}>
                <div className="place-card__media">
                    <Image
                        priority={priority}
                        fetchPriority={priority ? 'high' : 'auto'}
                        loading={priority ? undefined : 'lazy'}
                        src={imageSrc}
                        alt={data?.title || ''}
                        fill
                        sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, 25vw"
                        className="place-card__img"
                        onErrorCapture={placeholderImage}
                    />
                    <div className="place-card__media-shade" aria-hidden />
                    {showLocation && stateName ? (
                        <span className="place-card__state">
                            <FaLocationDot className="place-card__state-icon" aria-hidden />
                            {stateName}
                        </span>
                    ) : null}
                </div>
                <div className="place-card__body">
                    <h3 className="place-card__title">{data?.title}</h3>
                    {excerpt ? (
                        <p className="place-card__excerpt">{excerpt}</p>
                    ) : null}
                    <span className="place-card__cta">
                        <span>{t('viewDetails')}</span>
                        <FaArrowRight className="place-card__arrow" size={18} aria-hidden />
                    </span>
                </div>
            </Link>
        </article>
    )
}

export default PlaceCard
