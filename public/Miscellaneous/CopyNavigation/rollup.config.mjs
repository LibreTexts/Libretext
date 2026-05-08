import esbuild from 'rollup-plugin-esbuild';

export default {
  input: 'copyNavigation.js',
  output: {
    file: 'build/copyNavigation.min.js',
    format: 'iife',
    sourcemap: false,
  },
  plugins: [
    esbuild({
      target: 'es2020',
      minify: true,
      legalComments: 'external',
    }),
  ],
};
