/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Lean markdown to HTML converter. Single-pass AST build + transform.
 * Supports CommonMark + GitHub flavored extensions.
 * Zero dependencies, O(n) performance, deterministic output.
 */

/**
 * @typedef {Object} RefData
 * @property {string} url - Reference URL
 * @property {string} title - Reference title
 */

/**
 * @typedef {Object} ASTNode
 * @property {'heading'|'paragraph'|'code'|'blockquote'|'list'|'table'|'hr'|'html'} type - Node type
 * @property {number} [level] - Heading level (1-6)
 * @property {string} [text] - Text content
 * @property {string} [code] - Code content
 * @property {string} [lang] - Code language
 * @property {ASTNode[]|string} [content] - Child nodes for blockquotes or HTML content
 * @property {boolean} [ordered] - Whether list is ordered
 * @property {string[]} [items] - List items
 * @property {string[]} [headers] - Table headers
 * @property {string[]} [alignments] - Table column alignments
 * @property {string[][]} [rows] - Table rows
 */

/**
 * Converts GitHub Flavored Markdown to HTML with single-pass parsing.
 *
 * Zero-dependency markdown processor with CommonMark compliance and GitHub extensions.
 * Single-pass AST construction optimized for performance and deterministic output.
 *
 * @param {string} markdown - Markdown source text to convert
 * @param {Object} [options] - Conversion options
 * @param {boolean} [options.escapeHtml=false] - Whether to escape raw HTML content
 * @returns {string} Generated HTML output
 *
 * @example
 * // Basic usage - HTML preserved by default (CommonMark compliant)
 * markdownToHTML('# Hello\n\nThis is **bold** and <em>italic</em> text.');
 * // → '<h1>Hello</h1><p>This is <strong>bold</strong> and <em>italic</em> text.</p>'
 *
 * @example
 * // Escape HTML when needed for security
 * markdownToHTML('User input: <script>alert("xss")</script>', { escapeHtml: true });
 * // → '<p>User input: &lt;script&gt;alert("xss")&lt;/script&gt;</p>'
 *
 * @example
 * // Edge case: GitHub extensions
 * markdownToHTML('```js\nconsole.log("code");\n```');
 * // → '<pre><code class="language-js">console.log("code");</code></pre>'
 *
 * @example
 * // Edge case: empty input
 * markdownToHTML('');
 * // → ''
 */
export const markdownToHTML = (markdown, options = {}) => {
	if (typeof markdown !== "string" || !markdown.trim()) {
		return "";
	}

	const { escapeHtml = false } = options;
	const lines = markdown.split(/\r\n|\r|\n/);
	const { ast, references } = parseToAST(lines);
	return astToHTML(/** @type {ASTNode[]} */ (ast), references, escapeHtml);
};

