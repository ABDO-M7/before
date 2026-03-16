'use client';
import FeaturedSectionPlacement from "./FeaturedSectionPlacement";

/**
 * Featured sections with placement = "up".
 * Renders only if at least one section has data (no empty hole).
 */
const UpperFeaturedSection = ({ sections = [], featuredData, setFeaturedData }) => {
    return (
        <FeaturedSectionPlacement
            sections={sections}
            featuredData={featuredData}
            setFeaturedData={setFeaturedData}
            priorityImages={false}
        />
    );
};

export default UpperFeaturedSection;
