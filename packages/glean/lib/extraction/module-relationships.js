/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Module relationship analysis for documentation extraction.
 *
 * Surgical analysis of import/export patterns to understand module
 * dependencies and export structures with precision parsing.
 */

/**
 * Extract module exports from content
 * @param {string} content - File content
 * @returns {string[]} Array of export names
 */
export function extractModuleExports(content) {
	const exports = [];

	// Handle multi-line export statements by processing the entire content
	// Named exports with possible re-exports: export { name1, name2 } from "..."
	const namedExportMatches = content.matchAll(
		/export\s*\{\s*([^}]+)\s*\}(?:\s+from\s+["'][^"']*["'])?/gs,
	);

	for (const match of namedExportMatches) {
		const names = match[1]
			.split(",")
			.map((name) =>
				name
					.trim()
					.split(/\s+as\s+/)[0]
					.trim(),
			)
			.filter((name) => name.length > 0);
		exports.push(...names);
	}

	// Process line by line for other export types
	const lines = content.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();

		// Default export
		if (trimmed.startsWith("export default")) {
			exports.push("default");
		}

		// Direct exports: export const/function/class
		const directExportMatch = trimmed.match(
			/^export\s+(?:const|let|var|function|class)\s+(\w+)/,
		);
		if (directExportMatch) {
			exports.push(directExportMatch[1]);
		}
	}

	return [...new Set(exports)]; // Remove duplicates
}

/**
 * Extract module imports from content
 * @param {string} content - File content
 * @returns {ModuleImport[]} Array of import data
 */
export function extractModuleImports(content) {
	const imports = [];
	const lines = content.split("\n");

	for (const line of lines) {
		const trimmed = line.trim();

		// ES6 imports: import ... from "path"
		const importMatch = trimmed.match(
			/^import\s+(.*?)\s+from\s+["']([^"']+)["']/,
		);
		if (importMatch) {
			const [, importClause, modulePath] = importMatch;
			const importedNames = parseImportClause(importClause);

			imports.push({
				path: modulePath,
				names: importedNames,
				type: "static",
			});
		}

		// Dynamic imports: import("path")
		const dynamicImportMatch = trimmed.match(
			/import\s*\(\s*["']([^"']+)["']\s*\)/,
		);
		if (dynamicImportMatch) {
			imports.push({
				path: dynamicImportMatch[1],
				names: [],
				type: "dynamic",
			});
		}
	}

	return imports;
}

/**
 * Parse import clause to extract imported names
 * @param {string} importClause - Import clause content
 * @returns {string[]} Array of imported names
 */
export function parseImportClause(importClause) {
	const names = [];
	const trimmed = importClause.trim();

	// Default import: import name from "..."
	const defaultMatch = trimmed.match(/^(\w+)(?:\s*,|$)/);
	if (defaultMatch) {
		names.push(defaultMatch[1]);
	}

	// Named imports: import { name1, name2 } from "..."
	const namedMatch = trimmed.match(/\{\s*([^}]+)\s*\}/);
	if (namedMatch) {
		const namedImports = namedMatch[1].split(",").map((name) =>
			name
				.trim()
				.split(/\s+as\s+/)[0]
				.trim(),
		);
		names.push(...namedImports);
	}

	// Namespace import: import * as name from "..."
	const namespaceMatch = trimmed.match(/\*\s+as\s+(\w+)/);
	if (namespaceMatch) {
		names.push(namespaceMatch[1]);
	}

	return names.filter((name) => name.length > 0);
}

/**
 * Determine export type for entity
 * @param {any} codeEntity - Code entity
 * @param {string} content - File content
 * @returns {string[]} Export types array
 */
export function determineExportType(codeEntity, content) {
	const exports = [];

	if (codeEntity.exported) {
		// Check if it's a default export - look for different patterns
		const defaultPatterns = [
			new RegExp(`export\\s+default\\s+function\\s+${codeEntity.name}`),
			new RegExp(`export\\s+default\\s+class\\s+${codeEntity.name}`),
			new RegExp(`export\\s+default\\s+${codeEntity.name}`),
		];

		const isDefault = defaultPatterns.some((pattern) => pattern.test(content));

		if (isDefault) {
			exports.push("default");
		} else {
			exports.push("named");
		}
	}

	return exports;
}

/**
 * @typedef {Object} ModuleImport
 * @property {string} path - Import path
 * @property {string[]} names - Imported names
 * @property {string} type - Import type (static|dynamic)
 */
