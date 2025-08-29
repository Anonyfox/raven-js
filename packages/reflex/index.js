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

/** @type {Function|null} */
let listener = null; // current observer during reads
/** @type {Array<{track: function(Promise<any>): void}>} */
export const contextStack = []; // SSR/hydration integration

// ---- template rendering context (infinite loop prevention) ----------------

/** @type {boolean} */
let isRenderingTemplate = false; // tracks when inside template execution
/** @type {Array<function(): void>} */
let deferredEffects = []; // effects deferred until template completes

// ---- per-render component scope (transparent state preservation) -----------

/** @type {{slots: any[], cursor: number}|null} */
let currentRenderScope = null; // per-render component scope

/**
 * Use a render slot for transparent state preservation across re-renders.
 * If inside template rendering with a scope, reuses existing instances.
 * Otherwise creates new instances normally.
 * @template T
 * @param {function(): T} factory - Factory function to create the instance
 * @returns {T} Either cached instance or new instance
 */
function useRenderSlot(factory) {
	if (isRenderingTemplate && currentRenderScope) {
		const i = currentRenderScope.cursor++;
		if (i in currentRenderScope.slots) return currentRenderScope.slots[i];
		const v = factory();
		currentRenderScope.slots[i] = v;
		return v;
	}
	return factory();
}

/**
 * Execute function within template rendering context.
 * Effects created during template rendering are deferred until completion.
 * @template T
 * @param {function(): T} fn - Function to execute in template context
 * @param {{slots: any[], cursor: number}} [scope] - Optional render scope for state preservation
 * @returns {T} Result of function execution
 */
export function withTemplateContext(fn, scope) {
	const wasRendering = isRenderingTemplate;
	isRenderingTemplate = true;
	const savedEffects = wasRendering ? deferredEffects : [];
	if (!wasRendering) deferredEffects = [];

	// Push render scope for this pass
	const prevScope = currentRenderScope;
	if (scope) {
		currentRenderScope = scope;
		currentRenderScope.cursor = 0; // reset read head each render
	}

	try {
		const result = fn();

		// Execute deferred effects after template completes (only for root template)
		if (!wasRendering && deferredEffects.length) {
			const effects = deferredEffects;
			deferredEffects = [];
			for (const effectFn of effects) {
				try {
					effectFn();
				} catch (e) {
					onError(e, "deferred effect");
				}
			}
		}

		return result;
	} finally {
		isRenderingTemplate = wasRendering;
		if (!wasRendering) deferredEffects = savedEffects;
		// Pop render scope
		currentRenderScope = prevScope;
	}
}

// ---- scheduler (diamond problem solution) ----------------------------------

const pendingComputeds = new Set();
const pendingEffects = new Set();
let scheduled = false;
let flushing = false;
/** @type {Array<any>} */
let _afterFlush = []; // waiters resolved after flush

function afterFlushPromise() {
	return new Promise((r) => {
		_afterFlush.push(r);
		scheduleFlush();
	});
}

function scheduleFlush() {
	if (!scheduled) {
		scheduled = true;
		queueMicrotask(flush);
	}
}

function flush() {
	if (flushing) return;
	flushing = true;
	try {
		// Phase 1: Update all computeds first (dependency order)
		while (pendingComputeds.size) {
			const computeds = Array.from(pendingComputeds);
			pendingComputeds.clear();
			for (const update of computeds) {
				try {
					update();
				} catch (e) {
					onError(e, "computed");
				}
			}
		}

		// Phase 2: Run all effects after computeds are stable
		if (pendingEffects.size) {
			const effects = Array.from(pendingEffects);
			pendingEffects.clear();
			for (const effect of effects) {
				try {
					effect();
				} catch (e) {
					onError(e, "effect");
				}
			}
		}
	} finally {
		const waiters = _afterFlush;
		_afterFlush = [];
		for (const resolve of waiters) resolve();
		scheduled = false;
		flushing = false;
	}
}

