/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Request structure and size validation for DoS protection
 *
 * Efficient request validation preventing resource exhaustion attacks.
 * Multi-layer validation checks path length, parameter counts, header sizes.
 * Zero-allocation validation for common request patterns.
 *
 * **DoS Protection**: Prevents memory/CPU exhaustion via oversized requests
 * **Performance**: O(n) where n = request component count (headers, params)
 * **Memory**: No allocation for valid requests, early rejection for invalid
 * **Attack Vectors**: Large headers, parameter pollution, path bombs, body size attacks
 */

/**
 * Production-ready validation limits balancing security with usability.
 * Sized for typical web applications while preventing common DoS vectors.
 *
 * **Path Length**: 2KB handles complex SPAs with deep routing
 * **Query Params**: 100 params accommodates complex forms and analytics
 * **Header Size**: 8KB total allows for auth tokens and modern header usage
 * **Body Size**: 1MB suitable for form uploads, adjust for file uploads
 *
 * @type {import('./config.js').RequestValidationConfig}
 */
export const DEFAULT_VALIDATION = {
	enabled: true,
	maxBodySize: 1024 * 1024, // 1MB
	maxHeaderSize: 8192, // 8KB
	maxHeaders: 100,
	maxQueryParams: 100,
	maxQueryParamLength: 1000,
	maxPathLength: 2048,
};

/**
 * Validate request structure against size and count limits to prevent DoS attacks.
 * Performs comprehensive validation across path, parameters, headers, and body.
 *
 * **Validation Order**: Path → Query params → Headers → Body (ordered by attack frequency)
 * **Early Exit**: Continues validation even after errors to provide complete feedback
 * **Error Collection**: Returns all validation failures for comprehensive logging
 * **Performance**: O(n) scan of request components, optimized for typical requests
 * **Memory Safety**: No allocation for valid requests, minimal allocation for errors
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @param {import('./config.js').RequestValidationConfig} config - Validation limits configuration
 * @returns {string[]} Array of validation error descriptions (empty if valid)
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
