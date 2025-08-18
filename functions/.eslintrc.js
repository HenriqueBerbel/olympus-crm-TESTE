// Arquivo: functions/.eslintrc.js

module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "script",
  },
  rules: {
    "quotes": ["error", "double"],
    "require-jsdoc": 0,
    "valid-jsdoc": 0,
    "max-len": ["error", {"code": 120, "ignoreUrls": true}], // Aumenta o limite e ignora URLs
  },
};
