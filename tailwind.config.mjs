import tailwindcssOpentype from "tailwindcss-opentype";

export default {
  content: ["./common/components/src/**/*.@(js|jsx|ts|tsx)", "./app/**/*.tsx"],
  plugins: [tailwindcssOpentype],
};
