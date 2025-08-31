/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Markdown tagged template literal - intelligent composition for clean markdown output
 *
 * Produces semantic markdown through context-aware processing. Handles whitespace,
 * indentation, reference links, and structural elements with surgical precision.
 */

// Template cache for memoized markdown composition
const TEMPLATE_CACHE = new WeakMap();

// Context tracking for intelligent formatting
const CONTEXT = {
	PARAGRAPH: "paragraph",
	LIST: "list",
	CODE: "code",
	TABLE: "table",
	ROOT: "root",
};

/**
 * Process markdown values with context awareness
 * @param {any} value - Value to process
 * @param {string} context - Current markdown context
 * @param {number} indent - Current indentation level
 * @returns {string} Processed markdown string
 */
function processMarkdownValue(value, context = CONTEXT.ROOT, indent = 0) {
	if (value == null || value === false) return "";
	if (value === true) return "true";
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);

	if (Array.isArray(value)) {
		return processArrayValue(value, context, indent);
	}

	if (typeof value === "object") {
		return processObjectValue(value, context, indent);
	}

	return String(value);
}

/**
 * Process array values with context-aware joining
 * @param {Array<any>} array - Array to process
 * @param {string} context - Current context
 * @param {number} indent - Current indentation level
 * @returns {string} Processed markdown
 */
function processArrayValue(array, context, indent) {
	if (array.length === 0) return "";

	const processed = array
		.filter((item) => item != null && item !== false)
		.map((item) => processMarkdownValue(item, context, indent));

	// Context-aware joining
	switch (context) {
		case CONTEXT.LIST:
			// Join list items without extra spacing
			return processed.join("\n");
		case CONTEXT.PARAGRAPH:
			return processed.join(" ");
		default:
			// Only add double newlines for distinct sections
			return processed.filter((p) => p.trim()).join("\n\n");
	}
}

/**
 * Process object values - convert to markdown structures
 * @param {any} obj - Object to process
 * @param {string} _context - Current context (unused)
 * @param {number} _indent - Current indentation level (unused)
 * @returns {string} Processed markdown
 */
function processObjectValue(obj, _context, _indent) {
	// Handle special markdown objects
	if (obj.type === "reference") {
		return `[${obj.text}][${obj.ref}]`;
	}

	if (obj.type === "code") {
		const lang = obj.language || "";
		return `\`\`\`${lang}\n${obj.code}\n\`\`\``;
	}

	if (obj.type === "table") {
		return formatTable(obj);
	}

	// Default: convert to definition list
	return Object.entries(obj)
		.map(
			([key, value]) =>
				`**${key}**: ${processMarkdownValue(value, CONTEXT.PARAGRAPH)}`,
		)
		.join("\n");
}

/**
 * Format table object to markdown table
 * @param {any} tableObj - Table object with headers and rows
 * @returns {string} Markdown table
 */
function formatTable(tableObj) {
	const { headers, rows } = tableObj;
	if (!headers || !rows) return "";

	const headerRow = `| ${headers.join(" | ")} |`;
	const separator = `| ${headers.map(() => "---").join(" | ")} |`;
	const dataRows = rows
		.map((/** @type {string[]} */ row) => `| ${row.join(" | ")} |`)
		.join("\n");

	return `${headerRow}\n${separator}\n${dataRows}`;
}

/**
 * Smart whitespace normalization for markdown
 * @param {string} content - Raw markdown content
 * @returns {string} Normalized markdown
 */
function normalizeMarkdownWhitespace(content) {
	const normalized = content
		// Remove excessive blank lines (max 2)
		.replace(/\n{3,}/g, "\n\n")
		// Fix spacing around list items - no extra blank lines between consecutive items
		.replace(/^(\s*[-*+]|\d+\.)\s+(.+)(\n\n+)(?=\s*[-*+]|\d+\.)/gm, "$1 $2\n")
		// Clean up trailing whitespace on lines
		.replace(/[ \t]+$/gm, "")
		// Normalize paragraph breaks - ensure consistent double newlines
		.replace(/\n{2,}(?=[^\n\s])/g, "\n\n")
		// Remove leading/trailing blank lines
		.replace(/^\s+|\s+$/g, "");

	// Only add trailing newline for multi-line content or if content has structural elements
	if (
		normalized.includes("\n") ||
		/^#+\s|^\s*[-*+]|\d+\.\s|```|^\|/.test(normalized)
	) {
		return `${normalized}\n`;
	}

	return normalized;
}

