const purgecssConfig = require('./purgecss.config.js');

const purgecss = [
  "@fullhuman/postcss-purgecss",
  {
    ...purgecssConfig,
    // Overriding content if needed for broader scope, but keep it tight
    content: [
      "./src/components/**/*.{js,jsx,ts,tsx}",
      "./src/app/**/*.{js,jsx,ts,tsx}",
      "./src/utils/**/*.{js,jsx,ts,tsx}"
    ],
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
