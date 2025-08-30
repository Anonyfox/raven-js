/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Surgical markdown to plaintext converter
 *
 * Single-pass text extraction with zero formatting artifacts. Reuses AST parsing
 * architecture from HTML converter while maintaining surgical content focus.
 * Strips all visual formatting, preserves semantic flow and list structure.
 * Produces arbitrary-width reflowable text optimized for search and accessibility.
 */

/**
 * Parse a single block element (extracted from markdown-to-html.js)
 * @param {string[]} lines - Array of markdown lines
 * @param {number} startIndex - Starting line index
 * @param {Map<string, {url: string, title: string}>} references - Reference definitions
 * @returns {{node: ASTNode|null, nextIndex: number}} Parse result
 */
const parseBlockElement = (lines, startIndex, references) => {
	// Skip empty lines
	while (startIndex < lines.length && !lines[startIndex].trim()) {
		startIndex++;
	}

	if (startIndex >= lines.length) {
		return { node: null, nextIndex: startIndex };
	}

	const line = lines[startIndex];

	// Reference definition: [label]: url "title"
	const refMatch = line.match(/^ {0,3}\[([^\]]+)\]:\s*(\S+)(?:\s+"([^"]*)")?$/);
	if (refMatch) {
		const [, label, url, title] = refMatch;
		references.set(label.toLowerCase(), { url, title: title || "" });
		return { node: null, nextIndex: startIndex + 1 };
	}

	// Horizontal rule
	if (/^ {0,3}([-*_])\s*(\1\s*){2,}$/.test(line) && !/[a-zA-Z]/.test(line)) {
		return { node: { type: "hr" }, nextIndex: startIndex + 1 };
	}

	// ATX Heading: # Title
	const headingMatch = line.match(/^ {0,3}(#{1,6})\s+(.+)$/);
	if (headingMatch) {
		const [, hashes, text] = headingMatch;
		return {
			node: { type: "heading", level: hashes.length, text: text.trim() },
			nextIndex: startIndex + 1,
		};
	}

	// Setext Headings
	if (startIndex + 1 < lines.length) {
		const nextLine = lines[startIndex + 1];
		if (nextLine?.match(/^\s{0,3}=+\s*$/)) {
			return {
				node: { type: "heading", level: 1, text: line.trim() },
				nextIndex: startIndex + 2,
			};
		}
		if (nextLine?.match(/^\s{0,3}-+\s*$/) && !line.trim().match(/^\s*$/)) {
			return {
				node: { type: "heading", level: 2, text: line.trim() },
				nextIndex: startIndex + 2,
			};
		}
	}

	// Fenced code block
	const fenceMatch = line.match(/^ {0,3}```\s*(.*)$/);
	if (fenceMatch) {
		const [, lang] = fenceMatch;
		const codeLines = [];
		let i = startIndex + 1;

		while (i < lines.length && !lines[i].match(/^ {0,3}```\s*$/)) {
			codeLines.push(lines[i]);
			i++;
		}

		return {
			node: { type: "code", lang: lang.trim(), code: codeLines.join("\n") },
			nextIndex: i + 1,
		};
	}

	// Lists
	const listMatch = line.match(/^ {0,3}([*+-]|\d+\.)\s+(.*)$/);
	if (listMatch) {
		const [, marker, content] = listMatch;
		const ordered = /\d+\./.test(marker);
		const items = [content];
		let i = startIndex + 1;

		// Collect consecutive list items
		while (i < lines.length) {
			const nextLine = lines[i];
			if (!nextLine.trim()) {
				i++;
				continue;
			}

			const nextListMatch = nextLine.match(/^ {0,3}([*+-]|\d+\.)\s+(.*)$/);
			if (nextListMatch) {
				items.push(nextListMatch[2]);
				i++;
			} else {
				break;
			}
		}

		return {
			node: { type: "list", ordered, items },
			nextIndex: i,
		};
	}

	// Blockquote - flatten all levels to single text
	if (line.match(/^ {0,3}>/)) {
		const quoteLines = [];
		let i = startIndex;

		while (
			i < lines.length &&
			(lines[i].match(/^ {0,3}>/) || !lines[i].trim())
		) {
			if (lines[i].trim()) {
				// Remove all > markers regardless of nesting level
				const cleaned = lines[i].replace(/^ {0,3}>+\s?/, "");
				if (cleaned) {
					quoteLines.push(cleaned);
				}
			}
			i++;
		}

		// Join all quote lines into single text content
		return {
			node: { type: "blockquote", text: quoteLines.join(" ") },
			nextIndex: i,
		};
	}

	// Table detection (simplified)
	if (line.includes("|")) {
		const tableLines = [line];
		let i = startIndex + 1;

		while (i < lines.length && lines[i].includes("|")) {
			tableLines.push(lines[i]);
			i++;
		}

		if (tableLines.length >= 2) {
			// Parse table structure
			const headers = tableLines[0]
				.split("|")
				.map(/** @param {string} h */ (h) => h.trim())
				.filter(Boolean);
			const separatorLine = tableLines[1];

			if (separatorLine.match(/^\s*\|?[\s:-]*\|[\s:-]*\|?[\s:-]*$/)) {
				const rows = tableLines.slice(2).map((row) =>
					row
						.split("|")
						.map(/** @param {string} cell */ (cell) => cell.trim())
						.filter(Boolean),
				);

				return {
					node: { type: "table", headers, rows },
					nextIndex: i,
				};
			}
		}
	}

	// Default: paragraph
	const paragraphLines = [line];
	let i = startIndex + 1;

	while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
		paragraphLines.push(lines[i]);
		i++;
	}

	return {
		node: { type: "paragraph", text: paragraphLines.join(" ") },
		nextIndex: i,
	};
};

