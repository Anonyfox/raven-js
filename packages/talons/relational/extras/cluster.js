/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Cluster-aware connection management for distributed environments.
 *
 * Provides intelligent connection distribution, failover handling,
 * and cluster topology awareness. Supports read/write splitting,
 * automatic failover, and load balancing across database nodes.
 */

import { connect as coreConnect } from "../core/client.js";
import { normalizeError } from "../core/errors.js";
import { generateId } from "../core/utils.js";

/**
 * @typedef {Object} ClusterNode
 * @property {string} id - Unique node identifier
 * @property {Object} config - Connection configuration
 * @property {string} role - Node role ('primary'|'replica'|'any')
 * @property {number} priority - Priority for selection (higher = preferred)
 * @property {number} weight - Weight for load balancing
 * @property {boolean} healthy - Current health status
 * @property {number} lastCheck - Last health check timestamp
 * @property {number} failCount - Consecutive failure count
 * @property {Object} [client] - Active client connection
 */

/**
 * @typedef {Object} ClusterConfig
 * @property {Array<ClusterNode>} nodes - Database nodes
 * @property {string} [strategy='round-robin'] - Load balancing strategy
 * @property {number} [healthCheckInterval=30000] - Health check interval (ms)
 * @property {number} [maxFailures=3] - Max failures before marking unhealthy
 * @property {number} [failoverTimeout=5000] - Failover timeout (ms)
 * @property {boolean} [autoFailover=true] - Enable automatic failover
 * @property {boolean} [readWriteSplit=false] - Enable read/write splitting
 */

/**
 * Load balancing strategies
 */
const STRATEGIES = {
	"round-robin": "round-robin",
	"weighted": "weighted",
	"least-connections": "least-connections",
	"priority": "priority",
};

/**
 * Cluster client for distributed database access
 */
export class ClusterClient {
	/**
	 * @param {ClusterConfig} config - Cluster configuration
	 */
	constructor(config) {
		this.config = {
			strategy: "round-robin",
			healthCheckInterval: 30000,
			maxFailures: 3,
			failoverTimeout: 5000,
			autoFailover: true,
			readWriteSplit: false,
			...config,
		};

		// Validate configuration
		if (!this.config.nodes || this.config.nodes.length === 0) {
			throw new Error("At least one node must be configured");
		}

		// Initialize nodes
		this.nodes = new Map();
		for (const nodeConfig of this.config.nodes) {
			const node = {
				id: nodeConfig.id || generateId(),
				config: nodeConfig.config,
				role: nodeConfig.role || "any",
				priority: nodeConfig.priority || 1,
				weight: nodeConfig.weight || 1,
				healthy: true,
				lastCheck: 0,
				failCount: 0,
				client: null,
				connections: 0,
				...nodeConfig,
			};
			this.nodes.set(node.id, node);
		}

		// State tracking
		this.currentIndex = 0;
		this.closed = false;
		this.healthCheckTimer = null;

		// Start health monitoring
		if (this.config.healthCheckInterval > 0) {
			this._startHealthChecks();
		}
	}

	/**
	 * Execute a query with cluster-aware routing
	 * @param {string} sql - SQL query
	 * @param {Array} [params=[]] - Query parameters
	 * @param {Object} [options={}] - Query options
	 * @returns {Promise<Object>} Query result
	 */
	async query(sql, params = [], options = {}) {
		const isWrite = this._isWriteQuery(sql);
		const node = await this._selectNode(isWrite, options);

		try {
			const client = await this._getClient(node);
			const result = await client.query(sql, params, options);

			// Track successful operation
			node.failCount = 0;
			node.connections++;

			return result;
		} catch (error) {
			await this._handleNodeError(node, error);
			throw error;
		}
	}

