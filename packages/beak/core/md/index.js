// AST node types
const NODE_TYPES = {
	PARAGRAPH: "paragraph",
	HEADING: "heading",
	LIST: "list",
	LIST_ITEM: "listItem",
	BLOCKQUOTE: "blockquote",
	CODE_BLOCK: "codeBlock",
	HORIZONTAL_RULE: "horizontalRule",
	LINK: "link",
	IMAGE: "image",
	BOLD: "bold",
	ITALIC: "italic",
	CODE: "code",
	TEXT: "text",
};

/**
 * @private
 * @typedef {Object} Node
 * @property {string} type - The type of the node, e.g., 'paragraph', 'heading', 'list', etc.
 * @property {string|Node[]} [content] - The content of the node, used for inline elements like text, bold, italic, etc.
 * @property {Array<Node>} [items] - The list items, used for list nodes.
 * @property {number} [level] - The level of the heading, used for heading nodes.
 * @property {string} [url] - The URL, used for link and image nodes.
 * @property {string} [alt] - The alt text, used for image nodes.
 * @property {string} [language] - The programming language, used for code block nodes.
 * @property {boolean} [ordered] - if its a list, whether it is ordered or not.
 */

/**
 * Parsing functions
 * @param {string} text - The input markdown text to parse.
 * @returns {Array<Node>} - The abstract syntax tree (AST) representing the parsed markdown.
 */
