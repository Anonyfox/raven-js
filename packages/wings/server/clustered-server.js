import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { Router } from "../core/index.js";
import { NodeHttp } from "./node-http.js";

// Import shared types
import "./server-options.js";

/**
 * Production clustered server for Wings with automatic scaling and crash recovery.
 *
 * Uses all CPU cores for horizontal scaling. Automatically restarts crashed workers
 * to maintain uptime. Zero logging by default to prevent disk filling.
 *
 * @extends {NodeHttp}
 */
export class ClusteredServer extends NodeHttp {
	/**
	 * Active worker count.
	 * @type {number}
	 */
	#activeWorkers = 0;

	/**
	 * Target worker count.
	 * @type {number}
	 */
	#targetWorkers = 0;

	/**
	 * Health monitoring timers.
	 * @type {Map<number, NodeJS.Timeout>}
	 */
	#healthTimers = new Map();

	/**
	 * Shutdown flag.
	 * @type {boolean}
	 */
	#shuttingDown = false;

	/**
	 * Worker restart counters.
	 * @type {Map<number, { count: number, lastRestart: number }>}
	 */
	#restartCounters = new Map();

	/**
	 * Cluster configuration.
	 * @type {import('./server-options.js').ServerOptions}
	 */
	#clusterOptions;

	/**
	 * Cluster event listeners.
	 * @type {Array<{event: string, listener: (...args: any[]) => void}>}
	 */
	#clusterListeners = [];

	/**
	 * Create clustered server instance.
	 *
	 * @param {Router} router - Wings router
	 * @param {import('./server-options.js').ServerOptions} [options] - Configuration
	 */
	constructor(router, options = {}) {
		const opts = options || {};

		const {
			workers,
			healthCheckInterval,
			maxRestarts,
			restartWindow,
			gracefulShutdownTimeout,
			...httpOptions
		} = opts;

		super(router, httpOptions);

		this.#clusterOptions = {
			workers: workers ?? availableParallelism(),
			healthCheckInterval: healthCheckInterval ?? 30000,
			maxRestarts: maxRestarts ?? 5,
			restartWindow: restartWindow ?? 60000,
			gracefulShutdownTimeout: gracefulShutdownTimeout ?? 30000,
		};

