/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { Model } from "./model.js";

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
