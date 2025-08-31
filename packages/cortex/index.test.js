/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	calculateEasterSunday,
	calculateHolidaysOfYear,
	Holiday,
	hello,
	LinearRegression,
	Matrix,
	Model,
	NaiveDateTime,
	NeuralNetwork,
	Schema,
} from "./index.js";
import { US } from "./temporal/countries/US.js";

describe("core functionality", () => {
	it("should export all main functions and classes with correct types", () => {
		// Test hello function
		assert.strictEqual(typeof hello, "function");
		const greeting = hello("Raven");
		assert.strictEqual(greeting, "Hello, Raven! The raven's mind awakens.");

		// Test learning exports
		assert.strictEqual(typeof Model, "function");
		assert.strictEqual(typeof LinearRegression, "function");
		assert.strictEqual(typeof NeuralNetwork, "function");

		// Test structures exports
		assert.strictEqual(typeof Matrix, "function");
		assert.strictEqual(typeof Schema, "function");

		// Test temporal exports
		assert.strictEqual(typeof calculateEasterSunday, "function");
		assert.strictEqual(typeof calculateHolidaysOfYear, "function");
		assert.strictEqual(typeof Holiday, "function");
		assert.strictEqual(typeof NaiveDateTime, "function");
	});

	it("should instantiate all exported classes correctly", () => {
		// Learning classes
		const model = new Model();
		const regression = new LinearRegression();
		const neuralNet = new NeuralNetwork(2, 3, 1);

		assert.ok(model instanceof Model);
		assert.ok(regression instanceof LinearRegression);
		assert.ok(regression instanceof Model);
		assert.ok(neuralNet instanceof NeuralNetwork);

		// Structure classes
		const matrix = Matrix.identity(2);
		const schema = new Schema();
		assert.ok(matrix instanceof Matrix);
		assert.ok(schema instanceof Schema);

		// Temporal classes
		const holiday = new Holiday("Test", new Date(), "national", true);
		const naiveDateTime = new NaiveDateTime();
		assert.ok(holiday instanceof Holiday);
		assert.ok(naiveDateTime instanceof NaiveDateTime);
	});

	it("should execute complete machine learning workflow through main exports", () => {
		// Train linear regression
		const regression = new LinearRegression();
		regression.trainBatch([
			{ x: 1, y: 2 },
			{ x: 2, y: 4 },
			{ x: 3, y: 6 },
		]);

		const prediction = regression.predict({ x: 4 });
		assert.ok(Math.abs(prediction - 8) < 0.0001);

		// Test neural network
		const nn = new NeuralNetwork(1, 2, 1);
		nn.train([0.5], [0.8]);
		const nnPrediction = nn.predict([0.5]);
		assert.ok(Array.isArray(nnPrediction));
		assert.strictEqual(nnPrediction.length, 1);

		// Test matrix operations
		const m1 = Matrix.random(2, 2);
		const m2 = Matrix.identity(2);
		const result = m1.multiply(m2);
		assert.ok(result instanceof Matrix);
		assert.deepStrictEqual(result.toArray(), m1.toArray());
	});
});

