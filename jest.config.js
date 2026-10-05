export default {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.js"],
  transform: {},
  collectCoverageFrom: [
    "src/utils/news.js",
    "src/utils/roles.js",
    "src/utils/operationalMap.js",
    "src/utils/projections.js",
  ],
};
