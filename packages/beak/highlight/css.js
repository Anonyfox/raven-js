/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CSS syntax highlighter using Bootstrap semantic classes
 *
 * Transforms CSS source code into semantically highlighted HTML using Bootstrap
 * color classes. Handles selectors, properties, values, comments, and at-rules
 * with zero dependencies and optimal performance.
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
 * CSS token types and their Bootstrap classes
 */
const TOKEN_TYPES = {
	COMMENT: "text-muted",
	AT_RULE: "text-primary",
	SELECTOR: "text-primary",
	PROPERTY: "text-info",
	STRING: "text-success",
	NUMBER: "text-warning",
	COLOR: "text-warning",
	IMPORTANT: "text-danger",
	FUNCTION: "text-info",
	PUNCTUATION: "text-secondary",
	WHITESPACE: /** @type {null} */ (null), // No highlighting
};

/**
 * Tokenize CSS source code into semantic tokens
 * @param {string} sourceText - Raw CSS source code
 * @returns {Array<{type: string, value: string, className: string|null}>} Array of {type, value, className} tokens
 */
const tokenizeCSS = (sourceText) => {
	const tokens = [];
	let i = 0;
	let inComment = false;
	let inString = false;
	let stringDelimiter = "";

	// Determine initial context - start in selector context unless it's clearly a declaration-only snippet
	const trimmed = sourceText.trim();
	const hasOpenBrace = trimmed.includes("{");
	const hasColon = trimmed.includes(":");
	// If there's a brace OR if there's no colon, we start in selector context
	// Only start in declaration context if there's a colon but no brace (pure declarations)
	let inSelector = hasOpenBrace || !hasColon;

	// Track nesting level for proper context in @media, @keyframes, etc.
	let braceLevel = 0;

	while (i < sourceText.length) {
		const char = sourceText[i];
		const nextChar = sourceText[i + 1] || "";

		// Handle comments
		if (!inString && char === "/" && nextChar === "*") {
			inComment = true;
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

			// Reset comment state
			inComment = false;
			continue;
		}

		// Handle strings
		if (!inComment && (char === '"' || char === "'")) {
			if (!inString) {
				inString = true;
				stringDelimiter = char;
				const start = i;
				i++;

				// Find end of string
				while (i < sourceText.length && sourceText[i] !== stringDelimiter) {
					if (sourceText[i] === "\\") i++; // Skip escaped characters
					i++;
				}
				i++; // Include closing quote

				tokens.push({
					type: "STRING",
					value: sourceText.slice(start, i),
					className: TOKEN_TYPES.STRING,
				});

				// Reset string state
				inString = false;
				stringDelimiter = "";
				continue;
			}
		}

		// Handle structural characters (but not : in selector context)
		if (!inComment && !inString && "{}();,()".includes(char)) {
			tokens.push({
				type: "PUNCTUATION",
				value: char,
				className: TOKEN_TYPES.PUNCTUATION,
			});

			// Update context based on structural characters
			if (char === "{") {
				braceLevel++;
				// If this is the first level brace after @media/@keyframes, we're still in selector context
				// Otherwise we're in declaration context
				const lastToken = tokens[tokens.length - 2]; // -1 is the current brace, -2 is before it
				const isAfterAtRule = lastToken && lastToken.type === "AT_RULE";
				inSelector = isAfterAtRule && braceLevel === 1;
			} else if (char === "}") {
				braceLevel--;
				// After closing a brace, determine context based on nesting level
				inSelector = braceLevel === 0 || braceLevel === 1;
			}

			i++;
			continue;
		}

		// Handle colon - always punctuation (pseudo-selectors handled in word parser)
		if (!inComment && !inString && char === ":") {
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

		// Handle words/identifiers
		if (!inComment && !inString && /[a-zA-Z@#.\-_0-9!]/.test(char)) {
			const start = i;

			// Special handling for !important
			if (char === "!" && sourceText.slice(i, i + 10) === "!important") {
				i += 10;
				const word = sourceText.slice(start, i);
				tokens.push({
					type: "IMPORTANT",
					value: word,
					className: TOKEN_TYPES.IMPORTANT,
				});
				continue;
			}

			// Read word characters
			while (
				i < sourceText.length &&
				/[a-zA-Z@#.\-_0-9%]/.test(sourceText[i])
			) {
				i++;
			}

			// In selector context, check for pseudo-selectors after the word
			if (
				inSelector &&
				sourceText[i] === ":" &&
				i + 1 < sourceText.length &&
				/[a-zA-Z]/.test(sourceText[i + 1])
			) {
				i++; // Include the colon
				while (i < sourceText.length && /[a-zA-Z0-9-]/.test(sourceText[i])) {
					i++;
				}
			}

			// Don't include function parentheses in the word token
			// They will be processed separately as punctuation

			const word = sourceText.slice(start, i);

			// Classify the word
			let tokenType = "IDENTIFIER";
			let className = TOKEN_TYPES.PROPERTY; // Default

			// At-rules
			if (word.startsWith("@")) {
				tokenType = "AT_RULE";
				className = TOKEN_TYPES.AT_RULE;
			}
			// Numbers with units (check first as they're specific)
			if (
				/^\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax|fr|s|ms|deg|rad|turn|Hz|kHz)?$/.test(
					word,
				)
			) {
				tokenType = "NUMBER";
				className = TOKEN_TYPES.NUMBER;
			}
			// Color values (hex, functions, named colors)
			else if (
				/^#[0-9a-fA-F]{3,8}$/.test(word) ||
				/^(rgb|rgba|hsl|hsla)\(/.test(word) ||
				/^(red|blue|green|white|black|gray|grey|yellow|orange|purple|pink|brown|transparent|inherit|initial|unset|currentColor)$/i.test(
					word,
				)
			) {
				tokenType = "COLOR";
				className = TOKEN_TYPES.COLOR;
			}
			// !important
			else if (word === "!important") {
				tokenType = "IMPORTANT";
				className = TOKEN_TYPES.IMPORTANT;
			}
			// Functions (check if next character is opening parenthesis)
			else if (sourceText[i] === "(") {
				tokenType = "FUNCTION";
				className = TOKEN_TYPES.FUNCTION;
			}
			// Selectors (class, id selectors OR element selectors in selector context)
			else if (
				word.startsWith(".") ||
				word.startsWith("#") ||
				(inSelector && /^[a-zA-Z][a-zA-Z0-9-]*$/.test(word))
			) {
				tokenType = "SELECTOR";
				className = TOKEN_TYPES.SELECTOR;
			}
			// Property names (in declaration context)
			else if (!inSelector) {
				tokenType = "PROPERTY";
				className = TOKEN_TYPES.PROPERTY;
			}
			// Default to selector in selector context, body text otherwise
			else if (inSelector) {
				tokenType = "SELECTOR";
				className = TOKEN_TYPES.SELECTOR;
			}

			tokens.push({
				type: tokenType,
				value: word,
				className,
			});
			continue;
		}

		// Handle any other character
		tokens.push({
			type: "OTHER",
			value: char,
			className: null,
		});
		i++;
	}

	return tokens;
};

/**
 * Highlight CSS source code with Bootstrap semantic classes
 * @param {string} sourceText - Raw CSS source code
 * @returns {string} HTML with syntax highlighting
 */
export const highlightCSS = (sourceText) => {
	if (typeof sourceText !== "string") {
		throw new TypeError("CSS source must be a string");
	}

	if (!sourceText.trim()) {
		return "";
	}

	const tokens = tokenizeCSS(sourceText);

	return tokens
		.map((token) => {
			if (token.className) {
				return wrapToken(token.value, token.className);
			}
			return escapeHtml(token.value);
		})
		.join("");
};
