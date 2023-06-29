/** @type { import('@storybook/react').Preview } */

import "../styles/styles.css";
import "@fontsource/source-sans-pro/400.css";
import "@fontsource/source-sans-pro/600.css";
import "@fontsource/source-sans-pro/700.css";
import "@fontsource/source-sans-pro/900.css";

const viewports = {
  xs: {
    name: "xs",
    styles: {
      width: "320px",
      height: "480px",
    },
  },
  sm: {
    name: "sm",
    styles: {
      width: "640px",
      height: "480px",
    },
  },
  md: {
    name: "md",
    styles: {
      width: "768px",
      height: "480px",
    },
  },
  lg: {
    name: "lg",
    styles: {
      width: "1024px",
      height: "768px",
    },
  },
  xl: {
    name: "xl",
    styles: {
      width: "1280px",
      height: "800px",
    },
  },
  "2xl": {
    name: "2xl",
    styles: {
      width: "1536px",
      height: "800px",
    },
  },
};

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: { viewports },
  },
};

export default preview;
