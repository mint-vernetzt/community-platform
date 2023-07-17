/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");
const daisyui = require("daisyui");
const theme = require("./styles/theme");

const safelist = Object.keys(theme.colors.aliases).reduce(
  (classList, color) => {
    const backgroundColorVariants = Object.keys(
      theme.colors.aliases[color]
    ).reduce((variants, shape) => {
      return [...variants, `mv-bg-${color}-${shape}`];
    }, []);
    return [...classList, ...backgroundColorVariants];
  },
  []
);

module.exports = {
  prefix: "mv-",
  content: [
    "stories/**/*.mdx",
    "stories/**/*.@(js|jsx|ts|tsx)",
    "../components/src/**/*.@(js|jsx|ts|tsx)",
    "../../app/**/*.@(js|jsx|ts|tsx)",
  ],
  plugins: [daisyui],
  theme: {
    extend: {
      colors: theme.colors.aliases,
      fontFamily: {
        sans: ["'Source Sans Pro'", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xxs: "0.625rem", // 10px
        xs: "0.75rem", // 12px
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.125rem", // 18px
        xl: "1.25rem", // 20px
        "2xl": "1.375rem", // 22px
        "3xl": "1.5rem", // 24px
        "4xl": "1.625rem", // 26px
        "5xl": "2rem", // 32px
        "6xl": "2.5rem", // 40px
        "7xl": "3rem", // 48px
        "8xl": "4.5rem", // 72px
      },
      gap: {
        ...defaultTheme.gap,
        18: "4.5rem", // 72px
      },
      spacing: {
        ...defaultTheme.spacing,
      },
    },
  },
  safelist,
  daisyui: {
    styled: false,
    themes: false,
  },
};
