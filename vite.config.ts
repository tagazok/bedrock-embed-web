import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
    build: {
        outDir: './dist',
        emptyOutDir: true,
        lib: {
            // eslint-disable-next-line unicorn/prefer-module
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'aws-br-embed',
            fileName: 'aws-br-embed'
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true
            }
            // external: Object.keys(pkg.dependencies || {}),
            // external: [
            //     "@aws-sdk/client-cognito-identity",
            //     "@aws-sdk/client-qbusiness",
            //     "@aws-sdk/client-sts"
            // ]
        },
    },
    server: {
        proxy: {
            '/chat': 'http://127.0.0.1:3000',
        },
    },
});