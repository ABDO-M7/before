'use client';
import ProductCard from "../Cards/ProductCard";
import { t, useIsRtl } from "@/utils";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

/**
 * Renders a block of featured sections (e.g. all "up" or "middle" or "down").
 * Only renders if at least one section has section_data.
 */
const FeaturedSectionPlacement = ({ sections = [], featuredData, setFeaturedData, priorityImages = false }) => {
    const isRtl = useIsRtl();

    const sectionsWithData = (sections || []).filter(
        (s) => s?.section_data && s.section_data.length > 0
    );
    // No data: render nothing so we don't show a 400px empty block; parent already uses skeleton while loading
    if (sectionsWithData.length === 0) return <></>;


    const handleLike = (id) => {
        if (!setFeaturedData || !featuredData) return;
        const updatedData = featuredData.map((section) => {
            const updatedSectionData = (section.section_data || []).map((item) => {
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
                        {sectionsWithData.map((ele, index) => (
                            <div key={ele?.id ?? index} className="w-100">
                                <div className="pop_categ_mrg_btm w-100 d-flex justify-content-between align-items-center">
                                    <h2 className="pop_cat_head text-dark">
                                        <i className="fas fa-star me-2"></i>
                                        {ele?.title}
                                    </h2>
                                    {ele?.section_data?.length > 4 && (
                                        <Link
                                            href={`/featured-sections/${ele?.slug}`}
                                            className="view_all_link featured_view_all_link"
                                            prefetch={false}
                                        >
                                            <span className="view_all">{t("viewAll")}</span>
                                            <span className="view_all_arrow" aria-hidden>
                                                {isRtl ? (
                                                    <FaArrowLeft size={14} />
                                                ) : (
                                                    <FaArrowRight size={14} />
                                                )}
                                            </span>
                                        </Link>
                                    )}
                                </div>
                                <div className="row row-cols-xxl-4 row-cols-lg-4 row-cols-md-3 row-cols-2 product_card_card_gap">
                                    {(ele?.section_data || []).slice(0, 4).map((data, idx) => (
                                        <div className="col card_col_gap" key={data?.id ?? idx}>
                                            <ProductCard data={data} handleLike={handleLike} priority={priorityImages && index === 0 && idx === 0} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedSectionPlacement;
