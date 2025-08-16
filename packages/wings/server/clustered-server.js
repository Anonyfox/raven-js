import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { NodeHttp } from "./node-http.js";

/**
 * Dedicated (lean) export for the nodejs implementation of the Plumage server.
 *
 * This explicitly tuned for production usage.
 *
 * - zero logging by default to not fill up your servers disk silently
 * - automatic clustering to utilize all available CPUs (= vertical scaling with more CPU cores)
 * - automatic restart of crashed workers to keep the service running
 */
export class ClusteredServer extends NodeHttp {
	/**
	 * When called, this listener will automatically fork the process into multiple
	 * workers (one per CPU core), each handling a part of the incoming traffic,
	 * on the same shared port.
	 *
	 * It will also automatically restart crashed workers to keep the service running.
	 * For this reason, its advised to use this in production even if you only
	 * have one CPU core. No need for something like PM2 or forever.js.
	 *
	 * @param {number} port
	 * @param {string} [host]
	 * @returns {Promise<void>}
	 */
	async listen(port, host = "0.0.0.0") {
		if (cluster.isPrimary) {
			// Use fewer workers in test environment to prevent hanging
			const numCPUs =
				process.env.NODE_ENV === "test" ? 1 : availableParallelism();

			// Fork workers
			for (let i = 0; i < numCPUs; i++) {
				cluster.fork();
			}

			// Simple worker restart on exit
			cluster.on("exit", (_worker, code, signal) => {
				// Only restart if not intentionally killed
				if (code !== 0 && signal !== "SIGTERM") {
					cluster.fork();
				}
			});

			// Wait for workers to start listening
			await new Promise((resolve) => {
				const checkWorkers = () => {
					const workers = Object.values(cluster.workers || {});
					if (workers.length > 0) {
						// Give workers a moment to start listening
						setTimeout(resolve, 100);
					} else {
						setTimeout(checkWorkers, 10);
					}
				};
				checkWorkers();
			});
		} else {
			// Workers actually start listening
			await super.listen(port, host);
		}
	}

	/**
	 * Gracefully close the clustered server.
	 *
	 * @returns {Promise<void>}
	 */
	async close() {
		if (cluster.isPrimary) {
			// Send SIGTERM to all workers
			for (const [_id, worker] of Object.entries(cluster.workers || {})) {
				if (worker && !worker.isDead()) {
					worker.kill("SIGTERM");
				}
			}

			// Wait for workers to exit gracefully
			await new Promise((resolve) => {
				const checkWorkers = () => {
					const aliveWorkers = Object.values(cluster.workers || {}).filter(
						(w) => !w.isDead(),
					);
					if (aliveWorkers.length === 0) {
						resolve();
					} else {
						setTimeout(checkWorkers, 10);
					}
				};
				checkWorkers();
			});

			// Disconnect cluster
			cluster.disconnect();
		}

		try {
			return await super.close();
		} catch (error) {
			if (error.code !== "ERR_SERVER_NOT_RUNNING") {
				throw error;
			}
		}
	}
}
