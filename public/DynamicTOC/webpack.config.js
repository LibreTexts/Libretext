import path from 'path';
import { fileURLToPath } from 'url';

const dirName = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: path.resolve(dirName, 'dynamicTOC.js'),
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  output: {
    path: path.resolve(dirName, 'dist'),
    filename: 'dynamicTOC.min.js',
  },
};
