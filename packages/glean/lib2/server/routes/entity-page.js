/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Entity page route handler for /modules/{moduleName}/{entityName}/ route
 *
 * Implements complex dual parameter resolution, comprehensive error handling,
 * and SEO-optimized responses for individual API entity documentation pages.
 * Follows WEBAPP.md specification for entity-specific documentation routing.
 */

import { extractEntityPageData } from "../data/entity-page.js";
import { entityPageTemplate } from "../templates/entity-page.js";

/**
 * Creates a handler for the entity documentation page.
 * @param {import('../../extract/models/package.js').Package} packageInstance - The package data instance.
 * @returns {Function} Wings route handler function
 */
export function createEntityPageHandler(packageInstance) {
	/**
	 * Handle entity documentation page requests
	 * @param {import('@raven-js/wings').Context} ctx - Wings request context
	 */
	return async (ctx) => {
		try {
			const moduleName = ctx.pathParams.moduleName;
			const entityName = ctx.pathParams.entityName;

			// Validate moduleName parameter
			if (
				!moduleName ||
				typeof moduleName !== "string" ||
				moduleName.trim() === ""
			) {
				return ctx.error("Module name is required and must be a valid string");
			}

			// Validate entityName parameter
			if (
				!entityName ||
				typeof entityName !== "string" ||
				entityName.trim() === ""
			) {
				return ctx.error("Entity name is required and must be a valid string");
			}

			// Security validation for moduleName
			if (
				moduleName.includes("..") ||
				moduleName.startsWith("/") ||
				moduleName.includes("//") ||
				moduleName.includes("\\") ||
				moduleName.includes("\0")
			) {
				return ctx.error(
					"Invalid module name format - cannot contain path traversal characters",
				);
			}

			// Security validation for entityName
			if (
				entityName.includes("..") ||
				entityName.startsWith("/") ||
				entityName.includes("//") ||
				entityName.includes("\\") ||
				entityName.includes("\0") ||
				entityName.includes("<") ||
				entityName.includes(">")
			) {
				return ctx.error(
					"Invalid entity name format - cannot contain dangerous characters",
				);
			}

			// Additional length validation to prevent abuse
			if (moduleName.length > 200 || entityName.length > 200) {
				return ctx.error(
					"Module and entity names must be under 200 characters",
				);
			}

			// Extract data for the specific entity
			const data = extractEntityPageData(
				packageInstance,
				moduleName,
				entityName,
			);

			// Generate HTML using template
			const html = entityPageTemplate(/** @type {any} */ (data));

			// Send HTML response with security and caching headers
			ctx.html(html);
			ctx.responseHeaders.set("Cache-Control", "public, max-age=3600");
			ctx.responseHeaders.set("X-Content-Type-Options", "nosniff");
			ctx.responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
		} catch (error) {
			// Handle specific error types with appropriate responses
			if (error.message?.includes("not found")) {
				return ctx.notFound(`Entity not found: ${error.message}`);
			} else {
				// Log error for debugging
				console.error("Entity page generation error:", error);
				return ctx.error(`Failed to generate entity page: ${error.message}`);
			}
		}
	};
}
