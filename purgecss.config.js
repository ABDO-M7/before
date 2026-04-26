module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/**/*.html',
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
      /^row-cols-/,
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
