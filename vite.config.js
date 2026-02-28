import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: 'index.html',
                sw: 'sw.js'
            },
            output: {
                entryFileNames: assetInfo => {
                    return assetInfo.name === 'sw' ? '[name].js' : 'assets/[name]-[hash].js';
                }
            }
        },
        // Generate source maps for debugging production issues
        sourcemap: true,
        // Target modern browsers for smaller output
        target: 'es2020'
    },
    server: {
        port: 3001,
        open: true
    }
});
