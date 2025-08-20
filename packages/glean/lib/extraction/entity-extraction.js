/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Code entity extraction - surgical JavaScript source code parsing.
 *
 * Pure extraction logic for identifying functions, classes, and variables
 * in JavaScript source code. Zero dependencies on external parsing libraries,
 * using targeted regex patterns for maximum performance.
 */

/**
 * @typedef {Object} CodeEntity
 * @property {string} type - Entity type (function, class, variable)
 * @property {string} name - Entity name
 * @property {number} line - Line number where entity is defined
 * @property {boolean} exported - Whether entity is exported
 */

/**
 * Extract code entities (functions, classes, exports) from JavaScript content
 * @param {string} content - JavaScript file content
 * @returns {CodeEntity[]} Array of extracted entities
 */
export function extractCodeEntities(content) {
	const entities = [];
	const lines = content.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		const lineNumber = i + 1;

		// Function declarations
		const functionMatch = line.match(
			/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
		);
		if (functionMatch) {
			entities.push({
				type: "function",
				name: functionMatch[1],
				line: lineNumber,
				exported: line.includes("export"),
			});
		}

		// Arrow function exports
		const arrowMatch = line.match(
			/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/,
		);
		if (arrowMatch) {
			entities.push({
				type: "function",
				name: arrowMatch[1],
				line: lineNumber,
				exported: line.includes("export"),
			});
			continue; // Skip other patterns to avoid double-matching
		}

		// Class declarations
		const classMatch = line.match(/^(?:export\s+)?class\s+(\w+)/);
		if (classMatch) {
			entities.push({
				type: "class",
				name: classMatch[1],
				line: lineNumber,
				exported: line.includes("export"),
			});
			continue; // Skip other patterns to avoid double-matching
		}

		// Named exports (exclude function assignments)
		const namedExportMatch = line.match(
			/^export\s+const\s+(\w+)\s*=\s*(?![^=]*=>|[^=]*function)/,
		);
		if (namedExportMatch) {
			entities.push({
				type: "variable",
				name: namedExportMatch[1],
				line: lineNumber,
				exported: true,
			});
		}
	}

	return entities;
}
