/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTML import map script tag injection.
 *
 * Detects HTML responses and injects import map script tags before the
 * closing head tag. Uses Wings Context mutation patterns for optimal
 * performance with mutable response body modification.
 */

import { HEADER_NAMES, MIME_TYPES } from "../../../core/string-pool.js";

/**
 * Injects import map script tag into HTML responses.
 *
 * @param {import('../../../core/context.js').Context} ctx - Wings context instance
 * @param {string} importMapPath - URL path to import map endpoint
 * @param {object} [importMapData] - Optional import map data to inline
 * @returns {boolean} True if injection was performed, false otherwise
 *
 * @example
 * // Inject import map into HTML response
 * injectImportMap(ctx, "/modules.json"); // true if injected
 */
export function injectImportMap(
	ctx,
	importMapPath = "/importmap.json",
	importMapData = null,
) {
	// Only process HTML responses
	if (!isHtmlResponse(ctx)) {
		return false;
	}

	// Only process if we have response body
	if (!ctx.responseBody || typeof ctx.responseBody !== "string") {
		return false;
	}

	// Create import map script tag - use inline for better browser compatibility
	const importMapScript = importMapData
		? `<script type="importmap">\n${JSON.stringify(importMapData, null, 2)}\n</script>`
		: `<script type="importmap" src="${importMapPath}"></script>`;

	// Find and inject before closing head tag (case-insensitive)
	const headCloseRegex = /<\/head>/i;
	const headCloseMatch = ctx.responseBody.match(headCloseRegex);

	if (headCloseMatch) {
		// Inject before </head>
		ctx.responseBody = ctx.responseBody.replace(
			headCloseRegex,
			`${importMapScript}\n${headCloseMatch[0]}`,
		);
		return true;
	}

	// Fallback: inject after opening head tag if no closing head found
	// But skip self-closing head tags as they can't contain content
	const headOpenRegex = /<head[^>]*(?<!\/)>/i;
	const headOpenMatch = ctx.responseBody.match(headOpenRegex);

	if (headOpenMatch && !headOpenMatch[0].includes("/>")) {
		ctx.responseBody = ctx.responseBody.replace(
			headOpenRegex,
			`${headOpenMatch[0]}\n${importMapScript}`,
		);
		return true;
	}

	// Final fallback: inject after opening html tag
	const htmlOpenRegex = /<html[^>]*>/i;
	const htmlOpenMatch = ctx.responseBody.match(htmlOpenRegex);

	if (htmlOpenMatch) {
		ctx.responseBody = ctx.responseBody.replace(
			htmlOpenRegex,
			`${htmlOpenMatch[0]}\n<head>\n${importMapScript}\n</head>`,
		);
		return true;
	}

	// Unable to inject - malformed or non-standard HTML
	return false;
}

/**
 * Checks if the response is HTML content.
 *
 * Examines the content-type header using Wings string pool constants
 * for optimal performance and consistency.
 *
 * @param {import('../../../core/context.js').Context} ctx - Wings context instance
 * @returns {boolean} True if response is HTML content
 */
function isHtmlResponse(ctx) {
	const contentType = ctx.responseHeaders.get(HEADER_NAMES.CONTENT_TYPE);
	return contentType?.toLowerCase().includes(MIME_TYPES.TEXT_HTML) ?? false;
}
