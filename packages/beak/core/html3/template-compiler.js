/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Template compilation engine for function-level optimization
 *
 * Converts template literals and function structures into optimized
 * string concatenation code for maximum runtime performance.
 */

import { analyzeFunctionSource } from "./function-analyzer.js";

/**
 * Compilation options for template optimization.
 *
 * @typedef {Object} CompilationOptions
 * @property {boolean} escapeValues - Whether to escape HTML by default
 * @property {boolean} optimizeArrays - Convert .map() to for loops
 * @property {boolean} inlineExpressions - Inline simple expressions
 * @property {string} stringStrategy - 'concat' or 'buffer' for large content
 */

/**
 * Default compilation options.
 */
const DEFAULT_OPTIONS = {
	escapeValues: false,
	optimizeArrays: true,
	inlineExpressions: true,
	stringStrategy: "concat",
};

/**
 * Compiles a single template literal into string concatenation code.
 *
 * @param {Object} template - Template pattern from function analyzer
 * @param {CompilationOptions} options - Compilation options
 * @returns {string} Generated concatenation code
 */
export function compileTemplatePattern(template, options = {}) {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const { parts, expressions } = template;

	let code = "";

	// Generate concatenation for each part and expression
	for (let i = 0; i < parts.length; i++) {
		// Add static string part
		if (parts[i]) {
			code += JSON.stringify(parts[i]);
		}

		// Add expression if exists
		if (i < expressions.length) {
			const expr = expressions[i];
			const processedExpr = processExpression(expr, opts);

			if (code && !code.endsWith('"')) {
				code += " + ";
			} else if (code) {
				code += " + ";
			}

			code += processedExpr;
		}
	}

	return code || '""';
}

/**
 * Processes a JavaScript expression for template compilation.
 *
 * @param {string} expression - Raw JavaScript expression
 * @param {CompilationOptions} options - Compilation options
 * @returns {string} Processed expression code
 */
function processExpression(expression, options) {
	const expr = expression.trim();

	// Handle different value types with proper conversion
	if (options.escapeValues) {
		return `escapeHtml(processValue(${expr}))`;
	} else {
		return `processValue(${expr})`;
	}
}

/**
 * Compiles an entire function into optimized template rendering code.
 *
 * @param {Function} func - Original function to compile
 * @param {CompilationOptions} options - Compilation options
 * @returns {Function} Compiled optimized function
 */
export function compileFunction(func, options = {}) {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	try {
		const analysis = analyzeFunctionSource(func);

		if (!analysis.isCompilable) {
			throw new Error("Function is not suitable for compilation");
		}

		const compiledSource = generateOptimizedFunction(analysis, opts);
		const compiledFunc = createCompiledFunction(
			compiledSource,
			analysis.parameters,
		);

		return compiledFunc;
	} catch (error) {
		// Fallback to original function on compilation error
		console.warn(
			"Template compilation failed, using original function:",
			error.message,
		);
		return func;
	}
}

/**
 * Generates optimized function source code from analysis.
 *
 * @param {Object} analysis - Function analysis result
 * @param {CompilationOptions} options - Compilation options
 * @returns {string} Generated function source
 */
function generateOptimizedFunction(analysis, options) {
	const { parameters, templates, hasArrayMethods } = analysis;
	const paramList = parameters.join(", ");

	// Helper functions that will be available in compiled function
	const helpers = generateHelperFunctions(options);

	// Process function body to replace template calls
	let optimizedBody = analysis.body;

	// Sort templates by position (reverse order for safe replacement)
	const sortedTemplates = [...templates].sort(
		(a, b) => b.startIndex - a.startIndex,
	);

	// Replace each template literal with optimized concatenation
	for (const template of sortedTemplates) {
		const compiledTemplate = compileTemplatePattern(template, options);
		optimizedBody = replaceTemplateInSource(
			optimizedBody,
			template,
			compiledTemplate,
		);
	}

	// Optimize array methods if present
	if (hasArrayMethods && options.optimizeArrays) {
		optimizedBody = optimizeArrayMethods(optimizedBody);
	}

	// Generate complete function source
	const functionSource = `
		${helpers}

		return function(${paramList}) {
			${optimizedBody}
		};
	`;

	return functionSource;
}

/**
 * Generates helper function definitions for compiled templates.
 *
 * @param {CompilationOptions} options - Compilation options
 * @returns {string} Helper function source code
 */
