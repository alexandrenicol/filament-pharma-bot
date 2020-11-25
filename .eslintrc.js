module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          // TODO: enable this once BLSP-598 is done...
          // '**/nrwl/*',
          '**/node_modules/*',
          // TODO: enable **/lib/* later? - discuss with Ross
          // '**/lib/*',
          '**/apps/*',
          // Block this list of all project folders - these need to be updated as new projects are added
          // ...current first
          '**/notification/src/*',
          '**/smarthome/*',
          '**/smartplus-api/src/*',
          // ...then future (after root /apps/ folder refactor)
          '**/smarthomestore/*',
          '**/smartplus/*',
          // block use of root-based imports (which fail anyway in Lambdas)
          'apps/*',
          'libs/*',
        ],
      },
    ],
    // TODO: Enable the following options to clean up code - turned off now to get this working for BLSP-599
    'no-case-declarations': ['off'],
    'no-async-promise-executor': ['off'],
    'no-useless-escape': ['off'],
    'no-empty': ['off'],
    'require-atomic-updates': ['off'],
    'no-prototype-builtins': ['off'],
    'no-extra-boolean-cast': ['off'],
    'no-unused-vars': ['off'],
    'prefer-const': ['off'],
    '@typescript-eslint/explicit-function-return-type': ['off'],
    '@typescript-eslint/no-use-before-define': ['off'],
    '@typescript-eslint/camelcase': ['off'],
    '@typescript-eslint/no-inferrable-types': ['off'],
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/no-var-requires': ['off'],
    '@typescript-eslint/no-empty-function': ['off'],
    '@typescript-eslint/ban-types': ['off'],
    // TODO: Discuss! Tom recommends these turned off
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/consistent-type-assertions': ['off'],
    '@typescript-eslint/no-empty-interface': ['off'],
    '@typescript-eslint/ban-ts-ignore': ['off'],
  },
};
