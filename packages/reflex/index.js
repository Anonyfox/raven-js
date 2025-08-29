/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Core reactive primitives (signal/computed/effect) with:
 * - microtask scheduler (computed-first, then effects)
 * - template context that defers effect creation during renders
 * - render slots for transparent state preservation
 * - ultra-lean, zero deps, cross-platform
 */

/** @type {Function|null} */
let listener = null;

/** Reactive contexts for SSR/hydration to track promises. */
// Always use a global singleton to avoid duplicate module instances.
const __g = /** @type {any} */ (globalThis);
if (!__g.__REFLEX_CONTEXT_STACK__) __g.__REFLEX_CONTEXT_STACK__ = [];
export const contextStack =
	/** @type {Array<{promises:Set<Promise<any>>, track(p:Promise<any>):void} >} */ (
		__g.__REFLEX_CONTEXT_STACK__
	);

// Single source of truth for write version across all module instances
if (typeof __g.__REFLEX_WRITE_VERSION__ !== "number") {
	__g.__REFLEX_WRITE_VERSION__ = 0;
}

/* ---------------- template rendering context ---------------- */

/** @type {boolean} */
let isRenderingTemplate = false;
/** @type {Array<() => void>} */
let deferredEffects = [];
/** @type {{slots:any,cursor:number}|null} */
let currentRenderScope = null;

/**
 * Runs `fn` in a template context.
 * If `fn` returns a Promise, the context stays active until it settles,
 * then deferred effects are executed exactly once.
 * @template T
 * @param {() => T | Promise<T>} fn
 * @param {{slots:any,cursor:number}} [scope]
 * @returns {T | Promise<T>}
 */
export function withTemplateContext(fn, scope) {
	const wasRendering = isRenderingTemplate;
	isRenderingTemplate = true;

	// Root call owns the defer queue
	const savedQueue = wasRendering ? deferredEffects : [];
	if (!wasRendering) deferredEffects = [];

	// Push render scope
	const prevScope = currentRenderScope;
	if (scope) {
		currentRenderScope = scope;
		currentRenderScope.cursor = 0;
	}

	let finalized = false;
	const finalize = () => {
		if (finalized) return;
		finalized = true;

		// Only root executes deferred effects
		if (!wasRendering && deferredEffects.length) {
			const queue = deferredEffects;
			deferredEffects = [];
			for (const fx of queue) {
				try {
					fx();
				} catch (e) {
					onError(e, "deferred effect");
				}
			}
		}

		isRenderingTemplate = wasRendering;
		if (!wasRendering) deferredEffects = savedQueue;
		currentRenderScope = prevScope;
	};

	try {
		const out = fn();
		// Async-aware: keep context open until it settles
		if (out && typeof (/** @type {any} */ (out).then) === "function") {
			return /** @type {Promise<T>} */ (out).then(
				(v) => {
					finalize();
					return v;
				},
				(e) => {
					finalize();
					throw e;
				},
			);
		}
		finalize();
		return out;
	} catch (e) {
		finalize();
		throw e;
	}
}

/**
 * @template T
 * @param {() => T} factory
 * @returns {T}
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

/* ---------------- scheduler (computed-first) ---------------- */

const pendingComputeds = new Set(); // Set<() => void> updates
const pendingEffects = new Set(); // Set<() => void>
let scheduled = false;
let flushing = false;
/** @type {Array<(v?:any)=>void>} */
let _afterFlushWaiters = [];

/** small helper */
function __bumpWriteVersion() {
	__g.__REFLEX_WRITE_VERSION__++;
}

