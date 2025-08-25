/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Configuration validator with secure defaults for Resolve middleware.
 *
 * Implements comprehensive validation and secure configuration management for
 * the Resolve middleware. Provides schema validation, secure defaults, environment
 * configuration, and runtime validation to ensure safe and optimal operation.
 *
 * Key validation areas:
 * - Path security and workspace validation
 * - Cache configuration and performance tuning
 * - Import map generation settings
 * - HTML injection strategies and security
 * - Module serving policies and headers
 * - Development vs production optimization
 */

/**
 * @typedef {Object} ResolveConfig
 * @property {boolean} [enabled=true] - Enable/disable the middleware
 * @property {string} [mode='development'] - Environment mode ('development' | 'production' | 'testing')
 * @property {string} [rootDir=process.cwd()] - Project root directory
 * @property {string[]} [workspaces=['.']] - Workspace directories to scan
 * @property {Object} [cache] - Cache configuration
 * @property {number} [cache.ttl=5000] - Default cache TTL in milliseconds
 * @property {number} [cache.maxSize=2000] - Maximum cache entries
 * @property {boolean} [cache.enabled=true] - Enable caching
 * @property {Object} [importMap] - Import map configuration
 * @property {string} [importMap.baseUrl='/'] - Base URL for module paths
 * @property {boolean} [importMap.trailingSlash=true] - Add trailing slashes
 * @property {string[]} [importMap.excludePackages=[]] - Packages to exclude
 * @property {Object} [html] - HTML injection configuration
 * @property {string} [html.strategy='head-end'] - Injection strategy
 * @property {string} [html.existingMaps='merge'] - Handle existing import maps
 * @property {Object} [security] - Security configuration
 * @property {number} [security.maxDepth=3] - Maximum path traversal depth
 * @property {string[]} [security.allowedExtensions] - Allowed file extensions
 * @property {string[]} [security.blockedPatterns] - Blocked path patterns
 * @property {Object} [performance] - Performance configuration
 * @property {boolean} [performance.enableCompression=false] - Enable compression hints
 * @property {number} [performance.maxFileSize=10485760] - Maximum file size (10MB)
 * @property {boolean} [performance.enableETag=true] - Enable ETag headers
 */

/**
 * Default configuration with secure settings optimized for development.
 */
const DEFAULT_CONFIG = {
	enabled: true,
	mode: "development",
	rootDir: process.cwd(),
	workspaces: ["."],
	cache: {
		ttl: 5000,
		maxSize: 2000,
		enabled: true,
		cleanupInterval: 0, // Disabled by default to prevent hanging
	},
	importMap: {
		baseUrl: "/",
		trailingSlash: true,
		excludePackages: [],
		includeDevDependencies: true,
	},
	html: {
		strategy: "head-end",
		existingMaps: "merge",
		validateStructure: true,
	},
	security: {
		maxDepth: 3,
		allowedExtensions: [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".map"],
		blockedPatterns: [
			"**/.env*",
			"**/config.json",
			"**/*.exe",
			"**/*.bat",
			"**/*.sh",
			"**/*.ps1",
			"**/package-lock.json",
			"**/yarn.lock",
			"**/node_modules/**/test/**",
			"**/node_modules/**/.git/**",
		],
		enablePathValidation: true,
		preventTraversal: true,
	},
	performance: {
		enableCompression: false,
		maxFileSize: 10 * 1024 * 1024, // 10MB
		enableETag: true,
		streamThreshold: 1024 * 1024, // 1MB
		cacheHeaders: true,
	},
	logging: {
		enabled: true,
		level: "info",
		logRequests: false,
		logErrors: true,
	},
};

/**
 * Production-optimized configuration preset.
 */
const PRODUCTION_CONFIG = {
	mode: "production",
	cache: {
		ttl: 300000, // 5 minutes
		maxSize: 10000,
		cleanupInterval: 120000, // 2 minutes
	},
	importMap: {
		includeDevDependencies: false,
	},
	html: {
		validateStructure: false, // Skip validation for performance
	},
	performance: {
		enableCompression: true,
		enableETag: true,
		streamThreshold: 512 * 1024, // 512KB
	},
	logging: {
		level: "warn",
		logRequests: false,
	},
};

/**
 * Testing-optimized configuration preset.
 */