function generateHelperFunctions(options) {
	let helpers = `
		// Value processing function optimized for template rendering
		function processValue(value) {
			if (value == null) return "";
			if (typeof value === "string") return value;
			if (typeof value === "number") return String(value);
			if (typeof value === "boolean") return value ? String(value) : "";
			if (Array.isArray(value)) return value.map(v => processValue(v)).join("");
			return String(value);
		}
	`;

	if (options.escapeValues) {
		helpers += `
		// HTML escaping function for XSS protection
		function escapeHtml(str) {
			const stringValue = String(str);
			let result = "";
			for (let i = 0; i < stringValue.length; i++) {
				const char = stringValue[i];
				switch (char) {
					case "&": result += "&amp;"; break;
					case "<": result += "&lt;"; break;
					case ">": result += "&gt;"; break;
					case '"': result += "&quot;"; break;
					case "'": result += "&#x27;"; break;
					default: result += char; break;
				}
			}
			return result;
		}
		`;
	}

	return helpers;
}

/**
 * Replaces a template literal in source code with compiled version.
 *
 * @param {string} source - Source code
 * @param {Object} template - Template pattern
 * @param {string} compiledCode - Compiled replacement code
 * @returns {string} Updated source code
 */
function replaceTemplateInSource(source, template, compiledCode) {
	// Find the template literal in the source
	const before = source.substring(0, template.startIndex);
	const after = source.substring(template.endIndex);

	// Replace template with compiled code
	return before + `(${compiledCode})` + after;
}

/**
 * Optimizes array method calls for better performance.
 * Converts .map() calls to optimized for loops where possible.
 *
 * @param {string} source - Source code containing array methods
 * @returns {string} Optimized source code
 */
function optimizeArrayMethods(source) {
	// Pattern for simple .map() with template literal
	const mapPattern = /(\w+)\.map\(\s*(\w+)\s*=>\s*html3`([^`]+)`\s*\)/g;

	return source.replace(mapPattern, (_match, arrayName, itemName, template) => {
		// Convert template to concatenation
		const parts = template.split(/\$\{[^}]+\}/);
		const expressions = template.match(/\$\{([^}]+)\}/g) || [];

		let loopBody = "";
		for (let i = 0; i < parts.length; i++) {
			if (parts[i]) {
				loopBody += JSON.stringify(parts[i]);
			}
			if (i < expressions.length) {
				const expr = expressions[i].slice(2, -1); // Remove ${ and }
				if (loopBody) loopBody += " + ";
				loopBody += `processValue(${expr.replace(new RegExp(itemName, "g"), `${arrayName}[__i]`)})`;
			}
		}

		// Generate optimized for loop
		return `(() => {
			let __result = "";
			for (let __i = 0; __i < ${arrayName}.length; __i++) {
				const ${itemName} = ${arrayName}[__i];
				__result += ${loopBody};
			}
			return __result;
		})()`;
	});
}

/**
 * Creates a compiled function from generated source code.
 *
 * @param {string} source - Generated function source
 * @param {string[]} parameters - Function parameters
 * @returns {Function} Compiled function
 */
function createCompiledFunction(source, parameters) {
	try {
		// Create function constructor with proper scope
		const compiledFactory = new Function(source);
		const compiled = compiledFactory();

		// Preserve function metadata
		Object.defineProperty(compiled, "name", {
			value: "compiled_template",
			configurable: true,
		});

		// Mark as compiled for debugging
		compiled.__compiled = true;
		compiled.__originalParameters = parameters;

		return compiled;
	} catch (error) {
		throw new Error(`Failed to create compiled function: ${error.message}`);
	}
}

/**
 * Compiles a safe template function with HTML escaping.
 *
 * @param {Function} func - Original function to compile
 * @returns {Function} Compiled function with escaping
 */
export function compileSafeFunction(func) {
	return compileFunction(func, { escapeValues: true });
}

/**
 * Estimates compilation benefits for a function.
 *
 * @param {Function} func - Function to analyze
 * @returns {Object} Estimation results
 */
export function estimateCompilationBenefit(func) {
	const analysis = analyzeFunctionSource(func);

	const templateCount = analysis.templates.length;
	const expressionCount = analysis.templates.reduce(
		(sum, t) => sum + t.expressions.length,
		0,
	);

	// Rough estimation based on eliminated overhead
	const functionCallSavings = templateCount * 0.001; // ~0.001ms per call
	const typecheckSavings = expressionCount * 0.0005; // ~0.0005ms per expression
	const parsingSavings = templateCount * 0.0002; // ~0.0002ms per template

	const totalSavings = functionCallSavings + typecheckSavings + parsingSavings;
	const speedupFactor = analysis.isCompilable
		? Math.max(1.5, totalSavings * 1000)
		: 1;

	return {
		isCompilable: analysis.isCompilable,
		templateCount,
		expressionCount,
		estimatedSavings: totalSavings,
		estimatedSpeedup: speedupFactor,
		hasArrayOptimizations: analysis.hasArrayMethods,
		compilationWorthwhile: speedupFactor > 2,
	};
}
