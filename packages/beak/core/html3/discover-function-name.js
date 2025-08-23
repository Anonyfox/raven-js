/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Function name discovery for template compilation
 *
 * Lean implementation that parses stack traces to find the calling function name.
 * Handles V8 (Node/Chrome), SpiderMonkey (Firefox), and JavaScriptCore (Safari).
 */

/**
 * Discovers how the current tagged template function is named in the calling code.
 *
 * Uses stack trace analysis to extract the calling function name directly.
 * This is the lean, minimal approach that works across modern JS engines.
 *
 * @returns {string|null} The function name used in userland, or null if detection fails
 *
 * @example
 * // User code: import { html3 as template } from "..."
 * // User calls: template`<div>hello</div>`
 * // Returns: "template"
 */
export function discoverFunctionName() {
	try {
		// Get stack trace
		const stack = new Error().stack;
		if (!stack) {
			return null;
		}

		// Parse stack to find the calling function name
		return parseCallingFunctionFromStack(stack);
	} catch {
		// Graceful failure - return null to trigger fallback
		return null;
	}
}

/**
 * Parses stack trace to extract the name of the function that called us.
 * Handles different JavaScript engine stack trace formats.
 *
 * @param {string} stack - Error.prototype.stack string
 * @returns {string|null} Function name or null if not found
 */
function parseCallingFunctionFromStack(stack) {
	try {
		const lines = stack.split("\n");

		// Skip our own frames and find the first user function
		// Typical stack:
		// 0: "Error" or blank
		// 1: "at discoverFunctionName ..."  (us)
		// 2: "at html3 ..." (our template function)
		// 3: "at userFunction ..." (this is what we want)

		for (let i = 2; i < Math.min(lines.length, 10); i++) {
			const line = lines[i]?.trim();
			if (!line) continue;

			const functionName = extractFunctionNameFromFrame(line);
			if (functionName && !isInternalFrame(functionName)) {
				return functionName;
			}
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Extracts function name from a single stack trace frame.
 * Handles V8, SpiderMonkey, and JavaScriptCore formats including method calls.
 *
 * @param {string} frame - Single line from stack trace
 * @returns {string|null} Extracted function name or null
 */
function extractFunctionNameFromFrame(frame) {
	// V8 method call format: "    at Object.methodName (file:line:column)" or "    at ClassName.methodName (file:line:column)"
	let match = frame.match(
		/^\s*at\s+(?:[a-zA-Z_$][a-zA-Z0-9_$]*\.)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
	);
	if (match?.[1]) {
		return match[1];
	}

	// V8 method call format without parens: "    at Object.methodName file:line:column"
	match = frame.match(
		/^\s*at\s+(?:[a-zA-Z_$][a-zA-Z0-9_$]*\.)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s+/,
	);
	if (match?.[1]) {
		return match[1];
	}

	// SpiderMonkey (Firefox) format: "functionName@file:line:column"
	match = frame.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)@/);
	if (match?.[1]) {
		return match[1];
	}

	// SpiderMonkey method format: "Object.methodName@file:line:column"
	match = frame.match(
		/^(?:[a-zA-Z_$][a-zA-Z0-9_$]*\.)?([a-zA-Z_$][a-zA-Z0-9_$]*)@/,
	);
	if (match?.[1]) {
		return match[1];
	}

	// JavaScriptCore (Safari) similar to V8 but may have variations
	match = frame.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)@.*:\d+:\d+/);
	if (match?.[1]) {
		return match[1];
	}

	return null;
}

/**
 * Determines if a function name represents internal/system code.
 * These should be skipped when looking for user functions.
 *
 * @param {string} functionName - Function name from stack trace
 * @returns {boolean} True if internal frame
 */
function isInternalFrame(functionName) {
	// Skip our own functions and common internal patterns
	const internalPatterns = [
		"discoverFunctionName",
		"html3",
		"safeHtml3",
		"escapeHtml",
		"node:",
		"internal/",
		"Module.",
		"Object.",
		"Function.",
		"eval",
		"<anonymous>",
		"anonymous",
		"new", // Constructor calls (like 'new Promise', 'new SafePromise')
		"Test.", // Node.js test runner
		"TestContext.", // Node.js test runner
		"SafePromise", // Node.js internals
		"Promise", // Can be internal context
		"primordials", // Node.js internals
		"async_hooks", // Node.js internals
		"test_runner", // Node.js test runner
		"runInAsyncScope", // Node.js async_hooks internal method
		"processTicksAndRejections", // Node.js internal
		"processPendingSubtests", // Node.js test runner internal
		"run", // Node.js test runner Test.run method
		"start", // Node.js test runner internal
		"postRun", // Node.js test runner internal
	];

	const lowerName = functionName.toLowerCase();
	return internalPatterns.some((pattern) =>
		lowerName.includes(pattern.toLowerCase()),
	);
}
