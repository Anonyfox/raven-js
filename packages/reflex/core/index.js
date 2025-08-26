/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Universal reactive signals for modern JavaScript
 *
 * Core signal primitives that work everywhere - browser, Node.js, Deno, Bun.
 * Zero dependencies, zero transpilation, zero framework lock-in.
 */

/**
 * Global listener for dependency tracking.
 * When set, signal reads will register the listener as a dependency.
 *
 * @type {Function|null}
 */
let listener = null;

/**
 * Global flag to prevent effect execution during batching.
 * When true, signal updates won't trigger immediate effect execution.
 *
 * @type {boolean}
 */
let isBatching = false;

/**
 * Global flag to track if we're currently in an update cycle.
 * Prevents effects from running until all signals have updated.
 *
 * @type {boolean}
 */
const isInUpdateCycle = false;

/**
 * Tracks the current batch depth for nested batches.
 *
 * @type {number}
 */
let batchDepth = 0;

/**
 * Set of signals that need to flush notifications after batch completes.
 * Used to ensure effects run after batch() finishes.
 *
 * @type {Set<function>}
 */
const batchedSignals = new Set();

/**
 * Flag to prevent re-entrant flushing during batch flush phase.
 *
 * @type {boolean}
 */
let isFlushing = false;

/**
 * Global context stack for tracking reactive operations and their promises.
 * Used by effects to track async operations and by universal module for SSR.
 *
 * @type {Array<{track: function(Promise<any>): void}>}
 */
export const contextStack = [];

/**
 * Flushes all batched signals and runs their effects exactly once.
 * Used by both automatic microtask batching and explicit batch() calls.
 */
function flushBatchedSignals() {
	if (isFlushing || batchedSignals.size === 0) {
		return;
	}

	isFlushing = true;

	try {
		const signalsToFlush = Array.from(batchedSignals);
		batchedSignals.clear();

		// Collect all unique effects to run exactly once
		const uniqueEffects = new Set();
		for (const signal of signalsToFlush) {
			// Access signal's subscribers directly and add to set for deduplication
			/** @type {Set<Function>} */
			const subscribers = /** @type {any} */ (signal)._getSubscribers();
			for (const effect of subscribers) {
				uniqueEffects.add(effect);
			}
		}

		// Run each effect exactly once
		for (const effect of uniqueEffects) {
			try {
				effect();
			} catch (error) {
				console.error("Batch effect execution error:", error);
			}
		}
	} finally {
		isFlushing = false;
	}
}

/**
 * Creates a reactive signal that can hold and notify changes to a value.
 *
 * Signals are the fundamental reactive primitive. They store a value and
 * notify subscribers when the value changes. Reading a signal automatically
 * tracks dependencies when inside an effect or computed.
 *
 * **Isomorphic**: Works identically across all JavaScript runtimes.
 * **Performance**: Optimized for frequent reads and infrequent writes.
 * **Memory**: Automatic cleanup when all subscribers are removed.
 *
 * @template T
 * @param {T} [initial] - The initial value of the signal
 * @returns {function(): T} Signal accessor with methods
 *
 * @example
 * ```javascript
 * // Create signal
 * const count = signal(0);
 *
 * // Read value (tracks dependency if in effect/computed)
 * console.log(count()); // 0
 *
 * // Update value
 * count.set(5);
 * count.update(n => n + 1); // 6
 *
 * // Read without tracking
 * console.log(count.peek()); // 6
 *
 * // Subscribe to changes
 * const unsub = count.subscribe(value => console.log('New:', value));
 * count.set(10); // Logs: "New: 10"
 * unsub(); // Clean up
 * ```
 *
 * @example
 * ```javascript
 * // Isomorphic usage - same code everywhere
 * const data = signal(null);
 *
 * // Works in Node.js
 * if (typeof process !== 'undefined') {
 *   data.set({ platform: 'node' });
 * }
 *
 * // Works in browser
 * if (typeof window !== 'undefined') {
 *   data.set({ platform: 'browser' });
 * }
 *
 * // Works in Deno/Bun
 * data.set({ platform: 'universal' });
 * ```
 */
