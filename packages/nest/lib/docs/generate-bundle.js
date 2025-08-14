/**
 * @fileoverview Generate bundles for packages using esbuild
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

/**
 * Get entry point for a package
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {string|null} Entry point path or null if not found
 */
export function getBundleEntryPoint(folder) {
	try {
		const packageJsonContent = folder.getFile("package.json");
		if (!packageJsonContent) {
			return null;
		}

		const packageJson = JSON.parse(packageJsonContent);

		// Get the main entry point
		let entryPoint = packageJson.main;
		if (!entryPoint && packageJson.exports && packageJson.exports["."]) {
			entryPoint = packageJson.exports["."].import || packageJson.exports["."];
		}
		if (!entryPoint) {
			entryPoint = "index.js";
		}

		// Check if the entry point exists in the folder
		// Remove leading ./ if present for comparison
		const normalizedEntryPoint = entryPoint.replace(/^\.\//, "");
		if (!folder.hasFile(normalizedEntryPoint)) {
			return null;
		}

		return normalizedEntryPoint;
	} catch {
		return null;
	}
}

/**
 * Generate CommonJS bundle
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @param {string} packageName - Name of the package for global variable
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateCommonJSBundle(folder, packageName) {
	try {
		const entryPoint = getBundleEntryPoint(folder);
		if (!entryPoint) {
			return null;
		}

		// For test environments where rootPath might be null, use a virtual filesystem approach
		if (!folder.rootPath) {
			// Create a virtual filesystem for esbuild
			const virtualFS = /** @type {Record<string, string>} */ ({});
			for (const filePath of folder.getFilePaths()) {
				const content = folder.getFile(filePath);
				if (content !== undefined) {
					virtualFS[filePath] = content;
				}
			}

			const result = await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "iife",
				minify: true,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				globalName: `RavenJS_${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
				write: false,
				plugins: [
					{
						name: "virtual-fs",
						setup(build) {
							build.onResolve({ filter: /.*/ }, (args) => {
								// Handle relative imports
								let resolvedPath = args.path;

								// If it's a relative import, resolve it relative to the importer
								if (args.path.startsWith("./") || args.path.startsWith("../")) {
									const importerDir = args.importer
										? args.importer.split("/").slice(0, -1).join("/")
										: "";
									resolvedPath = importerDir
										? `${importerDir}/${args.path}`
										: args.path;
								}

								// Try exact match first
								if (virtualFS[resolvedPath]) {
									return { path: resolvedPath, namespace: "virtual" };
								}

								// Try with .js extension
								if (virtualFS[`${resolvedPath}.js`]) {
									return { path: `${resolvedPath}.js`, namespace: "virtual" };
								}

								// Try index.js in directory
								if (virtualFS[`${resolvedPath}/index.js`]) {
									return {
										path: `${resolvedPath}/index.js`,
										namespace: "virtual",
									};
								}

								return null;
							});
							build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
								return { contents: virtualFS[args.path] };
							});
						},
					},
				],
			});

			const outputFile = result.outputFiles?.[0];
			const sourceMapFile = result.outputFiles?.[1];
			return outputFile
				? {
						code: outputFile.text,
						map: sourceMapFile?.text || "",
					}
				: null;
		}

		// Use the actual filesystem since the package folder is already loaded
		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "iife",
				minify: true,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				globalName: `RavenJS_${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
				outfile: outFile,
				absWorkingDir: folder.rootPath,
			});

			// Read the generated files
			const code = readFileSync(outFile, "utf8");
			const mapFile = `${outFile}.map`;
			const map = readFileSync(mapFile, "utf8");

			return {
				code,
				map,
			};
		} finally {
			// Clean up temporary directory
			rmSync(tempDir, { recursive: true, force: true });
		}
	} catch {
		return null;
	}
}