const TESTING_CONFIG = {
	mode: "testing",
	cache: {
		ttl: 1000,
		maxSize: 100,
		cleanupInterval: 0, // Disabled for testing
	},
	importMap: {
		includeDevDependencies: true,
	},
	performance: {
		enableCompression: false,
		enableETag: false,
		streamThreshold: 0, // Always use in-memory
	},
	logging: {
		enabled: false,
		level: "silent",
	},
};

/**
 * Configuration validator with comprehensive schema validation and security checks.
 *
 * Implements multi-stage validation including type checking, range validation,
 * security policy enforcement, and environment-specific optimizations. Provides
 * detailed error reporting and automatic fallback to secure defaults.
 *
 * **Validation Stages:**
 * 1. Schema validation (types, required fields)
 * 2. Security validation (paths, patterns, limits)
 * 3. Performance validation (memory, file sizes)
 * 4. Environment optimization (development vs production)
 *
 * @example
 * ```javascript
 * const validator = new ConfigValidator();
 * const config = validator.validate(userConfig);
 *
 * if (!config.valid) {
 *   console.error('Invalid config:', config.errors);
 * }
 * ```
 */
export class ConfigValidator {
	/**
	 * @param {Object} [options={}] - Validator configuration
	 * @param {boolean} [options.strict=false] - Enable strict validation mode
	 * @param {string} [options.environment] - Override environment detection
	 */
	constructor(options = {}) {
		const { strict = false, environment } = options;

		/** @private */
		this.strict = strict;
		/** @private */
		this.environment = environment || this.detectEnvironment();
		/** @private */
		this.errors = [];
		/** @private */
		this.warnings = [];
	}

	/**
	 * Validates and normalizes a Resolve middleware configuration.
	 *
	 * Performs comprehensive validation including schema validation, security
	 * checks, performance optimization, and environment-specific adjustments.
	 * Returns normalized configuration with secure defaults applied.
	 *
	 * **Validation Process:**
	 * 1. Apply environment preset and merge with defaults
	 * 2. Validate schema and types
	 * 3. Enforce security policies
	 * 4. Optimize for environment
	 * 5. Validate runtime constraints
	 *
	 * @param {Object} [userConfig={}] - User-provided configuration
	 * @returns {Object} Validation result with normalized config
	 *
	 * @example
	 * ```javascript
	 * const result = validator.validate({
	 *   mode: 'production',
	 *   cache: { ttl: 60000 },
	 *   security: { maxDepth: 5 }
	 * });
	 *
	 * if (result.valid) {
	 *   console.log('Valid config:', result.config);
	 * }
	 * ```
	 */
	validate(userConfig = {}) {
		this.errors = [];
		this.warnings = [];

		try {
			// Step 1: Validate user input first before merging
			this.validateUserInput(userConfig);
			if (this.hasErrors() && this.strict) {
				return this.createResult(false, DEFAULT_CONFIG);
			}

			// Step 2: Apply environment preset and merge defaults
			const baseConfig = this.getEnvironmentConfig(userConfig.mode);
			const mergedConfig = this.mergeConfigs(baseConfig, userConfig);

			// Step 3: Schema validation on merged config
			this.validateSchema(mergedConfig);
			if (this.hasErrors() && this.strict) {
				return this.createResult(false, mergedConfig);
			}

			// Step 4: Security validation
			this.validateSecurity(mergedConfig);
			if (this.hasErrors() && this.strict) {
				return this.createResult(false, mergedConfig);
			}

			// Step 5: Performance validation
			this.validatePerformance(mergedConfig);
			if (this.hasErrors() && this.strict) {
				return this.createResult(false, mergedConfig);
			}

			// Step 6: Runtime validation
			this.validateRuntime(mergedConfig);
			if (this.hasErrors() && this.strict) {
				return this.createResult(false, mergedConfig);
			}

			// Step 7: Apply final optimizations
			const optimizedConfig = this.optimizeConfig(mergedConfig);

			// Return result based on whether errors were found
			const isValid = !this.hasErrors();
			return this.createResult(isValid, optimizedConfig);
		} catch (error) {
			this.addError(
				"validation",
				`Configuration validation failed: ${error.message}`,
			);
			return this.createResult(false, DEFAULT_CONFIG);
		}
	}

