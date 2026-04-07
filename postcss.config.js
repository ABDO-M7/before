const purgecss = [
  "@fullhuman/postcss-purgecss",
  {
    content: [
      "./src/components/**/*.{js,jsx,ts,tsx}",
      "./src/app/**/*.{js,jsx,ts,tsx}",
      "./src/utils/**/*.{js,jsx,ts,tsx}"
    ],
    defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
    safelist: {
      standard: [
        "html", "body", "active", "disabled", "show", "fade", "container", "row"
      ],
      deep: [
        /^col-/,
        /^d-/,
        /^m-/,
        /^p-/,
        /^justify-/,
        /^align-/,
        /^btn-/,
        /^swiper-/,
        /^ant-/,
        /^rmdp-/,
        /^Toastify-/,
        /^leaflet-/,
        /^modal/,
        /^drawer/,
        /^header-hamburg-menu/
      ],
      greedy: [
        /slick-/,
        /rc-slider/
      ]
    }
  }
];

module.exports = {
  plugins: [
    "postcss-flexbugs-fixes",
    [
      "postcss-preset-env",
      {
        autoprefixer: {
          flexbox: "no-2009",
        },
        stage: 3,
        features: {
          "custom-properties": false,
        },
      },
    ],
    ...(process.env.NODE_ENV === "production" ? [purgecss] : []),
  ],
};
