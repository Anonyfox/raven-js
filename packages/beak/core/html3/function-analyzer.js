/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Function source analysis for template compilation
 *
 * Parses function source code to extract template literals and identify
 * optimization opportunities for function-level compilation.
 */

/**
 * Template literal pattern extracted from function source.
 *
 * @typedef {Object} TemplatePattern
 * @property {string} full - Full template literal with backticks
 * @property {string} content - Template content without backticks
 * @property {string[]} parts - Static string parts
 * @property {string[]} expressions - JavaScript expressions to interpolate
 * @property {number} startIndex - Start position in source
 * @property {number} endIndex - End position in source
 */

/**
 * Function analysis result.
 *
 * @typedef {Object} FunctionAnalysis
 * @property {string} name - Function name
 * @property {string[]} parameters - Parameter names
 * @property {string} body - Function body source
 * @property {TemplatePattern[]} templates - Extracted template patterns
 * @property {boolean} hasArrayMethods - Contains .map(), .filter(), etc.
 * @property {boolean} isCompilable - Can be safely compiled
 */

/**
 * Regex for matching template literals with balanced braces.
 * Handles nested template literals and complex expressions.
 */
const TEMPLATE_LITERAL_REGEX =
	/html3\s*`([^`]*(?:\$\{(?:[^{}]*|\{[^}]*\})*\}[^`]*)*)`/g;

/**
 * Regex for extracting expressions from template literals.
 * Matches ${...} patterns with balanced braces.
 */
const EXPRESSION_REGEX = /\$\{([^{}]*(?:\{[^}]*\})*[^{}]*)\}/g;

/**
 * Array method patterns to detect optimization opportunities.
 */
const ARRAY_METHOD_PATTERNS =
	/\.(map|filter|reduce|forEach|find|some|every)\s*\(/g;

/**
 * Extracts template literal patterns from function source.
 *
 * @param {string} source - Function source code
 * @returns {TemplatePattern[]} Array of template patterns found
 */
export function extractTemplatePatterns(source) {
	const patterns = [];
	let match;

	// Reset regex state
	TEMPLATE_LITERAL_REGEX.lastIndex = 0;

	match = TEMPLATE_LITERAL_REGEX.exec(source);
	while (match !== null) {
		const full = match[0];
		const content = match[1];
		const startIndex = match.index;
		const endIndex = match.index + full.length;

		// Extract static parts and expressions
		const parts = [];
		const expressions = [];
		let lastIndex = 0;

		// Split template content by expressions
		let exprMatch;
		EXPRESSION_REGEX.lastIndex = 0;

		exprMatch = EXPRESSION_REGEX.exec(content);
		while (exprMatch !== null) {
			// Add static part before expression
			parts.push(content.substring(lastIndex, exprMatch.index));

			// Add expression
			expressions.push(exprMatch[1]);

			lastIndex = exprMatch.index + exprMatch[0].length;

			exprMatch = EXPRESSION_REGEX.exec(content);
		}

		// Add final static part
		parts.push(content.substring(lastIndex));

		patterns.push({
			full,
			content,
			parts,
			expressions,
			startIndex,
			endIndex,
		});

		match = TEMPLATE_LITERAL_REGEX.exec(source);
	}

	return patterns;
}

/**
 * Analyzes function source code to extract compilation information.
 *
 * @param {Function} func - Function to analyze
 * @returns {FunctionAnalysis} Analysis result
 */
export function analyzeFunctionSource(func) {
	const source = func.toString();

	// Extract function name and parameters
	const funcMatch = source.match(/function\s*([^(]*)\s*\(([^)]*)\)/);
	const arrowMatch = source.match(
		/(?:const|let|var)?\s*([^=]*?)\s*=\s*\(([^)]*)\)\s*=>/,
	);

	let name = "";
	let parameters = [];

	if (funcMatch) {
		name = funcMatch[1].trim();
		parameters = funcMatch[2]
			.split(",")
			.map((p) => p.trim())
			.filter(Boolean);
	} else if (arrowMatch) {
		name = arrowMatch[1].trim();
		parameters = arrowMatch[2]
			.split(",")
			.map((p) => p.trim())
			.filter(Boolean);
	}

	// Extract function body
	const bodyMatch = source.match(/\{([\s\S]*)\}$/);
	const body = bodyMatch ? bodyMatch[1].trim() : source;

	// Extract template patterns
	const templates = extractTemplatePatterns(source);

	// Detect array method usage
	const hasArrayMethods = ARRAY_METHOD_PATTERNS.test(source);

	// Determine if function is compilable
	const isCompilable = determineCompilability(source, templates);

	return {
		name: name || "<anonymous>",
		parameters,
		body,
		templates,
		hasArrayMethods,
		isCompilable,
	};
}