	/**
	 * Validates a specific configuration path with custom rules.
	 *
	 * Provides targeted validation for specific configuration sections,
	 * useful for partial configuration updates and runtime validation.
	 *
	 * @param {string} path - Configuration path (e.g., 'cache.ttl')
	 * @param {any} value - Value to validate
	 * @param {Object} [rules={}] - Custom validation rules
	 * @returns {Object} Validation result for the specific path
	 *
	 * @example
	 * ```javascript
	 * const result = validator.validatePath('cache.ttl', 30000, {
	 *   min: 1000,
	 *   max: 300000
	 * });
	 * ```
	 */
	validatePath(path, value, rules = {}) {
		this.errors = [];
		this.warnings = [];

		try {
			// Handle invalid path
			if (typeof path !== "string" || path.length === 0) {
				this.addError("path", "Path cannot be empty");
				return this.createResult(false, value);
			}

			const pathSegments = path.split(".");
			const field = pathSegments[pathSegments.length - 1];

			// Apply path-specific validation
			switch (path) {
				case "cache.ttl":
					this.validateNumber(value, "cache.ttl", { min: 1, max: 3600000 });
					break;
				case "cache.maxSize":
					this.validateNumber(value, "cache.maxSize", { min: 1, max: 100000 });
					break;
				case "security.maxDepth":
					this.validateNumber(value, "security.maxDepth", { min: 1, max: 10 });
					break;
				case "performance.maxFileSize":
					this.validateNumber(value, "performance.maxFileSize", {
						min: 1024,
						max: 100 * 1024 * 1024,
					});
					break;
				case "rootDir":
					this.validatePath_Directory(value, "rootDir");
					break;
				default:
					// Generic validation based on rules
					if (rules.type) {
						this.validateType(value, field, rules.type);
					}
					if (rules.min !== undefined || rules.max !== undefined) {
						this.validateNumber(value, field, rules);
					}
			}

			return this.createResult(!this.hasErrors(), value);
		} catch (error) {
			this.addError("path", `Path validation failed: ${error.message}`);
			return this.createResult(false, value);
		}
	}

	/**
	 * Creates a configuration preset for the specified environment.
	 *
	 * Provides optimized configuration presets for different environments
	 * with appropriate security, performance, and caching settings.
	 *
	 * @param {string} [environment='development'] - Target environment
	 * @returns {ResolveConfig} Environment-optimized configuration
	 *
	 * @example
	 * ```javascript
	 * const prodConfig = validator.createPreset('production');
	 * const devConfig = validator.createPreset('development');
	 * ```
	 */
	createPreset(environment = "development") {
		const baseConfig = structuredClone(DEFAULT_CONFIG);

		switch (environment) {
			case "production":
				return this.mergeConfigs(baseConfig, PRODUCTION_CONFIG);
			case "testing":
				return this.mergeConfigs(baseConfig, TESTING_CONFIG);
			case "development":
			default:
				return baseConfig;
		}
	}

	/**
	 * Sanitizes and normalizes configuration values.
	 *
	 * Applies security sanitization, type coercion, and value normalization
	 * to ensure configuration safety and consistency.
	 *
	 * @param {Object} config - Configuration to sanitize
	 * @returns {Object} Sanitized configuration
	 *
	 * @example
	 * ```javascript
	 * const safe = validator.sanitize(untrustedConfig);
	 * ```
	 */
	sanitize(config) {
		if (!config || typeof config !== "object") {
			return structuredClone(DEFAULT_CONFIG);
		}

		const sanitized = {};

		// Sanitize primitive values
		if (typeof config.enabled === "boolean") {
			sanitized.enabled = config.enabled;
		}

		if (typeof config.mode === "string") {
			sanitized.mode = ["development", "production", "testing"].includes(
				config.mode,
			)
				? config.mode
				: "development";
		}

		if (typeof config.rootDir === "string") {
			sanitized.rootDir = this.sanitizePath(config.rootDir);
		}

		// Sanitize nested objects
		if (config.cache && typeof config.cache === "object") {
			sanitized.cache = this.sanitizeCache(config.cache);
		}

		if (config.security && typeof config.security === "object") {
			sanitized.security = this.sanitizeSecurity(config.security);
		}

		if (config.performance && typeof config.performance === "object") {
			sanitized.performance = this.sanitizePerformance(config.performance);
		}

		// Merge with defaults for missing values
		return this.mergeConfigs(DEFAULT_CONFIG, sanitized);
	}

	// Private methods

	/**
	 * Detects the current environment.
	 * @private
	 */
	detectEnvironment() {
		if (process.env.NODE_ENV === "production") return "production";
		if (process.env.NODE_ENV === "test") return "testing";
		return "development";
	}

