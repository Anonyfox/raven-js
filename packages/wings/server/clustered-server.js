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
 */
export class ClusteredServer extends NodeHttp {
	/**
	 * Start clustered server with automatic worker management.
	 *
	 * @param {number} port - Port to listen on
	 * @param {string} [host="0.0.0.0"] - Host to bind to
	 * @returns {Promise<void>}
	 */
	async listen(port, host = "0.0.0.0") {
		if (cluster.isPrimary) {
			// Fork workers (1 in test, all cores in production)
			const workerCount =
				process.env.NODE_ENV === "test" ? 1 : availableParallelism();

			// Auto-restart crashed workers
			cluster.on("exit", (_worker, code, signal) => {
				if (code !== 0 && signal !== "SIGTERM") {
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
			// Signal all workers to shutdown
			for (const worker of Object.values(cluster.workers || {})) {
				if (worker && !worker.isDead()) {
					worker.kill("SIGTERM");
				}
			}

			// Wait for all workers to exit using events
			await this.#waitForWorkersExit();
			cluster.disconnect();
		}

		// Close the underlying server (handles ERR_SERVER_NOT_RUNNING)
		try {
			await super.close();
		} catch (error) {
			if (error.code !== "ERR_SERVER_NOT_RUNNING") {
				throw error;
			}
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
				if (message === "ready") {
					readyWorkers++;
					if (readyWorkers === expectedWorkers) {
						resolve();
					}
				}
			});
		});
	}

	/**
	 * Wait for all workers to exit gracefully using events.
	 */
	#waitForWorkersExit() {
		return new Promise((resolve) => {
			const workers = Object.values(cluster.workers || {});
			if (workers.length === 0) {
				resolve();
				return;
			}

			let exitedWorkers = 0;
			const totalWorkers = workers.length;

			// Listen for each worker to exit
			for (const worker of workers) {
				if (worker && !worker.isDead()) {
					worker.on("exit", () => {
						exitedWorkers++;
						if (exitedWorkers === totalWorkers) {
							resolve();
						}
					});
				} else {
					exitedWorkers++;
				}
			}

			// If all workers were already dead, resolve immediately
			if (exitedWorkers === totalWorkers) {
				resolve();
			}
		});
	}
}
