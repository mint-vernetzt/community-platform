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
      backgroundImage: {
        "checkbox-checked":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='10' viewBox='0 0 11 10'%3E%3Cpath fill='%233C4658' fill-rule='nonzero' d='M8.712 1.212a.937.937 0 0 1 1.34 1.312L5.06 8.762a.938.938 0 0 1-1.349.026L.404 5.48A.938.938 0 0 1 1.73 4.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z'/%3E%3C/svg%3E\");",
        "select-arrow":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='21' fill='none' viewBox='0 0 20 21'%3E%3Cpath stroke='%23262D38' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.4' d='m5 7.5 5 5.5 5-5.5'/%3E%3C/svg%3E\");",
      },
    },
    container: {
      center: true,
      padding: "1rem",
    },
  },
  safelist,
  daisyui: {
    styled: false,
    themes: false,
  },
};
