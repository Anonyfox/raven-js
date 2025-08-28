/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { LinearRegression, Model } from "./index.js";

describe("Model (Base Class)", () => {
	it("should create model with metadata", () => {
		const model = new Model();

		assert.strictEqual(model._trained, false);
		assert.strictEqual(model._version, 1);
		assert.strictEqual(model._modelType, "Model");
		assert.ok(typeof model._createdAt === "number");
		assert.ok(model._createdAt > 0);
	});

	it("should serialize to JSON correctly", () => {
		const model = new Model();
		model.testProperty = "test value";
		model.testNumber = 42;

		const json = model.toJSON();

		assert.strictEqual(json._trained, false);
		assert.strictEqual(json._version, 1);
		assert.strictEqual(json._modelType, "Model");
		assert.strictEqual(json.testProperty, "test value");
		assert.strictEqual(json.testNumber, 42);
		assert.ok(typeof json._serializedAt === "number");
		assert.ok(json._serializedAt >= json._createdAt);
	});

	it("should exclude functions from serialization", () => {
		const model = new Model();
		model.testFunction = () => "should not serialize";

		const json = model.toJSON();

		assert.strictEqual(json.testFunction, undefined);
	});

	it("should deserialize from JSON correctly", () => {
		class TestModel extends Model {
			constructor() {
				super();
				this.customProp = "default";
			}
		}

		const originalJson = {
			_trained: true,
			_version: 1,
			_modelType: "TestModel",
			_createdAt: 1000,
			customProp: "restored",
			customNumber: 123,
		};

		const restored = Model.fromJSON(originalJson, TestModel);

		assert.ok(restored instanceof TestModel);
		assert.strictEqual(restored._trained, true);
		assert.strictEqual(restored.customProp, "restored");
		assert.strictEqual(restored.customNumber, 123);
	});

	it("should throw on invalid JSON input", () => {
		assert.throws(() => {
			Model.fromJSON(null, Model);
		}, /Invalid JSON: expected object/);

		assert.throws(() => {
			Model.fromJSON("not an object", Model);
		}, /Invalid JSON: expected object/);
	});

	it("should throw on invalid ModelClass", () => {
		assert.throws(() => {
			Model.fromJSON({}, null);
		}, /Invalid ModelClass: expected constructor function/);

		assert.throws(() => {
			Model.fromJSON({}, "not a function");
		}, /Invalid ModelClass: expected constructor function/);
	});

	it("should validate model type compatibility", () => {
		class TestModel extends Model {}

		const wrongTypeJson = {
			_modelType: "DifferentModel",
			_trained: true,
		};

		assert.throws(() => {
			Model.fromJSON(wrongTypeJson, TestModel);
		}, /Model type mismatch: expected TestModel, got DifferentModel/);
	});

	it("should provide model info", () => {
		const model = new Model();
		model._markTrained();

		const info = model.getModelInfo();

		assert.strictEqual(info.type, "Model");
		assert.strictEqual(info.trained, true);
		assert.strictEqual(info.version, 1);
		assert.ok(info.createdAt instanceof Date);
	});

	it("should validate trained state", () => {
		const model = new Model();

		assert.throws(() => {
			model._validateTrained();
		}, /Model model must be trained before making predictions/);

		model._markTrained();

		// Should not throw after marking as trained
		assert.doesNotThrow(() => {
			model._validateTrained();
		});
	});
});

