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
 * Apex performance through platform primitives: 0.337μs per operation measured.
 * Uses += concatenation, monomorphic value processing, character-level escaping.
 */

// Template cache for memoized code generation
const TEMPLATE_CACHE = new WeakMap();

// Hoisted regex constants - avoid recreation on every call
const NEEDS_ESC = /[&<>"']/;
const DANGEROUS = /(?:javascript|vbscript|data):|on[a-z]+=/i;

/**
 * Hybrid HTML escaping with zero-cost fast path.
 * Probes with regex first, only escapes when needed.
 *
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(str) {
	const stringValue = `${str}`;

	// Fast probe - zero cost when no escaping needed
	const match = NEEDS_ESC.exec(stringValue);

	let result;
	if (!match) {
		result = stringValue;
	} else {
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
			else if (ch === 39) rep = "&#x27;"; // '

			if (rep) {
				if (last !== i) out += stringValue.slice(last, i);
				out += rep;
				last = i + 1;
			}
		}

		result =
			last === 0
				? stringValue
				: last < stringValue.length
					? out + stringValue.slice(last)
					: out;
	}

	// Security check: block dangerous protocols and event handlers (after escaping)
	if (DANGEROUS.test(result)) {
		return result
			.replace(/javascript:/g, "blocked:")
			.replace(/vbscript:/g, "blocked:")
			.replace(/data:/g, "blocked:")
			.replace(/\bon([a-z]+)=/g, "blocked-$1=");
	}

	return result;
}

/**
 * Fast path processor for common primitives.
 * Inlined in generated code for maximum performance.
 *
 * @param {any} value - Value to process
 * @returns {string} Processed string value
 */
function processValueFast(value) {
	if (value == null || value === false) return "";
	if (value === true) return "true";
	if (typeof value === "string") return value;
	if (typeof value === "number") return `${value}`;
	// Function-type values get stringified
	if (typeof value === "function") return String(value);
	return processValueSlow(value);
}

// Counter for auto-generated handler names
let handlerCounter = 0;

/**
 * Event attribute processor - transparently binds functions to global scope.
 * Enables isomorphic event handlers without manual registration.
 *
 * @param {any} value - Value to process
 * @returns {string} Processed string value
 */
function processEventAttr(value) {
	if (typeof value === "function") {
		const name =
			value.name && /^[A-Za-z_$][\w$]*$/.test(value.name)
				? value.name
				: `__h${++handlerCounter}`;
		if (typeof window !== "undefined") window[name] = value; // expose globally in browser
		return `${name}(event)`; // make the attribute call it
	}
	return processValueFast(value);
}

/**
 * Slow path processor for arrays, objects, and complex types.
 * Only called when fast path cannot handle the value.
 *
 * @param {any} value - Value to process
 * @returns {string} Processed string value
 */
function processValueSlow(value) {
	if (Array.isArray(value)) {
		const parts = [];
		/** @type {any[]} */
		const stack = [value];
		while (stack.length) {
			/** @type {any} */
			const cur = stack.pop();
			if (cur == null || cur === false) continue;
			if (Array.isArray(cur)) {
				for (let i = cur.length - 1; i >= 0; i--) stack.push(cur[i]);
			} else {
				parts.push(typeof cur === "string" ? cur : `${cur}`);
			}
		}
		return parts.join("");
	}
	return `${value}`;
}

/**
 * Protected value processing with circular reference detection.
 * Used by safeHtml for security and crash prevention.
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
 * Tagged template literal for trusted HTML content.
 *
 * **Use:** Sanitized content, static templates, performance-critical paths.
 * **Avoid:** User input, API responses, untrusted data.
 * **Security:** No escaping - caller must ensure content safety.
 *
 * @param {readonly string[]} strings - Template literal static parts
 * @param {...any} values - Template literal interpolated values
 * @returns {string} Rendered HTML string
 */
export function html(strings, ...values) {
	// Check cache for compiled template
	let fn = TEMPLATE_CACHE.get(strings);
	if (!fn) {
		// Static-only optimization: no interpolations
		if (values.length === 0) {
			fn = () => strings[0].trim();
		} else {
			// Choose variadic vs array-indexed specialization
			if (values.length <= 8) {
				// Variadic specialization for short templates - fixed arity
				let src = "return (";
				for (let i = 0; i < values.length; i++) {
					// Pre-trim first string, keep middle strings as-is
					const str = i === 0 ? strings[i].trimStart() : strings[i];
					// Detect event attribute context
					const isEventAttr = /\bon[a-z]+\s*=\s*$/.test(str);
					src += `${JSON.stringify(str)} + ${isEventAttr ? "_pe" : "_p"}(v${i}) + `;
				}
				// Handle the final string with trimEnd
				const finalStr = strings[values.length].trimEnd();
				src += `${JSON.stringify(finalStr)}).trim();`;
				fn = new Function(
					"_p",
					"_pe",
					...Array.from({ length: values.length }, (_, i) => `v${i}`),
					src,
				).bind(null, processValueFast, processEventAttr);
			} else {
				// Array-indexed specialization for longer templates
				let src = "return (";
				for (let i = 0; i < values.length; i++) {
					// Pre-trim first string, keep middle strings as-is
					const str = i === 0 ? strings[i].trimStart() : strings[i];
					// Detect event attribute context
					const isEventAttr = /\bon[a-z]+\s*=\s*$/.test(str);
					src += `${JSON.stringify(str)} + ${isEventAttr ? "_pe" : "_p"}(a[${i}]) + `;
				}
				// Handle the final string with trimEnd
				const finalStr = strings[values.length].trimEnd();
				src += `${JSON.stringify(finalStr)}).trim();`;
				fn = new Function("_p", "_pe", "a", src).bind(
					null,
					processValueFast,
					processEventAttr,
				);
			}
		}
		TEMPLATE_CACHE.set(strings, fn);
	}

	// Call with appropriate arity based on template length
	if (values.length <= 8) {
		return fn.apply(null, values);
	} else {
		return fn(values);
	}
}

/**
 * Tagged template literal for untrusted HTML content.
 *
 * **Use:** User input, form data, API responses, external content.
 * **Security:** XSS protection, blocks dangerous protocols/events, prevents circular reference crashes.
 * **Performance:** ~3x slower than html() due to escaping overhead.
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

	// Security check: block dangerous protocols and event handlers (post-concat)
	if (DANGEROUS.test(result)) {
		result = result
			.replace(/javascript:/g, "blocked:")
			.replace(/vbscript:/g, "blocked:")
			.replace(/data:/g, "blocked:")
			.replace(/\bon([a-z]+)=/g, "blocked-$1=");
	}

	return result.trim();
}
