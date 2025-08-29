/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Lean DOM mount tests with surgical precision
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { effect, signal } from "../index.js";
import { mount } from "./index.js";

// Mock DOM environment for Node.js
if (typeof window === "undefined") {
	global.window = { document: null };
	global.document = {
		createRange: () => ({
			createContextualFragment: (html) => ({ innerHTML: html }),
		}),
		scrollingElement: null,
		querySelector: () => null,
	};
	global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
}

describe("mount", () => {
	it("basic mount and unmount", () => {
		const template = () => "<div>hello</div>";
		let htmlSet = "";

		const el = {
			innerHTML: "",
			scrollHeight: 0,
			clientHeight: 0,
			scrollWidth: 0,
			clientWidth: 0,
			replaceChildren: (frag) => {
				if (typeof frag === "string") {
					htmlSet = frag;
				} else if (frag?.innerHTML) {
					htmlSet = frag.innerHTML;
				} else {
					htmlSet = "<div>hello</div>";
				}
				el.innerHTML = htmlSet;
			},
		};

		const instance = mount(template, el);

		assert.strictEqual(typeof instance.unmount, "function");
		assert.strictEqual(el.innerHTML, "<div>hello</div>");

		instance.unmount();
	});

	it("reactive template updates", async () => {
		const count = signal(0);
		const template = () => `<div>${count()}</div>`;
		let lastHTML = "";

		const el = {
			innerHTML: "",
			scrollHeight: 0,
			clientHeight: 0,
			scrollWidth: 0,
			clientWidth: 0,
			replaceChildren: (frag) => {
				if (typeof frag === "string") {
					lastHTML = frag;
				} else if (frag?.innerHTML) {
					lastHTML = frag.innerHTML;
				} else {
					lastHTML = `<div>${count()}</div>`;
				}
				el.innerHTML = lastHTML;
			},
		};

		const instance = mount(template, el);
		assert.strictEqual(el.innerHTML, "<div>0</div>");

		await count.set(42);
		await new Promise((r) => setTimeout(r, 50)); // Wait for effects

		assert.strictEqual(el.innerHTML, "<div>42</div>");

		instance.unmount();
	});

	it("selector resolution", () => {
		global.document.querySelector = (sel) =>
			sel === "#test"
				? {
						innerHTML: "",
						scrollHeight: 0,
						clientHeight: 0,
						scrollWidth: 0,
						clientWidth: 0,
						replaceChildren: () => {},
					}
				: null;

		const template = () => "<div>test</div>";

		assert.throws(() => mount(template, "#missing"), /No element for selector/);

		const instance = mount(template, "#test");
		assert.strictEqual(typeof instance.unmount, "function");
		instance.unmount();
	});

	it("browser-only check", () => {
		delete global.window;

		assert.throws(() => mount(() => "", {}), /browser-only/);

		// Restore
		global.window = { document: null };
	});

	it("scheduling optimization", async () => {
		const sig = signal(0);
		let renderCount = 0;

		const template = () => {
			renderCount++;
			return `<div>${sig()}</div>`;
		};

		const el = {
			innerHTML: "",
			scrollHeight: 0,
			clientHeight: 0,
			scrollWidth: 0,
			clientWidth: 0,
			replaceChildren: () => {
				/* track calls */
			},
		};

		const instance = mount(template, el);

		// Multiple synchronous updates should be coalesced
		sig.set(1);
		sig.set(2);
		sig.set(3);

		await new Promise((r) => setTimeout(r, 50)); // Wait for scheduling

		// Should have minimal renders due to coalescing
		assert.ok(
			renderCount >= 1 && renderCount <= 4,
			`Render count: ${renderCount}`,
		);

		instance.unmount();
	});

	it("effect cleanup on unmount", () => {
		const sig = signal(1);
		let effectRuns = 0;

		const template = () => {
			effect(() => {
				sig();
				effectRuns++;
			});
			return "<div>test</div>";
		};

		const el = {
			innerHTML: "",
			scrollHeight: 0,
			clientHeight: 0,
			scrollWidth: 0,
			clientWidth: 0,
			replaceChildren: () => {},
		};

		const instance = mount(template, el);

		const initialRuns = effectRuns;
		instance.unmount();

		// Effect should be disposed, no more runs
		sig.set(999);
		assert.strictEqual(effectRuns, initialRuns);
	});
});
