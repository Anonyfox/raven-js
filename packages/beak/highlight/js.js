/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JavaScript syntax highlighter using Bootstrap semantic classes
 *
 * Transforms JavaScript source code into semantically highlighted HTML using Bootstrap
 * color classes. Handles keywords, strings, template literals, regex literals, comments,
 * and operators with zero dependencies and optimal performance.
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
 * JavaScript token types and their Bootstrap classes
 */
const TOKEN_TYPES = {
	COMMENT: "text-muted",
	KEYWORD: "text-primary",
	BUILTIN: "text-info",
	STRING: "text-success",
	TEMPLATE_LITERAL: "text-success",
	REGEX: "text-success",
	NUMBER: "text-warning",
	BOOLEAN: "text-warning",
	NULL_UNDEFINED: "text-warning",
	OPERATOR: "text-secondary",
	PUNCTUATION: "text-secondary",
	IDENTIFIER: "text-body",
	WHITESPACE: null, // No highlighting
};

/**
 * JavaScript keywords
 */
const KEYWORDS = new Set([
	"abstract",
	"arguments",
	"await",
	"boolean",
	"break",
	"byte",
	"case",
	"catch",
	"char",
	"class",
	"const",
	"constructor",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"double",
	"else",
	"enum",
	"eval",
	"export",
	"extends",
	"final",
	"finally",
	"float",
	"for",
	"from",
	"function",
	"goto",
	"if",
	"implements",
	"import",
	"in",
	"instanceof",
	"int",
	"interface",
	"let",
	"long",
	"native",
	"new",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"short",
	"static",
	"super",
	"switch",
	"synchronized",
	"this",
	"throw",
	"throws",
	"transient",
	"try",
	"typeof",
	"var",
	"void",
	"volatile",
	"while",
	"with",
	"yield",
	"async",
]);

/**
 * JavaScript built-in objects and functions
 */
const BUILTINS = new Set([
	"Array",
	"Boolean",
	"Date",
	"Error",
	"Function",
	"JSON",
	"Math",
	"Number",
	"Object",
	"Promise",
	"RegExp",
	"String",
	"Symbol",
	"console",
	"document",
	"window",
	"global",
	"process",
	"Buffer",
	"setTimeout",
	"setInterval",
	"clearTimeout",
	"clearInterval",
	"require",
	"module",
	"exports",
]);

/**
 * Check if a character can start an identifier
 * @param {string} char - Character to check
 * @returns {boolean} True if valid identifier start
 */
const isIdentifierStart = (char) => /[a-zA-Z_$]/.test(char);

/**
 * Check if a character can continue an identifier
 * @param {string} char - Character to check
 * @returns {boolean} True if valid identifier continuation
 */
const isIdentifierPart = (char) => /[a-zA-Z0-9_$]/.test(char);

/**
 * Check if we're in a context where `/` likely starts a regex
 * @param {Array} tokens - Previous tokens
 * @returns {boolean} True if regex context
 */
const isRegexContext = (tokens) => {
	// Look for the last non-whitespace token
	for (let i = tokens.length - 1; i >= 0; i--) {
		const token = tokens[i];
		if (token.type === "WHITESPACE") continue;

		// After these tokens, `/` is likely regex
		if (["OPERATOR", "PUNCTUATION", "KEYWORD"].includes(token.type)) {
			return true;
		}

		// After identifiers, numbers, ), ], `/` is likely division
		if (["IDENTIFIER", "NUMBER", "STRING"].includes(token.type)) {
			return false;
		}

		// Check specific punctuation
		if (token.value === ")" || token.value === "]") {
			return false;
		}

		if (
			[
				"=",
				"(",
				"[",
				"{",
				";",
				",",
				":",
				"!",
				"&",
				"|",
				"?",
				"+",
				"-",
				"*",
				"%",
			].includes(token.value)
		) {
			return true;
		}

		break;
	}

	// Default to regex at start of input
	return true;
};

/**
 * Tokenize JavaScript source code into semantic tokens
 * @param {string} sourceText - Raw JavaScript source code
 * @returns {Array} Array of {type, value, className} tokens
 */
