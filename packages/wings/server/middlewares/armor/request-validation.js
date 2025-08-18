/**
 * @fileoverview Request validation utilities for security and size limits
 *
 * Provides utilities for validating request size, structure, and content to prevent
 * various attacks and resource exhaustion. Includes validation for path length,
 * query parameters, headers, and body size.
 *
 * @author RavenJS Team
 * @since 0.3.0
 */

/**
 * Default request validation configuration
 */
export const DEFAULT_VALIDATION = {
	maxBodySize: 1024 * 1024, // 1MB
	maxHeaderSize: 8192, // 8KB
	maxHeaders: 100,
	maxQueryParams: 100,
	maxQueryParamLength: 1000,
	maxPathLength: 2048,
};

/**
 * Validate request size and structure to prevent various attacks
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @param {Object} config - Validation configuration
 * @param {number} config.maxPathLength - Maximum path length
 * @param {number} config.maxQueryParams - Maximum query parameters
 * @param {number} config.maxQueryParamLength - Maximum query parameter length
 * @param {number} config.maxHeaders - Maximum headers count
 * @param {number} config.maxHeaderSize - Maximum headers size
 * @param {number} config.maxBodySize - Maximum body size
 * @returns {string[]} Array of error messages, empty array if all validations pass
 */
export function validateRequest(ctx, config) {
	/** @type {string[]} */
	const errors = [];

	// Check path length
	if (ctx.path.length > config.maxPathLength) {
		errors.push(`Path too long: ${ctx.path.length} > ${config.maxPathLength}`);
	}

	// Check query parameters
	const paramCount = Array.from(ctx.queryParams.entries()).length;
	if (paramCount > config.maxQueryParams) {
		errors.push(
			`Too many query parameters: ${paramCount} > ${config.maxQueryParams}`,
		);
	}

	// Check query parameter lengths
	for (const [key, value] of ctx.queryParams.entries()) {
		if (key.length > config.maxQueryParamLength) {
			errors.push(
				`Query parameter key too long: ${key.length} > ${config.maxQueryParamLength}`,
			);
		}
		if (value.length > config.maxQueryParamLength) {
			errors.push(
				`Query parameter value too long: ${value.length} > ${config.maxQueryParamLength}`,
			);
		}
	}

	// Check header count and sizes
	let headerCount = 0;
	let totalHeaderSize = 0;

	for (const [key, value] of ctx.requestHeaders.entries()) {
		headerCount++;
		totalHeaderSize += key.length + value.length;
	}

	if (headerCount > config.maxHeaders) {
		errors.push(`Too many headers: ${headerCount} > ${config.maxHeaders}`);
	}

	if (totalHeaderSize > config.maxHeaderSize) {
		errors.push(
			`Headers too large: ${totalHeaderSize} > ${config.maxHeaderSize}`,
		);
	}

	// Check content length if present
	const contentLength = ctx.requestHeaders.get("content-length");
	if (contentLength) {
		const size = parseInt(contentLength, 10);
		if (!Number.isNaN(size) && size > config.maxBodySize) {
			errors.push(`Request body too large: ${size} > ${config.maxBodySize}`);
		}
	}

	return errors; // Return array of validation errors
}
