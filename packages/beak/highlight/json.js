/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSON syntax highlighter using Bootstrap semantic classes
 *
 * Transforms JSON source code into semantically highlighted HTML using Bootstrap
 * color classes. Handles object keys, string values, numbers, booleans, null,
 * and structural punctuation with zero dependencies and optimal performance.
 * Also supports JSON5/JSONC comments for enhanced compatibility.
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
const escapeHtml = (text) =>
	text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

/**
 * Wrap text in Bootstrap class span
 * @param {string} text - Text to wrap
 * @param {string} className - Bootstrap class name
 * @returns {string} Wrapped HTML span
 */
const wrapToken = (text, className) =>
	`<span class="${className}">${escapeHtml(text)}</span>`;

/**
 * JSON token types and their Bootstrap classes
 */
const TOKEN_TYPES = {
	COMMENT: "text-muted",
	OBJECT_KEY: "text-primary",
	STRING_VALUE: "text-success",
	NUMBER: "text-warning",
	BOOLEAN: "text-warning",
	NULL: "text-warning",
	PUNCTUATION: "text-secondary",
	WHITESPACE: /** @type {null} */ (null), // No highlighting
};

/**
 * Tokenize JSON source code into semantic tokens
 * @param {string} sourceText - Raw JSON source code
 * @returns {Array<{type: string, value: string, className: string|null}>} Array of {type, value, className} tokens
 */
const tokenizeJSON = (sourceText) => {
	const tokens = [];
	let i = 0;
	const braceStack = [];

	while (i < sourceText.length) {
		const char = sourceText[i];
		const nextChar = sourceText[i + 1] || "";

		// Handle single-line comments (JSON5/JSONC)
		if (char === "/" && nextChar === "/") {
			const start = i;
			i += 2;

			// Find end of line
			while (i < sourceText.length && sourceText[i] !== "\n") {
				i++;
			}

			tokens.push({
				type: "COMMENT",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.COMMENT,
			});
			continue;
		}

		// Handle multi-line comments (JSON5/JSONC)
		if (char === "/" && nextChar === "*") {
			const start = i;
			i += 2;

			// Find end of comment
			while (
				i < sourceText.length - 1 &&
				!(sourceText[i] === "*" && sourceText[i + 1] === "/")
			) {
				i++;
			}
			i += 2; // Skip */

			tokens.push({
				type: "COMMENT",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.COMMENT,
			});
			continue;
		}

		// Handle strings
		if (char === '"') {
			const start = i;
			i++; // Skip opening quote

			// Find end of string
			while (i < sourceText.length && sourceText[i] !== '"') {
				if (sourceText[i] === "\\" && i + 1 < sourceText.length) {
					i += 2; // Skip escaped character
					continue;
				}
				i++;
			}
			i++; // Skip closing quote

			const stringValue = sourceText.slice(start, i);

			// Determine if this is an object key or string value
			// Look ahead for colon to determine if it's a key
			let tempI = i;
			while (tempI < sourceText.length && /\s/.test(sourceText[tempI])) {
				tempI++;
			}
			const isKey = sourceText[tempI] === ":";

			tokens.push({
				type: isKey ? "OBJECT_KEY" : "STRING_VALUE",
				value: stringValue,
				className: isKey ? TOKEN_TYPES.OBJECT_KEY : TOKEN_TYPES.STRING_VALUE,
			});
			continue;
		}

		// Handle numbers
		if (/[-\d]/.test(char) || (char === "." && /\d/.test(nextChar))) {
			const start = i;

			// Handle negative sign
			if (char === "-") {
				i++;
			}

			// Handle integer part
			if (sourceText[i] === "0") {
				i++;
			} else if (/[1-9]/.test(sourceText[i])) {
				while (i < sourceText.length && /\d/.test(sourceText[i])) {
					i++;
				}
			}

			// Handle decimal part
			if (sourceText[i] === ".") {
				i++;
				while (i < sourceText.length && /\d/.test(sourceText[i])) {
					i++;
				}
			}

			// Handle scientific notation
			if (sourceText[i] === "e" || sourceText[i] === "E") {
				i++;
				if (sourceText[i] === "+" || sourceText[i] === "-") {
					i++;
				}
				while (i < sourceText.length && /\d/.test(sourceText[i])) {
					i++;
				}
			}

			tokens.push({
				type: "NUMBER",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.NUMBER,
			});
			continue;
		}

		// Handle boolean literals and null
		if (/[a-z]/.test(char)) {
			const start = i;
			while (i < sourceText.length && /[a-z]/.test(sourceText[i])) {
				i++;
			}

			const word = sourceText.slice(start, i);

			if (word === "true" || word === "false") {
				tokens.push({
					type: "BOOLEAN",
					value: word,
					className: TOKEN_TYPES.BOOLEAN,
				});
			} else if (word === "null") {
				tokens.push({
					type: "NULL",
					value: word,
					className: TOKEN_TYPES.NULL,
				});
			} else {
				// Invalid identifier - treat as regular text
				tokens.push({
					type: "INVALID",
					value: word,
					className: null,
				});
			}
			continue;
		}

		// Handle structural punctuation
		if (/[{}[\]:,]/.test(char)) {
			// Track context for object key detection
			if (char === "{") {
				braceStack.push("object");
			} else if (char === "}") {
				braceStack.pop();
			} else if (char === "[") {
				braceStack.push("array");
			} else if (char === "]") {
				braceStack.pop();
			}

			tokens.push({
				type: "PUNCTUATION",
				value: char,
				className: TOKEN_TYPES.PUNCTUATION,
			});
			i++;
			continue;
		}

		// Handle whitespace
		if (/\s/.test(char)) {
			const start = i;
			while (i < sourceText.length && /\s/.test(sourceText[i])) {
				i++;
			}
			tokens.push({
				type: "WHITESPACE",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.WHITESPACE,
			});
			continue;
		}

		// Handle any other character (invalid JSON)
		tokens.push({
			type: "INVALID",
			value: char,
			className: null,
		});
		i++;
	}

	return tokens;
};

/**
 * Highlight JSON source code with Bootstrap semantic classes
 * @param {string} sourceText - Raw JSON source code
 * @returns {string} HTML with syntax highlighting
 */
export const highlightJSON = (sourceText) => {
	if (typeof sourceText !== "string") {
		throw new TypeError("JSON source must be a string");
	}

	if (!sourceText.trim()) {
		return "";
	}

	const tokens = tokenizeJSON(sourceText);

	return tokens
		.map((token) => {
			if (token.className) {
				return wrapToken(token.value, token.className);
			}
			return escapeHtml(token.value);
		})
		.join("");
};
