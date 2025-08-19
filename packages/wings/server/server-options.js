/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} Unified server configuration options for all server implementations. This single configuration object supports both basic HTTP server options and advanced clustering options for production deployments. Clustering options are optional and only used by ClusteredServer implementations. **Base HTTP Options:** - `timeout`: Request timeout in milliseconds - `keepAlive`: Enable HTTP keep-alive connections - `keepAliveTimeout`: Keep-alive timeout in milliseconds - `maxHeadersCount`: Maximum number of headers allowed per request **Clustering Options (optional):** - `workers`: Number of worker processes to spawn - `healthCheckInterval`: Health check interval in milliseconds - `maxRestarts`: Maximum worker restarts before giving up - `restartWindow`: Time window for restart counting in milliseconds - `gracefulShutdownTimeout`: Timeout for graceful shutdown in milliseconds **Performance impact:** - `timeout`: Affects memory usage and connection cleanup - `keepAlive`: Reduces connection overhead for multiple requests - `keepAliveTimeout`: Balances resource usage vs connection reuse - `maxHeadersCount`: Prevents memory exhaustion attacks - `workers`: Controls horizontal scaling across CPU cores - `healthCheckInterval`: Monitors worker health and detects stuck workers **Security considerations:** - `maxHeadersCount`: Protects against header-based attacks - `timeout`: Prevents slow-loris attacks - `keepAliveTimeout`: Limits resource consumption per connection **Recommended values by use case:** - **Development**: Use defaults, clustering options not needed - **Production**: Enable clustering options, increase timeout, limit headers - **High-traffic**: Optimize keepAliveTimeout, strict header limits, more workers - **Security-focused**: Lower timeouts, strict header limits, fewer workers
 */

/**
 *
 * Cluster statistics and status information.
 * Provides real-time information about the cluster's health and performance
 * for monitoring and debugging purposes.
 * ```javascript
 * const stats = server.getClusterStats();
 * console.log(`Active workers: ${stats.activeWorkers}/${stats.targetWorkers}`);
 * console.log(`Worker IDs: ${stats.workerIds.join(', ')}`);
 * console.log(`Shutting down: ${stats.shuttingDown}`);
 * ```
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
