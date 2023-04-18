/** @type { import('@storybook/react').Preview } */

import "../styles/styles.css";
import "@fontsource/source-sans-pro";

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