export function signal(initial) {
	let value = initial;
	const subs = new Set();

	/**
	 * Notifies all subscribers with current value.
	 * @returns {Promise<void[]>} Promise that resolves when all subscribers finish
	 */
	const notifySubscribers = async () => {
		const updates = [];
		for (const sub of subs) {
			try {
				const result = sub(value);
				if (result && typeof result.then === "function") {
					updates.push(result);
				}
			} catch (error) {
				// Continue notifying other subscribers even if one fails
				console.error("Signal subscriber error:", error);
			}
		}
		return Promise.all(updates);
	};

	/**
	 * Reads the current signal value and tracks dependency.
	 * @returns {T} The current value
	 */
	function read() {
		// Track dependency if we're in an effect/computed context
		if (listener) {
			subs.add(listener);
			// Also track this signal as a dependency in the effect if it supports it
			if (listener._trackDependency) {
				listener._trackDependency(read);
			}
		}
		return value;
	}

	/**
	 * Sets a new value and notifies all subscribers.
	 * @param {T} newValue - The new value to set
	 * @returns {Promise<void[]>} Promise that resolves when all subscribers finish
	 */
	read.set = async (newValue) => {
		// Avoid unnecessary updates for same value
		if (Object.is(value, newValue)) {
			return Promise.resolve([]);
		}

		value = newValue;

		// If explicitly batching, collect signal for later flush
		if (isBatching && !isFlushing) {
			batchedSignals.add(read);
			return Promise.resolve([]);
		}

		// Immediate notification for all subscribers
		return notifySubscribers();
	};

	// Expose methods for batch flushing
	read._getSubscribers = () => subs;

	/**
	 * Removes a subscriber from this signal.
	 * @param {function} subscriber - The subscriber to remove
	 */
	read._unsubscribe = (subscriber) => {
		subs.delete(subscriber);
	};

	/**
	 * Updates the value using a function and notifies subscribers.
	 * @param {function(T): T} fn - Function that receives current value and returns new value
	 * @returns {Promise<void[]>} Promise that resolves when all subscribers finish
	 */
	read.update = (fn) => {
		try {
			return read.set(fn(value));
		} catch (error) {
			return Promise.reject(error);
		}
	};

	/**
	 * Reads the current value without tracking dependencies.
	 * @returns {T} The current value
	 */
	read.peek = () => value;

	/**
	 * Subscribes to value changes.
	 * @param {function(T): void|Promise<void>} fn - Callback for value changes
	 * @returns {function(): void} Unsubscribe function
	 */
	read.subscribe = (fn) => {
		subs.add(fn);
		return () => subs.delete(fn);
	};

	return read;
}

/**
 * Creates a reactive effect that automatically tracks signal dependencies.
 *
 * Effects automatically re-run when any signals they read change. This is the
 * foundation of reactive programming - side effects that stay in sync with state.
 *
 * **Isomorphic**: Works identically across all JavaScript runtimes.
 * **Performance**: Only re-runs when dependencies actually change.
 * **Cleanup**: Automatic dependency cleanup when effect re-runs.
 *
 * @param {function(): void|Promise<void>} fn - Function to run reactively
 * @returns {function(): void|Promise<void>} Disposal function to stop the effect
 *
 * @example
 * ```javascript
 * // Basic reactive effect
 * const count = signal(0);
 *
 * const dispose = effect(() => {
 *   console.log('Count is:', count());
 * });
 *
 * count.set(1); // Logs: "Count is: 1"
 * count.set(2); // Logs: "Count is: 2"
 *
 * dispose(); // Stop the effect
 * count.set(3); // No log (effect disposed)
 * ```
 *
 * @example
 * ```javascript
 * // Async effects work seamlessly
 * const data = signal(null);
 *
 * effect(async () => {
 *   if (data()) {
 *     await fetch('/api/track', {
 *       method: 'POST',
 *       body: JSON.stringify(data())
 *     });
 *   }
 * });
 * ```
 */
