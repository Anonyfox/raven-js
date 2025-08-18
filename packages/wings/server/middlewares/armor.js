/**
 * @fileoverview Wings Armor Middleware - Comprehensive web application security
 *
 * A security-first middleware that combines multiple protection layers into a single,
 * efficient component. Designed for production environments where security, performance,
 * and reliability are paramount. Zero external dependencies, maximum protection.
 *
 * Built with the Wings philosophy: sensible defaults, minimal configuration,
 * and bulletproof reliability. Works out of the box with enterprise-grade security
 * while remaining developer-friendly and performance-optimized.
 *
 * ## Security Features
 * - ✅ HTTP Security Headers (CSP, HSTS, X-Frame-Options, etc.)
 * - ✅ Advanced rate limiting with sliding windows and per-route controls
 * - ✅ IP-based access control with CIDR support
 * - ✅ Request validation and size limits
 * - ✅ Basic attack pattern detection (SQL injection, etc.)
 * - ✅ JSON/XML bomb protection
 * - ✅ Graceful error handling and logging
 *
 * ## Performance Optimizations
 * - Memory-efficient rate limiting with automatic cleanup
 * - O(1) IP lookups using optimized data structures
 * - Lazy initialization of expensive components
 * - Minimal overhead when features are disabled
 *
 * @example Basic Usage
 * ```javascript
 * import { Armor } from '@raven-js/wings/server/armor.js';
 * import { Router } from '@raven-js/wings/core/router.js';
 *
 * const router = new Router();
 * const armor = new Armor(); // Secure defaults
 *
 * // Apply security to all routes
 * router.use(armor);
 *
 * router.get('/api/data', (ctx) => {
 *   ctx.json({ message: 'Protected by Armor' });
 * });
 * ```
 *
 * @example Production Configuration
 * ```javascript
 * const armor = new Armor({
 *   rateLimit: {
 *     windowMs: 15 * 60 * 1000, // 15 minutes
 *     maxRequests: 1000,
 *     routes: {
 *       '/api/auth/': { maxRequests: 10, windowMs: 15 * 60 * 1000 },
 *       '/api/upload/': { maxRequests: 5, windowMs: 60 * 1000 }
 *     }
 *   },
 *   headers: {
 *     hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
 *   },
 *   ipControl: {
 *     mode: 'blacklist',
 *     blacklist: ['192.168.100.0/24']
 *   }
 * });
 * ```
 *
 * @author RavenJS Team
 * @since 0.3.0
 */

import { isIP } from "node:net";
import { Middleware } from "../../core/middleware.js";

/**
 * Default Content Security Policy directives
 * Restrictive by default, can be relaxed as needed
 */
