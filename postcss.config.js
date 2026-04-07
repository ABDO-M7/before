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
        "html", "body", "active", "disabled", "show", "fade", "container", "row",
        // ✅ عناصر صفحة البلوج
        "blog_main_img", "blog_html_content", "blog_heading", "single_blog", "blog_content"
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
        /^header-hamburg-menu/,
        // ✅ أنماط محتوى البلوج الديناميكي
        /^blog_/,
        /^single_blog_/,
        /^our_blog_/
      ],
      greedy: [
        /slick-/,
        /rc-slider/,
        // ✅ مكتبات قد تُستخدم في محتوى البلوج
        /hljs-/,  // Syntax highlighting لو في كود
        /youtube-/, // لو في فيديوهات
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
