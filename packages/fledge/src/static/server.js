/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Server process management with blackbox detection.
 *
 * Manages child server processes with OS-native port allocation, TCP connection probing
 * for readiness detection, and bulletproof cleanup on process termination.
 */

import { spawn } from "node:child_process";
import { createServer, Socket } from "node:net";

/**
 * @typedef {function({ port: number }): Promise<void>} ServerBootFunction
 */

/**
 * Server process manager with blackbox detection and lifecycle management
 */
export class Server {
	/** @type {Set<Server>} Global set of all Server instances for cleanup */
	static #instances = new Set();

	/** @type {boolean} Track if global cleanup handlers are installed */
	static #cleanupInstalled = false;

	/** @type {ServerBootFunction} User's server boot function */
	#handler;

	/** @type {import("node:child_process").ChildProcess | null} Spawned server process */
	#childProcess = null;

	/** @type {number | null} Allocated port number */
	#port = null;

	/** @type {string | null} Server origin URL */
	#origin = null;

	/** @type {boolean} Boot state tracking */
	#isBooted = false;

	/** @type {boolean} Prevent concurrent boot operations */
	#isBooting = false;

	/** @type {boolean} Track if server crashed during boot */
	#crashed = false;

	/** @type {string | null} Crash reason for debugging */
	#crashReason = null;

	/**
	 * Install global cleanup handlers for all Server instances
	 */
	static #installGlobalCleanup() {
		// DISABLE GLOBAL CLEANUP IN TESTS to prevent hanging
		if (process.env.NODE_ENV === "test" || this.#cleanupInstalled) return;

		const cleanupAll = () => {
			for (const server of Server.#instances) {
				try {
					if (server.#childProcess && !server.#childProcess.killed) {
						server.#childProcess.kill("SIGTERM");
					}
				} catch {
					// Process might already be dead
				}
			}
		};

		process.once("exit", cleanupAll);
		process.once("SIGINT", cleanupAll);
		this.#cleanupInstalled = true;
	}

	/**
	 * Create server manager
	 * @param {ServerBootFunction} handler - Async function that starts server on given port
	 */
	constructor(handler) {
		if (typeof handler !== "function") {
			throw new Error("Server handler must be a function");
		}
		this.#handler = handler;
		Server.#installGlobalCleanup();
		Server.#instances.add(this);
	}

	/**
	 * Find free port using OS allocation
	 * @returns {Promise<number>} Available port number
	 * @throws {Error} If port allocation fails
	 */
	async findFreePort() {
		return new Promise((resolve, reject) => {
			const server = createServer();

			server.listen(0, (/** @type {Error} */ error) => {
				if (error) {
					reject(new Error(`Port allocation failed: ${error.message}`));
					return;
				}

				const address = server.address();
				if (!address || typeof address === "string") {
					reject(new Error("Failed to get port from server address"));
					return;
				}

				const port = address.port;

				server.close((closeError) => {
					if (closeError) {
						reject(new Error(`Failed to release port: ${closeError.message}`));
						return;
					}
					resolve(port);
				});
			});

			server.on("error", (error) => {
				reject(new Error(`Port allocation error: ${error.message}`));
			});
		});
	}

	/**
	 * Test if port is ready for connections
	 * @param {number} port - Port number to test
	 * @param {number} [timeout=200] - Connection timeout in milliseconds
	 * @returns {Promise<boolean>} True if port accepts connections
	 */
	async isPortReady(port, timeout = 200) {
		return new Promise((resolve) => {
			const socket = new Socket();
			let done = false;

			const finish = (/** @type {boolean} */ ok) => {
				if (done) return;
				done = true;
				clearTimeout(timer);
				socket.removeAllListeners();
				if (!socket.destroyed) socket.destroy();
				resolve(ok);
			};

			// Hard wall; don't rely on socket idle timeout
			const timer = setTimeout(() => finish(false), timeout);

			socket.once("connect", () => finish(true));
			socket.once("error", () => finish(false));
			socket.once("timeout", () => finish(false));

			try {
				// Prefer IPv4 to avoid dual-stack delays on 'localhost'
				socket.connect({ port, host: "127.0.0.1" });
			} catch {
				finish(false);
			}
		});
	}

