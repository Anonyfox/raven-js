/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file XML syntax highlighter using Bootstrap semantic classes
 *
 * Transforms XML source code into semantically highlighted HTML using Bootstrap
 * color classes. Handles tags, attributes, CDATA sections, processing instructions,
 * comments, and text content with zero dependencies and optimal performance.
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
 * XML token types and their Bootstrap classes
 */
const TOKEN_TYPES = {
	COMMENT: "text-muted",
	PROCESSING_INSTRUCTION: "text-warning",
	CDATA: "text-warning",
	DOCTYPE: "text-muted",
	TAG_NAME: "text-primary",
	ATTRIBUTE_NAME: "text-info",
	ATTRIBUTE_VALUE: "text-success",
	ENTITY: "text-warning",
	TAG_PUNCTUATION: "text-secondary",
	TEXT_CONTENT: /** @type {null} */ (null), // No highlighting for regular text
	WHITESPACE: /** @type {null} */ (null), // No highlighting
};

/**
 * Check if character can start an XML name (tag or attribute)
 * @param {string} char - Character to check
 * @returns {boolean} True if valid name start character
 */
const isNameStart = (char) => /[a-zA-Z_:]/.test(char);

/**
 * Check if character can continue an XML name
 * @param {string} char - Character to check
 * @returns {boolean} True if valid name continuation character
 */
const isNameChar = (char) => /[a-zA-Z0-9_:.-]/.test(char);

/**
 * Tokenize XML source code into semantic tokens
 * @param {string} sourceText - Raw XML source code
 * @returns {Array<{type: string, value: string, className: string|null}>} Array of {type, value, className} tokens
 */