	/**
	 * Gets environment-specific configuration.
	 * @private
	 */
	getEnvironmentConfig(mode) {
		const environment = mode || this.environment;
		return this.createPreset(environment);
	}

	/**
	 * Merges configuration objects deeply.
	 * @private
	 */
	mergeConfigs(base, override) {
		const result = structuredClone(base);

		for (const [key, value] of Object.entries(override)) {
			if (
				value !== null &&
				typeof value === "object" &&
				!Array.isArray(value)
			) {
				result[key] = this.mergeConfigs(result[key] || {}, value);
			} else {
				result[key] = value;
			}
		}

		return result;
	}

	/**
	 * Validates user input for type errors before merging with defaults.
	 * @private
	 */
	validateUserInput(userConfig) {
		// Check for type errors in user-provided values
		if (
			userConfig.enabled !== undefined &&
			typeof userConfig.enabled !== "boolean"
		) {
			this.addError("schema", "Field 'enabled' must be of type boolean");
		}

		if (userConfig.mode !== undefined && typeof userConfig.mode !== "string") {
			this.addError("schema", "Field 'mode' must be of type string");
		}

		if (
			userConfig.rootDir !== undefined &&
			typeof userConfig.rootDir !== "string"
		) {
			this.addError("schema", "Field 'rootDir' must be of type string");
		}

		if (
			userConfig.workspaces !== undefined &&
			!Array.isArray(userConfig.workspaces)
		) {
			this.addError("schema", "Field 'workspaces' must be an array");
		}

		// Validate nested objects
		if (userConfig.cache !== undefined) {
			if (typeof userConfig.cache !== "object" || userConfig.cache === null) {
				this.addError("schema", "Field 'cache' must be an object");
			} else {
				this.validateUserCacheConfig(userConfig.cache);
			}
		}

		if (userConfig.security !== undefined) {
			if (
				typeof userConfig.security !== "object" ||
				userConfig.security === null
			) {
				this.addError("schema", "Field 'security' must be an object");
			} else {
				this.validateUserSecurityConfig(userConfig.security);
			}
		}

		if (userConfig.performance !== undefined) {
			if (
				typeof userConfig.performance !== "object" ||
				userConfig.performance === null
			) {
				this.addError("schema", "Field 'performance' must be an object");
			} else {
				this.validateUserPerformanceConfig(userConfig.performance);
			}
		}
	}

	/**
	 * Validates user cache configuration for type errors.
	 * @private
	 */
	validateUserCacheConfig(cache) {
		if (cache.ttl !== undefined && typeof cache.ttl !== "number") {
			this.addError("schema", "Field 'cache.ttl' must be of type number");
		}
		if (cache.maxSize !== undefined && typeof cache.maxSize !== "number") {
			this.addError("schema", "Field 'cache.maxSize' must be of type number");
		}
		if (cache.enabled !== undefined && typeof cache.enabled !== "boolean") {
			this.addError("schema", "Field 'cache.enabled' must be of type boolean");
		}
	}

	/**
	 * Validates user security configuration for type errors.
	 * @private
	 */
	validateUserSecurityConfig(security) {
		if (
			security.maxDepth !== undefined &&
			typeof security.maxDepth !== "number"
		) {
			this.addError(
				"schema",
				"Field 'security.maxDepth' must be of type number",
			);
		}
		if (security.allowedExtensions !== undefined) {
			if (!Array.isArray(security.allowedExtensions)) {
				this.addError(
					"schema",
					"Field 'security.allowedExtensions' must be an array",
				);
			} else if (security.allowedExtensions.length > 50) {
				this.addError(
					"range",
					"Field 'security.allowedExtensions' exceeds maximum size of 50",
				);
			}
		}
		if (security.blockedPatterns !== undefined) {
			if (!Array.isArray(security.blockedPatterns)) {
				this.addError(
					"schema",
					"Field 'security.blockedPatterns' must be an array",
				);
			} else if (security.blockedPatterns.length > 100) {
				this.addError(
					"range",
					"Field 'security.blockedPatterns' exceeds maximum size of 100",
				);
			}
		}
	}

