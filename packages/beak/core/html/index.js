/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file HTML tagged template literal engine - apex performance through platform primitives
 *
 * Phase 1: Minimal viable implementation targeting sub-2.12ms performance.
 * Uses += concatenation strategy, monomorphic value processing, and character-level escaping.
 */

export { compile } from "./compile/index.js";

/**
 * Character-level HTML escaping without regex overhead.
 * Switch-based approach optimized for V8 branch prediction.
 * Includes XSS protection for dangerous protocols and event handlers.
 *
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(str) {
	let stringValue = String(str);

	// Pre-processing: neutralize dangerous patterns with minimal overhead
	if (stringValue.includes("javascript:")) {
		stringValue = stringValue.replace(/javascript:/gi, "blocked:");
	}
	if (stringValue.includes("vbscript:")) {
		stringValue = stringValue.replace(/vbscript:/gi, "blocked:");
	}
	if (stringValue.includes("data:")) {
		stringValue = stringValue.replace(/data:/gi, "blocked:");
	}
	// Neutralize event handlers by converting to safe attributes
	if (stringValue.includes("on")) {
		stringValue = stringValue.replace(/\bon([a-z]+)=/gi, "blocked-$1=");
	}

	let result = "";
	for (let i = 0; i < stringValue.length; i++) {
		const char = stringValue[i];
		switch (char) {
			case "&":
				result += "&amp;";
				break;
			case "<":
				result += "&lt;";
				break;
			case ">":
				result += "&gt;";
				break;
			case '"':
				result += "&quot;";
				break;
			case "'":
				result += "&#x27;";
				break;
			default:
				result += char;
				break;
		}
	}
	return result;
}

/**
 * Monomorphic value processing for optimal V8 performance.
 * Handles behavioral contracts: arrays flatten, falsy filtered except 0.
 *
 * @param {any} value - Value to process
 * @param {boolean} shouldEscape - Whether to apply HTML escaping
 * @returns {string} Processed string value
 */
function processValue(value, shouldEscape = false) {
	if (value == null) return "";
	if (typeof value === "string")
		return shouldEscape ? escapeHtml(value) : value;
	if (typeof value === "number") return String(value);
	if (typeof value === "boolean") return value ? String(value) : "";
	if (Array.isArray(value))
		return value.map((v) => processValue(v, shouldEscape)).join("");
	return shouldEscape ? escapeHtml(String(value)) : String(value);
}

/**
 * Protected value processing with circular reference detection.
 * Used only by safeHtml for maximum safety.
 *
 * @param {any} value - Value to process
 * @param {WeakSet<any[]>} seen - Circular reference tracker
 * @returns {string} Processed string value with escaping
 */
function processValueSafe(value, seen) {
	if (value == null) return "";
	if (typeof value === "string") return escapeHtml(value);
	if (typeof value === "number") return String(value);
	if (typeof value === "boolean") return value ? String(value) : "";
	if (Array.isArray(value)) {
		if (seen.has(value)) return "[Circular]";
		seen.add(value);
		return value.map((v) => processValueSafe(v, seen)).join("");
	}
	return escapeHtml(String(value));
}

/**
 * Tagged template literal for trusted HTML content - maximum performance.
 *
 * **Strengths:** Platform-native speed, preserves semantic whitespace, zero escaping overhead.
 * **Use when:** Content is already sanitized, performance is critical, building static templates.
 * **Avoid for:** User input, API responses, any untrusted data.
 *
 * @param {readonly string[]} strings - Template literal static parts
 * @param {...any} values - Template literal interpolated values
 * @returns {string} Rendered HTML string
 */
export function html(strings, ...values) {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += processValue(values[i]) + strings[i + 1];
	}
	return result.trim();
}

/**
 * Tagged template literal for untrusted HTML content - bulletproof security.
 *
 * **Strengths:** XSS protection, blocks dangerous protocols/events, circular reference safety.
 * **Use when:** Handling user input, form data, API responses, comments, any external content.
 * **Benefits:** Enhanced security beyond basic escaping, prevents stack overflow crashes.
 *
 * @param {readonly string[]} strings - Template literal static parts
 * @param {...any} values - Template literal interpolated values
 * @returns {string} Rendered HTML string with escaped values
 */
export function safeHtml(strings, ...values) {
	const seen = new WeakSet();
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += processValueSafe(values[i], seen) + strings[i + 1];
	}
	return result.trim();
}
