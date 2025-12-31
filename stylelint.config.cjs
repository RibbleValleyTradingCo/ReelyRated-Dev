module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-tailwindcss"],
  ignoreFiles: ["dist/**"],
  rules: {
    "color-no-hex": true,
    "function-disallowed-list": ["rgb", "rgba"],
  },
};
