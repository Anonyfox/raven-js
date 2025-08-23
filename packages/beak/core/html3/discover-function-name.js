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
		const stack = new Error().stack;
		if (!stack) return null;

		// Find stack frames inline - avoid array allocation from split()
		let frameStart = 0;
		let frameCount = 0;

		// Skip first 2 frames (Error + discoverFunctionName + html3/template function)
		while (frameCount < 2) {
			const newlineIndex = stack.indexOf("\n", frameStart);
			if (newlineIndex === -1) return null;
			frameStart = newlineIndex + 1;
			frameCount++;
		}

		// Check up to 8 more frames for user functions
		for (let i = 0; i < 8; i++) {
			const newlineIndex = stack.indexOf("\n", frameStart);
			const frameEnd = newlineIndex === -1 ? stack.length : newlineIndex;

			if (frameStart >= frameEnd) return null;

			const frame = stack.slice(frameStart, frameEnd);

			// Combined regex for all engine formats - single pass optimization
			const match = frame.match(
				/^\s*at\s+(?:[a-zA-Z_$][\w$]*\.)?([a-zA-Z_$][\w$]*)\s*[(\s]|^(?:[a-zA-Z_$][\w$]*\.)?([a-zA-Z_$][\w$]*)@/,
			);
			const functionName = match?.[1] || match?.[2];

			if (functionName && !isInternalFrame(functionName)) {
				return functionName;
			}

			if (newlineIndex === -1) break;
			frameStart = newlineIndex + 1;
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Determines if a function name represents internal/system code.
 * Optimized for high performance with minimal string operations.
 *
 * @param {string} functionName - Function name from stack trace
 * @returns {boolean} True if internal frame
 */
function isInternalFrame(functionName) {
	// Fast character-based checks first (most common cases)
	const firstChar = functionName.charCodeAt(0);

	// Check for common internal patterns using char codes for speed
	// 'd' (100) = discoverFunctionName, 'h' (104) = html3, 's' (115) = safeHtml3
	if (firstChar === 100 && functionName === "discoverFunctionName") return true;
	if (firstChar === 104 && functionName === "html3") return true;
	if (firstChar === 115 && functionName === "safeHtml3") return true;
	if (firstChar === 101 && functionName.startsWith("escape")) return true; // escapeHtml

	// Handle single character internal markers
	if (firstChar === 60) return true; // '<anonymous>'
	if (functionName === "eval" || functionName === "new") return true;

	// Node.js/V8 internal patterns - case sensitive checks
	return (
		functionName.includes("node:") ||
		functionName.includes("internal/") ||
		functionName.includes("Module.") ||
		functionName.includes("Object.") ||
		functionName.includes("Function.") ||
		functionName.includes("Test.") ||
		functionName.includes("TestContext.") ||
		functionName.includes("SafePromise") ||
		functionName.includes("Promise") ||
		functionName.includes("primordials") ||
		functionName.includes("async_hooks") ||
		functionName.includes("test_runner") ||
		functionName === "runInAsyncScope" ||
		functionName === "processTicksAndRejections" ||
		functionName === "processPendingSubtests" ||
		functionName === "run" ||
		functionName === "start" ||
		functionName === "postRun" ||
		functionName === "anonymous"
	);
}
