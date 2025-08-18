/**
 * @fileoverview Configuration management and validation for armor middleware
 *
 * Provides utilities for creating, validating, and merging configuration objects
 * for the armor middleware. Includes default configurations and comprehensive
 * validation with helpful error messages.
 *
 * @author RavenJS Team
 * @since 0.3.0
 */

/**
 * Default armor configuration with sensible security defaults
 * @type {Object}
 */
export const DEFAULT_CONFIG = {
	// General options
	enabled: true,

	// IP-based access control
	ipAccess: {
		mode: "disabled", // "disabled", "whitelist", "blacklist"
		/** @type {string[]} */
		whitelist: [],
		/** @type {string[]} */
		blacklist: [],
		trustProxy: false,
	},

	// Rate limiting
	rateLimiting: {
		enabled: false,
		global: {
			windowMs: 15 * 60 * 1000, // 15 minutes
			max: 100, // Limit each IP to 100 requests per window
		},
		routes: {}, // Route-specific limits
		/** @type {Function|null} */
		keyGenerator: null, // Custom key generator function
		cleanupInterval: 5 * 60 * 1000, // 5 minutes
	},

	// Request validation
	requestValidation: {
		enabled: true,
		maxPathLength: 2048,
		maxQueryParams: 100,
		maxQueryParamLength: 1000,
		maxHeaders: 100,
		maxHeaderSize: 8192, // 8KB
		maxBodySize: 1024 * 1024, // 1MB
	},

	// Attack pattern detection
	attackDetection: {
		sqlInjection: true,
		xss: true,
		pathTraversal: true,
		suspiciousPatterns: true,
	},

	// Security headers
	securityHeaders: {
		enabled: true,
		contentSecurityPolicy: {
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
		},
		contentSecurityPolicyReportOnly: false,
		httpStrictTransportSecurity: {
			maxAge: 31536000, // 1 year
			includeSubDomains: true,
			preload: false,
		},
		permissionsPolicy: {
			/** @type {string[]} */
			geolocation: [],
			/** @type {string[]} */
			microphone: [],
			/** @type {string[]} */
			camera: [],
		},
		frameOptions: "DENY",
		noSniff: true,
		xssProtection: "1; mode=block",
		referrerPolicy: "strict-origin-when-cross-origin",
		/** @type {string|null} */
		crossOriginEmbedderPolicy: null,
		/** @type {string|null} */
		crossOriginOpenerPolicy: null,
		/** @type {string|null} */
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