/**
 * @param {any} err - The error that occurred
 * @param {string} where - Where the error occurred
 */
function onError(err, where) {
	try {
		/** @type {any} */ (globalThis).__REFLEX_ON_ERROR__?.(err, where);
	} catch {}
	console.error(err);
}

// ---- resource auto-cleanup -------------------------------------------------

/** @type {any} */
let activeEffect = null;
const _origTO = globalThis.setTimeout,
	_origTI = globalThis.setInterval;

/** @type {any} */
globalThis.setTimeout = /** @type {any} */ (
	(/** @type {any} */ fn, /** @type {any} */ ms, /** @type {any} */ ...a) => {
		const id = _origTO(fn, ms, ...a);
		if (activeEffect) activeEffect._cleanups.add(() => clearTimeout(id));
		return id;
	}
);

/** @type {any} */
globalThis.setInterval = /** @type {any} */ (
	(/** @type {any} */ fn, /** @type {any} */ ms, /** @type {any} */ ...a) => {
		const id = _origTI(fn, ms, ...a);
		if (activeEffect) activeEffect._cleanups.add(() => clearInterval(id));
		return id;
	}
);

if (typeof globalThis.EventTarget !== "undefined") {
	const P = globalThis.EventTarget.prototype;
	const _add = P.addEventListener,
		_rem = P.removeEventListener;
	P.addEventListener = function (type, handler, opts) {
		_add.call(this, type, handler, opts);
		if (activeEffect)
			activeEffect._cleanups.add(() => _rem.call(this, type, handler, opts));
	};
}

// ---- signal -----------------------------------------------------------------

/**
 * @template T
 * @param {T} initial
 * @returns {{(): T, peek(): T, set(value: T): Promise<void>, update(fn: function(T): T): Promise<void>, subscribe(fn: function(T): void): function(): void, _unsubscribe(fn: any): void}}
 */
export function signal(initial) {
	return useRenderSlot(() => {
		let value = initial;
		const subscribers = new Set();

		const read = () => {
			// Track dependency if there's a listener
			if (listener) {
				subscribers.add(listener);
				// For effects, track the dependency bidirectionally
				/** @type {any} */
				const listenerAny = listener;
				if (listenerAny._isEffect && listenerAny._addDependency) {
					listenerAny._addDependency(read);
				} else if (listenerAny._isComputed && listenerAny._trackDependency) {
					listenerAny._trackDependency(read);
				}
			}
			return value;
		};

		read.peek = () => value;

		read.subscribe = (/** @type {any} */ fn) => {
			subscribers.add(fn);
			return () => subscribers.delete(fn);
		};

		read._unsubscribe = (/** @type {any} */ fn) => {
			subscribers.delete(fn);
		};

		read.set = async (/** @type {any} */ next) => {
			if (Object.is(value, next)) return;
			value = next;

			// Schedule all reactive subscribers
			for (const subscriber of subscribers) {
				if (subscriber._isComputed) {
					subscriber._invalidate();
					pendingComputeds.add(subscriber._update);
				} else if (subscriber._isEffect) {
					pendingEffects.add(subscriber);
				} else if (typeof subscriber === "function") {
					// Direct subscriber - call immediately
					try {
						subscriber(value);
					} catch (e) {
						onError(e, "subscriber");
					}
				}
			}

			scheduleFlush();
			return afterFlushPromise();
		};

		read.update = async (/** @type {any} */ fn) => {
			return await read.set(fn(value));
		};

		return read;
	});
}

// ---- computed ---------------------------------------------------------------

/**
 * @template T
 * @param {function(): T} fn
 * @returns {{(): T, peek(): T, _unsubscribe(fn: any): void}}
 */
