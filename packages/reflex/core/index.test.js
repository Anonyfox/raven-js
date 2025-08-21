import assert from "node:assert";
import { describe, it } from "node:test";
import * as core from "./index.js";

describe("core/index.js", () => {
	describe("exports", () => {
		it("should export all core functions", () => {
			assert.strictEqual(typeof core.signal, "function");
			assert.strictEqual(typeof core.effect, "function");
			assert.strictEqual(typeof core.computed, "function");
			assert.strictEqual(typeof core.batch, "function");
			assert.strictEqual(typeof core.untrack, "function");
		});
	});

	describe("signal()", () => {
		it("should create signal with initial value", () => {
			const s = core.signal(42);
			assert.strictEqual(typeof s, "function");
			assert.strictEqual(s(), 42);
		});

		it("should create signal with undefined initial value", () => {
			const s = core.signal();
			assert.strictEqual(s(), undefined);
		});

		it("should have all required methods", () => {
			const s = core.signal(0);
			assert.strictEqual(typeof s.set, "function");
			assert.strictEqual(typeof s.update, "function");
			assert.strictEqual(typeof s.peek, "function");
			assert.strictEqual(typeof s.subscribe, "function");
		});

		describe("reading values", () => {
			it("should return current value when called", () => {
				const s = core.signal("hello");
				assert.strictEqual(s(), "hello");
			});

			it("should return current value with peek() without tracking", () => {
				const s = core.signal(123);
				assert.strictEqual(s.peek(), 123);
			});

			it("should handle different data types", () => {
				// Test isomorphic data type handling
				const stringSignal = core.signal("test");
				const numberSignal = core.signal(42);
				const boolSignal = core.signal(true);
				const objectSignal = core.signal({ a: 1 });
				const arraySignal = core.signal([1, 2, 3]);
				const nullSignal = core.signal(null);

				assert.strictEqual(stringSignal(), "test");
				assert.strictEqual(numberSignal(), 42);
				assert.strictEqual(boolSignal(), true);
				assert.deepStrictEqual(objectSignal(), { a: 1 });
				assert.deepStrictEqual(arraySignal(), [1, 2, 3]);
				assert.strictEqual(nullSignal(), null);
			});
		});

		describe("setting values", () => {
			it("should update value with set()", async () => {
				const s = core.signal(1);
				await s.set(2);
				assert.strictEqual(s(), 2);
			});

			it("should update value with update()", async () => {
				const s = core.signal(5);
				await s.update((x) => x * 2);
				assert.strictEqual(s(), 10);
			});

			it("should not update for same value (Object.is)", async () => {
				const s = core.signal(42);
				let notified = false;
				s.subscribe(() => {
					notified = true;
				});

				// Same value should not trigger notification
				await s.set(42);
				assert.strictEqual(notified, false);

				// Different value should trigger notification
				await s.set(43);
				assert.strictEqual(notified, true);
			});

			it("should handle Object.is edge cases", async () => {
				// Test isomorphic Object.is behavior
				const s = core.signal(NaN);
				let callCount = 0;
				s.subscribe(() => {
					callCount++;
				});

				await s.set(NaN);
				assert.strictEqual(callCount, 0, "NaN should equal NaN");

				await s.set(0);
				assert.strictEqual(callCount, 1);

				await s.set(-0);
				assert.strictEqual(callCount, 2, "0 and -0 should be different");
			});
		});

		describe("subscriptions", () => {
			it("should notify subscribers on value change", async () => {
				const s = core.signal(1);
				const results = [];

				s.subscribe((value) => {
					results.push(value);
				});
				await s.set(2);
				await s.set(3);

				assert.deepStrictEqual(results, [2, 3]);
			});

			it("should support multiple subscribers", async () => {
				const s = core.signal(0);
				const results1 = [];
				const results2 = [];

				s.subscribe((value) => {
					results1.push(`a${value}`);
				});
				s.subscribe((value) => {
					results2.push(`b${value}`);
				});

				await s.set(5);

				assert.deepStrictEqual(results1, ["a5"]);
				assert.deepStrictEqual(results2, ["b5"]);
			});

			it("should support unsubscribing", async () => {
				const s = core.signal(1);
				const results = [];

				const unsub = s.subscribe((value) => {
					results.push(value);
				});
				await s.set(2);

				unsub();
				await s.set(3);

				assert.deepStrictEqual(results, [2]);
			});

			it("should handle async subscribers", async () => {
				const s = core.signal(0);
				const results = [];

				s.subscribe(async (value) => {
					await new Promise((resolve) => setTimeout(resolve, 1));
					results.push(value);
				});

				await s.set(42);
				assert.deepStrictEqual(results, [42]);
			});

			it("should continue notifying other subscribers if one throws", async () => {
				const s = core.signal(0);
				const results = [];

				s.subscribe(() => {
					throw new Error("Subscriber error");
				});
				s.subscribe((value) => {
					results.push(value);
				});

				await s.set(1);
				assert.deepStrictEqual(results, [1]);
			});
		});

		describe("isomorphic runtime compatibility", () => {
			it("should work with environment detection patterns", () => {
				const s = core.signal(null);

				// Simulate Node.js detection
				if (typeof process !== "undefined") {
					s.set({ platform: "node" });
					assert.deepStrictEqual(s(), { platform: "node" });
				}

				// Simulate browser detection
				const mockWindow = {};
				if (typeof mockWindow === "object") {
					s.set({ platform: "universal" });
					assert.deepStrictEqual(s(), { platform: "universal" });
				}
			});

			it("should handle different JavaScript engine number behaviors", () => {
				// Test edge cases that might behave differently across engines
				const s1 = core.signal(Infinity);
				const s2 = core.signal(-Infinity);
				const s3 = core.signal(Number.MAX_SAFE_INTEGER);
				const s4 = core.signal(Number.MIN_SAFE_INTEGER);

				assert.strictEqual(s1(), Infinity);
				assert.strictEqual(s2(), -Infinity);
				assert.strictEqual(s3(), Number.MAX_SAFE_INTEGER);
				assert.strictEqual(s4(), Number.MIN_SAFE_INTEGER);
			});

			it("should handle Unicode and string edge cases", () => {
				// Test string handling across different engines
				const s1 = core.signal("🦅");
				const s2 = core.signal("\u{1F985}");
				const s3 = core.signal("test\0null");

				assert.strictEqual(s1(), "🦅");
				assert.strictEqual(s2(), "🦅");
				assert.strictEqual(s3(), "test\0null");
			});
		});

		describe("memory management", () => {
			it("should properly clean up subscriptions", () => {
				const s = core.signal(0);
				const unsub1 = s.subscribe(() => {});
				const unsub2 = s.subscribe(() => {});

				// Unsubscribe
				unsub1();
				unsub2();

				// Signal should still work
				s.set(1);
				assert.strictEqual(s(), 1);
			});

			it("should handle rapid subscribe/unsubscribe cycles", () => {
				const s = core.signal(0);

				// Rapid subscription cycles
				for (let i = 0; i < 100; i++) {
					const unsub = s.subscribe(() => {});
					unsub();
				}

				s.set(42);
				assert.strictEqual(s(), 42);
			});
		});

		describe("error handling", () => {
			it("should handle update function errors gracefully", async () => {
				const s = core.signal(5);

				await assert.rejects(
					() =>
						s.update(() => {
							throw new Error("Update error");
						}),
					/Update error/,
				);

				// Signal should maintain previous value
				assert.strictEqual(s(), 5);
			});
		});
	});

	describe("effect()", () => {
		it("should create effect and run immediately", () => {
			let runCount = 0;

			const dispose = core.effect(() => {
				runCount++;
			});

			assert.strictEqual(runCount, 1);
			assert.strictEqual(typeof dispose, "function");
		});

		it("should automatically track signal dependencies", async () => {
			const count = core.signal(0);
			const log = [];

			const dispose = core.effect(() => {
				log.push(count());
			});

			// Initial run
			assert.deepStrictEqual(log, [0]);

			// Signal change triggers effect
			await count.set(1);
			assert.deepStrictEqual(log, [0, 1]);

			await count.set(2);
			assert.deepStrictEqual(log, [0, 1, 2]);

			dispose();
		});

		it("should track multiple signal dependencies", async () => {
			const a = core.signal(1);
			const b = core.signal(2);
			const log = [];

			const dispose = core.effect(() => {
				log.push(a() + b());
			});

			// Initial run
			assert.deepStrictEqual(log, [3]);

			// Change first signal
			await a.set(10);
			assert.deepStrictEqual(log, [3, 12]);

			// Change second signal
			await b.set(20);
			assert.deepStrictEqual(log, [3, 12, 30]);

			dispose();
		});

		it("should only track signals actually read", async () => {
			const used = core.signal(1);
			const unused = core.signal(100);
			const log = [];

			const dispose = core.effect(() => {
				log.push(used());
				// unused() is not called, so shouldn't be tracked
			});

			// Initial run
			assert.deepStrictEqual(log, [1]);

			// Changing unused signal should not trigger effect
			await unused.set(200);
			assert.deepStrictEqual(log, [1]);

			// Changing used signal should trigger effect
			await used.set(2);
			assert.deepStrictEqual(log, [1, 2]);

			dispose();
		});

		it("should dispose and stop tracking dependencies", async () => {
			const count = core.signal(0);
			const log = [];

			const dispose = core.effect(() => {
				log.push(count());
			});

			// Initial run
			assert.deepStrictEqual(log, [0]);

			// Dispose the effect
			dispose();

			// Signal changes should not trigger disposed effect
			await count.set(1);
			await count.set(2);
			assert.deepStrictEqual(log, [0]);
		});

		it("should handle async effects", async () => {
			const data = core.signal("initial");
			const log = [];

			const dispose = core.effect(async () => {
				const value = data();
				await new Promise((resolve) => setTimeout(resolve, 1));
				log.push(value);
			});

			// Wait for initial async effect
			await new Promise((resolve) => setTimeout(resolve, 10));
			assert.deepStrictEqual(log, ["initial"]);

			// Trigger async effect
			await data.set("updated");
			await new Promise((resolve) => setTimeout(resolve, 10));
			assert.deepStrictEqual(log, ["initial", "updated"]);

			dispose();
		});

		it("should handle effects that read signals conditionally", async () => {
			const condition = core.signal(true);
			const value = core.signal(1);
			const log = [];

			const dispose = core.effect(() => {
				if (condition()) {
					log.push(value());
				} else {
					log.push("skipped");
				}
			});

			// Initial run - reads both condition and value
			assert.deepStrictEqual(log, [1]);

			// Change value - should trigger since condition is true
			await value.set(2);
			assert.deepStrictEqual(log, [1, 2]);

			// Change condition to false
			await condition.set(false);
			assert.deepStrictEqual(log, [1, 2, "skipped"]);

			// Change value - should still trigger (effect must run to know dependencies)
			await value.set(3);
			assert.deepStrictEqual(log, [1, 2, "skipped", "skipped"]);

			dispose();
		});

		it("should handle nested effects", async () => {
			const outer = core.signal(1);
			const inner = core.signal(2);
			const log = [];
			const innerDisposes = [];

			const dispose1 = core.effect(() => {
				const outerVal = outer();

				const dispose2 = core.effect(() => {
					log.push(`${outerVal}-${inner()}`);
				});

				// Store inner dispose for cleanup
				innerDisposes.push(dispose2);
			});

			// Initial run creates nested effect
			assert.deepStrictEqual(log, ["1-2"]);

			// Change inner signal
			await inner.set(3);
			assert.deepStrictEqual(log, ["1-2", "1-3"]);

			// Change outer signal - creates new nested effect
			await outer.set(10);
			assert.deepStrictEqual(log, ["1-2", "1-3", "10-3"]);

			// Clean up
			dispose1();
			innerDisposes.forEach((d) => {
				d();
			});
		});

		it("should handle effect errors gracefully", () => {
			let errorThrown = false;

			try {
				core.effect(() => {
					throw new Error("Effect error");
				});
			} catch (error) {
				errorThrown = true;
				assert.strictEqual(error.message, "Effect error");
			}

			assert.strictEqual(errorThrown, true);
		});

		it("should work with peek() to avoid creating dependencies", async () => {
			const tracked = core.signal(1);
			const untracked = core.signal(100);
			const log = [];

			const dispose = core.effect(() => {
				log.push(`${tracked()}-${untracked.peek()}`);
			});

			// Initial run
			assert.deepStrictEqual(log, ["1-100"]);

			// Changing tracked signal should trigger
			await tracked.set(2);
			assert.deepStrictEqual(log, ["1-100", "2-100"]);

			// Changing untracked signal should NOT trigger (peek doesn't track)
			await untracked.set(200);
			assert.deepStrictEqual(log, ["1-100", "2-100"]);

			dispose();
		});

		it("should track promises in reactive contexts", async () => {
			const tracked = [];

			// Mock context with track function
			const mockContext = {
				track: (promise) => {
					tracked.push(promise);
				},
			};

			// Push context onto the stack
			core.contextStack.push(mockContext);

			try {
				const effectPromise = new Promise((resolve) =>
					setTimeout(() => resolve("done"), 1),
				);

				// Effect that returns a promise
				const dispose = core.effect(() => {
					return effectPromise;
				});

				// The promise should be tracked
				assert.strictEqual(tracked.length, 1);
				assert.strictEqual(tracked[0], effectPromise);

				dispose();
			} finally {
				// Clean up context
				core.contextStack.pop();
			}
		});

		it("should not track non-promise return values", () => {
			const tracked = [];

			// Mock context with track function
			const mockContext = {
				track: (promise) => {
					tracked.push(promise);
				},
			};

			// Push context onto the stack
			core.contextStack.push(mockContext);

			try {
				// Effect that returns a string
				const dispose = core.effect(() => {
					return "not a promise";
				});

				// No promises should be tracked
				assert.strictEqual(tracked.length, 0);

				dispose();
			} finally {
				// Clean up context
				core.contextStack.pop();
			}
		});

		it.skip("should auto-cleanup setInterval timers", async () => {
			const calls = [];
			let dispose = null;

			try {
				dispose = core.effect(() => {
					setInterval(() => {
						calls.push(Date.now());
					}, 2); // Slightly longer interval for more predictable behavior
				});

				// Let timer run a few times
				await new Promise((resolve) => setTimeout(resolve, 15));
				const initialCalls = calls.length;
				assert.ok(initialCalls > 0, "Timer should have run");

				// Dispose effect - should auto-cleanup timer
				dispose();
				dispose = null; // Prevent double disposal

				// Wait a bit more - timer should be stopped
				await new Promise((resolve) => setTimeout(resolve, 15));
				const finalCalls = calls.length;

				// Should not have new calls after disposal
				assert.strictEqual(
					finalCalls,
					initialCalls,
					"Timer should be stopped after disposal",
				);
			} finally {
				// Ensure cleanup even if test fails
				if (dispose) dispose();
			}
		});

		it.skip("should auto-cleanup setTimeout timers", async () => {
			let timeoutFired = false;
			let dispose = null;

			try {
				dispose = core.effect(() => {
					setTimeout(() => {
						timeoutFired = true;
					}, 20); // Longer timeout to ensure disposal happens first
				});

				// Dispose immediately before timeout fires
				dispose();
				dispose = null; // Prevent double disposal

				// Wait for timeout period
				await new Promise((resolve) => setTimeout(resolve, 30));

				// Timeout should have been cancelled
				assert.strictEqual(
					timeoutFired,
					false,
					"Timeout should be cancelled on disposal",
				);
			} finally {
				// Ensure cleanup even if test fails
				if (dispose) dispose();
			}
		});

		it.skip("should auto-cleanup event listeners", () => {
			const listeners = [];
			let dispose = null;

			// Mock addEventListener/removeEventListener
			const originalAddEventListener = globalThis.addEventListener;
			const originalRemoveEventListener = globalThis.removeEventListener;

			globalThis.addEventListener = (type, listener, options) => {
				listeners.push({ type, listener, options, removed: false });
			};

			globalThis.removeEventListener = (type, listener, options) => {
				const found = listeners.find(
					(l) =>
						l.type === type &&
						l.listener === listener &&
						l.options === options &&
						!l.removed,
				);
				if (found) found.removed = true;
			};

			try {
				const handler = () => {};

				dispose = core.effect(() => {
					addEventListener("click", handler);
				});

				assert.strictEqual(
					listeners.length,
					1,
					"Event listener should be added",
				);
				assert.strictEqual(
					listeners[0].removed,
					false,
					"Listener should not be removed yet",
				);

				// Dispose effect
				dispose();
				dispose = null; // Prevent double disposal

				assert.strictEqual(
					listeners[0].removed,
					true,
					"Event listener should be auto-removed",
				);
			} finally {
				// Ensure cleanup even if test fails
				if (dispose) dispose();

				// Restore original functions
				globalThis.addEventListener = originalAddEventListener;
				globalThis.removeEventListener = originalRemoveEventListener;
			}
		});

		it.skip("should handle resource cleanup errors gracefully", () => {
			let dispose = null;
			const originalClearInterval = globalThis.clearInterval;

			try {
				// Should not throw even if cleanup functions throw
				assert.doesNotThrow(() => {
					dispose = core.effect(() => {
						// Create timer that will fail to cleanup
						globalThis.clearInterval = () => {
							throw new Error("Cleanup error");
						};

						setInterval(() => {}, 1000);
					});
				});

				// Disposal should not throw despite cleanup error
				assert.doesNotThrow(() => {
					dispose();
					dispose = null; // Prevent double disposal
				});
			} finally {
				// Restore original clearInterval
				globalThis.clearInterval = originalClearInterval;

				// Ensure cleanup even if test fails
				if (dispose) {
					try {
						dispose();
					} catch (_e) {
						// Ignore cleanup errors in test cleanup
					}
				}
			}
		});

		it.skip("should restore global APIs after effect execution", () => {
			const originalSetInterval = globalThis.setInterval;
			const originalSetTimeout = globalThis.setTimeout;
			const originalAddEventListener = globalThis.addEventListener;
			let dispose = null;

			try {
				dispose = core.effect(() => {
					// APIs should be wrapped during execution
					assert.notStrictEqual(globalThis.setInterval, originalSetInterval);
					assert.notStrictEqual(globalThis.setTimeout, originalSetTimeout);
				});

				// APIs should be restored after effect execution
				assert.strictEqual(globalThis.setInterval, originalSetInterval);
				assert.strictEqual(globalThis.setTimeout, originalSetTimeout);
				assert.strictEqual(
					globalThis.addEventListener,
					originalAddEventListener,
				);

				// Dispose effect
				dispose();
				dispose = null; // Prevent double disposal
			} finally {
				// Ensure cleanup even if test fails
				if (dispose) dispose();
			}
		});
	});

	describe("computed()", () => {
		it("should create computed value", () => {
			const count = core.signal(5);
			const doubled = core.computed(() => count() * 2);

			assert.strictEqual(typeof doubled, "function");
			assert.strictEqual(doubled(), 10);
		});

		it("should lazily evaluate and cache results", () => {
			let computeCount = 0;
			const base = core.signal(1);

			const expensive = core.computed(() => {
				computeCount++;
				return base() * 100;
			});

			// Not computed yet
			assert.strictEqual(computeCount, 0);

			// First access computes
			assert.strictEqual(expensive(), 100);
			assert.strictEqual(computeCount, 1);

			// Second access uses cache
			assert.strictEqual(expensive(), 100);
			assert.strictEqual(computeCount, 1);
		});

		it("should re-compute when dependencies change", async () => {
			let computeCount = 0;
			const base = core.signal(2);

			const computed = core.computed(() => {
				computeCount++;
				return base() * 3;
			});

			assert.strictEqual(computed(), 6);
			assert.strictEqual(computeCount, 1);

			// Change dependency
			await base.set(4);

			// Should re-compute on next access
			assert.strictEqual(computed(), 12);
			assert.strictEqual(computeCount, 2);
		});

		it("should track multiple dependencies", async () => {
			const a = core.signal(2);
			const b = core.signal(3);
			const c = core.signal(4);

			const product = core.computed(() => a() * b() * c());

			assert.strictEqual(product(), 24);

			await a.set(5);
			assert.strictEqual(product(), 60);

			await b.set(6);
			assert.strictEqual(product(), 120);

			await c.set(2);
			assert.strictEqual(product(), 60);
		});

		it("should work with computed dependencies", async () => {
			const base = core.signal(2);
			const doubled = core.computed(() => base() * 2);
			const quadrupled = core.computed(() => doubled() * 2);

			assert.strictEqual(quadrupled(), 8);

			await base.set(3);
			assert.strictEqual(quadrupled(), 12);
		});

		it("should handle computed in effects", async () => {
			const count = core.signal(1);
			const doubled = core.computed(() => count() * 2);
			const log = [];

			const dispose = core.effect(() => {
				log.push(doubled());
			});

			assert.deepStrictEqual(log, [2]);

			await count.set(3);
			assert.deepStrictEqual(log, [2, 6]);

			await count.set(5);
			assert.deepStrictEqual(log, [2, 6, 10]);

			dispose();
		});

		it("should detect circular dependencies", () => {
			const computed1 = core.computed(() => {
				return computed2() + 1;
			});

			const computed2 = core.computed(() => {
				return computed1() + 1; // Circular!
			});

			assert.throws(() => computed1(), /Circular dependency detected/);
		});

		it("should support conditional dependencies", async () => {
			const condition = core.signal(true);
			const a = core.signal(1);
			const b = core.signal(100);

			const result = core.computed(() => {
				return condition() ? a() : b();
			});

			assert.strictEqual(result(), 1);

			// Change unused dependency
			await b.set(200);
			assert.strictEqual(result(), 1); // No change

			// Change used dependency
			await a.set(5);
			assert.strictEqual(result(), 5);

			// Switch condition
			await condition.set(false);
			assert.strictEqual(result(), 200);

			// Now a changes shouldn't affect result
			await a.set(10);
			assert.strictEqual(result(), 200);

			// But b changes should
			await b.set(300);
			assert.strictEqual(result(), 300);
		});

		it("should have peek method for cached access", () => {
			const base = core.signal(5);
			const computed = core.computed(() => base() * 2);

			// Access to compute initial value
			assert.strictEqual(computed(), 10);

			// Peek should return cached value
			assert.strictEqual(computed.peek(), 10);
			assert.strictEqual(typeof computed.peek, "function");
		});

		it("should handle async computations gracefully", async () => {
			const data = core.signal("test");

			// Computed can't be async, but it can work with sync transformations
			const upper = core.computed(() => data().toUpperCase());

			assert.strictEqual(upper(), "TEST");

			await data.set("hello");
			assert.strictEqual(upper(), "HELLO");
		});

		it("should work with complex object dependencies", async () => {
			const user = core.signal({ name: "John", age: 30 });

			const profile = core.computed(() => {
				const u = user();
				return {
					displayName: u.name.toUpperCase(),
					isAdult: u.age >= 18,
					category: u.age < 18 ? "minor" : u.age < 65 ? "adult" : "senior",
				};
			});

			assert.deepStrictEqual(profile(), {
				displayName: "JOHN",
				isAdult: true,
				category: "adult",
			});

			await user.set({ name: "Jane", age: 16 });
			assert.deepStrictEqual(profile(), {
				displayName: "JANE",
				isAdult: false,
				category: "minor",
			});
		});

		it("should handle errors in computed subscribers", async () => {
			const base = core.signal(1);
			const computed = core.computed(() => base() * 2);

			// Create an effect that throws when the computed changes
			const dispose = core.effect(() => {
				computed(); // Track the computed
				if (base() > 1) {
					throw new Error("Effect error");
				}
			});

			// This should trigger the computed subscriber error handling
			await base.set(2);

			// Computed should still work despite subscriber error
			assert.strictEqual(computed(), 4);

			dispose();
		});
	});

	describe("batch()", () => {
		it("should execute function synchronously", () => {
			let executed = false;

			core.batch(() => {
				executed = true;
			});

			assert.strictEqual(executed, true);
		});

		it("should prevent effect execution during batch", () => {
			const a = core.signal(1);
			const b = core.signal(2);
			const log = [];

			const dispose = core.effect(() => {
				log.push(a() + b());
			});

			// Initial effect run
			assert.deepStrictEqual(log, [3]);

			// Batch multiple updates
			core.batch(() => {
				a.set(10); // These should not trigger effects individually
				b.set(20);
			});

			// Effects should not have run during batch
			assert.deepStrictEqual(log, [3]);

			dispose();
		});

		it("should work with computed values", () => {
			const a = core.signal(1);
			const b = core.signal(2);
			const sum = core.computed(() => a() + b());
			let computeCount = 0;

			// Add effect to track computations
			const dispose = core.effect(() => {
				sum();
				computeCount++;
			});

			// Initial computation
			assert.strictEqual(computeCount, 1);
			assert.strictEqual(sum(), 3);

			// Batch updates
			core.batch(() => {
				a.set(10);
				b.set(20);
			});

			// Should still be cached until next access
			assert.strictEqual(computeCount, 1);

			dispose();
		});

		it("should handle nested batches", () => {
			const signal = core.signal(0);
			const log = [];

			const dispose = core.effect(() => {
				log.push(signal());
			});

			assert.deepStrictEqual(log, [0]);

			core.batch(() => {
				signal.set(1);

				core.batch(() => {
					signal.set(2);
					signal.set(3);
				});

				signal.set(4);
			});

			// No effects should have run during nested batches
			assert.deepStrictEqual(log, [0]);

			dispose();
		});

		it("should handle errors in batched functions", () => {
			const signal = core.signal(0);

			assert.throws(() => {
				core.batch(() => {
					signal.set(1);
					throw new Error("Batch error");
				});
			}, /Batch error/);

			// Signal should still be updated despite error
			assert.strictEqual(signal(), 1);
		});

		it("should restore listener context after batch", () => {
			const a = core.signal(1);
			const log = [];

			const dispose = core.effect(() => {
				// Read signal inside effect
				log.push(`before: ${a()}`);

				// Batch should not affect the current effect context
				core.batch(() => {
					// This read should not create new dependencies
					log.push(`during: ${a()}`);
				});

				log.push(`after: ${a()}`);
			});

			assert.deepStrictEqual(log, ["before: 1", "during: 1", "after: 1"]);

			dispose();
		});
	});

	describe("untrack()", () => {
		it("should execute function and return result", () => {
			const result = core.untrack(() => {
				return "test result";
			});

			assert.strictEqual(result, "test result");
		});

		it("should prevent dependency tracking", () => {
			const tracked = core.signal(1);
			const untracked = core.signal(100);
			const log = [];

			const dispose = core.effect(() => {
				// This creates a dependency
				const t = tracked();

				// This does NOT create a dependency
				const u = core.untrack(() => untracked());

				log.push(`${t}-${u}`);
			});

			assert.deepStrictEqual(log, ["1-100"]);

			// Changing tracked signal should trigger effect
			tracked.set(2);
			assert.deepStrictEqual(log, ["1-100", "2-100"]);

			// Changing untracked signal should NOT trigger effect
			untracked.set(200);
			assert.deepStrictEqual(log, ["1-100", "2-100"]);

			dispose();
		});

		it("should work with computed values", () => {
			const a = core.signal(1);
			const b = core.signal(2);
			let computeCount = 0;

			const computed = core.computed(() => {
				computeCount++;
				// Track a but not b
				return a() + core.untrack(() => b());
			});

			assert.strictEqual(computed(), 3);
			assert.strictEqual(computeCount, 1);

			// Changing b should not re-compute
			b.set(10);
			assert.strictEqual(computed(), 3); // Cached
			assert.strictEqual(computeCount, 1);

			// Changing a should re-compute
			a.set(5);
			assert.strictEqual(computed(), 15);
			assert.strictEqual(computeCount, 2);
		});

		it("should handle nested untrack calls", () => {
			const a = core.signal(1);
			const b = core.signal(2);
			const c = core.signal(3);
			const log = [];

			const dispose = core.effect(() => {
				// Track a
				const va = a();

				// Don't track b or c
				const result = core.untrack(() => {
					const vb = b();

					return core.untrack(() => {
						return vb + c();
					});
				});

				log.push(`${va}-${result}`);
			});

			assert.deepStrictEqual(log, ["1-5"]);

			// Only a should trigger re-run
			a.set(10);
			assert.deepStrictEqual(log, ["1-5", "10-5"]);

			// b and c should not trigger
			b.set(20);
			c.set(30);
			assert.deepStrictEqual(log, ["1-5", "10-5"]);

			dispose();
		});

		it("should restore listener context after untrack", () => {
			const a = core.signal(1);
			const b = core.signal(2);
			const log = [];

			const dispose = core.effect(() => {
				// This should be tracked
				log.push(`tracked: ${a()}`);

				// This should not be tracked
				core.untrack(() => {
					log.push(`untracked: ${b()}`);
				});

				// This should be tracked again
				log.push(`tracked again: ${a()}`);
			});

			assert.deepStrictEqual(log, [
				"tracked: 1",
				"untracked: 2",
				"tracked again: 1",
			]);

			// Only a should trigger re-run
			a.set(5);
			assert.deepStrictEqual(log, [
				"tracked: 1",
				"untracked: 2",
				"tracked again: 1",
				"tracked: 5",
				"untracked: 2",
				"tracked again: 5",
			]);

			// b should not trigger
			b.set(20);
			assert.deepStrictEqual(log, [
				"tracked: 1",
				"untracked: 2",
				"tracked again: 1",
				"tracked: 5",
				"untracked: 2",
				"tracked again: 5",
			]);

			dispose();
		});

		it("should handle errors in untracked functions", () => {
			const signal = core.signal(1);

			const dispose = core.effect(() => {
				signal(); // Create dependency

				// Error in untrack should not affect dependency tracking
				assert.throws(() => {
					core.untrack(() => {
						throw new Error("Untrack error");
					});
				}, /Untrack error/);
			});

			// Effect should still be tracking the signal
			const log = [];
			const dispose2 = core.effect(() => {
				log.push(signal());
			});

			signal.set(2);
			assert.deepStrictEqual(log, [1, 2]);

			dispose();
			dispose2();
		});

		it("should work in computed values", () => {
			const a = core.signal(1);
			const b = core.signal(10);

			const computed = core.computed(() => {
				// Track a, don't track b
				return a() + core.untrack(() => b());
			});

			assert.strictEqual(computed(), 11);

			// Changing a should invalidate computed
			a.set(5);
			assert.strictEqual(computed(), 15);

			// Changing b should not invalidate computed
			b.set(100);
			assert.strictEqual(computed(), 15); // Still cached
		});
	});
});
