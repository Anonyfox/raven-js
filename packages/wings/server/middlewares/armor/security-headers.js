/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTTP security headers with CSP, HSTS, and modern browser protections
 *
 * Comprehensive security header implementation covering OWASP recommendations.
 * Configurable CSP with directive formatting, HSTS with preload support.
 * Graceful error handling prevents response corruption from header failures.
 *
 * **Standards Compliance**: OWASP, Mozilla Observatory, W3C specifications
 * **Performance**: Pre-formatted headers cached, minimal runtime processing
 * **Compatibility**: Modern browser focus, legacy browser graceful degradation
 * **Error Safety**: Header setting failures logged but don't break responses
 */

/**
 * Restrictive CSP directives providing strong baseline security.
 *
 * @type {Record<string, string[]>}
 *
 * @example
 * // Use default CSP directives
 * const csp = formatCSP(DEFAULT_CSP_DIRECTIVES);
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
 * Enterprise-grade security headers optimized for production deployments.
 *
 * @type {import('./config.js').SecurityHeadersConfig}
 *
 * @example
 * // Use default security headers configuration
 * const headers = { ...DEFAULT_HEADERS, frameOptions: 'SAMEORIGIN' };
 */
export const DEFAULT_HEADERS = {
	enabled: true,
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
	crossOriginResourcePolicy: "same-origin",
};

/**
 * Format CSP directives object into compliant header value string.
 *
 * @param {Record<string, string[]|string>} directives - CSP directive configuration
 * @returns {string} Formatted CSP header value
 *
 * @example
 * // Format CSP directives for header
 * const csp = formatCSP({ 'default-src': ["'self'"], 'script-src': ["'self'", "'unsafe-inline'"] });
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
 * Format Permissions Policy object into compliant header value string.
 *
 * @param {Record<string, string[]>} permissions - Feature to allowlist mapping
 * @returns {string} Formatted Permissions-Policy header value
 *
 * @example
 * // Format permissions policy for header
 * const policy = formatPermissionsPolicy({ geolocation: [], camera: ['self'] });
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
 * Apply security headers to response with graceful error handling.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with response headers
 * @param {import('./config.js').SecurityHeadersConfig} headersConfig - Security headers configuration
 * @returns {Error[]} Array of errors encountered (empty if successful)
 *
 * @example
 * // Apply security headers to response
 * const errors = setSecurityHeaders(ctx, DEFAULT_HEADERS);
 * if (errors.length > 0) console.log('Header errors:', errors);
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
