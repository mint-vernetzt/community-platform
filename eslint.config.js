import { default as defaultConfig } from "@epic-web/config/eslint";

/** @type {import("eslint").Linter.Config} */
export default [
  ...defaultConfig,
  {
    ignores: [".react-router/*"],
  },
  {
    rules: {
      "import/order": "off",
      "import/consistent-type-specifier-style": "off",
    },
  },
];
