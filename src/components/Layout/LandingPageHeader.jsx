'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { GiHamburgerMenu } from "react-icons/gi";
import dynamic from 'next/dynamic';
const Drawer = dynamic(() => import('antd').then(mod => mod.Drawer), { ssr: false });
import Link from 'next/link';
import { isEmptyObject, placeholderImage, t } from '@/utils';
import { getLanguageApi } from '@/utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { settingsData } from '@/redux/reuducer/settingSlice';
import { CurrentLanguageData, setCurrentLanguage } from '@/redux/reuducer/languageSlice';
import LanguageDropdown from '../HeaderDropdowns/LanguageDropdown';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const LandingPageHeader = () => {

    const dispatch = useDispatch();
    const router = useRouter();
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const [show, setShow] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const headerClassName = useMemo(() => {
        return `navbar navbar-expand-lg landing_header ${isScrolled ? 'landing_header--scrolled' : ''}`;
    }, [isScrolled]);


    const getLanguageData = async (language_code = settings?.default_language) => {
        try {
            const res = await getLanguageApi.getLanguage({ language_code, type: 'web' });
            if (res?.data?.error === true) {
                toast.error(res?.data?.message)
            }
            else {
                if (show) {
                    setShow(false)
                }
                dispatch(setCurrentLanguage(res?.data?.data));

            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const code = CurrentLanguage?.code?.toLowerCase() || "ar";
        document.documentElement.lang = code;
        document.documentElement.dir = CurrentLanguage?.rtl ? "rtl" : "ltr";
    }, [CurrentLanguage]);

    // set default language if language not available in start

    const setDefaultLanguage = async () => {
        try {
            const language_code = settings?.default_language || 'ar'
            const res = await getLanguageApi.getLanguage({ language_code, type: 'web' });
            if (res?.data?.error === true) {
                toast.error(res?.data?.message)
            }
            else {
                dispatch(setCurrentLanguage(res?.data?.data));
            }
        } catch (error) {
            console.log(error)
        }
    }


    useEffect(() => {
        if (isEmptyObject(CurrentLanguage)) {
            setDefaultLanguage()
        }
    }, [])

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            if (show) {
                handleClose()
            }
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <>
            <nav className={headerClassName}>
                <div className="container">
                    <div className="left_side">
                        <div className="nav_logo">
                            <Link href="/">
                                <Image loading="lazy" src={settings?.header_logo} alt='Website logo' width={160} height={60} className='header_logo' onErrorCapture={placeholderImage} /* style={{ height: 'auto', width: 'auto' }} */ />
                            </Link>
                        </div>
                        <span onClick={handleShow} id="hamburg">
                            <GiHamburgerMenu size={25} />
                        </span>
                    </div>
                    <div className="nav_items_div">
                        <div className="collapse navbar-collapse" id="navbarSupportedContent">
                            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                                <li className="nav-item nav-link active">
                                    {t('overview')}
                                </li>
                                <li className="nav-item nav-link" onClick={() => scrollToSection('work_process')}>
                                    {t('whyChooseUs')}
                                </li>

                                <li className="nav-item nav-link" onClick={() => scrollToSection('faq')}>
                                    {t('faqs')}
                                </li>
                                <li className="nav-item nav-link" onClick={() => scrollToSection('ourBlogs')}>
                                    {t('blog')}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="right_side">
                        <div className="collapse navbar-collapse" id="navbarSupportedContent">
                            <ul className="navbar-nav ml-auto">
                                <li className="nav-item dropdown mx-2">
                                    <LanguageDropdown getLanguageData={getLanguageData} settings={settings} />
                                </li>
                                {/* <li className="nav-item mx-2 landing_header_cta_li">
                                    <Link href="/home" className="landing_header_cta">
                                        {t("explore_ads")}
                                    </Link>
                                </li> */}
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
            <Drawer className='eclassify_drawer' maskClosable={false} title={<Image loading="lazy" src={settings?.header_logo} width={195} height={92} alt="Close Icon" className='header_logo' onErrorCapture={placeholderImage} />} onClose={handleClose} open={show} closeIcon={<div className="close_icon_cont"><MdClose size={24} color="black" /></div>} >
                <ul className="mobile_nav">
                    <li className='mobile_nav_tab mob_nav_tab_active' >{t('home')}</li>
                    <li className='mobile_nav_tab' onClick={() => scrollToSection('work_process')}>{t('whyChooseUs')}</li>
                    <li className="mobile_nav_tab" onClick={() => scrollToSection('faq')}>{t('faqs')}</li>
                    <li className='mobile_nav_tab' onClick={() => scrollToSection('ourBlogs')}>{t('blog')}</li>
                    <li className='mobile_nav_tab' onClick={() => (handleClose(), router.push('/home'))}>
                        {t('explore')}
                    </li>
                    <li className='mobile_nav_tab'>
                        <LanguageDropdown getLanguageData={getLanguageData} settings={settings} />
                    </li>
                </ul>
            </Drawer>
        </>
    )
}

export default LandingPageHeader
