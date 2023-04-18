/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");
const daisyui = require("daisyui");
const theme = require("./styles/theme");

const safelist = Object.keys(theme.colors.aliases).reduce(
  (classList, color) => {
    const backgroundColorVariants = Object.keys(
      theme.colors.aliases[color]
    ).reduce((variants, shape) => {
      return [...variants, `bg-${color}-${shape}`];
    }, []);
    return [...classList, ...backgroundColorVariants];
  },
  []
);

module.exports = {
  content: [
    "stories/**/*.mdx",
    "stories/**/*.@(js|jsx|ts|tsx)",
    "../components/src/**/*.@(js|jsx|ts|tsx)",
  ],
  plugins: [daisyui],
  theme: {
    extend: {
      colors: theme.colors.aliases,
      fontFamily: {
        sans: ["'Source Sans Pro'", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  safelist,
  daisyui: {
    styled: false,
    themes: false,
  },
};
