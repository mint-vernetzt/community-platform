const daisyui = require("daisyui");
const lineClamp = require("@tailwindcss/line-clamp");
const defaultTheme = require("tailwindcss/defaultTheme");
const { colors, fontSizes } = require("./app/styles/theme");

module.exports = {
  content: ["./app/**/*.tsx"],
  plugins: [daisyui, lineClamp],
  daisyui: {
    themes: [
      {
        mint: {
          primary: "#154194",
          "primary-content": "#FFFFFF",
          secondary: "#b16fab",
          neutral: "#3d4451",
          "base-100": "#ffffff",
        },
      },
    ],
  },
  theme: {
    extend: {
      colors: {
        ...colors,
      },
    },
    fontFamily: {
      sans: ["'Source Sans Pro'", ...defaultTheme.fontFamily.sans],
    },
    fontSize: {
      ...fontSizes,
    },
    maxWidth: {
      ...defaultTheme.maxWidth,
      xs: "20rem",
      "1/2": "50%",
      "3/4": "75%",
    },
    flex: {
      ...defaultTheme.flex,
      100: "0 0 100%",
      label: "0 0 130px",
      "1/4": "0 0 25%",
      "1/3": "0 0 33.3333%",
      "1/2": "0 0 50%",
      "2/3": "0 0 66.66666%",
      "5/12": "0 0 41.66666667%",
      "7/12": "0 0 58.33333333%;",
      18: "0 0 4.5rem;",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
      },
    },
    spacing: {
      ...defaultTheme.spacing,
      120: "30rem",
    },
    boxShadow: {
      ...defaultTheme.boxShadow,
      DEFAULT: "0 2px 16px 0 rgba(0, 0, 0, 0.17)",
      md: "0 2px 16px 0 rgba(0, 0, 0, 0.37)",
      lg: "0 8px 24px -4px rgba(0, 0, 0, 0.2)",
    },
    keyframes: {
      "fade-out": {
        "0%, 5%": { opacity: 0.0 },
        "5%, 30%": { opacity: 1.0 },
        "100%": { opacity: 0.0 },
      },
    },
    animation: {
      "fade-out": "fade-out 3s ease-in-out forwards",
    },
  },
};
