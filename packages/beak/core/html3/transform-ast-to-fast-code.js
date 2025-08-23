/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file AST-to-optimized-code transformer
 *
 * Converts tagged template literal AST into V8-optimized string concatenation
 * while preserving all user code exactly as-is. Performance-focused implementation.
 */

/**
 * Transforms an AST from parseCodeIntoAst into V8-optimized string concatenation code.
 *
 * Converts tagged template literals like `html\`<div>\${name}</div>\`` into
 * fast string concatenation like `"<div>" + name + "</div>"` while preserving
 * all user code exactly as written.
 *
 * @param {{type: string, parts: Array<{type: string, content?: string, functionName?: string, strings?: string[], expressions?: Array<{content: string, ast?: Object}>}>}} ast - The AST to transform
 * @returns {string} Optimized JavaScript code using string concatenation
 *
 * @example
 * const ast = parseCodeIntoAst("html", "return html`<div>${name}</div>`;");
 * const code = transformAstToFastCode(ast);
 * // Returns: 'return "<div>" + name + "</div>";'
 */
export function transformAstToFastCode(ast) {
	if (!ast || ast.type !== "functionBody" || !Array.isArray(ast.parts)) {
		return "";
	}

	return ast.parts.map((part) => transformPart(part)).join("");
}

/**
 * Transforms a single AST part into optimized code.
 *
 * @param {{type: string, content?: string, functionName?: string, strings?: string[], expressions?: Array<{content: string, ast?: Object}>}} part - AST part to transform
 * @returns {string} Transformed code fragment
 */
function transformPart(part) {
	if (!part || typeof part.type !== "string") {
		return "";
	}

	if (part.type === "code") {
		// Preserve user code exactly as-is
		return part.content || "";
	}

	if (part.type === "taggedTemplate") {
		return transformTaggedTemplate(part);
	}

	return "";
}

/**
 * Transforms a tagged template part into V8-optimized string concatenation.
 *
 * Converts structures like:
 * - strings: ["<div>", "</div>"]
 * - expressions: [{content: "name"}]
 *
 * Into: `"<div>" + name + "</div>"`
 *
 * @param {{functionName?: string, strings?: string[], expressions?: Array<{content: string, ast?: Object}>}} template - Tagged template AST node
 * @returns {string} Optimized concatenation code
 */
function transformTaggedTemplate(template) {
	const strings = template.strings || [];
	const expressions = template.expressions || [];

	if (strings.length === 0) {
		return '""'; // Empty template
	}

	if (strings.length === 1 && expressions.length === 0) {
		// Static template with no expressions: html`<div>Hello</div>`
		return JSON.stringify(strings[0]);
	}

	// Build concatenation: "string1" + expr1 + "string2" + expr2 + ...
	const parts = [];

	for (let i = 0; i < strings.length; i++) {
		// Add string part if not empty
		if (strings[i] !== "") {
			parts.push(JSON.stringify(strings[i]));
		}

		// Add expression part if it exists
		if (i < expressions.length) {
			const expr = expressions[i];
			if (expr?.content) {
				// If expression has nested AST, transform it recursively
				if (expr.ast?.parts?.length > 0) {
					const transformedExpr = transformAstToFastCode(expr.ast);
					if (transformedExpr.trim()) {
						// Only wrap if the transformed expression contains multiple parts or operators
						if (expr.ast.parts.length > 1 || transformedExpr.includes(" + ")) {
							parts.push(`(${transformedExpr})`);
						} else {
							parts.push(transformedExpr);
						}
					}
				} else {
					// Simple expression - check if it needs parentheses for precedence
					const content = expr.content;
					if (content.includes("?") && content.includes(":")) {
						// Ternary operator needs parentheses when used in concatenation
						parts.push(`(${content})`);
					} else if (content.includes("&&") || content.includes("||")) {
						// Logical operators need parentheses
						parts.push(`(${content})`);
					} else {
						// Simple expression, use as-is
						parts.push(content);
					}
				}
			}
		}
	}

	if (parts.length === 0) {
		return '""';
	}

	if (parts.length === 1) {
		return parts[0];
	}

	// Join with + for optimal V8 performance
	return parts.join(" + ");
}
