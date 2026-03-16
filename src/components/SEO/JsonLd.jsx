/**
 * JsonLd Component – structured data for SEO
 *
 * - Renders server-side so it’s in the initial HTML for crawlers.
 * - type="application/ld+json" is data-only; browsers do not execute it as JS,
 *   so it does not block rendering like executable scripts.
 * - Prefer small schemas (Organization, WebSite) before large ItemList on the homepage.
 * - Keep ItemList size capped (e.g. 15 categories, 25 products) to limit inline script size.
 *
 * Note: In App Router, page content is rendered in <body>. Placing this in <head>
 * would require layout-level changes; current placement is acceptable with size limits.
 */
export default function JsonLd({ data, id }) {
    const schemaId = id || `schema-jsonld-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <script
            id={schemaId}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(data).replace(/</g, "\\u003c"),
            }}
        />
    );
}