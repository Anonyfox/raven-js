/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file AbortSignal and timeout coordination for database operations.
 *
 * Provides unified cancellation and timeout handling across all database operations.
 * Combines AbortSignal support with timeout functionality to enable clean operation
 * cancellation and resource cleanup.
 */

import {
	createOperationCancelledError,
	createOperationTimeoutError,
} from "./errors.js";

/**
 * @typedef {Object} CancellationToken
 * @property {boolean} isCancelled - Whether operation is cancelled
 * @property {Promise<never>} promise - Promise that rejects when cancelled
 * @property {Function} throwIfCancelled - Throws if operation is cancelled
 * @property {Function} cleanup - Cleanup function to call when done
 */

/**
 * Create a cancellation token that combines AbortSignal and timeout
 * @param {AbortSignal} [signal] - AbortSignal for external cancellation
 * @param {number} [timeoutMs] - Timeout in milliseconds
 * @param {string} driver - Database driver name for error context
 * @returns {CancellationToken} Combined cancellation token
 */
export function createCancellationToken(signal, timeoutMs, driver) {
	let isCancelled = false;
	let timeoutId = null;
	let rejectPromise = null;

	// Create promise that rejects when cancelled
	const promise = new Promise((_, reject) => {
		rejectPromise = reject;
	});

	// Handle AbortSignal cancellation
	if (signal) {
		if (signal.aborted) {
			isCancelled = true;
			rejectPromise(createOperationCancelledError(driver));
		} else {
			const abortHandler = () => {
				if (!isCancelled) {
					isCancelled = true;
					rejectPromise(createOperationCancelledError(driver));
				}
			};
			signal.addEventListener("abort", abortHandler, { once: true });
		}
	}

	// Handle timeout cancellation
	if (timeoutMs && timeoutMs > 0) {
		timeoutId = setTimeout(() => {
			if (!isCancelled) {
				isCancelled = true;
				rejectPromise(createOperationTimeoutError(driver, timeoutMs));
			}
		}, timeoutMs);
	}

	// Cleanup function to clear timeout and remove listeners
	const cleanup = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	// Function to throw if operation is cancelled
	const throwIfCancelled = () => {
		if (isCancelled) {
			if (signal?.aborted) {
				throw createOperationCancelledError(driver);
			} else {
				throw createOperationTimeoutError(driver, timeoutMs);
			}
		}
	};

	return {
		get isCancelled() {
			return isCancelled;
		},
		promise,
		throwIfCancelled,
		cleanup,
	};
}

/**
 * Race a promise against cancellation (AbortSignal + timeout)
 * @param {Promise<T>} promise - Promise to race
 * @param {AbortSignal} [signal] - AbortSignal for cancellation
 * @param {number} [timeoutMs] - Timeout in milliseconds
 * @param {string} driver - Database driver name for error context
 * @returns {Promise<T>} Promise that resolves or rejects with cancellation
 * @template T
 */
export function raceWithCancellation(promise, signal, timeoutMs, driver) {
	// If no cancellation needed, return original promise
	if (!signal && !timeoutMs) {
		return promise;
	}

	const token = createCancellationToken(signal, timeoutMs, driver);

	return Promise.race([promise.finally(() => token.cleanup()), token.promise]);
}

/**
 * Create a cancellable operation wrapper
 * @param {Function} operation - Async operation to wrap
 * @param {AbortSignal} [signal] - AbortSignal for cancellation
 * @param {number} [timeoutMs] - Timeout in milliseconds
 * @param {string} driver - Database driver name for error context
 * @returns {Promise<T>} Cancellable operation promise
 * @template T
 */
export function cancellableOperation(operation, signal, timeoutMs, driver) {
	const token = createCancellationToken(signal, timeoutMs, driver);

	// Check if already cancelled before starting
	token.throwIfCancelled();

	// Execute operation with cancellation support
	const operationPromise = Promise.resolve(operation(token)).finally(() =>
		token.cleanup(),
	);

	return Promise.race([operationPromise, token.promise]);
}

/**
 * Create an AbortController that times out after specified milliseconds
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {AbortController} AbortController that will abort after timeout
 */
