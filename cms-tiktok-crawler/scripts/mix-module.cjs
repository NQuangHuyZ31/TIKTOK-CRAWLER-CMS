#!/usr/bin/env node
const path = require('path');

const args = process.argv.slice(2);
const isDev = args.includes('--dev') || args.includes('--development');
const isProd = !isDev; // Mặc định chạy PRODUCTION để file được tối ưu hóa, minify và nhẹ nhất
const nonFlagArgs = args.filter((a) => !a.startsWith('-'));
const moduleName = nonFlagArgs[0] || 'all';

process.env.NODE_ENV = isProd ? 'production' : 'development';
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
	process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=8192`.trim();
}

console.log(`\n======================================================`);
console.log(` CMS TikTok Crawler - Modular Build Runner (CMS Tiktok Crawler)`);
console.log(` Target Module : ${moduleName.toUpperCase()}`);
console.log(` Environment   : ${isProd ? 'PRODUCTION (Optimized & Minified)' : 'DEVELOPMENT'}`);
console.log(`======================================================\n`);

// Thiết lập MIX_MODULES để webpack.mix.js lọc đúng module cần build
process.env.MIX_MODULES = moduleName.toLowerCase() === 'all' ? '' : moduleName;

// Đảm bảo node_modules/.bin có trong PATH
const binDir = path.resolve(__dirname, '../node_modules/.bin');
process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ''}`;

// Chuyển tiếp argv cho Laravel Mix CLI trong cùng 1 process để tối ưu bộ nhớ
process.argv = [process.argv[0], path.resolve(__dirname, '../node_modules/laravel-mix/bin/cli.js')];
if (isProd) {
	process.argv.push('--production');
}

require('../node_modules/laravel-mix/bin/cli.js');
