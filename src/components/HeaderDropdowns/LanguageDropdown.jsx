
import { Dropdown } from 'antd';
import Image from 'next/image';
import { placeholderImage } from '@/utils';
import { IoMdArrowDropdown } from "react-icons/io";
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';
import { useSelector } from 'react-redux';

const LanguageDropdown = ({ getLanguageData, settings }) => {

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const languages = settings && settings?.languages
    
    // Language labels based on current active language
    const languageLabels = {
        ar: {
            ar: 'العربية',
            en: 'الانجليزية'
        },
        en: {
            ar: 'Arabic',
            en: 'English'
        }
    };
    
    const getLanguageLabel = (langCode) => {
        const currentLangCode = CurrentLanguage?.code || 'en';
        return languageLabels[currentLangCode]?.[langCode] || langCode;
    };
    
    const handleLanguageSelect = (prop) => {
        const lang = languages?.find(item => item.id === Number(prop.key))
        if (CurrentLanguage.id === lang.id) {
            return
        }
        getLanguageData(lang?.code)
    };
    const safeImageSrc = (src) => (src && String(src).trim()) || '/assets/Transperant_Placeholder.png';
    const safeAlt = (name) => (name && String(name).trim()) || 'Language';

    const items = languages && languages.map(lang => ({
        label: (
            <span className="lang_options">
                <Image loading="lazy" src={safeImageSrc(lang?.image || settings?.placeholder_image)} alt={safeAlt(lang?.name)} width={20} height={20} className="mr-2 lang_icon" onErrorCapture={placeholderImage} />
                <span>{getLanguageLabel(lang.code)}</span>
            </span>
        ),
        key: lang.id,
    }));

    const menuProps = {
        items,
        onClick: handleLanguageSelect,
    };

    const currentLangSrc = safeImageSrc(CurrentLanguage?.image || settings?.placeholder_image);
    const currentLangAlt = safeAlt(CurrentLanguage?.name);

    return (
        <Dropdown menu={menuProps} className='language_dropdown'>
            <span className="d-flex align-items-center">
                <Image loading="lazy" src={currentLangSrc} alt={currentLangAlt} width={20} height={20} className="mr-2 lang_icon" onErrorCapture={placeholderImage} />
                <span style={{ padding: '5px' }}>{getLanguageLabel(CurrentLanguage?.code)}</span>
                <span>{languages?.length > 1 ? <IoMdArrowDropdown /> : <></>}</span>
            </span>
        </Dropdown >
    )
}

export default LanguageDropdown;