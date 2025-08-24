/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file AST-based template literal inlining - surgical optimization
 *
 * Single-pass AST transformer that converts nested tagged templates
 * to direct string concatenation. Raven-lean, zero waste.
 */

/**
 * @typedef {Object} ASTNode
 * @property {string} type - Node type
 * @property {string} content - Text content
 * @property {string} tagName - Tag name for template nodes
 * @property {ASTNode[]} children - Child nodes
 */

/**
 * AST node types for template parsing
 */
const NodeType = {
	TEMPLATE: "template",
	EXPRESSION: "expression",
	TEXT: "text",
};

/**
 * Create AST node with text fragment
 * @param {string} type - Node type
 * @param {string} content - Text content
 * @param {string} [tagName] - Tag name for template nodes
 * @returns {ASTNode} AST node
 */
function createNode(type, content, tagName = null) {
	return {
		type,
		content,
		tagName,
		children: [],
	};
}

/**
 * Extract tag name from function source - single match, surgical precision
 * @param {string} source - Function source code
 * @returns {string|null} Tag name or null
 */
function extractTagName(source) {
	const match = source.match(/\b(\w+)`/);
	return match ? match[1] : null;
}

/**
 * Context-aware AST parser for tagged templates - skips strings and comments
 * @param {string} code - Source code to parse
 * @param {string} tagName - Tag name to match
 * @returns {ASTNode[]} Array of AST nodes
 */
function parseTemplateAST(code, tagName) {
	const nodes = [];
	const target = tagName + "`";
	let i = 0;

	while (i < code.length) {
		// Find next potential tagged template, skipping strings and comments
		const tagIndex = findNextTemplate(code, target, i);
		if (tagIndex === -1) {
			// Add remaining code as text node if any
			if (i < code.length) {
				nodes.push(createNode(NodeType.TEXT, code.slice(i)));
			}
			break;
		}

		// Add text before tag as text node
		if (tagIndex > i) {
			nodes.push(createNode(NodeType.TEXT, code.slice(i, tagIndex)));
		}

		// Parse template starting after backtick
		const templateStart = tagIndex + target.length;
		const templateResult = parseTemplate(code, templateStart, tagName);

		nodes.push(templateResult.node);
		i = templateResult.endPos;
	}

	return nodes;
}

/**
 * Find next tagged template - optimized for speed
 * @param {string} code - Source code
 * @param {string} target - Target string to find (e.g., "tag`")
 * @param {number} start - Start position
 * @returns {number} Index of next template, or -1 if not found
 */
function findNextTemplate(code, target, start) {
	let pos = start;
	const targetLength = target.length;

	while (pos < code.length) {
		const char = code[pos];

		// Fast check for target match first (most common case)
		if (
			char === target[0] &&
			pos + targetLength <= code.length &&
			code.substr(pos, targetLength) === target
		) {
			return pos;
		}

		// Skip string literals
		if (char === '"' || char === "'") {
			pos = skipStringFast(code, pos, char);
			continue;
		}

		// Skip template literals
		if (char === "`") {
			pos = skipStringFast(code, pos, char);
			continue;
		}

		// Skip comments
		if (char === "/" && pos + 1 < code.length) {
			const nextChar = code[pos + 1];
			if (nextChar === "/") {
				// Skip line comment
				pos = code.indexOf("\n", pos + 2);
				if (pos === -1) break;
				continue;
			}
			if (nextChar === "*") {
				// Skip block comment
				pos = code.indexOf("*/", pos + 2);
				if (pos === -1) break;
				pos += 2;
				continue;
			}
		}

		pos++;
	}

	return -1;
}

/**
 * Fast string skipping - optimized version
 * @param {string} code - Source code
 * @param {number} start - Start position
 * @param {string} quote - Quote character
 * @returns {number} End position
 */
function skipStringFast(code, start, quote) {
	let pos = start + 1;

	while (pos < code.length) {
		const char = code[pos];

		if (char === quote) {
			return pos + 1;
		}

		if (char === "\\") {
			pos += 2; // Skip escaped character
			continue;
		}

		pos++;
	}

	return pos; // Unclosed string - return end
}

/**
 * Parse template literal with depth-aware expression tracking
 * @param {string} code - Source code
 * @param {number} start - Start position (after opening backtick)
 * @param {string} tagName - Tag name for recursive parsing
 * @returns {{node: ASTNode, endPos: number}|null} Template node and end position
 */
function parseTemplate(code, start, tagName) {
	const templateNode = createNode(NodeType.TEMPLATE, "", tagName);
	let pos = start;
	let currentText = "";

	while (pos < code.length) {
		const char = code[pos];

		// End of template literal
		if (char === "`") {
			if (currentText) {
				templateNode.children.push(createNode(NodeType.TEXT, currentText));
			}
			return { node: templateNode, endPos: pos + 1 };
		}

		// Expression start
		if (char === "$" && pos + 1 < code.length && code[pos + 1] === "{") {
			// Save current text
			if (currentText) {
				templateNode.children.push(createNode(NodeType.TEXT, currentText));
				currentText = "";
			}

			// Parse expression with depth tracking
			const exprResult = parseExpression(code, pos + 2, tagName);

			templateNode.children.push(exprResult.node);
			pos = exprResult.endPos;
			continue;
		}

		// Handle escapes
		if (char === "\\" && pos + 1 < code.length) {
			currentText += char + code[pos + 1];
			pos += 2;
			continue;
		}

		currentText += char;
		pos++;
	}

	throw new Error("Unclosed template literal");
}

/**
 * Parse expression with proper delimiter tracking - content agnostic
 * @param {string} code - Source code
 * @param {number} start - Start position after ${
 * @param {string} tagName - Tag name for recursive parsing
 * @returns {{node: ASTNode, endPos: number}|null} Expression node and end position
 */
function parseExpression(code, start, tagName) {
	let braceDepth = 1; // We start inside ${ already
	let pos = start;
	let content = "";

	while (pos < code.length && braceDepth > 0) {
		const char = code[pos];

		// Handle string literals first - skip their content entirely
		if (char === '"' || char === "'" || char === "`") {
			const { content: strContent, endPos } = skipString(code, pos);
			content += strContent;
			pos = endPos;
			continue;
		}

		// Track all bracket types for proper nesting
		if (char === "{") {
			braceDepth++;
		} else if (char === "}") {
			braceDepth--;
			if (braceDepth === 0) {
				// Found the closing brace for our expression
				return {
					node: createNode(NodeType.EXPRESSION, content),
					endPos: pos + 1,
				};
			}
		}

		content += char;
		pos++;
	}

	throw new Error("Unclosed expression");
}

/**
 * Skip string literal and return content + end position
 * @param {string} code - Source code
 * @param {number} start - Index of opening quote
 * @returns {{content: string, endPos: number}|null} String content and end position, null if malformed
 */
function skipString(code, start) {
	const quote = code[start];
	let pos = start + 1;
	let content = quote; // Include opening quote

	while (pos < code.length) {
		const char = code[pos];
		content += char;

		if (char === quote) {
			return { content, endPos: pos + 1 };
		}

		if (char === "\\" && pos + 1 < code.length) {
			// Include escaped character
			content += code[pos + 1];
			pos += 2;
			continue;
		}

		pos++;
	}

	// Unclosed string is malformed
	throw new Error("Unclosed string literal");
}

/**
 * Process escape sequences in template strings - surgical precision
 * @param {string} str - Raw template string
 * @returns {string} Processed string
 */
function processEscapes(str) {
	return str
		.replace(/\\`/g, "`")
		.replace(/\\\$/g, "$")
		.replace(/\\n/g, "\n")
		.replace(/\\r/g, "\r")
		.replace(/\\t/g, "\t")
		.replace(/\\"/g, '"')
		.replace(/\\'/g, "'")
		.replace(/\\\\/g, "\\");
}

/**
 * Transform AST node to optimized code - recursive and content-agnostic
 * @param {ASTNode} node - AST node to transform
 * @param {string} tagName - Tag name for nested template detection
 * @returns {string} Optimized JavaScript code
 */
function transformNode(node, tagName) {
	if (node.type === NodeType.TEXT) {
		return node.content;
	}

	if (node.type === NodeType.EXPRESSION) {
		// Parse expression content for nested templates and transform them
		const nestedAST = parseTemplateAST(node.content, tagName);
		let result = "";

		for (const child of nestedAST) {
			const transformed = transformNode(child, tagName);
			if (transformed === null) return null;
			result += transformed;
		}

		return result;
	}

	if (node.type === NodeType.TEMPLATE) {
		// Transform template to string concatenation
		const parts = [];

		for (const child of node.children) {
			if (child.type === NodeType.TEXT) {
				// Process escapes and stringify
				const processed = processEscapes(child.content);
				if (processed) {
					parts.push(JSON.stringify(processed));
				}
			} else if (child.type === NodeType.EXPRESSION) {
				// Transform nested expressions recursively
				const transformed = transformNode(child, tagName);
				if (transformed.trim()) {
					// Wrap expressions that need precedence protection in string concatenation
					const needsWrapping =
						transformed.includes("?") ||
						transformed.includes("&&") ||
						transformed.includes("||") ||
						transformed.includes("===") ||
						transformed.includes("!==") ||
						/[+\-*/%]\s/.test(transformed) || // Binary operators with following space
						/\s[+\-*/%]/.test(transformed); // Binary operators with preceding space
					parts.push(needsWrapping ? `(${transformed})` : transformed);
				}
			}
		}

		// Join with concatenation
		if (parts.length === 0) return '""';
		if (parts.length === 1) return parts[0];
		return parts.join(" + ");
	}

	return node.content;
}

/**
 * Transform function body using AST approach
 * @param {string} functionBody - Function body source
 * @param {string} tagName - Tag name to optimize
 * @returns {string} Optimized function body
 */
function transformFunctionBody(functionBody, tagName) {
	try {
		const ast = parseTemplateAST(functionBody, tagName);
		let result = "";

		for (const node of ast) {
			const transformed = transformNode(node, tagName);
			if (transformed === null) {
				// Transformation failed, return original
				return functionBody;
			}
			result += transformed;
		}

		return result;
	} catch {
		// Parsing failed, return original
		return functionBody;
	}
}

/**
 * Extract function body from function source - lean approach
 * @param {Function} fn - Function to extract body from
 * @returns {string} Function body content
 */
function extractFunctionBody(fn) {
	const source = fn.toString();

	// Arrow function with expression: () => expression
	const arrowIndex = source.indexOf("=>");
	if (arrowIndex !== -1) {
		const afterArrow = source.slice(arrowIndex + 2).trim();
		if (!afterArrow.startsWith("{")) {
			return `return ${afterArrow}`;
		}

		// Arrow function with block body: () => { ... }
		const blockStart = source.indexOf("{", arrowIndex);
		const blockEnd = source.lastIndexOf("}");
		if (blockStart !== -1 && blockEnd !== -1 && blockEnd > blockStart) {
			return source.slice(blockStart + 1, blockEnd).trim();
		}
	}

	// Regular function: function name() { ... }
	const functionMatch = source.match(/^(?:async\s+)?function[^{]*\{(.*)\}$/s);
	if (functionMatch) {
		return functionMatch[1].trim();
	}

	// Fallback: find braces
	const openBrace = source.indexOf("{");
	const closeBrace = source.lastIndexOf("}");
	if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
		return source.slice(openBrace + 1, closeBrace).trim();
	}

	return "";
}

/**
 * Extract function parameters - lean approach
 * @param {Function} fn - Function to extract parameters from
 * @returns {string} Parameter string
 */
function extractFunctionParams(fn) {
	const source = fn.toString();

	// Arrow function with parentheses: (param) =>
	const parenArrowMatch = source.match(/^\s*\(([^)]*)\)\s*=>/);
	if (parenArrowMatch) {
		return parenArrowMatch[1].trim();
	}

	// Simple arrow function: param =>
	const simpleArrowMatch = source.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
	if (simpleArrowMatch) {
		return simpleArrowMatch[1].trim();
	}

	// Regular function: function name(params)
	const paramMatch = source.match(/^(?:async\s+)?function[^(]*\(([^)]*)\)/);
	if (paramMatch) {
		return paramMatch[1].trim();
	}

	return "";
}

/**
 * Optimize function with AST-based template inlining - raven intelligence
 * @param {Function} templateFunction - Function with tagged templates
 * @returns {Function} Optimized function with inlined templates
 */
export function inline(templateFunction) {
	try {
		const functionSource = templateFunction.toString();
		const tagName = extractTagName(functionSource);

		if (!tagName) {
			return templateFunction;
		}

		// EARLY CLOSURE DETECTION: Check source before any processing
		// If function contains closure calls, skip optimization entirely - zero overhead!
		const hasClosureReferencesInSource = /\b[A-Z][a-zA-Z0-9]*\s*\(/.test(
			functionSource,
		);
		if (hasClosureReferencesInSource) {
			// Return original function unchanged - preserves performance and closure access
			return templateFunction;
		}

		const functionBody = extractFunctionBody(templateFunction);
		const params = extractFunctionParams(templateFunction);

		// Transform using AST approach (only for closure-free functions)
		const optimizedBody = transformFunctionBody(functionBody, tagName);

		// Return original if no optimization possible
		if (optimizedBody === functionBody) {
			return templateFunction;
		}

		// SIMPLE FUNCTIONS ONLY: Direct eval for maximum performance
		const functionName = templateFunction.name || "optimized";
		const optimizedFunction = eval(
			`(function ${functionName}(${params}) { ${optimizedBody} })`,
		);
		return optimizedFunction;
	} catch (error) {
		// Graceful fallback - raven survival instinct
		console.warn(
			"Template inlining failed, using original function:",
			error.message,
		);
		return templateFunction;
	}
}
