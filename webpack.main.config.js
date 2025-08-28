const path = require('path');

module.exports = [
  // Main process configuration
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/main/main.ts',
    target: 'electron-main',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: [/node_modules/, /\.test\.ts$/, /src\/test\//],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@main': path.resolve(__dirname, 'src/main'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@assets': path.resolve(__dirname, 'assets'),
      },
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  // Preload script configuration
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/main/preload.ts',
    target: 'electron-preload',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: [/node_modules/, /\.test\.ts$/, /src\/test\//],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
    node: {
      __dirname: false,
      __filename: false,
    },
  },
];
