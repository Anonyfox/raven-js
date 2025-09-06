/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Documentation page - uses loadDynamicData pattern
 */

import { md } from "@raven-js/beak";
import { Context } from "@raven-js/wings";
import { findDocPageByPath } from "../../../collections/doc-pages.js";

/**
 * @typedef {import("../../../collections/doc-pages.js").DocPage} DocPage
 */

/**
 * @typedef {Object} DocsData
 * @property {DocPage|null} docPage - Documentation page from collection
 * @property {string} pathString - Documentation path string
 */

/**
 * Load dynamic data for this page
 * @param {Context} ctx - Wings request context
 * @returns {Promise<DocsData>} Page data
 */
export async function loadDynamicData(ctx) {
	// Extract path from catch-all parameter
	// Wings uses '*path' as the parameter name for catch-all routes
	const pathString = ctx.pathParams["*path"] || "";
	const docPage = findDocPageByPath(pathString);
	return { docPage, pathString };
}

/**
 * Doc page title - dynamic from collection
 * @param {DocsData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page title
 */
export const title = async (data) => {
	return data.docPage?.title || "Documentation Not Found";
};

/**
 * Doc page description - dynamic from collection
 * @param {DocsData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page description
 */
export const description = async (data) => {
	return (
		data.docPage?.description ||
		"The requested documentation page could not be found"
	);
};

/**
 * Doc page content - dynamic from collection
 * @param {DocsData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page body content
 */
export const body = async (data) => {
	if (!data.docPage) {
		return md`
# Documentation Not Found

The documentation page at **${data.pathString}** could not be found.

[← Back to Docs](/docs)
		`;
	}

	return md`${data.docPage.content}`;
};
