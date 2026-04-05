module.exports = {
  content: [
    'src/**/*.jsx',
    'src/**/*.js'
  ],
  css: ['public/css/style.css'],
  output: 'public/css/style.clean.css',
  safelist: [
    /^swiper-/,
    /^ant-/,
    /^rmdp-/,
    /^Toastify-/,
    /^leaflet-/,
    /^Mui/,
    /^col-/,
    /^row/,
    /^nav-/,
    /^carousel-/,
    /^modal-/,
    /^drawer-/,
    'container',
    'fade',
    'show',
    'active',
    'disabled',
    'slick-active',
    'slick-current',
    'header-hamburg-menu'
  ],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
};