export function computed(fn) {
	return useRenderSlot(() => {
		/** @type {any} */
		let value;
		let isValid = false;
		let computing = false;
		const dependencies = new Set();
		const dependents = new Set();

		function cleanup() {
			for (const dep of dependencies) {
				dep._unsubscribe(computedInstance);
			}
			dependencies.clear();
		}

		function recompute() {
			if (computing) throw new Error("Circular dependency in computed");
			computing = true;

			const prevListener = listener;
			cleanup(); // Remove old dependencies
			listener = computedInstance;

			try {
				const newValue = fn();
				const changed = !Object.is(value, newValue);
				value = newValue;
				isValid = true;

				// Schedule dependents if value changed
				if (changed) {
					for (const dependent of dependents) {
						if (dependent._isComputed) {
							dependent._invalidate();
							pendingComputeds.add(dependent._update);
						} else if (dependent._isEffect) {
							pendingEffects.add(dependent);
						}
					}
				}

				return changed;
			} finally {
				listener = prevListener;
				computing = false;
			}
		}

		const computedInstance = () => {
			// Track this computed as a dependency if there's a listener
			if (listener) {
				dependents.add(listener);
			}

			if (!isValid) {
				recompute();
			}
			return value;
		};

		computedInstance._isComputed = true;
		computedInstance._invalidate = () => {
			isValid = false;
		};
		computedInstance._update = recompute;
		computedInstance._trackDependency = (/** @type {any} */ dep) => {
			dependencies.add(dep);
		};
		computedInstance.peek = () => value;
		computedInstance._unsubscribe = (/** @type {any} */ fn) => {
			dependents.delete(fn);
			if (dependents.size === 0) {
				cleanup(); // Cleanup when no dependents
			}
		};

		// Initial computation
		recompute();

		return computedInstance;
	});
}

// ---- effect -----------------------------------------------------------------

/**
 * @param {function(): any} fn
 * @returns {function(): void}
 */
export function effect(fn) {
	return useRenderSlot(() => {
		let disposed = false;
		const dependencies = new Set();
		const cleanups = new Set();

		function cleanup() {
			for (const dep of dependencies) {
				dep._unsubscribe(effectInstance);
			}
			dependencies.clear();
		}

		function run() {
			if (disposed) return;

			const prevListener = listener;
			const prevActive = activeEffect;

			// Clear old dependencies before running
			const oldDeps = new Set(dependencies);
			for (const dep of oldDeps) {
				dep._unsubscribe(effectInstance);
			}
			dependencies.clear();

			listener = effectInstance;
			activeEffect = effectInstance;
			/** @type {any} */ (effectInstance)._cleanups = cleanups;

			try {
				const result = fn();
				const ctx = contextStack[contextStack.length - 1];
				if (result && typeof result.then === "function" && ctx) {
					ctx.track(result);
				}
				return result;
			} finally {
				listener = prevListener;
				activeEffect = prevActive;
			}
		}

		const effectInstance = /** @type {any} */ (run);
		effectInstance._isEffect = true;
		effectInstance._cleanups = cleanups;
		effectInstance._addDependency = (/** @type {any} */ dep) => {
			dependencies.add(dep);
		};

		// Initial run - defer if inside template rendering to prevent infinite loops
		if (isRenderingTemplate) {
			// Defer execution until template render completes
			deferredEffects.push(() => {
				try {
					run();
				} catch (e) {
					onError(e, "effect");
				}
			});
		} else {
			// Run immediately as normal
			try {
				run();
			} catch (e) {
				onError(e, "effect");
			}
		}

		return () => {
			disposed = true;

			// Unsubscribe from all dependencies (signals and computeds)
			for (const dep of dependencies) {
				dep._unsubscribe(effectInstance);
			}
			dependencies.clear();

			cleanup();
			for (const cleanupFn of cleanups) {
				try {
					cleanupFn();
				} catch (e) {
					onError(e, "cleanup");
				}
			}
			cleanups.clear();
		};
	});
}

// ---- untrack ----------------------------------------------------------------

/**
 * @template T
 * @param {function(): T} fn
 * @returns {T}
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
