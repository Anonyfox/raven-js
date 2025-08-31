/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Server configuration options and cluster statistics types.
 *
 * Unified configuration for HTTP servers and clustering with performance,
 * security, and scaling options. Includes type definitions for monitoring
 * cluster health and worker statistics.
 */

/**
 * @typedef {Object} ClusterStats
 * @property {number} activeWorkers - Number of currently active worker processes
 * @property {number} targetWorkers - Target number of worker processes
 * @property {number[]} workerIds - Array of active worker process IDs
 * @property {boolean} shuttingDown - Whether cluster is in shutdown mode
 * @property {number} totalRequests - Total requests processed across all workers
 * @property {number} averageResponseTime - Average response time in milliseconds
 * @property {Date} startTime - Cluster start time
 * @property {number} restartCount - Total number of worker restarts
 *
 * @example
 * // Monitor cluster health and performance
 * const stats = server.getClusterStats();
 * console.log(`Active: ${stats.activeWorkers}/${stats.targetWorkers}`);
 */

/**
 * @typedef {Object} ServerOptions
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {boolean} [keepAlive] - Enable HTTP keep-alive connections
 * @property {number} [keepAliveTimeout] - Keep-alive timeout in milliseconds
 * @property {number} [maxHeadersCount] - Maximum number of headers allowed per request
 * @property {number} [workers] - Number of worker processes to spawn
 * @property {number} [healthCheckInterval] - Health check interval in milliseconds
 * @property {number} [maxRestarts] - Maximum worker restarts before giving up
 * @property {number} [restartWindow] - Time window for restart counting in milliseconds
 * @property {number} [gracefulShutdownTimeout] - Timeout for graceful shutdown in milliseconds
 * @property {Object} [sslCertificate] - SSL certificate configuration
 * @property {string} [sslPrivateKey] - SSL private key
 * @property {number} [websocketPort] - WebSocket port for development server
 */
