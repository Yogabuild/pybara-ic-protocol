import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'PybaraSDK',
      fileName: 'pybara-sdk',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        '@dfinity/agent',
        '@dfinity/principal',
        '@dfinity/identity',
        '@dfinity/auth-client',
        '@dfinity/candid',
        '@dfinity/oisy-wallet-signer/icrc-wallet'
      ],
      output: {
        globals: {
          '@dfinity/agent': 'DfinityAgent',
          '@dfinity/principal': 'DfinityPrincipal'
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.debug'],
      },
      format: {
        comments: false,
      }
    }
  }
});

