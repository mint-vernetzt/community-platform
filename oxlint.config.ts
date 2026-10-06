import { defineConfig } from "oxlint";

// Using strong oxlint defaults
// Adjust as needed for your project
export default defineConfig({
  plugins: [
    "eslint",
    "typescript",
    "react",
    "react-perf",
    "oxc",
    "import",
    "jsx-a11y",
    "node",
    "promise",
  ],
  options: {
    typeAware: true,
  },
});
