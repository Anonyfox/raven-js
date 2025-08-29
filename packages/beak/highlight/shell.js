/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shell/Bash syntax highlighter using Bootstrap semantic classes
 *
 * Transforms Shell/Bash source code into semantically highlighted HTML using Bootstrap
 * color classes. Handles commands, variables, strings, pipes, redirections, and control
 * structures with zero dependencies and optimal performance.
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
 * Shell token types and their Bootstrap classes
 */
const TOKEN_TYPES = {
	COMMENT: "text-muted",
	KEYWORD: "text-primary",
	BUILTIN: "text-info",
	COMMAND: "text-body",
	VARIABLE: "text-warning",
	STRING: "text-success",
	NUMBER: "text-warning",
	OPERATOR: "text-secondary",
	PUNCTUATION: "text-secondary",
	WHITESPACE: null, // No highlighting
};

/**
 * Shell/Bash keywords and control structures
 */
const KEYWORDS = new Set([
	// Control structures
	"if",
	"then",
	"else",
	"elif",
	"fi",
	"case",
	"esac",
	"for",
	"while",
	"until",
	"do",
	"done",
	"break",
	"continue",
	"function",
	"return",
	"exit",
	// Logical operators
	"in",
	// Test operators
	"test",
	// Declarations
	"declare",
	"local",
	"readonly",
	"export",
	"unset",
	"typeset",
	// Job control
	"jobs",
	"fg",
	"bg",
	"nohup",
	"disown",
	// Conditionals
	"select",
	"time",
	"coproc",
	// Shell options
	"set",
	"unset",
	"shopt",
]);

/**
 * Shell/Bash built-in commands
 */
const BUILTINS = new Set([
	// Core built-ins
	"echo",
	"printf",
	"read",
	"cd",
	"pwd",
	"pushd",
	"popd",
	"dirs",
	"source",
	".",
	"eval",
	"exec",
	"shift",
	"getopts",
	"let",
	"expr",
	"true",
	"false",
	":",
	// I/O built-ins
	"cat",
	"head",
	"tail",
	"sort",
	"uniq",
	"wc",
	"grep",
	"sed",
	"awk",
	"cut",
	"tr",
	"tee",
	// File operations
	"ls",
	"cp",
	"mv",
	"rm",
	"mkdir",
	"rmdir",
	"touch",
	"find",
	"locate",
	"which",
	"whereis",
	"file",
	"stat",
	"du",
	"df",
	// Process management
	"ps",
	"top",
	"htop",
	"kill",
	"killall",
	"pkill",
	"pgrep",
	"pidof",
	"sleep",
	"wait",
	// Network
	"curl",
	"wget",
	"ssh",
	"scp",
	"rsync",
	"ping",
	"netstat",
	// Archive
	"tar",
	"gzip",
	"gunzip",
	"zip",
	"unzip",
	// Text processing
	"less",
	"more",
	"vim",
	"nano",
	"emacs",
	"diff",
	"comm",
	"join",
	"paste",
	// System info
	"date",
	"cal",
	"uptime",
	"whoami",
	"id",
	"groups",
	"uname",
	"hostname",
	// Environment
	"env",
	"printenv",
	"which",
	"type",
	"command",
	"history",
	"alias",
	"unalias",
	// Permissions
	"chmod",
	"chown",
	"chgrp",
	"umask",
	"su",
	"sudo",
	// Package management (common)
	"apt",
	"yum",
	"dnf",
	"brew",
	"npm",
	"pip",
	"gem",
]);

/**
 * Check if character can start an identifier
 * @param {string} char - Character to check
 * @returns {boolean} True if valid identifier start
 */
const isIdentifierStart = (char) => /[a-zA-Z_]/.test(char);

/**
 * Check if character can continue an identifier
 * @param {string} char - Character to check
 * @returns {boolean} True if valid identifier continuation
 */
const isIdentifierPart = (char) => /[a-zA-Z0-9_.-]/.test(char);

/**
 * Check if character can be part of a variable name
 * @param {string} char - Character to check
 * @returns {boolean} True if valid variable name character
 */
const isVariableChar = (char) => /[a-zA-Z0-9_]/.test(char);

/**
 * Tokenize Shell/Bash source code into semantic tokens
 * @param {string} sourceText - Raw Shell/Bash source code
 * @returns {Array} Array of {type, value, className} tokens
 */
