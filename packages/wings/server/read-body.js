/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} Security defaults for request body processing. These values provide protection against common attack vectors while maintaining good performance for legitimate requests.
 */
export const SECURITY_DEFAULTS = {
	/**
 * @packageDocumentation
 *
 * Maximum request body size in bytes (10MB)
 */
	MAX_BODY_SIZE: 10 * 1024 * 1024,
	/** Maximum number of data chunks to prevent flooding attacks */
	MAX_CHUNKS: 1000,
	/** Request timeout in milliseconds (30 seconds) */
	TIMEOUT_MS: 30 * 1000,
};

/**
 * Get the maximum allowed body size.
 *
 * @returns {number} Maximum body size in bytes
 */
export function getMaxBodySize() {
	return SECURITY_DEFAULTS.MAX_BODY_SIZE;
}

/**
 * Get the maximum allowed number of chunks.
 *
 * @returns {number} Maximum number of chunks
 */
export function getMaxChunks() {
	return SECURITY_DEFAULTS.MAX_CHUNKS;
}

/**
 * Get the request timeout duration.
 *
 * @returns {number} Timeout in milliseconds
 */
export function getTimeout() {
	return SECURITY_DEFAULTS.TIMEOUT_MS;
}

/**
 * Timer abstraction interface for testable timeouts.
 * Allows dependency injection of timer functions for testing.
 *
 * @typedef {Object} TimerImpl
 * @property {(callback: Function, delay: number) => any} create - Create a timer
 * @property {(timerId: any) => void} clear - Clear a timer
 */

/**
 * Default timer implementation using Node.js built-in timers.
 * @type {TimerImpl}
 */
export const DEFAULT_TIMER_IMPL = {
	create: setTimeout,
	clear: clearTimeout,
};

/**
 * Create a timer using the provided implementation.
 *
 * @param {Function} callback - Function to call when timer expires
 * @param {number} delay - Delay in milliseconds
 * @param {TimerImpl} impl - Timer implementation (for testing)
 * @returns {any} Timer ID that can be cleared
 */
export function createTimer(callback, delay, impl = DEFAULT_TIMER_IMPL) {
	return impl.create(callback, delay);
}

/**
 * Clear a timer using the provided implementation.
 *
 * @param {any} timerId - Timer ID to clear
 * @param {TimerImpl} impl - Timer implementation (for testing)
 */
export function clearTimer(timerId, impl = DEFAULT_TIMER_IMPL) {
	impl.clear(timerId);
}

/**
 * Validation error class for request body processing.
 */
export class ValidationError extends Error {
	/**
	 * @param {string} message - Error message
	 * @param {string} code - Error code
	 */
	constructor(message, code) {
		super(message);
		this.name = "ValidationError";
		this.code = code;
	}
}

/**
 * Request validator for enforcing size and chunk limits.
 * Provides fast validation with minimal overhead for normal requests.
 */
export class RequestValidator {
	/**
	 * @param {Object} [limits] - Validation limits
	 * @param {number} [limits.maxSize] - Maximum body size in bytes
	 * @param {number} [limits.maxChunks] - Maximum number of chunks
	 */
	constructor(limits = {}) {
		this.maxSize = limits.maxSize ?? getMaxBodySize();
		this.maxChunks = limits.maxChunks ?? getMaxChunks();
		this.totalSize = 0;
		this.chunkCount = 0;
		this.isValid = true;
		this.error = null;
	}

	/**
	 * Validate a single chunk and update internal state.
	 *
	 * @param {Buffer} chunk - Data chunk to validate
	 * @returns {boolean} True if chunk is valid and within limits
	 */
	validateChunk(chunk) {
		if (!this.isValid) {
			return false;
		}

		this.chunkCount++;
		this.totalSize += chunk.length;

		// Check chunk count limit first (cheaper check)
		if (this.chunkCount > this.maxChunks) {
			this.isValid = false;
			this.error = new ValidationError(
				`Too many chunks: ${this.chunkCount} exceeds limit of ${this.maxChunks}`,
				"TOO_MANY_CHUNKS",
			);
			return false;
		}

		// Check total size limit
		if (this.totalSize > this.maxSize) {
			this.isValid = false;
			this.error = new ValidationError(
				`Request body too large: ${this.totalSize} bytes exceeds limit of ${this.maxSize} bytes`,
				"BODY_TOO_LARGE",
			);
			return false;
		}

		return true;
	}

	/**
	 * Get current validation state.
	 *
	 * @returns {Object} Validation state with size, chunks, and validity
	 */
	getState() {
		return {
			totalSize: this.totalSize,
			chunkCount: this.chunkCount,
			isValid: this.isValid,
			error: this.error,
		};
	}

	/**
	 * Reset validator state for reuse.
	 */
	reset() {
		this.totalSize = 0;
		this.chunkCount = 0;
		this.isValid = true;
		this.error = null;
	}
}

/**
 * Create a request validator with default limits.
 *
 * @param {Object} [limits] - Optional custom limits
 * @param {number} [limits.maxSize] - Maximum body size in bytes
 * @param {number} [limits.maxChunks] - Maximum number of chunks
 * @returns {RequestValidator} New validator instance
 */
export function createValidator(limits) {
	return new RequestValidator(limits);
}

/**
 * Resource cleanup manager for handling event listeners and timers.
 * Ensures proper cleanup to prevent memory leaks.
 */
