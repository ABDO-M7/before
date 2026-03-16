'use client'
import Image from 'next/image'
import Arrow from "../../../public/assets/Arrow.svg"
import { placeholderImage, t } from '@/utils'
import { settingsData } from '@/redux/reuducer/settingSlice'
import { useSelector } from 'react-redux'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice'

const WorkProcess = () => {

    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const CurrentLanguage = useSelector(CurrentLanguageData)

    return (
        <section id='work_process'>
            <div className="container">
                <div className="main_work">
                    {/* <div className="main_header">
                        <span>
                            {t('how')} {""} {settings?.company_name} {""} {t('getsYouResults?')}
                        </span>
                    </div> */}
                    <span className='title_desc'>
                        {t('unravelingThe')} {""} {""} {t('workProcess')} {settings?.company_name} 
                    </span>
                </div>
                <div className="main_process">
                    <div className="row">
                        <div className="col-sm-12 col-md-6 col-lg-3">
                            <div className="main_content">
                                <span className='count'>
                                    1
                                </span>
                                <span className='count_title'>
                                    {t('listingMadeEasy')}
                                </span>
                                <span className='count_decs'>{t('createAds')}</span>
                            </div>
                        </div>
                        <div className="col-sm-12 col-md-6 col-lg-3">
                            <div className="main_content">
                                <span className='count'>
                                    2
                                </span>
                                <span className='count_title'>
                                    {t('instantReach')}
                                </span>
                                <span className='count_decs'>{t('connectVastAudience')}</span>
                            </div>
                        </div>
                        <div className="col-sm-12 col-md-6 col-lg-3">
                            <div className="main_content">
                                <span className='count'>
                                    3
                                </span>
                                <span className='count_title'>
                                    {t('effortlessConnection')}
                                </span>
                                <span className='count_decs'>{t('interactSecureMessaging')}</span>
                            </div>
                        </div>
                        <div className="col-sm-12 col-md-6 col-lg-3">
                            <div className="main_content">
                                <span className='count'>
                                    4
                                </span>
                                <span className='count_title'>
                                    {t('enjoyBenefits')}
                                </span>
                                <span className='count_decs'>{t('reapRewards')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="arrow_div">
                        <Image loading="lazy" src={Arrow} alt='arrow' width={40} height={40} className='first_arrow' onErrorCapture={placeholderImage} style={{ height: 'auto', width: 'auto' }} />
                        <Image loading="lazy" src={Arrow} alt='arrow' width={40} height={40} className='sec_arrow' onErrorCapture={placeholderImage} style={{ height: 'auto', width: 'auto' }} />
                        <Image loading="lazy" src={Arrow} alt='arrow' width={40} height={40} className='third_arrow' onErrorCapture={placeholderImage} style={{ height: 'auto', width: 'auto' }} />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default WorkProcess
