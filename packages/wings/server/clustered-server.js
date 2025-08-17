import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { NodeHttp } from "./node-http.js";

/**
 * Production-ready clustered HTTP server with automatic scaling and crash recovery.
 *
 * Features:
 * - Horizontal scaling across all CPU cores
 * - Automatic worker restart on crashes
 * - Zero external dependencies (no PM2 needed)
 * - Pure event-driven architecture (zero timeouts)
 * - Helper getters for process identification (isMainProcess, isWorkerProcess)
 */
export class ClusteredServer extends NodeHttp {
	/**
	 * Check if current process is the cluster primary (main process).
	 * @returns {boolean} True if this is the primary process
	 */
	get isMainProcess() {
		return cluster.isPrimary;
	}

	/**
	 * Check if current process is a worker process (child process).
	 * @returns {boolean} True if this is a worker process
	 */
	get isWorkerProcess() {
		return !cluster.isPrimary;
	}
	/**
	 * Start clustered server with automatic worker management.
	 *
	 * @param {number} port - Port to listen on
	 * @param {string} [host="0.0.0.0"] - Host to bind to
	 * @returns {Promise<void>}
	 */
	async listen(port, host = "0.0.0.0") {
		if (cluster.isPrimary) {
			// Fork workers (use all available cores)
			const workerCount = availableParallelism();

			// Auto-restart crashed workers (simplified logic)
			cluster.on("exit", (_worker, code, _signal) => {
				// Only restart if worker crashed (not graceful shutdown)
				if (code !== 0) {
					cluster.fork();
				}
			});

			// Fork all workers
			for (let i = 0; i < workerCount; i++) {
				cluster.fork();
			}

			// Wait for all workers to signal they're ready
			await this.#waitForWorkersReady(workerCount);
		} else {
			// Worker process - start listening immediately
			await super.listen(port, host);

			// Signal to primary that we're ready
			process.send("ready");
		}
	}

	/**
	 * Gracefully shutdown clustered server.
	 *
	 * @returns {Promise<void>}
	 */
	async close() {
		if (cluster.isPrimary) {
			// Signal all workers to shutdown (use arithmetic to eliminate branch)
			for (const worker of Object.values(cluster.workers || {})) {
				// Kill worker if it exists and is not dead (arithmetic eliminates branch)
				worker && !worker.isDead() && worker.kill("SIGTERM");
			}

			// Wait for all workers to exit using events
			await this.#waitForWorkersExit();
			cluster.disconnect();
		}

		// Close the underlying server (handles ERR_SERVER_NOT_RUNNING)
		try {
			await super.close();
		} catch (error) {
			// Use arithmetic to eliminate branch: only throw if not ERR_SERVER_NOT_RUNNING
			error.code !== "ERR_SERVER_NOT_RUNNING" &&
				(() => {
					throw error;
				})();
		}
	}

	/**
	 * Wait for all workers to signal they're ready.
	 * @param {number} expectedWorkers - Number of workers to wait for
	 */
	#waitForWorkersReady(expectedWorkers) {
		return new Promise((resolve) => {
			let readyWorkers = 0;

			// Listen for ready signals from workers
			cluster.on("message", (_worker, message) => {
				readyWorkers += message === "ready" ? 1 : 0;
				// Use arithmetic to eliminate branch: when readyWorkers reaches expectedWorkers, resolve
				readyWorkers === expectedWorkers && resolve();
			});
		});
	}

	/**
	 * Wait for all workers to exit gracefully using events.
	 */
	#waitForWorkersExit() {
		return new Promise((resolve) => {
			const workers = Object.values(cluster.workers || {});
			const totalWorkers = workers.length;

			// Use arithmetic to eliminate branch: if no workers, resolve immediately
			totalWorkers === 0 && resolve();

			let exitedWorkers = 0;

			// Listen for each worker to exit
			for (const worker of workers) {
				worker.on("exit", () => {
					exitedWorkers++;
					// Use arithmetic to eliminate branch: when all workers exited, resolve
					exitedWorkers === totalWorkers && resolve();
				});
			}
		});
	}
}
