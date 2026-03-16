'use client';
import ProductCard from "../Cards/ProductCard";
import { t, useIsRtl } from "@/utils";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
// import { userSignUpData } from "@/redux/reuducer/authSlice"; // unused
// import { useSelector } from "react-redux"; // unused (was only used for userSignUpData)
const FeaturedSections = ({ featuredData, setFeaturedData, allEmpty }) => {
    // const userData = useSelector(userSignUpData); // unused
    const isRtl = useIsRtl();
    const handleLike = (id) => {
        const updatedData = featuredData.map(section => {
            const updatedSectionData = section.section_data.map(item => {
                if (item.id === id) {
                    return { ...item, is_liked: !item.is_liked };
                }
                return item;
            });
            return { ...section, section_data: updatedSectionData };
        });
        setFeaturedData(updatedData);
    };
    return (
        <div className="container">
            <div className="row product_card_card_gap">
                <div className="col-12">
                    <div className="all_sections">
                    {featuredData && !allEmpty && (
                            featuredData.map((ele, index) => (
                                ele?.section_data.length > 0 && (
                                    <div key={index} className="w-100">
                                        <div className="pop_categ_mrg_btm w-100 d-flex justify-content-between align-items-center">
                                            <h2 className="pop_cat_head text-dark">
                                                <i className="fas fa-star me-2"></i>
                                                {ele?.title}
                                            </h2>
                                            {ele?.section_data.length > 4 &&
                                                <Link href={`/featured-sections/${ele?.slug}`} className="view_all_link featured_view_all_link" prefetch={false}>
                                                    <span className="view_all">{t('viewAll')}</span>
                                                    <span className="view_all_arrow" aria-hidden>
                                                        {isRtl ? <FaArrowLeft size={14} /> : <FaArrowRight size={14} />}
                                                    </span>
                                                </Link>
                                            }
                                        </div>
                                        <div className="row row-cols-xxl-4 row-cols-lg-4 row-cols-md-3 row-cols-2 product_card_card_gap">
                                            {ele?.section_data.slice(0, 4).map((data, index) => (
                                                <div className="col card_col_gap" key={index}>
                                                        <ProductCard data={data} handleLike={handleLike} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedSections;