	/**
	 * Stream query results with cluster-aware routing
	 * @param {string} sql - SQL query
	 * @param {Array} [params=[]] - Query parameters
	 * @param {Object} [options={}] - Query options
	 * @returns {AsyncIterable<Object|Array>} Async iterable of rows
	 */
	async *stream(sql, params = [], options = {}) {
		const isWrite = this._isWriteQuery(sql);
		const node = await this._selectNode(isWrite, options);

		try {
			const client = await this._getClient(node);
			node.connections++;

			for await (const row of client.stream(sql, params, options)) {
				yield row;
			}

			// Track successful operation
			node.failCount = 0;
		} catch (error) {
			await this._handleNodeError(node, error);
			throw error;
		} finally {
			node.connections = Math.max(0, node.connections - 1);
		}
	}

	/**
	 * Prepare a statement with cluster-aware routing
	 * @param {string} sql - SQL query
	 * @param {Object} [options={}] - Prepare options
	 * @returns {Promise<Object>} Prepared statement
	 */
	async prepare(sql, options = {}) {
		const isWrite = this._isWriteQuery(sql);
		const node = await this._selectNode(isWrite, options);

		try {
			const client = await this._getClient(node);
			const stmt = await client.prepare(sql, options);

			// Track successful operation
			node.failCount = 0;
			node.connections++;

			// Wrap statement to track node usage
			return this._wrapStatement(stmt, node);
		} catch (error) {
			await this._handleNodeError(node, error);
			throw error;
		}
	}

	/**
	 * Execute transaction with cluster-aware routing
	 * @param {Function} callback - Transaction callback
	 * @param {Object} [options={}] - Transaction options
	 * @returns {Promise<*>} Transaction result
	 */
	async transaction(callback, options = {}) {
		// Transactions always go to primary nodes
		const node = await this._selectNode(true, options);

		try {
			const client = await this._getClient(node);
			const result = await client.transaction(callback, options);

			// Track successful operation
			node.failCount = 0;
			node.connections++;

			return result;
		} catch (error) {
			await this._handleNodeError(node, error);
			throw error;
		} finally {
			node.connections = Math.max(0, node.connections - 1);
		}
	}

	/**
	 * Get cluster health status
	 * @returns {Object} Health status
	 */
	getHealth() {
		const nodes = Array.from(this.nodes.values());
		const healthy = nodes.filter((n) => n.healthy);
		const unhealthy = nodes.filter((n) => !n.healthy);

		return {
			totalNodes: nodes.length,
			healthyNodes: healthy.length,
			unhealthyNodes: unhealthy.length,
			nodes: nodes.map((node) => ({
				id: node.id,
				role: node.role,
				healthy: node.healthy,
				failCount: node.failCount,
				connections: node.connections,
				lastCheck: node.lastCheck,
			})),
		};
	}

	/**
	 * Force health check on all nodes
	 * @returns {Promise<void>}
	 */
	async checkHealth() {
		const checks = Array.from(this.nodes.values()).map((node) =>
			this._checkNodeHealth(node),
		);
		await Promise.allSettled(checks);
	}

	/**
	 * Close all connections
	 */
	async close() {
		this.closed = true;

		// Stop health checks
		if (this.healthCheckTimer) {
			clearInterval(this.healthCheckTimer);
			this.healthCheckTimer = null;
		}

		// Close all client connections
		const closePromises = [];
		for (const node of this.nodes.values()) {
			if (node.client) {
				closePromises.push(
					node.client.close().catch(() => {
						/* ignore errors */
					}),
				);
				node.client = null;
			}
		}

		await Promise.allSettled(closePromises);
	}

	/**
	 * Select appropriate node for operation
	 * @param {boolean} isWrite - Whether this is a write operation
	 * @param {Object} options - Operation options
	 * @returns {Promise<ClusterNode>} Selected node
	 * @private
	 */
	async _selectNode(isWrite, options) {
		if (this.closed) {
			throw new Error("Cluster client has been closed");
		}

		// Filter nodes based on operation type and health
		let candidates = Array.from(this.nodes.values()).filter((node) => {
			if (!node.healthy) return false;

			if (this.config.readWriteSplit) {
				if (isWrite && node.role === "replica") return false;
				if (!isWrite && node.role === "primary" && this._hasReplicas()) {
					return false;
				}
			}

			return true;
		});

		if (candidates.length === 0) {
			// No healthy nodes available - try failover if enabled
			if (this.config.autoFailover) {
				await this._attemptFailover(isWrite);
				candidates = Array.from(this.nodes.values()).filter((node) => {
					return node.healthy && this._nodeMatchesOperation(node, isWrite);
				});
			}

			if (candidates.length === 0) {
				throw new Error("No healthy database nodes available");
			}
		}

		// Apply load balancing strategy
		return this._applyStrategy(candidates, options);
	}

