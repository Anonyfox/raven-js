/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc comment parsing - surgical documentation extraction.
 *
 * Pure parsing logic for extracting and structuring JSDoc comments
 * from JavaScript source code. Handles comment discovery, content
 * extraction, and tag parsing with predatory precision.
 */

/**
 * Find JSDoc comment preceding a line number
 * @param {string[]} lines - Array of file lines
 * @param {number} lineIndex - Line index to search backwards from
 * @returns {import('./types.js').JSDocComment|null} Parsed JSDoc comment or null
 */
export function findPrecedingJSDoc(lines, lineIndex) {
	// Look backwards for JSDoc comment
	let endLine = -1;
	let startLine = -1;

	// Find the end of JSDoc comment (*/)
	for (let i = lineIndex - 1; i >= 0; i--) {
		const line = lines[i].trim();

		if (line === "") {
			continue; // Skip empty lines
		}

		if (line.endsWith("*/")) {
			endLine = i;
			break;
		}

		// If we hit code before finding */, there's no JSDoc
		if (!line.startsWith("*") && !line.startsWith("//")) {
			break;
		}
	}

	if (endLine === -1) return null;

	// Find the start of JSDoc comment (/**)
	for (let i = endLine; i >= 0; i--) {
		const line = lines[i].trim();

		if (line.startsWith("/**")) {
			startLine = i;
			break;
		}
	}

	if (startLine === -1) return null;

	// Extract and parse JSDoc content
	const commentLines = lines.slice(startLine, endLine + 1);
	return parseJSDocComment(commentLines, startLine + 1);
}

/**
 * Parse JSDoc comment lines into structured data
 * @param {string[]} commentLines - Lines of JSDoc comment
 * @param {number} startLine - Starting line number
 * @returns {import('./types.js').JSDocComment} Parsed JSDoc structure
 */
export function parseJSDocComment(commentLines, startLine) {
	const comment = {
		description: "",
		tags: /** @type {any} */ ({}),
		startLine,
		endLine: startLine + commentLines.length - 1,
	};

	let currentTag = null;
	const descriptionLines = [];

	for (const line of commentLines) {
		const cleaned = line.replace(/^\s*\*?\s?/, "").trim();

		if (
			cleaned.startsWith("/**") ||
			cleaned.endsWith("*/") ||
			cleaned === "/"
		) {
			continue; // Skip comment delimiters
		}

		// Check for JSDoc tags
		const tagMatch = cleaned.match(/^@(\w+)\s*(.*)/);
		if (tagMatch) {
			const [, tagName, tagContent] = tagMatch;
			currentTag = tagName;

			if (!comment.tags[tagName]) {
				comment.tags[tagName] = [];
			}

			comment.tags[tagName].push(tagContent);
		} else if (currentTag) {
			// Continuation of current tag
			const lastIndex = comment.tags[currentTag].length - 1;
			comment.tags[currentTag][lastIndex] += ` ${cleaned}`;
		} else {
			// Description content
			descriptionLines.push(cleaned);
		}
	}

	comment.description = descriptionLines.join(" ").trim();

	return comment;
}
