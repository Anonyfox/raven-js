/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Source code structure analysis for documentation extraction.
 *
 * Surgical analysis of JavaScript source code to extract meaningful snippets
 * and understand code structure through brace matching and context analysis.
 */

/**
 * Extract source code snippet around entity
 * @param {string[]} lines - File lines
 * @param {number} entityLine - Entity line number (1-based)
 * @param {string} entityType - Entity type
 * @returns {string} Source code snippet
 */
export function extractSourceSnippet(lines, entityLine, entityType) {
	const lineIndex = entityLine - 1; // Convert to 0-based
	const startIndex = Math.max(0, lineIndex);

	// Determine how many lines to include based on entity type
	let endIndex;
	if (entityType === "class") {
		// For classes, try to find the closing brace
		endIndex = findClosingBrace(lines, startIndex) || startIndex + 10;
	} else if (entityType === "function") {
		// For functions, try to find the closing brace or reasonable limit
		endIndex = findClosingBrace(lines, startIndex) || startIndex + 5;
	} else {
		// For variables/constants, just a few lines
		endIndex = startIndex + 2;
	}

	endIndex = Math.min(lines.length - 1, endIndex);

	return lines.slice(startIndex, endIndex + 1).join("\n");
}

/**
 * Find closing brace for code block
 * @param {string[]} lines - File lines
 * @param {number} startIndex - Starting line index
 * @returns {number|null} Closing brace line index or null
 */
export function findClosingBrace(lines, startIndex) {
	let braceCount = 0;
	let foundOpenBrace = false;

	for (let i = startIndex; i < lines.length && i < startIndex + 50; i++) {
		const line = lines[i];

		for (const char of line) {
			if (char === "{") {
				braceCount++;
				foundOpenBrace = true;
			} else if (char === "}") {
				braceCount--;
				if (foundOpenBrace && braceCount === 0) {
					return i;
				}
			}
		}
	}

	return null; // Could not find closing brace
}
