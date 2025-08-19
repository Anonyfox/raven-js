/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Parses reference definitions: [id]: url "title"
 * Reference definitions are not rendered as content, but stored for link resolution
 *
 * @param {string[]} lines - Array of markdown lines
 * @param {number} start - Starting line index
 * @returns {{references: Object<string, {url: string, title?: string}>, start: number, end: number}|null} - Parsed references or null
 */
export const parseReferences = (
	/** @type {string[]} */ lines,
	/** @type {number} */ start,
) => {
	if (start >= lines.length) return null;

	/** @type {Object<string, {url: string, title?: string}>} */
	const references = {};
	let end = start;
	let foundAny = false;

	// Parse consecutive reference definitions
	while (end < lines.length) {
		const line = lines[end].trim();

		// Skip empty lines
		if (line === "") {
			end++;
			continue;
		}

		const refMatch = parseReferenceLine(line);
		if (refMatch) {
			const { id, url, title } = refMatch;
			// Store reference (case-insensitive key)
			references[id.toLowerCase()] = { url, title };
			foundAny = true;
			end++;
		} else {
			// Not a reference line, stop parsing
			break;
		}
	}

	if (!foundAny) return null;

	return {
		references,
		start,
		end,
	};
};

/**
 * Parses a single reference definition line
 * Supports formats:
 * - [id]: url
 * - [id]: url "title"
 * - [id]: url 'title'
 * - [id]: <url> "title"
 *
 * @param {string} line - Line to parse
 * @returns {{id: string, url: string, title?: string}|null} - Parsed reference or null
 */
const parseReferenceLine = (line) => {
	// Match reference definition pattern: [id]: url optional-title
	const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
	if (!match) return null;

	const id = match[1];
	const urlAndTitle = match[2].trim();

	// Extract URL and optional title
	const parsed = parseUrlAndTitle(urlAndTitle);
	if (!parsed) return null;

	return {
		id,
		url: parsed.url,
		title: parsed.title,
	};
};

/**
 * Parses URL and optional title from reference definition
 * Handles:
 * - url
 * - <url>
 * - url "title"
 * - <url> "title"
 * - url 'title'
 *
 * @param {string} text - Text containing URL and optional title
 * @returns {{url: string, title?: string}|null} - Parsed URL and title or null
 */
const parseUrlAndTitle = (text) => {
	// Try angle bracket URL: <url> "title"
	let match = text.match(/^<([^>]+)>(?:\s+["']([^"']+)["'])?$/);
	if (match) {
		return {
			url: match[1],
			title: match[2] || undefined,
		};
	}

	// Try bare URL with quoted title: url "title"
	match = text.match(/^(\S+)(?:\s+["']([^"']+)["'])?$/);
	if (match) {
		return {
			url: match[1],
			title: match[2] || undefined,
		};
	}

	return null;
};

/**
 * Collects all reference definitions from markdown lines
 * This is typically called before parsing inline elements
 *
 * @param {string[]} lines - Array of markdown lines
 * @returns {Object<string, {url: string, title?: string}>} - Map of reference ID to definition
 */
export const collectReferences = (lines) => {
	/** @type {Object<string, {url: string, title?: string}>} */
	const allReferences = {};
	let current = 0;

	while (current < lines.length) {
		const result = parseReferences(lines, current);
		if (result) {
			// Merge references (later definitions override earlier ones)
			Object.assign(allReferences, result.references);
			current = result.end;
		} else {
			current++;
		}
	}

	return allReferences;
};
