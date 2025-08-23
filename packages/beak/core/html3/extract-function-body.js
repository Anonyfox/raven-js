/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Function body extraction for template compilation
 *
 * Lean implementation that extracts the body content from a function's toString() result.
 * Handles all function types: regular, arrow, async, generator, methods.
 */

/**
 * Simple robust extraction for regular function declarations
 * @param {string} fnString - Function string starting with 'function'
 * @returns {string} Function body content
 */
function extractRegularFunctionBody(fnString) {
	// Find the first opening brace
	const openBraceIndex = fnString.indexOf("{");
	if (openBraceIndex === -1) {
		return "";
	}

	// Simple brace counting from the opening brace
	let braceCount = 0;
	let closeBraceIndex = -1;

	for (let i = openBraceIndex; i < fnString.length; i++) {
		const char = fnString[i];
		if (char === "{") {
			braceCount++;
		} else if (char === "}") {
			braceCount--;
			if (braceCount === 0) {
				closeBraceIndex = i;
				break;
			}
		}
	}

	if (closeBraceIndex === -1) {
		return "";
	}

	// Extract content between braces, trimmed
	return fnString.slice(openBraceIndex + 1, closeBraceIndex).trim();
}

/**
 * Extracts the function body from a function's toString() result.
 *
 * Handles all function formats including arrow functions, async functions,
 * generators, and methods. Returns the clean body content without braces.
 *
 * @param {Function} fn - The function to extract the body from
 * @returns {string} The function body content, or empty string if extraction fails
 *
 * @example
 * function test() { return "hello"; }
 * extractFunctionBody(test) // returns: return "hello";
 *
 * const arrow = () => { console.log("test"); }
 * extractFunctionBody(arrow) // returns: console.log("test");
 *
 * const single = () => "value"
 * extractFunctionBody(single) // returns: return "value"
 */
export function extractFunctionBody(fn) {
	if (typeof fn !== "function") {
		return "";
	}

	try {
		const fnString = fn.toString();

		// Simple robust extraction for regular functions: function name(params) { body }
		if (fnString.trim().startsWith("function ")) {
			return extractRegularFunctionBody(fnString);
		}

		// Handle arrow functions without braces (single expressions)
		// Match: (...params...) => expression or param => expression
		const arrowMatch = fnString.match(/^.*?\s*=>\s*([^{].*?)$/s);
		if (arrowMatch) {
			// Single expression arrow function - wrap in return
			const expression = arrowMatch[1].trim();
			return `return ${expression}`;
		}

		// Find the opening brace
		const openBraceIndex = fnString.indexOf("{");
		if (openBraceIndex === -1) {
			return "";
		}

		// Find the matching closing brace using brace counting
		let braceCount = 0;
		let closeBraceIndex = -1;

		for (let i = openBraceIndex; i < fnString.length; i++) {
			const char = fnString[i];
			if (char === "{") {
				braceCount++;
			} else if (char === "}") {
				braceCount--;
				if (braceCount === 0) {
					closeBraceIndex = i;
					break;
				}
			}
		}

		if (closeBraceIndex === -1) {
			return "";
		}

		// Extract and clean the body content
		const body = fnString.slice(openBraceIndex + 1, closeBraceIndex).trim();
		return body;
	} catch {
		return "";
	}
}
