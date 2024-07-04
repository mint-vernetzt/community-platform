/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");
const daisyui = require("daisyui");
const tailwindContainerQueries = require("@tailwindcss/container-queries");

module.exports = {
  prefix: "mv-",
  important: true,
  content: [
    "stories/**/*.mdx",
    "stories/**/*.@(js|jsx|ts|tsx)",
    "../components/src/**/*.@(js|jsx|ts|tsx)",
    "../../app/**/*.@(js|jsx|ts|tsx)",
  ],
  plugins: [daisyui, tailwindContainerQueries],
  theme: {
    extend: {
      containers: {
        sm: "600px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      colors: {
        neutral: {
          DEFAULT: "#70809D",
        },
        // Cannot use object syntax here, because daisyui overrides the colors
        // see https://github.com/saadeghi/daisyui/issues/2368
        "neutral-50": "#FCFCFD",
        "neutral-100": "#F4F5F6",
        "neutral-200": "#EAECF0",
        "neutral-300": "#BFC6D3",
        "neutral-400": "#8893A7",
        "neutral-500": "#70809D",
        "neutral-600": "#4D5970",
        "neutral-700": "#3C4658",
        "neutral-800": "#262D38",
        "neutral-900": "#0B0D10",
        primary: {
          DEFAULT: "#154194",
          50: "#EDF3FF",
          100: "#BBD1FC",
          200: "#5F94F9",
          300: "#2D6BE1",
          400: "#1B54C0",
          500: "#154194",
          600: "#113476",
          700: "#112C5F",
          800: "#091D43",
          900: "#040D1E",
        },
        secondary: {
          DEFAULT: "#B16FAB",
          50: "#F7F1F7",
          100: "#ECDBEA",
          200: "#DCBED9",
          300: "#D0A9CD",
          400: "#BE88BA",
          500: "#B16FAB",
          600: "#703D6B",
          700: "#5D335A",
          800: "#4B2848",
          900: "#2F192D",
        },
        accent: {
          DEFAULT: "#EFE8E6",
          50: "#FDFDFC",
          100: "#FCFAFA",
          200: "#F9F6F5",
          300: "#F4EFEE",
          400: "#F1EBEA",
          500: "#EFE8E6",
          600: "#D4C1BB",
          700: "#9D7265",
          800: "#725249",
          900: "#392925",
        },
        positive: {
          DEFAULT: "#00A87A",
          50: "#EFFFF7",
          100: "#DDFFF6",
          200: "#AFF3E0",
          300: "#66CBAF",
          400: "#35BD97",
          500: "#00A87A",
          600: "#008F68",
          700: "#007655",
          800: "#005C43",
          900: "#004331",
        },
        attention: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        negative: {
          DEFAULT: "#F35F5F",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#EE7775",
          500: "#F35F5F",
          600: "#EF4444",
          700: "#DC2626",
          800: "#B91C1C",
          900: "#991B1B",
        },
      },
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
      },
      screens: {
        sm: "600px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
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
    "peer-checked:mv-grid-rows-4",
    "peer-checked:mv-grid-rows-5",
    "peer-checked:mv-grid-rows-6",
    "peer-checked:mv-grid-rows-7",
    "peer-checked:mv-grid-rows-8",
    "mv-bg-neutral",
    "mv-bg-neutral-50",
    "mv-bg-neutral-100",
    "mv-bg-neutral-200",
    "mv-bg-neutral-300",
    "mv-bg-neutral-400",
    "mv-bg-neutral-500",
    "mv-bg-neutral-600",
    "mv-bg-neutral-700",
    "mv-bg-neutral-800",
    "mv-bg-neutral-900",
    "mv-bg-primary",
    "mv-bg-primary-50",
    "mv-bg-primary-100",
    "mv-bg-primary-200",
    "mv-bg-primary-300",
    "mv-bg-primary-400",
    "mv-bg-primary-500",
    "mv-bg-primary-600",
    "mv-bg-primary-700",
    "mv-bg-primary-800",
    "mv-bg-primary-900",
    "mv-bg-secondary",
    "mv-bg-secondary-50",
    "mv-bg-secondary-100",
    "mv-bg-secondary-200",
    "mv-bg-secondary-300",
    "mv-bg-secondary-400",
    "mv-bg-secondary-500",
    "mv-bg-secondary-600",
    "mv-bg-secondary-700",
    "mv-bg-secondary-800",
    "mv-bg-secondary-900",
    "mv-bg-accent",
    "mv-bg-accent-50",
    "mv-bg-accent-100",
    "mv-bg-accent-200",
    "mv-bg-accent-300",
    "mv-bg-accent-400",
    "mv-bg-accent-500",
    "mv-bg-accent-600",
    "mv-bg-accent-700",
    "mv-bg-accent-800",
    "mv-bg-accent-900",
    "mv-bg-positive",
    "mv-bg-positive-50",
    "mv-bg-positive-100",
    "mv-bg-positive-200",
    "mv-bg-positive-300",
    "mv-bg-positive-400",
    "mv-bg-positive-500",
    "mv-bg-positive-600",
    "mv-bg-positive-700",
    "mv-bg-positive-800",
    "mv-bg-positive-900",
    "mv-bg-attention",
    "mv-bg-attention-50",
    "mv-bg-attention-100",
    "mv-bg-attention-200",
    "mv-bg-attention-300",
    "mv-bg-attention-400",
    "mv-bg-attention-500",
    "mv-bg-attention-600",
    "mv-bg-attention-700",
    "mv-bg-attention-800",
    "mv-bg-attention-900",
    "mv-bg-negative",
    "mv-bg-negative-50",
    "mv-bg-negative-100",
    "mv-bg-negative-200",
    "mv-bg-negative-300",
    "mv-bg-negative-400",
    "mv-bg-negative-500",
    "mv-bg-negative-600",
    "mv-bg-negative-700",
    "mv-bg-negative-800",
    "mv-bg-negative-900",
  ],
  daisyui: {
    styled: false,
    themes: false,
  },
};
