/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Internal markdown parsing utilities for advanced processing
 *
 * **INTERNAL USE ONLY** - This module provides low-level access to the markdown
 * parser's AST (Abstract Syntax Tree) for advanced use cases like documentation
 * generation, content analysis, and structured data extraction.
 *
 * These functions are used internally by @raven-js/glean for documentation
 * processing. External consumers should use the main `md` template literal
 * function for standard markdown-to-HTML conversion.
 *
 * **Stability:** These internal APIs may change between minor versions.
 * Only use them if you need direct access to the AST structure.
 */

import { parseBlocks } from "./block-parser/index.js";
import { collectReferences } from "./block-parser/reference-parser.js";
import { splitIntoLines } from "./block-parser/utils.js";
import { NODE_TYPES } from "./types.js";

/**
 * Parse markdown text to AST without HTML conversion
 *
 * **Internal Use Only** - Provides direct access to the parsed AST structure
 * for advanced processing scenarios. The AST contains structured node information
 * that can be analyzed, transformed, or used for content extraction.
 *
 * @param {string} markdown - Raw markdown text to parse
 * @returns {{ast: Array<any>, references: Object<string, {url: string, title?: string}>, lines: string[]}} Parsed AST with metadata
 *
 * @example
 * // Extract structured content for documentation analysis
 * const { ast, references, lines } = parseMarkdownToAST(`
 * # Introduction
 * This is a [link](https://example.com) and ![image](./image.png).
 * \`\`\`javascript
 * console.log("Hello world");
 * \`\`\`
 * `);
 */
export const parseMarkdownToAST = (markdown) => {
	if (typeof markdown !== "string") {
		return { ast: [], references: {}, lines: [] };
	}

	const lines = splitIntoLines(markdown);
	const references = collectReferences(lines);
	const ast = parseBlocks(lines, references);

	return { ast, references, lines };
};

/**
 * Extract structured content from markdown for analysis
 *
 * **Internal Use Only** - Analyzes markdown AST to extract structured information
 * like headings, links, images, code blocks, etc. Used by documentation generators
 * and content management systems that need programmatic access to markdown structure.
 *
 * @param {string} markdown - Raw markdown text to analyze
 * @returns {{
 *   headings: Array<{level: number, title: string, id: string, line: number}>,
 *   links: Array<{type: string, url: string, text: string, line: number}>,
 *   images: Array<{src: string, alt: string, line: number}>,
 *   codeBlocks: Array<{language: string, content: string, line: number}>,
 *   wordCount: number,
 *   lineCount: number
 * }} Structured content information
 *
 * @example
 * // Analyze README structure for documentation tooling
 * const structure = extractStructuredContent(readmeContent);
 * console.log(`Found ${structure.headings.length} headings`);
 * console.log(`Found ${structure.links.length} links`);
 */
export const extractStructuredContent = (markdown) => {
	const { ast, lines } = parseMarkdownToAST(markdown);

	/** @type {Array<{level: number, title: string, id: string, line: number}>} */
	const headings = [];
	/** @type {Array<{type: string, url: string, text: string, line: number}>} */
	const links = [];
	/** @type {Array<{src: string, alt: string, line: number}>} */
	const images = [];
	/** @type {Array<{language: string, content: string, line: number}>} */
	const codeBlocks = [];

	// Track current line for AST nodes
	let currentLine = 1;

	/**
	 * Extract plain text from inline nodes
	 * @param {Array<any>} inlineNodes - Array of inline AST nodes
	 * @returns {string} Extracted text
	 */
	const extractTextFromInlineNodes = (inlineNodes) => {
		if (!Array.isArray(inlineNodes)) return "";
		return inlineNodes
			.map((node) => {
				if (typeof node === "string") return node;
				if (node.type === NODE_TYPES.TEXT && typeof node.content === "string") {
					return node.content;
				}
				if (Array.isArray(node.content)) {
					return extractTextFromInlineNodes(node.content);
				}
				return "";
			})
			.join("");
	};

	/**
	 * Generate URL-friendly heading ID
	 * @param {string} title - Heading title
	 * @returns {string} URL-friendly ID
	 */
	const generateHeadingId = (title) => {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	};

	/**
	 * Classify link type based on URL
	 * @param {string} url - Link URL
	 * @returns {string} Link type
	 */
	const classifyLink = (url) => {
		if (url.startsWith("#")) return "anchor";
		if (url.startsWith("http://") || url.startsWith("https://"))
			return "external";
		if (url.startsWith("./") || url.startsWith("../") || !url.includes("://")) {
			const assetExtensions = [
				".png",
				".jpg",
				".jpeg",
				".gif",
				".svg",
				".pdf",
				".doc",
			];
			if (assetExtensions.some((ext) => url.toLowerCase().endsWith(ext))) {
				return "asset";
			}
			return "internal";
		}
		return "unknown";
	};

	/**
	 * Recursively traverse AST nodes and extract structured content
	 * @param {any} node - AST node to process
	 * @param {number} lineOffset - Current line offset
	 * @returns {number} Updated line offset
	 */
	const traverseNode = (node, lineOffset) => {
		if (!node || typeof node !== "object") {
			return lineOffset;
		}

		switch (node.type) {
			case NODE_TYPES.HEADING:
				if (node.content) {
					const title =
						typeof node.content === "string"
							? node.content.trim()
							: extractTextFromInlineNodes(node.content);
					if (title) {
						headings.push({
							level: node.level || 1,
							title: title,
							id: generateHeadingId(title),
							line: lineOffset,
						});
					}
				}
				break;

			case NODE_TYPES.CODE_BLOCK:
				if (node.content && typeof node.content === "string") {
					codeBlocks.push({
						language: node.language || "text",
						content: node.content,
						line: lineOffset,
					});
				}
				break;

			case NODE_TYPES.LINK:
				if (node.url && node.content) {
					const text =
						typeof node.content === "string"
							? node.content
							: extractTextFromInlineNodes(node.content);
					links.push({
						type: classifyLink(node.url),
						url: node.url,
						text: text,
						line: lineOffset,
					});
				}
				break;

			case NODE_TYPES.IMAGE:
				if (node.url) {
					images.push({
						src: node.url,
						alt: node.alt || "",
						line: lineOffset,
					});
				}
				break;
		}

		// Recursively process child nodes
		let newOffset = lineOffset;
		if (Array.isArray(node.content)) {
			for (const child of node.content) {
				newOffset = traverseNode(child, newOffset);
			}
		}
		if (Array.isArray(node.items)) {
			for (const item of node.items) {
				newOffset = traverseNode(item, newOffset);
			}
		}
		if (Array.isArray(node.rows)) {
			for (const row of node.rows) {
				newOffset = traverseNode(row, newOffset);
			}
		}
		if (Array.isArray(node.cells)) {
			for (const cell of node.cells) {
				newOffset = traverseNode(cell, newOffset);
			}
		}

		return newOffset + 1;
	};

	// Process all AST nodes
	for (const node of ast) {
		currentLine = traverseNode(node, currentLine);
	}

	// Calculate word count
	const wordCount = markdown
		.split(/\s+/)
		.filter((word) => word.length > 0).length;

	return {
		headings,
		links,
		images,
		codeBlocks,
		wordCount,
		lineCount: lines.length,
	};
};