	/**
	 * Validates user performance configuration for type errors.
	 * @private
	 */
	validateUserPerformanceConfig(performance) {
		if (performance.maxFileSize !== undefined) {
			if (typeof performance.maxFileSize !== "number") {
				this.addError(
					"schema",
					"Field 'performance.maxFileSize' must be of type number",
				);
			} else if (performance.maxFileSize > 100 * 1024 * 1024) {
				this.addError(
					"range",
					"Field 'performance.maxFileSize' exceeds maximum of 100MB",
				);
			}
		}
		if (
			performance.streamThreshold !== undefined &&
			typeof performance.streamThreshold !== "number"
		) {
			this.addError(
				"schema",
				"Field 'performance.streamThreshold' must be of type number",
			);
		}
		if (
			performance.enableCompression !== undefined &&
			typeof performance.enableCompression !== "boolean"
		) {
			this.addError(
				"schema",
				"Field 'performance.enableCompression' must be of type boolean",
			);
		}
	}

	/**
	 * Validates configuration schema.
	 * @private
	 */
	validateSchema(config) {
		// Required fields
		this.validateRequired(config, "enabled", "boolean");
		this.validateRequired(config, "mode", "string");
		this.validateRequired(config, "rootDir", "string");

		// Optional fields with type checking
		if (config.workspaces !== undefined) {
			this.validateArray(config.workspaces, "workspaces", "string");
		}

		// Nested object validation
		if (config.cache) {
			this.validateCacheConfig(config.cache);
		}

		if (config.security) {
			this.validateSecurityConfig(config.security);
		}

		if (config.performance) {
			this.validatePerformanceConfig(config.performance);
		}
	}

	/**
	 * Validates security configuration.
	 * @private
	 */
	validateSecurity(config) {
		if (config.security) {
			const { maxDepth, allowedExtensions, blockedPatterns } = config.security;

			if (maxDepth && (maxDepth < 1 || maxDepth > 10)) {
				this.addError("security", "maxDepth must be between 1 and 10");
			}

			if (
				allowedExtensions &&
				(!Array.isArray(allowedExtensions) || allowedExtensions.length === 0)
			) {
				this.addError(
					"security",
					"allowedExtensions must be a non-empty array",
				);
			}

			if (blockedPatterns && !Array.isArray(blockedPatterns)) {
				this.addError("security", "blockedPatterns must be an array");
			}
		}

		// Validate root directory exists and is accessible
		if (config.rootDir) {
			this.validatePath_Directory(config.rootDir, "rootDir");
		}
	}

	/**
	 * Validates performance configuration.
	 * @private
	 */
	validatePerformance(config) {
		if (config.performance) {
			const { maxFileSize, streamThreshold } = config.performance;

			if (maxFileSize) {
				this.validateNumber(maxFileSize, "performance.maxFileSize", {
					min: 1024,
					max: 100 * 1024 * 1024,
				});
			}

			if (streamThreshold) {
				this.validateNumber(streamThreshold, "performance.streamThreshold", {
					min: 0,
					max: 10 * 1024 * 1024,
				});
			}
		}
	}

	/**
	 * Validates runtime constraints.
	 * @private
	 */
	validateRuntime(config) {
		// Validate workspace accessibility
		if (config.workspaces && Array.isArray(config.workspaces)) {
			for (const workspace of config.workspaces) {
				const fullPath = workspace.startsWith("/")
					? workspace
					: `${config.rootDir}/${workspace}`;
				this.validatePath_Directory(fullPath, `workspace: ${workspace}`, false);
			}
		}

		// Validate cache configuration consistency
		if (config.cache && config.cache.enabled && config.cache.maxSize < 1) {
			this.addError(
				"runtime",
				"Cache maxSize must be at least 1 when caching is enabled",
			);
		}
	}

	/**
	 * Optimizes configuration for the target environment.
	 * @private
	 */
	optimizeConfig(config) {
		const optimized = structuredClone(config);

		// Environment-specific optimizations
		if (optimized.mode === "production") {
			// Disable debug features
			optimized.logging = optimized.logging || {};
			optimized.logging.logRequests = false;
			optimized.html = optimized.html || {};
			optimized.html.validateStructure = false;
		} else if (optimized.mode === "testing") {
			// Disable timers and external dependencies
			optimized.cache = optimized.cache || {};
			optimized.cache.cleanupInterval = 0;
			optimized.logging = optimized.logging || {};
			optimized.logging.enabled = false;
		}

		return optimized;
	}

