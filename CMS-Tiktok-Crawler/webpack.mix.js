'use strict';

/**
 * Laravel Mix (webpack) configuration for CMS TikTok Crawler (Ureka Modular Architecture)
 *
 * Mỗi module trong modules/<Name>/ biên dịch thành đúng 2 file:
 *     public/modules/<Name>/index.js
 *     public/modules/<Name>/app.css (nếu có CSS)
 * Riêng Core biên dịch thêm:
 *     public/modules/Core/vendor.js (chứa các thư viện dùng chung: react, antd, axios, redux,...)
 * File public/entrypoints.json chứa cấu trúc file để Blade DOM đúng module cần thiết.
 *
 * Lệnh chạy:
 *     npm run mix                       # Build toàn bộ modules
 *     npm run mix:crawler               # Chỉ build module Crawler
 *     npm run mix:tiktokaccount         # Chỉ build module TiktokAccount
 *     npm run mix:core                  # Chỉ build module Core
 *     npm run mix:module <Name>         # Build module tùy chọn (vd: npm run mix:module Crawler)
 *     npm run mix:prod                  # Build production
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const mix = require('laravel-mix');
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const { discoverModules, aliases, root, modulesDir } = require('./build/modules');
const EntrypointsPlugin = require('./build/EntrypointsPlugin');

// Vô hiệu hóa webpackbar bị lỗi schema trên webpack >= 5.10x
try {
    require('webpackbar').prototype.apply = function apply() {};
} catch {
    // Không cần xử lý nếu không có webpackbar
}

// 1. Lọc danh sách module cần build
const requested = (process.env.MIX_MODULES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const allModules = discoverModules();
// Core luôn được build vì CSS và React/vendor runtime của Core được dùng chung cho toàn bộ CMS
const selected = requested.length
    ? allModules.filter(
          (m) =>
              m.name.toLowerCase() === 'core' ||
              requested.includes(m.name.toLowerCase()) ||
              requested.includes(m.id.toLowerCase())
      )
    : allModules;

console.log(
    `[Laravel Mix] Build Target: ${
        requested.length ? requested.join(', ').toUpperCase() : 'ALL MODULES'
    } | Compiling: [${selected.map((m) => m.name).join(', ')}]`
);

// 2. Định nghĩa thư viện dùng chung gom vào Core/vendor.js
const VENDOR_TEST = /[\\/]node_modules[\\/](react|react-dom|scheduler|process|antd|@ant-design|@reduxjs|react-redux|axios|dayjs)[\\/]/;
const VENDOR_CHUNK = 'modules/Core/vendor';

mix.setPublicPath('public');
mix.disableNotifications();

mix.options({
    processCssUrls: false,
    terser: { extractComments: false },
});

mix.babelConfig({
    presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
    ],
});

// 3. Đăng ký compile cho từng module: index.js và app.css
for (const m of selected) {
    mix.js(m.entry, `${m.outDir}/index.js`);

    // Compile CSS của module nếu file resources/css/app.css tồn tại
    const cssPath = path.join(m.dir, 'resources/css/app.css');
    if (fs.existsSync(cssPath)) {
        mix.postCss(cssPath, `${m.outDir}/app.css`, [
            require('@tailwindcss/postcss')({ base: modulesDir }),
        ]);
    }
}

// 4. Cấu hình Webpack
mix.webpackConfig({
    resolve: {
        alias: aliases(),
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
    output: {
        publicPath: 'auto',
        chunkFilename: 'modules/Core/chunks/[name].js',
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                // Tắt các nhóm tự động chia vụn node_modules
                defaultVendors: false,
                default: false,
                // Gom duy nhất các thư viện nền tảng vào modules/Core/vendor.js
                vendor: {
                    test: VENDOR_TEST,
                    name: VENDOR_CHUNK,
                    chunks: 'all',
                    enforce: true,
                    priority: 20,
                },
            },
        },
    },
    plugins: [
        // Không sinh ra nhiều file chunk vụn vặt: gom toàn bộ code module vào duy nhất file index.js
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
        // Tạo file entrypoints.json để Laravel Blade DOM đúng module cần thiết
        new EntrypointsPlugin({
            file: path.join(root, 'public', 'entrypoints.json'),
        }),
    ],
    performance: { hints: false },
});

// Đảm bảo tên file CSS xuất ra luôn là app.css thay vì index.css
mix.override((config) => {
    for (const plugin of config.plugins) {
        if (plugin.constructor && plugin.constructor.name === 'MiniCssExtractPlugin') {
            plugin.options.filename = (pathData) => {
                const chunkName = (pathData.chunk && pathData.chunk.name) || '';
                return chunkName.replace(/\/index$/, '/app.css');
            };
        }
    }
});

if (mix.inProduction()) {
    mix.version();
}
