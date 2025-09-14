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

//
// Global, bundler-agnostic singleton runtime
//
const __g = /** @type {any} */ (globalThis);
const __KEY__ = Symbol.for("@raven-js/reflex/runtime");
const __VERSION__ = "0.1.0";

/**
 * @typedef {Object} ReflexRuntime
 * @property {string} version
 * @property {Function|null} listener
 * @property {boolean} isRenderingTemplate
 * @property {Array<() => void>} deferredEffects
 * @property {{slots:any,cursor:number}|null} currentRenderScope
 * @property {Set<() => void>} pendingComputeds
 * @property {Set<() => void>} pendingEffects
 * @property {boolean} scheduled
 * @property {boolean} flushing
 * @property {Array<(v?:any)=>void>} afterFlushWaiters
 * @property {(err:any, where:string) => void} onError
 * @property {() => void} bumpWriteVersion
 * @property {Array<{promises:Set<Promise<any>>, track(p:Promise<any>):void}>} contextStack
 * @property {(opts?:{hard?:boolean}) => void} reset
 */

/**
 * Create the shared runtime state and API. This ensures all bundles/pages
 * use the same reactive graph, scheduler and hydration coordination.
 */
/** @returns {ReflexRuntime} */
function __createRuntime() {
  // Ensure global write version exists
  if (typeof __g.__REFLEX_WRITE_VERSION__ !== "number") {
    __g.__REFLEX_WRITE_VERSION__ = 0;
  }
  // Ensure global SSR/hydration context stack exists (browser-only usage)
  if (!__g.__REFLEX_CONTEXT_STACK__) __g.__REFLEX_CONTEXT_STACK__ = [];

  /** @type {ReflexRuntime} */
  const runtime = {
    version: __VERSION__,
    listener: null,
    isRenderingTemplate: false,
    deferredEffects: [],
    currentRenderScope: null,
    pendingComputeds: new Set(),
    pendingEffects: new Set(),
    scheduled: false,
    flushing: false,
    afterFlushWaiters: [],
    onError(err, where) {
      try {
        __g.__REFLEX_ON_ERROR__?.(err, where);
      } catch {}
      // eslint-disable-next-line no-console
      console.error(err);
    },
    bumpWriteVersion() {
      __g.__REFLEX_WRITE_VERSION__++;
    },
    contextStack: /** @type {any[]} */ (__g.__REFLEX_CONTEXT_STACK__),
    reset(opts) {
      // Clear only scheduler queues and listeners; avoid clearing global stacks
      this.pendingComputeds.clear();
      this.pendingEffects.clear();
      this.afterFlushWaiters.length = 0;
      this.scheduled = false;
      this.flushing = false;
      this.listener = null;
      this.isRenderingTemplate = false;
      this.deferredEffects.length = 0;
      this.currentRenderScope = null;
      if (opts?.hard) {
        // Hard reset write version for tests if requested
        __g.__REFLEX_WRITE_VERSION__ = 0;
      }
    },
  };
  return runtime;
}

/** @type {ReflexRuntime} */
let __R = /** @type {ReflexRuntime} */ (__g[__KEY__]);
if (!__R) {
  __R = __createRuntime();
  __g[__KEY__] = __R;
} else if (__R.version !== __VERSION__ && typeof console !== "undefined") {
  // Prefer the first loaded version to keep graph stable
  console.warn("[reflex] multiple versions loaded; using", __R.version, "ignoring", __VERSION__);
}

// Public, test-friendly handle to the SSR/hydration context stack
export const contextStack = __R.contextStack;

/**
 * Run function in template rendering context with deferred effect execution.
 *
 * Template context preserves component instances via render slots and defers effect
 * execution until template completion. Supports async templates by keeping context
 * active until Promise settles.
 *
 * @example
 * // Basic template context
 * const html = withTemplateContext(() => {
 *   const count = signal(0); // preserved across renders
 *   effect(() => console.log('deferred until template done'));
 *   return `<div>Count: ${count()}</div>`;
 * });
 *
 * @example
 * // Async template
 * const html = await withTemplateContext(async () => {
 *   const data = await fetch('/api/data');
 *   return `<div>${await data.text()}</div>`;
 * });
 *
 * @template T
 * @param {() => T | Promise<T>} fn
 * @param {{slots:any,cursor:number}} [scope]
 * @returns {T | Promise<T>}
 */
