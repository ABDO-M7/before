'use client';
import FeaturedSectionPlacement from "./FeaturedSectionPlacement";

/**
 * Featured sections with placement = "middle".
 * Renders only if at least one section has data (no empty hole).
 */
const MiddleFeaturedSection = ({ sections = [], featuredData, setFeaturedData }) => {
    return (
        <FeaturedSectionPlacement
            sections={sections}
            featuredData={featuredData}
            setFeaturedData={setFeaturedData}
            priorityImages={true}
        />
    );
};

export default MiddleFeaturedSection;
