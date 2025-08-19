/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @packageDocumentation
 *
 * Default Content Security Policy directives
 * Restrictive by default, can be relaxed as needed
 */
export const DEFAULT_CSP_DIRECTIVES = {
	"default-src": ["'self'"],
	"script-src": ["'self'"],
	"style-src": ["'self'", "'unsafe-inline'"],
	"img-src": ["'self'", "data:", "https:"],
	"font-src": ["'self'"],
	"connect-src": ["'self'"],
	"frame-src": ["'none'"],
	"object-src": ["'none'"],
	"base-uri": ["'self'"],
	"form-action": ["'self'"],
};

/**
 * Default security headers configuration
 * Enterprise-grade defaults that work for most applications
 */
export const DEFAULT_HEADERS = {
	contentSecurityPolicy: DEFAULT_CSP_DIRECTIVES,
	contentSecurityPolicyReportOnly: false,
	frameOptions: "DENY",
	noSniff: true,
	xssProtection: true,
	httpStrictTransportSecurity: {
		maxAge: 31536000, // 1 year
		includeSubDomains: true,
		preload: false,
	},
	referrerPolicy: "strict-origin-when-cross-origin",
	permissionsPolicy: {
		/** @type {string[]} */
		geolocation: [],
		/** @type {string[]} */
		microphone: [],
		/** @type {string[]} */
		camera: [],
	},
	crossOriginEmbedderPolicy: "require-corp",
	crossOriginOpenerPolicy: "same-origin",
};

/**
 * Format Content Security Policy directives into header value
 *
 * @param {Object} directives - CSP directive object
 * @returns {string} Formatted CSP header value
 */
export function formatCSP(directives) {
	const formatted = [];

	for (const [directive, sources] of Object.entries(directives)) {
		if (Array.isArray(sources) && sources.length > 0) {
			formatted.push(`${directive} ${sources.join(" ")}`);
		} else if (typeof sources === "string") {
			formatted.push(`${directive} ${sources}`);
		}
	}

	return formatted.join("; ");
}

/**
 * Format Permissions Policy header value
 *
 * @param {Object} permissions - Permissions object
 * @returns {string} Formatted Permissions-Policy header value
 */
export function formatPermissionsPolicy(permissions) {
	const formatted = [];

	for (const [feature, allowlist] of Object.entries(permissions)) {
		if (Array.isArray(allowlist)) {
			if (allowlist.length === 0) {
				formatted.push(`${feature}=()`);
			} else {
				const origins = allowlist.map((origin) => `"${origin}"`).join(" ");
				formatted.push(`${feature}=(${origins})`);
			}
		}
	}

	return formatted.join(", ");
}

/**
 * Set security headers on response context
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @param {any} headersConfig - Headers configuration
 * @returns {Error[]} Array of errors encountered during header setting
 */
export function setSecurityHeaders(ctx, headersConfig) {
	/** @type {Error[]} */
	const errors = [];

	try {
		// Skip if response already ended
		if (ctx.responseEnded) return errors;

		const headers = headersConfig;

		// Content Security Policy
		if (
			headers.contentSecurityPolicy &&
			!ctx.responseHeaders.has("content-security-policy")
		) {
			const csp = headers.contentSecurityPolicy;
			const headerName = headers.contentSecurityPolicyReportOnly
				? "content-security-policy-report-only"
				: "content-security-policy";
			const headerValue = formatCSP(csp);
			ctx.responseHeaders.set(headerName, headerValue);
		}

		// X-Frame-Options
		if (headers.frameOptions && !ctx.responseHeaders.has("x-frame-options")) {
			ctx.responseHeaders.set("x-frame-options", headers.frameOptions);
		}

		// X-Content-Type-Options
		if (headers.noSniff && !ctx.responseHeaders.has("x-content-type-options")) {
			ctx.responseHeaders.set("x-content-type-options", "nosniff");
		}

		// X-XSS-Protection (legacy, but still useful for older browsers)
		if (headers.xssProtection && !ctx.responseHeaders.has("x-xss-protection")) {
			ctx.responseHeaders.set("x-xss-protection", "1; mode=block");
		}

		// Strict-Transport-Security
		if (
			headers.httpStrictTransportSecurity &&
			!ctx.responseHeaders.has("strict-transport-security")
		) {
			const hsts = headers.httpStrictTransportSecurity;
			let hstsValue = `max-age=${hsts.maxAge}`;
			if (hsts.includeSubDomains) hstsValue += "; includeSubDomains";
			if (hsts.preload) hstsValue += "; preload";
			ctx.responseHeaders.set("strict-transport-security", hstsValue);
		}

		// Referrer-Policy
		if (headers.referrerPolicy && !ctx.responseHeaders.has("referrer-policy")) {
			ctx.responseHeaders.set("referrer-policy", headers.referrerPolicy);
		}

		// Permissions-Policy
		if (
			headers.permissionsPolicy &&
			!ctx.responseHeaders.has("permissions-policy")
		) {
			const permissionsValue = formatPermissionsPolicy(
				headers.permissionsPolicy,
			);
			if (permissionsValue) {
				ctx.responseHeaders.set("permissions-policy", permissionsValue);
			}
		}

		// Cross-Origin-Embedder-Policy
		if (
			headers.crossOriginEmbedderPolicy &&
			!ctx.responseHeaders.has("cross-origin-embedder-policy")
		) {
			ctx.responseHeaders.set(
				"cross-origin-embedder-policy",
				headers.crossOriginEmbedderPolicy,
			);
		}

		// Cross-Origin-Opener-Policy
		if (
			headers.crossOriginOpenerPolicy &&
			!ctx.responseHeaders.has("cross-origin-opener-policy")
		) {
			ctx.responseHeaders.set(
				"cross-origin-opener-policy",
				headers.crossOriginOpenerPolicy,
			);
		}
	} catch (error) {
		// Header setting failed - capture error but don't break response
		const headerError = new Error(
			`Security header setting failed: ${error.message}`,
		);
		headerError.name = "SecurityHeaderError";
		/** @type {any} */ (headerError).originalError = error;
		errors.push(headerError);
	}

	return errors;
}