export class ResourceManager {
	/**
	 * @param {TimerImpl} [timerImpl] - Timer implementation (for testing)
	 */
	constructor(timerImpl = DEFAULT_TIMER_IMPL) {
		this.timerImpl = timerImpl;
		/** @type {import('node:http').IncomingMessage | null} */
		this.request = null;
		/** @type {any} */
		this.timerId = null;
		/** @type {Array<{event: string, listener: (...args: any[]) => void}>} */
		this.eventListeners = [];
	}

	/**
	 * Set the request object to manage.
	 *
	 * @param {import('node:http').IncomingMessage} request - HTTP request object
	 */
	setRequest(request) {
		this.request = request;
		this.eventListeners = [];
	}

	/**
	 * Add an event listener and track it for cleanup.
	 *
	 * @param {string} event - Event name
	 * @param {(...args: any[]) => void} listener - Event listener function
	 */
	addListener(event, listener) {
		if (!this.request) {
			throw new Error("Request not set");
		}

		this.request.on(event, listener);
		this.eventListeners.push({ event, listener });
	}

	/**
	 * Set a timeout and track it for cleanup.
	 *
	 * @param {Function} callback - Timeout callback
	 * @param {number} delay - Timeout delay in milliseconds
	 */
	setTimeout(callback, delay) {
		if (this.timerId) {
			this.clearTimeout();
		}

		this.timerId = this.timerImpl.create(callback, delay);
	}

	/**
	 * Clear the current timeout.
	 */
	clearTimeout() {
		if (this.timerId) {
			this.timerImpl.clear(this.timerId);
			this.timerId = null;
		}
	}

	/**
	 * Remove all event listeners from the request.
	 */
	clearListeners() {
		if (!this.request) {
			return;
		}

		for (const { event, listener } of this.eventListeners) {
			this.request.removeListener(event, listener);
		}

		this.eventListeners = [];
	}

	/**
	 * Remove all event listeners except error listeners.
	 * This prevents uncaught exceptions when errors are emitted after cleanup.
	 */
	clearNonErrorListeners() {
		if (!this.request) {
			return;
		}

		for (const { event, listener } of this.eventListeners) {
			if (event !== "error") {
				this.request.removeListener(event, listener);
			}
		}

		this.eventListeners = this.eventListeners.filter(
			({ event }) => event === "error",
		);
	}

	/**
	 * Clean up all resources (event listeners and timers).
	 */
	cleanup() {
		this.clearListeners();
		this.clearTimeout();
	}

	/**
	 * Get current resource state for testing.
	 *
	 * @returns {Object} Current state of managed resources
	 */
	getState() {
		return {
			hasRequest: this.request !== null,
			hasTimer: this.timerId !== null,
			listenerCount: this.eventListeners.length,
		};
	}
}

/**
 * Create a resource manager with optional timer implementation.
 *
 * @param {TimerImpl} [timerImpl] - Timer implementation (for testing)
 * @returns {ResourceManager} New resource manager instance
 */
export function createResourceManager(timerImpl) {
	return new ResourceManager(timerImpl);
}

/**
 * Read the request body as a Buffer from an HTTP request stream.
 *
 * This security-hardened function enforces size limits, chunk limits, and timeout protection
 * while providing proper resource cleanup to prevent memory leaks and potential attacks.
 *
 * @param {import('node:http').IncomingMessage} request - The HTTP request object
 * @param {Object} [options] - Configuration options for testing
 * @param {TimerImpl} [options.timerImpl] - Timer implementation (for testing)
 * @param {Object} [options.limits] - Custom validation limits (for testing)
 * @returns {Promise<Buffer|undefined>} A Promise that resolves to the request body or undefined
 */
export async function readBody(request, options = {}) {
	return new Promise((resolve) => {
		// Create security components
		const validator = createValidator(options.limits);
		const resourceManager = createResourceManager(options.timerImpl);
		const bodyParts = /** @type {Buffer[]} */ ([]);
		let isResolved = false;

		// Setup resource management
		resourceManager.setRequest(request);

		/**
		 * Cleanup and resolve the promise
		 * @param {Buffer | undefined} result - Result to resolve with
		 */
		function cleanupAndResolve(result) {
			if (isResolved) return;
			isResolved = true;
			resourceManager.clearTimeout();
			resourceManager.clearNonErrorListeners();
			resolve(result);
		}

		// Setup timeout protection
		resourceManager.setTimeout(() => {
			cleanupAndResolve(undefined);
		}, getTimeout());

		// Data event handler with validation
		resourceManager.addListener("data", (chunk) => {
			if (isResolved) return;

			// Validate the chunk
			if (!validator.validateChunk(chunk)) {
				// Security limit exceeded - cleanup and resolve gracefully
				cleanupAndResolve(undefined);
				return;
			}

			// Chunk is valid, add to body parts
			bodyParts.push(chunk);
		});

		// End event handler
		resourceManager.addListener("end", () => {
			if (isResolved) return;

			// Check if we have any data
			if (bodyParts.length === 0) {
				cleanupAndResolve(undefined);
				return;
			}

			// Concatenate all body parts
			try {
				const body = Buffer.concat(bodyParts);
				cleanupAndResolve(body);
			} catch (error) {
				// Handle potential memory errors during concatenation
				console.error("Error concatenating request body:", error);
				cleanupAndResolve(undefined);
			}
		});

		// Error event handler
		resourceManager.addListener("error", (err) => {
			if (isResolved) return;

			console.error("Error reading request body:", err);
			cleanupAndResolve(undefined);
		});
	});
}