export function createTimeoutController(timeoutMs) {
	const controller = new AbortController();

	if (timeoutMs && timeoutMs > 0) {
		setTimeout(() => {
			if (!controller.signal.aborted) {
				controller.abort();
			}
		}, timeoutMs);
	}

	return controller;
}

/**
 * Combine multiple AbortSignals into one
 * @param {...AbortSignal} signals - AbortSignals to combine
 * @returns {AbortController} Combined AbortController
 */
export function combineAbortSignals(...signals) {
	const controller = new AbortController();

	// If any signal is already aborted, abort immediately
	if (signals.some((signal) => signal?.aborted)) {
		controller.abort();
		return controller;
	}

	// Listen for abort on any signal
	const abortHandler = () => {
		if (!controller.signal.aborted) {
			controller.abort();
		}
	};

	for (const signal of signals) {
		if (signal) {
			signal.addEventListener("abort", abortHandler, { once: true });
		}
	}

	return controller;
}

/**
 * Create a cancellation-aware sleep function
 * @param {number} ms - Milliseconds to sleep
 * @param {AbortSignal} [signal] - AbortSignal for cancellation
 * @returns {Promise<void>} Promise that resolves after delay or rejects if cancelled
 */
export function cancellableSleep(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new Error("Operation cancelled"));
			return;
		}

		const timeoutId = setTimeout(resolve, ms);

		if (signal) {
			const abortHandler = () => {
				clearTimeout(timeoutId);
				reject(new Error("Operation cancelled"));
			};
			signal.addEventListener("abort", abortHandler, { once: true });
		}
	});
}

/**
 * Utility to check if an error is a cancellation error
 * @param {Error} error - Error to check
 * @returns {boolean} True if error indicates cancellation
 */
export function isCancellationError(error) {
	return (
		error.name === "AbortError" ||
		error.message?.includes("cancelled") ||
		error.message?.includes("aborted") ||
		(error.code &&
			(error.code === "OPERATION_CANCELLED" ||
				error.code === "OPERATION_TIMEOUT"))
	);
}

/**
 * Utility to check if an error is a timeout error
 * @param {Error} error - Error to check
 * @returns {boolean} True if error indicates timeout
 */
export function isTimeoutError(error) {
	return (
		error.name === "TimeoutError" ||
		error.message?.includes("timeout") ||
		(error.code && error.code === "OPERATION_TIMEOUT")
	);
}

/**
 * Create a deadline-based AbortController
 * @param {Date|number} deadline - Deadline as Date or timestamp
 * @returns {AbortController} AbortController that aborts at deadline
 */
export function createDeadlineController(deadline) {
	const controller = new AbortController();
	const deadlineMs = deadline instanceof Date ? deadline.getTime() : deadline;
	const now = Date.now();
	const timeoutMs = Math.max(0, deadlineMs - now);

	if (timeoutMs === 0) {
		// Deadline already passed
		controller.abort();
	} else {
		setTimeout(() => {
			if (!controller.signal.aborted) {
				controller.abort();
			}
		}, timeoutMs);
	}

	return controller;
}

/**
 * Wrap a promise to automatically cleanup resources on cancellation
 * @param {Promise<T>} promise - Promise to wrap
 * @param {Function} cleanup - Cleanup function to call on cancellation
 * @param {AbortSignal} [signal] - AbortSignal to monitor
 * @returns {Promise<T>} Wrapped promise with cleanup
 * @template T
 */
export function withCleanup(promise, cleanup, signal) {
	if (!signal) {
		return promise;
	}

	let cleanupCalled = false;
	const safeCleanup = () => {
		if (!cleanupCalled) {
			cleanupCalled = true;
			try {
				cleanup();
			} catch (error) {
				// Ignore cleanup errors
				console.warn("Cleanup error:", error);
			}
		}
	};

	// Setup abort handler
	if (signal.aborted) {
		safeCleanup();
		return Promise.reject(new Error("Operation cancelled"));
	}

	const abortHandler = () => safeCleanup();
	signal.addEventListener("abort", abortHandler, { once: true });

	return promise.finally(() => {
		signal.removeEventListener("abort", abortHandler);
	});
}
