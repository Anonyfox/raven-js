/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Template literal inlining - optimize nested tagged template calls
 *
 * Converts nested tagged template calls into direct string concatenation,
 * eliminating function call overhead for significant performance gains.
 */

/**
 * Extract the tag name from a wrapper function containing tagged template literals
 * @param {string} functionSource - Function source code
 * @returns {string|null} Tag name or null if not found
 */
function extractTagName(functionSource) {
	// Look for pattern: tagName`...` anywhere in the function
	const match = functionSource.match(/\b(\w+)`/);
	return match ? match[1] : null;
}

/**
 * Check if a position in code is inside a string literal, comment, or template
 * @param {string} code - Source code
 * @param {number} position - Position to check
 * @returns {boolean} True if position is safe for replacement
 */
function isValidPosition(code, position) {
	// Check if preceded by valid boundary (not part of identifier)
	if (position > 0) {
		const prevChar = code[position - 1];
		if (!/[\s()[\]{};,=!&|+\-*/<>\n\r\t]/.test(prevChar)) {
			return false;
		}
	}

	// Scan backwards to check if we're inside string/comment/template
	let pos = Math.max(0, position - 200); // Reasonable scan distance
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let inTemplate = false;
	let inLineComment = false;
	let inBlockComment = false;

	while (pos < position) {
		const char = code[pos];
		const nextChar = pos + 1 < code.length ? code[pos + 1] : "";

		// Handle comments first
		if (!inSingleQuote && !inDoubleQuote && !inTemplate && !inBlockComment) {
			if (char === "/" && nextChar === "/") {
				inLineComment = true;
				pos += 2;
				continue;
			}
			if (char === "/" && nextChar === "*") {
				inBlockComment = true;
				pos += 2;
				continue;
			}
		}

		if (inLineComment && char === "\n") {
			inLineComment = false;
		}

		if (inBlockComment && char === "*" && nextChar === "/") {
			inBlockComment = false;
			pos += 2;
			continue;
		}

		if (inLineComment || inBlockComment) {
			pos++;
			continue;
		}

		// Handle string literals
		if (char === "'" && !inDoubleQuote && !inTemplate) {
			if (pos === 0 || code[pos - 1] !== "\\") {
				inSingleQuote = !inSingleQuote;
			}
		} else if (char === '"' && !inSingleQuote && !inTemplate) {
			if (pos === 0 || code[pos - 1] !== "\\") {
				inDoubleQuote = !inDoubleQuote;
			}
		} else if (char === "`" && !inSingleQuote && !inDoubleQuote) {
			if (pos === 0 || code[pos - 1] !== "\\") {
				inTemplate = !inTemplate;
			}
		}

		pos++;
	}

	return (
		!inSingleQuote &&
		!inDoubleQuote &&
		!inTemplate &&
		!inLineComment &&
		!inBlockComment
	);
}

/**
 * Parse a template literal starting from the opening backtick
 * @param {string} code - Source code
 * @param {number} startIndex - Index of opening backtick
 * @returns {{strings: string[], expressions: string[], endPosition: number}|null} Parse result
 */
function parseTemplateLiteral(code, startIndex) {
	const strings = [];
	const expressions = [];
	let position = startIndex + 1; // Skip opening backtick
	let currentString = "";

	while (position < code.length) {
		const char = code[position];

		if (char === "`") {
			// End of template literal
			strings.push(currentString);
			return { strings, expressions, endPosition: position + 1 };
		}

		if (
			char === "$" &&
			position + 1 < code.length &&
			code[position + 1] === "{"
		) {
			// Start of expression
			strings.push(currentString);
			currentString = "";

			const expressionResult = parseExpression(code, position + 2);
			if (!expressionResult) return null;

			expressions.push(expressionResult.content);
			position = expressionResult.endPosition;
			continue;
		}

		if (char === "\\" && position + 1 < code.length) {
			// Handle escaped characters - keep them as-is
			currentString += char + code[position + 1];
			position += 2;
			continue;
		}

		currentString += char;
		position++;
	}

	// Unclosed template literal
	return null;
}

