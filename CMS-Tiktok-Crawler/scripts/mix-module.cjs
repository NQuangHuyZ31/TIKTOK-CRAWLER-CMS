#!/usr/bin/env node
const path = require('path');

// Lấy tham số module
const args = process.argv.slice(2);
const isProd = args.includes('--production') || args.includes('--prod');
const nonFlagArgs = args.filter((a) => !a.startsWith('-'));
const moduleName = nonFlagArgs[0] || 'all';

console.log(`\n======================================================`);
console.log(` CMS TikTok Crawler - Modular Build Runner`);
console.log(` Target Module : ${moduleName.toUpperCase()}`);
console.log(` Environment   : ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`======================================================\n`);

process.env.MODULE = moduleName;

// Đảm bảo node_modules/.bin có trong PATH
const binDir = path.resolve(__dirname, '../node_modules/.bin');
process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ''}`;

// Chuyển tiếp argv cho Laravel Mix CLI trong cùng 1 process để tối ưu bộ nhớ
process.argv = [process.argv[0], path.resolve(__dirname, '../node_modules/laravel-mix/bin/cli.js')];
if (isProd) {
    process.argv.push('--production');
}

require('../node_modules/laravel-mix/bin/cli.js');
