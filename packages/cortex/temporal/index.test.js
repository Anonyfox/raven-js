/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { calculateEasterSunday } from "./index.js";

describe("Temporal module exports", () => {
	it("should export calculateEasterSunday function", () => {
		assert.strictEqual(typeof calculateEasterSunday, "function");
	});

	it("should maintain functional API through module export", () => {
		// Verify the export works correctly
		const easter = calculateEasterSunday(2024);

		assert.ok(easter instanceof Date);
		assert.strictEqual(easter.getUTCFullYear(), 2024);
		assert.strictEqual(easter.getUTCMonth() + 1, 3); // March
		assert.strictEqual(easter.getUTCDate(), 31); // 31st
		assert.strictEqual(easter.getUTCDay(), 0); // Sunday
	});
});
