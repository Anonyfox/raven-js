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
 * @packageDocumentation
 *
 * Armor - Comprehensive web application security middleware
 * A production-ready security middleware that combines multiple protection layers
 * into a single, efficient component. Designed to provide enterprise-grade security
 * while maintaining the Wings philosophy of simplicity and reliability.
 * The middleware operates in two phases:
 * 1. **Pre-processing**: Rate limiting, IP filtering, request validation (early exit)
 * 2. **Post-processing**: Security headers, response validation (after callbacks)
 * ## Security Layers
 * ### HTTP Security Headers
 * Implements a comprehensive set of security headers including CSP, HSTS,
 * X-Frame-Options, and modern headers like Cross-Origin-Embedder-Policy.
 * Headers are only set if not already present (respects other middleware).
 * ### Rate Limiting
 * Memory-efficient sliding window rate limiting with per-route configuration.
 * Automatically cleans up expired entries to prevent memory leaks.
 * Supports custom key generation for advanced use cases.
 * ### IP Access Control
 * Supports both whitelist and blacklist modes with CIDR notation.
 * Properly handles proxy headers when configured to trust them.
 * Efficient IP matching using optimized algorithms.
 * ### Request Validation
 * Validates request size, structure, and content to prevent various attacks.
 * Includes protection against oversized requests, parameter pollution,
 * and malformed headers.
 * ### Attack Pattern Detection
 * Basic detection of common attack patterns including SQL injection
 * and suspicious request patterns. Logs detected attacks for monitoring.
 * ```javascript
 * const armor = new Armor();
 * router.use(armor);
 * // Provides:
 * // - Standard security headers
 * // - Rate limiting (100 req/15min)
 * // - Request validation
 * // - Attack pattern detection
 * ```
 * ```javascript
 * const armor = new Armor({
 * rateLimiting: {
 * global: { max: 60, windowMs: 60 * 1000 }, // 1 minute windows
 * routes: {
 * '/api/auth/': { max: 5, windowMs: 15 * 60 * 1000 }
 * }
 * },
 * securityHeaders: {
 * hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
 * contentSecurityPolicy: {
 * directives: {
 * defaultSrc: ["'none'"],
 * scriptSrc: ["'self'"],
 * connectSrc: ["'self'", "https://api.trusted.com"]
 * }
 * }
 * },
 * ipAccess: {
 * mode: 'whitelist',
 * whitelist: ['192.168.1.0/24', '10.0.0.0/8'],
 * trustProxy: true
 * }
 * });
 * ```
 * ```javascript
 * const armor = new Armor({
 * securityHeaders: {
 * contentSecurityPolicy: false, // Disable CSP for dev tools
 * hsts: false // No HTTPS requirement in development
 * },
 * rateLimiting: {
 * global: { max: 10000 } // Very high limit for development
 * },
 * attackDetection: {
 * sqlInjection: false, // Disable for testing
 * suspiciousPatterns: false
 * }
 * });
 * ```
 */
export class Armor extends Middleware {
	/**
	 * Create a new Armor middleware instance
	 *
	 * @param {Object} [userConfig={}] - Security configuration options
	 * @param {string} [identifier='@raven-js/wings/armor'] - Middleware identifier
	 * @throws {Error} When configuration is invalid
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
	 * Process incoming request through all security layers
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
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
	 * Check IP access control
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} True if IP is allowed
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
	 * Check rate limiting
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} True if request is allowed
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
	 * Get route-specific rate limit configuration
	 *
	 * @param {string} path - Request path
	 * @returns {any | null} Route rate limit config or null
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
	 * Validate request for security issues
	 *
	 * @param {import('../../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} True if request is valid
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
	 * Detect attack patterns in request (non-blocking)
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
	 * Set security headers on response
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
	 * Get current middleware statistics for monitoring
	 *
	 * @returns {Object} Current statistics
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
	 * Clear all rate limit data (useful for testing)
	 */
	clearRateLimits() {
		if (this.rateLimitStore) {
			this.rateLimitStore.clear();
		}
	}
}