	/**
	 * Validates cache configuration.
	 * @private
	 */
	validateCacheConfig(cache) {
		if (cache.ttl !== undefined) {
			this.validateNumber(cache.ttl, "cache.ttl", { min: 1, max: 3600000 });
		}
		if (cache.maxSize !== undefined) {
			this.validateNumber(cache.maxSize, "cache.maxSize", {
				min: 1,
				max: 100000,
			});
		}
		if (cache.enabled !== undefined) {
			this.validateType(cache.enabled, "cache.enabled", "boolean");
		}
	}

	/**
	 * Validates security configuration.
	 * @private
	 */
	validateSecurityConfig(security) {
		if (security.maxDepth !== undefined) {
			this.validateNumber(security.maxDepth, "security.maxDepth", {
				min: 1,
				max: 10,
			});
		}
		if (security.allowedExtensions !== undefined) {
			this.validateArray(
				security.allowedExtensions,
				"security.allowedExtensions",
				"string",
			);
		}
		if (security.blockedPatterns !== undefined) {
			this.validateArray(
				security.blockedPatterns,
				"security.blockedPatterns",
				"string",
			);
		}
	}

	/**
	 * Validates performance configuration.
	 * @private
	 */
	validatePerformanceConfig(performance) {
		if (performance.maxFileSize !== undefined) {
			this.validateNumber(performance.maxFileSize, "performance.maxFileSize", {
				min: 1024,
				max: 100 * 1024 * 1024,
			});
		}
		if (performance.streamThreshold !== undefined) {
			this.validateNumber(
				performance.streamThreshold,
				"performance.streamThreshold",
				{
					min: 0,
					max: 10 * 1024 * 1024,
				},
			);
		}
	}

	/**
	 * Validates required field.
	 * @private
	 */
	validateRequired(obj, field, type) {
		if (obj[field] === undefined || obj[field] === null) {
			this.addError("schema", `Required field '${field}' is missing`);
		} else if (typeof obj[field] !== type) {
			this.addError("schema", `Field '${field}' must be of type ${type}`);
		}
	}

	/**
	 * Validates type.
	 * @private
	 */
	validateType(value, field, expectedType) {
		if (typeof value !== expectedType) {
			this.addError(
				"schema",
				`Field '${field}' must be of type ${expectedType}`,
			);
		}
	}

	/**
	 * Validates number with range.
	 * @private
	 */
	validateNumber(value, field, options = {}) {
		if (typeof value !== "number" || !Number.isFinite(value)) {
			this.addError("schema", `Field '${field}' must be a finite number`);
			return;
		}

		if (options.min !== undefined && value < options.min) {
			this.addError("range", `Field '${field}' must be >= ${options.min}`);
		}

		if (options.max !== undefined && value > options.max) {
			this.addError("range", `Field '${field}' must be <= ${options.max}`);
		}
	}

	/**
	 * Validates array with element type.
	 * @private
	 */
	validateArray(value, field, elementType) {
		if (!Array.isArray(value)) {
			this.addError("schema", `Field '${field}' must be an array`);
			return;
		}

		if (elementType) {
			for (let i = 0; i < value.length; i++) {
				if (typeof value[i] !== elementType) {
					this.addError(
						"schema",
						`Field '${field}[${i}]' must be of type ${elementType}`,
					);
				}
			}
		}
	}

	/**
	 * Validates directory path.
	 * @private
	 */
	validatePath_Directory(path, field, required = true) {
		if (!path) {
			if (required) {
				this.addError("path", `Field '${field}' is required`);
			}
			return;
		}

		if (typeof path !== "string") {
			this.addError("path", `Field '${field}' must be a string`);
			return;
		}

		// Basic path validation (avoid filesystem access for security)
		if (path.includes("..") || path.includes("\0")) {
			this.addError(
				"security",
				`Field '${field}' contains invalid path characters`,
			);
		}
	}

	/**
	 * Sanitizes cache configuration.
	 * @private
	 */
	sanitizeCache(cache) {
		const sanitized = {};

		if (typeof cache.ttl === "number" && cache.ttl > 0) {
			sanitized.ttl = Math.min(cache.ttl, 3600000);
		}

		if (typeof cache.maxSize === "number" && cache.maxSize > 0) {
			sanitized.maxSize = Math.min(cache.maxSize, 100000);
		}

		if (typeof cache.enabled === "boolean") {
			sanitized.enabled = cache.enabled;
		}

		return sanitized;
	}

