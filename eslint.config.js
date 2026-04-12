module.exports = [
  {
    files: [
      'app.js',
      'config/**/*.js',
      'constants/**/*.js',
      'mock/**/*.js',
      'pages/**/*.js',
      'services/**/*.js',
      'utils/**/*.js',
      'tests/**/*.js',
      'scripts/**/*.js'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        wx: 'readonly',
        getApp: 'readonly',
        getCurrentPages: 'readonly',
        App: 'readonly',
        Page: 'readonly',
        Component: 'readonly',
        Behavior: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-dupe-else-if': 'error',
      'no-redeclare': 'error',
      'valid-typeof': 'error'
    }
  }
]
