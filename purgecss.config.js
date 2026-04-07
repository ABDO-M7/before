module.exports = {
  content: [
    './src/app/blogs/[slug]/page.jsx',
    './src/components/PagesComponent/SingleBlog/**/*.{jsx,js}',
    './src/components/Cards/OurBlogCard.jsx',
    './src/components/Cards/ProductCard.jsx',
    './src/components/Layout/**/*.{jsx,js}',
  ],
  css: ['./public/css/style.css'],
  safelist: {
    standard: [
      'html', 'body', 'active', 'disabled', 'show', 'fade', 'container', 'row',
      'blog_main_items', 'blog_section', 'carousel-skeleton'
    ],
    deep: [
      /^blog_/,
      /^product_card/,
      /^ant-/,
      /^swiper-/,
      /^col-/,
      /^row/,
      /^text-/,
      /^bg-/,
      /^flex/,
      /^gap/,
      /^m-/,
      /^p-/,
      /^justify-/,
      /^align-/,
      /^Toastify-/,
      /^leaflet-/,
      /^rmdp-/
    ],
    greedy: [
      /slick-/,
      /rc-slider/
    ]
  },
  keyframes: true,
  fontFace: true,
  extractors: [
    {
      extractor: (content) => content.match(/[A-Za-z0-9-_:/]+/g) || [],
      extensions: ['jsx', 'js', 'css']
    }
  ]
};
