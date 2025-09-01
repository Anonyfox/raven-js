/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Robust .env file parsing with comprehensive quirk handling.
 *
 * Handles comments, quotes, escapes, multiline values, exports, inline comments,
 * variable validation, and all common .env file edge cases.
 */

/**
 * Parse .env file content into environment variables object
 * @param {string} content - Raw .env file content
 * @returns {Record<string, string>} Parsed environment variables
 *
 * @example Basic usage
 * ```javascript
 * const result = parseEnvFile(`
 * NODE_ENV=production
 * API_KEY="secret123"
 * PORT=3000
 * `);
 * // { NODE_ENV: "production", API_KEY: "secret123", PORT: "3000" }
 * ```
 *
 * @example Advanced features
 * ```javascript
 * const result = parseEnvFile(`
 * # Database configuration
 * DB_HOST=localhost
 * DB_PASS="password with spaces"
 * DB_QUERY='SELECT * FROM "users"'
 * export NODE_ENV=development
 * MULTILINE="line1
 * line2"
 * EMPTY_VAR=
 * EQUALS_IN_VALUE=key=value=more
 * `);
 * ```
 */
export function parseEnvFile(content) {
	if (typeof content !== "string") {
		throw new Error("Environment file content must be a string");
	}

	const variables = {};
	const lines = normalizeLineEndings(content).split("\n");
	let i = 0;

	while (i < lines.length) {
		const result = parseLine(lines, i);

		if (result.variable) {
			const { key, value } = result.variable;
			if (isValidVariableName(key)) {
				variables[key] = value;
			}
		}

		i = result.nextIndex;
	}

	return variables;
}

/**
 * Normalize different line ending formats to \n
 * @param {string} content - File content with mixed line endings
 * @returns {string} Content with normalized line endings
 */