/**
 * Check if line starts a new block element
 * @param {string} line - Line to check
 * @returns {boolean} Whether line starts a block element
 */
const isBlockStart = (line) => {
	return (
		/^ {0,3}#{1,6}\s/.test(line) || // heading
		/^ {0,3}([*+-]|\d+\.)\s/.test(line) || // list
		/^ {0,3}>/.test(line) || // blockquote
		/^ {0,3}```/.test(line) || // code
		/^ {0,3}([-*_])\s*(\1\s*){2,}$/.test(line) || // hr
		line.includes("|") || // table
		/^ {0,3}\[([^\]]+)\]:\s*\S+/.test(line) // reference
	);
};

/**
 * Main parsing function (reusing logic structure)
 * @param {string[]} lines - Array of markdown lines
 * @returns {{ast: ASTNode[], references: Map<string, {url: string, title: string}>}} Parsed AST and references
 */
const parseToAST = (lines) => {
	const ast = [];
	const references = new Map();
	let i = 0;

	while (i < lines.length) {
		const result = parseBlockElement(lines, i, references);
		if (result.node) {
			ast.push(result.node);
		}
		i = result.nextIndex;
	}

	return { ast, references };
};

/**
 * Convert markdown text to plain text
 * @param {string} markdown - Markdown source text
 * @returns {string} Plain text output
 */
export const markdownToText = (markdown) => {
	if (typeof markdown !== "string" || !markdown.trim()) {
		return "";
	}

	const lines = markdown.split(/\r\n|\r|\n/);
	const { ast, references } = parseToAST(lines);
	return astToText(ast, references);
};

/**
 * Transform AST to plain text
 * @param {ASTNode[]} ast - Parsed AST
 * @param {Map<string, {url: string, title: string}>} references - Reference definitions
 * @returns {string} Plain text output
 */
const astToText = (ast, references) => {
	return ast.map((node) => renderNodeAsText(node, references)).join("\n\n");
};

/**
 * @typedef {Object} ASTNode
 * @property {string} type - Node type
 * @property {string} [text] - Text content
 * @property {string} [code] - Code content
 * @property {number} [level] - Heading level
 * @property {string} [lang] - Code language
 * @property {boolean} [ordered] - Whether list is ordered
 * @property {string[]} [items] - List items
 * @property {string[]} [headers] - Table headers
 * @property {string[][]} [rows] - Table rows
 * @property {ASTNode[]} [content] - Nested content
 */

/**
 * Render single AST node to plain text
 * @param {ASTNode} node - AST node
 * @param {Map<string, {url: string, title: string}>} references - Reference definitions
 * @returns {string} Plain text
 */
const renderNodeAsText = (node, references) => {
	switch (node.type) {
		case "heading":
			return renderInlineAsText(node.text || "", references);

		case "paragraph":
			return renderInlineAsText(node.text || "", references);

		case "code":
			return node.code || "";

		case "blockquote": {
			// Handle both old nested AST format and new flattened text format
			if (node.text) {
				return renderInlineAsText(node.text, references);
			}
			const content = Array.isArray(node.content)
				? astToText(node.content, references)
				: node.content || "";
			return content;
		}

		case "list": {
			return (node.items || [])
				.map(
					/** @param {string} item */ (item) =>
						`- ${renderInlineAsText(item, references)}`,
				)
				.join("\n");
		}

		case "table": {
			const headers = node.headers || [];
			const rows = node.rows || [];

			// Convert table to key-value pairs
			const tableResult = [];

			for (const row of rows) {
				const pairs = [];
				for (let i = 0; i < headers.length && i < row.length; i++) {
					const header = renderInlineAsText(headers[i] || "", references);
					const cell = renderInlineAsText(row[i] || "", references);
					if (header && cell) {
						pairs.push(`${header}: ${cell}`);
					}
				}
				if (pairs.length > 0) {
					tableResult.push(pairs.join(", "));
				}
			}

			return tableResult.join("\n");
		}

		case "hr":
			return "---";

		case "html": {
			// Strip HTML tags, keep content
			const htmlContent = typeof node.content === "string" ? node.content : "";
			return htmlContent.replace(/<[^>]*>/g, "");
		}

		default:
			return "";
	}
};

/**
 * Render inline markdown elements as plain text
 * @param {string} text - Text with inline markdown
 * @param {Map<string, {url: string, title: string}>} _references - Reference definitions
 * @returns {string} Plain text with formatting stripped
 */
const renderInlineAsText = (text, _references) => {
	if (!text) return "";

	let result = text;

	// Handle backslash escaping - restore escaped characters
	/** @type {string[]} */
	const escapedChars = [];
	result = result.replace(/\\(.)/g, (_match, char) => {
		const placeholder = `\uE000${escapedChars.length}\uE001`;
		escapedChars.push(char);
		return placeholder;
	});

	// Extract inline code content (strip backticks)
	// Handle complex patterns first, then simple
	result = result.replace(/``([^`]*(?:`[^`]*)*?)``/g, "$1"); // ``code with `backticks` inside``
	result = result.replace(/`([^`]+)`/g, "$1"); // `single backticks`

	// Images: extract alt text
	result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
	result = result.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, "$1");

	// Links: extract link text
	result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

	// Reference links: extract text
	result = result.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, "$1");

	// Autolinks: keep URL as text
	result = result.replace(/<(https?:\/\/[^>]+)>/g, "$1");
	result = result.replace(/<([^@\s>]+@[^@\s>]+\.[^@\s>]+)>/g, "$1");

	// Strip emphasis markers (simple approach - process multiple times if needed)
	// Handle triple first, then double, then single
	result = result.replace(/\*\*\*([^*]*?)\*\*\*/g, "$1"); // ***bold italic***
	result = result.replace(/___([^_]*?)___/g, "$1"); // ___bold italic___
	result = result.replace(/\*\*([^*]*?)\*\*/g, "$1"); // **bold**
	result = result.replace(/__([^_]*?)__/g, "$1"); // __bold__
	result = result.replace(/\*([^*\n]+?)\*/g, "$1"); // *italic*
	result = result.replace(/_([^_\n]+?)_/g, "$1"); // _italic_
	result = result.replace(/~~([^~]+?)~~/g, "$1"); // ~~strikethrough~~

	// Strip HTML tags
	result = result.replace(/<[^>]*>/g, "");

	// Handle line breaks - convert to single spaces
	result = result.replace(/ {2,}\n/g, " "); // Hard breaks become single space
	result = result.replace(/ \n/g, " "); // Soft breaks become single space
	// Don't collapse multiple spaces - they might be intentional after HTML tag removal

	// Restore escaped characters
	escapedChars.forEach((char, i) => {
		result = result.replace(`\uE000${i}\uE001`, char);
	});

	return result.trim();
};
