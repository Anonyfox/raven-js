/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main entry point for the @raven-js/talons/relational module.
 *
 * Provides a unified, high-performance relational database client with
 * support for PostgreSQL, MySQL, and SQLite. Features automatic connection
 * pooling, prepared statement caching, streaming results, and comprehensive
 * error handling across all database engines.
 */

export { connect } from "./core/client.js";
export { createCluster } from "./extras/cluster.js";
export { createDiagnostics, createHealthChecker, createAnalyzer } from "./extras/diagnostics.js";
export { createIntrospector } from "./extras/introspection.js";

// Re-export error codes for convenience
export { ERROR_CODES } from "./core/errors.js";
