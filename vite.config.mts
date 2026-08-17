import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: true,
    rollupOptions: {
      external: ['markedit-api'],
      output: {
        // MarkEdit loads plain scripts; keep everything in one CJS file.
        inlineDynamicImports: true,
      },
    },
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
      fileName: () => 'markedit-pdf-export-pretty.cjs',
    },
  },
});
