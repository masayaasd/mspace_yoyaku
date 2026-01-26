module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: false,
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  env: {
    node: true,
    es2021: true,
  },
  ignorePatterns: ["dist", "node_modules"],
};
