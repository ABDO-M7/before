const fs = require('fs');

try {
    let code = fs.readFileSync('src/components/PagesComponent/SingleBlog/SingleBlog.jsx', 'utf8');

    // 1. Swap the imports safely
    code = code.replace(/import \{ FacebookShareButton, TwitterShareButton, WhatsappShareButton \} from "react-share"/, '');
    code = code.replace(/import \{ RiTwitterXLine \} from "react-icons\/ri"/, '');
    code = code.replace(/import \{ BiLink, BiLogoFacebook, BiLogoWhatsapp \} from "react-icons\/bi"/, '');
    code = code.replace(/import \{ Swiper, SwiperSlide \} from 'swiper\/react';/, '');
    code = code.replace(/import \{ FreeMode \} from 'swiper\/modules';/, '');
    code = code.replace(/import 'swiper\/css';/, '');
    code = code.replace(/import 'swiper\/css\/free-mode';/, '');
    code = code.replace(/import \{ FaArrowLeft, FaArrowRight \} from "react-icons\/fa6";/, '');

    if (!code.includes("import dynamic from")) {
        code = code.replace(/import React from "react"/, `import React from "react"\nimport dynamic from 'next/dynamic'\nconst BlogSocialShare = dynamic(() => import('./BlogSocialShare'), { ssr: false })\nconst BlogProductsCarousel = dynamic(() => import('./BlogProductsCarousel'), { ssr: false })`);
    }

    // 2. Remove states related to Swiper
    code = code.replace(/const mainItemsSwiperRef = useRef\(null\);\s*const \[mainItemsNavState, setMainItemsNavState\] = useState\(\{ isBeginning: true, isEnd: false \}\);\s*const sectionSwiperRefs = useRef\(\{\}\);\s*const \[sectionNavStates, setSectionNavStates\] = useState\(\{\}\);/, '');

    // Remove handler functions for Swipers
    const handleMainItemsSlideChangeMatch = code.match(/const handleMainItemsSlideChange = \(\) => \{[\s\S]*?\}\n\n/);
    if (handleMainItemsSlideChangeMatch) code = code.replace(handleMainItemsSlideChangeMatch[0], '');

    const swipeMainItemsNextMatch = code.match(/const swipeMainItemsNext = \(\) => \{[\s\S]*?\}\n\n/);
    if (swipeMainItemsNextMatch) code = code.replace(swipeMainItemsNextMatch[0], '');

    const swipeMainItemsPrevMatch = code.match(/const swipeMainItemsPrev = \(\) => \{[\s\S]*?\}\n\n/);
    if (swipeMainItemsPrevMatch) code = code.replace(swipeMainItemsPrevMatch[0], '');

    const handleSectionSlideChangeMatch = code.match(/const handleSectionSlideChange = \(sectionIndex\) => \{[\s\S]*?\}\n\n/);
    if (handleSectionSlideChangeMatch) code = code.replace(handleSectionSlideChangeMatch[0], '');

    const swipeNextMatch = code.match(/const swipeNext = \(sectionIndex\) => \{[\s\S]*?\}\n\n/);
    if (swipeNextMatch) code = code.replace(swipeNextMatch[0], '');

    const swipePrevMatch = code.match(/const swipePrev = \(sectionIndex\) => \{[\s\S]*?\}\n\n/);
    if (swipePrevMatch) code = code.replace(swipePrevMatch[0], '');

    // 3. Replace HTML blocks
    // Replace Social share block exactly
    const shareBlockStart = code.indexOf('<div className="single_blog_content share_container">');
    const shareBlockEnd = code.indexOf('</div>', code.indexOf('</div>', code.indexOf('</div>', code.indexOf('</div>', shareBlockStart) + 1) + 1) + 1) + 6;

    if (shareBlockStart !== -1 && shareBlockEnd !== -1) {
        const replacement = '<BlogSocialShare blogUrl={currentUrl} blogTitle={blogData?.title} CompanyName={CompanyName} />';
        code = code.substring(0, shareBlockStart) + replacement + code.substring(shareBlockEnd);
    }

    // Replace Main Swiper exactly
    const mainSwiperMatch = code.match(/<div className="blog_main_items_swiper_container"[\s\S]*?<\/div> \/\* End Main Blog Items \*\//);
    if (mainSwiperMatch) {
       // but wait, we don't have "End Main Blog Items", we have conditional matching.
    }
    
    // Safer to use a simple string replacement for the Swiper blocks by replacing the condition blocks
    code = code.replace(/{blogItems\.length >= 2 \? \([\s\S]*?\)\s*:\s*\([\s\S]*?<\/[sS]wiper>[\s\S]*?<\/div>\s*\)/, `<BlogProductsCarousel items={blogItems} isRtl={isRtl} handleLike={handleLike} containerClassPrefix="blog_main_items" />`);

    code = code.replace(/{section\.items\.length >= 2 \? \([\s\S]*?\)\s*:\s*\([\s\S]*?<\/[sS]wiper>[\s\S]*?<\/div>\s*\)/g, `<BlogProductsCarousel items={section.items} isRtl={isRtl} handleLike={(id) => handleSectionLike(sectionIndex, id)} containerClassPrefix="blog_section" />`);


    // Write the result
    fs.writeFileSync('src/components/PagesComponent/SingleBlog/SingleBlog.jsx', code, 'utf8');
    console.log('Processed SingleBlog.jsx successfully');
} catch(e) {
    console.error(e);
}