const parseInline = (text) => {
	/** @type {Node[]} */
	const ast = [];
	let current = 0;

	while (current < text.length) {
		if (text.startsWith("**", current)) {
			const end = text.indexOf("**", current + 2);
			if (end !== -1) {
				ast.push({
					type: NODE_TYPES.BOLD,
					content: parseInline(text.slice(current + 2, end)),
				});
				current = end + 2;
				continue;
			}
		}
		if (text.startsWith("*", current)) {
			const end = text.indexOf("*", current + 1);
			if (end !== -1) {
				ast.push({
					type: NODE_TYPES.ITALIC,
					content: parseInline(text.slice(current + 1, end)),
				});
				current = end + 1;
				continue;
			}
		}
		if (text.startsWith("`", current)) {
			const end = text.indexOf("`", current + 1);
			if (end !== -1) {
				ast.push({
					type: NODE_TYPES.CODE,
					content: text.slice(current + 1, end),
				});
				current = end + 1;
				continue;
			}
		}
		if (text.startsWith("[", current)) {
			const endLink = text.indexOf("]", current);
			const endUrl = text.indexOf(")", endLink);
			if (endLink !== -1 && endUrl !== -1 && text[endLink + 1] === "(") {
				ast.push({
					type: NODE_TYPES.LINK,
					content: parseInline(text.slice(current + 1, endLink)),
					url: text.slice(endLink + 2, endUrl),
				});
				current = endUrl + 1;
				continue;
			}
		}
		if (text.startsWith("![", current)) {
			const endAlt = text.indexOf("]", current);
			const endUrl = text.indexOf(")", endAlt);
			if (endAlt !== -1 && endUrl !== -1 && text[endAlt + 1] === "(") {
				ast.push({
					type: NODE_TYPES.IMAGE,
					alt: text.slice(current + 2, endAlt),
					url: text.slice(endAlt + 2, endUrl),
				});
				current = endUrl + 1;
				continue;
			}
		}

		// If no special syntax is found, treat as plain text
		const nextSpecial = text.slice(current).search(/[\*\[!\`]/);
		const end = nextSpecial === -1 ? text.length : current + nextSpecial;
		ast.push({ type: NODE_TYPES.TEXT, content: text.slice(current, end) });
		current = end;
	}

	return ast;
};

/**
 * Parsing functions
 * @param {string[]} lines - The input markdown text to parse.
 * @returns {Array<any>} - The abstract syntax tree (AST) representing the parsed markdown.
 */
const parseBlock = (lines) => {
	const ast = [];
	let current = 0;

	while (current < lines.length) {
		const line = lines[current].trim();

		if (line.startsWith("#")) {
			const level = line.match(/^#+/)[0].length;
			ast.push({
				type: NODE_TYPES.HEADING,
				level,
				content: parseInline(line.slice(level).trim()),
			});
		} else if (
			line.startsWith("- ") ||
			line.startsWith("* ") ||
			/^\d+\. /.test(line)
		) {
			const listItems = [];
			const isOrdered = /^\d+\. /.test(line);
			while (
				current < lines.length &&
				(lines[current].trim().startsWith("- ") ||
					lines[current].trim().startsWith("* ") ||
					/^\d+\. /.test(lines[current].trim()))
			) {
				listItems.push({
					type: NODE_TYPES.LIST_ITEM,
					content: parseInline(
						lines[current].trim().replace(/^(-|\*|\d+\.) /, ""),
					),
				});
				current++;
			}
			ast.push({ type: NODE_TYPES.LIST, ordered: isOrdered, items: listItems });
			continue;
		} else if (line.startsWith("> ")) {
			const quoteContent = [];
			while (current < lines.length && lines[current].trim().startsWith("> ")) {
				quoteContent.push(lines[current].trim().slice(2));
				current++;
			}
			ast.push({
				type: NODE_TYPES.BLOCKQUOTE,
				content: parseBlock(quoteContent),
			});
			continue;
		} else if (line.startsWith("```")) {
			const codeContent = [];
			const language = line.slice(3).trim();
			current++;
			while (
				current < lines.length &&
				!lines[current].trim().startsWith("```")
			) {
				codeContent.push(lines[current]);
				current++;
			}
			// Trim the entire code block content
			const trimmedContent = codeContent
				.join("\n")
				.split("\n")
				.map((line) => line.trimStart()) // Trim start of each line
				.join("\n")
				.trim(); // Trim start and end of the entire block
			ast.push({
				type: NODE_TYPES.CODE_BLOCK,
				language,
				content: trimmedContent,
			});
			current++;
			continue;
		} else if (line === "---") {
			ast.push({ type: NODE_TYPES.HORIZONTAL_RULE });
		} else if (line !== "") {
			ast.push({
				type: NODE_TYPES.PARAGRAPH,
				content: parseInline(line),
			});
		}

		current++;
	}

	return ast;
};

/**
 * Transforms a given AST node into its corresponding HTML representation.
 * @param {Node} node - The AST node to transform.
 * @returns {string} - The HTML representation of the node.
 */
const transformNode = (node) => {
	const content = /** @type {Node[]} */ (node.content);
	switch (node.type) {
		case NODE_TYPES.PARAGRAPH:
			return `<p>${transformInline(content)}</p>`;
		case NODE_TYPES.HEADING:
			return `<h${node.level}>${transformInline(content)}</h${node.level}>`;
		case NODE_TYPES.LIST: {
			const listItems = node.items
				.map(
					(item) =>
						`<li>${transformInline(/** @type {Node[]} */ (/** @type {unknown} */ (item.content)))}</li>`,
				)
				.join("");
			return node.ordered ? `<ol>${listItems}</ol>` : `<ul>${listItems}</ul>`;
		}
		case NODE_TYPES.BLOCKQUOTE:
			return `<blockquote>${transformBlock(content)}</blockquote>`;
		case NODE_TYPES.CODE_BLOCK:
			return `<pre><code${node.language ? ` class="language-${node.language}"` : ""}>${content}</code></pre>`;
		case NODE_TYPES.HORIZONTAL_RULE:
			return "<hr>";
		case NODE_TYPES.LINK:
			return `<a href="${node.url}">${transformInline(content)}</a>`;
		case NODE_TYPES.IMAGE:
			return `<img src="${node.url}" alt="${node.alt}">`;
		case NODE_TYPES.BOLD:
			return `<strong>${transformInline(content)}</strong>`;
		case NODE_TYPES.ITALIC:
			return `<em>${transformInline(content)}</em>`;
		case NODE_TYPES.CODE:
			return `<code>${content}</code>`;
		case NODE_TYPES.TEXT:
			return /** @type {string} */ (/** @type {unknown} */ (content));
		default:
			return "";
	}
};

/**
 * Transforms an array of AST nodes into their corresponding HTML representation.
 * @param {string|Node[]} nodes - The array of AST nodes to transform.
 * @returns {string} - The HTML representation of the nodes.
 */
const transformInline = (nodes) => {
	if (!Array.isArray(nodes)) {
		return nodes; // Handle case where nodes is a string (e.g., for CODE nodes)
	}
	return nodes.map(transformNode).join("");
};

/**
 * Transforms an array of AST nodes into their corresponding block-level HTML representation.
 * @param {Node[]} nodes - The array of AST nodes to transform.
 * @returns {string} - The block-level HTML representation of the nodes.
 */
const transformBlock = (nodes) => nodes.map(transformNode).join("\n");

/**
 * Parses the given markdown string into HTML.
 *
 * This function takes a markdown string, parses it into an abstract syntax tree (AST),
 * and then transforms the AST into its corresponding HTML representation.
 *
 * @param {string} markdown - The markdown string to parse.
 * @returns {string} - The HTML representation of the parsed markdown.
 */
const parseMarkdown = (markdown) => {
	const lines = markdown.split("\n");
	const ast = parseBlock(lines);
	return transformBlock(ast);
};

/**
 * A template literal function for parsing markdown into HTML.
 *
 * This function allows you to write markdown within template literals and automatically
 * parse it into HTML. It supports various markdown features such as code blocks, links,
 * images, bold, italic, and inline code.
 *
 * @param {TemplateStringsArray} strings - The template strings array.
 * @param {...any} values - The values to be interpolated within the template.
 * @returns {string} - The HTML representation of the parsed markdown.
 *
 * @example
 * const html = md`
 *   # Hello World
 *   This is a **bold** text and this is an *italic* text.
 *   Here is a [link](https://example.com).
 *   \`\`\`javascript
 *   console.log("Hello, world!");
 *   \`\`\`
 * `;
 * console.log(html);
 * // Outputs:
 * // <h1>Hello World</h1>
 * // <p>This is a <strong>bold</strong> text and this is an <em>italic</em> text.</p>
 * // <p>Here is a <a href="https://example.com">link</a>.</p>
 * // <pre><code class="language-javascript">console.log("Hello, world!");</code></pre>
 *
 */
export const md = (strings, ...values) => {
	const markdown = strings.reduce(
		(acc, str, i) => acc + str + (i < values.length ? values[i] : ""),
		"",
	);
	return parseMarkdown(markdown);
};
