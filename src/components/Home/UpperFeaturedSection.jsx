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
            // Load first cards in the top featured block eagerly (helps LCP on home).
            priorityImages={true}
        />
    );
};

export default UpperFeaturedSection;
