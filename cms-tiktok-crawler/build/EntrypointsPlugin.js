'use strict';

const fs = require('fs');
const path = require('path');

/**
 * EntrypointsPlugin:
 * Collects compiled JS & CSS files for each module entrypoint
 * and writes a single public/entrypoints.json file
 * so Laravel Blade can DOM only the required assets for each request.
 */
class EntrypointsPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tap('EntrypointsPlugin', (compilation) => {
            const outputPath = compiler.options.output.path || path.resolve('public');
            const entrypointsFile = this.options.file || path.join(outputPath, 'entrypoints.json');

            // Read existing entries if doing a partial build
            let existing = {};
            if (fs.existsSync(entrypointsFile)) {
                try {
                    existing = JSON.parse(fs.readFileSync(entrypointsFile, 'utf-8'));
                } catch {
                    existing = {};
                }
            }

            // Only keep clean keys (without leading slash)
            const current = {};
            for (const key of Object.keys(existing)) {
                if (!key.startsWith('/')) {
                    current[key] = existing[key];
                }
            }

            for (const [entryName, entrypoint] of compilation.entrypoints.entries()) {
                const files = entrypoint.getFiles ? entrypoint.getFiles() : [];

                // Clean entry name: e.g. "modules/Core/index" -> "Core"
                const cleanName = entryName.replace(/^\/+/, '');
                const parts = cleanName.split('/');
                const moduleName = parts.length > 1 ? parts[1] : parts[0];

                let js = files
                    .filter((f) => f.endsWith('.js') && !f.includes('hot-update'))
                    .map((f) => (f.startsWith('/') ? f : `/${f.replace(/\\/g, '/')}`));

                const css = files
                    .filter((f) => f.endsWith('.css') && !f.includes('hot-update'))
                    .map((f) => (f.startsWith('/') ? f : `/${f.replace(/\\/g, '/')}`));

                if (moduleName.toLowerCase() === 'core') {
                    // Core always includes vendor.js first, then index.js
                    const vendorFile = '/modules/Core/vendor.js';
                    const coreIndex = '/modules/Core/index.js';
                    js = [vendorFile, coreIndex].filter((f) =>
                        fs.existsSync(path.join(outputPath, f.replace(/^\//, '')))
                    );
                } else {
                    // Module only needs its own index.js (vendor is loaded by Core)
                    const modIndex = `/modules/${moduleName}/index.js`;
                    js = js.filter((f) => f.toLowerCase() === modIndex.toLowerCase());
                    if (js.length === 0 && fs.existsSync(path.join(outputPath, modIndex.replace(/^\//, '')))) {
                        js = [modIndex];
                    }
                }

                // Custom route slug mapping
                let slug = moduleName.toLowerCase();
                if (slug === 'tiktokaccount') slug = 'tiktok-account';

                const routePrefix =
                    moduleName.toLowerCase() === 'core' ? 'admin' : `admin/${slug}`;

                current[moduleName] = {
                    name: moduleName,
                    route_prefix: routePrefix,
                    js,
                    css,
                };
            }

            const jsonStr = JSON.stringify(current, null, 2);
            fs.mkdirSync(path.dirname(entrypointsFile), { recursive: true });
            fs.writeFileSync(entrypointsFile, jsonStr, 'utf-8');

            console.log(`[EntrypointsPlugin] Generated ${entrypointsFile}`);
        });
    }
}

module.exports = EntrypointsPlugin;
