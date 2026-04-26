'use client'
import "@/styles/feat-spinner.css";
import { t } from '@/utils'
import { createFeaturedItemApi } from '@/utils/api'
import { Modal } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from "@/utils/toast";

const NoPackageModal = ({ IsNoPackageModal, OnHide, IsGranted, item_id }) => {

    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const createFeaturedAd = async () => {
        setIsSubmitting(true)
        try {
            const res = await createFeaturedItemApi.createFeaturedItem({ item_id, positions: 'home_screen' })
            if (res?.data?.error === false) {
                toast.success(t('featuredAdCreated'))
            }
            else {
                toast.error(res?.data?.message)
            }
            OnHide()
            router.push('/ads')
        } catch (error) {
            console.log(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (

        <Modal
            centered
            open={IsNoPackageModal}
            colorIconHover='transparent'
            onCancel={OnHide}
            footer={null}
            closeIcon={null}
            className='nopackage_modal'
            zIndex={1100}
            styles={{ wrapper: { zIndex: 1100 } }}
        >
            {
                IsGranted ?
                    <div className='nopackage'>
                        <div className='nopackage_content'>
                            <h2>{t('createFeaturedAd')}</h2>
                            <p style={{
                                background: 'linear-gradient(135deg, #f0fafc, #e6f7ff)',
                                // border: '1px solid #b6e8f5',
                                borderLeft: '4px solid var(--primary-color, #00ABBF)',
                                borderRight: '4px solid var(--primary-color, #00ABBF)',
                                borderRadius: '8px',
                                // padding: '12px 16px',
                                color: '#1a6a7a',
                                fontWeight: 600,
                                fontSize: '14px',
                                // lineHeight: 1.6,
                                margin: '8px 0 0',
                            }}>{t('youWantToCreateFeaturedAd')}</p>
                        </div>
                        <div className='nopackage_btn_cont'>
                            <button className='subscribe' onClick={createFeaturedAd} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                                {isSubmitting ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="feat_btn_spinner" />
                                        {t('loading')}
                                    </span>
                                ) : t('confirm')}
                            </button>
                            <button className='cancel' onClick={OnHide}>{t('cancel')}</button>
                            
                        </div>
                    </div>
                    :
                    <div className='nopackage'>
                        <div className='nopackage_content'>
                            <h2>{t('noPackage')}</h2>
                            <p>{t('pleaseSubscribes')}</p>
                        </div>
                        <div className='nopackage_btn_cont'>
                            <button className='cancel' onClick={OnHide}>{t('cancel')}</button>
                            <Link href='/subscription' className='subscribe'>{t('subscribe')}</Link>
                        </div>
                    </div>
            }
        </Modal>
    )
}

export default NoPackageModal