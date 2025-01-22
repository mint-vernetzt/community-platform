// postcss.config.js

import postcssImport from "postcss-import";
import tailwindNesting from "tailwindcss/nesting/index.js";
import tailwind from "tailwindcss";

export default {
  plugins: [postcssImport, tailwindNesting, tailwind],
};
