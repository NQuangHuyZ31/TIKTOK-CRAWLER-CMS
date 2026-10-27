'use strict';

const path = require('path');

/**
 * StableVendorIdsPlugin (inspired by Ureka Modular Architecture):
 *
 * Assigns immutable, path-based IDs to vendor modules and chunks so that
 * a partial build (e.g. `npm run mix:user`) never changes module IDs or chunk IDs
 * of untouched modules previously built on disk.
 *
 * Why:
 * Every page loads `public/modules/Core/vendor.js` alongside each module's `index.js`.
 * Webpack's default "deterministic" algorithm hashes module IDs based on the module set
 * of that specific compilation graph. When building only `User`, Webpack renumbers IDs,
 * causing untouched modules (`Crawler`, `TiktokAccount`, etc.) to fail with:
 * `Uncaught TypeError: r[e] is not a function`.
 *
 * By giving every vendor module a stable relative path ID (e.g. "react/index.js", "antd/es/table/index.js")
 * and giving named chunks their own name as chunk ID, module IDs remain 100% stable across all builds.
 */
class StableVendorIdsPlugin {
	/**
	 * @param {{ test?: RegExp, chunks?: string[] }} options
	 */
	constructor(options = {}) {
		this.test = options.test || /[\\/]node_modules[\\/]/;
		this.chunks = options.chunks || ['modules/Core/vendor'];
	}

	apply(compiler) {
		compiler.hooks.compilation.tap('StableVendorIdsPlugin', (compilation) => {
			compilation.hooks.moduleIds.tap('StableVendorIdsPlugin', (modules) => {
				const { chunkGraph } = compilation;
				for (const module of modules) {
					const resource = module.resource || (module.nameForCondition && module.nameForCondition());
					if (!resource || chunkGraph.getModuleId(module) !== null) continue;

					// Bỏ qua các file CSS / Style / Assets để tránh xung đột giữa css-loader và style-loader
					// (css-loader và style-loader có cùng module.resource, nếu gán cùng ID sẽ khiến style-loader tự require chính nó và lỗi `reading locals`)
					const cleanPath = resource.split('?')[0];
					if (/\.(css|scss|less|sass|svg|png|jpe?g|gif|webp|woff2?|eot|ttf|otf)$/i.test(cleanPath)) {
						continue;
					}

					const normalized = resource.replace(/\\/g, '/');
					let id = null;

					if (normalized.includes('/node_modules/')) {
						id = normalized.split('/node_modules/').pop();
					} else if (normalized.includes('/modules/')) {
						id = 'modules/' + normalized.split('/modules/').pop();
					}

					if (id) {
						chunkGraph.setModuleId(module, id);
					}
				}
			});

			compilation.hooks.chunkIds.tap('StableVendorIdsPlugin', (chunks) => {
				for (const chunk of chunks) {
					const name = (chunk.name || '').replace(/^\/+/, '');
					if (chunk.id === null && name) {
						chunk.id = name;
						chunk.ids = [name];
					}
				}
			});
		});
	}
}

module.exports = StableVendorIdsPlugin;
