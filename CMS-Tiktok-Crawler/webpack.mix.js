const mix = require('laravel-mix');
const path = require('path');
const fs = require('fs');

/**
 * =========================================================================
 * CMS MODULAR WEBPACK & LARAVEL MIX BUILD SYSTEM (CHUẨN UREKA - NO COPY)
 * =========================================================================
 * - Hỗ trợ build toàn bộ modules (all) hoặc từng module đơn lẻ (--env module=...).
 * - Tự động phát hiện tất cả các module trong thư mục modules/.
 * - Đóng gói dependencies dùng chung vào public/js/vendor.js và public/js/manifest.js.
 * - Xuất trực tiếp vào public/modules/{module}/ mà không cần copy hay script trung gian.
 */

// 1. Cấu hình thư mục Public gốc
mix.setPublicPath('public');
mix.options({
    runtimeChunkPath: 'js',
});

// 2. Danh sách dependencies dùng chung cần đóng gói vào vendor.js
const sharedVendors = [
    'react',
    'react-dom',
    'react-router-dom',
    'antd',
    '@ant-design/icons',
    'axios',
    '@reduxjs/toolkit',
    'react-redux',
];

// 3. Webpack Configuration với Babel loader cho TypeScript + React
mix.webpackConfig({
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',
                        ['@babel/preset-react', { runtime: 'automatic' }],
                        '@babel/preset-typescript',
                    ],
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            '@': path.resolve(__dirname, 'modules/Core/resources/js'),
            '@core': path.resolve(__dirname, 'modules/Core/resources/js'),
            '@modules': path.resolve(__dirname, 'modules'),
        },
    },
});

// 4. Helper phân tích tham số module mục tiêu
function getTargetModule() {
    if (process.env.MODULE) return process.env.MODULE.trim();
    if (process.env.npm_config_module) return process.env.npm_config_module.trim();

    for (let i = 0; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg.startsWith('--env.module=')) {
            return arg.split('=')[1].trim();
        }
        if (arg === '--env' && process.argv[i + 1] && process.argv[i + 1].startsWith('module=')) {
            return process.argv[i + 1].split('=')[1].trim();
        }
        if (arg.startsWith('--module=')) {
            return arg.split('=')[1].trim();
        }
        if (arg === '--module' && process.argv[i + 1]) {
            return process.argv[i + 1].trim();
        }
    }

    return 'all';
}

// 5. Helper tìm entry point JS/TS của module
function findJsEntry(modulePath) {
    const candidates = [
        'resources/js/index.ts',
        'resources/js/app.tsx',
        'resources/js/index.tsx',
        'resources/js/app.ts',
        'resources/js/index.js',
        'resources/js/app.js',
    ];

    for (const rel of candidates) {
        const full = path.join(modulePath, rel);
        if (fs.existsSync(full)) {
            return full;
        }
    }
    return null;
}

// 6. Helper tìm entry point CSS của module
function findCssEntry(modulePath, moduleName) {
    const lower = moduleName.toLowerCase();
    const candidates = [
        'resources/css/app.css',
        `resources/css/${lower}.css`,
        'resources/css/index.css',
    ];

    for (const rel of candidates) {
        const full = path.join(modulePath, rel);
        if (fs.existsSync(full)) {
            return full;
        }
    }
    return null;
}

// 7. Lấy danh sách tất cả các module trong thư mục modules/
const modulesDir = path.resolve(__dirname, 'modules');
const targetModule = getTargetModule().toLowerCase();

const allModuleNames = fs.existsSync(modulesDir)
    ? fs
          .readdirSync(modulesDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
    : [];

// Lọc module cần build
const modulesToBuild = allModuleNames.filter((name) => {
    if (targetModule === 'all') return true;
    return name.toLowerCase() === targetModule;
});

console.log(`[Laravel Mix] Target: ${targetModule.toUpperCase()} | Modules to compile: [${modulesToBuild.join(', ')}]`);

if (modulesToBuild.length === 0 && targetModule !== 'all') {
    console.warn(`[Laravel Mix] Warning: No matching module found for "${targetModule}". Available: ${allModuleNames.join(', ')}`);
}

// 8. Đăng ký compile cho từng module
modulesToBuild.forEach((name) => {
    const modPath = path.join(modulesDir, name);
    const lower = name.toLowerCase();

    // 8.1 Compile JS / TS
    const jsEntry = findJsEntry(modPath);
    if (jsEntry) {
        const jsOutput = name === 'Core'
            ? 'public/modules/core/js/app.js'
            : `public/modules/${lower}/js/${lower}.js`;

        mix.js(jsEntry, jsOutput);
    }

    // 8.2 Compile CSS (Tailwind PostCSS)
    const cssEntry = findCssEntry(modPath, name);
    if (cssEntry) {
        const cssOutput = name === 'Core'
            ? 'public/modules/core/css/app.css'
            : `public/modules/${lower}/css/${lower}.css`;

        mix.postCss(cssEntry, cssOutput, [require('@tailwindcss/postcss')]);
    }
});

// 9. Đóng gói dependencies dùng chung vào vendor.js
mix.extract(sharedVendors, 'public/js/vendor.js');

// 10. Production Versioning (cache busting)
if (mix.inProduction()) {
    mix.version();
}
