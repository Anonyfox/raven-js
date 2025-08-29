/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Lean test suite for reactive signals with surgical precision
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	afterFlush,
	computed,
	contextStack,
	effect,
	signal,
	untrack,
	withTemplateContext,
} from "./index.js";

const flush = () => new Promise((r) => queueMicrotask(r));

describe("core primitives", () => {
	it("signal create/read/write", async () => {
		const s = signal(42);
		assert.strictEqual(s(), 42);
		assert.strictEqual(s.peek(), 42);

		await s.set(100);
		assert.strictEqual(s(), 100);

		await s.update((x) => x * 2);
		assert.strictEqual(s(), 200);
	});

	it("computed caches and dependency tracking", async () => {
		const a = signal(2);
		const b = signal(3);
		const flag = signal(true);
		let calls = 0;

		const c = computed(() => {
			calls++;
			return flag() ? a() : b();
		});

		assert.strictEqual(c(), 2);
		assert.strictEqual(c(), 2); // cached
		assert.strictEqual(calls, 1);

		await b.set(30); // not tracked
		assert.strictEqual(calls, 1);

		await a.set(20); // tracked
		assert.strictEqual(calls, 2);
		assert.strictEqual(c(), 20);

		await flag.set(false); // switch deps
		assert.strictEqual(calls, 3);
		assert.strictEqual(c(), 30);

		await a.set(999); // no longer tracked
		assert.strictEqual(calls, 3);
	});

	it("effect runs and tracks dependencies", async () => {
		const s = signal(1);
		const log = [];

		const dispose = effect(() => log.push(s()));
		assert.deepStrictEqual(log, [1]);

		await s.set(2);
		await flush();
		assert.deepStrictEqual(log, [1, 2]);

		dispose();
		await s.set(3);
		assert.deepStrictEqual(log, [1, 2]); // no more updates
	});

	it("diamond problem solution", async () => {
		const root = signal(1);
		const left = computed(() => root() * 2);
		const right = computed(() => root() * 3);
		const snapshots = [];

		const dispose = effect(() => {
			snapshots.push({ left: left(), right: right(), sum: left() + right() });
		});

		assert.deepStrictEqual(snapshots[0], { left: 2, right: 3, sum: 5 });

		await root.set(10);
		await flush();

		// No glitches - single consistent snapshot
		assert.strictEqual(snapshots.length, 2);
		assert.deepStrictEqual(snapshots[1], { left: 20, right: 30, sum: 50 });

		dispose();
	});

	it("untrack prevents dependency registration", async () => {
		const a = signal(1);
		const b = signal(100);
		let runs = 0;

		const dispose = effect(() => {
			runs++;
			a();
			untrack(() => b());
		});

		assert.strictEqual(runs, 1);

		await b.set(200); // untracked
		assert.strictEqual(runs, 1);

		await a.set(5); // tracked
		await flush();
		assert.strictEqual(runs, 2);

		dispose();
	});
});

describe("scheduler", () => {
	it("batches multiple signal updates", async () => {
		const a = signal(1);
		const b = signal(2);
		const log = [];

		const dispose = effect(() => log.push(`${a()}-${b()}`));
		assert.deepStrictEqual(log, ["1-2"]);

		// Multiple sync updates batch into single effect run
		a.set(10);
		b.set(20);
		a.set(30);

		await flush();
		assert.deepStrictEqual(log, ["1-2", "30-20"]);

		dispose();
	});

	it("computes before effects", async () => {
		const sig = signal(1);
		let computeOrder = 0;
		let effectOrder = 0;

		const comp = computed(() => {
			computeOrder = Date.now();
			return sig() * 2;
		});

		const dispose = effect(() => {
			effectOrder = Date.now();
			comp();
		});

		await sig.set(5);
		await flush();

		assert.ok(computeOrder <= effectOrder, "Computed should run before effect");
		dispose();
	});

	it("handles chained computed invalidation", async () => {
		const sig = signal(1);
		const comp1 = computed(() => sig() * 2);
		const comp2 = computed(() => comp1() + 10);
		let runs = 0;

		const dispose = effect(() => {
			runs++;
			comp2();
		});

		assert.strictEqual(runs, 1);

		await sig.set(5);
		await flush();

		assert.strictEqual(runs, 2);
		assert.strictEqual(comp2(), 20); // (5 * 2) + 10

		dispose();
	});
});

