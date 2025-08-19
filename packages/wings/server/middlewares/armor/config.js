/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Security configuration for Armor middleware with enterprise-grade defaults
 *
 * Default armor configuration with production-ready security settings.
 * Zero-dependency validation prevents misconfiguration vulnerabilities.
 * Memory-efficient deep merging preserves user customizations while ensuring type safety.
 *
 * **Performance**: O(1) validation for most settings, O(n) for IP list validation where n = list size
 * **Memory**: Deep merge creates shallow copies only for modified nested objects
 * **Security**: Validation prevents runtime injection through configuration objects
 */
/**
 * @typedef {Object} IPAccessConfig
 * @property {'disabled'|'whitelist'|'blacklist'} mode - Access control mode
 * @property {string[]} whitelist - CIDR ranges and IPs to allow (mode: whitelist)
 * @property {string[]} blacklist - CIDR ranges and IPs to block (mode: blacklist)
 * @property {boolean} trustProxy - Trust X-Forwarded-For headers
 */

/**
 * @typedef {Object} RateLimitConfig
 * @property {boolean} enabled - Enable rate limiting
 * @property {{windowMs: number, max: number}} global - Global rate limits
 * @property {Record<string, {windowMs: number, max: number}>} routes - Route-specific limits
 * @property {((ctx: import('../../../core/context.js').Context) => string)|null} keyGenerator - Custom key function
 * @property {number} cleanupInterval - Memory cleanup interval (ms)
 */

/**
 * @typedef {Object} RequestValidationConfig
 * @property {boolean} enabled - Enable request validation
 * @property {number} maxPathLength - Maximum URL path length
 * @property {number} maxQueryParams - Maximum query parameter count
 * @property {number} maxQueryParamLength - Maximum query parameter value length
 * @property {number} maxHeaders - Maximum header count
 * @property {number} maxHeaderSize - Maximum total header size (bytes)
 * @property {number} maxBodySize - Maximum request body size (bytes)
 */

/**
 * @typedef {Object} AttackDetectionConfig
 * @property {boolean} sqlInjection - Detect SQL injection patterns
 * @property {boolean} xss - Detect XSS patterns
 * @property {boolean} pathTraversal - Detect path traversal patterns
 * @property {boolean} suspiciousPatterns - Detect misc attack patterns
 */

/**
 * @typedef {Object} SecurityHeadersConfig
 * @property {boolean} enabled - Enable security headers
 * @property {Record<string, string[]>|false} contentSecurityPolicy - CSP directives or false to disable
 * @property {boolean} contentSecurityPolicyReportOnly - Use CSP report-only mode
 * @property {{maxAge: number, includeSubDomains: boolean, preload: boolean}|false} httpStrictTransportSecurity - HSTS config or false
 * @property {Record<string, string[]>} permissionsPolicy - Permissions policy features
 * @property {'DENY'|'SAMEORIGIN'|string|false} frameOptions - X-Frame-Options value or false
 * @property {boolean} noSniff - Set X-Content-Type-Options: nosniff
 * @property {string|boolean} xssProtection - X-XSS-Protection value or false
 * @property {string|false} referrerPolicy - Referrer-Policy value or false
 * @property {string|null} crossOriginEmbedderPolicy - COEP value
 * @property {string|null} crossOriginOpenerPolicy - COOP value
 * @property {string|null} crossOriginResourcePolicy - CORP value
 */

/**
 * @typedef {Object} ArmorConfig
 * @property {boolean} enabled - Enable all armor protection
 * @property {IPAccessConfig} ipAccess - IP access control configuration
 * @property {RateLimitConfig} rateLimiting - Rate limiting configuration
 * @property {RequestValidationConfig} requestValidation - Request validation configuration
 * @property {AttackDetectionConfig} attackDetection - Attack detection configuration
 * @property {SecurityHeadersConfig} securityHeaders - Security headers configuration
 */

/**
 * Production-ready security defaults optimized for modern web applications.
 * Conservative settings prevent common attacks while maintaining compatibility.
 *
 * **Rate Limiting**: Disabled by default - enable with production values
 * **IP Access**: Disabled by default - configure whitelist/blacklist as needed
 * **CSP**: Restrictive policy allows self + common safe sources
 * **HSTS**: 1-year max-age without preload (prevents HTTPS requirement removal)
 *
 * @type {ArmorConfig}
 */
