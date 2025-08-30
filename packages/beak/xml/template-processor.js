/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file XML template literal processor with tiered performance optimization
 *
 * Implements four optimization tiers based on interpolation count matching SQL module patterns.
 * Processes XML values with attribute object conversion and strict escaping.
 */

import { escapeXml } from "./escape-xml.js";

// Raven-fast trim detection - extracted for V8 optimization
const needsTrim = (/** @type {string} */ str) =>
	str.charAt(0) <= " " || str.charAt(str.length - 1) <= " ";

/**
 * Process XML values with context-aware formatting (trusted mode).
 * No automatic escaping - assumes content is trusted.
 *
 * Objects → attribute pairs with proper quoting
 * Arrays → space-separated values or element repetition
 * Primitives → string conversion without escaping
 * null/undefined → empty string
 *
 * @param {unknown} value - Value to process for XML context
 * @returns {string} Processed XML content (no escaping)
 */
function processXmlValue(value) {
	if (value == null || value === false) return "";
	if (value === true) return "true";
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);

	if (Array.isArray(value)) {
		return value
			.filter((v) => v != null && v !== false)
			.map((v) => processXmlValue(v))
			.join("");
	}

	if (typeof value === "object") {
		// Convert object to attribute pairs: {host: "localhost", port: 3306} → `host="localhost" port="3306"`
		return Object.entries(value)
			.filter(([_, v]) => v != null)
			.map(([key, val]) => {
				// Kebab-case conversion for attribute names
				const attrName = key.replace(
					/[A-Z]/g,
					(match) => `-${match.toLowerCase()}`,
				);
				const attrValue = escapeXml(String(val));
				return `${attrName}="${attrValue}"`;
			})
			.join(" ");
	}

	return String(value);
}

/**
 * Processes XML template literals with automatic value processing and performance optimization.
 *
 * Template literal processor that interleaves static strings with processed dynamic values.
 * Implements four performance tiers based on interpolation count: specialized paths for
 * 0, 1, 2-3, and 4+ values optimize for common XML generation patterns.
 *
 * **Performance Optimization**: Different algorithms by value count:
 * - 0 values: Direct string return with conditional trim
 * - 1 value: String concatenation (fastest for single interpolation)
 * - 2-3 values: StringBuilder pattern (optimal for few values)
 * - 4+ values: Pre-sized array join (scales with many interpolations)
 * - Extracted functions: Monomorphic patterns for V8 JIT optimization
 *
 * **Value Processing**: All dynamic values pass through processXmlValue() automatically.
 * **Whitespace**: Trims leading/trailing whitespace only when detected (performance).
 *
 * @param {TemplateStringsArray|readonly string[]} strings - Static template string parts
 * @param {...unknown} values - Dynamic values to interpolate and process
 * @returns {string} Complete XML with processed values and trimmed whitespace
 *
 * @example
 * // Zero values - direct return path
 * processXmlTemplate`<config/>` // → "<config/>"
 *
 * @example
 * // Single value - concatenation path
 * processXmlTemplate`<host>${hostname}</host>` // → "<host>localhost</host>"
 *
 * @example
 * // Multiple values - optimized for count
 * processXmlTemplate`<db host="${host}" port="${port}"/>`
 * // → `<db host="localhost" port="3306"/>`
 *
 * @example
 * // Object attributes
 * processXmlTemplate`<server ${config}/>`
 * // where config = {bindHost: "0.0.0.0", maxConnections: 100}
 * // → `<server bind-host="0.0.0.0" max-connections="100"/>`
 */
export function processXmlTemplate(strings, ...values) {
	const valueCount = values.length;

	// Tier 0: Static-only template (no interpolations)
	if (valueCount === 0) {
		const result = strings[0];
		return needsTrim(result) ? result.trim() : result;
	}

	// Tier 1: Single interpolation (most common case)
	if (valueCount === 1) {
		const result = strings[0] + processXmlValue(values[0]) + strings[1];
		return needsTrim(result) ? result.trim() : result;
	}

	// Tier 2: Few interpolations (2-3 values) - StringBuilder pattern
	if (valueCount <= 3) {
		let result = strings[0];
		for (let i = 0; i < valueCount; i++) {
			result += processXmlValue(values[i]) + strings[i + 1];
		}
		return needsTrim(result) ? result.trim() : result;
	}

	// Tier 3: Many interpolations (4+ values) - Pre-sized array join
	const capacity = strings.length + valueCount;
	const parts = new Array(capacity);
	let index = 0;

	// Interleave strings and processed values
	for (let i = 0; i < valueCount; i++) {
		parts[index++] = strings[i];
		parts[index++] = processXmlValue(values[i]);
	}
	parts[index] = strings[valueCount];

	const result = parts.join("");
	return needsTrim(result) ? result.trim() : result;
}
