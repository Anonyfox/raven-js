/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { Matrix } from "./index.js";

describe("Primitives Module", () => {
	it("should export Matrix class", () => {
		assert.strictEqual(typeof Matrix, "function");
		assert.strictEqual(Matrix.name, "Matrix");

		// Verify it's the actual Matrix constructor
		const matrix = new Matrix(2, 2);
		assert.ok(matrix instanceof Matrix);
		assert.strictEqual(matrix.rows, 2);
		assert.strictEqual(matrix.cols, 2);
	});
});