export const DEFAULT_CONFIG = {
	enabled: true,

	ipAccess: {
		mode: "disabled",
		whitelist: [],
		blacklist: [],
		trustProxy: false,
	},

	rateLimiting: {
		enabled: false,
		global: {
			windowMs: 15 * 60 * 1000, // 15 minutes
			max: 100, // 100 requests per window per IP
		},
		routes: {},
		keyGenerator: null,
		cleanupInterval: 5 * 60 * 1000, // 5 minutes
	},

	requestValidation: {
		enabled: true,
		maxPathLength: 2048,
		maxQueryParams: 100,
		maxQueryParamLength: 1000,
		maxHeaders: 100,
		maxHeaderSize: 8192, // 8KB total
		maxBodySize: 1024 * 1024, // 1MB
	},

	attackDetection: {
		sqlInjection: true,
		xss: true,
		pathTraversal: true,
		suspiciousPatterns: true,
	},

	securityHeaders: {
		enabled: true,
		contentSecurityPolicy: {
			"default-src": ["'self'"],
			"script-src": ["'self'"],
			"style-src": ["'self'", "'unsafe-inline'"], // Allows inline CSS for compatibility
			"img-src": ["'self'", "data:", "https:"], // Allows data URIs and HTTPS images
			"font-src": ["'self'"],
			"connect-src": ["'self'"],
			"frame-src": ["'none'"],
			"object-src": ["'none'"],
			"base-uri": ["'self'"],
			"form-action": ["'self'"],
		},
		contentSecurityPolicyReportOnly: false,
		httpStrictTransportSecurity: {
			maxAge: 31536000, // 1 year
			includeSubDomains: true,
			preload: false, // Prevents accidental HSTS preload list inclusion
		},
		permissionsPolicy: {
			geolocation: [],
			microphone: [],
			camera: [],
		},
		frameOptions: "DENY",
		noSniff: true,
		xssProtection: "1; mode=block",
		referrerPolicy: "strict-origin-when-cross-origin",
		crossOriginEmbedderPolicy: null,
		crossOriginOpenerPolicy: null,
		crossOriginResourcePolicy: null,
	},
};

/**
 * Validation error class for configuration errors
 */
export class ConfigValidationError extends Error {
	/**
	 * Create a configuration validation error
	 *
	 * @param {string} message - Error message
	 * @param {string} path - Configuration path where error occurred
	 */
	constructor(message, path) {
		super(message);
		this.name = "ConfigValidationError";
		this.path = path;
	}
}

/**
 * Validate IP access configuration
 *
 * @param {any} config - Configuration to validate
 * @param {string} path - Configuration path for error reporting
 * @throws {ConfigValidationError} If configuration is invalid
 */
function validateIPAccess(config, path = "ipAccess") {
	if (!config || typeof config !== "object") {
		throw new ConfigValidationError(
			"IP access configuration must be an object",
			path,
		);
	}

	const { mode, whitelist, blacklist, trustProxy } = config;

	// Validate mode
	if (
		mode !== undefined &&
		!["disabled", "whitelist", "blacklist"].includes(mode)
	) {
		throw new ConfigValidationError(
			"IP access mode must be 'disabled', 'whitelist', or 'blacklist'",
			`${path}.mode`,
		);
	}

	// Validate whitelist
	if (whitelist !== undefined && !Array.isArray(whitelist)) {
		throw new ConfigValidationError(
			"IP whitelist must be an array",
			`${path}.whitelist`,
		);
	}

	// Validate blacklist
	if (blacklist !== undefined && !Array.isArray(blacklist)) {
		throw new ConfigValidationError(
			"IP blacklist must be an array",
			`${path}.blacklist`,
		);
	}

	// Validate trustProxy
	if (trustProxy !== undefined && typeof trustProxy !== "boolean") {
		throw new ConfigValidationError(
			"trustProxy must be a boolean",
			`${path}.trustProxy`,
		);
	}

	// Validate IP addresses in lists
	/** @param {string[]} list @param {string} listName */
	const validateIPList = (list, listName) => {
		if (list) {
			for (let i = 0; i < list.length; i++) {
				const ip = list[i];
				if (typeof ip !== "string" || ip.trim() === "") {
					throw new ConfigValidationError(
						`${listName} must contain only non-empty strings`,
						`${path}.${listName}[${i}]`,
					);
				}
			}
		}
	};

	validateIPList(whitelist, "whitelist");
	validateIPList(blacklist, "blacklist");
}

