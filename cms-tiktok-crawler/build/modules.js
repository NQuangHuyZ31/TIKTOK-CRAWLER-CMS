'use strict';

const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const modulesDir = path.resolve(root, 'modules');

/**
 * Auto-discover all modules in modules/ that have a JS/TS entry point.
 */
function discoverModules() {
    if (!fs.existsSync(modulesDir)) return [];

    const dirs = fs
        .readdirSync(modulesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

    const modules = [];

    for (const name of dirs) {
        const modDir = path.join(modulesDir, name);
        const candidates = [
            'resources/js/app.tsx',
            'resources/js/index.ts',
            'resources/js/index.tsx',
            'resources/js/app.ts',
        ];

        let entry = null;
        for (const rel of candidates) {
            const full = path.join(modDir, rel);
            if (fs.existsSync(full)) {
                entry = full;
                break;
            }
        }

        if (entry) {
            modules.push({
                id: `modules/${name}`,
                name,
                entry,
                dir: modDir,
                outDir: `modules/${name}`,
            });
        }
    }

    return modules;
}

/**
 * Path aliases for Webpack.
 */
function aliases() {
    return {
        '@': path.resolve(modulesDir, 'Core/resources/js'),
        '@core': path.resolve(modulesDir, 'Core/resources/js'),
        '@modules': modulesDir,
        '@crawler': path.resolve(modulesDir, 'Crawler/resources/js'),
        '@auth': path.resolve(modulesDir, 'Auth/resources/js'),
        '@tiktok': path.resolve(modulesDir, 'TiktokAccount/resources/js'),
        '@user': path.resolve(modulesDir, 'User/resources/js'),
        '@system': path.resolve(modulesDir, 'System/resources/js'),
    };
}

module.exports = {
    root,
    modulesDir,
    discoverModules,
    aliases,
};
