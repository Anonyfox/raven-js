/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { hello, LinearRegression, Model } from "./index.js";

describe("Cortex Main Exports", () => {
	it("should export hello function", () => {
		assert.strictEqual(typeof hello, "function");

		const greeting = hello("Test");
		assert.strictEqual(greeting, "Hello, Test! The raven's mind awakens.");
	});

	it("should export Model class", () => {
		assert.strictEqual(typeof Model, "function");
		assert.strictEqual(Model.name, "Model");

		const model = new Model();
		assert.ok(model instanceof Model);
	});

	it("should export LinearRegression class", () => {
		assert.strictEqual(typeof LinearRegression, "function");
		assert.strictEqual(LinearRegression.name, "LinearRegression");

		const model = new LinearRegression();
		assert.ok(model instanceof LinearRegression);
		assert.ok(model instanceof Model);
	});

	it("should validate hello function input", () => {
		assert.throws(() => {
			hello(123);
		}, /Expected name to be a string/);
	});

	it("should work with learning algorithms", () => {
		// Test that main exports work for ML workflows
		const model = new LinearRegression();

		model.trainBatch([
			{ x: 1, y: 2 },
			{ x: 2, y: 4 },
			{ x: 3, y: 6 },
		]);

		const prediction = model.predict({ x: 4 });
		assert.ok(Math.abs(prediction - 8) < 0.0001);

		// Test serialization through main exports
		const serialized = model.toJSON();
		const restored = LinearRegression.fromJSON(serialized);
		const restoredPred = restored.predict({ x: 4 });

		assert.strictEqual(prediction, restoredPred);
	});
});
