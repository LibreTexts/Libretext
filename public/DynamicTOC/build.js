import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const dirName = path.dirname(fileURLToPath(import.meta.url));

/**
 * esbuild plugin that imports `.css` files as minified text strings so styles
 * can be injected at runtime. This mirrors the old style-loader behaviour and
 * keeps the build a single, self-contained output file that pages can drop in
 * with one script tag.
 */
const cssTextPlugin = {
  name: 'css-text',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = await readFile(args.path, 'utf8');
      const { code } = await esbuild.transform(source, {
        loader: 'css',
        minify: true,
      });
      return { contents: code, loader: 'text' };
    });
  },
};

await esbuild.build({
  entryPoints: [path.resolve(dirName, 'dynamicTOC.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: path.resolve(dirName, 'dist', 'dynamic-toc.min.js'),
  plugins: [cssTextPlugin],
});
