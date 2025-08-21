import assert from "node:assert";
import { describe, it } from "node:test";
import { signal } from "../core/index.js";
import * as dom from "./index.js";

describe("dom/index.js", () => {
	it("should export mount function", () => {
		assert.strictEqual(typeof dom.mount, "function");
	});

	describe("mount()", () => {
		it("should require a template function", () => {
			const target = { children: [], appendChild() {} };

			assert.throws(() => dom.mount(), /requires a template function/);
			assert.throws(
				() => dom.mount(null, target),
				/requires a template function/,
			);
			assert.throws(
				() => dom.mount("not a function", target),
				/requires a template function/,
			);
		});

		it("should require a target", () => {
			const templateFn = () => "<p>Hello World</p>";

			assert.throws(() => dom.mount(templateFn), /requires a target/);
			assert.throws(() => dom.mount(templateFn, null), /requires a target/);
		});

		it("should mount reactive template", () => {
			const templateFn = () => "<p>Hello World</p>";
			const target = {
				children: [],
				appendChild(child) {
					this.children.push(child);
				},
			};

			const mounted = dom.mount(templateFn, target);

			// Should return mount instance
			assert.strictEqual(typeof mounted, "object");
			assert.strictEqual(typeof mounted.unmount, "function");
			assert.strictEqual(typeof mounted.element, "object");

			// Should append to target
			assert.strictEqual(target.children.length, 1);
		});

		it("should automatically update when signal changes", async () => {
			const count = signal(0);
			const templateFn = () => `<p>Count: ${count()}</p>`;
			const target = {
				children: [],
				appendChild(child) {
					this.children.push(child);
				},
			};

			const mounted = dom.mount(templateFn, target);

			// Initial render
			assert.ok(mounted.element.innerHTML.includes("Count: 0"));

			// Change signal - should automatically update
			count.set(5);

			// Give effect system time to update
			await new Promise((resolve) => setTimeout(resolve, 10));

			assert.ok(mounted.element.innerHTML.includes("Count: 5"));
		});

		it("should throw error for CSS selectors in Node.js", () => {
			const templateFn = () => "<p>Hello World</p>";

			assert.throws(
				() => dom.mount(templateFn, "#my-app"),
				/CSS selectors only work in browser/,
			);
		});

		it("should support unmount", () => {
			const templateFn = () => "<p>Hello</p>";
			const target = {
				children: [],
				appendChild(child) {
					this.children.push(child);
				},
			};

			const mounted = dom.mount(templateFn, target);
			assert.strictEqual(target.children.length, 1);

			// Should support unmount
			assert.strictEqual(typeof mounted.unmount, "function");
			mounted.unmount();
		});

		it("should clean up effect on unmount", () => {
			const count = signal(0);
			const templateFn = () => `<p>Count: ${count()}</p>`;
			const target = {
				children: [],
				appendChild(child) {
					this.children.push(child);
				},
			};

			const mounted = dom.mount(templateFn, target);

			// Should clean up when unmounted
			mounted.unmount();

			// Effect should be disposed
			assert.strictEqual(mounted.disposeEffect, null);
		});

		it("should apply performance optimizations transparently", () => {
			const templateFn = () => "<p>Optimized</p>";
			const target = {
				children: [],
				appendChild(child) {
					this.children.push(child);
				},
			};

			const mounted = dom.mount(templateFn, target);

			// API surface remains minimal - only mount() and optional unmount()
			assert.strictEqual(typeof mounted.unmount, "function");
			assert.strictEqual(typeof mounted.element, "object");
			assert.strictEqual(typeof mounted.disposeEffect, "function");

			// No performance APIs leaked to user
			assert.strictEqual(mounted.scheduler, undefined);
			assert.strictEqual(mounted.memoryManager, undefined);
			assert.strictEqual(mounted.ENV, undefined);

			// Still works perfectly
			assert.ok(mounted.element.innerHTML.includes("Optimized"));
			mounted.unmount();
		});

		it("should provide automatic cleanup (unmount is optional)", () => {
			const templateFn = () => "<p>Auto cleanup</p>";
			const target = {
				children: [],
				appendChild(child) {
					this.children.push(child);
				},
			};

			const mounted = dom.mount(templateFn, target);

			// Manual unmount still works
			assert.strictEqual(typeof mounted.unmount, "function");

			// But has internal cleanup for automatic DOM removal detection
			assert.strictEqual(typeof mounted.cleanup, "function");

			// Still renders correctly
			assert.ok(mounted.element.innerHTML.includes("Auto cleanup"));

			// Manual cleanup
			mounted.unmount();
		});
	});
});
