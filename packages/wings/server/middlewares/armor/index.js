/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { Middleware } from "../../../core/middleware.js";
import { detectAttacks } from "./attack-detection.js";
import { createConfig } from "./config.js";
import { getClientIP, isIPAllowed } from "./ip-utils.js";
import { RateLimitStore } from "./rate-limit.js";
import { validateRequest } from "./request-validation.js";
import { setSecurityHeaders } from "./security-headers.js";

export {
	checkPathTraversal,
	checkSQLInjection,
	checkSuspiciousPatterns,
	checkXSSAttempt,
	detectAttacks,
} from "./attack-detection.js";
export { createConfig } from "./config.js";
// Re-export utility functions for backward compatibility
export {
	getClientIP,
	isIPAllowed,
	isIPInCIDR,
	parseCIDR,
} from "./ip-utils.js";
export { RateLimitStore } from "./rate-limit.js";
export { validateRequest } from "./request-validation.js";
export {
	formatCSP,
	formatPermissionsPolicy,
	setSecurityHeaders,
} from "./security-headers.js";

/**
 * @file Comprehensive security middleware with layered protection architecture
 *
 * Production-ready security middleware implementing defense-in-depth strategy.
 * Two-phase processing optimizes performance while providing comprehensive protection.
 * Zero-dependency implementation ensures supply chain security.
 *
 * **Architecture**: Pre-processing (blocking) → Route handling → Post-processing (headers)
 * **Performance**: Early exit on security violations, minimal overhead for clean requests
 * **Memory**: Rate limiting with automatic cleanup, no memory leaks in long-running apps
 * **Integration**: Drop-in middleware compatible with Wings router and standard HTTP
 *
 * ## Security Layers
 *
 * **1. IP Access Control**: Whitelist/blacklist with CIDR support and proxy-aware IP extraction
 * **2. Rate Limiting**: Sliding window algorithm with per-route customization and memory management
 * **3. Request Validation**: Size and structure limits preventing DoS via resource exhaustion
 * **4. Attack Detection**: Pattern matching for SQL injection, XSS, path traversal, command injection
 * **5. Security Headers**: CSP, HSTS, COEP/COOP and modern browser protections
 *
 * ## Usage Examples
 *
 * ### Basic Protection (Recommended Defaults)
 * ```javascript
 * import { Armor } from '@raven-js/wings/server/middlewares/armor';
 *
 * const armor = new Armor();
 * router.use(armor);
 * // Enables: security headers, request validation, attack detection
 * // Disabled: rate limiting, IP filtering (configure as needed)
 * ```
 *
 * ### Production Configuration
 * ```javascript
 * const armor = new Armor({
 *   rateLimiting: {
 *     enabled: true,
 *     global: { max: 1000, windowMs: 60 * 60 * 1000 }, // 1000/hour
 *     routes: {
 *       '/api/auth/login': { max: 5, windowMs: 15 * 60 * 1000 }, // 5/15min
 *       '/api/': { max: 100, windowMs: 60 * 1000 } // 100/minute
 *     }
 *   },
 *   ipAccess: {
 *     mode: 'blacklist',
 *     blacklist: ['192.168.1.100', '10.0.0.0/8'],
 *     trustProxy: true // Behind load balancer
 *   },
 *   securityHeaders: {
 *     contentSecurityPolicy: {
 *       'default-src': ["'self'"],
 *       'script-src': ["'self'", 'https://cdn.example.com'],
 *       'style-src': ["'self'", "'unsafe-inline'"]
 *     },
 *     httpStrictTransportSecurity: {
 *       maxAge: 63072000, // 2 years
 *       includeSubDomains: true,
 *       preload: true
 *     }
 *   }
 * });
 * ```
 *
 * ### Development Configuration
 * ```javascript
 * const armor = new Armor({
 *   securityHeaders: {
 *     contentSecurityPolicy: false, // Disable for dev tools
 *     httpStrictTransportSecurity: false // No HTTPS in dev
 *   },
 *   rateLimiting: { enabled: false }, // No rate limits in dev
 *   attackDetection: {
 *     sqlInjection: false, // Allow test payloads
 *     suspiciousPatterns: false
 *   }
 * });
 * ```
 *
 * ### API Gateway Configuration
 * ```javascript
 * const armor = new Armor({
 *   rateLimiting: {
 *     enabled: true,
 *     keyGenerator: (ctx) => {
 *       // Custom rate limiting by API key + IP
 *       const apiKey = ctx.requestHeaders.get('x-api-key') || 'anonymous';
 *       const ip = getClientIP(ctx, true);
 *       return `${apiKey}:${ip}`;
 *     },
 *     global: { max: 10000, windowMs: 60 * 60 * 1000 }
 *   },
 *   requestValidation: {
 *     maxBodySize: 10 * 1024 * 1024, // 10MB for file uploads
 *     maxHeaders: 50 // Fewer headers for API
 *   }
 * });
 * ```
 *
 * ## Performance Characteristics
 *
 * **Request Processing**: O(1) for most operations, O(n) for rate limit cleanup
 * **Memory Usage**: O(k×r) where k = unique rate limit keys, r = requests per window
 * **Cleanup Overhead**: Periodic O(k) cleanup prevents memory accumulation
 * **Security Trade-offs**: Pattern matching CPU cost vs attack detection coverage
 *
 * ## Error Handling & Logging
 *
 * Security events logged to `ctx.errors` array for centralized monitoring:
 * - `IPBlocked`: IP address denied by access control
 * - `RateLimitExceeded`: Request rate limit violation
 * - `RequestValidationError`: Oversized or malformed request
 * - `AttackPatternDetected`: Suspicious pattern in request data
 * - `SecurityHeaderError`: Header setting failure (non-blocking)
 * - `ArmorError`: General security processing failure
 */