	/**
	 * Sanitizes security configuration.
	 * @private
	 */
	sanitizeSecurity(security) {
		const sanitized = {};

		if (typeof security.maxDepth === "number" && security.maxDepth > 0) {
			sanitized.maxDepth = Math.min(security.maxDepth, 10);
		}

		if (Array.isArray(security.allowedExtensions)) {
			sanitized.allowedExtensions = security.allowedExtensions
				.filter((ext) => typeof ext === "string" && ext.startsWith("."))
				.slice(0, 50); // Limit array size
		}

		if (Array.isArray(security.blockedPatterns)) {
			sanitized.blockedPatterns = security.blockedPatterns
				.filter((pattern) => typeof pattern === "string")
				.slice(0, 100); // Limit array size
		}

		return sanitized;
	}

	/**
	 * Sanitizes performance configuration.
	 * @private
	 */
	sanitizePerformance(performance) {
		const sanitized = {};

		if (
			typeof performance.maxFileSize === "number" &&
			performance.maxFileSize > 0
		) {
			sanitized.maxFileSize = Math.min(
				performance.maxFileSize,
				100 * 1024 * 1024,
			);
		}

		if (
			typeof performance.streamThreshold === "number" &&
			performance.streamThreshold >= 0
		) {
			sanitized.streamThreshold = Math.min(
				performance.streamThreshold,
				10 * 1024 * 1024,
			);
		}

		if (typeof performance.enableCompression === "boolean") {
			sanitized.enableCompression = performance.enableCompression;
		}

		return sanitized;
	}

	/**
	 * Sanitizes path value.
	 * @private
	 */
	sanitizePath(path) {
		if (typeof path !== "string") return process.cwd();

		// Remove null bytes and normalize
		const cleaned = path.replace(/\0/g, "").trim();

		// Basic traversal prevention
		if (cleaned.includes("..") || cleaned.length > 1000) {
			return process.cwd();
		}

		return cleaned;
	}

	/**
	 * Adds validation error.
	 * @private
	 */
	addError(category, message) {
		this.errors.push({ category, message });
	}

	/**
	 * Adds validation warning.
	 * @private
	 */
	addWarning(category, message) {
		this.warnings.push({ category, message });
	}

	/**
	 * Checks if there are errors.
	 * @private
	 */
	hasErrors() {
		return this.errors.length > 0;
	}

	/**
	 * Creates validation result.
	 * @private
	 */
	createResult(valid, config) {
		// Determine if we should fall back to defaults or apply sanitization
		const hasSchemaErrors = this.errors.some(
			(err) => err.category === "schema",
		);
		const hasRangeErrors = this.errors.some((err) => err.category === "range");

		let finalConfig = config;

		if (!valid) {
			if (hasSchemaErrors) {
				// Type errors - fall back to defaults
				finalConfig = structuredClone(DEFAULT_CONFIG);
			} else if (hasRangeErrors) {
				// Range errors - apply sanitization to fix oversized values
				finalConfig = this.sanitize(config);
			}
		}

		return {
			valid,
			config: finalConfig,
			errors: [...this.errors],
			warnings: [...this.warnings],
		};
	}
}

/**
 * Creates a configuration validator with preset options.
 *
 * Provides factory function for common validator configurations optimized
 * for different use cases and environments.
 *
 * @param {string} [mode='flexible'] - Validation mode ('strict' | 'flexible')
 * @param {string} [environment] - Target environment
 * @returns {ConfigValidator} Configured validator instance
 *
 * @example
 * ```javascript
 * const strictValidator = createValidator('strict', 'production');
 * const flexibleValidator = createValidator('flexible', 'development');
 * ```
 */
export function createValidator(mode = "flexible", environment) {
	const strict = mode === "strict";
	return new ConfigValidator({ strict, environment });
}

/**
 * Validates configuration with default settings.
 *
 * Convenience function for quick configuration validation using default
 * validator settings optimized for most use cases.
 *
 * @param {Object} config - Configuration to validate
 * @param {Object} [options={}] - Validation options
 * @returns {Object} Validation result
 *
 * @example
 * ```javascript
 * const result = validateConfig({ mode: 'production' });
 * if (result.valid) {
 *   console.log('Valid configuration');
 * }
 * ```
 */
export function validateConfig(config, options = {}) {
	const validator = createValidator(options.mode, options.environment);
	return validator.validate(config);
}

/**
 * Global validator instance for common validation tasks.
 *
 * Pre-configured validator with flexible validation mode suitable for
 * most development scenarios with appropriate error tolerance.
 */
export const globalValidator = createValidator("flexible");

export default ConfigValidator;
