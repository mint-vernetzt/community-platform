const colors = {
  gray: {
    50: "#FCFCFD",
    100: "#F4F5F6",
    200: "#EAECF0",
    300: "#BFC6D3",
    400: "#8893A7",
    500: "#70809D",
    600: "#4D5970",
    700: "#3C4658",
    800: "#262D38",
    900: "#0B0D10",
  },
  blue: {
    50: "#EDF3FF",
    100: "#BBD1FC",
    200: "#5F94F9",
    300: "#2D6BE1",
    400: "#1B54C0",
    500: "#154194",
    600: "#143E8D",
    700: "#113476",
    800: "#091D43",
    900: "#040D1E",
  },
  lilac: {
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
  beige: {
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
  green: {
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
  yellow: {
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
  salmon: {
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
};

const theme = Object.keys(colors).reduce((theme, color) => {
  const variants = colors[color];
  variants.DEFAULT = colors[color][500];
  return { ...theme, [color]: variants };
}, {});

const aliases = {
  neutral: theme.gray,
  primary: theme.blue,
  secondary: theme.lilac,
  accent: theme.beige,
  success: theme.green,
  warning: theme.yellow,
  danger: theme.salmon,
};

module.exports = { theme, aliases };