/** @returns {Promise<void>} resolves after a full flush cycle */
export function afterFlush() {
	return new Promise((res) => {
		_afterFlushWaiters.push(res);
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
		// 1) propagate computeds until stable
		while (pendingComputeds.size) {
			const batch = Array.from(pendingComputeds);
			pendingComputeds.clear();
			for (const update of batch) {
				try {
					update();
				} catch (e) {
					onError(e, "computed");
				}
			}
		}
		// 2) run effects
		if (pendingEffects.size) {
			const ef = Array.from(pendingEffects);
			pendingEffects.clear();
			for (const run of ef) {
				try {
					run();
				} catch (e) {
					onError(e, "effect");
				}
			}
		}
	} finally {
		const waiters = _afterFlushWaiters;
		_afterFlushWaiters = [];
		for (const w of waiters) w();
		scheduled = false;
		flushing = false;
	}
}

function onError(/** @type {any} */ err, /** @type {string} */ where) {
	try {
		/** @type {any} */ (globalThis).__REFLEX_ON_ERROR__?.(err, where);
	} catch {}
	// eslint-disable-next-line no-console
	console.error(err);
}

/** @returns {number} internal - current write version (global) */
export function __getWriteVersion() {
	return __g.__REFLEX_WRITE_VERSION__;
}

/* ---------------- signal / computed / effect ---------------- */

/**
 * @template T
 * @param {T} initial
 * @returns {{
 *   (): T,
 *   peek(): T,
 *   set(v:T): Promise<void>,
 *   update(fn:(v:T)=>T): Promise<void>,
 *   subscribe(fn:(v:T)=>void): ()=>void,
 *   _unsubscribe(fn:any): void
 * }}
 */
export function signal(initial) {
	return useRenderSlot(() => {
		/** @type {T} */
		let value = initial;
		const subs = new Set();

		/** @returns {T} */
		const read = () => {
			if (listener) {
				subs.add(listener);
				const l = /** @type {any} */ (listener);
				if (l._isEffect && l._addDependency) l._addDependency(read);
				else if (l._isComputed && l._trackDependency) l._trackDependency(read);
			}
			return value;
		};

		read.peek = () => value;

		read.subscribe = (/** @type {any} */ fn) => {
			subs.add(fn);
			return () => subs.delete(fn);
		};
		read._unsubscribe = (/** @type {any} */ fn) => {
			subs.delete(fn);
		};

		read.set = async (/** @type {T} */ next) => {
			if (Object.is(value, next)) return;
			value = next;
			__bumpWriteVersion();

			for (const s of subs) {
				if (s._isComputed) {
					s._invalidate();
					pendingComputeds.add(s._update);
				} else if (s._isEffect) {
					pendingEffects.add(s);
				} else if (typeof s === "function") {
					try {
						s(value);
					} catch (e) {
						onError(e, "subscriber");
					}
				}
			}
			scheduleFlush();
			return afterFlush();
		};

		read.update = (/** @type {(v:T)=>T} */ fn) => read.set(fn(value));

		return read;
	});
}

/**
 * @template T
 * @param {() => T} fn
 * @returns {{():T, peek():T, _unsubscribe(fn:any):void, _isComputed:true}}
 */
export function computed(fn) {
	return useRenderSlot(() => {
		/** @type {T} */ let value;
		let valid = false;
		let computing = false;
		const deps = new Set(); // Set<signal-read>
		const dependents = new Set(); // Set<effect|computed>

		function cleanup() {
			for (const d of deps) d._unsubscribe(comp);
			deps.clear();
		}
		function recompute() {
			if (computing) throw new Error("Circular dependency in computed");
			computing = true;
			const prev = listener;
			cleanup();
			listener = comp;
			try {
				const next = fn();
				const changed = !Object.is(value, next);
				value = next;
				valid = true;
				if (changed) {
					for (const dep of dependents) {
						if (dep._isComputed) {
							dep._invalidate();
							pendingComputeds.add(dep._update);
						} else if (dep._isEffect) {
							pendingEffects.add(dep);
						}
					}
				}
			} finally {
				listener = prev;
				computing = false;
			}
		}

		/** @type {any} */
		const comp = () => {
			if (listener) dependents.add(listener);
			if (!valid) recompute();
			return value;
		};

		comp._isComputed = true;
		comp._invalidate = () => {
			valid = false;
		};
		comp._update = recompute;
		comp._trackDependency = (/** @type {any} */ dep) => {
			deps.add(dep);
		};
		comp.peek = () => value;
		comp._unsubscribe = (/** @type {any} */ fn) => {
			dependents.delete(fn);
			if (dependents.size === 0) cleanup();
		};

		recompute();
		return comp;
	});
}

/**
 * @param {() => any} fn
 * @returns {() => void} disposer
 */
export function effect(fn) {
	return useRenderSlot(() => {
		let disposed = false;
		const deps = new Set();

		function run() {
			if (disposed) return;
			const prevListener = listener;

			// reset deps (unsubscribe from old first)
			for (const d of Array.from(deps)) d._unsubscribe(runAny);
			deps.clear();

			listener = runAny;
			try {
				const out = fn();
				const ctx = contextStack[contextStack.length - 1];
				if (out && typeof out.then === "function" && ctx) ctx.track(out);
				return out;
			} finally {
				listener = prevListener;
			}
		}

		/** @type {any} */
		const runAny = run;
		runAny._isEffect = true;
		runAny._addDependency = (/** @type {any} */ dep) => {
			deps.add(dep);
		};

		// Initial run: defer if inside template
		if (isRenderingTemplate) {
			deferredEffects.push(() => {
				try {
					run();
				} catch (e) {
					onError(e, "effect");
				}
			});
		} else {
			try {
				run();
			} catch (e) {
				onError(e, "effect");
			}
		}

		return () => {
			disposed = true;
			for (const d of Array.from(deps)) d._unsubscribe(runAny);
			deps.clear();
		};
	});
}

/**
 * Runs `fn` without dependency tracking.
 * @template T
 * @param {() => T} fn
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
