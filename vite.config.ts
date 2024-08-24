import { defineConfig } from 'vite';    
import glsl from 'vite-plugin-glsl';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        glsl(),
        nodePolyfills(),
    ],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: 'src/main.ts',
            output: {
                entryFileNames: 'main.js',
            },
        },
    },
    assetsInclude: [
        '/assets/models/*.vox',
    ],
});