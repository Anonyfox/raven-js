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

		// Arrow function exports - handle multi-line patterns
		const arrowMatch = line.match(
			/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*/,
		);
		if (arrowMatch && !line.includes("function")) {
			// Check if this looks like a function (has arrow, async, or function keywords)
			// Only look within the current line or statement, not across different statements
			const hasArrow = line.includes("=>");
			const hasAsync = line.includes("async");
			const hasParenAfterEquals = line.match(/=\s*(?:async\s+)?\(/);
			const isNotPrimitive = !line.match(/=\s*[0-9"'`[{]/); // Not number, string, array, object

			const isFunction =
				hasArrow || hasAsync || (hasParenAfterEquals && isNotPrimitive);

			if (isFunction) {
				entities.push({
					type: "function",
					name: arrowMatch[1],
					line: lineNumber,
					exported: line.includes("export"),
				});
				continue; // Skip other patterns to avoid double-matching
			}
			// If it matched the pattern but is NOT a function, continue to check other patterns
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

		// Export blocks like: export { MAX_SIZE };
		const exportBlockMatch = line.match(/^export\s*\{\s*([^}]+)\s*\}/);
		if (exportBlockMatch) {
			const exportNames = exportBlockMatch[1]
				.split(",")
				.map((name) => name.trim());
			for (const exportName of exportNames) {
				entities.push({
					type: "variable",
					name: exportName,
					line: lineNumber,
					exported: true,
				});
			}
		}

		// Destructured exports like: export const { process } = helpers;
		const destructuredExportMatch = line.match(
			/^export\s+const\s*\{\s*([^}]+)\s*\}\s*=/,
		);
		if (destructuredExportMatch) {
			const destructuredNames = destructuredExportMatch[1]
				.split(",")
				.map((name) => name.trim());
			for (const destructuredName of destructuredNames) {
				entities.push({
					type: "variable",
					name: destructuredName,
					line: lineNumber,
					exported: true,
				});
			}
		}

		// Export default statements: export default functionName;
		const defaultExportMatch = line.match(/^export\s+default\s+(\w+);?$/);
		if (defaultExportMatch) {
			const defaultName = defaultExportMatch[1];
			// Mark existing entity as default or create a new one
			const existingEntity = entities.find((e) => e.name === defaultName);
			if (existingEntity) {
				existingEntity.isDefault = true;
			} else {
				entities.push({
					type: "function", // Assume function for default exports
					name: defaultName,
					line: lineNumber,
					exported: true,
					isDefault: true,
				});
			}
		}
	}

	return entities;
}
