import path from 'path';
import { fileURLToPath } from 'url';

const dirName = path.dirname(fileURLToPath(import.meta.url));

const baseConfig = {
  entry: path.resolve(dirName, 'index.js'),
  output: {
    path: path.resolve(dirName, 'dist'),
  },
};

export default function (_env, argv) {
  if (argv.mode === 'production') {
    baseConfig.output.filename = 'casbridge.min.js';
  }

  if (argv.mode === 'development') {
    baseConfig.output.filename = 'casbridge.dev.js';
  }

  return baseConfig;
}
