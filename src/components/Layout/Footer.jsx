'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, memo } from 'react'
// import bg from "../../../public/assets/NewBG.webp"
import { FaFacebook, FaLinkedin, FaPinterest } from "react-icons/fa";
import { FaInstagram, FaSquareXTwitter, FaArrowRight } from "react-icons/fa6";
import { SlLocationPin } from "react-icons/sl";
import { RiMailSendFill } from "react-icons/ri";
import { BiLogoWhatsapp } from "react-icons/bi";
import googleDownload from '../../../public/assets/GoogleDownload.svg'
import pwaDownload from '../../../public/assets/DirectDownload_v7.svg'
import appleDownload from '../../../public/assets/iOSDownload.svg'
import { placeholderImage, t } from '@/utils'
import { settingsData } from '@/redux/reuducer/settingSlice'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice'
import { useSelector } from 'react-redux'
import toast from "@/utils/toast";


const Footer = () => {
    const [showDownloadLinks, setShowDownloadLinks] = useState(false)
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)
    const [hoveredContact, setHoveredContact] = useState(null) // Track which contact is hovered
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const currentYear = new Date().getFullYear();
    const showGetInTouchSection = settings?.company_address || settings?.company_email || settings?.company_tel1;


    // Get WhatsApp message based on current language
    const getWhatsAppMessage = () => {
        const isArabic = CurrentLanguage?.code === "ar" || CurrentLanguage?.language?.code === "ar";
        return isArabic
            ? encodeURIComponent("مرحباً، أحتاج مساعدة أو لدي سؤال")
            : encodeURIComponent("Hello, I need help or have a question");
    };

    // Format phone number for WhatsApp (remove any non-digit characters except +)
    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return '';
        // Remove spaces, dashes, and other characters, keep only digits and +
        let cleaned = phone.replace(/[^\d+]/g, '');
        // If it doesn't start with +, add it (assuming international format)
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        return cleaned;
    };
    const [isSafari, setIsSafari] = useState(false);
    const [isInPWA, setIsInPWA] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false); // حالة للتحقق إذا كان التطبيق مثبتًا أم لا


    useEffect(() => {
    // ✅ TBT Fix: matchMedia avoids layout thrashing vs window.innerWidth on resize
    const media = window.matchMedia('(max-width: 1024px)');
    const listener = (e) => setIsMobileOrTablet(e.matches);
    setIsMobileOrTablet(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

    useEffect(() => {
        if (settings?.play_store_link || settings?.app_store_link) {
            setShowDownloadLinks(true);
        } else {
            setShowDownloadLinks(false);
        }
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('android')) {
            setIsSafari(true);
        }
    }, [settings]);
    // إضافة حالة لتخزين حالة التطبيق المثبت

    // إضافة تحقق من حالة Standalone عند التصفح
    useEffect(() => {
        // تحقق إذا كان التطبيق يعمل في وضع Standalone (مثل PWA أو Native App)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        // تحقق أيضًا من المتصفح إذا كان في وضع PWA أو Native App
        setIsInPWA(isStandalone);

        // إذا كان في وضع Standalone (PWA أو Native App)
        if (isStandalone) {
            setIsAppInstalled(true);  // إذا كان في وضع Standalone، نعتبر أنه مثبت
        } else {
            setIsAppInstalled(false); // غير مثبت
        }
    }, []);

    // useEffect(() => {
    //     if (typeof window !== "undefined") {
    //         const checkAppInstalled = async () => {
    //             // تحقق من وضع Standalone (PWA أو Native)
    //             const isStandalone =
    //                 window.matchMedia("(display-mode: standalone)").matches ||
    //                 window.navigator.standalone === true;

    //             // تحقق من Native apps (getInstalledRelatedApps)
    //             let hasRelatedApps = false;
    //             if (window.navigator.getInstalledRelatedApps) {
    //                 const relatedApps = await window.navigator.getInstalledRelatedApps();
    //                 hasRelatedApps = relatedApps.length > 0;
    //             }

    //             if (isStandalone || hasRelatedApps) {
    //                 toast.success("✅ التطبيق مثبت");
    //             } else {
    //                 toast.error("❌ التطبيق غير مثبت");
    //             }

    //             // طباعة للتأكد
    //             console.log({ isStandalone, hasRelatedApps });
    //         };

    //         checkAppInstalled();
    //     }
    // }, []);


    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const showPwaButton = !isSafari && !isInPWA && isMobileOrTablet && !!deferredPrompt
    // const showPwaButton = true;

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault(); // منع المتصفح من إظهار نافذة التنصيب تلقائيًا
            setDeferredPrompt(e); // تخزين الحدث في state
            console.log('📱 beforeinstallprompt event captured');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);
    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            toast.error(t("installatioPWAnNotAvailable"));
            return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            toast.success(t("pwaInstallSuccess"));
        } else {
            toast.error(t("pwaInstallDismissed"));
        }

        setDeferredPrompt(null)
    }
    return (
        // ✅ CLS Fix: margin-top moved to CSS (.main_footer) — eliminates JS-driven layout shift
        <section className='main_footer'>
            <div className='container'>
                {(showDownloadLinks || showPwaButton) ? (
                    <div className="eClassifyApp" style={{
                        // background: `url(${bg.src})`,
                        background: `#f46648`,
                        backgroundSize: 'cover'
                    }}>
                        <div className="details">
                            <div className='social_text'>
                                <span>{t("BetterOnTheApp")} </span>
                            </div>
                            <div className="social_links">
                                {settings?.play_store_link &&
                                    <Link href={settings?.play_store_link} >
                                        <Image loading="lazy" src={googleDownload} alt='Download on Google Play' width={180} height={60} className='google' onErrorCapture={placeholderImage} /*style={{ height: 'auto', width: 'auto' }}*/ />
                                    </Link>
                                }
                                {settings?.app_store_link &&
                                    <Link href={settings?.app_store_link} >
                                        <Image loading="lazy" src={appleDownload} alt='Download on App Store' width={180} height={60} className='apple' onErrorCapture={placeholderImage} /*style={{ height: 'auto', width: 'auto' }}*/ />
                                    </Link>
                                }

                                {/* {!isAppInstalled && !isSafari && isUserInSyria && !isInPWA && ( */}
                                {showPwaButton && (
                                    <Link
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleInstallClick();
                                        }}
                                    >
                                        <Image
                                            loading="lazy"
                                            src={pwaDownload}
                                            alt="Direct Download Web App"
                                            width={267}
                                            height={117}
                                            onErrorCapture={placeholderImage}
                                        />
                                    </Link>
                                )}

                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="row" id="footer_deatils" style={{ marginTop: showDownloadLinks ? "-100px" : "0" }}  >
                    <div className="col-12 col-md-6 col-lg-4 right_border">
                        <div id="footer_logo_section">
                            <Link href='/'>
                                {settings?.footer_logo?.trim() ? (
                                    <Image
                                        loading="lazy"
                                        src={settings.footer_logo}
                                        alt="Website logo"
                                        width={200}
                                        height={80}
                                        className="footer_logo"
                                        onErrorCapture={placeholderImage}
                                    />
                                ) : (
                                    <span className="footer_logo_text" aria-label="Website logo">{settings?.application_name || 'Logo'}</span>
                                )}
                            </Link>
                        </div>
                        <div className="app_decs">
                            <p>{settings?.footer_description}</p>
                        </div>
                        <div className="social_media">
                            {settings?.facebook_link &&
                                <Link target='_blank' href={settings?.facebook_link} aria-label="Facebook" rel="noopener noreferrer">
                                    <span className="social_media_icon" role="img" aria-hidden="true"><FaFacebook size={22} /></span>
                                </Link>
                            }
                            {settings?.instagram_link &&
                                <Link target='_blank' href={settings?.instagram_link} aria-label="Instagram" rel="noopener noreferrer">
                                    <span className="social_media_icon" role="img" aria-hidden="true"><FaInstagram size={22} /></span>
                                </Link>
                            }
                            {settings?.x_link &&
                                <Link target='_blank' href={settings?.x_link} aria-label="X (Twitter)" rel="noopener noreferrer">
                                    <span className="social_media_icon" role="img" aria-hidden="true"><FaSquareXTwitter size={22} /></span>
                                </Link>
                            }
                            {settings?.linkedin_link &&
                                <Link target='_blank' href={settings?.linkedin_link} aria-label="LinkedIn" rel="noopener noreferrer">
                                    <span className="social_media_icon" role="img" aria-hidden="true"><FaLinkedin size={22} /></span>
                                </Link>
                            }
                            {settings?.pinterest_link &&
                                <Link target='_blank' href={settings?.pinterest_link} aria-label="Pinterest" rel="noopener noreferrer">
                                    <span className="social_media_icon" role="img" aria-hidden="true"><FaPinterest size={22} /></span>
                                </Link>
                            }
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-4 right_border01">
                        <div className="quick_links_section">
                            <div className="footer_headlines">
                                <span>{t('quickLinks')}</span>
                            </div>
                            <div className="footer_links">
                                <Link href={'/overview'}>
                                    <span>{t('overview')}</span>
                                </Link>
                            </div>
                            <div className="footer_links">
                                <Link href={'/about-us'}>
                                    <span>{t('aboutUs')}</span>
                                </Link>
                            </div>
                            <div className="footer_links">
                                <Link href={'/contact-us'}>
                                    <span>{t('contactUs')}</span>
                                </Link>
                            </div>
                            <div className="footer_links">
                                <Link href={'/subscription'}>
                                    <span>{t('subscription')}</span>
                                </Link>
                            </div>
                            <div className="footer_links">
                                <Link href={'/blogs'}>
                                    <span>{t('ourBlog')}</span>
                                </Link>
                            </div>
                            <div className="footer_links">
                                <Link href={'/places'}>
                                    <span>{t('places')}</span>
                                </Link>
                            </div>
                            <div className="footer_links">
                                <Link href={'/faqs'}>
                                    <span>{t('faqs')}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    {showGetInTouchSection &&
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="get_in_touch_section">
                                <div className="footer_headlines">
                                    <span>{t('getInTouch')}</span>
                                </div>
                                {settings?.company_address &&
                                    <div className="contact_details">
                                        <div className="details_icon">
                                            <SlLocationPin size={22} />
                                        </div>
                                        <div className="details_list">
                                            <span>{settings?.company_address}</span>
                                        </div>
                                    </div>
                                }
                                {settings?.company_email &&
                                    <Link
                                        href={`mailto:${settings?.company_email}`}
                                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                        onMouseEnter={() => setHoveredContact('email')}
                                        onMouseLeave={() => setHoveredContact(null)}
                                    >
                                        <div
                                            className="contact_details"
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'email' ? 'translateX(5px)' : 'translateX(0)',
                                                opacity: hoveredContact === 'email' ? 0.9 : 1,
                                                backgroundColor: hoveredContact === 'email' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                margin: '-8px',
                                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                                position: 'relative'
                                            }}
                                        >
                                            <div className="details_icon" style={{
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'email' ? 'scale(1.1)' : 'scale(1)'
                                            }}>
                                                <RiMailSendFill size={22} />
                                            </div>
                                            <div className="details_list" style={{ flex: 1 }}>
                                                <span>{settings?.company_email}</span>
                                            </div>
                                            <div style={{
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'email' ? 'translateX(3px)' : 'translateX(0)',
                                                opacity: 0.6,
                                                marginLeft: '8px'
                                            }}>
                                                <FaArrowRight size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                }
                                {settings?.company_tel1 &&
                                    <Link
                                        href={`https://wa.me/${formatPhoneForWhatsApp(settings?.company_tel1)}?text=${getWhatsAppMessage()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                        onMouseEnter={() => setHoveredContact('tel1')}
                                        onMouseLeave={() => setHoveredContact(null)}
                                    >
                                        <div
                                            className="contact_details"
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'tel1' ? 'translateX(5px)' : 'translateX(0)',
                                                opacity: hoveredContact === 'tel1' ? 0.9 : 1,
                                                backgroundColor: hoveredContact === 'tel1' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                margin: '-8px',
                                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                                position: 'relative'
                                            }}
                                        >
                                            <div className="details_icon" style={{
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'tel1' ? 'scale(1.1)' : 'scale(1)'
                                            }}>
                                                <BiLogoWhatsapp size={22} />
                                            </div>
                                            <div className="details_list" style={{ flex: 1 }}>
                                                <span>{settings?.company_tel1}</span>
                                            </div>
                                            <div style={{
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'tel1' ? 'translateX(3px)' : 'translateX(0)',
                                                opacity: 0.6,
                                                marginLeft: '8px'
                                            }}>
                                                <FaArrowRight size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                }
                                {settings?.company_tel2 &&
                                    <Link
                                        href={`https://wa.me/${formatPhoneForWhatsApp(settings?.company_tel2)}?text=${getWhatsAppMessage()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                        onMouseEnter={() => setHoveredContact('tel2')}
                                        onMouseLeave={() => setHoveredContact(null)}
                                    >
                                        <div
                                            className="contact_details"
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'tel2' ? 'translateX(5px)' : 'translateX(0)',
                                                opacity: hoveredContact === 'tel2' ? 0.9 : 1,
                                                backgroundColor: hoveredContact === 'tel2' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                margin: '-8px',
                                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                                position: 'relative'
                                            }}
                                        >
                                            <div className="details_icon" style={{
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'tel2' ? 'scale(1.1)' : 'scale(1)'
                                            }}>
                                                <BiLogoWhatsapp size={22} />
                                            </div>
                                            <div className="details_list" style={{ flex: 1 }}>
                                                <span>{settings?.company_tel2}</span>
                                            </div>
                                            <div style={{
                                                transition: 'all 0.3s ease',
                                                transform: hoveredContact === 'tel2' ? 'translateX(3px)' : 'translateX(0)',
                                                opacity: 0.6,
                                                marginLeft: '8px'
                                            }}>
                                                <FaArrowRight size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                }
                            </div>
                        </div>
                    }
                </div>
                <div className="copy_right_footer">
                    <div className='copyright'>
                        <span>
                            {/*t('copyright')*/} © {t('arablaza')} {currentYear} — {t('allRightsReserved')}<br />{t('poweredBy')}
                            {/* <Link href="https://www.arablaza.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>{t('arablaza')}</Link> */}
                        </span>
                    </div>
                    <div className='privacyandcondtion'>
                        <Link href={'/privacy-policy'}>
                            <span className='privacy'>{t('privacyPolicy')}</span>
                        </Link>
                        <Link href={'/terms-and-condition'}>
                            <span className='terms'>{t('termsConditions')}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ✅ Memoize Footer to prevent unnecessary re-renders
// Footer renders on every page, so memoization will improve performance
export default memo(Footer)
