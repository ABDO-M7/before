const fs = require("fs");
const css = `
/* CMS generated HTML styles to avoid iframe requirement */
.blog_html_content img {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 10px 0;
    border-radius: 8px;
}
.blog_html_content iframe {
    max-width: 100% !important;
}
.blog_html_content a {
    color: #ce0000;
    text-decoration: underline;
}
.blog_html_content p {
    margin-bottom: 15px;
    line-height: 1.6;
}
body {
    overflow: clip !important;
}
.blog_sidebar_card .product_card {
    border: none !important;
    padding: 0 !important;
    gap: 6px !important;
}
.blog_sidebar_card .product_card_prod_img {
    aspect-ratio: 1/0.75 !important;
    border-radius: 8px !important;
}
.blog_sidebar_card .product_card_prod_price {
    font-size: 15px !important;
}
.blog_sidebar_card .product_card_prod_name {
    font-size: 14px !important;
    line-height: 1.4 !important;
}
.blog_sidebar_card .product_card_prod_det {
    font-size: 12px !important;
}
.blog_sidebar_card .product_card_prod_date {
    font-size: 11px !important;
}
.blog_sidebar_card .product_card_black_heart_cont {
    width: 36px !important;
    height: 36px !important;
    right: 6px !important;
    top: 6px !important;
}
.blog_sidebar_card .product_card_black_heart_cont button {
    width: 100% !important;
    height: 100% !important;
}
.blog_sidebar_card .like_icon {
    width: 18px !important;
    height: 18px !important;
}
.blog_section_nav_arrow,
.blog_main_items_nav_arrow {
    transition: opacity 0.3s ease;
}
.blog_section_nav_arrow.hideArrow,
.blog_main_items_nav_arrow.hideArrow {
    opacity: 0;
    pointer-events: none;
}
.blog_section_nav_arrow:hover,
.blog_main_items_nav_arrow:hover {
    background-color: rgba(255, 255, 255, 1) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
}
@media (max-width: 768px) {
    .blog_section_nav_arrow,
    .blog_main_items_nav_arrow {
        width: 35px !important;
        height: 35px !important;
    }
}
`;
fs.appendFileSync("public/css/style.css", "\n" + css + "\n", "utf8");
console.log("Appended clean CSS.");
