import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'modules/Core/resources/css/app.css',
                'modules/Core/resources/js/app.tsx',
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './modules/Core/resources/js'),
            '@core': path.resolve(__dirname, './modules/Core/resources/js'),
            '@modules': path.resolve(__dirname, './modules'),
        },
    },

    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@ant-design/icons')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('antd') || id.includes('rc-')) {
                            return 'vendor-antd';
                        }
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('@reduxjs') || id.includes('react-redux')) {
                            return 'vendor-redux';
                        }
                        if (id.includes('axios')) {
                            return 'vendor-axios';
                        }
                        return 'vendor';
                    }
                },
            },
        },
    },

    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/admin/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});