/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { Middleware } from "../../core/middleware.js";

/**
 * @file CORS (Cross-Origin Resource Sharing) middleware providing RFC 6454 compliant origin validation and preflight handling for Wings applications.
 */

/**
 * Default HTTP methods allowed for CORS requests
 * Standard methods covering 95% of API requirements
 */
const DEFAULT_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

/**
 * Default headers allowed in CORS requests
 * These cover the most common headers needed for API requests
 */
const DEFAULT_ALLOWED_HEADERS = ["Content-Type", "Authorization"];

/**
 * Validate CORS configuration options.
 *
 * @param {Object} options - Configuration options to validate
 * @param {string|string[]|RegExp|((origin: string|null) => boolean)|boolean} options.origin - Origin configuration
 * @param {string[]} options.methods - HTTP methods array
 * @param {string[]} options.allowedHeaders - Allowed request headers array
 * @param {string[]} options.exposedHeaders - Headers exposed to client array
 * @param {boolean} options.credentials - Whether credentials (cookies/auth headers) allowed
 * @param {number} options.maxAge - Preflight cache time in seconds
 * @throws {Error} Configuration validation failures requiring immediate fix
 *
 * @example
 * // Validate CORS configuration before middleware creation
 */
function validateCorsOptions(options) {
	// Validate methods array
	if (!Array.isArray(options.methods) || options.methods.length === 0) {
		throw new Error("CORS: methods must be a non-empty array of HTTP methods");
	}

	// Validate allowed headers array
	if (!Array.isArray(options.allowedHeaders)) {
		throw new Error("CORS: allowedHeaders must be an array of header names");
	}

	// Validate exposed headers array
	if (!Array.isArray(options.exposedHeaders)) {
		throw new Error("CORS: exposedHeaders must be an array of header names");
	}

	// Validate credentials boolean
	if (typeof options.credentials !== "boolean") {
		throw new Error("CORS: credentials must be a boolean value");
	}

	// Validate maxAge number
	if (typeof options.maxAge !== "number" || options.maxAge < 0) {
		throw new Error("CORS: maxAge must be a non-negative number");
	}

	// Validate origin + credentials security constraint
	if (
		options.credentials &&
		(options.origin === "*" || options.origin === true)
	) {
		throw new Error(
			"CORS: Cannot use wildcard origin with credentials enabled for security reasons",
		);
	}
}

/**
 * Format header array for HTTP header value
 *
 * **Performance:** Simple string join - no validation overhead for trusted internal data.
 *
 * @param {string[]} headers - Array of header names (assumed valid)
 * @returns {string} RFC 7230 compliant comma-separated header string
 *
 * @example
 * ```javascript
 * formatHeaderValue(['Content-Type', 'Authorization']);
 * // Returns: 'Content-Type, Authorization'
 * ```
 */
function formatHeaderValue(headers) {
	return headers.join(", ");
}

/**
 * Parse comma-separated header value into array
 *
 * **Dangerous Edge:** Null/empty values return empty array. Malformed headers are filtered out.
 * **Performance:** Trims whitespace for cross-browser compatibility.
 *
 * @param {string|null} headerValue - Access-Control-Request-Headers value or null
 * @returns {string[]} Array of trimmed, non-empty header names
 *
 * @example
 * ```javascript
 * parseHeaderValue('Content-Type, Authorization, X-API-Key');
 * // Returns: ['Content-Type', 'Authorization', 'X-API-Key']
 * ```
 */
function parseHeaderValue(headerValue) {
	if (!headerValue || typeof headerValue !== "string") {
		return [];
	}

	return headerValue
		.split(",")
		.map((header) => header.trim())
		.filter((header) => header.length > 0);
}

