/**
 * Unified server configuration options for all server implementations.
 *
 * This single configuration object supports both basic HTTP server options
 * and advanced clustering options for production deployments. Clustering
 * options are optional and only used by ClusteredServer implementations.
 *
 * **Base HTTP Options:**
 * - `timeout`: Request timeout in milliseconds
 * - `keepAlive`: Enable HTTP keep-alive connections
 * - `keepAliveTimeout`: Keep-alive timeout in milliseconds
 * - `maxHeadersCount`: Maximum number of headers allowed per request
 *
 * **Clustering Options (optional):**
 * - `workers`: Number of worker processes to spawn
 * - `healthCheckInterval`: Health check interval in milliseconds
 * - `maxRestarts`: Maximum worker restarts before giving up
 * - `restartWindow`: Time window for restart counting in milliseconds
 * - `gracefulShutdownTimeout`: Timeout for graceful shutdown in milliseconds
 *
 * **Performance impact:**
 * - `timeout`: Affects memory usage and connection cleanup
 * - `keepAlive`: Reduces connection overhead for multiple requests
 * - `keepAliveTimeout`: Balances resource usage vs connection reuse
 * - `maxHeadersCount`: Prevents memory exhaustion attacks
 * - `workers`: Controls horizontal scaling across CPU cores
 * - `healthCheckInterval`: Monitors worker health and detects stuck workers
 *
 * **Security considerations:**
 * - `maxHeadersCount`: Protects against header-based attacks
 * - `timeout`: Prevents slow-loris attacks
 * - `keepAliveTimeout`: Limits resource consumption per connection
 *
 * **Recommended values by use case:**
 * - **Development**: Use defaults, clustering options not needed
 * - **Production**: Enable clustering options, increase timeout, limit headers
 * - **High-traffic**: Optimize keepAliveTimeout, strict header limits, more workers
 * - **Security-focused**: Lower timeouts, strict header limits, fewer workers
 *
 * @typedef {Object} ServerOptions
 * @property {number} [timeout=30000] - Request timeout in milliseconds. Prevents hanging connections and resource exhaustion. Higher values allow longer-running requests but consume more resources.
 * @property {boolean} [keepAlive=true] - Enable HTTP keep-alive connections. Reduces connection overhead for multiple requests from the same client. Disable only if clients don't support keep-alive.
 * @property {number} [keepAliveTimeout=5000] - Keep-alive timeout in milliseconds. How long to keep idle connections open. Lower values free resources faster, higher values reduce connection overhead.
 * @property {number} [maxHeadersCount=2000] - Maximum number of headers allowed per request. Protects against header-based attacks. Lower values are more secure but may break some clients.
 * @property {number} [websocketPort=3456] - WebSocket server port for development features like live reload (DevServer only). Ignored by other server implementations.
 * @property {string} [sslCertificate] - SSL certificate in PEM format. When provided with sslPrivateKey, enables HTTPS mode. Server will use https.createServer() instead of http.createServer().
 * @property {string} [sslPrivateKey] - SSL private key in PEM format. When provided with sslCertificate, enables HTTPS mode. Server will use https.createServer() instead of http.createServer().
 * @property {number} [workers] - Number of worker processes to spawn (clustering only). Defaults to available CPU cores when clustering is enabled. Ignored by single-process servers.
 * @property {number} [healthCheckInterval=30000] - Health check interval in milliseconds (clustering only). Monitors worker health and detects stuck workers. Ignored by single-process servers.
 * @property {number} [maxRestarts=5] - Maximum worker restarts before giving up (clustering only). Prevents infinite restart loops from crashing workers. Ignored by single-process servers.
 * @property {number} [restartWindow=60000] - Time window for restart counting in milliseconds (clustering only). Allows worker recovery after temporary issues. Ignored by single-process servers.
 * @property {number} [gracefulShutdownTimeout=30000] - Timeout for graceful shutdown in milliseconds (clustering only). Ensures zero-downtime deployments. Ignored by single-process servers.
 *
 * @example
 * ```javascript
 * // Development configuration (NodeHttp)
 * const devOptions = {
 *   timeout: 30000,        // 30s timeout
 *   keepAlive: true,       // Enable keep-alive
 *   keepAliveTimeout: 5000, // 5s keep-alive timeout
 *   maxHeadersCount: 2000   // Allow 2000 headers
 * };
 *
 * // Development configuration with live reload (DevServer)
 * const devServerOptions = {
 *   timeout: 30000,        // 30s timeout
 *   keepAlive: true,       // Enable keep-alive
 *   keepAliveTimeout: 5000, // 5s keep-alive timeout
 *   maxHeadersCount: 2000,  // Allow 2000 headers
 *   websocketPort: 3456    // WebSocket port for live reload
 * };
 *
 * // Production configuration (ClusteredServer)
 * const prodOptions = {
 *   // HTTP options
 *   timeout: 60000,         // 60s timeout for complex requests
 *   keepAlive: true,        // Enable keep-alive for performance
 *   keepAliveTimeout: 10000, // 10s keep-alive timeout
 *   maxHeadersCount: 1000,   // Stricter header limits
 *
 *   // Clustering options
 *   workers: 4,                    // Use 4 CPU cores
 *   healthCheckInterval: 30000,   // 30s health checks
 *   maxRestarts: 5,               // Max 5 restarts per worker
 *   restartWindow: 60000,         // 1 minute restart window
 *   gracefulShutdownTimeout: 30000 // 30s graceful shutdown
 * };
 *
 * // High-performance configuration
 * const perfOptions = {
 *   // HTTP options
 *   timeout: 30000,         // Shorter timeout for faster failure
 *   keepAlive: true,        // Enable keep-alive
 *   keepAliveTimeout: 3000, // Shorter keep-alive for high throughput
 *   maxHeadersCount: 500,   // Very strict header limits
 *
 *   // Clustering options
 *   workers: 8,                    // Use 8 CPU cores
 *   healthCheckInterval: 15000,   // 15s health checks
 *   maxRestarts: 10,              // More restart attempts
 *   restartWindow: 120000,        // 2 minute restart window
 *   gracefulShutdownTimeout: 60000 // 60s graceful shutdown
 * };
 *
 * // Security-focused configuration
 * const secureOptions = {
 *   // HTTP options
 *   timeout: 15000,         // Short timeout to prevent attacks
 *   keepAlive: false,       // Disable keep-alive for security
 *   keepAliveTimeout: 0,    // Not used when keepAlive is false
 *   maxHeadersCount: 100,   // Very strict header limits
 *
 *   // Clustering options
 *   workers: 2,                    // Fewer workers for stability
 *   healthCheckInterval: 60000,   // 60s health checks
 *   maxRestarts: 3,               // Fewer restart attempts
 *   restartWindow: 300000,        // 5 minute restart window
 *   gracefulShutdownTimeout: 120000 // 2 minute graceful shutdown
 * };
 *
 * // HTTPS configuration (requires both certificate and private key)
 * const httpsOptions = {
 *   // HTTP options
 *   timeout: 30000,         // Standard timeout
 *   keepAlive: true,        // Enable keep-alive
 *   keepAliveTimeout: 5000, // Standard keep-alive timeout
 *   maxHeadersCount: 2000,  // Standard header limits
 *
 *   // SSL options
 *   sslCertificate: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
 *   sslPrivateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
 * };
 * ```
 */

/**
 * Cluster statistics and status information.
 *
 * Provides real-time information about the cluster's health and performance
 * for monitoring and debugging purposes.
 *
 * @typedef {Object} ClusterStats
 * @property {number} primaryPid - Primary process PID
 * @property {number} activeWorkers - Number of currently active workers
 * @property {number} targetWorkers - Target number of workers
 * @property {string[]} workerIds - Array of active worker IDs
 * @property {number} healthTimers - Number of active health check timers
 * @property {number} restartCounters - Number of worker restart counters
 * @property {boolean} shuttingDown - Whether the cluster is shutting down
 *
 * @example
 * ```javascript
 * const stats = server.getClusterStats();
 * console.log(`Active workers: ${stats.activeWorkers}/${stats.targetWorkers}`);
 * console.log(`Worker IDs: ${stats.workerIds.join(', ')}`);
 * console.log(`Shutting down: ${stats.shuttingDown}`);
 * ```
 */