function normalizeLineEndings(content) {
	return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Parse a single line or multiline value starting at given index
 * @param {string[]} lines - Array of file lines
 * @param {number} startIndex - Starting line index
 * @returns {{ variable?: { key: string, value: string }, nextIndex: number }} Parse result
 */
function parseLine(lines, startIndex) {
	const line = lines[startIndex];
	const trimmed = line.trim();

	// Skip empty lines and comments
	if (!trimmed || trimmed.startsWith("#")) {
		return { nextIndex: startIndex + 1 };
	}

	// Handle export statements
	const cleanLine = trimmed.startsWith("export ") ? trimmed.slice(7) : trimmed;

	// Find first equals sign (key=value)
	const equalIndex = cleanLine.indexOf("=");
	if (equalIndex === -1) {
		return { nextIndex: startIndex + 1 };
	}

	const key = cleanLine.slice(0, equalIndex).trim();
	const rawValue = cleanLine.slice(equalIndex + 1);

	// Parse value, handling quotes and multiline
	const valueResult = parseValue(rawValue, lines, startIndex);

	return {
		variable: { key, value: valueResult.value },
		nextIndex: valueResult.nextIndex,
	};
}

/**
 * Parse environment variable value with quote and multiline handling
 * @param {string} rawValue - Raw value part after equals sign
 * @param {string[]} lines - All file lines for multiline support
 * @param {number} currentIndex - Current line index
 * @returns {{ value: string, nextIndex: number }} Parsed value and next line index
 */
function parseValue(rawValue, lines, currentIndex) {
	const trimmedValue = rawValue.trim();

	// Handle empty values
	if (!trimmedValue) {
		return { value: "", nextIndex: currentIndex + 1 };
	}

	// Remove inline comments (not inside quotes)
	const valueWithoutComments = removeInlineComments(trimmedValue);

	// Handle quoted values (including multiline) - check if starts with quote
	if (startsWithQuote(valueWithoutComments)) {
		return parseQuotedValue(valueWithoutComments, lines, currentIndex);
	}

	// Handle unquoted values
	return { value: valueWithoutComments, nextIndex: currentIndex + 1 };
}

/**
 * Remove inline comments while preserving comments inside quotes
 * @param {string} value - Value to process
 * @returns {string} Value with inline comments removed
 */
function removeInlineComments(value) {
	let inQuotes = false;
	let quoteChar = "";
	let escaped = false;

	for (let i = 0; i < value.length; i++) {
		const char = value[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === "\\") {
			escaped = true;
			continue;
		}

		if (!inQuotes && (char === '"' || char === "'")) {
			inQuotes = true;
			quoteChar = char;
			continue;
		}

		if (inQuotes && char === quoteChar) {
			inQuotes = false;
			quoteChar = "";
			continue;
		}

		if (!inQuotes && char === "#") {
			return value.slice(0, i).trim();
		}
	}

	return value;
}

/**
 * Check if value starts with a quote character
 * @param {string} value - Value to check
 * @returns {boolean} True if starts with quote
 */
function startsWithQuote(value) {
	if (value.length === 0) return false;
	const first = value[0];
	return first === '"' || first === "'";
}

/**
 * Parse quoted value with escape handling and multiline support
 * @param {string} quotedValue - Quoted value to parse
 * @param {string[]} lines - All file lines for multiline support
 * @param {number} currentIndex - Current line index
 * @returns {{ value: string, nextIndex: number }} Parsed value and next line index
 */
function parseQuotedValue(quotedValue, lines, currentIndex) {
	const quoteChar = quotedValue[0];
	let content = quotedValue.slice(1); // Remove opening quote
	let lineIndex = currentIndex;

	// Check if quote is properly closed on same line
	if (content.endsWith(quoteChar) && !isEscaped(content, content.length - 1)) {
		// Single line quoted value
		content = content.slice(0, -1); // Remove closing quote
		return {
			value: unescapeString(content, quoteChar),
			nextIndex: lineIndex + 1,
		};
	}

	// Multiline quoted value - start with the content from first line
	const fullContent = [content];
	lineIndex++;

	// Continue reading lines until we find the closing quote
	while (lineIndex < lines.length) {
		const line = lines[lineIndex];

		// Check if this line ends the quote
		if (line.endsWith(quoteChar) && !isEscaped(line, line.length - 1)) {
			// Add line without the closing quote
			fullContent.push(line.slice(0, -1));
			lineIndex++; // Move to next line after the closing quote
			break;
		} else {
			// Add the full line and continue
			fullContent.push(line);
			lineIndex++;
		}
	}

	const multilineContent = fullContent.join("\n");
	return {
		value: unescapeString(multilineContent, quoteChar),
		nextIndex: lineIndex,
	};
}

/**
 * Check if character at position is escaped
 * @param {string} str - String to check
 * @param {number} position - Character position
 * @returns {boolean} True if character is escaped
 */
function isEscaped(str, position) {
	let backslashCount = 0;
	let i = position - 1;

	while (i >= 0 && str[i] === "\\") {
		backslashCount++;
		i--;
	}

	return backslashCount % 2 === 1;
}

/**
 * Unescape string content based on quote type
 * @param {string} content - Escaped string content
 * @param {string} quoteChar - Quote character used (for context)
 * @returns {string} Unescaped string
 */
function unescapeString(content, quoteChar) {
	return content
		.replace(/\\n/g, "\n")
		.replace(/\\r/g, "\r")
		.replace(/\\t/g, "\t")
		.replace(/\\\\/g, "\\")
		.replace(new RegExp(`\\\\${quoteChar}`, "g"), quoteChar);
}

/**
 * Validate environment variable name
 * @param {string} name - Variable name to validate
 * @returns {boolean} True if valid variable name
 */
function isValidVariableName(name) {
	if (!name || typeof name !== "string") {
		return false;
	}

	// Must start with letter or underscore
	// Can contain letters, digits, underscores
	// Cannot start with digit
	return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
