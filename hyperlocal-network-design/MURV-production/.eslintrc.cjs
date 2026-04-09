module.exports = {
  env: {
    es6: true,
    browser: true,
  },
  extends: [
    "plugin:eslint-plugin-import/recommended",
    "plugin:eslint-plugin-import/typescript",
    "eslint-config-airbnb",
    "eslint-config-airbnb-typescript",
    "eslint-config-prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 7,
    project: true,
  },
  plugins: [
    "eslint-plugin-react-hooks",
    "@typescript-eslint/eslint-plugin",
    "eslint-plugin-filenames",
    "jsx-a11y",
    "check-file",
  ],
  rules: {
    "import/no-extraneous-dependencies": "off",
    "react/function-component-definition": "off",
    "import/prefer-default-export": "off",
    "react/require-default-props": "off",
    "react/jsx-props-no-spreading": "off",
    "no-console": ["error", { allow: ["warn", "error"] }],
    "check-file/filename-naming-convention": [
      "error",
      {
        "packages/**/!(hooks)/!(index).tsx": "PASCAL_CASE",
        "packages/**/*.ts": "CAMEL_CASE",
        "packages/**/**/hooks/*.tsx": "CAMEL_CASE",
      },
      { ignoreMiddleExtensions: true },
    ],
    "check-file/folder-naming-convention": ["error", { "packages/*/": "KEBAB_CASE" }],
    "check-file/folder-match-with-fex": [
      "error",
      { "packages/**/*.test.tsx": "**/__tests__/", "packages/**/*.spec.ts": "**/vrt/" },
    ],
  },
  overrides: [
    // for all configuration files
    // Note: they need to be js/cjs files
    {
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      files: ["./**/*.js", "./**/*.cjs", "playwright.config.ts"],
    },
    {
      files: ["./**/*.stories.js", "./**/*.stories.jsx", "./**/*.stories.ts", "./**/*.stories.tsx"],
      rules: {
        "no-console": "off",
      },
    },
  ],
};