/**
 * CORS - Cross-Origin Resource Sharing Middleware
 *
 * This middleware provides comprehensive CORS support for Wings applications,
 * handling both preflight OPTIONS requests and regular request CORS headers.
 * It follows the CORS specification (RFC 6454) and WHATWG CORS standard to
 * ensure proper cross-origin request handling.
 *
 * ## CORS Fundamentals
 *
 * CORS is a security mechanism that uses HTTP headers to tell browsers which
 * origins are allowed to access a web API from client-side JavaScript. Without
 * proper CORS configuration, browsers will block cross-origin requests to
 * protect users from malicious scripts.
 *
 * The middleware handles two types of requests:
 * 1. **Simple Requests**: GET, POST with standard headers - just need response headers
 * 2. **Preflight Requests**: Complex requests that require an OPTIONS preflight check
 *
 * ## Origin Configuration
 *
 * The origin option supports multiple configuration patterns for maximum flexibility:
 *
 * - **String**: Exact origin match (`'https://myapp.com'`)
 * - **Array**: Multiple allowed origins (`['https://app1.com', 'https://app2.com']`)
 * - **RegExp**: Pattern matching (`/^https:\/\/.*\.myapp\.com$/`)
 * - **Function**: Dynamic validation (`(origin) => isAllowed(origin)`)
 * - **Boolean**: `true` for wildcard, `false` to disable CORS
 * - **Wildcard**: `'*'` allows all origins (not recommended with credentials)
 *
 * ## Security Considerations
 *
 * - Wildcard origins (`*`) cannot be used with credentials for security
 * - Origin validation is strict - malformed origins are rejected
 * - Preflight requests are validated completely before processing
 * - Invalid CORS requests receive proper 403 Forbidden responses
 *
 * @example Basic CORS (Allow All Origins)
 * ```javascript
 * // Simple setup - allows all origins (development only)
 * const cors = new CORS();
 * router.use(cors);
 * ```
 *
 * @example Production CORS (Specific Origins)
 * ```javascript
 * const cors = new CORS({
 *   origin: ['https://myapp.com', 'https://admin.myapp.com'],
 *   credentials: true,
 *   exposedHeaders: ['X-Total-Count']
 * });
 * router.use(cors);
 * ```
 *
 * @example Dynamic Origin Validation
 * ```javascript
 * const cors = new CORS({
 *   origin: (origin) => {
 *     // Allow subdomains of myapp.com
 *     return origin && origin.match(/^https:\/\/.*\.myapp\.com$/);
 *   },
 *   credentials: true
 * });
 * ```
 *
 * @example API-Specific CORS
 * ```javascript
 * const cors = new CORS({
 *   origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
 *   methods: ['GET', 'POST', 'PUT', 'DELETE'],
 *   allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
 *   exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
 *   credentials: true,
 *   maxAge: 86400  // 24 hours
 * });
 * ```
 */