describe("edge cases and errors", () => {
	it("should reject invalid inputs with precise error messages", () => {
		// Hello function validation
		assert.throws(() => hello(123), /Expected name to be a string/);
		assert.throws(() => hello(null), /Expected name to be a string/);
		assert.throws(() => hello(), /Expected name to be a string/);

		// Neural network validation - actual error messages from Matrix internals
		assert.throws(() => new NeuralNetwork(), /Rows must be a positive integer/);
		assert.throws(
			() => new NeuralNetwork("invalid"),
			/Rows must be a positive integer/,
		);
		assert.throws(
			() => new NeuralNetwork(0),
			/All layer sizes must be positive integers/,
		);

		// Matrix validation - identity method calls Matrix constructor internally
		assert.throws(() => Matrix.identity(0), /Rows must be a positive integer/);
		assert.throws(() => Matrix.identity(-1), /Rows must be a positive integer/);
	});

	it("should handle boundary conditions correctly", () => {
		// Empty string handling
		const greeting = hello("");
		assert.strictEqual(greeting, "Hello, ! The raven's mind awakens.");

		// Minimal valid neural network
		const minimalNN = new NeuralNetwork(1, 2, 1);
		assert.ok(minimalNN instanceof NeuralNetwork);

		// 1x1 matrices
		const tiny = Matrix.identity(1);
		assert.strictEqual(tiny.rows, 1);
		assert.strictEqual(tiny.cols, 1);
		assert.strictEqual(tiny.get(0, 0), 1);
	});

	it("should preserve data integrity across serialization roundtrips", () => {
		// Linear regression serialization
		const model = new LinearRegression();
		model.trainBatch([
			{ x: 1, y: 2 },
			{ x: 3, y: 6 },
		]);
		const serialized = model.toJSON();
		const restored = LinearRegression.fromJSON(serialized);
		const originalPred = model.predict({ x: 5 });
		const restoredPred = restored.predict({ x: 5 });
		assert.strictEqual(originalPred, restoredPred);

		// Matrix serialization
		const matrix = Matrix.random(3, 3);
		const matrixJson = matrix.toJSON();
		const restoredMatrix = Matrix.fromJSON(matrixJson);
		assert.deepStrictEqual(matrix.toArray(), restoredMatrix.toArray());
	});
});

describe("integration scenarios", () => {
	it("should integrate temporal functions with core data structures", () => {
		// Calculate Easter and verify date properties
		const easter2024 = calculateEasterSunday(2024);
		assert.ok(easter2024 instanceof Date);
		assert.strictEqual(easter2024.getDay(), 0); // Sunday

		// Use NaiveDateTime with temporal calculations
		const naiveEaster = new NaiveDateTime(easter2024);
		assert.ok(naiveEaster instanceof NaiveDateTime);
		assert.ok(naiveEaster instanceof Date);

		// Calculate holidays and verify structure
		const holidays = calculateHolidaysOfYear(US, { year: 2024 });
		assert.ok(Array.isArray(holidays));
		assert.ok(holidays.length > 0);
		assert.ok(holidays.every((h) => h instanceof Holiday));
	});

	it("should combine machine learning with schema validation", () => {
		// Create schema class for ML data using correct pattern
		class MLDataSchema extends Schema {
			input = Schema.field([0], { description: "Input array" });
			output = Schema.field([0], { description: "Output array" });
		}

		const mlSchema = new MLDataSchema();

		// Validate training data
		const trainingData = { input: [1, 2, 3], output: [2, 4, 6] };
		const isValid = mlSchema.validate(trainingData);
		assert.strictEqual(isValid, true);

		// Train neural network with validated data
		const nn = new NeuralNetwork(3, 4, 3);
		nn.trainBatch([[1, 2, 3]], [[2, 4, 6]]);
		const prediction = nn.predict([1, 2, 3]);
		assert.ok(Array.isArray(prediction));
		assert.strictEqual(prediction.length, 3);
	});

	it("should handle complex multi-module workflows efficiently", () => {
		// Matrix-based neural network operations
		const inputMatrix = new Matrix(3, 2, [1, 2, 3, 4, 5, 6]); // 3x2 matrix
		const weightMatrix = Matrix.random(2, 3); // 2x3 matrix
		const result = inputMatrix.multiply(weightMatrix); // 3x3 result

		assert.ok(result instanceof Matrix);
		assert.strictEqual(result.rows, 3);
		assert.strictEqual(result.cols, 3);

		// Temporal data processing
		const startTime = new NaiveDateTime("2024-01-01T00:00:00Z");
		assert.ok(startTime.toUnix() > 0);

		// Combined validation and processing with proper schema
		class DataSchema extends Schema {
			timestamp = Schema.field(0, { description: "Unix timestamp" });
			values = Schema.field([0], { description: "Data values array" });
		}

		const dataSchema = new DataSchema();
		const processedData = {
			timestamp: startTime.toUnix(),
			values: result.toArray()[0], // First row as flat array of numbers
		};

		assert.ok(dataSchema.validate(processedData));
		assert.ok(processedData.values.length === 3);
	});
});