/**
 * Generate CommonJS bundle (minified)
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @param {string} packageName - Name of the package for global variable
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateCommonJSMinifiedBundle(folder, packageName) {
	try {
		const entryPoint = getBundleEntryPoint(folder);
		if (!entryPoint) {
			return null;
		}

		// For test environments where rootPath might be null, use a virtual filesystem approach
		if (!folder.rootPath) {
			// Create a virtual filesystem for esbuild
			const virtualFS = /** @type {Record<string, string>} */ ({});
			for (const filePath of folder.getFilePaths()) {
				const content = folder.getFile(filePath);
				if (content !== undefined) {
					virtualFS[filePath] = content;
				}
			}

			const result = await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "iife",
				minify: true,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				globalName: `RavenJS_${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
				write: false,
				plugins: [
					{
						name: "virtual-fs",
						setup(build) {
							build.onResolve({ filter: /.*/ }, (args) => {
								// Handle relative imports
								let resolvedPath = args.path;

								// If it's a relative import, resolve it relative to the importer
								if (args.path.startsWith("./") || args.path.startsWith("../")) {
									const importerDir = args.importer
										? args.importer.split("/").slice(0, -1).join("/")
										: "";
									resolvedPath = importerDir
										? `${importerDir}/${args.path}`
										: args.path;
								}

								// Try exact match first
								if (virtualFS[resolvedPath]) {
									return { path: resolvedPath, namespace: "virtual" };
								}

								// Try with .js extension
								if (virtualFS[`${resolvedPath}.js`]) {
									return { path: `${resolvedPath}.js`, namespace: "virtual" };
								}

								// Try index.js in directory
								if (virtualFS[`${resolvedPath}/index.js`]) {
									return {
										path: `${resolvedPath}/index.js`,
										namespace: "virtual",
									};
								}

								return null;
							});
							build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
								return { contents: virtualFS[args.path] };
							});
						},
					},
				],
			});

			const outputFile = result.outputFiles?.[0];
			const sourceMapFile = result.outputFiles?.[1];
			return outputFile
				? {
						code: outputFile.text,
						map: sourceMapFile?.text || "",
					}
				: null;
		}

		// Use the actual filesystem since the package folder is already loaded
		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "iife",
				minify: true,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				globalName: `RavenJS_${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
				outfile: outFile,
				absWorkingDir: folder.rootPath,
			});

			// Read the generated files
			const code = readFileSync(outFile, "utf8");
			const mapFile = `${outFile}.map`;
			const map = readFileSync(mapFile, "utf8");

			return {
				code,
				map,
			};
		} finally {
			// Clean up temporary directory
			rmSync(tempDir, { recursive: true, force: true });
		}
	} catch {
		return null;
	}
}

/**
 * Generate ESM bundle (development)
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateESMBundle(folder) {
	try {
		const entryPoint = getBundleEntryPoint(folder);
		if (!entryPoint) {
			return null;
		}

		// For test environments where rootPath might be null, use a virtual filesystem approach
		if (!folder.rootPath) {
			// Create a virtual filesystem for esbuild
			const virtualFS = /** @type {Record<string, string>} */ ({});
			for (const filePath of folder.getFilePaths()) {
				const content = folder.getFile(filePath);
				if (content !== undefined) {
					virtualFS[filePath] = content;
				}
			}

			const result = await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "esm",
				minify: false,
				sourcemap: true,
				target: "es2020",
				platform: "browser",
				write: false,
				plugins: [
					{
						name: "virtual-fs",
						setup(build) {
							build.onResolve({ filter: /.*/ }, (args) => {
								// Handle relative imports
								let resolvedPath = args.path;

								// If it's a relative import, resolve it relative to the importer
								if (args.path.startsWith("./") || args.path.startsWith("../")) {
									const importerDir = args.importer
										? args.importer.split("/").slice(0, -1).join("/")
										: "";
									resolvedPath = importerDir
										? `${importerDir}/${args.path}`
										: args.path;
								}

								// Try exact match first
								if (virtualFS[resolvedPath]) {
									return { path: resolvedPath, namespace: "virtual" };
								}

								// Try with .js extension
								if (virtualFS[`${resolvedPath}.js`]) {
									return { path: `${resolvedPath}.js`, namespace: "virtual" };
								}

								// Try index.js in directory
								if (virtualFS[`${resolvedPath}/index.js`]) {
									return {
										path: `${resolvedPath}/index.js`,
										namespace: "virtual",
									};
								}

								return null;
							});
							build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
								return { contents: virtualFS[args.path] };
							});
						},
					},
				],
			});

			const outputFile = result.outputFiles?.[0];
			const sourceMapFile = result.outputFiles?.[1];
			return outputFile
				? {
						code: outputFile.text,
						map: sourceMapFile?.text || "",
					}
				: null;
		}

		// Use the actual filesystem since the package folder is already loaded
		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "esm",
				minify: false,
				sourcemap: true,
				target: "es2020",
				platform: "browser",
				outfile: outFile,
				absWorkingDir: folder.rootPath,
			});

			// Read the generated files
			const code = readFileSync(outFile, "utf8");
			const mapFile = `${outFile}.map`;
			const map = readFileSync(mapFile, "utf8");

			return {
				code,
				map,
			};
		} finally {
			// Clean up temporary directory
			rmSync(tempDir, { recursive: true, force: true });
		}
	} catch {
		return null;
	}
}