export class CORS extends Middleware {
	/**
	 * Create CORS middleware with surgical security validation
	 *
	 * **Integration Trap:** Must register before route handlers to catch preflight OPTIONS requests.
	 * **Security Constraint:** Cannot combine wildcard origins with credentials per RFC 6454.
	 * **Performance Note:** Origin functions called for every request - keep validation logic fast.
	 *
	 * @param {Object} [options={}] - CORS configuration options
	 * @param {string|string[]|RegExp|((origin: string|null) => boolean)|boolean} [options.origin='*'] - Origin validation strategy
	 * @param {string[]} [options.methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']] - Allowed HTTP methods
	 * @param {string[]} [options.allowedHeaders=['Content-Type', 'Authorization']] - Request headers whitelist
	 * @param {string[]} [options.exposedHeaders=[]] - Response headers visible to client JavaScript
	 * @param {boolean} [options.credentials=false] - Allow cookies/authorization headers (requires specific origins)
	 * @param {number} [options.maxAge=86400] - Preflight cache duration in seconds
	 * @param {string} [options.identifier='@raven-js/wings/cors'] - Middleware identifier for debugging
	 *
	 * @throws {Error} Configuration validation failures preventing secure operation
	 *
	 * @example Development Setup
	 * ```javascript
	 * // Allow all origins - good for development
	 * const cors = new CORS({
	 *   origin: true,
	 *   credentials: false  // Required with wildcard origins
	 * });
	 * ```
	 *
	 * @example Production Setup
	 * ```javascript
	 * // Strict origin control for production
	 * const cors = new CORS({
	 *   origin: ['https://myapp.com', 'https://admin.myapp.com'],
	 *   methods: ['GET', 'POST', 'PUT', 'DELETE'],
	 *   allowedHeaders: ['Content-Type', 'Authorization'],
	 *   credentials: true,
	 *   maxAge: 3600  // 1 hour cache
	 * });
	 * ```
	 *
	 * @example Regex Origins
	 * ```javascript
	 * // Allow all subdomains of myapp.com
	 * const cors = new CORS({
	 *   origin: /^https:\/\/.*\.myapp\.com$/,
	 *   credentials: true
	 * });
	 * ```
	 *
	 * @example Function-Based Validation
	 * ```javascript
	 * // Custom origin validation logic
	 * const cors = new CORS({
	 *   origin: (origin) => {
	 *     // Allow localhost in development
	 *     if (process.env.NODE_ENV === 'development') {
	 *       return origin?.includes('localhost');
	 *     }
	 *     // Production whitelist
	 *     return ['https://myapp.com', 'https://admin.myapp.com'].includes(origin);
	 *   }
	 * });
	 * ```
	 */
	constructor(options = {}) {
		const {
			origin = "*",
			methods = DEFAULT_METHODS,
			allowedHeaders = DEFAULT_ALLOWED_HEADERS,
			exposedHeaders = [],
			credentials = false,
			maxAge = 86400,
			identifier = "@raven-js/wings/cors",
		} = options;

		// Validate configuration before processing
		validateCorsOptions({
			origin,
			methods,
			allowedHeaders,
			exposedHeaders,
			credentials,
			maxAge,
		});

		// Create configuration object (clone arrays to prevent external mutation)
		const config = {
			origin,
			methods: [...methods],
			allowedHeaders: [...allowedHeaders],
			exposedHeaders: [...exposedHeaders],
			credentials,
			maxAge,
		};

		super(async (/** @type {any} */ ctx) => {
			// Handle preflight OPTIONS requests immediately
			if (ctx.method === "OPTIONS") {
				await this.#handlePreflight(ctx);
			} else {
				// Register after callback for regular requests
				ctx.addAfterCallback(
					new Middleware(async (/** @type {any} */ ctx) => {
						this.#setCorsHeaders(ctx);
					}, `${identifier}-headers`),
				);
			}
		}, identifier);

		// Store validated configuration
		this.origin = config.origin;
		this.methods = config.methods;
		this.allowedHeaders = config.allowedHeaders;
		this.exposedHeaders = config.exposedHeaders;
		this.credentials = config.credentials;
		this.maxAge = config.maxAge;
	}

