import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default {
  rootDir: path.join(dirname, "./"),
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/packages/**/*.{js,jsx,tsx}",
    "!**/dist/**",
    "!**/*.stories.{ts,tsx}",
    "!**/node_modules/**",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["json", "lcov", "text", "clover", "text-summary", "json-summary"],
  coveragePathIgnorePatterns: ["coverage"],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/vrt/", "/node_modules/"],
  moduleNameMapper: {
    "test-utils": "<rootDir>/test-utils",
    vrt: "<rootDir>/vrt",
    "\\.(css|less|scss)$": "identity-obj-proxy",
  },
  transformIgnorePatterns: ["node_modules/(?!@murv/icons)"],
};