	/**
	 * Wait for server to become ready via TCP probing
	 * @param {number} port - Port to probe
	 * @param {object} [options] - Wait options
	 * @param {number} [options.timeout=5000] - Maximum wait time in milliseconds
	 * @param {number} [options.interval=50] - Polling interval in milliseconds
	 * @param {number} [options.probeTimeout=200] - Maximum time per probe
	 * @returns {Promise<void>} Resolves when server is ready
	 * @throws {Error} If server crashes or timeout exceeded
	 */
	async waitForTcpReady(port, options = {}) {
		const { timeout = 5000, interval = 50, probeTimeout = 200 } = options;
		const deadline = Date.now() + timeout;

		while (!this.#crashed) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) break;

			const ok = await this.isPortReady(
				port,
				Math.min(probeTimeout, remaining),
			);
			if (ok) return;

			// Sleep, but never longer than the remaining budget
			await new Promise((resolve) =>
				setTimeout(
					resolve,
					Math.min(interval, Math.max(0, deadline - Date.now())),
				),
			);
		}

		if (this.#crashed) {
			throw new Error(`Server crashed during boot: ${this.#crashReason}`);
		}
		throw new Error(
			`Server boot timeout after ${timeout}ms - no response on port ${port}`,
		);
	}

	/**
	 * Sleep for specified milliseconds
	 * @param {number} ms - Milliseconds to sleep
	 * @returns {Promise<void>} Resolves after delay
	 */
	async sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Boot server process with retry logic
	 * @param {object} [options] - Boot options
	 * @param {number} [options.timeout=30000] - Boot timeout in milliseconds
	 * @param {number} [options.maxAttempts=3] - Maximum retry attempts for port conflicts
	 * @returns {Promise<void>} Resolves when server is ready
	 * @throws {Error} If boot fails or times out
	 */
	async boot(options = {}) {
		if (this.#isBooted) {
			throw new Error("Server is already booted");
		}

		if (this.#isBooting) {
			throw new Error("Server is already booting");
		}

		const { timeout = 5000, maxAttempts = 3 } = options;
		this.#isBooting = true;

		try {
			let attempts = 0;

			while (attempts < maxAttempts) {
				try {
					// OS-native port allocation
					this.#port = await this.findFreePort();
					this.#origin = `http://localhost:${this.#port}`;

					// Small delay to ensure OS fully releases port
					await this.sleep(10);

					// Spawn child process immediately
					await this.#spawnServerProcess();

					// Wait for server readiness via TCP probing with fast fail in tests
					const probeTimeout = timeout < 1000 ? 20 : 200; // Use 20ms probes for fast tests
					await this.waitForTcpReady(this.#port, { timeout, probeTimeout });

					// Success!
					this.#isBooted = true;
					return;
				} catch (error) {
					const err = /** @type {any} */ (error);

					// Clean up failed attempt - Don't wait for exit, just kill and nullify
					if (this.#childProcess) {
						this.#childProcess.kill("SIGKILL");
						// Set to null immediately instead of waiting for exit event
						// The process will die but we don't need to block on it
						this.#childProcess = null;
					}

					attempts++;

					// Retry on port conflicts
					if (
						err.message?.includes("EADDRINUSE") ||
						err.message?.includes("port") ||
						attempts < maxAttempts
					) {
						await this.sleep(100 * attempts); // Exponential backoff
						continue;
					}

					throw error;
				}
			}

			throw new Error(`Failed to boot server after ${maxAttempts} attempts`);
		} finally {
			this.#isBooting = false;
			this.#crashed = false;
			this.#crashReason = null;
		}
	}

	/**
	 * Spawn server process and set up monitoring
	 * @returns {Promise<void>} Resolves when process is spawned
	 */
	async #spawnServerProcess() {
		if (!this.#port) {
			throw new Error("No port allocated for server");
		}

		// Create executable script for child process that keeps it alive
		const serverScript = `
			const http = require('node:http');
			const net = require('node:net');

			(async () => {
				try {
					const handler = ${this.#handler.toString()};
					await handler({ port: ${this.#port} });

					// Keep process alive by listening for SIGTERM
					process.on('SIGTERM', () => {
						process.exit(0);
					});

					// Keep event loop alive with a simple interval
					const keepAlive = setInterval(() => {
						// Just keep the process alive
					}, 1000);

					// Cleanup on exit
					process.on('exit', () => {
						clearInterval(keepAlive);
					});

				} catch (error) {
					console.error('Server handler error:', error);
					process.exit(1);
				}
			})();
		`;

		// Spawn child process
		this.#childProcess = spawn("node", ["-e", serverScript], {
			stdio: ["pipe", "pipe", "pipe"],
			detached: false, // Keep linked to parent
		});

		// Monitor process lifecycle
		this.#childProcess.on("exit", (code, signal) => {
			if (!this.#isBooted && code !== 0) {
				this.#crashed = true;
				this.#crashReason = `Process exited with code ${code}, signal ${signal}`;
			}
			this.#childProcess = null;
		});

		this.#childProcess.on("error", (error) => {
			if (!this.#isBooted) {
				this.#crashed = true;
				this.#crashReason = `Process error: ${error.message}`;
			}
		});

		// Optional: Capture stdout/stderr for debugging
		this.#childProcess.stdout?.on("data", (_data) => {
			// Could forward to main process logger if needed
			// console.log(`Server stdout: ${_data}`);
		});

		this.#childProcess.stderr?.on("data", (_data) => {
			// Could forward to main process logger if needed
			// console.error(`Server stderr: ${_data}`);
		});
	}

	/**
	 * Kill server process with graceful shutdown
	 * @param {object} [options] - Kill options
	 * @param {number} [options.gracefulTimeout=5000] - Time to wait for graceful shutdown
	 * @returns {Promise<void>} Resolves when server is killed
	 */
	async kill(options = {}) {
		if (!this.#childProcess) {
			this.#isBooted = false;
			return;
		}

		const { gracefulTimeout = 5000 } = options;

		try {
			// Attach listeners first, then signal to avoid race condition
			const waitPromise = this.#waitForProcessExit(gracefulTimeout);
			this.#childProcess.kill("SIGTERM");
			await waitPromise;
		} catch {
			// Force kill if graceful shutdown failed
			if (this.#childProcess && !this.#childProcess.killed) {
				const waitPromise = this.#waitForProcessExit(1000);
				this.#childProcess.kill("SIGKILL");
				await waitPromise;
			}
		} finally {
			// Remove from global instances and clear state
			Server.#instances.delete(this);
			this.#childProcess = null;
			this.#isBooted = false;
			this.#port = null;
			this.#origin = null;
		}
	}

	/**
	 * Wait for child process to exit
	 * @param {number} timeout - Maximum wait time
	 * @returns {Promise<void>} Resolves when process exits
	 * @throws {Error} If timeout exceeded
	 */
	async #waitForProcessExit(timeout) {
		if (!this.#childProcess) return;

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				// Clean up event listener on timeout
				if (this.#childProcess) {
					this.#childProcess.removeAllListeners("exit");
				}
				reject(new Error("Process exit timeout"));
			}, timeout);

			// Create one-time exit handler that cleans itself up
			const exitHandler = () => {
				clearTimeout(timer);
				if (this.#childProcess) {
					this.#childProcess.removeListener("exit", exitHandler);
				}
				resolve();
			};

			this.#childProcess?.on("exit", exitHandler);

			// If process is already dead
			if (this.#childProcess?.killed || this.#childProcess?.exitCode !== null) {
				clearTimeout(timer);
				resolve();
			}
		});
	}

	/**
	 * Check if server is currently booted
	 * @returns {boolean} True if server is running
	 */
	isBooted() {
		return this.#isBooted && !!this.#childProcess && !this.#childProcess.killed;
	}

	/**
	 * Get server origin URL
	 * @returns {string | null} Origin URL or null if not booted
	 */
	getOrigin() {
		return this.#origin;
	}

	/**
	 * Get allocated port number
	 * @returns {number | null} Port number or null if not booted
	 */
	getPort() {
		return this.#port;
	}

	/**
	 * Get child process PID
	 * @returns {number | null} Process ID or null if not running
	 */
	getPid() {
		return this.#childProcess?.pid ?? null;
	}

	/**
	 * Check if server is still responsive
	 * @returns {Promise<boolean>} True if server responds to TCP connection
	 */
	async isAlive() {
		if (!this.#isBooted || !this.#port) {
			return false;
		}

		// Check if child process is still running
		if (!this.#childProcess || this.#childProcess.killed) {
			return false;
		}

		// Check if port is still responsive
		return await this.isPortReady(this.#port);
	}

	/**
	 * Convert server state to JSON representation
	 * @returns {object} JSON representation
	 */
	toJSON() {
		return {
			isBooted: this.#isBooted,
			port: this.#port,
			origin: this.#origin,
			pid: this.getPid(),
			crashed: this.#crashed,
			crashReason: this.#crashReason,
		};
	}
}
