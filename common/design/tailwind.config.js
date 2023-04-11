/** @type {import('tailwindcss').Config} */

const colors = require("./styles/config/colors");

module.exports = {
  content: ["stories/**/*.mdx", "stories/**/*.stories.@(js|jsx|ts|tsx)"],
  theme: {
    extend: {
      colors,
    },
  },
  plugins: [],
};