		this.#targetWorkers = this.#clusterOptions.workers;
	}

	/**
	 * Start clustered server with worker management.
	 *
	 * @param {number} port - Port to listen on
	 * @param {string} [host] - Host to bind to (default: '0.0.0.0')
	 * @returns {Promise<void>}
	 */
	async listen(port, host = "0.0.0.0") {
		if (cluster.isPrimary) {
			await this.#startPrimary(port, host);
		} else {
			await super.listen(port, host);
		}
	}

	/**
	 * Gracefully shut down clustered server.
	 *
	 * @returns {Promise<void>}
	 */
	async close() {
		if (cluster.isPrimary) {
			await this.#shutdownPrimary();
			try {
				return await super.close();
			} catch (error) {
				if (error.code !== "ERR_SERVER_NOT_RUNNING") {
					throw error;
				}
			}
		} else {
			return super.close();
		}
	}

	/**
	 * Start primary process and manage workers.
	 *
	 * @param {number} _port - Port to listen on
	 * @param {string} _host - Host to bind to
	 */
	async #startPrimary(_port, _host) {
		this.#setupShutdownHandlers();

		for (let i = 0; i < this.#targetWorkers; i++) {
			this.#forkWorker();
		}

		const listeningListener = (
			/** @type {any} */ worker,
			/** @type {any} */ _address,
		) => {
			this.#activeWorkers++;
			this.#startHealthCheck(worker);
		};
		const exitListener = (
			/** @type {any} */ worker,
			/** @type {any} */ code,
			/** @type {any} */ signal,
		) => {
			this.#handleWorkerExit(worker, code, signal);
		};
		const disconnectListener = (/** @type {any} */ worker) => {
			this.#handleWorkerDisconnect(worker);
		};

		cluster.on("listening", listeningListener);
		cluster.on("exit", exitListener);
		cluster.on("disconnect", disconnectListener);

		this.#clusterListeners = [
			{ event: "listening", listener: listeningListener },
			{ event: "exit", listener: exitListener },
			{ event: "disconnect", listener: disconnectListener },
		];
	}

	/**
	 * Fork new worker process.
	 */
	#forkWorker() {
		if (this.#shuttingDown) return;

		const worker = cluster.fork();
		this.#restartCounters.set(worker.id, { count: 0, lastRestart: Date.now() });
	}

	/**
	 * Handle worker exit events.
	 *
	 * @param {any} worker - Exited worker
	 * @param {number} _code - Exit code
	 * @param {string} _signal - Exit signal
	 */
	#handleWorkerExit(worker, _code, _signal) {
		this.#activeWorkers--;
		this.#stopHealthCheck(worker);

		if (!worker || !worker.id) return;

		const counter = this.#restartCounters.get(worker.id);
		if (!counter) return;

		const now = Date.now();
		const timeSinceLastRestart = now - counter.lastRestart;

		if (timeSinceLastRestart > this.#clusterOptions.restartWindow) {
			counter.count = 0;
		}

		counter.count++;
		counter.lastRestart = now;

		if (
			counter.count <= this.#clusterOptions.maxRestarts &&
			!this.#shuttingDown
		) {
			this.#forkWorker();
		} else if (counter.count > this.#clusterOptions.maxRestarts) {
			console.error(
				`Worker ${worker.id} crashed too many times. Not restarting.`,
			);
			this.#restartCounters.delete(worker.id);
		}
	}

	/**
	 * Handle worker disconnect events.
	 *
	 * @param {any} worker - Disconnected worker
	 */
	#handleWorkerDisconnect(worker) {
		if (!worker || !worker.id) return;

		this.#stopHealthCheck(worker);
	}

	/**
	 * Start health monitoring for worker.
	 *
	 * @param {any} worker - Worker to monitor
	 */
	#startHealthCheck(worker) {
		const timer = setInterval(() => {
			if (worker.isDead()) {
				this.#stopHealthCheck(worker);
				return;
			}

			worker.send({ type: "health_check" });
		}, this.#clusterOptions.healthCheckInterval);

		this.#healthTimers.set(worker.id, timer);
	}

	/**
	 * Stop health monitoring for worker.
	 *
	 * @param {any} worker - Worker to stop monitoring
	 */
	#stopHealthCheck(worker) {
		if (!worker || !worker.id) return;

		const timer = this.#healthTimers.get(worker.id);
		if (timer) {
			clearInterval(timer);
			this.#healthTimers.delete(worker.id);
		}
	}

	/**
	 * Set up graceful shutdown handlers.
	 */
	#setupShutdownHandlers() {
		const shutdown = async (/** @type {string} */ _signal) => {
			if (this.#shuttingDown) return;

			this.#shuttingDown = true;

			try {
				await this.#shutdownPrimary();
				process.exit(0);
			} catch (_error) {
				console.error("Error during shutdown:", _error);
				process.exit(1);
			}
		};

		process.on("SIGTERM", () => shutdown("SIGTERM"));
		process.on("SIGINT", () => shutdown("SIGINT"));
	}

	/**
	 * Clean up cluster event listeners.
	 */
	#cleanupClusterListeners() {
		for (const { event, listener } of this.#clusterListeners) {
			cluster.removeListener(event, listener);
		}
		this.#clusterListeners = [];
	}

	/**
	 * Shutdown primary process and all workers.
	 *
	 * @returns {Promise<void>}
	 */
	async #shutdownPrimary() {
		this.#shuttingDown = true;

		for (const [_workerId, timer] of this.#healthTimers) {
			clearInterval(timer);
		}
		this.#healthTimers.clear();

		this.#cleanupClusterListeners();

		for (const [_id, worker] of Object.entries(cluster.workers)) {
			if (worker && !worker.isDead()) {
				worker.kill("SIGKILL");
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	/**
	 * Get current cluster statistics.
	 *
	 * @returns {import('./server-options.js').ClusterStats} Cluster status
	 */
	getClusterStats() {
		if (!cluster.isPrimary) {
			throw new Error("Cluster stats only available on primary process");
		}

		return {
			primaryPid: process.pid,
			activeWorkers: this.#activeWorkers,
			targetWorkers: this.#targetWorkers,
			workerIds: Object.keys(cluster.workers || {}),
			healthTimers: this.#healthTimers.size,
			restartCounters: this.#restartCounters.size,
			shuttingDown: this.#shuttingDown,
		};
	}
}