/**
 * Parse lines into AST and collect references
 * @param {string[]} lines - Input lines
 * @returns {{ ast: Object[], references: Map<string, {url: string, title: string}> }}
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
 * Parse a single block element
 * @param {string[]} lines - All lines
 * @param {number} startIndex - Current line index
 * @param {Map<string, RefData>} references - Reference definitions map
 * @returns {{ node: ASTNode|null, nextIndex: number }}
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

	// Horizontal rule: --- *** ___ (but not if it contains letters)
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

	// Setext Headings: underline style
	if (startIndex + 1 < lines.length) {
		const nextLine = lines[startIndex + 1];
		// Level 1: ===...
		if (nextLine?.match(/^\s{0,3}=+\s*$/)) {
			return {
				node: { type: "heading", level: 1, text: line.trim() },
				nextIndex: startIndex + 2,
			};
		}
		// Level 2: ---... (but not horizontal rule)
		if (nextLine?.match(/^\s{0,3}-+\s*$/) && !line.trim().match(/^\s*$/)) {
			return {
				node: { type: "heading", level: 2, text: line.trim() },
				nextIndex: startIndex + 2,
			};
		}
	}

	// Fenced code block: ```lang
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

	// Indented code blocks disabled - use fenced code blocks (```) instead
	// This allows HTML components with indentation to be preserved as HTML blocks

	// Blockquote: > text
	if (/^ {0,3}>/.test(line)) {
		const quoteLines = [];
		let i = startIndex;

		while (
			i < lines.length &&
			(/^ {0,3}>/.test(lines[i]) ||
				(lines[i].trim() === "" &&
					i + 1 < lines.length &&
					/^ {0,3}>/.test(lines[i + 1])))
		) {
			quoteLines.push(lines[i].replace(/^ {0,3}>\s?/, ""));
			i++;
		}

		// Parse nested content
		const { ast: nestedAST } = parseToAST(quoteLines);
		return {
			node: {
				type: "blockquote",
				content: /** @type {ASTNode[]} */ (nestedAST),
			},
			nextIndex: i,
		};
	}

	// List: - * + 1. - handle loose lists (with blank lines)
	const listMatch = line.match(/^ {0,3}([*+-]|\d+\.)\s+(.*)$/);
	if (listMatch) {
		const [, marker, _text] = listMatch;
		const isOrdered = /^\d+\./.test(marker);
		const items = [];
		let i = startIndex;

		while (i < lines.length) {
			// Skip blank lines in loose lists
			if (!lines[i].trim()) {
				i++;
				continue;
			}

			const itemMatch = lines[i].match(/^ {0,3}([*+-]|\d+\.)\s+(.*)$/);
			if (!itemMatch) {
				// Check if this is a continuation line
				if (lines[i].match(/^ {4}/) || lines[i].trim() === "") {
					if (items.length > 0) {
						// Add to last item
						items[items.length - 1] += `\n${lines[i].replace(/^ {4}/, "")}`;
					}
					i++;
					continue;
				}
				break;
			}

			const [, newMarker, itemText] = itemMatch;
			const newIsOrdered = /^\d+\./.test(newMarker);

			// Different list type, stop
			if (isOrdered !== newIsOrdered) break;

			items.push(itemText);
			i++;
		}

		return {
			node: { type: "list", ordered: isOrdered, items },
			nextIndex: i,
		};
	}

	// Table (GitHub flavored)
	if (
		line.includes("|") &&
		startIndex + 1 < lines.length &&
		lines[startIndex + 1].match(/^\s*\|?[\s:|-]+\|?[\s:|-]*\|?/)
	) {
		const headerCells = line
			.split("|")
			.map((cell) => cell.trim())
			.filter((cell) => cell);
		const separatorLine = lines[startIndex + 1];
		const alignments = separatorLine
			.split("|")
			.map((cell) => {
				const trimmed = cell.trim();
				if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
				if (trimmed.endsWith(":")) return "right";
				return "left";
			})
			.filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove first/last empty

		const rows = [];
		let i = startIndex + 2;

		while (i < lines.length && lines[i].includes("|")) {
			const cells = lines[i]
				.split("|")
				.map((cell) => cell.trim())
				.filter((cell, idx, arr) => {
					return (
						!(idx === 0 && cell === "") &&
						!(idx === arr.length - 1 && cell === "")
					);
				});
			if (cells.length > 0) {
				rows.push(cells);
			}
			i++;
		}

		return {
			node: { type: "table", headers: headerCells, alignments, rows },
			nextIndex: i,
		};
	}

	// Raw HTML block (but not autolinks)
	if (
		line.match(/^ {0,3}<[a-zA-Z][^>]*>/) &&
		!line.match(/^ {0,3}<(https?:\/\/[^>]+>|[^@\s>]+@[^@\s>]+\.[^@\s>]+>)/)
	) {
		const htmlLines = [];
		let i = startIndex;

		// Extract the opening tag name to match with closing tag
		const openTagMatch = line.match(/^ {0,3}<([a-zA-Z][a-zA-Z0-9]*)/);
		const tagName = openTagMatch ? openTagMatch[1] : null;
		let tagDepth = 0;
		let foundOpeningTag = false;

		while (i < lines.length) {
			const currentLine = lines[i];
			htmlLines.push(currentLine);

			// Track opening and closing tags for the specific tag
			if (tagName) {
				const openMatches =
					currentLine.match(new RegExp(`<${tagName}\\b`, "gi")) || [];
				const closeMatches =
					currentLine.match(new RegExp(`</${tagName}>`, "gi")) || [];

				tagDepth += openMatches.length;
				if (tagDepth > 0) foundOpeningTag = true;
				tagDepth -= closeMatches.length;

				// Stop when we've closed all instances of the opening tag
				if (foundOpeningTag && tagDepth <= 0) {
					i++;
					break;
				}
			}

			// Stop at blank line if we haven't found proper tag structure
			if (!currentLine.trim() && !foundOpeningTag) {
				break;
			}

			i++;
		}

		return {
			node: { type: "html", content: htmlLines.join("\n") },
			nextIndex: i,
		};
	}

	// Default: paragraph
	const paraLines = [];
	let i = startIndex;

	while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
		paraLines.push(lines[i]);
		i++;
	}

	if (paraLines.length > 0) {
		return {
			node: { type: "paragraph", text: paraLines.join("\n") },
			nextIndex: i,
		};
	}

	return { node: null, nextIndex: startIndex + 1 };
};

/**
 * Check if line starts a new block element
 * @param {string} line - Line to check
 * @returns {boolean}
 */
