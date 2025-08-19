/**
 * @fileoverview Generate bundles for packages using esbuild
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

/**
 * Get entry point for a package
 * @param {string} packagePath - Path to the package directory
 * @returns {string|null} Entry point path or null if not found
 */
export function getBundleEntryPoint(packagePath) {
	try {
		const packageJsonPath = join(packagePath, "package.json");
		if (!existsSync(packageJsonPath)) {
			return null;
		}

		const packageJsonContent = readFileSync(packageJsonPath, "utf8");
		const packageJson = JSON.parse(packageJsonContent);

		// Get the main entry point
		let entryPoint = packageJson.main;
		if (!entryPoint && packageJson.exports && packageJson.exports["."]) {
			entryPoint = packageJson.exports["."].import || packageJson.exports["."];
		}
		if (!entryPoint) {
			entryPoint = "index.js";
		}

		// Check if the entry point exists in the package
		// Remove leading ./ if present for comparison
		const normalizedEntryPoint = entryPoint.replace(/^\.\//, "");
		const entryPointPath = join(packagePath, normalizedEntryPoint);
		if (!existsSync(entryPointPath)) {
			return null;
		}

		return normalizedEntryPoint;
	} catch {
		return null;
	}
}

/**
 * Generate CommonJS bundle
 * @param {string} packagePath - Path to the package directory
 * @param {string} packageName - Name of the package for global variable
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateCommonJSBundle(packagePath, packageName) {
	try {
		const entryPoint = getBundleEntryPoint(packagePath);
		if (!entryPoint) {
			return null;
		}

		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [join(packagePath, entryPoint)],
				bundle: true,
				format: "iife",
				minify: false,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				globalName: `RavenJS_${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
				outfile: outFile,
				absWorkingDir: packagePath,
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
 * @param {string} packagePath - Path to the package directory
 * @param {string} packageName - Name of the package for global variable
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateCommonJSMinifiedBundle(packagePath, packageName) {
	try {
		const entryPoint = getBundleEntryPoint(packagePath);
		if (!entryPoint) {
			return null;
		}

		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [join(packagePath, entryPoint)],
				bundle: true,
				format: "iife",
				minify: true,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				globalName: `RavenJS_${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
				outfile: outFile,
				absWorkingDir: packagePath,
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
 * @param {string} packagePath - Path to the package directory
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateESMBundle(packagePath) {
	try {
		const entryPoint = getBundleEntryPoint(packagePath);
		if (!entryPoint) {
			return null;
		}

		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [join(packagePath, entryPoint)],
				bundle: true,
				format: "esm",
				minify: false,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				outfile: outFile,
				absWorkingDir: packagePath,
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
 * Generate ESM bundle (minified)
 * @param {string} packagePath - Path to the package directory
 * @returns {Promise<{code: string, map: string}|null>} Bundle content and sourcemap or null if generation fails
 */
export async function generateESMMinifiedBundle(packagePath) {
	try {
		const entryPoint = getBundleEntryPoint(packagePath);
		if (!entryPoint) {
			return null;
		}

		// Create a temporary directory for esbuild to write files
		const tempDir = mkdtempSync(join(tmpdir(), "esbuild-"));
		const outFile = join(tempDir, "bundle.js");

		try {
			await build({
				entryPoints: [join(packagePath, entryPoint)],
				bundle: true,
				format: "esm",
				minify: true,
				sourcemap: true,
				target: "es2015",
				platform: "browser",
				outfile: outFile,
				absWorkingDir: packagePath,
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
 * Generate all bundle types for a package
 * @param {string} packagePath - Path to the package directory
 * @param {string} packageName - Name of the package for global variable
 * @returns {Promise<{cjs: {code: string, map: string}|null, cjsMin: {code: string, map: string}|null, esm: {code: string, map: string}|null, esmMin: {code: string, map: string}|null}|null>} All bundle types or null if generation fails
 */
export async function generateAllBundles(packagePath, packageName) {
	try {
		const [cjs, cjsMin, esm, esmMin] = await Promise.all([
			generateCommonJSBundle(packagePath, packageName),
			generateCommonJSMinifiedBundle(packagePath, packageName),
			generateESMBundle(packagePath),
			generateESMMinifiedBundle(packagePath),
		]);

		if (!cjs && !cjsMin && !esm && !esmMin) {
			return null;
		}

		return {
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
 * @param {string} packagePath - Path to the package directory
 * @returns {boolean} True if package can generate bundles
 */
export function canGenerateBundles(packagePath) {
	return getBundleEntryPoint(packagePath) !== null;
}
