import path from 'path';
import { fileURLToPath } from 'url';

const dirName = path.dirname(fileURLToPath(import.meta.url));

const baseConfig = {
  entry: path.resolve(dirName, 'index.js'),
  output: {
    path: path.resolve(dirName, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
};

export default function (_env, argv) {
  if (argv.mode === 'production') {
    baseConfig.output.filename = 'bookcreator.min.js';
  }

  if (argv.mode === 'development') {
    baseConfig.output.filename = 'bookcreator.dev.js';
  }

  return baseConfig;
}