const isBlockStart = (line) => {
	return Boolean(
		/^ {0,3}#{1,6}\s/.test(line) || // heading
			/^ {0,3}```/.test(line) || // code block
			/^ {0,3}([-*+]|\d+\.)\s/.test(line) || // list
			/^ {0,3}>/.test(line) || // blockquote
			(/^ {0,3}([-*_])\s*(\1\s*){2,}$/.test(line) && !/[a-zA-Z]/.test(line)) || // horizontal rule (no letters)
			/^ {0,3}\|/.test(line) || // table
			/^ {0,3}\[([^\]]+)\]:\s*\S+/.test(line) || // reference definition
			(line.match(/^ {0,3}<[a-zA-Z][^>]*>/) &&
				!line.match(
					/^ {0,3}<(https?:\/\/[^>]+>|[^@\s>]+@[^@\s>]+\.[^@\s>]+>)/,
				)), // HTML block
	);
};

/**
 * Transform AST to HTML
 * @param {ASTNode[]} ast - Parsed AST
 * @param {Map<string, RefData>} references - Reference definitions
 * @param {boolean} escapeHtml - Whether to escape HTML content
 * @returns {string} HTML output
 */
const astToHTML = (ast, references, escapeHtml = false) => {
	return ast.map((node) => renderNode(node, references, escapeHtml)).join("\n");
};

/**
 * Render single AST node to HTML
 * @param {ASTNode} node - AST node
 * @param {Map<string, RefData>} references - Reference definitions
 * @param {boolean} escapeHtml - Whether to escape HTML content
 * @returns {string} HTML
 */
const renderNode = (node, references, escapeHtml = false) => {
	switch (node.type) {
		case "heading": {
			const text = renderInline(node.text || "", references, escapeHtml);
			return `<h${node.level}>${text}</h${node.level}>`;
		}

		case "paragraph": {
			const text = renderInline(node.text || "", references, escapeHtml);
			// Only escape scripts when HTML escaping is disabled for security
			const safeText = escapeHtml
				? text
				: text.replace(
						/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
						(match) => escapeHTML(match),
					);
			return `<p>${safeText}</p>`;
		}

		case "code": {
			const escapedCode = escapeHTML(node.code || "");
			const langAttr = node.lang
				? ` class="language-${escapeHTML(node.lang)}"`
				: "";
			return `<pre><code${langAttr}>${escapedCode}</code></pre>`;
		}

		case "blockquote": {
			const content = Array.isArray(node.content)
				? astToHTML(node.content, references, escapeHtml)
				: node.content || "";
			return `<blockquote>\n${content}\n</blockquote>`;
		}

		case "list": {
			const tag = node.ordered ? "ol" : "ul";
			const items = (node.items || [])
				.map(
					(/** @type {string} */ item) =>
						`<li>${renderInline(item, references, escapeHtml)}</li>`,
				)
				.join("\n");
			return `<${tag}>\n${items}\n</${tag}>`;
		}

		case "table": {
			const headers = node.headers || [];
			const alignments = node.alignments || [];
			const rows = node.rows || [];

			const headerRow = headers
				.map((/** @type {string} */ header, /** @type {number} */ i) => {
					const align =
						alignments[i] !== "left"
							? ` style="text-align:${alignments[i]}"`
							: "";
					return `<th${align}>${renderInline(header, references, escapeHtml)}</th>`;
				})
				.join("");

			const bodyRows = rows
				.map((/** @type {string[]} */ row) => {
					const cells = row
						.map((/** @type {string} */ cell, /** @type {number} */ i) => {
							const align =
								alignments[i] !== "left"
									? ` style="text-align:${alignments[i]}"`
									: "";
							return `<td${align}>${renderInline(cell || "", references, escapeHtml)}</td>`;
						})
						.join("");
					return `<tr>${cells}</tr>`;
				})
				.join("\n");

			return `<table>\n<thead>\n<tr>${headerRow}</tr>\n</thead>\n<tbody>\n${bodyRows}\n</tbody>\n</table>`;
		}

		case "hr":
			return "<hr>";

		case "html":
			return typeof node.content === "string" ? node.content : "";

		default:
			return "";
	}
};

/**
 * Render inline markdown elements
 * @param {string} text - Text with inline markdown
 * @param {Map<string, RefData>} references - Reference definitions
 * @param {boolean} escapeHtml - Whether to escape HTML content
 * @returns {string} HTML with inline elements rendered
 */
const renderInline = (text, references, escapeHtml = false) => {
	if (!text) return "";

	// Process in order of precedence to avoid conflicts
	let result = text;

	// Handle backslash escaping first - protect escaped characters with unique placeholders
	/** @type {string[]} */ const escapedChars = [];
	result = result.replace(/\\(.)/g, (_match, char) => {
		const placeholder = `\uE000${escapedChars.length}\uE001`; // Use private Unicode area
		escapedChars.push(char);
		return placeholder;
	});

	// Inline code (highest precedence) - protect from other processing
	/** @type {string[]} */ const codeBlocks = [];
	result = result.replace(/`([^`]*(?:`{1,2}[^`]*)*)`/g, (_match, code) => {
		const placeholder = `__CODE_${codeBlocks.length}__`;
		codeBlocks.push(`<code>${escapeHTML(code)}</code>`);
		return placeholder;
	});

	// Images: ![alt](url "title") and ![alt][ref] - must come BEFORE links
	result = result.replace(
		/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,
		(_match, alt, url, title) => {
			const titleAttr = title ? ` title="${escapeHTML(title)}"` : "";
			return `<img src="${escapeHTML(url)}" alt="${escapeHTML(alt)}"${titleAttr}>`;
		},
	);

	result = result.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (match, alt, ref) => {
		const refKey = (ref || alt).toLowerCase();
		const refData = references.get(refKey);
		if (refData) {
			const titleAttr = refData.title
				? ` title="${escapeHTML(refData.title)}"`
				: "";
			return `<img src="${escapeHTML(refData.url)}" alt="${escapeHTML(alt)}"${titleAttr}>`;
		}
		return match;
	});

	// Links: [text](url "title") - simple robust parsing
	result = result.replace(
		/\[([^\]]+)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g,
		(_match, text, url, title) => {
			const titleAttr = title ? ` title="${escapeHTML(title)}"` : "";
			return `<a href="${escapeHTML(url)}"${titleAttr}>${renderInline(text, references, escapeHtml)}</a>`;
		},
	);

	// Reference links: [text][ref] and [text][]
	result = result.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (match, text, ref) => {
		const refKey = (ref || text).toLowerCase();
		const refData = references.get(refKey);
		if (refData) {
			const titleAttr = refData.title
				? ` title="${escapeHTML(refData.title)}"`
				: "";
			return `<a href="${escapeHTML(refData.url)}"${titleAttr}>${renderInline(text, references, escapeHtml)}</a>`;
		}
		return match;
	});

	// Autolinks: <http://example.com>
	result = result.replace(/<(https?:\/\/[^>]+)>/g, '<a href="$1">$1</a>');
	result = result.replace(
		/<([^@\s>]+@[^@\s>]+\.[^@\s>]+)>/g,
		'<a href="mailto:$1">$1</a>',
	);

	// Process emphasis with proper CommonMark precedence
	// Handle triple markers first: ***foo*** → <em><strong>foo</strong></em>
	result = result.replace(
		/\*\*\*([^*\n]+?)\*\*\*/g,
		"<em><strong>$1</strong></em>",
	);
	result = result.replace(/___([^_\n]+?)___/g, "<em><strong>$1</strong></em>");

	// Bold: **text** - must be complete pairs
	result = result.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
	result = result.replace(/__([^_\n]+?)__/g, "<strong>$1</strong>");

	// Italic: *text* and _text* - handle word boundaries per CommonMark
	// Asterisks can work mid-word, underscores cannot
	result = result.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
	result = result.replace(
		/(?<![a-zA-Z0-9])_([^_\n]+?)_(?![a-zA-Z0-9])/g,
		"<em>$1</em>",
	);

	// Strikethrough: ~~text~~
	result = result.replace(/~~([^~]+)~~/g, "<del>$1</del>");

	// Handle HTML preservation vs escaping
	/** @type {string[]} */ const htmlTags = [];
	/** @type {string[]} */ const hardBreaks = [];

	if (escapeHtml) {
		// When escaping enabled, escape all HTML characters
		result = result
			.replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	} else {
		// When escaping disabled (CommonMark default), preserve HTML tags
		result = result.replace(
			/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
			(match) => {
				const placeholder = `__HTML_${htmlTags.length}__`;
				htmlTags.push(match);
				return placeholder;
			},
		);
	}

	// Handle hard line breaks: two or more spaces before newline
	result = result.replace(/ {2,}\n/g, (_match) => {
		const placeholder = `__BREAK_${hardBreaks.length}__`;
		hardBreaks.push("<br>\n");
		return placeholder;
	});

	// Normalize single trailing spaces before newlines (CommonMark soft line break)
	result = result.replace(/ \n/g, "\n");

	// Restore hard line breaks
	hardBreaks.forEach((br, i) => {
		result = result.replace(`__BREAK_${i}__`, br);
	});

	// Restore HTML tags (only when not escaping)
	if (!escapeHtml) {
		htmlTags.forEach((tag, i) => {
			result = result.replace(`__HTML_${i}__`, tag);
		});
	}

	// Restore code blocks
	codeBlocks.forEach((code, i) => {
		result = result.replace(`__CODE_${i}__`, code);
	});

	// Restore escaped characters last, after all other processing
	escapedChars.forEach((char, i) => {
		result = result.replace(`\uE000${i}\uE001`, escapeHTML(char));
	});

	return result;
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeHTML = (text) => {
	if (!text) return "";
	return (
		text
			// Don't escape already-valid HTML entities
			.replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
	);
};
