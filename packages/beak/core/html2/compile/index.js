/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file HTML2 Compile - experimental template compilation for maximum performance
 *
 * Uses function wrapper approach to analyze template structure before execution,
 * generating optimized rendering functions that eliminate unnecessary work.
 * Now includes nested template literal inlining for additional performance gains.
 */

import { inline } from "./inline.js";

/**
 * Analyze template function source to extract optimization opportunities
 * @param {string} source - Function source code
 * @returns {Object|null} Analysis results
 */
function analyzeTemplate(source) {
	// Extract template literal content - improved regex
	const templateRegex = /html2?`([^`]*(?:\\.[^`]*)*)`/g;
	const matches = [];
	let match = templateRegex.exec(source);

	while (match !== null) {
		matches.push(match[1]);
		match = templateRegex.exec(source);
	}

	if (matches.length === 0) {
		return null;
	}

	const template = matches[0]; // For now, handle single template

	// Extract interpolations with correct parsing
	const interpolationRegex = /\$\{([^}]*)\}/g;
	const interpolations = [];
	const variablePaths = [];

	let interpolationMatch = interpolationRegex.exec(template);
	while (interpolationMatch !== null) {
		const fullMatch = interpolationMatch[0];
		const expression = interpolationMatch[1].trim();
		interpolations.push(fullMatch);
		variablePaths.push(expression);
		interpolationMatch = interpolationRegex.exec(template);
	}

	const interpolationCount = interpolations.length;

	// Split template into static parts correctly
	const staticParts = template.split(/\$\{[^}]*\}/);

	// Simple heuristics for optimization
	const hasComplexExpressions = variablePaths.some(
		(path) =>
			path.includes("(") ||
			path.includes("[") ||
			path.includes("?") ||
			path.includes("Math."),
	);

	const hasArrayOperations = variablePaths.some(
		(path) =>
			path.includes(".map(") ||
			path.includes(".filter(") ||
			path.includes(".join("),
	);

	// Debug logging removed for performance

	return {
		template,
		staticParts,
		variablePaths,
		interpolationCount,
		hasComplexExpressions,
		hasArrayOperations,
		isSimple:
			!hasComplexExpressions && !hasArrayOperations && interpolationCount <= 10,
	};
}

/**
 * Get value from object using dot notation path
 * @param {any} obj - Source object
 * @param {string} path - Dot notation path like "data.author.name"
 * @returns {*} Value at path
 */
function getValueFromPath(obj, path) {
	if (!path || !obj) return obj;

	// Handle simple cases without split overhead
	if (!path.includes(".")) {
		return obj[path];
	}

	const keys = path.split(".");
	let result = obj;

	for (let i = 0; i < keys.length; i++) {
		if (result == null) return null;
		result = result[keys[i]];
	}

	return result;
}

/**
 * Generate optimized template function for simple cases
 * @param {any} analysis - Template analysis results
 * @returns {Function} Optimized function
 */
function generateSimpleTemplate(analysis) {
	const { staticParts, variablePaths } = analysis;

	/**
	 * @param {...any} args - Function arguments
	 */
	return function optimizedSimpleTemplate(...args) {
		const data = args[0];
		let result = staticParts[0] || "";

		for (let i = 0; i < variablePaths.length; i++) {
			const path = variablePaths[i];
			let value;

			// Handle different path patterns
			if (path.startsWith("data.")) {
				// Extract from data object: data.title -> title
				const propName = path.substring(5); // Remove 'data.'
				value = getValueFromPath(data, propName);
			} else {
				// Direct property access: title -> title
				value = getValueFromPath(data, path);
			}

			// Simplified value processing
			const processedValue = value == null ? "" : String(value);
			const nextStatic = staticParts[i + 1] || "";

			result += processedValue + nextStatic;
		}

		return result;
	};
}

/**
 * Experimental compile function that optimizes template functions
 *
 * @param {Function} templateFunc - Function containing html2 template literal
 * @returns {Function} Optimized template function
 *
 * @example
 * const optimized = compile((data) => html2`<div>${data.title}</div>`);
 * const result = optimized(myData); // Faster execution
 */
export function compile(templateFunc) {
	try {
		// Step 1: Apply nested template inlining optimization
		// This eliminates nested tagged template calls (e.g., html`...` inside expressions)
		const inlinedFunction = inline(templateFunc);

		// Step 2: Apply existing compile optimizations to the inlined function
		const source = inlinedFunction.toString();
		const analysis = analyzeTemplate(source);

		if (!analysis) {
			// No template found, return the inlined function (still better than original)
			return inlinedFunction;
		}

		// Generate optimized function based on complexity
		if (/** @type {any} */ (analysis).isSimple) {
			return generateSimpleTemplate(analysis);
		}

		// For complex templates, return inlined version (partial optimization)
		return inlinedFunction;
	} catch (error) {
		// Graceful fallback on any compilation error
		console.warn("Template compilation failed, using original:", error.message);
		return templateFunc;
	}
}
