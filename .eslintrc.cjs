/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-strongly-recommended',
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript'
  ],
  "env": {
    "node": true,
    "browser": true
  },
  rules: {
    'vue/no-reserved-component-names': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/component-definition-name-casing': 'error',
    'vue/component-name-in-template-casing': 'error',
    'vue/custom-event-name-casing': 'error',
    'vue/no-spaces-around-equal-signs-in-attribute': 'error',
    'vue/mustache-interpolation-spacing': 'error',
    'vue/html-closing-bracket-newline': 'error',
    'vue/html-closing-bracket-spacing': 'error',
    'vue/html-quotes': 'error',
    'vue/require-prop-types': 'error',
    'vue/require-default-prop': 'error',
    'vue/prop-name-casing': 'error',
    'vue/v-slot-style': 'error',
    'vue/v-bind-style': 'error',
    'vue/v-on-style': 'error',
    'no-debugger': 'error',
    'no-dupe-args': 'error',
    'no-dupe-keys': 'error',
    'no-empty': 'warn',
    'no-alert': 'error',
    'eqeqeq': 'error',
    'no-shadow': 'error',
    'no-var': 'error',
    'no-dupe-class-members': 'error',
    'new-cap': 'off',
  },
  globals: {
  },
  parserOptions: {
    ecmaVersion: 'latest'
  }
}
