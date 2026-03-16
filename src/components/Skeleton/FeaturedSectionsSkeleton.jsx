import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const FeaturedSectionsSkeleton = () => {
    const skeletonCards = Array.from({ length: 5 }, (_, index) => (
        <div className="col" key={index}>
            <div className="product_card_skeleton">
                <div className="position-relative">
                    <Skeleton width='100%' className="product_card_prod_img_skeleton" />
                </div>
                <Skeleton count={1} />
                <Skeleton count={0.7} />
                <Skeleton count={0.9} />
            </div>
        </div>
    ));

    return (
        <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0">
            <div className="container">
                <div className="row product_card_card_gap">
                    <div className="col-12">
                        <div className="pop_categ_mrg_btm">
                            <h4 className="pop_cat_head">
                                <Skeleton width={200} />
                            </h4>
                        </div>
                        <div className="row row-cols-xxl-5 row-cols-lg-4 row-cols-md-3 row-cols-2 product_card_card_gap">{skeletonCards}</div>
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
};

export default FeaturedSectionsSkeleton;