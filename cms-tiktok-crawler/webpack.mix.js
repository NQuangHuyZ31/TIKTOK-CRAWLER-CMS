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
const StableVendorIdsPlugin = require('./build/StableVendorIdsPlugin');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Nạp và expand biến môi trường từ file .env
try {
	dotenvExpand(dotenv.config({ path: path.join(root, '.env') }));
} catch {
	// Bỏ qua nếu không có file .env
}

// Vô hiệu hóa webpackbar bị lỗi schema trên webpack >= 5.10x
try {
	require('webpackbar').prototype.apply = function apply() {};
} catch {
	// Không cần xử lý nếu không có webpackbar
}

// 1. Quét danh sách module cần build
const requested = (process.env.MIX_MODULES || '')
	.split(',')
	.map((s) => s.trim().toLowerCase())
	.filter(Boolean);

const allModules = discoverModules();

// Core luôn được build vì CSS và React/vendor runtime của Core được dùng chung cho toàn bộ CMS
// Kết hợp StableVendorIdsPlugin để đảm bảo module IDs của vendor.js luôn bất biến, không làm hỏng module khác.
const selected = requested.length ? allModules.filter((m) => m.name.toLowerCase() === 'core' || requested.includes(m.name.toLowerCase()) || requested.includes(m.id.toLowerCase())) : allModules;

console.log(`[Laravel Mix] Build Target: ${requested.length ? requested.join(', ').toUpperCase() : 'ALL MODULES'} | Compiling: [${selected.map((m) => m.name).join(', ')}]`);

// Bảo toàn và gộp mix-manifest.json: không bao giờ xóa các module khác khi build lẻ
const Mix = require('laravel-mix/src/Mix');
const mixManifest = Mix.primary.manifest;
const manifestPath = path.join(root, 'public', 'mix-manifest.json');
if (fs.existsSync(manifestPath)) {
	try {
		const existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		mixManifest.manifest = { ...existingManifest };
	} catch {
		// bỏ qua nếu file rỗng hoặc lỗi parse
	}
}

function safeWriteFileSync(filePath, content, retries = 5, delayMs = 150) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			fs.mkdirSync(path.dirname(filePath), { recursive: true });
			fs.writeFileSync(filePath, content, 'utf8');
			return;
		} catch (err) {
			if (attempt === retries) throw err;
			const stop = Date.now() + delayMs;
			while (Date.now() < stop) {}
		}
	}
}

mixManifest.refresh = function () {
	const manifestFile = this.path();
	if (!manifestFile) return this;

	let existing = {};
	if (fs.existsSync(manifestFile)) {
		try {
			existing = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
		} catch {
			existing = {};
		}
	}

	// Gộp các entry cũ với các entry vừa build xong
	this.manifest = { ...existing, ...this.manifest };

	// Đảm bảo mọi module đã từng build trong public/modules/ đều có mặt trong mix-manifest
	const publicModulesDir = path.join(root, 'public', 'modules');
	if (fs.existsSync(publicModulesDir)) {
		const moduleDirs = fs
			.readdirSync(publicModulesDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name);

		for (const mod of moduleDirs) {
			const jsKey = `/modules/${mod}/index.js`;
			const jsFile = path.join(publicModulesDir, mod, 'index.js');
			if (fs.existsSync(jsFile) && !this.manifest[jsKey]) {
				this.manifest[jsKey] = jsKey;
			}

			const cssKey = `/modules/${mod}/app.css`;
			const cssFile = path.join(publicModulesDir, mod, 'app.css');
			if (fs.existsSync(cssFile) && !this.manifest[cssKey]) {
				this.manifest[cssKey] = cssKey;
			}
		}
	}

	safeWriteFileSync(manifestFile, JSON.stringify(this.manifest, null, 4));

	// Đồng bộ phiên bản cache-busting (?id=...) sang public/entrypoints.json
	const entrypointsPath = path.join(root, 'public', 'entrypoints.json');
	if (fs.existsSync(entrypointsPath)) {
		try {
			const entrypoints = JSON.parse(fs.readFileSync(entrypointsPath, 'utf8'));
			let modified = false;

			const resolveVersioned = (filePath) => {
				if (!filePath || typeof filePath !== 'string') return filePath;
				const clean = filePath.split('?')[0];
				const key = clean.startsWith('/') ? clean : `/${clean}`;
				return this.manifest[key] || filePath;
			};

			for (const modName of Object.keys(entrypoints)) {
				if (Array.isArray(entrypoints[modName].js)) {
					entrypoints[modName].js = entrypoints[modName].js.map(resolveVersioned);
					modified = true;
				}
				if (Array.isArray(entrypoints[modName].css)) {
					entrypoints[modName].css = entrypoints[modName].css.map(resolveVersioned);
					modified = true;
				}
			}

			if (modified) {
				safeWriteFileSync(entrypointsPath, JSON.stringify(entrypoints, null, 2));
			}
		} catch {
			// Bỏ qua nếu chưa parse được
		}
	}

	return this;
};

