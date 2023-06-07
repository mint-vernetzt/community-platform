const colors = {
  "beige-100": "#f7f3f2",
  "beige-300": "#efe8e6",
  "blue-500": "#154194",
  "blue-400": "#1b54c0",
  "blue-300": "#2d6be1",
  "blue-200": "#c7d1e2",
  "blue-100": "#dbe1ea",
  "lilac-500": "#b16fab",
  "lilac-400": "#D0A9CD",
  "lilac-300": "#d0a9cd",
  "lilac-200": "#DCBED9",
  "lilac-50": "#F7F1F7",
  "green-500": "#00a87a",
  "green-300": "#66cbaf",
  "yellow-500": "#fcc433",
  "yellow-300": "#fdd670",
  "salmon-500": "#ee7775",
  "salmon-300": "#f5adac",
  "neutral-900": "#141416",
  "neutral-800": "#23262F",
  "neutral-700": "#353945",
  "neutral-600": "#454c5c",
  "neutral-500": "#b1b5c3",
  "neutral-400": "#e6e8ec",
  "neutral-300": "#f4f5f6",
  "neutral-200": "#fcfcfd",
  "neutral-100": "#ffffff",
};

const extendedColors = {
  ...colors,
  primary: colors["blue-500"],
  "primary-500": colors["blue-500"],
  "primary-400": colors["blue-400"],
  "primary-300": colors["blue-300"],
  "primary-200": colors["blue-200"],
  "primary-100": colors["blue-100"],
  secondary: colors["lilac-500"],
  "secondary-500": colors["lilac-500"],
  "secondary-400": colors["lilac-400"],
  "secondary-300": colors["lilac-300"],
  tertiary: colors["beige-500"],
  "tertiary-500": colors["beige-500"],
  "tertiary-300": colors["beige-300"],
  success: colors["green-500"],
  "success-500": colors["green-500"],
  "success-300": colors["green-300"],
  warning: colors["yellow-500"],
  "warning-500": colors["yellow-500"],
  "warning-300": colors["yellow-300"],
  danger: colors["salmon-500"],
  "danger-500": colors["salmon-500"],
  "danger-300": colors["salmon-300"],
  accent: colors["beige-300"],
  "accent-300": colors["beige-300"],
};

const fontSizes = {
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
};

module.exports = {
  colors: extendedColors,
  fontSizes,
};