describe("LinearRegression", () => {
	it("should create empty model", () => {
		const model = new LinearRegression();

		assert.strictEqual(model.slope, 0);
		assert.strictEqual(model.intercept, 0);
		assert.strictEqual(model.n, 0);
		assert.strictEqual(model._trained, false);
		assert.strictEqual(model._modelType, "LinearRegression");
	});

	it("should train with single data point", () => {
		const model = new LinearRegression();

		model.train({ x: 1, y: 2 });

		assert.strictEqual(model.n, 1);
		assert.strictEqual(model._trained, true);
		assert.strictEqual(model.sumX, 1);
		assert.strictEqual(model.sumY, 2);
	});

	it("should train with multiple data points", () => {
		const model = new LinearRegression();

		model.train({ x: 1, y: 2 });
		model.train({ x: 2, y: 4 });
		model.train({ x: 3, y: 6 });

		assert.strictEqual(model.n, 3);
		// Perfect linear relationship: y = 2x
		assert.ok(Math.abs(model.slope - 2) < 0.0001);
		assert.ok(Math.abs(model.intercept - 0) < 0.0001);
	});

	it("should train with batch data", () => {
		const model = new LinearRegression();
		const data = [
			{ x: 1, y: 3 },
			{ x: 2, y: 5 },
			{ x: 3, y: 7 },
		];

		model.trainBatch(data);

		assert.strictEqual(model.n, 3);
		assert.strictEqual(model._trained, true);
		// Linear relationship: y = 2x + 1
		assert.ok(Math.abs(model.slope - 2) < 0.0001);
		assert.ok(Math.abs(model.intercept - 1) < 0.0001);
	});

	it("should make predictions", () => {
		const model = new LinearRegression();
		model.trainBatch([
			{ x: 1, y: 2 },
			{ x: 2, y: 4 },
			{ x: 3, y: 6 },
		]);

		const prediction = model.predict({ x: 4 });

		assert.ok(Math.abs(prediction - 8) < 0.0001);
	});

	it("should throw on prediction without training", () => {
		const model = new LinearRegression();

		assert.throws(() => {
			model.predict({ x: 1 });
		}, /LinearRegression model must be trained before making predictions/);
	});

	it("should validate training input types", () => {
		const model = new LinearRegression();

		assert.throws(() => {
			model.train({ x: "not a number", y: 2 });
		}, /Training data must contain numeric x and y values/);

		assert.throws(() => {
			model.train({ x: 1, y: "not a number" });
		}, /Training data must contain numeric x and y values/);
	});

	it("should validate finite training values", () => {
		const model = new LinearRegression();

		assert.throws(() => {
			model.train({ x: Number.POSITIVE_INFINITY, y: 2 });
		}, /Training data must contain finite numeric values/);

		assert.throws(() => {
			model.train({ x: 1, y: Number.NaN });
		}, /Training data must contain finite numeric values/);
	});

	it("should validate prediction input types", () => {
		const model = new LinearRegression();
		model.train({ x: 1, y: 2 });

		assert.throws(() => {
			model.predict({ x: "not a number" });
		}, /Prediction input must be a finite number/);

		assert.throws(() => {
			model.predict({ x: Number.POSITIVE_INFINITY });
		}, /Prediction input must be a finite number/);
	});

	it("should validate batch training input", () => {
		const model = new LinearRegression();

		assert.throws(() => {
			model.trainBatch([]);
		}, /Training batch must be a non-empty array/);

		assert.throws(() => {
			model.trainBatch("not an array");
		}, /Training batch must be a non-empty array/);

		assert.throws(() => {
			model.trainBatch(null);
		}, /Training batch must be a non-empty array/);
	});

	it("should provide model parameters", () => {
		const model = new LinearRegression();
		model.trainBatch([
			{ x: 0, y: 1 },
			{ x: 1, y: 3 },
			{ x: 2, y: 5 },
		]);

		const params = model.getParameters();

		assert.ok(Math.abs(params.slope - 2) < 0.0001);
		assert.ok(Math.abs(params.intercept - 1) < 0.0001);
		assert.strictEqual(params.dataPoints, 3);
		assert.ok(params.equation.includes("y ="));
	});

	it("should calculate R² correctly", () => {
		const model = new LinearRegression();
		const trainingData = [
			{ x: 1, y: 2 },
			{ x: 2, y: 4 },
			{ x: 3, y: 6 },
		];

		model.trainBatch(trainingData);

		// Perfect fit should have R² = 1
		const r2 = model.calculateR2(trainingData);
		assert.ok(Math.abs(r2 - 1) < 0.0001);
	});

	it("should calculate R² with imperfect fit", () => {
		const model = new LinearRegression();
		model.trainBatch([
			{ x: 1, y: 2 },
			{ x: 2, y: 4 },
			{ x: 3, y: 6 },
		]);

		const testData = [
			{ x: 1, y: 2.1 }, // Slight deviation
			{ x: 2, y: 3.9 },
			{ x: 3, y: 6.1 },
		];

		const r2 = model.calculateR2(testData);
		assert.ok(r2 > 0.9); // Still very good fit
		assert.ok(r2 < 1.0); // But not perfect
	});

	it("should validate R² calculation input", () => {
		const model = new LinearRegression();
		model.train({ x: 1, y: 2 });

		assert.throws(() => {
			model.calculateR2([]);
		}, /Test data must be a non-empty array/);

		assert.throws(() => {
			model.calculateR2("not an array");
		}, /Test data must be a non-empty array/);
	});

	it("should handle R² with zero variance", () => {
		const model = new LinearRegression();
		model.trainBatch([
			{ x: 1, y: 5 },
			{ x: 2, y: 5 },
			{ x: 3, y: 5 },
		]);

		const testData = [
			{ x: 1, y: 5 },
			{ x: 2, y: 5 },
		];

		const r2 = model.calculateR2(testData);
		assert.strictEqual(r2, 1); // Perfect fit when no variance
	});

	it("should serialize and deserialize correctly", () => {
		const original = new LinearRegression();
		original.trainBatch([
			{ x: 1, y: 2 },
			{ x: 2, y: 4 },
			{ x: 3, y: 6 },
		]);

		const json = original.toJSON();
		const restored = LinearRegression.fromJSON(json);

		assert.ok(restored instanceof LinearRegression);
		assert.strictEqual(restored.slope, original.slope);
		assert.strictEqual(restored.intercept, original.intercept);
		assert.strictEqual(restored.n, original.n);
		assert.strictEqual(restored._trained, original._trained);

		// Should make identical predictions
		const originalPred = original.predict({ x: 4 });
		const restoredPred = restored.predict({ x: 4 });
		assert.strictEqual(originalPred, restoredPred);
	});

	it("should handle edge case: vertical line (undefined slope)", () => {
		const model = new LinearRegression();

		// All x values the same - no defined slope
		model.train({ x: 5, y: 1 });
		model.train({ x: 5, y: 2 });
		model.train({ x: 5, y: 3 });

		// Should not crash, slope/intercept should remain 0
		assert.strictEqual(model.slope, 0);
		assert.strictEqual(model.intercept, 0);
		assert.strictEqual(model.n, 3);
	});

	it("should work with negative values", () => {
		const model = new LinearRegression();
		model.trainBatch([
			{ x: -2, y: -4 },
			{ x: -1, y: -2 },
			{ x: 0, y: 0 },
			{ x: 1, y: 2 },
			{ x: 2, y: 4 },
		]);

		assert.ok(Math.abs(model.slope - 2) < 0.0001);
		assert.ok(Math.abs(model.intercept - 0) < 0.0001);

		const prediction = model.predict({ x: -3 });
		assert.ok(Math.abs(prediction - -6) < 0.0001);
	});

	it("should work with decimal values", () => {
		const model = new LinearRegression();
		model.trainBatch([
			{ x: 0.1, y: 0.2 },
			{ x: 0.2, y: 0.4 },
			{ x: 0.3, y: 0.6 },
		]);

		assert.ok(Math.abs(model.slope - 2) < 0.0001);
		assert.ok(Math.abs(model.intercept - 0) < 0.0001);
	});

	it("should be isomorphic (work identically in different environments)", () => {
		// This test verifies no environment-specific dependencies
		const model1 = new LinearRegression();
		const model2 = new LinearRegression();

		const data = [
			{ x: 1, y: 1.5 },
			{ x: 2, y: 3.2 },
			{ x: 3, y: 4.8 },
		];

		// Train both models identically
		model1.trainBatch(data);
		for (const point of data) {
			model2.train(point);
		}

		// Should produce identical results
		assert.strictEqual(model1.slope, model2.slope);
		assert.strictEqual(model1.intercept, model2.intercept);
		assert.strictEqual(model1.predict({ x: 4 }), model2.predict({ x: 4 }));
	});
});