/**
 * Parse an expression inside ${...} with proper brace counting
 * @param {string} code - Source code
 * @param {number} startIndex - Index after opening ${
 * @returns {{content: string, endPosition: number}|null} Expression content and end position
 */
function parseExpression(code, startIndex) {
	let braceCount = 1;
	let position = startIndex;
	const content = [];

	while (position < code.length && braceCount > 0) {
		const char = code[position];

		if (char === "{") {
			braceCount++;
		} else if (char === "}") {
			braceCount--;
			if (braceCount === 0) {
				return {
					content: content.join(""),
					endPosition: position + 1,
				};
			}
		}

		// Handle string literals to avoid counting braces inside strings
		if (char === '"' || char === "'" || char === "`") {
			const stringResult = skipStringLiteral(code, position);
			for (let i = position; i < stringResult.endPosition; i++) {
				content.push(code[i]);
			}
			position = stringResult.endPosition;
			continue;
		}

		content.push(char);
		position++;
	}

	// Unclosed expression
	return null;
}

/**
 * Skip over a string literal to avoid parsing its contents
 * @param {string} code - Source code
 * @param {number} startIndex - Index of opening quote/backtick
 * @returns {{endPosition: number}} End position after closing quote
 */
function skipStringLiteral(code, startIndex) {
	const quote = code[startIndex];
	let position = startIndex + 1;

	while (position < code.length) {
		const char = code[position];

		if (char === quote) {
			return { endPosition: position + 1 };
		}

		if (char === "\\" && position + 1 < code.length) {
			// Skip escaped character
			position += 2;
			continue;
		}

		position++;
	}

	// Unclosed string - return current position
	return { endPosition: position };
}

/**
 * Process escape sequences in template literal strings the same way JavaScript does
 * @param {string} str - Raw string from template parsing
 * @returns {string} String with escape sequences processed
 */
