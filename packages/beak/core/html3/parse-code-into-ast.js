/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Code-to-AST parser for tagged template literals
 *
 * Lean implementation that parses function bodies into AST while preserving
 * all user code exactly as-is. Only dissects tagged template literals.
 */

/**
 * Parses a function body into an AST that identifies tagged template literals.
 *
 * Creates a recursive tree structure that preserves all user code while
 * dissecting tagged template literals for optimization. Handles nested
 * expressions and complex edge cases gracefully.
 *
 * @param {string} functionName - The tagged template function name to look for
 * @param {string} functionBody - The function body string to parse
 * @returns {Object} AST with perfect reconstruction capability
 *
 * @example
 * const ast = parseCodeIntoAst("html", "return html`<div>${name}</div>`;");
 * // Returns: { type: "functionBody", parts: [...] }
 */
export function parseCodeIntoAst(functionName, functionBody) {
	if (typeof functionName !== "string" || typeof functionBody !== "string") {
		return {
			type: "functionBody",
			parts: [{ type: "code", content: functionBody || "" }],
		};
	}

	try {
		const parts = [];
		let position = 0;

		while (position < functionBody.length) {
			// Look for tagged template: functionName`
			const taggedTemplateIndex = findNextTaggedTemplate(
				functionBody,
				functionName,
				position,
			);

			if (taggedTemplateIndex === -1) {
				// No more tagged templates - add remaining code
				if (position < functionBody.length) {
					parts.push({
						type: "code",
						content: functionBody.slice(position),
					});
				}
				break;
			}

			// Add code before tagged template
			if (taggedTemplateIndex > position) {
				parts.push({
					type: "code",
					content: functionBody.slice(position, taggedTemplateIndex),
				});
			}

			// Parse the tagged template
			const templateResult = parseTaggedTemplate(
				functionBody,
				functionName,
				taggedTemplateIndex,
			);
			if (templateResult) {
				parts.push(templateResult.ast);
				position = templateResult.endPosition;
			} else {
				// Failed to parse - find next reasonable position to continue
				const nextNewline = functionBody.indexOf("\n", taggedTemplateIndex);
				const nextSpace = functionBody.indexOf(
					" ",
					taggedTemplateIndex + functionName.length,
				);
				const nextSemi = functionBody.indexOf(";", taggedTemplateIndex);

				let nextPos = Math.min(
					nextNewline === -1 ? Infinity : nextNewline,
					nextSpace === -1 ? Infinity : nextSpace,
					nextSemi === -1 ? Infinity : nextSemi,
				);

				if (nextPos === Infinity) {
					nextPos = functionBody.length;
				}

				parts.push({
					type: "code",
					content: functionBody.slice(taggedTemplateIndex, nextPos),
				});
				position = nextPos;
			}
		}

		return { type: "functionBody", parts };
	} catch {
		// Graceful fallback - return original code as single part
		return {
			type: "functionBody",
			parts: [{ type: "code", content: functionBody }],
		};
	}
}

/**
 * Finds the next occurrence of a tagged template literal.
 * Handles edge cases like backticks in strings and comments.
 *
 * @param {string} code - Code to search in
 * @param {string} functionName - Function name to look for
 * @param {number} startPosition - Position to start searching from
 * @returns {number} Index of tagged template or -1 if not found
 */
function findNextTaggedTemplate(code, functionName, startPosition) {
	const searchPattern = functionName + "`";
	let position = startPosition;

	while (position < code.length) {
		const index = code.indexOf(searchPattern, position);
		if (index === -1) return -1;

		// Check if this is actually a tagged template (not inside string/comment)
		if (isValidTaggedTemplatePosition(code, index)) {
			return index;
		}

		position = index + 1;
	}

	return -1;
}

/**
 * Validates that a potential tagged template position is not inside a string or comment.
 *
 * @param {string} code - The code string
 * @param {number} index - Position to validate

 * @returns {boolean} True if position is valid for tagged template
 */
