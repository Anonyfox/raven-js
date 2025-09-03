/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file DSN parser, TLS heuristics, and configuration defaults for database connections.
 *
 * Provides intelligent configuration parsing and merging with sensible defaults.
 * Handles DSN/URI parsing for PostgreSQL, MySQL, and SQLite with automatic TLS detection.
 * Implements the "just works" philosophy with minimal configuration required.
 */

/**
 * @typedef {Object} DatabaseConfig
 * @property {string} [driver] - Database driver ('pg'|'mysql'|'sqlite-node'|'sqlite-wasm')
 * @property {string} [host] - Database host
 * @property {number} [port] - Database port
 * @property {string} [user] - Username
 * @property {string} [password] - Password
 * @property {string} [database] - Database name
 * @property {string|boolean} [tls] - TLS mode ('require'|'verify'|'disable'|true|false)
 * @property {number} [connectTimeoutMs] - Connection timeout in milliseconds
 * @property {number} [timeoutMs] - Query timeout in milliseconds
 * @property {boolean} [dateAsString] - Return dates as strings instead of Date objects
 * @property {string} [bigint] - How to handle bigint values ('bigint'|'string')
 * @property {string} [json] - How to handle JSON values ('parse'|'string')
 * @property {string|boolean|Object} [pool] - Pool configuration
 * @property {Object} [wasm] - WASM engine for sqlite-wasm driver
 */

/**
 * @typedef {Object} PoolConfig
 * @property {number} max - Maximum connections
 * @property {number} min - Minimum connections
 * @property {number} idleMs - Idle timeout in milliseconds
 * @property {number} acquireMs - Acquire timeout in milliseconds
 */

/**
 * Default configuration values
 */
const DEFAULTS = {
	connectTimeoutMs: 10_000,
	dateAsString: true,
	bigint: "bigint",
	json: "parse",
	pool: "auto",
};

/**
 * Default pool configurations by driver type
 */
const DEFAULT_POOL_CONFIGS = {
	sqlite: false, // SQLite serializes internally, no pooling needed
	network: {
		max: 6,
		min: 0,
		idleMs: 30_000,
		acquireMs: 10_000,
	},
};

/**
 * Localhost addresses that should default to TLS disabled
 */
const LOCALHOST_ADDRESSES = new Set([
	"localhost",
	"127.0.0.1",
	"::1",
	"0.0.0.0",
]);

/**
 * Parse a database DSN/URI into configuration object
 * @param {string} dsn - Database connection string
 * @returns {DatabaseConfig} Parsed configuration
 * @throws {Error} If DSN format is invalid
 */
export function parseDsn(dsn) {
	if (typeof dsn !== "string" || !dsn) {
		throw new Error("DSN must be a non-empty string");
	}

	try {
		const url = new URL(dsn);
		const config = {};

		// Determine driver from protocol
		switch (url.protocol) {
			case "postgres:":
			case "postgresql:":
				config.driver = "pg";
				config.port = url.port ? Number.parseInt(url.port, 10) : 5432;
				break;
			case "mysql:":
				config.driver = "mysql";
				config.port = url.port ? Number.parseInt(url.port, 10) : 3306;
				break;
			case "sqlite:":
				config.driver = "sqlite-node";
				if (url.pathname === "mem" || url.pathname === ":memory:") {
					config.database = ":memory:";
				} else if (url.pathname.startsWith("file:")) {
					config.database = url.pathname.slice(5); // Remove 'file:' prefix
				} else {
					config.database = url.pathname;
				}
				return config; // SQLite doesn't need host/port/user/password
			case "sqlite+wasm:":
				config.driver = "sqlite-wasm";
				return config; // WASM SQLite is configured via options
			default:
				throw new Error(`Unsupported protocol: ${url.protocol}`);
		}

		// Parse network database connection details
		if (url.hostname) config.host = url.hostname;
		if (url.username) config.user = url.username;
		if (url.password) config.password = url.password;
		if (url.pathname && url.pathname !== "/") {
			config.database = url.pathname.slice(1); // Remove leading slash
		}

		// Parse query parameters for additional configuration
		for (const [key, value] of url.searchParams) {
			switch (key) {
				case "sslmode":
					config.tls =
						value === "disable"
							? "disable"
							: value === "verify-full"
								? "verify"
								: "require";
					break;
				case "ssl":
					config.tls = value === "true" ? "require" : "disable";
					break;
				case "connect_timeout":
				case "connectTimeout":
					config.connectTimeoutMs = Number.parseInt(value, 10) * 1000;
					break;
				case "timeout":
					config.timeoutMs = Number.parseInt(value, 10) * 1000;
					break;
			}
		}

		return config;
	} catch (error) {
		throw new Error(`Invalid DSN format: ${error.message}`);
	}
}

