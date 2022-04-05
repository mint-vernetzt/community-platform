const daisyui = require("daisyui");
const defaultTheme = require("tailwindcss/defaultTheme");
const { colors, fontSizes } = require("./app/styles/theme");

module.exports = {
  content: ["./app/**/*.tsx"],
  plugins: [daisyui],
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
    container: {
      center: true,
    },
  },
};