export function withTemplateContext(fn, scope) {
  const wasRendering = __R.isRenderingTemplate;
  __R.isRenderingTemplate = true;

  // Root call owns the defer queue
  const savedQueue = wasRendering ? __R.deferredEffects : [];
  if (!wasRendering) __R.deferredEffects = [];

  // Push render scope
  const prevScope = __R.currentRenderScope;
  if (scope) {
    __R.currentRenderScope = scope;
    __R.currentRenderScope.cursor = 0;
  }

  let finalized = false;
  const finalize = () => {
    if (finalized) return;
    finalized = true;

    // Only root executes deferred effects
    if (!wasRendering && __R.deferredEffects.length) {
      const queue = __R.deferredEffects;
      __R.deferredEffects = [];
      for (const fx of queue) {
        try {
          fx();
        } catch (e) {
          __R.onError(e, "deferred effect");
        }
      }
    }

    __R.isRenderingTemplate = wasRendering;
    if (!wasRendering) __R.deferredEffects = savedQueue;
    __R.currentRenderScope = prevScope;
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
        }
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
 * Use render slot for component instance preservation during template renders.
 * @template T
 * @param {() => T} factory
 * @returns {T}
 */
function useRenderSlot(factory) {
  if (__R.isRenderingTemplate && __R.currentRenderScope) {
    const i = __R.currentRenderScope.cursor++;
    if (i in __R.currentRenderScope.slots) return __R.currentRenderScope.slots[i];
    const v = factory();
    __R.currentRenderScope.slots[i] = v;
    return v;
  }
  return factory();
}

/* ---------------- scheduler (computed-first) ---------------- */

/** Increment global write version to track reactive state changes. */
function __bumpWriteVersion() {
  __R.bumpWriteVersion();
}

/**
 * Wait for the next flush cycle to complete.
 *
 * Returns a Promise that resolves after all pending computed updates and effects
 * have executed. Useful for ensuring DOM updates are complete before proceeding.
 *
 * @example
 * // Wait for updates
 * const count = signal(0);
 * await count.set(5);
 * await afterFlush(); // All effects have run
 *
 * @returns {Promise<void>} resolves after a full flush cycle
 */
export function afterFlush() {
  return new Promise((res) => {
    __R.afterFlushWaiters.push(res);
    scheduleFlush();
  });
}

/** Schedule microtask flush if not already scheduled. */
function scheduleFlush() {
  if (!__R.scheduled) {
    __R.scheduled = true;
    queueMicrotask(flush);
  }
}

/** Execute computed updates first, then effects, with error isolation. */
function flush() {
  if (__R.flushing) return;
  __R.flushing = true;
  try {
    // 1) propagate computeds until stable
    while (__R.pendingComputeds.size) {
      const batch = Array.from(__R.pendingComputeds);
      __R.pendingComputeds.clear();
      for (const update of batch) {
        try {
          update();
        } catch (e) {
          __R.onError(e, "computed");
        }
      }
    }
    // 2) run effects
    if (__R.pendingEffects.size) {
      const ef = Array.from(__R.pendingEffects);
      __R.pendingEffects.clear();
      for (const run of ef) {
        try {
          run();
        } catch (e) {
          __R.onError(e, "effect");
        }
      }
    }
  } finally {
    const waiters = __R.afterFlushWaiters;
    __R.afterFlushWaiters = [];
    for (const w of waiters) w();
    __R.scheduled = false;
    __R.flushing = false;
  }
}

/** @returns {number} internal - current write version (global) */
export function __getWriteVersion() {
  return __g.__REFLEX_WRITE_VERSION__;
}

/* ---------------- signal / computed / effect ---------------- */

/**
 * Create reactive signal with automatic dependency tracking and change notifications.
 *
 * Signal values are read by calling the signal as a function. Dependencies are tracked
 * automatically when read inside computed values or effects. Updates trigger scheduled
 * flushes to maintain consistent state across the reactive graph.
 *
 * @example
 * // Basic usage
 * const count = signal(0);
 * console.log(count()); // 0
 * await count.set(5);
 * console.log(count()); // 5
 *
 * @example
 * // Update with function
 * const items = signal(['apple', 'banana']);
 * await items.update(list => [...list, 'cherry']);
 *
 * @example
 * // Manual subscription
 * const name = signal('Alice');
 * const unsubscribe = name.subscribe(value => {
 *   console.log('Name changed:', value);
 * });
 * // Later: unsubscribe()
 *
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
      if (__R.listener) {
        subs.add(__R.listener);
        const l = /** @type {any} */ (__R.listener);
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
          __R.pendingComputeds.add(s._update);
        } else if (s._isEffect) {
          __R.pendingEffects.add(s);
        } else if (typeof s === "function") {
          try {
            s(value);
          } catch (e) {
            __R.onError(e, "subscriber");
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
 * Create computed value that automatically updates when dependencies change.
 *
 * Computed values cache their result and only recompute when their signal dependencies
 * change. They update during the computed phase before effects run, ensuring consistent
 * state. Circular dependencies are detected and throw errors.
 *
 * @example
 * // Basic derived state
 * const count = signal(0);
 * const doubled = computed(() => count() * 2);
 * console.log(doubled()); // 0
 * await count.set(5);
 * console.log(doubled()); // 10
 *
 * @example
 * // Complex computation
 * const todos = signal([]);
 * const completedTodos = computed(() =>
 *   todos().filter(todo => todo.completed)
 * );
 * const progress = computed(() =>
 *   completedTodos().length / todos().length
 * );
 *
 * @example
 * // Conditional dependencies
 * const mode = signal('light');
 * const theme = computed(() =>
 *   mode() === 'dark' ? getDarkTheme() : getLightTheme()
 * );
 *
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
      const prev = __R.listener;
      cleanup();
      __R.listener = comp;
      try {
        const next = fn();
        const changed = !Object.is(value, next);
        value = next;
        valid = true;
        if (changed) {
          for (const dep of dependents) {
            if (dep._isComputed) {
              dep._invalidate();
              __R.pendingComputeds.add(dep._update);
            } else if (dep._isEffect) {
              __R.pendingEffects.add(dep);
            }
          }
        }
      } finally {
        __R.listener = prev;
        computing = false;
      }
    }

    /** @type {any} */
    const comp = () => {
      if (__R.listener) dependents.add(__R.listener);
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
 * Create side effect that runs when its signal dependencies change.
 *
 * Effects run after computed values have updated, ensuring consistent state.
 * They automatically track signal dependencies and re-run when those signals change.
 * Returns a disposer function to stop the effect and clean up dependencies.
 *
 * @example
 * // Basic side effect
 * const count = signal(0);
 * const dispose = effect(() => {
 *   console.log('Count is:', count());
 * });
 * // Logs: "Count is: 0"
 *
 * await count.set(5);
 * // Logs: "Count is: 5"
 *
 * @example
 * // DOM synchronization
 * const title = signal('Welcome');
 * effect(() => {
 *   document.title = title();
 * });
 *
 * @example
 * // Async effects (promises tracked in SSR contexts)
 * const userId = signal(null);
 * effect(async () => {
 *   if (userId()) {
 *     const response = await fetch(`/api/users/${userId()}`);
 *     const user = await response.json();
 *     console.log('User loaded:', user);
 *   }
 * });
 *
 * @param {() => any} fn
 * @returns {() => void} disposer
 */
export function effect(fn) {
  return useRenderSlot(() => {
    let disposed = false;
    const deps = new Set();

    function run() {
      if (disposed) return;
      const prevListener = __R.listener;

      // reset deps (unsubscribe from old first)
      for (const d of Array.from(deps)) d._unsubscribe(runAny);
      deps.clear();

      __R.listener = runAny;
      try {
        const out = fn();
        const ctx = contextStack[contextStack.length - 1];
        if (out && typeof out.then === "function" && ctx) ctx.track(out);
        return out;
      } finally {
        __R.listener = prevListener;
      }
    }

    /** @type {any} */
    const runAny = run;
    runAny._isEffect = true;
    runAny._addDependency = (/** @type {any} */ dep) => {
      deps.add(dep);
    };

    // Initial run: defer if inside template
    if (__R.isRenderingTemplate) {
      __R.deferredEffects.push(() => {
        try {
          run();
        } catch (e) {
          __R.onError(e, "effect");
        }
      });
    } else {
      try {
        run();
      } catch (e) {
        __R.onError(e, "effect");
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
 * Run function without automatic dependency tracking.
 *
 * Prevents signals read inside the function from being tracked as dependencies
 * by the current computed or effect. Useful for accessing signals without
 * creating reactive relationships.
 *
 * @example
 * // Read signal without tracking
 * const count = signal(0);
 * const doubled = computed(() => {
 *   const debug = untrack(() => count()); // not tracked
 *   console.log('Debug:', debug);
 *   return count() * 2; // this IS tracked
 * });
 *
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function untrack(fn) {
  const prev = __R.listener;
  __R.listener = null;
  try {
    return fn();
  } finally {
    __R.listener = prev;
  }
}

/** Test helper: reset scheduler state; use wisely in tests only. */
export function __resetReflexForTests() {
  __R.reset({ hard: false });
}