const tokenizeShell = (sourceText) => {
	const tokens = [];
	let i = 0;
	let atCommandStart = true; // Track if we're at the start of a command

	while (i < sourceText.length) {
		const char = sourceText[i];
		const nextChar = sourceText[i + 1] || "";

		// Handle comments
		if (char === "#") {
			const start = i;

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

		// Handle single-quoted strings (literal)
		if (char === "'") {
			const start = i;
			i++; // Skip opening quote

			// Find end of string
			while (i < sourceText.length && sourceText[i] !== "'") {
				i++;
			}
			i++; // Skip closing quote

			tokens.push({
				type: "STRING",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.STRING,
			});
			atCommandStart = false;
			continue;
		}

		// Handle double-quoted strings (with variable interpolation)
		if (char === '"') {
			i++; // Skip opening quote
			tokens.push({
				type: "STRING",
				value: '"',
				className: TOKEN_TYPES.STRING,
			});

			// Parse content inside double quotes, handling variable interpolation
			while (i < sourceText.length && sourceText[i] !== '"') {
				if (sourceText[i] === "\\" && i + 1 < sourceText.length) {
					// Handle escaped characters
					const escapedChar = sourceText.slice(i, i + 2);
					tokens.push({
						type: "STRING",
						value: escapedChar,
						className: TOKEN_TYPES.STRING,
					});
					i += 2;
					continue;
				}

				if (sourceText[i] === "$") {
					// Handle variable expansion inside double quotes
					const varStart = i;
					i++; // Skip $

					if (sourceText[i] === "{") {
						// ${variable} form
						i++; // Skip {
						let braceLevel = 1;
						while (i < sourceText.length && braceLevel > 0) {
							if (sourceText[i] === "{") braceLevel++;
							if (sourceText[i] === "}") braceLevel--;
							i++;
						}
					} else if (sourceText[i] === "(") {
						// $(command) form
						i++; // Skip (
						let parenLevel = 1;
						while (i < sourceText.length && parenLevel > 0) {
							if (sourceText[i] === "(") parenLevel++;
							if (sourceText[i] === ")") parenLevel--;
							i++;
						}
					} else if (/[0-9]/.test(sourceText[i])) {
						// $1, $2, etc.
						while (i < sourceText.length && /[0-9]/.test(sourceText[i])) {
							i++;
						}
					} else if (/[?*@#$!-]/.test(sourceText[i])) {
						// Special variables
						i++;
					} else if (isVariableChar(sourceText[i])) {
						// Regular variable name
						while (i < sourceText.length && isVariableChar(sourceText[i])) {
							i++;
						}
					}

					tokens.push({
						type: "VARIABLE",
						value: sourceText.slice(varStart, i),
						className: TOKEN_TYPES.VARIABLE,
					});
					continue;
				}

				// Regular character inside double quotes
				const textStart = i;
				while (
					i < sourceText.length &&
					sourceText[i] !== '"' &&
					sourceText[i] !== "$" &&
					sourceText[i] !== "\\"
				) {
					i++;
				}
				if (i > textStart) {
					tokens.push({
						type: "STRING",
						value: sourceText.slice(textStart, i),
						className: TOKEN_TYPES.STRING,
					});
				}
			}

			// Closing quote
			if (i < sourceText.length && sourceText[i] === '"') {
				tokens.push({
					type: "STRING",
					value: '"',
					className: TOKEN_TYPES.STRING,
				});
				i++; // Skip closing quote
			}

			atCommandStart = false;
			continue;
		}

		// Handle backtick command substitution
		if (char === "`") {
			const start = i;
			i++; // Skip opening backtick

			// Find end of command substitution
			while (i < sourceText.length && sourceText[i] !== "`") {
				if (sourceText[i] === "\\" && i + 1 < sourceText.length) {
					i += 2; // Skip escaped character
					continue;
				}
				i++;
			}
			i++; // Skip closing backtick

			tokens.push({
				type: "STRING",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.STRING,
			});
			atCommandStart = false;
			continue;
		}

		// Handle variable expansion and command substitution
		if (char === "$") {
			const start = i;
			i++; // Skip $

			// Handle different variable expansion forms
			if (sourceText[i] === "{") {
				// ${variable} or ${variable:-default} etc.
				i++; // Skip {
				let braceLevel = 1;
				while (i < sourceText.length && braceLevel > 0) {
					if (sourceText[i] === "{") braceLevel++;
					if (sourceText[i] === "}") braceLevel--;
					i++;
				}
			} else if (sourceText[i] === "(") {
				// $(command) command substitution
				i++; // Skip (
				let parenLevel = 1;
				while (i < sourceText.length && parenLevel > 0) {
					if (sourceText[i] === "(") parenLevel++;
					if (sourceText[i] === ")") parenLevel--;
					i++;
				}
			} else if (/[0-9]/.test(sourceText[i])) {
				// $1, $2, etc. positional parameters
				while (i < sourceText.length && /[0-9]/.test(sourceText[i])) {
					i++;
				}
			} else if (/[?*@#$!-]/.test(sourceText[i])) {
				// Special variables: $?, $*, $@, $#, $$, $!, $-
				i++;
			} else if (isVariableChar(sourceText[i])) {
				// Regular variable name
				while (i < sourceText.length && isVariableChar(sourceText[i])) {
					i++;
				}
			}

			tokens.push({
				type: "VARIABLE",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.VARIABLE,
			});
			atCommandStart = false;
			continue;
		}

		// Handle file descriptor redirections (e.g., 2>, 3<, etc.) - check this BEFORE numbers
		if (/\d/.test(char) && /[<>]/.test(nextChar)) {
			const start = i;
			// Consume digits
			while (i < sourceText.length && /\d/.test(sourceText[i])) {
				i++;
			}
			// Consume redirection operator
			if (sourceText[i] === "<" || sourceText[i] === ">") {
				i++;
				// Handle >> or <<
				if (sourceText[i] === sourceText[i - 1]) {
					i++;
				}
				// Handle &1, &2, etc.
				if (sourceText[i] === "&" && /\d/.test(sourceText[i + 1])) {
					i += 2;
				}
			}

			tokens.push({
				type: "OPERATOR",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.OPERATOR,
			});
			continue;
		}

		// Handle numbers
		if (/\d/.test(char)) {
			const start = i;

			// Simple number parsing (no floats in shell context)
			while (i < sourceText.length && /\d/.test(sourceText[i])) {
				i++;
			}

			tokens.push({
				type: "NUMBER",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.NUMBER,
			});
			atCommandStart = false;
			continue;
		}

		// Handle operators and special characters
		if (/[|&<>=;(){}[\]*?!]/.test(char)) {
			let operatorLength = 1;
			const twoChar = sourceText.slice(i, i + 2);
			const threeChar = sourceText.slice(i, i + 3);

			// Check for redirection operators with file descriptors (>&1, >&2, <&0, etc.)
			if (twoChar === ">&" || twoChar === "<&") {
				if (/\d/.test(sourceText[i + 2])) {
					operatorLength = 3; // >&1, <&0, etc.
				} else {
					operatorLength = 2; // >&, <&
				}
			} else if (["<<<", ">>>"].includes(threeChar)) {
				operatorLength = 3;
			} else if (
				["&&", "||", ">>", "<<", "!=", "==", "<=", ">="].includes(twoChar)
			) {
				operatorLength = 2;
			}

			const operator = sourceText.slice(i, i + operatorLength);
			i += operatorLength;

			tokens.push({
				type: "OPERATOR",
				value: operator,
				className: TOKEN_TYPES.OPERATOR,
			});

			// After certain operators, we're back to command start
			if ([";", "&", "&&", "||", "|", "\n"].includes(operator)) {
				atCommandStart = true;
			}
			continue;
		}

		// Handle whitespace
		if (/\s/.test(char)) {
			const start = i;
			while (i < sourceText.length && /\s/.test(sourceText[i])) {
				i++;
			}

			const whitespace = sourceText.slice(start, i);
			tokens.push({
				type: "WHITESPACE",
				value: whitespace,
				className: TOKEN_TYPES.WHITESPACE,
			});

			// Newlines indicate command start
			if (whitespace.includes("\n")) {
				atCommandStart = true;
			}
			continue;
		}

		// Handle identifiers, commands, and keywords
		if (isIdentifierStart(char)) {
			const start = i;

			while (i < sourceText.length && isIdentifierPart(sourceText[i])) {
				i++;
			}

			const word = sourceText.slice(start, i);
			let tokenType = "COMMAND";
			let className = TOKEN_TYPES.COMMAND;

			// Classify the word
			if (KEYWORDS.has(word)) {
				tokenType = "KEYWORD";
				className = TOKEN_TYPES.KEYWORD;
			} else if (BUILTINS.has(word)) {
				tokenType = "BUILTIN";
				className = TOKEN_TYPES.BUILTIN;
			} else if (atCommandStart) {
				// First word after command separator is likely a command
				tokenType = "COMMAND";
				className = TOKEN_TYPES.COMMAND;
			} else {
				// Arguments, filenames, etc.
				tokenType = "COMMAND";
				className = TOKEN_TYPES.COMMAND;
			}

			tokens.push({
				type: tokenType,
				value: word,
				className,
			});

			atCommandStart = false;
			continue;
		}

		// Handle any other character
		tokens.push({
			type: "OTHER",
			value: char,
			className: null,
		});
		i++;
		atCommandStart = false;
	}

	return tokens;
};

/**
 * Highlight Shell/Bash source code with Bootstrap semantic classes
 * @param {string} sourceText - Raw Shell/Bash source code
 * @returns {string} HTML with syntax highlighting
 */
export const highlightShell = (sourceText) => {
	if (typeof sourceText !== "string") {
		throw new TypeError("Shell source must be a string");
	}

	if (!sourceText.trim()) {
		return "";
	}

	const tokens = tokenizeShell(sourceText);

	return tokens
		.map((token) => {
			if (token.className) {
				return wrapToken(token.value, token.className);
			}
			return escapeHtml(token.value);
		})
		.join("");
};
