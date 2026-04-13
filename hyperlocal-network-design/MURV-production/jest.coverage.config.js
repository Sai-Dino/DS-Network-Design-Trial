/* eslint-disable import/extensions */
import baseConfig from "./jest.config.js";

export default {
  ...baseConfig,
  coverageReporters: ["lcov"],
  coverageDirectory: "./coverage",
  collectCoverage: true,
};