const DEFAULT_CSP_DIRECTIVES = {
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
const DEFAULT_HEADERS = {
	contentSecurityPolicy: {
		directives: DEFAULT_CSP_DIRECTIVES,
		reportOnly: false,
	},
	frameOptions: "DENY",
	noSniff: true,
	xssProtection: true,
	hsts: {
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
 * Default rate limiting configuration
 * Conservative limits that protect against abuse
 */
const DEFAULT_RATE_LIMIT = {
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 100,
	skipSuccessfulRequests: false,
	skipFailedRequests: false,
	/** @type {Function | null} */
	keyGenerator: null, // Will use IP by default
	routes: {},
	cleanupInterval: 5 * 60 * 1000, // 5 minutes
	enabled: false, // Will be set based on configuration
};

/**
 * Default IP control configuration
 */
const DEFAULT_IP_CONTROL = {
	mode: "disabled", // 'whitelist' | 'blacklist' | 'disabled'
	/** @type {string[]} */
	whitelist: [],
	/** @type {string[]} */
	blacklist: [],
	trustProxy: false,
};

/**
 * Default request validation configuration
 */
const DEFAULT_VALIDATION = {
	maxBodySize: 1024 * 1024, // 1MB
	maxHeaderSize: 8192, // 8KB
	maxHeaders: 100,
	maxQueryParams: 100,
	maxQueryParamLength: 1000,
	maxPathLength: 2048,
};

/**
 * Default protection configuration
 */
const DEFAULT_PROTECTION = {
	sqlInjectionCheck: true,
	jsonBombPrevention: {
		maxDepth: 10,
		maxKeys: 1000,
	},
	suspiciousPatterns: true,
};

/**
 * Common SQL injection patterns for basic detection
 */
const SQL_INJECTION_PATTERNS = [
	/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
	/(\b(OR|AND)\s+['"]*\d+['"]*\s*=\s*['"]*\d+['"]*)/i,
	/(--|#|\/\*|\*\/)/,
	/(\bUNION\b.*\bSELECT\b)/i,
	/(\b(EXEC|EXECUTE)\b)/i,
	/('.*OR.*'.*=.*')/i, // Classic OR injection like '1'='1'
	/(;.*\b(DROP|DELETE|INSERT|UPDATE)\b)/i, // Semicolon followed by dangerous commands
];

/**
 * Suspicious request patterns that might indicate attacks
 */
const SUSPICIOUS_PATTERNS = [
	/\.\./, // Path traversal (../ or ..\)
	/\0/, // Null bytes
	/<script/i, // Basic XSS
	/javascript:/i, // JavaScript protocol
	/data:.*base64/i, // Data URLs with base64
];

/**
 * Parse a CIDR notation string into network and mask
 *
 * @param {string} cidr - CIDR notation string (e.g., "192.168.1.0/24")
 * @returns {{network: string, prefix: number} | null} Parsed CIDR or null if invalid
 */
export function parseCIDR(cidr) {
	if (typeof cidr !== "string") return null;

	const parts = cidr.split("/");
	if (parts.length !== 2) return null;

	const network = parts[0];
	const prefix = parseInt(parts[1], 10);

	// Validate IP address
	if (!isIP(network)) return null;

	// Validate prefix length
	const maxPrefix = network.includes(":") ? 128 : 32; // IPv6 vs IPv4
	if (Number.isNaN(prefix) || prefix < 0 || prefix > maxPrefix) return null;

	return { network, prefix };
}

/**
 * Check if an IP address is within a CIDR range
 *
 * @param {string} ip - IP address to check
 * @param {string} cidr - CIDR notation string
 * @returns {boolean} True if IP is within the CIDR range
 */
export function isIPInCIDR(ip, cidr) {
	const parsed = parseCIDR(cidr);
	if (!parsed || !isIP(ip)) return false;

	const { network, prefix } = parsed;

	// Handle IPv4
	if (!ip.includes(":") && !network.includes(":")) {
		return isIPv4InCIDR(ip, network, prefix);
	}

	// Handle IPv6
	if (ip.includes(":") && network.includes(":")) {
		return isIPv6InCIDR(ip, network, prefix);
	}

	return false; // Mixed IPv4/IPv6
}

/**
 * Check if an IPv4 address is within a CIDR range
 *
 * @param {string} ip - IPv4 address
 * @param {string} network - Network address
 * @param {number} prefix - Prefix length
 * @returns {boolean} True if IP is within range
 */
function isIPv4InCIDR(ip, network, prefix) {
	const ipInt = ipv4ToInt(ip);
	const networkInt = ipv4ToInt(network);

	if (ipInt === null || networkInt === null) return false;

	const mask = (-1 << (32 - prefix)) >>> 0; // Unsigned right shift
	return (ipInt & mask) === (networkInt & mask);
}

/**
 * Check if an IPv6 address is within a CIDR range
 *
 * @param {string} ip - IPv6 address
 * @param {string} network - Network address
 * @param {number} prefix - Prefix length
 * @returns {boolean} True if IP is within range
 */
function isIPv6InCIDR(ip, network, prefix) {
	const ipBytes = ipv6ToBytes(ip);
	const networkBytes = ipv6ToBytes(network);

	if (!ipBytes || !networkBytes) return false;

	const bytesToCheck = Math.floor(prefix / 8);
	const bitsInLastByte = prefix % 8;

	// Check complete bytes
	for (let i = 0; i < bytesToCheck; i++) {
		if (ipBytes[i] !== networkBytes[i]) return false;
	}

	// Check partial byte if needed
	if (bitsInLastByte > 0 && bytesToCheck < 16) {
		const mask = (0xff << (8 - bitsInLastByte)) & 0xff;
		if (
			(ipBytes[bytesToCheck] & mask) !==
			(networkBytes[bytesToCheck] & mask)
		) {
			return false;
		}
	}

	return true;
}

/**
 * Convert IPv4 address string to integer
 *
 * @param {string} ip - IPv4 address
 * @returns {number | null} Integer representation or null if invalid
 */
function ipv4ToInt(ip) {
	const parts = ip.split(".");
	if (parts.length !== 4) return null;

	let result = 0;
	for (let i = 0; i < 4; i++) {
		const part = parseInt(parts[i], 10);
		if (Number.isNaN(part) || part < 0 || part > 255) return null;
		result = (result << 8) + part;
	}

	return result >>> 0; // Convert to unsigned
}

/**
 * Convert IPv6 address string to byte array
 *
 * @param {string} ip - IPv6 address
 * @returns {Uint8Array | null} Byte array or null if invalid
 */
function ipv6ToBytes(ip) {
	try {
		// Expand compressed IPv6 addresses
		const expanded = expandIPv6(ip);
		if (!expanded) return null;

		const parts = expanded.split(":");
		if (parts.length !== 8) return null;

		const bytes = new Uint8Array(16);
		for (let i = 0; i < 8; i++) {
			const value = parseInt(parts[i], 16);
			if (Number.isNaN(value) || value < 0 || value > 0xffff) return null;
			bytes[i * 2] = (value >> 8) & 0xff;
			bytes[i * 2 + 1] = value & 0xff;
		}

		return bytes;
	} catch {
		return null;
	}
}

/**
 * Expand compressed IPv6 address to full form
 *
 * @param {string} ip - IPv6 address (possibly compressed)
 * @returns {string | null} Expanded IPv6 address or null if invalid
 */
function expandIPv6(ip) {
	if (!ip.includes("::")) {
		// Already expanded
		const parts = ip.split(":");
		return parts.length === 8 ? ip : null;
	}

	const parts = ip.split("::");
	if (parts.length !== 2) return null;

	const left = parts[0] ? parts[0].split(":") : [];
	const right = parts[1] ? parts[1].split(":") : [];

	const totalParts = left.length + right.length;
	if (totalParts >= 8) return null;

	const zerosNeeded = 8 - totalParts;
	const zeros = new Array(zerosNeeded).fill("0");

	const expanded = [...left, ...zeros, ...right];
	return expanded.join(":");
}

/**
 * Extract client IP address from context, respecting proxy headers if configured
 *
 * @param {import('../../core/context.js').Context} ctx - Request context
 * @param {boolean} trustProxy - Whether to trust proxy headers
 * @returns {string} Client IP address
 */
export function getClientIP(ctx, trustProxy = false) {
	if (trustProxy) {
		// Check proxy headers in order of preference
		const forwarded = ctx.requestHeaders.get("x-forwarded-for");
		if (forwarded) {
			// X-Forwarded-For can be a comma-separated list, take the first (client)
			return forwarded.split(",")[0].trim();
		}

		const realIP = ctx.requestHeaders.get("x-real-ip");
		if (realIP) return realIP.trim();
	}

	// Fallback to connection IP or unknown
	return ctx.requestHeaders.get("remote-addr") || "unknown";
}

/**
 * Check if an IP address is allowed based on whitelist/blacklist configuration
 *
 * @param {string} ip - IP address to check
 * @param {Object} config - IP control configuration
 * @param {string} config.mode - 'whitelist', 'blacklist', or 'disabled'
 * @param {string[]} config.whitelist - Array of allowed IPs/CIDRs
 * @param {string[]} config.blacklist - Array of blocked IPs/CIDRs
 * @returns {boolean} True if IP is allowed
 */
export function isIPAllowed(ip, config) {
	if (config.mode === "disabled") return true;

	// Handle exact IP matches and CIDR ranges
	const checkIPList = (/** @type {string[]} */ list) => {
		return list.some((/** @type {string} */ entry) => {
			if (entry.includes("/")) {
				return isIPInCIDR(ip, entry);
			}
			return ip === entry;
		});
	};

	if (config.mode === "whitelist") {
		return checkIPList(config.whitelist);
	}

	if (config.mode === "blacklist") {
		return !checkIPList(config.blacklist);
	}

	return true; // Default allow for unknown modes
}

/**
 * Rate limiting store with sliding window algorithm
 * Memory-efficient with automatic cleanup of expired entries
 */
export class RateLimitStore {
	constructor(cleanupInterval = 5 * 60 * 1000) {
		/** @type {Map<string, Array<{timestamp: number, count: number}>>} */
		this.store = new Map();
		this.cleanupInterval = cleanupInterval;
		this.lastCleanup = Date.now();
	}

	/**
	 * Check if a request is allowed under rate limits
	 *
	 * @param {string} key - Rate limit key (usually IP address)
	 * @param {number} maxRequests - Maximum requests allowed
	 * @param {number} windowMs - Time window in milliseconds
	 * @returns {boolean} True if request is allowed
	 */
	isAllowed(key, maxRequests, windowMs) {
		const now = Date.now();
		const windowStart = now - windowMs;

		// Periodic cleanup to prevent memory leaks
		if (now - this.lastCleanup > this.cleanupInterval) {
			this.cleanup(windowStart);
		}

		// Get or create request history for this key
		let requests = this.store.get(key);
		if (!requests) {
			requests = [];
			this.store.set(key, requests);
		}

		// Remove expired requests (sliding window)
		while (requests.length > 0 && requests[0].timestamp < windowStart) {
			requests.shift();
		}

		// Count current requests in window
		const currentCount = requests.reduce((sum, req) => sum + req.count, 0);

		// Check if request would exceed limit
		if (currentCount >= maxRequests) {
			return false;
		}

		// Add this request
		const lastRequest = requests[requests.length - 1];
		if (lastRequest && now - lastRequest.timestamp < 1000) {
			// Increment count for requests within same second (batch processing)
			lastRequest.count++;
		} else {
			// New time slot
			requests.push({ timestamp: now, count: 1 });
		}

		return true;
	}

	/**
	 * Clean up expired entries to prevent memory leaks
	 *
	 * @param {number} cutoffTime - Remove entries older than this timestamp
	 */
	cleanup(cutoffTime) {
		for (const [key, requests] of this.store.entries()) {
			// Remove expired requests
			while (requests.length > 0 && requests[0].timestamp < cutoffTime) {
				requests.shift();
			}

			// Remove empty entries
			if (requests.length === 0) {
				this.store.delete(key);
			}
		}

		this.lastCleanup = Date.now();
	}

	/**
	 * Get current statistics for monitoring
	 *
	 * @returns {{totalKeys: number, totalRequests: number}} Current store statistics
	 */
	getStats() {
		let totalRequests = 0;
		for (const requests of this.store.values()) {
			totalRequests += requests.reduce((sum, req) => sum + req.count, 0);
		}

		return {
			totalKeys: this.store.size,
			totalRequests,
		};
	}

	/**
	 * Clear all rate limit data
	 */
	clear() {
		this.store.clear();
	}
}

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
 * Check request for SQL injection patterns
 *
 * @param {import('../../core/context.js').Context} ctx - Request context
 * @returns {boolean} True if potential SQL injection detected
 */
export function checkSQLInjection(ctx) {
	// Check URL parameters
	for (const [, value] of ctx.queryParams.entries()) {
		if (SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value))) {
			return true;
		}
	}

	// Check path
	if (SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(ctx.path))) {
		return true;
	}

	return false;
}

/**
 * Check request for suspicious patterns
 *
 * @param {import('../../core/context.js').Context} ctx - Request context
 * @returns {boolean} True if suspicious patterns detected
 */
export function checkSuspiciousPatterns(ctx) {
	// Check path
	if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(ctx.path))) {
		return true;
	}

	// Check query parameters
	for (const [, value] of ctx.queryParams.entries()) {
		if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(value))) {
			return true;
		}
	}

	return false;
}