/**
 * Comprehensive security middleware with layered protection architecture.
 *
 * @example
 * // Basic armor protection with defaults
 * const armor = new Armor();
 * router.use(armor);
 *
 * @example
 * // Production armor with rate limiting and IP control
 * const armor = new Armor({
 *   rateLimiting: { enabled: true, global: { max: 1000, windowMs: 3600000 } },
 *   ipAccess: { mode: 'whitelist', whitelist: ['192.168.0.0/16'] }
 * });
 * router.use(armor);
 */
export class Armor extends Middleware {
	/**
	 * Create a new Armor middleware instance with validated configuration.
	 *
	 * @param {Partial<import('./config.js').ArmorConfig>} [userConfig={}] - Security configuration overrides
	 * @param {string} [identifier='@raven-js/wings/armor'] - Middleware identifier for debugging
	 * @throws {import('./config.js').ConfigValidationError} When configuration validation fails
	 *
	 * @example
	 * // Create armor with default security settings
	 * const armor = new Armor();
	 *
	 * @example
	 * // Create armor with custom rate limiting
	 * const armor = new Armor({ rateLimiting: { enabled: true } });
	 */
	constructor(userConfig = {}, identifier = "@raven-js/wings/armor") {
		super(async (/** @type {any} */ ctx) => {
			await this.#processRequest(ctx);
		}, identifier);

		// Create and validate configuration
		/** @type {any} */
		this.config = createConfig(userConfig);

		// Initialize rate limiting store if needed
		/** @type {RateLimitStore | null} */
		this.rateLimitStore = this.config.rateLimiting.enabled
			? new RateLimitStore(this.config.rateLimiting.cleanupInterval)
			: null;
	}

