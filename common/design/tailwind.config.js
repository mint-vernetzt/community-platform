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
  important: true,
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
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          xl: "1.5rem",
        },
        screens: {
          sm: "600px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1536px",
        },
      },
      backgroundImage: {
        "select-arrow":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='21' fill='none' viewBox='0 0 20 21'%3E%3Cpath stroke='%23262D38' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.4' d='m5 7.5 5 5.5 5-5.5'/%3E%3C/svg%3E\")",
      },
    },
    container: {
      center: true,
      padding: "1rem",
    },
  },
  safelist: [
    "mv-grid-rows-[repeat(2,_1fr)_repeat(8,_0fr)]",
    "mv-grid-rows-[repeat(2,_1fr)_repeat(7,_0fr)]",
    "mv-grid-rows-[repeat(2,_1fr)_repeat(6,_0fr)]",
    "mv-grid-rows-[repeat(2,_1fr)_repeat(5,_0fr)]",
    "mv-grid-rows-[repeat(2,_1fr)_repeat(4,_0fr)]",
    "mv-grid-rows-[repeat(2,_1fr)_repeat(3,_0fr)]",
    "md:mv-grid-rows-[repeat(3,_1fr)_repeat(8,_0fr)]",
    "md:mv-grid-rows-[repeat(3,_1fr)_repeat(7,_0fr)]",
    "md:mv-grid-rows-[repeat(3,_1fr)_repeat(6,_0fr)]",
    "md:mv-grid-rows-[repeat(3,_1fr)_repeat(5,_0fr)]",
    "md:mv-grid-rows-[repeat(3,_1fr)_repeat(4,_0fr)]",
    "md:mv-grid-rows-[repeat(3,_1fr)_repeat(3,_0fr)]",
    "peer-checked:mv-grid-rows-3",
    "peer-checked:mv-grid-rows-3",
    "peer-checked:mv-grid-rows-3",
    "peer-checked:mv-grid-rows-3",
    "peer-checked:mv-grid-rows-4",
    "peer-checked:mv-grid-rows-5",
    "peer-checked:mv-grid-rows-6",
  ],
  daisyui: {
    styled: false,
    themes: false,
  },
};