/**
 * Generate ESM bundle (production)
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateESMMinifiedBundle(folder) {
	try {
		const entryPoint = getBundleEntryPoint(folder);
		if (!entryPoint) {
			return null;
		}

		// For test environments where rootPath might be null, use a virtual filesystem approach
		if (!folder.rootPath) {
			// Create a virtual filesystem for esbuild
			const virtualFS = /** @type {Record<string, string>} */ ({});
			for (const filePath of folder.getFilePaths()) {
				const content = folder.getFile(filePath);
				if (content !== undefined) {
					virtualFS[filePath] = content;
				}
			}

			const result = await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "esm",
				minify: true,
				sourcemap: true,
				target: "es2020",
				platform: "browser",
				mangleProps: /^_/, // Mangle private properties
				write: false,
				plugins: [
					{
						name: "virtual-fs",
						setup(build) {
							build.onResolve({ filter: /.*/ }, (args) => {
								// Handle relative imports
								let resolvedPath = args.path;

								// If it's a relative import, resolve it relative to the importer
								if (args.path.startsWith("./") || args.path.startsWith("../")) {
									const importerDir = args.importer
										? args.importer.split("/").slice(0, -1).join("/")
										: "";
									resolvedPath = importerDir
										? `${importerDir}/${args.path}`
										: args.path;
								}

								// Try exact match first
								if (virtualFS[resolvedPath]) {
									return { path: resolvedPath, namespace: "virtual" };
								}

								// Try with .js extension
								if (virtualFS[`${resolvedPath}.js`]) {
									return { path: `${resolvedPath}.js`, namespace: "virtual" };
								}

								// Try index.js in directory
								if (virtualFS[`${resolvedPath}/index.js`]) {
									return {
										path: `${resolvedPath}/index.js`,
										namespace: "virtual",
									};
								}

								return null;
							});
							build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
								return { contents: virtualFS[args.path] };
							});
						},
					},
				],
			});

			const outputFile = result.outputFiles?.[0];
			const sourceMapFile = result.outputFiles?.[1];
			return outputFile
				? {
						code: outputFile.text,
						map: sourceMapFile?.text || "",
					}
				: null;
		}

		// Use the actual filesystem since the package folder is already loaded
		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [entryPoint],
				bundle: true,
				format: "esm",
				minify: true,
				sourcemap: true,
				target: "es2020",
				platform: "browser",
				mangleProps: /^_/, // Mangle private properties
				outfile: outFile,
				absWorkingDir: folder.rootPath,
			});

			// Read the generated files
			const code = readFileSync(outFile, "utf8");
			const mapFile = `${outFile}.map`;
			const map = readFileSync(mapFile, "utf8");

			return {
				code,
				map,
			};
		} finally {
			// Clean up temporary directory
			rmSync(tempDir, { recursive: true, force: true });
		}
	} catch {
		return null;
	}
}

/**
 * Generate all bundles for a package
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @param {string} packageName - Name of the package
 * @returns {Promise<import('../types.js').BundleResult|null>} Bundle results or null if generation fails
 */
export async function generateAllBundles(folder, packageName) {
	try {
		const [cjs, cjsMin, esm, esmMin] = await Promise.all([
			generateCommonJSBundle(folder, packageName),
			generateCommonJSMinifiedBundle(folder, packageName),
			generateESMBundle(folder),
			generateESMMinifiedBundle(folder),
		]);

		if (!cjs && !cjsMin && !esm && !esmMin) {
			return null;
		}

		return {
			packageName,
			cjs,
			cjsMin,
			esm,
			esmMin,
		};
	} catch {
		return null;
	}
}

/**
 * Check if package can generate bundles
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {boolean} True if package can generate bundles
 */
export function canGenerateBundles(folder) {
	return getBundleEntryPoint(folder) !== null;
}