	/**
	 * Apply load balancing strategy
	 * @param {Array<ClusterNode>} candidates - Available nodes
	 * @param {Object} options - Operation options
	 * @returns {ClusterNode} Selected node
	 * @private
	 */
	_applyStrategy(candidates, options) {
		switch (this.config.strategy) {
			case STRATEGIES["round-robin"]:
				return this._roundRobinSelect(candidates);

			case STRATEGIES.weighted:
				return this._weightedSelect(candidates);

			case STRATEGIES["least-connections"]:
				return this._leastConnectionsSelect(candidates);

			case STRATEGIES.priority:
				return this._prioritySelect(candidates);

			default:
				return candidates[0];
		}
	}

	/**
	 * Round-robin node selection
	 * @param {Array<ClusterNode>} candidates - Available nodes
	 * @returns {ClusterNode} Selected node
	 * @private
	 */
	_roundRobinSelect(candidates) {
		const node = candidates[this.currentIndex % candidates.length];
		this.currentIndex = (this.currentIndex + 1) % candidates.length;
		return node;
	}

	/**
	 * Weighted node selection
	 * @param {Array<ClusterNode>} candidates - Available nodes
	 * @returns {ClusterNode} Selected node
	 * @private
	 */
	_weightedSelect(candidates) {
		const totalWeight = candidates.reduce((sum, node) => sum + node.weight, 0);
		let random = Math.random() * totalWeight;

		for (const node of candidates) {
			random -= node.weight;
			if (random <= 0) {
				return node;
			}
		}

		return candidates[0];
	}

	/**
	 * Least connections node selection
	 * @param {Array<ClusterNode>} candidates - Available nodes
	 * @returns {ClusterNode} Selected node
	 * @private
	 */
	_leastConnectionsSelect(candidates) {
		return candidates.reduce((min, node) =>
			node.connections < min.connections ? node : min,
		);
	}

	/**
	 * Priority-based node selection
	 * @param {Array<ClusterNode>} candidates - Available nodes
	 * @returns {ClusterNode} Selected node
	 * @private
	 */
	_prioritySelect(candidates) {
		return candidates.reduce((max, node) =>
			node.priority > max.priority ? node : max,
		);
	}

	/**
	 * Get or create client for node
	 * @param {ClusterNode} node - Database node
	 * @returns {Promise<Object>} Client connection
	 * @private
	 */
	async _getClient(node) {
		if (!node.client) {
			node.client = await coreConnect(node.config);
		}
		return node.client;
	}

	/**
	 * Handle node error
	 * @param {ClusterNode} node - Failed node
	 * @param {Error} error - Error that occurred
	 * @private
	 */
	async _handleNodeError(node, error) {
		node.failCount++;
		node.connections = Math.max(0, node.connections - 1);

		// Mark node as unhealthy if too many failures
		if (node.failCount >= this.config.maxFailures) {
			node.healthy = false;
			node.lastCheck = Date.now();

			// Close client connection
			if (node.client) {
				try {
					await node.client.close();
				} catch {
					// Ignore close errors
				}
				node.client = null;
			}
		}
	}

	/**
	 * Wrap statement to track node usage
	 * @param {Object} stmt - Prepared statement
	 * @param {ClusterNode} node - Associated node
	 * @returns {Object} Wrapped statement
	 * @private
	 */
	_wrapStatement(stmt, node) {
		return {
			...stmt,
			execute: async (...args) => {
				try {
					const result = await stmt.execute(...args);
					node.failCount = 0;
					return result;
				} catch (error) {
					await this._handleNodeError(node, error);
					throw error;
				}
			},
			stream: async function* (...args) {
				try {
					for await (const row of stmt.stream(...args)) {
						yield row;
					}
					node.failCount = 0;
				} catch (error) {
					await this._handleNodeError(node, error);
					throw error;
				}
			},
			close: async () => {
				node.connections = Math.max(0, node.connections - 1);
				return stmt.close();
			},
		};
	}