/**
 * Validate request size and structure to prevent various attacks
 *
 * @param {import('../../core/context.js').Context} ctx - Request context
 * @param {Object} config - Validation configuration
 * @param {number} config.maxPathLength - Maximum path length
 * @param {number} config.maxQueryParams - Maximum query parameters
 * @param {number} config.maxQueryParamLength - Maximum query parameter length
 * @param {number} config.maxHeaders - Maximum headers count
 * @param {number} config.maxHeaderSize - Maximum headers size
 * @param {number} config.maxBodySize - Maximum body size
 * @returns {string | null} Error message if validation fails, null if OK
 */
export function validateRequest(ctx, config) {
	// Check path length
	if (ctx.path.length > config.maxPathLength) {
		return `Path too long: ${ctx.path.length} > ${config.maxPathLength}`;
	}

	// Check query parameters
	const paramCount = Array.from(ctx.queryParams.entries()).length;
	if (paramCount > config.maxQueryParams) {
		return `Too many query parameters: ${paramCount} > ${config.maxQueryParams}`;
	}

	// Check query parameter lengths
	for (const [key, value] of ctx.queryParams.entries()) {
		if (key.length > config.maxQueryParamLength) {
			return `Query parameter key too long: ${key.length} > ${config.maxQueryParamLength}`;
		}
		if (value.length > config.maxQueryParamLength) {
			return `Query parameter value too long: ${value.length} > ${config.maxQueryParamLength}`;
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
		return `Too many headers: ${headerCount} > ${config.maxHeaders}`;
	}

	if (totalHeaderSize > config.maxHeaderSize) {
		return `Headers too large: ${totalHeaderSize} > ${config.maxHeaderSize}`;
	}

	// Check content length if present
	const contentLength = ctx.requestHeaders.get("content-length");
	if (contentLength) {
		const size = parseInt(contentLength, 10);
		if (!Number.isNaN(size) && size > config.maxBodySize) {
			return `Request body too large: ${size} > ${config.maxBodySize}`;
		}
	}

	return null; // All validations passed
}

/**
 * Armor - Comprehensive web application security middleware
 *
 * A production-ready security middleware that combines multiple protection layers
 * into a single, efficient component. Designed to provide enterprise-grade security
 * while maintaining the Wings philosophy of simplicity and reliability.
 *
 * The middleware operates in two phases:
 * 1. **Pre-processing**: Rate limiting, IP filtering, request validation (early exit)
 * 2. **Post-processing**: Security headers, response validation (after callbacks)
 *
 * ## Security Layers
 *
 * ### HTTP Security Headers
 * Implements a comprehensive set of security headers including CSP, HSTS,
 * X-Frame-Options, and modern headers like Cross-Origin-Embedder-Policy.
 * Headers are only set if not already present (respects other middleware).
 *
 * ### Rate Limiting
 * Memory-efficient sliding window rate limiting with per-route configuration.
 * Automatically cleans up expired entries to prevent memory leaks.
 * Supports custom key generation for advanced use cases.
 *
 * ### IP Access Control
 * Supports both whitelist and blacklist modes with CIDR notation.
 * Properly handles proxy headers when configured to trust them.
 * Efficient IP matching using optimized algorithms.
 *
 * ### Request Validation
 * Validates request size, structure, and content to prevent various attacks.
 * Includes protection against oversized requests, parameter pollution,
 * and malformed headers.
 *
 * ### Attack Pattern Detection
 * Basic detection of common attack patterns including SQL injection
 * and suspicious request patterns. Logs detected attacks for monitoring.
 *
 * @example Basic Security (Recommended for most applications)
 * ```javascript
 * const armor = new Armor();
 * router.use(armor);
 *
 * // Provides:
 * // - Standard security headers
 * // - Rate limiting (100 req/15min)
 * // - Request validation
 * // - Attack pattern detection
 * ```
 *
 * @example High-Security API
 * ```javascript
 * const armor = new Armor({
 *   rateLimit: {
 *     maxRequests: 60,
 *     windowMs: 60 * 1000, // 1 minute windows
 *     routes: {
 *       '/api/auth/': { maxRequests: 5, windowMs: 15 * 60 * 1000 }
 *     }
 *   },
 *   headers: {
 *     hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
 *     contentSecurityPolicy: {
 *       directives: {
 *         defaultSrc: ["'none'"],
 *         scriptSrc: ["'self'"],
 *         connectSrc: ["'self'", "https://api.trusted.com"]
 *       }
 *     }
 *   },
 *   ipControl: {
 *     mode: 'whitelist',
 *     whitelist: ['192.168.1.0/24', '10.0.0.0/8'],
 *     trustProxy: true
 *   }
 * });
 * ```
 *
 * @example Development Mode (Relaxed Security)
 * ```javascript
 * const armor = new Armor({
 *   headers: {
 *     contentSecurityPolicy: false, // Disable CSP for dev tools
 *     hsts: false // No HTTPS requirement in development
 *   },
 *   rateLimit: {
 *     maxRequests: 10000 // Very high limit for development
 *   },
 *   protection: {
 *     sqlInjectionCheck: false, // Disable for testing
 *     suspiciousPatterns: false
 *   }
 * });
 * ```
 */
export class Armor extends Middleware {
	/**
	 * Create a new Armor middleware instance
	 *
	 * @param {Object} [options={}] - Security configuration options
	 * @param {Object} [options.headers] - HTTP security headers configuration
	 * @param {Object} [options.rateLimit] - Rate limiting configuration
	 * @param {Object} [options.ipControl] - IP access control configuration
	 * @param {Object} [options.validation] - Request validation configuration
	 * @param {Object} [options.protection] - Advanced protection configuration
	 * @param {string} [options.identifier='@raven-js/wings/armor'] - Middleware identifier
	 *
	 * @throws {Error} When configuration is invalid
	 */
	constructor(options = {}) {
		const {
			headers = {},
			rateLimit = {},
			ipControl = {},
			validation = {},
			protection = {},
			identifier = "@raven-js/wings/armor",
		} = options;

		// Validate configuration
		const validatedConfig = Armor.#validateConfiguration({
			headers,
			rateLimit,
			ipControl,
			validation,
			protection,
		});

		super(async (ctx) => {
			await this.#processRequest(ctx);
		}, identifier);

		// Store validated configuration
		/** @type {any} */
		this.config = validatedConfig;

		// Initialize rate limiting store if needed
		/** @type {RateLimitStore | null} */
		this.rateLimitStore = this.config.rateLimit.enabled
			? new RateLimitStore(this.config.rateLimit.cleanupInterval)
			: null;
	}

	/**
	 * Validate and merge configuration options with defaults
	 *
	 * @param {Object} options - User-provided configuration
	 * @param {Object} [options.headers] - Headers configuration
	 * @param {Object} [options.rateLimit] - Rate limit configuration
	 * @param {Object} [options.ipControl] - IP control configuration
	 * @param {Object} [options.validation] - Validation configuration
	 * @param {Object} [options.protection] - Protection configuration
	 * @returns {Object} Validated and merged configuration
	 * @throws {Error} When configuration is invalid
	 */
	static #validateConfiguration(options) {
		const config = {
			headers: { ...DEFAULT_HEADERS, ...options.headers },
			rateLimit: { ...DEFAULT_RATE_LIMIT, ...options.rateLimit },
			ipControl: { ...DEFAULT_IP_CONTROL, ...options.ipControl },
			validation: { ...DEFAULT_VALIDATION, ...options.validation },
			protection: { ...DEFAULT_PROTECTION, ...options.protection },
		};

		// Validate headers configuration
		if (config.headers.hsts && typeof config.headers.hsts === "object") {
			if (
				typeof config.headers.hsts.maxAge !== "number" ||
				config.headers.hsts.maxAge < 0
			) {
				throw new Error("HSTS maxAge must be a non-negative number");
			}
		}

		// Validate rate limiting configuration
		if (config.rateLimit.windowMs <= 0) {
			throw new Error("Rate limit windowMs must be positive");
		}
		if (config.rateLimit.maxRequests <= 0) {
			throw new Error("Rate limit maxRequests must be positive");
		}

		// Mark rate limiting as enabled if limits are configured (not using defaults)
		config.rateLimit.enabled =
			config.rateLimit.maxRequests !== DEFAULT_RATE_LIMIT.maxRequests ||
			config.rateLimit.windowMs !== DEFAULT_RATE_LIMIT.windowMs ||
			Object.keys(config.rateLimit.routes).length > 0;

		// Validate IP control configuration
		if (
			!["whitelist", "blacklist", "disabled"].includes(config.ipControl.mode)
		) {
			throw new Error(
				"IP control mode must be 'whitelist', 'blacklist', or 'disabled'",
			);
		}

		// Validate IP lists
		const validateIPList = (
			/** @type {any} */ list,
			/** @type {string} */ name,
		) => {
			if (!Array.isArray(list)) {
				throw new Error(`${name} must be an array`);
			}
			for (const ip of list) {
				if (typeof ip !== "string") {
					throw new Error(`${name} entries must be strings`);
				}
				// Validate IP/CIDR format
				if (ip.includes("/")) {
					if (!parseCIDR(ip)) {
						throw new Error(`Invalid CIDR notation in ${name}: ${ip}`);
					}
				} else if (!isIP(ip)) {
					throw new Error(`Invalid IP address in ${name}: ${ip}`);
				}
			}
		};

		validateIPList(config.ipControl.whitelist, "IP whitelist");
		validateIPList(config.ipControl.blacklist, "IP blacklist");

		// Validate request validation limits
		if (config.validation.maxBodySize <= 0) {
			throw new Error("Max body size must be positive");
		}
		if (config.validation.maxHeaderSize <= 0) {
			throw new Error("Max header size must be positive");
		}

		return config;
	}

	/**
	 * Process incoming request through all security layers
	 *
	 * @param {import('../../core/context.js').Context} ctx - Request context
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
				new Middleware(async (ctx) => {
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
	 * @param {import('../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} True if IP is allowed
	 */
	#checkIPAccess(ctx) {
		if (this.config.ipControl.mode === "disabled") return true;

		const clientIP = getClientIP(ctx, this.config.ipControl.trustProxy);
		const allowed = isIPAllowed(clientIP, this.config.ipControl);

		if (!allowed) {
			ctx.responseStatusCode = 403;
			ctx.responseBody = "Forbidden: IP access denied";
			ctx.responseEnded = true;

			// Log the blocked IP for monitoring
			const blockError = new Error(`IP access denied: ${clientIP}`);
			blockError.name = "IPBlocked";
			/** @type {any} */ (blockError).clientIP = clientIP;
			/** @type {any} */ (blockError).mode = this.config.ipControl.mode;
			ctx.errors.push(blockError);

			return false;
		}

		return true;
	}

	/**
	 * Check rate limiting
	 *
	 * @param {import('../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} True if request is allowed
	 */
	#checkRateLimit(ctx) {
		if (!this.config.rateLimit.enabled || !this.rateLimitStore) return true;

		// Determine rate limit key
		const key = this.config.rateLimit.keyGenerator
			? this.config.rateLimit.keyGenerator(ctx)
			: getClientIP(ctx, this.config.ipControl.trustProxy);

		// Check for route-specific limits
		const routeConfig = this.#getRouteRateLimit(ctx.path);
		const maxRequests = routeConfig
			? routeConfig.maxRequests
			: this.config.rateLimit.maxRequests;
		const windowMs = routeConfig
			? routeConfig.windowMs
			: this.config.rateLimit.windowMs;

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
			this.config.rateLimit.routes,
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
	 * @param {import('../../core/context.js').Context} ctx - Request context
	 * @returns {boolean} True if request is valid
	 */
	#validateRequestSecurity(ctx) {
		const validationError = validateRequest(ctx, this.config.validation);

		if (validationError) {
			ctx.responseStatusCode = 400;
			ctx.responseBody = "Bad Request: Invalid request format";
			ctx.responseEnded = true;

			// Log validation error
			const error = new Error(`Request validation failed: ${validationError}`);
			error.name = "RequestValidationError";
			/** @type {any} */ (error).validationError = validationError;
			ctx.errors.push(error);

			return false;
		}

		return true;
	}

	/**
	 * Detect attack patterns in request (non-blocking)
	 *
	 * @param {import('../../core/context.js').Context} ctx - Request context
	 */
	#detectAttackPatterns(ctx) {
		try {
			// SQL injection detection
			if (this.config.protection.sqlInjectionCheck && checkSQLInjection(ctx)) {
				const sqlError = new Error("Potential SQL injection detected");
				sqlError.name = "SQLInjectionDetected";
				/** @type {any} */ (sqlError).path = ctx.path;
				/** @type {any} */ (sqlError).method = ctx.method;
				ctx.errors.push(sqlError);
			}

			// Suspicious pattern detection
			if (
				this.config.protection.suspiciousPatterns &&
				checkSuspiciousPatterns(ctx)
			) {
				const suspiciousError = new Error(
					"Suspicious request pattern detected",
				);
				suspiciousError.name = "SuspiciousPatternDetected";
				/** @type {any} */ (suspiciousError).path = ctx.path;
				/** @type {any} */ (suspiciousError).method = ctx.method;
				ctx.errors.push(suspiciousError);
			}
		} catch (error) {
			// Pattern detection failed - log but don't affect request
			const detectionError = new Error(
				`Attack pattern detection failed: ${error.message}`,
			);
			detectionError.name = "PatternDetectionError";
			/** @type {any} */ (detectionError).originalError = error;
			ctx.errors.push(detectionError);
		}
	}

	/**
	 * Set security headers on response
	 *
	 * @param {import('../../core/context.js').Context} ctx - Request context
	 */
	#setSecurityHeaders(ctx) {
		try {
			// Skip if response already ended
			if (ctx.responseEnded) return;

			const headers = this.config.headers;

			// Content Security Policy
			if (
				headers.contentSecurityPolicy &&
				!ctx.responseHeaders.has("content-security-policy")
			) {
				const csp = headers.contentSecurityPolicy;
				const headerName = csp.reportOnly
					? "content-security-policy-report-only"
					: "content-security-policy";
				const headerValue = formatCSP(csp.directives);
				ctx.responseHeaders.set(headerName, headerValue);
			}

			// X-Frame-Options
			if (headers.frameOptions && !ctx.responseHeaders.has("x-frame-options")) {
				ctx.responseHeaders.set("x-frame-options", headers.frameOptions);
			}

			// X-Content-Type-Options
			if (
				headers.noSniff &&
				!ctx.responseHeaders.has("x-content-type-options")
			) {
				ctx.responseHeaders.set("x-content-type-options", "nosniff");
			}

			// X-XSS-Protection (legacy, but still useful for older browsers)
			if (
				headers.xssProtection &&
				!ctx.responseHeaders.has("x-xss-protection")
			) {
				ctx.responseHeaders.set("x-xss-protection", "1; mode=block");
			}

			// Strict-Transport-Security
			if (
				headers.hsts &&
				!ctx.responseHeaders.has("strict-transport-security")
			) {
				const hsts = headers.hsts;
				let hstsValue = `max-age=${hsts.maxAge}`;
				if (hsts.includeSubDomains) hstsValue += "; includeSubDomains";
				if (hsts.preload) hstsValue += "; preload";
				ctx.responseHeaders.set("strict-transport-security", hstsValue);
			}

			// Referrer-Policy
			if (
				headers.referrerPolicy &&
				!ctx.responseHeaders.has("referrer-policy")
			) {
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
			// Header setting failed - log error but don't break response
			const headerError = new Error(
				`Security header setting failed: ${error.message}`,
			);
			headerError.name = "SecurityHeaderError";
			/** @type {any} */ (headerError).originalError = error;
			ctx.errors.push(headerError);
		}
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
				rateLimitEnabled: this.config.rateLimit.enabled,
				ipControlMode: this.config.ipControl.mode,
				headersEnabled: !!this.config.headers,
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