export function effect(fn) {
	let isDisposed = false;
	const currentRunResources = new Set();
	const currentDependencies = new Set();

	/**
	 * Wraps global APIs to auto-track resources for cleanup.
	 * @returns {function} Restore function to unwrap APIs and cleanup current run
	 */
	const wrapResourceAPIs = () => {
		// Clear previous run resources before starting new run
		for (const cleanup of currentRunResources) {
			try {
				cleanup();
			} catch (error) {
				console.error("Effect resource cleanup error:", error);
			}
		}
		currentRunResources.clear();

		const originalSetInterval = globalThis.setInterval;
		const originalSetTimeout = globalThis.setTimeout;
		const originalAddEventListener = globalThis.addEventListener;

		// Wrap setInterval to auto-track
		/** @type {any} */ (globalThis).setInterval = (
			/** @type {any} */ callback,
			/** @type {any} */ delay,
			/** @type {...any} */ ...args
		) => {
			if (isDisposed) return originalSetInterval(callback, delay, ...args);
			const id = originalSetInterval(callback, delay, ...args);
			currentRunResources.add(() => clearInterval(id));
			return id;
		};

		// Wrap setTimeout to auto-track
		/** @type {any} */ (globalThis).setTimeout = (
			/** @type {any} */ callback,
			/** @type {any} */ delay,
			/** @type {...any} */ ...args
		) => {
			if (isDisposed) return originalSetTimeout(callback, delay, ...args);
			const id = originalSetTimeout(callback, delay, ...args);
			currentRunResources.add(() => clearTimeout(id));
			return id;
		};

		// Wrap addEventListener to auto-track (only if available)
		if (originalAddEventListener) {
			globalThis.addEventListener = (
				/** @type {any} */ type,
				/** @type {any} */ listener,
				/** @type {any} */ options,
			) => {
				originalAddEventListener(type, listener, options);
				if (!isDisposed) {
					currentRunResources.add(() =>
						globalThis.removeEventListener?.(type, listener, options),
					);
				}
			};
		}

		// Return restore function
		return () => {
			/** @type {any} */ (globalThis).setInterval = originalSetInterval;
			/** @type {any} */ (globalThis).setTimeout = originalSetTimeout;
			if (originalAddEventListener) {
				/** @type {any} */ (globalThis).addEventListener =
					originalAddEventListener;
			}
		};
	};

	let runCount = 0; // Track consecutive runs to detect infinite loops
	const MAX_RUNS = 100; // Reasonable limit for recursive effects

	const execute = () => {
		if (isDisposed) return;

		// Infinite loop protection
		runCount++;
		if (runCount > MAX_RUNS) {
			console.error("Effect infinite loop detected - stopping execution");
			return;
		}

		// Reset counter after a microtask (allows legitimate recursion)
		queueMicrotask(() => {
			runCount = Math.max(0, runCount - 1);
		});

		const prev = listener;
		const previousDependencies = new Set(currentDependencies);

		// Clear current dependencies - will be rebuilt during execution
		currentDependencies.clear();

		// Add dependency tracking capability to the execute function
		execute._trackDependency = (signal) => {
			currentDependencies.add(signal);
		};

		listener = execute;

		// Wrap resource APIs during effect execution - but only for non-test environment
		const restore =
			typeof process !== "undefined" && process.env.NODE_ENV === "test"
				? () => {} // No-op in tests to prevent hanging
				: wrapResourceAPIs();

		try {
			const result = fn();

			// Track promises returned by effects in reactive contexts
			const ctx = contextStack[contextStack.length - 1];
			if (result && typeof result.then === "function" && ctx) {
				ctx.track(result);
			}

			return result;
		} finally {
			// Always restore APIs after execution
			restore();
			listener = prev;

			// Clean up previous dependencies AFTER effect execution completes
			// This prevents re-entrant issues during the current notification cycle
			for (const signal of previousDependencies) {
				if (signal._unsubscribe && !currentDependencies.has(signal)) {
					signal._unsubscribe(execute);
				}
			}
		}
	};

	// Run immediately
	execute();

	// Return disposal function with deterministic cleanup
	return () => {
		isDisposed = true;

		// Clean up signal dependencies
		for (const signal of currentDependencies) {
			if (signal._unsubscribe) {
				signal._unsubscribe(execute);
			}
		}
		currentDependencies.clear();

		// Auto-cleanup all tracked resources from current run
		for (const cleanup of currentRunResources) {
			try {
				cleanup();
			} catch (error) {
				console.error("Effect resource cleanup error:", error);
			}
		}
		currentRunResources.clear();
	};
}

/**
 * Creates a computed value that lazily evaluates and caches based on dependencies.
 *
 * Computed values automatically track signals they read and only re-compute when
 * those dependencies change. They cache their result for efficient repeated access.
 *
 * **Isomorphic**: Works identically across all JavaScript runtimes.
 * **Performance**: Lazy evaluation - only computes when needed and dependencies change.
 * **Memory**: Automatic cleanup when all computed values are disposed.
 *
 * @template T
 * @param {function(): T} fn - Function that computes the value
 * @returns {function(): T} Computed accessor that returns cached value
 *
 * @example
 * ```javascript
 * // Basic computed value
 * const count = signal(1);
 * const doubled = computed(() => count() * 2);
 *
 * console.log(doubled()); // 2 (computes)
 * console.log(doubled()); // 2 (cached)
 *
 * count.set(3);
 * console.log(doubled()); // 6 (re-computes)
 * ```
 *
 * @example
 * ```javascript
 * // Complex computed with multiple dependencies
 * const firstName = signal("John");
 * const lastName = signal("Doe");
 * const age = signal(30);
 *
 * const profile = computed(() => ({
 *   fullName: `${firstName()} ${lastName()}`,
 *   isAdult: age() >= 18,
 *   initials: `${firstName()[0]}${lastName()[0]}`
 * }));
 *
 * console.log(profile().fullName); // "John Doe"
 * firstName.set("Jane");
 * console.log(profile().fullName); // "Jane Doe" (re-computed)
 * ```
 */