/**
 * Validate rate limiting configuration
 *
 * @param {any} config - Configuration to validate
 * @param {string} path - Configuration path for error reporting
 * @throws {ConfigValidationError} If configuration is invalid
 */
function validateRateLimiting(config, path = "rateLimiting") {
	if (!config || typeof config !== "object") {
		throw new ConfigValidationError(
			"Rate limiting configuration must be an object",
			path,
		);
	}

	const { enabled, global, routes, keyGenerator } = config;

	// Validate enabled
	if (enabled !== undefined && typeof enabled !== "boolean") {
		throw new ConfigValidationError(
			"Rate limiting enabled must be a boolean",
			`${path}.enabled`,
		);
	}

	// Validate global settings
	if (global !== undefined) {
		if (typeof global !== "object" || global === null) {
			throw new ConfigValidationError(
				"Global rate limiting configuration must be an object",
				`${path}.global`,
			);
		}

		const { windowMs, max } = global;
		if (
			windowMs !== undefined &&
			(typeof windowMs !== "number" || windowMs <= 0)
		) {
			throw new ConfigValidationError(
				"Rate limiting window must be a positive number",
				`${path}.global.windowMs`,
			);
		}
		if (max !== undefined && (typeof max !== "number" || max < 0)) {
			throw new ConfigValidationError(
				"Rate limiting max must be a non-negative number",
				`${path}.global.max`,
			);
		}
	}

	// Validate routes
	if (routes !== undefined && typeof routes !== "object") {
		throw new ConfigValidationError(
			"Per-route rate limiting must be an object",
			`${path}.routes`,
		);
	}

	// Validate keyGenerator
	if (
		keyGenerator !== undefined &&
		keyGenerator !== null &&
		typeof keyGenerator !== "function"
	) {
		throw new ConfigValidationError(
			"Rate limiting key generator must be a function",
			`${path}.keyGenerator`,
		);
	}
}

/**
 * Validate request validation configuration
 *
 * @param {any} config - Configuration to validate
 * @param {string} path - Configuration path for error reporting
 * @throws {ConfigValidationError} If configuration is invalid
 */
function validateRequestValidation(config, path = "requestValidation") {
	if (!config || typeof config !== "object") {
		throw new ConfigValidationError(
			"Request validation configuration must be an object",
			path,
		);
	}

	const {
		enabled,
		maxPathLength,
		maxQueryParams,
		maxQueryParamLength,
		maxHeaders,
		maxHeaderSize,
		maxBodySize,
	} = config;

	// Validate enabled
	if (enabled !== undefined && typeof enabled !== "boolean") {
		throw new ConfigValidationError(
			"Request validation enabled must be a boolean",
			`${path}.enabled`,
		);
	}

	// Validate numeric limits
	/** @param {any} value @param {string} name */
	const validatePositiveNumber = (value, name) => {
		if (value !== undefined && (typeof value !== "number" || value <= 0)) {
			throw new ConfigValidationError(
				`${name} must be a positive number`,
				`${path}.${name}`,
			);
		}
	};

	validatePositiveNumber(maxPathLength, "maxPathLength");
	validatePositiveNumber(maxQueryParams, "maxQueryParams");
	validatePositiveNumber(maxQueryParamLength, "maxQueryParamLength");
	validatePositiveNumber(maxHeaders, "maxHeaders");
	validatePositiveNumber(maxHeaderSize, "maxHeaderSize");
	validatePositiveNumber(maxBodySize, "maxBodySize");
}

/**
 * Validate attack detection configuration
 *
 * @param {any} config - Configuration to validate
 * @param {string} path - Configuration path for error reporting
 * @throws {ConfigValidationError} If configuration is invalid
 */
function validateAttackDetection(config, path = "attackDetection") {
	if (!config || typeof config !== "object") {
		throw new ConfigValidationError(
			"Attack detection configuration must be an object",
			path,
		);
	}

	const { sqlInjection, xss, pathTraversal, suspiciousPatterns } = config;

	// Validate boolean flags
	/** @param {any} value @param {string} name */
	const validateBoolean = (value, name) => {
		if (value !== undefined && typeof value !== "boolean") {
			throw new ConfigValidationError(
				`${name} must be a boolean`,
				`${path}.${name}`,
			);
		}
	};

	validateBoolean(sqlInjection, "sqlInjection");
	validateBoolean(xss, "xss");
	validateBoolean(pathTraversal, "pathTraversal");
	validateBoolean(suspiciousPatterns, "suspiciousPatterns");
}