describe("template context", () => {
	it("defers effects during rendering", () => {
		const s = signal(1);
		const log = [];
		let disposeEffect;

		const result = withTemplateContext(() => {
			disposeEffect = effect(() => log.push(s()));
			return "rendered";
		});

		assert.strictEqual(result, "rendered");
		assert.deepStrictEqual(log, [1]); // Effect ran after template completion

		if (disposeEffect) disposeEffect();
	});

	it("preserves render slots across calls", () => {
		const scope = { slots: [], cursor: 0 };
		let instanceCount = 0;

		// First render
		const result1 = withTemplateContext(() => {
			const s = signal(instanceCount++);
			return s();
		}, scope);

		// Second render - should reuse same signal instance
		scope.cursor = 0; // Reset cursor for new render
		const result2 = withTemplateContext(() => {
			const s = signal(999); // This factory won't be called, slot 0 reused
			return s();
		}, scope);

		assert.strictEqual(result1, 0);
		assert.strictEqual(result2, 0); // Same instance value
		assert.strictEqual(instanceCount, 1); // Only one signal created
	});

	it("nested template contexts work correctly", () => {
		const outer = withTemplateContext(() => {
			return withTemplateContext(() => {
				return "nested";
			});
		});

		assert.strictEqual(outer, "nested");
	});
});

describe("context stack", () => {
	it("tracks promises in reactive context", async () => {
		const mockPromise = Promise.resolve("test");
		let tracked = false;

		const mockContext = {
			promises: new Set(),
			track(p) {
				this.promises.add(p);
				tracked = true;
			},
		};

		contextStack.push(mockContext);

		effect(() => {
			return mockPromise; // Should be tracked
		});

		contextStack.pop();

		assert.strictEqual(tracked, true);
	});
});

describe("edge cases", () => {
	it("handles Object.is equality", async () => {
		const s = signal(NaN);
		let updates = 0;

		const dispose = effect(() => {
			s();
			updates++;
		});

		assert.strictEqual(updates, 1);

		await s.set(NaN); // Same value
		assert.strictEqual(updates, 1);

		await s.set(0); // Different value
		await flush();
		assert.strictEqual(updates, 2);

		dispose();
	});

	it("circular dependency detection", () => {
		const sig = signal(1);

		let comp;
		comp = computed(() => {
			if (sig() > 1) {
				assert.throws(() => comp(), /Circular dependency in computed/);
				return sig(); // Return valid value after error
			}
			return sig();
		});

		assert.strictEqual(comp(), 1);
		sig.set(2); // Trigger circular attempt
		assert.strictEqual(comp(), 2); // Should work after handling error
	});

	it("error handling with custom hook", () => {
		let hookCalled = false;
		let hookContext = null;

		globalThis.__REFLEX_ON_ERROR__ = (_err, context) => {
			hookCalled = true;
			hookContext = context;
		};

		const s = signal(1);
		const dispose = effect(() => {
			s();
			throw new Error("test error");
		});

		assert.strictEqual(hookCalled, true);
		assert.strictEqual(hookContext, "effect");

		dispose();
		delete globalThis.__REFLEX_ON_ERROR__;
	});

	it("subscription lifecycle", async () => {
		const s = signal(1);
		let calls = 0;

		const unsub = s.subscribe(() => calls++);
		assert.strictEqual(calls, 0); // Subscription doesn't call immediately

		await s.set(2);
		assert.strictEqual(calls, 1);

		unsub();
		await s.set(3);
		assert.strictEqual(calls, 1); // No more calls after unsubscribe
	});

	it("computed cleanup when unobserved", async () => {
		const s = signal(1);
		let computeCount = 0;

		const comp = computed(() => {
			computeCount++;
			return s() * 2;
		});

		// Create dependent
		const dispose = effect(() => comp());
		assert.strictEqual(computeCount, 1);

		// Remove dependent
		dispose();

		// Source changes shouldn't trigger immediate recompute
		await s.set(10);
		await flush();

		// But reading should return updated value
		assert.strictEqual(comp(), 20);
	});

	it("afterFlush promise resolution", async () => {
		const s = signal(1);
		let resolved = false;

		s.set(2);
		afterFlush().then(() => {
			resolved = true;
		});

		assert.strictEqual(resolved, false);
		await flush();
		assert.strictEqual(resolved, true);
	});
});
