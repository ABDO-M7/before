import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
// Skeleton CSS lives here (not in layout) so it ships with the skeleton chunk and reduces main-bundle unused CSS
import 'react-loading-skeleton/dist/skeleton.css';

const SLIDER_SLOT_MIN_HEIGHT = 540; // Match OfferSlider wrapper to prevent CLS

const SliderSkeleton = () => {
  return (
    <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0">
    <div className="offer_slider pop_categ_mrg_btm p-5" style={{ minHeight: SLIDER_SLOT_MIN_HEIGHT }}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="swiper_section">
              <Skeleton width="100%" height={493} style={{ borderRadius: '26px' }} />
              <div className="pop_cat_btns d-none pop_cat_left_btn">
                <Skeleton circle={true} height={24} width={24} />
              </div>
              <div className="pop_cat_btns d-none pop_cat_right_btn">
                <Skeleton circle={true} height={24} width={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </SkeletonTheme>
  );
};

export default SliderSkeleton;