/**
 * Validate security headers configuration
 *
 * @param {any} config - Configuration to validate
 * @param {string} path - Configuration path for error reporting
 * @throws {ConfigValidationError} If configuration is invalid
 */
function validateSecurityHeaders(config, path = "securityHeaders") {
	if (!config || typeof config !== "object") {
		throw new ConfigValidationError(
			"Security headers configuration must be an object",
			path,
		);
	}

	const { enabled, contentSecurityPolicy, httpStrictTransportSecurity } =
		config;

	// Validate enabled
	if (enabled !== undefined && typeof enabled !== "boolean") {
		throw new ConfigValidationError(
			"Security headers enabled must be a boolean",
			`${path}.enabled`,
		);
	}

	// Validate CSP
	if (contentSecurityPolicy !== undefined) {
		if (
			typeof contentSecurityPolicy !== "object" ||
			contentSecurityPolicy === null
		) {
			throw new ConfigValidationError(
				"Content Security Policy must be an object",
				`${path}.contentSecurityPolicy`,
			);
		}
	}

	// Validate HSTS
	if (httpStrictTransportSecurity !== undefined) {
		if (
			typeof httpStrictTransportSecurity !== "object" ||
			httpStrictTransportSecurity === null
		) {
			throw new ConfigValidationError(
				"HSTS configuration must be an object",
				`${path}.httpStrictTransportSecurity`,
			);
		}

		const { maxAge, includeSubDomains, preload } = httpStrictTransportSecurity;
		if (maxAge !== undefined && (typeof maxAge !== "number" || maxAge < 0)) {
			throw new ConfigValidationError(
				"HSTS maxAge must be a non-negative number",
				`${path}.httpStrictTransportSecurity.maxAge`,
			);
		}
		if (
			includeSubDomains !== undefined &&
			typeof includeSubDomains !== "boolean"
		) {
			throw new ConfigValidationError(
				"HSTS includeSubDomains must be a boolean",
				`${path}.httpStrictTransportSecurity.includeSubDomains`,
			);
		}
		if (preload !== undefined && typeof preload !== "boolean") {
			throw new ConfigValidationError(
				"HSTS preload must be a boolean",
				`${path}.httpStrictTransportSecurity.preload`,
			);
		}
	}
}

/**
 * Validate complete armor configuration
 *
 * @param {any} config - Configuration to validate
 * @throws {ConfigValidationError} If configuration is invalid
 */
export function validateConfig(config) {
	if (!config || typeof config !== "object") {
		throw new ConfigValidationError("Configuration must be an object", "");
	}

	// Validate enabled flag
	if (config.enabled !== undefined && typeof config.enabled !== "boolean") {
		throw new ConfigValidationError("Enabled must be a boolean", "enabled");
	}

	// Validate each section if present
	if (config.ipAccess !== undefined) {
		validateIPAccess(config.ipAccess);
	}
	if (config.rateLimiting !== undefined) {
		validateRateLimiting(config.rateLimiting);
	}
	if (config.requestValidation !== undefined) {
		validateRequestValidation(config.requestValidation);
	}
	if (config.attackDetection !== undefined) {
		validateAttackDetection(config.attackDetection);
	}
	if (config.securityHeaders !== undefined) {
		validateSecurityHeaders(config.securityHeaders);
	}
}

/**
 * Deep merge two configuration objects
 *
 * @param {any} target - Target configuration object
 * @param {any} source - Source configuration object to merge
 * @returns {any} Merged configuration object
 */
export function mergeConfig(target, source) {
	/** @type {any} */
	const result = { ...target };

	for (const [key, value] of Object.entries(source)) {
		if (value !== undefined) {
			if (
				value &&
				typeof value === "object" &&
				!Array.isArray(value) &&
				!(value instanceof Map)
			) {
				// Deep merge objects (but not arrays or Maps)
				result[key] = mergeConfig(result[key] || {}, value);
			} else {
				// Direct assignment for primitives, arrays, Maps, etc.
				result[key] = value;
			}
		}
	}

	return result;
}

/**
 * Create a validated configuration by merging user config with defaults
 *
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} Validated and merged configuration
 * @throws {ConfigValidationError} If configuration is invalid
 */
export function createConfig(userConfig = {}) {
	// Validate user config first
	validateConfig(userConfig);

	// Merge with defaults
	const config = mergeConfig(DEFAULT_CONFIG, userConfig);

	// Validate final config
	validateConfig(config);

	return config;
}
