export default {
  collectCoverage: true,
  coverageDirectory: "coverage",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  moduleNameMapper: {
    "^~/(.*)": "<rootDir>/app/$1",
    "\\.css$": "<rootDir>/__mocks__/styleMock.js",
  },
};
