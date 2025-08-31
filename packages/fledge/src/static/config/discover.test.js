/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import { Discover } from "./discover.js";

describe("Discover", () => {
	test("creates instance with defaults", () => {
		const discover = new Discover();

		assert.strictEqual(discover.depth, null);
		assert.strictEqual(discover.ignore, null);
	});

	test("creates instance with options", () => {
		const discover = new Discover({
			depth: 3,
			ignore: ["/admin/*", "*.pdf"],
		});

		assert.strictEqual(discover.depth, 3);
		assert.deepStrictEqual(discover.ignore, ["/admin/*", "*.pdf"]);
	});

	test("getDepth returns configured depth", () => {
		const discover = new Discover({ depth: 5 });
		assert.strictEqual(discover.getDepth(), 5);
	});

	test("getDepth returns null when not configured", () => {
		const discover = new Discover();
		assert.strictEqual(discover.getDepth(), null);
	});

	test("getIgnore returns configured patterns", () => {
		const discover = new Discover({ ignore: ["/test/*"] });
		assert.deepStrictEqual(discover.getIgnore(), ["/test/*"]);
	});

	test("getIgnore returns empty array when not configured", () => {
		const discover = new Discover();
		assert.deepStrictEqual(discover.getIgnore(), []);
	});

	test("shouldIgnore matches simple patterns", () => {
		const discover = new Discover({ ignore: ["/admin", "*.pdf"] });

		assert.strictEqual(discover.shouldIgnore("/admin"), true);
		assert.strictEqual(discover.shouldIgnore("document.pdf"), true);
		assert.strictEqual(discover.shouldIgnore("/public"), false);
		assert.strictEqual(discover.shouldIgnore("document.txt"), false);
	});

	test("shouldIgnore matches glob patterns", () => {
		const discover = new Discover({
			ignore: ["/admin/*", "*.pdf", "/test/*/temp"],
		});

		assert.strictEqual(discover.shouldIgnore("/admin/dashboard"), true);
		assert.strictEqual(discover.shouldIgnore("/admin/users/list"), true);
		assert.strictEqual(discover.shouldIgnore("report.pdf"), true);
		assert.strictEqual(discover.shouldIgnore("/test/unit/temp"), true);
		assert.strictEqual(discover.shouldIgnore("/public/assets"), false);
	});

	test("shouldIgnore returns false when no patterns", () => {
		const discover = new Discover();

		assert.strictEqual(discover.shouldIgnore("/anything"), false);
		assert.strictEqual(discover.shouldIgnore("file.pdf"), false);
	});

	test("validate passes with valid configuration", () => {
		const discover = new Discover({
			depth: 3,
			ignore: ["/admin/*", "*.pdf"],
		});

		assert.doesNotThrow(() => discover.validate());
	});

	test("validate passes with null values", () => {
		const discover = new Discover();
		assert.doesNotThrow(() => discover.validate());
	});

	test("validate throws when depth is not integer", () => {
		const discover = new Discover({ depth: 3.5 });
		assert.throws(
			() => discover.validate(),
			/Discover depth must be positive integer if specified/,
		);
	});

	test("validate throws when depth is negative", () => {
		const discover = new Discover({ depth: -1 });
		assert.throws(
			() => discover.validate(),
			/Discover depth must be positive integer if specified/,
		);
	});

	test("validate throws when depth is not number", () => {
		const discover = new Discover({ depth: "3" });
		assert.throws(
			() => discover.validate(),
			/Discover depth must be positive integer if specified/,
		);
	});

	test("validate throws when ignore is not array", () => {
		const discover = new Discover({ ignore: "*.pdf" });
		assert.throws(
			() => discover.validate(),
			/Discover ignore must be array of patterns if specified/,
		);
	});

	test("validate throws when ignore contains non-strings", () => {
		const discover = new Discover({ ignore: ["/admin/*", 123] });
		assert.throws(
			() => discover.validate(),
			/Discover ignore patterns must be strings/,
		);
	});
});
