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
 * - Memory leak prevention with proper event cleanup
 * - Instant crash recovery without coordination delays
 */
export class ClusteredServer extends NodeHttp {
	/** @type {boolean} */
	#isListening = false;
	/** @type {number} */
	#expectedWorkers = 0;
	/** @type {number} */
	#readyWorkers = 0;
	/** @type {function(*, *): void | null} */
	#messageListener = null;
	/** @type {function(*, *, *): void | null} */
	#exitListener = null;
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
			// Prevent double-listening
			if (this.#isListening) return;
			this.#isListening = true;

			// Clean up any existing listeners
			this.#removeListeners();

			// Setup worker count and tracking
			this.#expectedWorkers = availableParallelism();
			this.#readyWorkers = 0;

			// Setup auto-restart for crashed workers (instant restart)
			this.#exitListener = (/** @type {*} */ _worker, /** @type {number} */ code, /** @type {*} */ _signal) => {
				// Only restart if worker crashed (not graceful shutdown) and we're still listening
				if (code !== 0 && this.#isListening) {
					cluster.fork(); // Instant restart - new worker serves requests immediately
				}
			};
			cluster.on("exit", this.#exitListener);

			// Fork all workers
			for (let i = 0; i < this.#expectedWorkers; i++) {
				cluster.fork();
			}

			// Wait for all workers to signal they're ready
			await this.#waitForWorkersReady();
		} else {
			// Worker process - start listening immediately
			await super.listen(port, host);

			// Signal to primary that we're ready (instant notification)
			process.send("ready");
		}
	}

	/**
	 * Gracefully shutdown clustered server (instant cleanup).
	 *
	 * @returns {Promise<void>}
	 */
	async close() {
		if (cluster.isPrimary) {
			// Mark as not listening to prevent worker restarts during shutdown
			this.#isListening = false;

			// Clean up event listeners immediately
			this.#removeListeners();

			// Force kill all workers immediately (no waiting - instant cleanup)
			for (const worker of Object.values(cluster.workers)) {
				// Force kill worker immediately
				worker.kill("SIGKILL");
			}

			// Disconnect cluster coordination immediately (no waiting)
			cluster.disconnect();

			// Force cleanup cluster state
			cluster.removeAllListeners();
		}

		// Close the underlying server (ignore ERR_SERVER_NOT_RUNNING)
		try {
			await super.close();
		} catch (_error) {
			// Ignore all close errors (typically ERR_SERVER_NOT_RUNNING)
		}
	}

	/**
	 * Wait for all workers to signal they're ready (leak-proof, hang-proof).
	 */
	#waitForWorkersReady() {
		return new Promise((resolve) => {
			// Create message listener that auto-cleans up
			this.#messageListener = (/** @type {*} */ _worker, /** @type {string} */ message) => {
				// Only count "ready" messages and prevent over-counting
				if (message === "ready" && this.#readyWorkers < this.#expectedWorkers) {
					this.#readyWorkers++;

									// Instant resolution when all workers ready
				if (this.#readyWorkers === this.#expectedWorkers) {
					this.#removeMessageListener();
					resolve();
				}
				}
			};

			// Attach listener
			cluster.on("message", this.#messageListener);
		});
	}

	/**
	 * Remove message listener to prevent memory leaks.
	 */
	#removeMessageListener() {
		if (this.#messageListener) {
			cluster.removeListener("message", this.#messageListener);
			this.#messageListener = null;
		}
	}

	/**
	 * Remove all event listeners to prevent memory leaks.
	 */
	#removeListeners() {
		this.#removeMessageListener();
		if (this.#exitListener) {
			cluster.removeListener("exit", this.#exitListener);
			this.#exitListener = null;
		}
	}
}
