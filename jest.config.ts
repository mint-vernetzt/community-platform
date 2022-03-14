export default {
  collectCoverage: true,
  coverageDirectory: "coverage",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
};