function isValidTaggedTemplatePosition(code, index) {
	// Check if preceded by identifier boundary
	if (index === 0) return true;

	const prevChar = code[index - 1];
	const validPreceding = /[\s()[\]{};,=!&|+\-*/<>\n\r\t]/.test(prevChar);

	if (!validPreceding) return false;

	// Simple check: scan backwards for unclosed strings within reasonable distance
	let pos = Math.max(0, index - 100); // Don't scan too far back for performance
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let inTemplate = false;

	while (pos < index) {
		const char = code[pos];

		if (char === "'" && !inDoubleQuote && !inTemplate) {
			// Check if escaped
			let escapeCount = 0;
			let checkPos = pos - 1;
			while (checkPos >= 0 && code[checkPos] === "\\") {
				escapeCount++;
				checkPos--;
			}
			if (escapeCount % 2 === 0) {
				inSingleQuote = !inSingleQuote;
			}
		} else if (char === '"' && !inSingleQuote && !inTemplate) {
			// Check if escaped
			let escapeCount = 0;
			let checkPos = pos - 1;
			while (checkPos >= 0 && code[checkPos] === "\\") {
				escapeCount++;
				checkPos--;
			}
			if (escapeCount % 2 === 0) {
				inDoubleQuote = !inDoubleQuote;
			}
		} else if (char === "`" && !inSingleQuote && !inDoubleQuote) {
			// Check if escaped
			let escapeCount = 0;
			let checkPos = pos - 1;
			while (checkPos >= 0 && code[checkPos] === "\\") {
				escapeCount++;
				checkPos--;
			}
			if (escapeCount % 2 === 0) {
				inTemplate = !inTemplate;
			}
		}

		pos++;
	}

	return !inSingleQuote && !inDoubleQuote && !inTemplate;
}

/**
 * Parses a tagged template literal starting at the given position.
 *
 * @param {string} code - Full code string
 * @param {string} functionName - Tagged template function name
 * @param {number} startIndex - Start position of tagged template
 * @returns {{ast: Object, endPosition: number}|null} Parse result with ast and endPosition, or null if failed
 */
function parseTaggedTemplate(code, functionName, startIndex) {
	const backtickIndex = startIndex + functionName.length;
	if (backtickIndex >= code.length || code[backtickIndex] !== "`") {
		return null;
	}

	const templateResult = parseTemplateLiteral(code, backtickIndex);
	if (!templateResult) return null;

	return {
		ast: {
			type: "taggedTemplate",
			functionName,
			strings: templateResult.strings,
			expressions: templateResult.expressions.map((expr) => ({
				type: "expression",
				content: expr,
				ast: parseCodeIntoAst(functionName, expr), // Recursive parsing
			})),
		},
		endPosition: templateResult.endPosition,
	};
}

/**
 * Parses a template literal (the `...` part) into strings and expressions.
 *
 * @param {string} code - Code string
 * @param {number} startIndex - Index of opening backtick
 * @returns {{strings: string[], expressions: string[], endPosition: number}|null} Parse result with strings, expressions, endPosition
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
			// Handle escaped characters
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
 * Parses an expression inside ${...} using brace counting.
 *
 * @param {string} code - Code string
 * @param {number} startIndex - Index after opening ${
 * @returns {{content: string, endPosition: number}|null} Parse result with content and endPosition
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
				// End of expression
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
 * Skips over a string literal to avoid parsing its contents.
 *
 * @param {string} code - Code string
 * @param {number} startIndex - Index of opening quote/backtick
 * @returns {{endPosition: number}} Result with endPosition
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
 * Reconstructs the original function body from an AST.
 * Used for validation and roundtrip testing.
 *
 * @param {{type: string, parts: Array<{type: string, content?: string, functionName?: string, strings?: string[], expressions?: Array<{content: string}>}>}} ast - The AST to reconstruct from
 * @returns {string} Reconstructed function body
 */
export function reconstructFromAst(ast) {
	if (!ast || ast.type !== "functionBody") {
		return "";
	}

	return ast.parts
		.map((part) => {
			if (part.type === "code") {
				return part.content || "";
			}

			if (part.type === "taggedTemplate") {
				const { functionName, strings, expressions } = part;
				let result = (functionName || "") + "`";

				const safeStrings = strings || [];
				const safeExpressions = expressions || [];

				for (let i = 0; i < safeStrings.length; i++) {
					result += safeStrings[i];
					if (i < safeExpressions.length) {
						result += "${" + (safeExpressions[i]?.content || "") + "}";
					}
				}

				result += "`";
				return result;
			}

			return "";
		})
		.join("");
}
