require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json'
  },
  plugins: [],
  rules: {
    // Basic rules only – avoids the @typescript-eslint/utils Node 20 compat issue
    // that exists in @microsoft/eslint-config-spfx 1.22.x
    'no-unused-vars': 'off',
    'no-undef': 'off'
  },
  ignorePatterns: ['*.module.scss.ts', 'lib/**', 'dist/**']
};
