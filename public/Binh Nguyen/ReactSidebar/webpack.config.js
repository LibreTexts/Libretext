import path from 'path';
import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

const dirName = path.dirname(fileURLToPath(import.meta.url));

export default {
  devtool: false,
  entry: path.resolve(dirName, 'src', 'pages', 'index.jsx'),
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        include: path.resolve(dirName, 'src'),
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: 'defaults',
              }],
              '@babel/preset-react',
            ],
          },
        }],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
  output: {
    path: path.resolve(dirName, 'build'),
    filename: 'sidebar.min.js',
  },
};
