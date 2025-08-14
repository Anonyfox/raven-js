#!/usr/bin/env node

import { build } from "esbuild";
import { statSync } from "fs";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { getPublicPackages, logPackages } from "./utils/package-filter.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const packagesDir = join(rootDir, "packages");
const bundlesDir = join(rootDir, "docs", "bundles");

/**
 * Build bundles for a single package
 * @param {string} packageName - Name of the package
 * @param {string} packagePath - Path to the package directory
 * @returns {Promise<boolean>} Success status
 */
async function buildPackageBundles(packageName, packagePath) {
	try {
		const packageJsonPath = join(packagePath, "package.json");
		const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

		// Get the main entry point
		let entryPoint = packageJson.main;
		if (!entryPoint && packageJson.exports && packageJson.exports["."]) {
			entryPoint = packageJson.exports["."].import || packageJson.exports["."];
		}
		if (!entryPoint) {
			entryPoint = "index.js";
		}
		const entryPath = join(packagePath, entryPoint);

		console.log(`Building bundles for ${packageName}...`);

		// CommonJS bundle
		await build({
			entryPoints: [entryPath],
			bundle: true,
			format: "cjs",
			outfile: join(bundlesDir, `raven-js-${packageName}.cjs`),
			minify: true,
			sourcemap: "external",
			target: "es2015",
			platform: "browser",
			globalName: `RavenJS_${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
		});

		// ESM bundle (development)
		await build({
			entryPoints: [entryPath],
			bundle: true,
			format: "esm",
			outfile: join(bundlesDir, `raven-js-${packageName}.esm.js`),
			minify: false,
			sourcemap: "external",
			target: "es2020",
			platform: "browser",
		});

		// ESM bundle (production)
		await build({
			entryPoints: [entryPath],
			bundle: true,
			format: "esm",
			outfile: join(bundlesDir, `raven-js-${packageName}.esm.min.js`),
			minify: true,
			sourcemap: "external",
			target: "es2020",
			platform: "browser",
			mangleProps: /^_/, // Mangle private properties
		});

		console.log(`✅ Built bundles for ${packageName}`);
		return true;
	} catch (error) {
		console.error(
			`❌ Failed to build bundles for ${packageName}:`,
			error.message,
		);
		return false;
	}
}

/**
 * Generate bundle manifest
 * @param {string[]} packages - Array of package names
 */
async function generateBundleManifest(packages) {
	const manifest = {
		generated: new Date().toISOString(),
		packages: packages.map((pkg) => ({
			name: pkg,
			bundles: {
				cjs: `raven-js-${pkg}.cjs`,
				esm: `raven-js-${pkg}.esm.js`,
				esmMin: `raven-js-${pkg}.esm.min.js`,
			},
		})),
	};

	await writeFile(
		join(bundlesDir, "manifest.json"),
		JSON.stringify(manifest, null, 2),
	);
}

/**
 * Generate usage examples HTML
 * @param {string[]} packages - Array of package names
 */
async function generateUsageExamples(packages) {
	let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RavenJS Bundles - Usage Examples</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .example { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .example h3 { margin-top: 0; color: #495057; }
        pre { background: #212529; color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .download-links { display: flex; gap: 10px; margin: 10px 0; }
        .download-links a { padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .download-links a:hover { background: #0056b3; }
        .package { border-bottom: 1px solid #dee2e6; padding: 20px 0; }
    </style>
</head>
<body>
    <h1>RavenJS Bundles</h1>
    <p>Pre-built, minified bundles for easy integration into your projects.</p>

    <h2>Available Packages</h2>`;

	for (const pkg of packages) {
		html += `
    <div class="package">
        <h3>${pkg}</h3>
        <div class="download-links">
            <a href="bundles/raven-js-${pkg}.cjs" download>CommonJS Bundle</a>
            <a href="bundles/raven-js-${pkg}.esm.js" download>ESM Bundle</a>
            <a href="bundles/raven-js-${pkg}.esm.min.js" download>ESM Minified</a>
        </div>

        <div class="example">
            <h4>CommonJS Usage (Traditional Script Tag)</h4>
            <pre><code>&lt;script src="https://ravenjs.dev/bundles/raven-js-${pkg}.cjs"&gt;&lt;/script&gt;
&lt;script&gt;
    // Access via global variable
    const component = new RavenJS_${pkg.charAt(0).toUpperCase() + pkg.slice(1)}.Component();
&lt;/script&gt;</code></pre>
        </div>

        <div class="example">
            <h4>ESM Usage (Modern Browser)</h4>
            <pre><code>&lt;script type="module"&gt;
    import { Component } from 'https://ravenjs.dev/bundles/raven-js-${pkg}.esm.js';

    const component = new Component();
&lt;/script&gt;</code></pre>
        </div>

        <div class="example">
            <h4>ESM Usage (Production)</h4>
            <pre><code>&lt;script type="module"&gt;
    import { Component } from 'https://ravenjs.dev/bundles/raven-js-${pkg}.esm.min.js';

    const component = new Component();
&lt;/script&gt;</code></pre>
        </div>
    </div>`;
	}

	html += `
</body>
</html>`;

	await writeFile(join(bundlesDir, "usage.html"), html);
}

/**
 * Main function
 */
async function main() {
	try {
		// Ensure bundles directory exists
		await mkdir(bundlesDir, { recursive: true });

		// Get public packages only
		const publicPackages = await getPublicPackages();
		logPackages(publicPackages, "Building bundles for");

		const validPackages = publicPackages.map((pkg) => pkg.name.split("/")[1]); // Extract package name from @raven-js/name

		console.log(
			`Found ${validPackages.length} public packages: ${validPackages.join(", ")}`,
		);

		// Build bundles for each package
		const results = await Promise.all(
			publicPackages.map((pkg) =>
				buildPackageBundles(pkg.name.split("/")[1], pkg.path),
			),
		);

		const successCount = results.filter(Boolean).length;
		console.log(
			`\n✅ Built bundles for ${successCount}/${validPackages.length} packages`,
		);

		if (successCount > 0) {
			// Generate manifest and usage examples
			await generateBundleManifest(validPackages);
			await generateUsageExamples(validPackages);
			console.log("📄 Generated bundle manifest and usage examples");
		}

		if (successCount < validPackages.length) {
			process.exit(1);
		}
	} catch (error) {
		console.error("❌ Bundle generation failed:", error);
		process.exit(1);
	}
}

main();