	/**
	 * Handle preflight OPTIONS requests
	 *
	 * Preflight requests are sent by browsers before complex CORS requests to
	 * check if the actual request is allowed. This method validates the preflight
	 * request and responds with appropriate CORS headers or error responses.
	 *
	 * Validation steps:
	 * 1. Check if origin is allowed
	 * 2. Validate requested method
	 * 3. Validate requested headers
	 * 4. Set CORS response headers
	 * 5. End response with 204 No Content
	 *
	 * @param {import('../../core/context.js').Context} ctx - Request context
	 */
	async #handlePreflight(ctx) {
		try {
			// Extract preflight request information
			const origin = ctx.requestHeaders.get("origin");
			const requestedMethod = ctx.requestHeaders.get(
				"access-control-request-method",
			);
			const requestedHeaders = ctx.requestHeaders.get(
				"access-control-request-headers",
			);

			// Validate origin (let errors propagate for proper error handling)
			const allowedOrigin = this.#getAllowedOriginForPreflight(origin);
			if (!allowedOrigin) {
				ctx.responseStatusCode = 403;
				ctx.responseBody = "CORS: Origin not allowed";
				ctx.responseEnded = true;
				return;
			}

			// Validate requested method
			if (
				requestedMethod &&
				!this.methods.includes(requestedMethod.toUpperCase())
			) {
				ctx.responseStatusCode = 403;
				ctx.responseBody = "CORS: Method not allowed";
				ctx.responseEnded = true;
				return;
			}

			// Validate requested headers
			if (requestedHeaders && !this.#areHeadersAllowed(requestedHeaders)) {
				ctx.responseStatusCode = 403;
				ctx.responseBody = "CORS: Headers not allowed";
				ctx.responseEnded = true;
				return;
			}

			// Set CORS headers for preflight response
			this.#setCorsHeaders(ctx);

			// Set preflight-specific headers
			ctx.responseHeaders.set(
				"Access-Control-Allow-Methods",
				formatHeaderValue(this.methods),
			);
			ctx.responseHeaders.set(
				"Access-Control-Allow-Headers",
				formatHeaderValue(this.allowedHeaders),
			);
			ctx.responseHeaders.set("Access-Control-Max-Age", this.maxAge.toString());

			// End preflight response successfully
			ctx.responseStatusCode = 204; // No Content
			ctx.responseBody = "";
			ctx.responseEnded = true;
		} catch (error) {
			// Handle any errors during preflight processing
			const corsError = new Error(`CORS preflight failed: ${error.message}`);
			corsError.name = "CORSError";
			/** @type {any} */ (corsError).originalError = error;
			ctx.errors.push(corsError);

			// Return 500 for unexpected errors
			ctx.responseStatusCode = 500;
			ctx.responseBody = "CORS: Internal error during preflight";
			ctx.responseEnded = true;
		}
	}

	/**
	 * Set CORS headers on response
	 *
	 * This method adds the appropriate CORS headers to regular (non-preflight)
	 * responses based on the configuration and request origin. It only sets
	 * headers if the origin is allowed according to the configuration.
	 *
	 * Headers set:
	 * - Access-Control-Allow-Origin: Echo allowed origin or '*'
	 * - Access-Control-Allow-Credentials: 'true' if credentials enabled
	 * - Access-Control-Expose-Headers: Exposed headers list
	 * - Vary: 'Origin' for proper caching
	 *
	 * @param {import('../../core/context.js').Context} ctx - Request context
	 */
	#setCorsHeaders(ctx) {
		try {
			// Skip if response already ended or no body
			if (ctx.responseEnded || !ctx.responseBody) {
				return;
			}

			const requestOrigin = ctx.requestHeaders.get("origin");

			// Determine allowed origin for this request
			const allowedOrigin = this.#getAllowedOrigin(requestOrigin);
			if (!allowedOrigin) {
				return; // Origin not allowed, don't set CORS headers
			}

			// Set core CORS headers
			ctx.responseHeaders.set("Access-Control-Allow-Origin", allowedOrigin);

			// Set credentials header if enabled
			if (this.credentials) {
				ctx.responseHeaders.set("Access-Control-Allow-Credentials", "true");
			}

			// Set exposed headers if configured
			if (this.exposedHeaders.length > 0) {
				ctx.responseHeaders.set(
					"Access-Control-Expose-Headers",
					formatHeaderValue(this.exposedHeaders),
				);
			}

			// Always set Vary header for proper caching
			const existingVary = ctx.responseHeaders.get("vary");
			const varyValue = existingVary ? `${existingVary}, Origin` : "Origin";
			ctx.responseHeaders.set("Vary", varyValue);
		} catch (error) {
			// Log error but don't break the response
			const corsError = new Error(
				`CORS header setting failed: ${error.message}`,
			);
			corsError.name = "CORSError";
			/** @type {any} */ (corsError).originalError = error;
			ctx.errors.push(corsError);
		}
	}

	/**
	 * Get allowed origin for preflight requests with error propagation
	 *
	 * **Critical Difference:** Unlike regular requests, preflight origin function errors
	 * propagate to generate proper 500 responses. Regular requests silently deny on errors.
	 * **Dangerous Edge:** Null origin indicates same-origin request requiring no CORS headers.
	 *
	 * @param {string|null} requestOrigin - Origin header value from preflight request
	 * @returns {string|null} Allowed origin for Access-Control-Allow-Origin header or null if denied
	 * @throws {Error} Origin function validation errors (propagated for preflight error responses)
	 */
	#getAllowedOriginForPreflight(requestOrigin) {
		// No origin header = same-origin request, no CORS headers needed
		if (!requestOrigin) {
			return null;
		}

		// Handle boolean origin configuration
		if (this.origin === true || this.origin === "*") {
			// Wildcard not allowed with credentials (security constraint)
			if (this.credentials) {
				throw new Error("Cannot use wildcard origin with credentials");
			}
			return "*";
		}

		if (this.origin === false) {
			return null; // CORS disabled
		}

		// Handle string origin configuration
		if (typeof this.origin === "string") {
			return requestOrigin === this.origin ? requestOrigin : null;
		}

		// Handle array origin configuration
		if (Array.isArray(this.origin)) {
			return this.origin.includes(requestOrigin) ? requestOrigin : null;
		}

		// Handle regex origin configuration
		if (this.origin instanceof RegExp) {
			return this.origin.test(requestOrigin) ? requestOrigin : null;
		}

		// Handle function origin configuration (let errors propagate)
		if (typeof this.origin === "function") {
			return this.origin(requestOrigin) ? requestOrigin : null;
		}

		return null; // Unknown configuration type = deny
	}

	/**
	 * Get allowed origin for regular requests with silent error handling
	 *
	 * **Critical Difference:** Origin function errors are silently caught and treated as denial.
	 * Preflight requests propagate errors for proper 500 responses.
	 * **Dangerous Edge:** Returns null for null origins (same-origin requests need no CORS).
	 *
	 * @param {string|null} requestOrigin - Origin header value from request
	 * @returns {string|null} Allowed origin for Access-Control-Allow-Origin header or null if denied
	 */
	#getAllowedOrigin(requestOrigin) {
		// No origin header = same-origin request, no CORS headers needed
		if (!requestOrigin) {
			return null;
		}

		// Handle boolean origin configuration
		if (this.origin === true || this.origin === "*") {
			// Wildcard not allowed with credentials (security constraint)
			if (this.credentials) {
				throw new Error("Cannot use wildcard origin with credentials");
			}
			return "*";
		}

		if (this.origin === false) {
			return null; // CORS disabled
		}

		// Handle string origin configuration
		if (typeof this.origin === "string") {
			return requestOrigin === this.origin ? requestOrigin : null;
		}

		// Handle array origin configuration
		if (Array.isArray(this.origin)) {
			return this.origin.includes(requestOrigin) ? requestOrigin : null;
		}

		// Handle regex origin configuration
		if (this.origin instanceof RegExp) {
			return this.origin.test(requestOrigin) ? requestOrigin : null;
		}

		// Handle function origin configuration
		if (typeof this.origin === "function") {
			try {
				return this.origin(requestOrigin) ? requestOrigin : null;
			} catch {
				return null; // Function threw error = deny
			}
		}

		return null; // Unknown configuration type = deny
	}

	/**
	 * Validate preflight requested headers against whitelist
	 *
	 * **Performance:** Case-insensitive comparison for cross-browser compatibility.
	 * **Dangerous Edge:** Empty header values are ignored, malformed headers cause denial.
	 *
	 * @param {string} requestedHeaders - Access-Control-Request-Headers value (comma-separated)
	 * @returns {boolean} True if all requested headers in allowedHeaders whitelist
	 */
	#areHeadersAllowed(requestedHeaders) {
		const requested = parseHeaderValue(requestedHeaders);
		const allowed = this.allowedHeaders.map((h) => h.toLowerCase());

		return requested.every((header) => allowed.includes(header.toLowerCase()));
	}
}