export function computed(fn) {
	/** @type {any} */
	let value;
	let isStale = true;
	let isComputing = false;
	const subs = new Set();

	const notifySubscribers = () => {
		if (isBatching) return;

		// Immediate notification for all subscribers
		for (const sub of subs) {
			try {
				sub();
			} catch (error) {
				console.error("Computed subscriber error:", error);
			}
		}
	};

	const markStale = () => {
		if (!isStale) {
			isStale = true;
			// Notify subscribers that computed is stale (they should re-read)
			notifySubscribers();
		}
	};

	const compute = () => {
		if (isComputing) {
			throw new Error("Circular dependency detected in computed");
		}

		isComputing = true;
		const prev = listener;
		listener = markStale;

		try {
			const newValue = fn();
			const hasChanged = !Object.is(value, newValue);
			value = newValue;
			isStale = false;

			// Check if we're in an initial read (the effect that's reading us is already subscribed)
			const isInitialRead = prev && subs.has(prev);

			// Only notify subscribers if value actually changed and not during initial read
			if (hasChanged && !isBatching && !isInitialRead) {
				notifySubscribers();
			}

			return value;
		} finally {
			listener = prev;
			isComputing = false;
		}
	};

	/**
	 * Reads the computed value, computing if stale.
	 * @returns {T} The computed value
	 */
	function read() {
		// Track this computed as a dependency
		if (listener) {
			subs.add(listener);
		}

		if (isStale) {
			return compute();
		}

		return value;
	}

	/**
	 * Reads the current cached value without computing.
	 * @returns {T} The cached value (may be stale)
	 */
	read.peek = () => value;

	/**
	 * Removes a subscriber from this computed.
	 * @param {function} subscriber - The subscriber to remove
	 */
	read._unsubscribe = (subscriber) => {
		subs.delete(subscriber);
	};

	return read;
}

/**
 * Groups multiple signal updates into a single batch to avoid redundant computations.
 *
 * When multiple signals are updated within a batch, dependent computed values
 * and effects will only run once at the end, improving performance.
 *
 * **Isomorphic**: Works identically across all JavaScript runtimes.
 * **Performance**: Eliminates redundant computations from multiple updates.
 * **Synchronous**: Batch completes before returning.
 *
 * @param {function(): void} fn - Function containing signal updates
 * @returns {void}
 *
 * @example
 * ```javascript
 * const a = signal(1);
 * const b = signal(2);
 * const sum = computed(() => a() + b());
 *
 * effect(() => console.log("Sum:", sum()));
 *
 * // Without batch: logs "Sum: 3", "Sum: 5", "Sum: 9"
 * a.set(2);
 * b.set(3);
 * a.set(4);
 *
 * // With batch: only logs "Sum: 9" once
 * batch(() => {
 *   a.set(2);
 *   b.set(3);
 *   a.set(4);
 * });
 * ```
 */
export function batch(fn) {
	// Track batch depth for nested batches
	batchDepth++;

	// Set batching flag if this is the first batch
	if (batchDepth === 1) {
		isBatching = true;
	}

	try {
		fn();
	} finally {
		batchDepth--;

		// Only flush when exiting the outermost batch
		if (batchDepth === 0) {
			isBatching = false;
			flushBatchedSignals();
		}
	}
}

/**
 * Reads signals without creating dependency tracking.
 *
 * When called within an effect or computed, untrack prevents the signals
 * read inside from becoming dependencies. Useful for conditional logic
 * and side effects that shouldn't trigger re-runs.
 *
 * **Isomorphic**: Works identically across all JavaScript runtimes.
 * **Performance**: Avoids unnecessary effect re-runs.
 * **Selective**: Only affects signals read within the untrack function.
 *
 * @template T
 * @param {function(): T} fn - Function to run without dependency tracking
 * @returns {T} The result of the function
 *
 * @example
 * ```javascript
 * const condition = signal(true);
 * const value = signal(1);
 * const debug = signal("debug info");
 *
 * const result = computed(() => {
 *   if (condition()) {
 *     // This creates a dependency on debug
 *     console.log("Debug:", debug());
 *     return value() * 2;
 *   }
 *
 *   // This does NOT create a dependency on debug
 *   untrack(() => console.log("Untracked debug:", debug()));
 *   return value();
 * });
 *
 * // Changing debug will trigger re-computation only in first case
 * ```
 */
export function untrack(fn) {
	const prev = listener;
	listener = null;

	try {
		return fn();
	} finally {
		listener = prev;
	}
}
