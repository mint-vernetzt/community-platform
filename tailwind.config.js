import daisyui from "daisyui";
import tailwindcssOpentype from "tailwindcss-opentype";
import defaultTheme from "tailwindcss/defaultTheme";
import { colors, fontSizes } from "./app/styles/theme";

export default {
  content: ["./app/**/*.tsx"],
  plugins: [daisyui, tailwindcssOpentype],
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
      xxs: "0.625rem",
    },
    maxWidth: {
      ...defaultTheme.maxWidth,
      xs: "20rem",
      "1/2": "50%",
      "3/4": "75%",
    },
    aspectRatio: {
      ...defaultTheme.aspectRatio,
      "4/3": "4 / 3",
      awardbanner: "7 / 11",
    },
    flex: {
      ...defaultTheme.flex,
      100: "0 0 100%",
      label: "0 0 130px",
      gridcol: "0 0 auto",
      "1/4": "0 0 25%",
      "1/3": "0 0 33.3333%",
      "1/2": "0 0 50%",
      "2/3": "0 0 66.66666%",
      18: "0 0 4.5rem;",
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
    spacing: {
      ...defaultTheme.spacing,
      120: "30rem",
    },
    boxShadow: {
      ...defaultTheme.boxShadow,
      DEFAULT: "0 2px 16px 0 rgba(0, 0, 0, 0.17)",
      md: "0 2px 16px 0 rgba(0, 0, 0, 0.37)",
      lg: "0 8px 24px -4px rgba(0, 0, 0, 0.2)",
      xl: "0px 24px 48px -12px rgba(0, 0, 0, 0.24)",
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