	/**
	 * Start health check monitoring
	 * @private
	 */
	_startHealthChecks() {
		this.healthCheckTimer = setInterval(async () => {
			if (this.closed) return;

			const checks = Array.from(this.nodes.values()).map((node) =>
				this._checkNodeHealth(node),
			);
			await Promise.allSettled(checks);
		}, this.config.healthCheckInterval);
	}

	/**
	 * Check health of a single node
	 * @param {ClusterNode} node - Node to check
	 * @private
	 */
	async _checkNodeHealth(node) {
		try {
			const client = await this._getClient(node);
			await client.query("SELECT 1", [], { timeoutMs: 5000 });

			// Node is healthy
			if (!node.healthy) {
				node.healthy = true;
				node.failCount = 0;
			}
			node.lastCheck = Date.now();
		} catch (error) {
			await this._handleNodeError(node, error);
		}
	}

	/**
	 * Attempt failover recovery
	 * @param {boolean} isWrite - Whether this is a write operation
	 * @private
	 */
	async _attemptFailover(isWrite) {
		// Try to recover unhealthy nodes
		const unhealthyNodes = Array.from(this.nodes.values()).filter(
			(node) => !node.healthy,
		);

		const recoveryPromises = unhealthyNodes.map((node) =>
			this._attemptNodeRecovery(node),
		);

		await Promise.allSettled(recoveryPromises);
	}

	/**
	 * Attempt to recover a failed node
	 * @param {ClusterNode} node - Node to recover
	 * @private
	 */
	async _attemptNodeRecovery(node) {
		try {
			// Close existing client if any
			if (node.client) {
				try {
					await node.client.close();
				} catch {
					// Ignore close errors
				}
				node.client = null;
			}

			// Try to establish new connection
			const client = await coreConnect(node.config);
			await client.query("SELECT 1", [], { timeoutMs: this.config.failoverTimeout });

			// Recovery successful
			node.client = client;
			node.healthy = true;
			node.failCount = 0;
			node.lastCheck = Date.now();
		} catch (error) {
			// Recovery failed - keep node unhealthy
			node.failCount++;
		}
	}

	/**
	 * Check if query is a write operation
	 * @param {string} sql - SQL query
	 * @returns {boolean} True if write operation
	 * @private
	 */
	_isWriteQuery(sql) {
		const writePatterns = [
			/^\s*INSERT\s/i,
			/^\s*UPDATE\s/i,
			/^\s*DELETE\s/i,
			/^\s*CREATE\s/i,
			/^\s*DROP\s/i,
			/^\s*ALTER\s/i,
			/^\s*TRUNCATE\s/i,
			/^\s*REPLACE\s/i,
		];

		return writePatterns.some((pattern) => pattern.test(sql));
	}

	/**
	 * Check if node matches operation type
	 * @param {ClusterNode} node - Node to check
	 * @param {boolean} isWrite - Whether this is a write operation
	 * @returns {boolean} True if node matches
	 * @private
	 */
	_nodeMatchesOperation(node, isWrite) {
		if (!this.config.readWriteSplit) return true;

		if (isWrite && node.role === "replica") return false;
		if (!isWrite && node.role === "primary" && this._hasReplicas()) {
			return false;
		}

		return true;
	}

	/**
	 * Check if cluster has replica nodes
	 * @returns {boolean} True if has replicas
	 * @private
	 */
	_hasReplicas() {
		return Array.from(this.nodes.values()).some(
			(node) => node.role === "replica" && node.healthy,
		);
	}
}

/**
 * Create cluster client
 * @param {ClusterConfig} config - Cluster configuration
 * @returns {ClusterClient} Cluster client instance
 */
export function createCluster(config) {
	return new ClusterClient(config);
}