/**
 * Determines if a function can be safely compiled.
 *
 * @param {string} source - Function source code
 * @param {TemplatePattern[]} templates - Extracted templates
 * @returns {boolean} True if function can be compiled
 */
function determineCompilability(source, templates) {
	// Must have at least one template
	if (templates.length === 0) return false;

	// Avoid functions with dangerous patterns
	const dangerousPatterns = [
		/eval\s*\(/, // eval() usage
		/new\s+Function/, // Dynamic function creation
		/with\s*\(/, // with statements
		/arguments\b/, // arguments object usage
		/\.apply\s*\(/, // Dynamic method calls
		/\.call\s*\(/, // Dynamic method calls
		/\[.*\]\s*\(/, // Computed method calls
	];

	for (const pattern of dangerousPatterns) {
		if (pattern.test(source)) return false;
	}

	// Check for overly complex template expressions
	for (const template of templates) {
		for (const expr of template.expressions) {
			// Avoid extremely complex expressions
			if (expr.length > 200) return false;

			// Avoid nested function definitions
			if (/function\s*\(/.test(expr)) return false;

			// Avoid arrow functions (for now)
			if (/=>\s*/.test(expr)) return false;
		}
	}

	return true;
}

/**
 * Extracts variable dependencies from function source.
 * Identifies external variables that need to be preserved in compiled function.
 *
 * @param {string} source - Function source code
 * @param {string[]} parameters - Function parameters
 * @returns {string[]} Array of external variable names
 */
export function extractVariableDependencies(source, parameters) {
	const dependencies = new Set();
	const paramSet = new Set(parameters);

	// Common JavaScript identifiers that are likely variables
	const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
	let match;

	match = identifierRegex.exec(source);
	while (match !== null) {
		const identifier = match[1];

		// Skip JavaScript keywords and built-ins
		if (isBuiltinIdentifier(identifier)) continue;

		// Skip function parameters
		if (paramSet.has(identifier)) continue;

		// Skip function/variable declarations within the function
		if (isDeclaredLocally(source, identifier)) continue;

		dependencies.add(identifier);

		match = identifierRegex.exec(source);
	}

	return Array.from(dependencies);
}

/**
 * Checks if an identifier is a JavaScript built-in.
 *
 * @param {string} identifier - Identifier to check
 * @returns {boolean} True if built-in
 */
function isBuiltinIdentifier(identifier) {
	const builtins = new Set([
		// JavaScript keywords
		"break",
		"case",
		"catch",
		"class",
		"const",
		"continue",
		"debugger",
		"default",
		"delete",
		"do",
		"else",
		"export",
		"extends",
		"finally",
		"for",
		"function",
		"if",
		"import",
		"in",
		"instanceof",
		"let",
		"new",
		"return",
		"super",
		"switch",
		"this",
		"throw",
		"try",
		"typeof",
		"var",
		"void",
		"while",
		"with",
		"yield",

		// Global objects and functions
		"Array",
		"Boolean",
		"Date",
		"Error",
		"Function",
		"Math",
		"Number",
		"Object",
		"RegExp",
		"String",
		"JSON",
		"Promise",
		"Symbol",
		"Map",
		"Set",
		"WeakMap",
		"WeakSet",
		"Proxy",
		"Reflect",
		"ArrayBuffer",
		"DataView",
		"Int8Array",
		"Uint8Array",
		"console",
		"parseInt",
		"parseFloat",
		"isNaN",
		"isFinite",
		"encodeURIComponent",
		"decodeURIComponent",

		// Common globals
		"undefined",
		"null",
		"true",
		"false",
		"Infinity",
		"NaN",
	]);

	return builtins.has(identifier);
}

/**
 * Checks if a variable is declared locally within the function.
 *
 * @param {string} source - Function source code
 * @param {string} identifier - Variable identifier
 * @returns {boolean} True if declared locally
 */
function isDeclaredLocally(source, identifier) {
	// Check for variable declarations
	const declarationPatterns = [
		new RegExp(`\\b(?:var|let|const)\\s+${identifier}\\b`),
		new RegExp(`\\bfunction\\s+${identifier}\\b`),
		new RegExp(`\\b${identifier}\\s*=\\s*function`),
		new RegExp(`\\b${identifier}\\s*=>`),
	];

	return declarationPatterns.some((pattern) => pattern.test(source));
}
