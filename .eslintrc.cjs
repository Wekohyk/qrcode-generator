module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    // typescript
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    // vue
    'plugin:vue/vue3-essential',
    // flyer 声明的全局配置
    // './node_modules/@gly/flyer/src/storm-mini-program/.eslintrc.cjs',
    // prettier
    'prettier',
  ],
  overrides: [],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    /**
     * typescript-eslint/parser ---> is a parser that allows ESLint to lint TypeScript code.
     * npm i @typescript-eslint/parser -D
     */
    parser: '@typescript-eslint/parser',
  },
  plugins: ['vue', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    // any不进行校验
    '@typescript-eslint/no-explicit-any': 'off',
  },
  // globals --> Define global variables
  globals: {
    // vue3 setup 的编译器语法糖
    defineProps: false,
    defineEmits: false,
    useAttrs: false,
    useSlots: false,
    ErrData: false,
  },
};