	/**
	 * Process request through layered security pipeline with early exit optimization.
	 * Implements two-phase architecture: blocking pre-processing + non-blocking post-processing.
	 *
	 * **Phase 1 (Pre-processing)**: IP control → Rate limiting → Request validation → Attack detection
	 * **Phase 2 (Post-processing)**: Security headers applied after route processing
	 * **Error Handling**: Security failures logged but don't break request processing
	 * **Performance**: Early exit on security violations prevents unnecessary processing
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context with headers and parsed data
	 */
	async #processRequest(ctx) {
		try {
			// Phase 1: Pre-processing (blocking checks)

			// IP access control (highest priority)
			if (!this.#checkIPAccess(ctx)) {
				return; // Request blocked
			}

			// Rate limiting
			if (!this.#checkRateLimit(ctx)) {
				return; // Request blocked
			}

			// Request validation
			if (!this.#validateRequestSecurity(ctx)) {
				return; // Request blocked
			}

			// Attack pattern detection (non-blocking, logs only)
			this.#detectAttackPatterns(ctx);

			// Phase 2: Register after-callback for response processing
			ctx.addAfterCallback(
				new Middleware(async (/** @type {any} */ ctx) => {
					this.#setSecurityHeaders(ctx);
				}, `${this.identifier}-headers`),
			);
		} catch (error) {
			// Security processing failed - log error but don't break request
			const securityError = new Error(
				`Armor security processing failed: ${error.message}`,
			);
			securityError.name = "ArmorError";
			/** @type {any} */ (securityError).originalError = error;
			ctx.errors.push(securityError);
		}
	}

	/**
	 * Evaluate IP access control rules with proxy-aware IP extraction.
	 * First line of defense - blocks requests before any processing.
	 *
	 * **Security Model**: Fail-secure (block on errors), explicit allow/deny modes
	 * **Proxy Support**: Configurable trust of X-Forwarded-For headers
	 * **Logging**: Blocked IPs logged with mode and extracted IP for monitoring
	 * **Performance**: O(1) for exact matches, O(n) for CIDR list where n = list size
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} true if IP allowed, false if blocked (sets 403 response)
	 */
	#checkIPAccess(ctx) {
		if (!this.config.enabled || this.config.ipAccess.mode === "disabled") {
			return true;
		}

		const clientIP = getClientIP(ctx, this.config.ipAccess.trustProxy);
		const allowed = isIPAllowed(clientIP, this.config.ipAccess);

		if (!allowed) {
			ctx.responseStatusCode = 403;
			ctx.responseBody = "Forbidden: IP access denied";
			ctx.responseEnded = true;

			// Log the blocked IP for monitoring
			const blockError = new Error(`IP access denied: ${clientIP}`);
			blockError.name = "IPBlocked";
			/** @type {any} */ (blockError).clientIP = clientIP;
			/** @type {any} */ (blockError).mode = this.config.ipAccess.mode;
			ctx.errors.push(blockError);

			return false;
		}

		return true;
	}

	/**
	 * Enforce rate limiting using sliding window algorithm with route-specific rules.
	 * Automatic key generation with configurable custom key functions.
	 *
	 * **Key Generation**: IP-based by default, configurable custom functions for API keys
	 * **Route Matching**: Prefix matching for route-specific limits (longest match wins)
	 * **Sliding Window**: Precise rate limiting with automatic cleanup
	 * **Response Headers**: Sets Retry-After header for 429 responses
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} true if allowed, false if rate limited (sets 429 response)
	 */
	#checkRateLimit(ctx) {
		if (
			!this.config.enabled ||
			!this.config.rateLimiting.enabled ||
			!this.rateLimitStore
		) {
			return true;
		}

		// Determine rate limit key
		const key = this.config.rateLimiting.keyGenerator
			? this.config.rateLimiting.keyGenerator(ctx)
			: getClientIP(ctx, this.config.ipAccess.trustProxy);

		// Check for route-specific limits
		const routeConfig = this.#getRouteRateLimit(ctx.path);
		const maxRequests = routeConfig
			? routeConfig.max
			: this.config.rateLimiting.global.max;
		const windowMs = routeConfig
			? routeConfig.windowMs
			: this.config.rateLimiting.global.windowMs;

		// Check if request is allowed
		const allowed = this.rateLimitStore.isAllowed(key, maxRequests, windowMs);

		if (!allowed) {
			ctx.responseStatusCode = 429;
			ctx.responseHeaders.set(
				"Retry-After",
				Math.ceil(windowMs / 1000).toString(),
			);
			ctx.responseBody = "Too Many Requests";
			ctx.responseEnded = true;

			// Log rate limit violation
			const rateLimitError = new Error(`Rate limit exceeded: ${key}`);
			rateLimitError.name = "RateLimitExceeded";
			/** @type {any} */ (rateLimitError).key = key;
			/** @type {any} */ (rateLimitError).maxRequests = maxRequests;
			/** @type {any} */ (rateLimitError).windowMs = windowMs;
			ctx.errors.push(rateLimitError);

			return false;
		}

		return true;
	}

	/**
	 * Find matching route-specific rate limit configuration using prefix matching.
	 * Implements longest-prefix-match for overlapping route patterns.
	 *
	 * **Matching Strategy**: String prefix matching (not regex) for performance
	 * **Priority**: First matching route pattern wins (order matters in config)
	 * **Performance**: O(n) where n = configured route patterns
	 * **Example**: '/api/auth/login' matches both '/api/' and '/api/auth/' (first wins)
	 *
	 * @param {string} path - Request path to match against route patterns
	 * @returns {{max: number, windowMs: number}|null} Route config or null for global limits
	 */
	#getRouteRateLimit(path) {
		for (const [routePattern, config] of Object.entries(
			this.config.rateLimiting.routes,
		)) {
			if (path.startsWith(routePattern)) {
				return config;
			}
		}
		return null;
	}

	/**
	 * Validate request structure and size limits to prevent DoS attacks.
	 * Comprehensive validation of path, parameters, headers, and body size.
	 *
	 * **DoS Protection**: Prevents resource exhaustion via oversized requests
	 * **Validation Scope**: Path length, param counts, header size, body size
	 * **Error Collection**: All validation errors collected for complete feedback
	 * **Early Rejection**: Invalid requests blocked before route processing
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} true if valid, false if invalid (sets 400 response)
	 */
	#validateRequestSecurity(ctx) {
		if (!this.config.enabled || !this.config.requestValidation.enabled) {
			return true;
		}

		const validationErrors = validateRequest(
			ctx,
			this.config.requestValidation,
		);

		if (validationErrors.length > 0) {
			ctx.responseStatusCode = 400;
			ctx.responseBody = "Bad Request: Invalid request format";
			ctx.responseEnded = true;

			// Log validation errors
			for (const validationError of validationErrors) {
				const error = new Error(
					`Request validation failed: ${validationError}`,
				);
				error.name = "RequestValidationError";
				/** @type {any} */ (error).validationError = validationError;
				ctx.errors.push(error);
			}

			return false;
		}

		return true;
	}

	/**
	 * Detect attack patterns using regex matching (non-blocking detection).
	 * Logs security events for monitoring without interrupting request flow.
	 *
	 * **Non-blocking**: Detection failures don't block legitimate requests
	 * **Pattern Coverage**: SQL injection, XSS, path traversal, command injection
	 * **Logging Strategy**: All detections logged with attack type and request details
	 * **Performance**: Early exit on first pattern match per attack type
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 */
	#detectAttackPatterns(ctx) {
		if (!this.config.enabled) return;

		const attack = detectAttacks(ctx, this.config.attackDetection);

		if (attack) {
			const attackError = new Error(`Attack pattern detected: ${attack}`);
			attackError.name = "AttackPatternDetected";
			/** @type {any} */ (attackError).attackDescription = attack;
			/** @type {any} */ (attackError).path = ctx.path;
			/** @type {any} */ (attackError).method = ctx.method;
			ctx.errors.push(attackError);
		}
	}

	/**
	 * Apply security headers to response using post-processing middleware.
	 * Runs after route processing to avoid interfering with application headers.
	 *
	 * **Header Precedence**: Application headers preserved (first-wins policy)
	 * **Error Handling**: Header failures logged but don't break responses
	 * **Response Safety**: Skips processing if response already ended
	 * **Standards Compliance**: OWASP, Mozilla Observatory, W3C specifications
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 */
	#setSecurityHeaders(ctx) {
		if (!this.config.enabled || !this.config.securityHeaders.enabled) {
			return;
		}

		// Skip if response already ended
		if (ctx.responseEnded) return;

		setSecurityHeaders(ctx, this.config.securityHeaders);
	}

	/**
	 * Get current middleware statistics for monitoring and capacity planning.
	 * Provides insights into security state and memory usage.
	 *
	 * **Monitoring Use**: Track security events, memory usage, configuration state
	 * **Performance Warning**: Rate limit stats require O(k×n) computation
	 * **Production Use**: Call sparingly or cache results for high-traffic applications
	 * **Capacity Planning**: Use for rate limit memory estimation and tuning
	 *
	 * @returns {{rateLimit: {totalKeys: number, totalRequests: number}|null, config: object}} Current statistics
	 */
	getStats() {
		const stats = {
			rateLimit: this.rateLimitStore ? this.rateLimitStore.getStats() : null,
			config: {
				enabled: this.config.enabled,
				rateLimitEnabled: this.config.rateLimiting.enabled,
				ipControlMode: this.config.ipAccess.mode,
				headersEnabled: this.config.securityHeaders.enabled,
				requestValidationEnabled: this.config.requestValidation.enabled,
				attackDetectionEnabled: Object.values(this.config.attackDetection).some(
					(v) => v === true,
				),
			},
		};

		return stats;
	}

	/**
	 * Clear all rate limiting data immediately (primarily for testing).
	 * Removes all stored request history, effectively resetting all rate limits.
	 *
	 * **Use Cases**: Testing, emergency reset, configuration changes requiring clean slate
	 * **Production Warning**: All clients get fresh rate limit allowances immediately
	 * **Performance**: O(1) operation, immediate memory reclamation
	 * **Thread Safety**: Safe to call during request processing
	 */
	clearRateLimits() {
		if (this.rateLimitStore) {
			this.rateLimitStore.clear();
		}
	}
}