const tokenizeJS = (sourceText) => {
	const tokens = [];
	let i = 0;

	while (i < sourceText.length) {
		const char = sourceText[i];
		const nextChar = sourceText[i + 1] || "";

		// Handle single-line comments
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

		// Handle multi-line comments
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

		// Handle regex literals
		if (char === "/" && isRegexContext(tokens)) {
			const start = i;
			i++; // Skip opening /

			// Find end of regex pattern
			while (i < sourceText.length && sourceText[i] !== "/") {
				if (sourceText[i] === "\\") {
					i++; // Skip escaped character
				}
				i++;
			}
			i++; // Skip closing /

			// Handle flags
			while (i < sourceText.length && /[gimsuxy]/.test(sourceText[i])) {
				i++;
			}

			tokens.push({
				type: "REGEX",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.REGEX,
			});
			continue;
		}

		// Handle template literals
		if (char === "`") {
			const start = i;
			i++; // Skip opening `

			// Find end of template literal, handling interpolation
			while (i < sourceText.length && sourceText[i] !== "`") {
				if (sourceText[i] === "\\" && i + 1 < sourceText.length) {
					i += 2; // Skip escaped character
					continue;
				}

				// Handle template interpolation ${...}
				if (sourceText[i] === "$" && sourceText[i + 1] === "{") {
					let braceLevel = 1;
					i += 2; // Skip ${

					while (i < sourceText.length && braceLevel > 0) {
						if (sourceText[i] === "{") braceLevel++;
						if (sourceText[i] === "}") braceLevel--;
						i++;
					}
					continue;
				}

				i++;
			}
			i++; // Skip closing `

			tokens.push({
				type: "TEMPLATE_LITERAL",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.TEMPLATE_LITERAL,
			});
			continue;
		}

		// Handle string literals
		if (char === '"' || char === "'") {
			const delimiter = char;
			const start = i;
			i++; // Skip opening quote

			// Find end of string
			while (i < sourceText.length && sourceText[i] !== delimiter) {
				if (sourceText[i] === "\\" && i + 1 < sourceText.length) {
					i += 2; // Skip escaped character
					continue;
				}
				i++;
			}
			i++; // Skip closing quote

			tokens.push({
				type: "STRING",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.STRING,
			});
			continue;
		}

		// Handle numbers
		if (/\d/.test(char) || (char === "." && /\d/.test(nextChar))) {
			const start = i;

			// Handle different number formats
			if (char === "0" && (nextChar === "x" || nextChar === "X")) {
				// Hexadecimal
				i += 2;
				while (i < sourceText.length && /[0-9a-fA-F]/.test(sourceText[i])) {
					i++;
				}
			} else if (char === "0" && (nextChar === "b" || nextChar === "B")) {
				// Binary
				i += 2;
				while (i < sourceText.length && /[01]/.test(sourceText[i])) {
					i++;
				}
			} else if (char === "0" && (nextChar === "o" || nextChar === "O")) {
				// Octal
				i += 2;
				while (i < sourceText.length && /[0-7]/.test(sourceText[i])) {
					i++;
				}
			} else {
				// Decimal
				while (i < sourceText.length && /\d/.test(sourceText[i])) {
					i++;
				}

				// Handle decimal point
				if (sourceText[i] === "." && /\d/.test(sourceText[i + 1])) {
					i++;
					while (i < sourceText.length && /\d/.test(sourceText[i])) {
						i++;
					}
				}

				// Handle scientific notation
				if (
					(sourceText[i] === "e" || sourceText[i] === "E") &&
					i + 1 < sourceText.length &&
					(/\d/.test(sourceText[i + 1]) ||
						((sourceText[i + 1] === "+" || sourceText[i + 1] === "-") &&
							i + 2 < sourceText.length &&
							/\d/.test(sourceText[i + 2])))
				) {
					i++;
					if (sourceText[i] === "+" || sourceText[i] === "-") i++;
					while (i < sourceText.length && /\d/.test(sourceText[i])) {
						i++;
					}
				}
			}

			// Handle number suffixes (BigInt)
			if (sourceText[i] === "n") {
				i++;
			}

			tokens.push({
				type: "NUMBER",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.NUMBER,
			});
			continue;
		}

		// Handle operators and punctuation
		if (/[+\-*/%=<>!&|^~?:;,.()[\]{}]/.test(char)) {
			let operatorLength = 1;
			const twoChar = sourceText.slice(i, i + 2);
			const threeChar = sourceText.slice(i, i + 3);

			// Check for multi-character operators (longest first)
			if (
				["===", "!==", ">>>", "**=", "<<=", ">>=", "..."].includes(threeChar)
			) {
				operatorLength = 3;
			} else if (
				[
					"++",
					"--",
					"==",
					"!=",
					"<=",
					">=",
					"&&",
					"||",
					"<<",
					">>",
					"=>",
					"+=",
					"-=",
					"*=",
					"/=",
					"%=",
					"&=",
					"|=",
					"^=",
					"**",
				].includes(twoChar)
			) {
				operatorLength = 2;
			}

			const operator = sourceText.slice(i, i + operatorLength);
			i += operatorLength;

			tokens.push({
				type: /[+\-*/%=<>!&|^~?]/.test(operator[0])
					? "OPERATOR"
					: "PUNCTUATION",
				value: operator,
				className: /[+\-*/%=<>!&|^~?]/.test(operator[0])
					? TOKEN_TYPES.OPERATOR
					: TOKEN_TYPES.PUNCTUATION,
			});
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

		// Handle identifiers and keywords
		if (isIdentifierStart(char)) {
			const start = i;

			while (i < sourceText.length && isIdentifierPart(sourceText[i])) {
				i++;
			}

			const word = sourceText.slice(start, i);
			let tokenType = "IDENTIFIER";
			let className = TOKEN_TYPES.IDENTIFIER;

			// Classify the identifier (check specific literals first)
			if (word === "true" || word === "false") {
				tokenType = "BOOLEAN";
				className = TOKEN_TYPES.BOOLEAN;
			} else if (word === "null" || word === "undefined") {
				tokenType = "NULL_UNDEFINED";
				className = TOKEN_TYPES.NULL_UNDEFINED;
			} else if (KEYWORDS.has(word)) {
				tokenType = "KEYWORD";
				className = TOKEN_TYPES.KEYWORD;
			} else if (BUILTINS.has(word)) {
				tokenType = "BUILTIN";
				className = TOKEN_TYPES.BUILTIN;
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
 * Highlight JavaScript source code with Bootstrap semantic classes
 * @param {string} sourceText - Raw JavaScript source code
 * @returns {string} HTML with syntax highlighting
 */
export const highlightJS = (sourceText) => {
	if (typeof sourceText !== "string") {
		throw new TypeError("JavaScript source must be a string");
	}

	if (!sourceText.trim()) {
		return "";
	}

	const tokens = tokenizeJS(sourceText);

	return tokens
		.map((token) => {
			if (token.className) {
				return wrapToken(token.value, token.className);
			}
			return escapeHtml(token.value);
		})
		.join("");
};