function processEscapeSequences(str) {
	return str
		.replace(/\\`/g, "`") // \` → `
		.replace(/\\\$/g, "$") // \$ → $
		.replace(/\\n/g, "\n") // \n → newline
		.replace(/\\r/g, "\r") // \r → carriage return
		.replace(/\\t/g, "\t") // \t → tab
		.replace(/\\"/g, '"') // \" → "
		.replace(/\\'/g, "'") // \' → '
		.replace(/\\\\/g, "\\"); // \\ → \ (must be last)
}

/**
 * Convert a template literal to direct string concatenation
 * @param {{strings: string[], expressions: string[]}} template - Parsed template
 * @returns {string} Direct concatenation code
 */
function templateToConcatenation(template) {
	const { strings, expressions } = template;

	if (strings.length === 0) {
		return '""';
	}

	if (strings.length === 1 && expressions.length === 0) {
		// Static template: html`<div>Hello</div>` → `"<div>Hello</div>"`
		const processedString = processEscapeSequences(strings[0]);
		return JSON.stringify(processedString);
	}

	// Build concatenation: "string1" + expr1 + "string2" + expr2 + ...
	const parts = [];

	for (let i = 0; i < strings.length; i++) {
		// Add string part if not empty
		if (strings[i] !== "") {
			// Process escape sequences the same way template literals do
			const processedString = processEscapeSequences(strings[i]);
			// Use JSON.stringify to properly escape the processed string for JavaScript
			parts.push(JSON.stringify(processedString));
		}

		// Add expression part if it exists
		if (i < expressions.length) {
			const expr = expressions[i].trim();
			if (expr) {
				// Wrap complex expressions in parentheses for safety
				if (expr.includes("?") && expr.includes(":")) {
					// Ternary operator
					parts.push(`(${expr})`);
				} else if (expr.includes("&&") || expr.includes("||")) {
					// Logical operators
					parts.push(`(${expr})`);
				} else {
					// Simple expression
					parts.push(expr);
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

	return parts.join(" + ");
}

/**
 * Find and replace all nested tagged template literals in function body
 * @param {string} functionBody - Function body source code
 * @param {string} tagName - Tag name to look for (e.g., "html", "html2")
 * @returns {string} Optimized function body with inlined templates
 */
function inlineTaggedTemplates(functionBody, tagName) {
	let optimizedBody = functionBody;
	let position = 0;
	const searchPattern = tagName + "`";

	while (position < optimizedBody.length) {
		// Find next potential tagged template
		const templateIndex = optimizedBody.indexOf(searchPattern, position);
		if (templateIndex === -1) break;

		// Verify it's a valid position (not in string/comment)
		if (!isValidPosition(optimizedBody, templateIndex)) {
			position = templateIndex + 1;
			continue;
		}

		// Parse the template literal
		const backtickIndex = templateIndex + tagName.length;
		const templateResult = parseTemplateLiteral(optimizedBody, backtickIndex);

		if (!templateResult) {
			position = templateIndex + 1;
			continue;
		}

		// Convert to direct concatenation
		const optimizedCode = templateToConcatenation(templateResult);

		// Replace in source
		optimizedBody =
			optimizedBody.slice(0, templateIndex) +
			optimizedCode +
			optimizedBody.slice(templateResult.endPosition);

		// Continue from the end of our replacement
		position = templateIndex + optimizedCode.length;
	}

	return optimizedBody;
}

/**
 * Extract function body from function source, handling different function types
 * @param {Function} fn - Function to extract body from
 * @returns {string} Function body content
 */
function extractFunctionBody(fn) {
	const source = fn.toString();

	// First check if there are braces - if so, extract between them
	const openBrace = source.indexOf("{");
	const closeBrace = source.lastIndexOf("}");

	if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
		// Function has braces - extract content between them
		return source.slice(openBrace + 1, closeBrace).trim();
	}

	// Handle arrow functions without braces: () => expression
	const arrowMatch = source.match(/^.*?\s*=>\s*(.+)$/s);
	if (arrowMatch) {
		return `return ${arrowMatch[1].trim()}`;
	}

	return "";
}

/**
 * Extract function parameters from function source
 * @param {Function} fn - Function to extract parameters from
 * @returns {string} Parameter string
 */
function extractFunctionParams(fn) {
	const source = fn.toString();

	// Handle different function formats
	const paramMatch = source.match(
		/(?:function[^(]*|async\s+function[^(]*|\w+\s*|\([^)]*\)\s*)\(([^)]*)\)/,
	);
	if (paramMatch) {
		return paramMatch[1].trim();
	}

	// Arrow function params
	const arrowMatch = source.match(/^\s*([^=]*?)\s*=>/);
	if (arrowMatch) {
		const params = arrowMatch[1].trim();
		// Remove parentheses if present
		return params.startsWith("(") && params.endsWith(")")
			? params.slice(1, -1).trim()
			: params;
	}

	return "";
}

/**
 * Optimize a function by inlining nested tagged template literals
 * @param {Function} templateFunction - Function containing tagged template literals
 * @returns {Function} Optimized function with inlined templates
 */
export function inline(templateFunction) {
	try {
		// Extract tag name from the function source
		const functionSource = templateFunction.toString();
		const tagName = extractTagName(functionSource);

		if (!tagName) {
			// No tagged templates found, return original
			return templateFunction;
		}

		// Extract function body and parameters
		const functionBody = extractFunctionBody(templateFunction);
		const params = extractFunctionParams(templateFunction);

		// Inline all nested tagged template calls
		const optimizedBody = inlineTaggedTemplates(functionBody, tagName);

		// If no changes were made, return original
		if (optimizedBody === functionBody) {
			return templateFunction;
		}

		// Create new function with optimized body
		const functionName = templateFunction.name || "anonymous";
		const newFunctionCode = `return function ${functionName}(${params}) {\n${optimizedBody}\n}`;

		const optimizedFunction = new Function(newFunctionCode)();

		return optimizedFunction;
	} catch (error) {
		// Graceful fallback on any error
		console.warn(
			"Template inlining failed, using original function:",
			error.message,
		);
		return templateFunction;
	}
}
