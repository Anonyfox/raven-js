/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file XML entity escaping with surgical precision - all five required entities
 *
 * XML demands stricter escaping than HTML: all five entities (&, <, >, ", ')
 * must be encoded. Optimized fast path with regex probe + character-level escaping.
 */

// Hoisted regex for entity detection - avoid recreation on every call
const NEEDS_XML_ESC = /[&<>"']/;

/**
 * Escape XML entities with zero-cost fast path optimization.
 *
 * XML requires escaping all five entities: & < > " '
 * Uses probe-first approach - only processes strings that need escaping.
 * Character-code based escaping for maximum performance.
 *
 * @param {string} str - String to XML-escape
 * @returns {string} XML-escaped string
 *
 * @example
 * escapeXml(`<tag attr="value's & content">`);
 * // Returns: "&lt;tag attr=&quot;value&apos;s &amp; content&quot;&gt;"
 *
 * @example
 * escapeXml("clean content");
 * // Returns: "clean content" (zero-cost fast path)
 */
export function escapeXml(str) {
	const stringValue = `${str}`;

	// Fast probe - zero cost when no escaping needed
	const match = NEEDS_XML_ESC.exec(stringValue);

	if (!match) {
		return stringValue;
	}

	// Slice builder starting at first hit
	let out = "";
	let last = 0;
	let i = match.index;

	for (; i < stringValue.length; i++) {
		const ch = stringValue.charCodeAt(i);
		let rep = null;

		if (ch === 38)
			rep = "&amp;"; // &
		else if (ch === 60)
			rep = "&lt;"; // <
		else if (ch === 62)
			rep = "&gt;"; // >
		else if (ch === 34)
			rep = "&quot;"; // "
		else if (ch === 39) rep = "&apos;"; // '

		if (rep) {
			if (last !== i) out += stringValue.slice(last, i);
			out += rep;
			last = i + 1;
		}
	}

	return last === 0
		? stringValue
		: last < stringValue.length
			? out + stringValue.slice(last)
			: out;
}

/**
 * Escape CDATA content by protecting against CDATA section termination.
 *
 * CDATA sections cannot contain "]]>" sequence - split any occurrence
 * with intermediate CDATA boundary. This is the only escaping needed
 * inside CDATA sections (no entity escaping required).
 *
 * @param {string} str - Content for CDATA section
 * @returns {string} CDATA-safe content
 *
 * @example
 * escapeCdata("content with ]]> terminator");
 * // Returns: "content with ]]]]><![CDATA[> terminator"
 */
export function escapeCdata(str) {
	const stringValue = `${str}`;

	// Check if CDATA termination sequence exists
	if (!stringValue.includes("]]>")) {
		return stringValue;
	}

	// Split problematic sequence across CDATA boundaries
	return stringValue.replace(/]]>/g, "]]]]><![CDATA[>");
}
