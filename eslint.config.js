export default [
  {
    ignores: ["dist/", "node_modules/"]
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off"
    }
  }
];
