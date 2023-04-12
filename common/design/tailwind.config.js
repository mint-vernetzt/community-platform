/** @type {import('tailwindcss').Config} */

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
  content: ["stories/**/*.mdx", "stories/**/*.stories.@(js|jsx|ts|tsx)"],
  theme: { colors: theme.colors.aliases },
  plugins: [],
  safelist,
};
