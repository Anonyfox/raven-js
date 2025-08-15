/**
 * AST node types for markdown parsing
 */
export const NODE_TYPES = {
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
 * @typedef {Object} Node
 * @property {string} type - The type of the node, e.g., 'paragraph', 'heading', 'list', etc.
 * @property {string|Node[]} [content] - The content of the node, used for inline elements like text, bold, italic, etc.
 * @property {Array<Node>} [items] - The list items, used for list nodes.
 * @property {number} [level] - The level of the heading, used for heading nodes.
 * @property {string} [url] - The URL, used for link and image nodes.
 * @property {string} [alt] - The alt text, used for image nodes.
 * @property {string} [language] - The programming language, used for code block nodes.
 * @property {boolean} [ordered] - If it's a list, whether it is ordered or not.
 */

/**
 * @typedef {Object} InlineNode
 * @property {string} type - The type of the inline node
 * @property {string|InlineNode[]} [content] - The content of the inline node
 * @property {string} [url] - The URL, used for link nodes
 * @property {string} [alt] - The alt text, used for image nodes
 */

/**
 * @typedef {Object} BlockNode
 * @property {string} type - The type of the block node
 * @property {InlineNode[]|string} [content] - The content of the block node (InlineNode[] for most nodes, string for code blocks)
 * @property {Array<BlockNode>} [items] - The list items, used for list nodes
 * @property {number} [level] - The level of the heading, used for heading nodes
 * @property {string} [language] - The programming language, used for code block nodes
 * @property {boolean} [ordered] - If it's a list, whether it is ordered or not
 */

/**
 * @typedef {Object} ParseContext
 * @property {number} current - Current position in the text
 * @property {string} text - The text being parsed
 * @property {number} length - Length of the text
 */

/**
 * @typedef {Object} BlockParseContext
 * @property {number} current - Current line index
 * @property {string[]} lines - Array of lines to parse
 * @property {number} length - Number of lines
 */

/**
 * Regular expressions for markdown parsing
 */
export const REGEX_PATTERNS = {
	// Heading patterns
	HEADING: /^(#{1,6})\s+(.+)$/,

	// List patterns
	UNORDERED_LIST: /^[-*]\s+(.+)$/,
	ORDERED_LIST: /^([1-9]\d*)\.\s+(.+)$/,

	// Block patterns
	BLOCKQUOTE: /^>\s+(.+)$/,
	CODE_BLOCK_START: /^```(\w*)$/,
	CODE_BLOCK_END: /^```$/,
	HORIZONTAL_RULE: /^---+$/,

	// Inline patterns
	BOLD: /\*\*(.+?)\*\*/g,
	ITALIC: /\*(.+?)\*/g,
	INLINE_CODE: /`([^`]+)`/g,
	LINK: /\[([^\]]+)\]\(([^)]+)\)/g,
	IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,

	// Utility patterns
	WHITESPACE: /^\s*$/,
	EMPTY_LINE: /^$/,
};

/**
 * HTML tag mappings for node types
 * @type {Record<string, string|null>}
 */
export const HTML_TAGS = {
	[NODE_TYPES.PARAGRAPH]: "p",
	[NODE_TYPES.HEADING]: "h", // Will be combined with level
	[NODE_TYPES.LIST]: "ul", // Will be overridden for ordered lists
	[NODE_TYPES.LIST_ITEM]: "li",
	[NODE_TYPES.BLOCKQUOTE]: "blockquote",
	[NODE_TYPES.CODE_BLOCK]: "pre",
	[NODE_TYPES.HORIZONTAL_RULE]: "hr",
	[NODE_TYPES.LINK]: "a",
	[NODE_TYPES.IMAGE]: "img",
	[NODE_TYPES.BOLD]: "strong",
	[NODE_TYPES.ITALIC]: "em",
	[NODE_TYPES.CODE]: "code",
	[NODE_TYPES.TEXT]: null, // No tag for plain text
};

/**
 * Default values for node properties
 */
export const DEFAULT_VALUES = {
	HEADING_LEVEL: 1,
	LIST_ORDERED: false,
	CODE_LANGUAGE: "",
	LINK_URL: "#",
	IMAGE_ALT: "",
};

/**
 * Validation functions for node types
 */
export const VALIDATORS = {
	/**
	 * Validates if a node type is valid
	 * @param {string} type - The node type to validate
	 * @returns {boolean} - True if valid, false otherwise
	 */
	isValidNodeType: (type) => Object.values(NODE_TYPES).includes(type),

	/**
	 * Validates if a heading level is valid (1-6)
	 * @param {number} level - The heading level to validate
	 * @returns {boolean} - True if valid, false otherwise
	 */
	isValidHeadingLevel: (level) =>
		Number.isInteger(level) && level >= 1 && level <= 6,

	/**
	 * Validates if a URL is valid (basic check)
	 * @param {string} url - The URL to validate
	 * @returns {boolean} - True if valid, false otherwise
	 */
	isValidUrl: (url) => typeof url === "string" && url.length > 0,

	/**
	 * Validates if content is valid (can be empty)
	 * @param {string|Node[]} content - The content to validate
	 * @returns {boolean} - True if valid, false otherwise
	 */
	isValidContent: (content) => {
		if (typeof content === "string") {
			return true; // Empty strings are valid
		}
		if (Array.isArray(content)) {
			return true; // Empty arrays are valid
		}
		return false;
	},
};
