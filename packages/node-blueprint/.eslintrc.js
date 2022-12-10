module.exports = {
  root: true,
  env: {
    "browser": true,
    "node": true,
    "commonjs": true
  },
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    parser: '@typescript-eslint/parser'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-underscore-dangle': 'off',
    'no-var': 'error',
    "no-alert": 'error',
    "no-dupe-keys": 'error',
    "no-duplicate-case": 'error',
    "no-dupe-args": 'error',
    "no-extra-semi": 'error',
    "no-spaced-func": 'off',
    "no-undef": 'warn',
    'no-use-before-define': 'off',
    "comma-style": [2, "last"],
  }
}
