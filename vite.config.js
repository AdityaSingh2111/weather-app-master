import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'index.html'
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