// 2. Định nghĩa thư viện dùng chung gom vào Core/vendor.js
// Kết hợp StableVendorIdsPlugin (chuẩn Ureka) để cố định module ID theo path, chống lệch ID giữa các lần build
const VENDOR_TEST = /[\\/]node_modules[\\/]/;
const VENDOR_CHUNK = 'modules/Core/vendor';

mix.setPublicPath('public');
mix.disableNotifications();

mix.options({
	processCssUrls: false,
	terser: {
		extractComments: false,
		parallel: false,
	},
});

mix.babelConfig({
	presets: [['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
});

// 3. Đăng ký compile cho từng module: index.js và app.css
for (const m of selected) {
	mix.js(m.entry, `${m.outDir}/index.js`);

	// Compile CSS của module nếu file resources/css/app.css tồn tại
	const cssPath = path.join(m.dir, 'resources/css/app.css');
	if (fs.existsSync(cssPath)) {
		mix.postCss(cssPath, `${m.outDir}/app.css`, [require('@tailwindcss/postcss')({ base: modulesDir })]);
	}
}

// 4. Cấu hình Webpack
mix.webpackConfig({
	cache: {
		type: 'filesystem',
	},
	resolve: {
		alias: aliases(),
		extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
	},
	output: {
		publicPath: 'auto',
		uniqueName: 'cms_tiktok_crawler',
		chunkLoadingGlobal: 'webpackChunk_cms_tiktok_crawler',
		chunkFilename: 'modules/Core/chunks/[name].js',
	},
	optimization: {
		moduleIds: mix.inProduction() ? 'deterministic' : 'named',
		runtimeChunk: {
			name: VENDOR_CHUNK,
		},
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
		new StableVendorIdsPlugin({
			test: VENDOR_TEST,
			chunks: [VENDOR_CHUNK],
		}),
		new webpack.DefinePlugin({
			'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || process.env.MIX_API_URL || ''),
			'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || process.env.MIX_API_URL || ''),
		}),
		// Tạo file entrypoints.json để Laravel Blade DOM đúng module cần thiết
		new EntrypointsPlugin({
			file: path.join(root, 'public', 'entrypoints.json'),
		}),
	],
	performance: { hints: false },
});

// Đảm bảo tên file CSS xuất ra luôn là app.css thay vì index hoặc thiếu đuôi .css
mix.override((config) => {
	for (const plugin of config.plugins) {
		if (plugin.constructor && plugin.constructor.name === 'MiniCssExtractPlugin') {
			plugin.options.filename = (pathData) => {
				const chunkName = (pathData.chunk && pathData.chunk.name) || '';
				if (chunkName.endsWith('.css')) return chunkName;
				const base = chunkName.replace(/\/(index|app)$/, '');
				return `${base}/app.css`;
			};
		}
	}
});

if (mix.inProduction()) {
	mix.version();
}
