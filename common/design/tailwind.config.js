/** @type {import('tailwindcss').Config} */

const theme = require("./styles/theme");

module.exports = {
  content: ["stories/**/*.mdx", "stories/**/*.stories.@(js|jsx|ts|tsx)"],
  theme,
  plugins: [],
};