/**
 * Determine appropriate TLS configuration based on host
 * @param {string} [host] - Database host
 * @param {string|boolean} [explicitTls] - Explicit TLS setting
 * @returns {string} TLS mode ('require'|'verify'|'disable')
 */
export function determineTlsMode(host, explicitTls) {
	// If explicitly set, respect the setting
	if (explicitTls === true || explicitTls === "require") return "require";
	if (explicitTls === false || explicitTls === "disable") return "disable";
	if (explicitTls === "verify") return "verify";

	// Auto-detect based on host
	if (!host || LOCALHOST_ADDRESSES.has(host.toLowerCase())) {
		return "disable"; // Localhost connections don't need TLS
	}

	return "require"; // Default to requiring TLS for remote connections
}

/**
 * Determine appropriate pool configuration
 * @param {string|boolean|Object} poolConfig - Pool configuration
 * @param {string} driver - Database driver
 * @returns {false|PoolConfig} Pool configuration or false if disabled
 */
export function determinePoolConfig(poolConfig, driver) {
	// Explicit disable
	if (poolConfig === false) return false;

	// SQLite doesn't need pooling
	if (driver === "sqlite-node" || driver === "sqlite-wasm") {
		return false;
	}

	// Explicit pool configuration
	if (typeof poolConfig === "object" && poolConfig !== null) {
		return {
			...DEFAULT_POOL_CONFIGS.network,
			...poolConfig,
		};
	}

	// Auto mode (default)
	return DEFAULT_POOL_CONFIGS.network;
}

/**
 * Merge configuration with defaults
 * @param {DatabaseConfig|string} config - Configuration object or DSN string
 * @param {DatabaseConfig} [options] - Additional options to merge
 * @returns {DatabaseConfig} Merged configuration
 */
export function mergeConfig(config, options = {}) {
	// Parse DSN if string provided
	const parsedConfig = typeof config === "string" ? parseDsn(config) : config;

	// Merge with defaults and options
	const merged = {
		...DEFAULTS,
		...parsedConfig,
		...options,
	};

	// Auto-detect driver if not specified
	if (!merged.driver) {
		if (merged.host) {
			// Default to PostgreSQL for network connections
			merged.driver = "pg";
			merged.port = merged.port || 5432;
		} else {
			throw new Error(
				"Cannot determine database driver - specify explicitly or use DSN",
			);
		}
	}

	// Determine TLS mode
	if (merged.driver === "pg" || merged.driver === "mysql") {
		merged.tls = determineTlsMode(merged.host, merged.tls);
	}

	// Determine pool configuration
	merged.pool = determinePoolConfig(merged.pool, merged.driver);

	return merged;
}

/**
 * Validate configuration object
 * @param {DatabaseConfig} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config) {
	if (!config || typeof config !== "object") {
		throw new Error("Configuration must be an object");
	}

	if (!config.driver) {
		throw new Error("Database driver must be specified");
	}

	const validDrivers = ["pg", "mysql", "sqlite-node", "sqlite-wasm"];
	if (!validDrivers.includes(config.driver)) {
		throw new Error(
			`Invalid driver: ${config.driver}. Must be one of: ${validDrivers.join(", ")}`,
		);
	}

	// Network drivers need host
	if ((config.driver === "pg" || config.driver === "mysql") && !config.host) {
		throw new Error(`${config.driver} driver requires host`);
	}

	// SQLite drivers need database path (except WASM)
	if (config.driver === "sqlite-node" && !config.database) {
		throw new Error("sqlite-node driver requires database path");
	}

	// WASM driver needs engine
	if (
		config.driver === "sqlite-wasm" &&
		(!config.wasm || !config.wasm.engine)
	) {
		throw new Error("sqlite-wasm driver requires wasm.engine");
	}

	// Validate numeric values
	if (
		config.port &&
		(!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
	) {
		throw new Error("Port must be an integer between 1 and 65535");
	}

	if (
		config.connectTimeoutMs &&
		(!Number.isInteger(config.connectTimeoutMs) || config.connectTimeoutMs < 1)
	) {
		throw new Error("connectTimeoutMs must be a positive integer");
	}

	if (
		config.timeoutMs &&
		(!Number.isInteger(config.timeoutMs) || config.timeoutMs < 1)
	) {
		throw new Error("timeoutMs must be a positive integer");
	}
}
