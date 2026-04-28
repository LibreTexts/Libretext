import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/pages/index.jsx',
  output: {
    file: 'build/sidebar.min.js',
    format: 'iife',
    sourcemap: false,
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    }),
    resolve({
      extensions: ['.js', '.jsx'],
      browser: true,
    }),
    commonjs(),
    postcss({
      inject: true,
      minimize: true,
    }),
    esbuild({
      target: 'es2020',
      jsx: 'transform',
      minify: true,
      legalComments: 'external',
    }),
  ],
};
