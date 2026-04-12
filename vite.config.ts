import {resolve} from 'path';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: false,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
        preserveModules: true,
        banner: (chunk) => {
          if (chunk.fileName === 'cli.js') {
            return '#!/usr/bin/env node';
          }
          return '';
        },
      },
      external: [/^node:/, 'fs', 'path', 'os', 'util'],
    },
    outDir: 'lib',
    sourcemap: true,
    minify: false,
  },
});
