'use client';

import Link from 'next/link';
import { t, useIsRtl } from '@/utils';
import { FaBullhorn } from 'react-icons/fa6';
import { IoIosAddCircleOutline } from 'react-icons/io';

const AdListingBanner = () => {
  const isRtl = useIsRtl();

  return (
    <div className="container main_padding">
      <section
        className="ad_promo_section"
        dir={isRtl ? 'rtl' : 'ltr'}
        aria-labelledby="ad_promo_heading"
        style={{ minHeight: '200px' }}
      >
        {/* Decorative circles */}
        <div className="ad_promo_deco ad_promo_deco_top" aria-hidden />
        <div className="ad_promo_deco ad_promo_deco_bottom" aria-hidden />

        <div className="ad_promo_content">
          <div className="ad_promo_text">
            <span className="ad_promo_badge">{t('sellFast')}</span>
            <h2 id="ad_promo_heading" className="ad_promo_heading">
              {t('havePropertyToSell')}
            </h2>
            <p className="ad_promo_desc">{t('joinThousands')}</p>
            <Link href="/ad-listing" className="ad_promo_btn">
              <IoIosAddCircleOutline size={22} aria-hidden />
              <span>{t('addAdNow')}</span>
            </Link>
          </div>
          <div className="ad_promo_icon" aria-hidden>
            <FaBullhorn size={120} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdListingBanner;