/**
 * Detect markdown context from template string
 * @param {string} str - Template string segment
 * @returns {string} Detected context
 */
function detectContext(str) {
	// Check if we're inside or starting a list item
	if (
		/[-*+]\s*$/.test(str) ||
		/\d+\.\s*$/.test(str) ||
		/^\s*[-*+]\s/.test(str) ||
		/^\s*\d+\.\s/.test(str)
	) {
		return CONTEXT.LIST;
	}
	if (/```/.test(str)) {
		return CONTEXT.CODE;
	}
	if (/\|/.test(str)) {
		return CONTEXT.TABLE;
	}
	return CONTEXT.ROOT;
}

/**
 * Tagged template literal for clean markdown composition
 *
 * Intelligently composes markdown with proper whitespace, context awareness,
 * and structural formatting. Caches compiled templates for performance.
 *
 * @param {readonly string[]} strings - Template literal static parts
 * @param {...any} values - Template literal interpolated values
 * @returns {string} Clean, formatted markdown string
 *
 * @example
 * // Basic usage
 * const title = 'Getting Started';
 * md`# ${title}\n\nWelcome to the guide.`;
 * // → "# Getting Started\n\nWelcome to the guide."
 *
 * @example
 * // Array composition with context awareness
 * const features = ['Fast', 'Lean', 'Zero deps'];
 * md`## Features\n${features.map(f => md`- ${f}`)}`;
 * // → "## Features\n- Fast\n- Lean\n- Zero deps"
 *
 * @example
 * // Complex document assembly
 * const doc = md`# ${title}
 *
 * ${code('npm install @raven-js/beak', 'bash')}
 * `;
 * // → Clean, properly formatted markdown with code blocks
 */
export function md(strings, ...values) {
	// Check cache for compiled template
	let fn = TEMPLATE_CACHE.get(strings);
	if (!fn) {
		// Static-only optimization: no interpolations
		if (values.length === 0) {
			fn = () => normalizeMarkdownWhitespace(strings[0]);
		} else {
			// Create context-aware template function
			/** @param {...any} templateValues */
			fn = (...templateValues) => {
				let result = "";
				let currentContext = CONTEXT.ROOT;

				for (let i = 0; i < strings.length; i++) {
					const str = strings[i];
					result += str;

					if (i < templateValues.length) {
						// Detect context from current string segment
						const detectedContext = detectContext(str);
						if (detectedContext !== CONTEXT.ROOT) {
							currentContext = detectedContext;
						}

						// Process value with current context
						const processedValue = processMarkdownValue(
							templateValues[i],
							currentContext,
						);
						result += processedValue;
					}
				}

				return normalizeMarkdownWhitespace(result);
			};
		}
		TEMPLATE_CACHE.set(strings, fn);
	}

	return fn(...values);
}

/**
 * Create a reference-style link object
 * @param {string} text - Link text
 * @param {string} ref - Reference key
 * @returns {Object} Reference link object
 *
 * @example
 * // Basic usage
 * const link = ref('Documentation', 'docs');
 * md`See the ${link} for details.`;
 * // → "See the [Documentation][docs] for details."
 */
export function ref(text, ref) {
	return { type: "reference", text, ref };
}

/**
 * Create a code block object
 * @param {string} code - Code content
 * @param {string} [language] - Language identifier
 * @returns {Object} Code block object
 *
 * @example
 * // Basic usage
 * const example = code('console.log("Hello World");', 'javascript');
 * md`Here's how: ${example}`;
 * // → "Here's how: ```javascript\nconsole.log(\"Hello World\");\n```"
 *
 * @example
 * // Edge case: no language specified
 * code('SELECT * FROM users');
 * // → "```\nSELECT * FROM users\n```"
 */
export function code(code, language = "") {
	return { type: "code", code, language };
}

/**
 * Create a table object
 * @param {string[]} headers - Table headers
 * @param {string[][]} rows - Table rows
 * @returns {Object} Table object
 *
 * @example
 * // Basic usage
 * const results = table(['Feature', 'Status'], [
 *   ['Templates', '✅ Complete'],
 *   ['Parser', '✅ Complete']
 * ]);
 * md`## Status Report\n${results}`;
 * // → "## Status Report\n| Feature | Status |\n| --- | --- |\n| Templates | ✅ Complete |\n| Parser | ✅ Complete |"
 */
export function table(headers, rows) {
	return { type: "table", headers, rows };
}