const tokenizeXML = (sourceText) => {
	const tokens = [];
	let i = 0;

	while (i < sourceText.length) {
		const char = sourceText[i];
		const nextChar = sourceText[i + 1] || "";

		// Handle XML comments
		if (char === "<" && sourceText.slice(i, i + 4) === "<!--") {
			const start = i;
			i += 4; // Skip <!--

			// Find end of comment
			while (i < sourceText.length - 2) {
				if (sourceText.slice(i, i + 3) === "-->") {
					i += 3; // Include -->
					break;
				}
				i++;
			}

			tokens.push({
				type: "COMMENT",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.COMMENT,
			});
			continue;
		}

		// Handle processing instructions
		if (char === "<" && nextChar === "?") {
			const start = i;
			i += 2; // Skip <?

			// Find end of processing instruction
			while (i < sourceText.length - 1) {
				if (sourceText[i] === "?" && sourceText[i + 1] === ">") {
					i += 2; // Include ?>
					break;
				}
				i++;
			}

			tokens.push({
				type: "PROCESSING_INSTRUCTION",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.PROCESSING_INSTRUCTION,
			});
			continue;
		}

		// Handle CDATA sections
		if (char === "<" && sourceText.slice(i, i + 9) === "<![CDATA[") {
			const start = i;
			i += 9; // Skip <![CDATA[

			// Find end of CDATA
			while (i < sourceText.length - 2) {
				if (sourceText.slice(i, i + 3) === "]]>") {
					i += 3; // Include ]]>
					break;
				}
				i++;
			}

			tokens.push({
				type: "CDATA",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.CDATA,
			});
			continue;
		}

		// Handle DOCTYPE declarations
		if (
			char === "<" &&
			sourceText.slice(i, i + 9).toLowerCase() === "<!doctype"
		) {
			const start = i;
			i += 2; // Skip <!

			// Find end of DOCTYPE
			while (i < sourceText.length && sourceText[i] !== ">") {
				i++;
			}
			i++; // Include >

			tokens.push({
				type: "DOCTYPE",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.DOCTYPE,
			});
			continue;
		}

		// Handle XML entities
		if (char === "&") {
			const start = i;
			i++; // Skip &

			// Handle numeric entities (&#123; or &#x1F;)
			if (sourceText[i] === "#") {
				i++; // Skip #
				if (sourceText[i] === "x" || sourceText[i] === "X") {
					i++; // Skip x
					// Hex digits
					while (i < sourceText.length && /[0-9a-fA-F]/.test(sourceText[i])) {
						i++;
					}
				} else {
					// Decimal digits
					while (i < sourceText.length && /\d/.test(sourceText[i])) {
						i++;
					}
				}
			} else {
				// Named entities
				while (i < sourceText.length && /[a-zA-Z0-9]/.test(sourceText[i])) {
					i++;
				}
			}

			// Include semicolon if present
			if (sourceText[i] === ";") {
				i++;
			}

			tokens.push({
				type: "ENTITY",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.ENTITY,
			});
			continue;
		}

		// Handle XML tags
		if (char === "<" && (isNameStart(nextChar) || nextChar === "/")) {
			// Opening bracket
			tokens.push({
				type: "TAG_PUNCTUATION",
				value: "<",
				className: TOKEN_TYPES.TAG_PUNCTUATION,
			});
			i++; // Skip <

			// Handle closing tag slash
			if (sourceText[i] === "/") {
				tokens.push({
					type: "TAG_PUNCTUATION",
					value: "/",
					className: TOKEN_TYPES.TAG_PUNCTUATION,
				});
				i++; // Skip /
			}

			// Parse tag name
			if (isNameStart(sourceText[i])) {
				const tagStart = i;
				while (i < sourceText.length && isNameChar(sourceText[i])) {
					i++;
				}

				tokens.push({
					type: "TAG_NAME",
					value: sourceText.slice(tagStart, i),
					className: TOKEN_TYPES.TAG_NAME,
				});
			}

			// Parse attributes
			while (i < sourceText.length && sourceText[i] !== ">") {
				// Skip whitespace
				if (/\s/.test(sourceText[i])) {
					const wsStart = i;
					while (i < sourceText.length && /\s/.test(sourceText[i])) {
						i++;
					}
					tokens.push({
						type: "WHITESPACE",
						value: sourceText.slice(wsStart, i),
						className: TOKEN_TYPES.WHITESPACE,
					});
					continue;
				}

				// Handle self-closing tag slash
				if (sourceText[i] === "/") {
					tokens.push({
						type: "TAG_PUNCTUATION",
						value: "/",
						className: TOKEN_TYPES.TAG_PUNCTUATION,
					});
					i++;
					continue;
				}

				// Parse attribute name
				if (isNameStart(sourceText[i])) {
					const attrStart = i;
					while (i < sourceText.length && isNameChar(sourceText[i])) {
						i++;
					}

					tokens.push({
						type: "ATTRIBUTE_NAME",
						value: sourceText.slice(attrStart, i),
						className: TOKEN_TYPES.ATTRIBUTE_NAME,
					});

					// Skip whitespace around =
					while (i < sourceText.length && /\s/.test(sourceText[i])) {
						tokens.push({
							type: "WHITESPACE",
							value: sourceText[i],
							className: TOKEN_TYPES.WHITESPACE,
						});
						i++;
					}

					// Handle equals sign
					if (sourceText[i] === "=") {
						tokens.push({
							type: "TAG_PUNCTUATION",
							value: "=",
							className: TOKEN_TYPES.TAG_PUNCTUATION,
						});
						i++;

						// Skip whitespace after =
						while (i < sourceText.length && /\s/.test(sourceText[i])) {
							tokens.push({
								type: "WHITESPACE",
								value: sourceText[i],
								className: TOKEN_TYPES.WHITESPACE,
							});
							i++;
						}

						// Parse attribute value
						if (sourceText[i] === '"' || sourceText[i] === "'") {
							const quote = sourceText[i];
							const valueStart = i;
							i++; // Skip opening quote

							// Find closing quote
							while (i < sourceText.length && sourceText[i] !== quote) {
								i++;
							}
							i++; // Include closing quote

							tokens.push({
								type: "ATTRIBUTE_VALUE",
								value: sourceText.slice(valueStart, i),
								className: TOKEN_TYPES.ATTRIBUTE_VALUE,
							});
						} else {
							// Unquoted attribute value (technically not valid XML but handle gracefully)
							const valueStart = i;
							while (i < sourceText.length && !/[\s>]/.test(sourceText[i])) {
								i++;
							}

							if (i > valueStart) {
								tokens.push({
									type: "ATTRIBUTE_VALUE",
									value: sourceText.slice(valueStart, i),
									className: TOKEN_TYPES.ATTRIBUTE_VALUE,
								});
							}
						}
					}
				} else {
					// Skip invalid characters
					i++;
				}
			}

			// Closing bracket
			if (sourceText[i] === ">") {
				tokens.push({
					type: "TAG_PUNCTUATION",
					value: ">",
					className: TOKEN_TYPES.TAG_PUNCTUATION,
				});
				i++;
			}

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

		// Handle text content
		const start = i;
		while (
			i < sourceText.length &&
			sourceText[i] !== "<" &&
			sourceText[i] !== "&" &&
			!/\s/.test(sourceText[i])
		) {
			i++;
		}

		if (i > start) {
			tokens.push({
				type: "TEXT_CONTENT",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.TEXT_CONTENT,
			});
		} else {
			// Single character that doesn't fit other categories
			tokens.push({
				type: "TEXT_CONTENT",
				value: char,
				className: TOKEN_TYPES.TEXT_CONTENT,
			});
			i++;
		}
	}

	return tokens;
};

/**
 * Highlight XML source code with Bootstrap semantic classes
 * @param {string} sourceText - Raw XML source code
 * @returns {string} HTML with syntax highlighting
 */
export const highlightXML = (sourceText) => {
	if (typeof sourceText !== "string") {
		throw new TypeError("XML source must be a string");
	}

	if (!sourceText.trim()) {
		return "";
	}

	const tokens = tokenizeXML(sourceText);

	return tokens
		.map((token) => {
			if (token.className) {
				return wrapToken(token.value, token.className);
			}
			return escapeHtml(token.value);
		})
		.join("");
};
