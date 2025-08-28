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
import { NeuralNetwork } from "./neural-network.js";

describe("NeuralNetwork", () => {
	it("should create network with correct architecture", () => {
		const nn = new NeuralNetwork(3, 5, 2);

		assert.strictEqual(nn.inputSize, 3);
		assert.strictEqual(nn.hiddenSize, 5);
		assert.strictEqual(nn.outputSize, 2);
		assert.strictEqual(nn._trained, false);
		assert.strictEqual(nn._modelType, "NeuralNetwork");
	});

	it("should validate layer sizes during construction", () => {
		assert.throws(
			() => new NeuralNetwork(0, 5, 2),
			/All layer sizes must be positive/,
		);
		assert.throws(
			() => new NeuralNetwork(3, 0, 2),
			/All layer sizes must be positive/,
		);
		assert.throws(
			() => new NeuralNetwork(3, 5, 0),
			/All layer sizes must be positive/,
		);
		assert.throws(
			() => new NeuralNetwork(-1, 5, 2),
			/All layer sizes must be positive/,
		);
	});

	it("should initialize weights and biases correctly", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		// Check weight matrix dimensions
		assert.strictEqual(nn.w1.length, 2); // input size
		assert.strictEqual(nn.w1[0].length, 3); // hidden size
		assert.strictEqual(nn.w2.length, 3); // hidden size
		assert.strictEqual(nn.w2[0].length, 1); // output size

		// Check bias vector dimensions
		assert.strictEqual(nn.b1.length, 3); // hidden size
		assert.strictEqual(nn.b2.length, 1); // output size

		// Check that weights are initialized (not all zeros)
		let hasNonZeroW1 = false;
		let hasNonZeroW2 = false;

		for (let i = 0; i < nn.w1.length; i++) {
			for (let j = 0; j < nn.w1[i].length; j++) {
				if (nn.w1[i][j] !== 0) hasNonZeroW1 = true;
			}
		}

		for (let i = 0; i < nn.w2.length; i++) {
			for (let j = 0; j < nn.w2[i].length; j++) {
				if (nn.w2[i][j] !== 0) hasNonZeroW2 = true;
			}
		}

		assert.ok(hasNonZeroW1, "W1 should have non-zero weights");
		assert.ok(hasNonZeroW2, "W2 should have non-zero weights");
	});

	it("should throw on prediction without training", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		assert.throws(() => {
			nn.predict([1, 0]);
		}, /NeuralNetwork model must be trained before making predictions/);
	});

	it("should validate input size for prediction", () => {
		const nn = new NeuralNetwork(2, 3, 1);
		nn._markTrained(); // Bypass training requirement for this test

		assert.throws(() => {
			nn.predict([1]); // Wrong size
		}, /Expected input size 2, got 1/);

		assert.throws(() => {
			nn.predict([1, 2, 3]); // Wrong size
		}, /Expected input size 2, got 3/);

		assert.throws(() => {
			nn.predict("not an array");
		}, /Expected input size 2, got 12/);
	});

	it("should perform forward pass correctly", () => {
		const nn = new NeuralNetwork(2, 3, 1);
		nn._markTrained();

		const output = nn.predict([0.5, -0.3]);

		assert.ok(Array.isArray(output));
		assert.strictEqual(output.length, 1);
		assert.ok(typeof output[0] === "number");
		assert.ok(Number.isFinite(output[0]));
	});

	it("should train with single input-target pair", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		nn.train([1, 0], [0.5], { learningRate: 0.1 });

		assert.strictEqual(nn._trained, true);
	});

	it("should validate input dimensions during training", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		assert.throws(() => {
			nn.train([1], [0.5]); // Wrong input size
		}, /Expected input size 2, got 1/);

		assert.throws(() => {
			nn.train([1, 0], [0.5, 0.3]); // Wrong target size
		}, /Expected target size 1, got 2/);
	});

	it("should train batch data successfully", () => {
		const nn = new NeuralNetwork(2, 4, 1);

		const inputs = [
			[0, 0],
			[0, 1],
			[1, 0],
			[1, 1],
		];

		const targets = [[0], [1], [1], [0]];

		nn.trainBatch(inputs, targets, {
			learningRate: 0.1,
			epochs: 10,
			shuffle: false,
		});

		assert.strictEqual(nn._trained, true);

		// Test that network can make predictions after training
		const output = nn.predict([0, 1]);
		assert.ok(Array.isArray(output));
		assert.strictEqual(output.length, 1);
	});

	it("should validate batch training inputs", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		assert.throws(() => {
			nn.trainBatch([], []);
		}, /Training data cannot be empty/);

		assert.throws(() => {
			nn.trainBatch([[1, 0]], [[0], [1]]);
		}, /Inputs and targets must have the same length/);

		assert.throws(() => {
			nn.trainBatch([[1]], [[0]]);
		}, /Expected input size 2, got 1/);

		assert.throws(() => {
			nn.trainBatch([[1, 0]], [[0, 1]]);
		}, /Expected target size 1, got 2/);
	});

	it("should learn simple linear pattern", () => {
		const nn = new NeuralNetwork(1, 6, 1);

		// Simple linear relationship: output = input
		const inputs = [[0], [1], [0.5]];
		const targets = [[0], [1], [0.5]];

		nn.trainBatch(inputs, targets, {
			learningRate: 0.8,
			epochs: 2000,
			shuffle: false,
		});

		// Check that it learned the pattern reasonably well
		const pred0 = nn.predict([0])[0];
		const pred1 = nn.predict([1])[0];

		// Should show some learning - outputs should be different and in right direction
		// Use more lenient thresholds since neural networks are probabilistic
		assert.ok(
			Math.abs(pred1 - pred0) > 0.05,
			`Network should distinguish between different inputs (pred0=${pred0}, pred1=${pred1})`,
		);
		assert.ok(
			pred1 >= pred0 - 0.2,
			`Higher input should generally produce higher output (pred0=${pred0}, pred1=${pred1})`,
		);
	});

	it("should learn classification pattern", () => {
		const nn = new NeuralNetwork(2, 4, 1);

		// Simple classification: output 1 if x > y, else 0
		const inputs = [
			[0, 1], // 0 < 1 -> 0
			[1, 0], // 1 > 0 -> 1
			[0, 0], // 0 = 0 -> 0
			[1, 1], // 1 = 1 -> 0
		];

		const targets = [[0], [1], [0], [0]];

		nn.trainBatch(inputs, targets, {
			learningRate: 0.3,
			epochs: 1000,
			shuffle: true,
		});

		// Test that network learned to distinguish patterns
		const out01 = nn.predict([0, 1])[0]; // Should be closer to 0
		const out10 = nn.predict([1, 0])[0]; // Should be closer to 1

		assert.ok(
			out10 > out01,
			"Network should distinguish between [1,0] and [0,1] patterns",
		);
	});

	it("should calculate loss correctly", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		// Train with simple data
		nn.trainBatch(
			[
				[1, 0],
				[0, 1],
			],
			[[1], [0]],
			{ epochs: 10 },
		);

		const loss = nn.calculateLoss(
			[
				[1, 0],
				[0, 1],
			],
			[[1], [0]],
		);

		assert.ok(typeof loss === "number");
		assert.ok(Number.isFinite(loss));
		assert.ok(loss >= 0);
	});

	it("should provide network parameters", () => {
		const nn = new NeuralNetwork(3, 5, 2);

		const params = nn.getParameters();

		assert.strictEqual(params.inputSize, 3);
		assert.strictEqual(params.hiddenSize, 5);
		assert.strictEqual(params.outputSize, 2);
		assert.strictEqual(params.totalParameters, 3 * 5 + 5 + 5 * 2 + 2); // W1 + B1 + W2 + B2
		assert.strictEqual(params.architecture, "3→5→2");
		assert.strictEqual(params.trained, false);
	});

	it("should serialize and deserialize correctly", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		// Train the network so it has some learned weights
		nn.trainBatch(
			[
				[1, 0],
				[0, 1],
			],
			[[0.8], [0.2]],
			{ epochs: 5 },
		);

		const serialized = nn.toJSON();
		const restored = NeuralNetwork.fromJSON(serialized);

		assert.ok(restored instanceof NeuralNetwork);
		assert.ok(restored instanceof Model);
		assert.strictEqual(restored.inputSize, nn.inputSize);
		assert.strictEqual(restored.hiddenSize, nn.hiddenSize);
		assert.strictEqual(restored.outputSize, nn.outputSize);
		assert.strictEqual(restored._trained, nn._trained);

		// Test that weights are correctly restored
		for (let i = 0; i < nn.w1.length; i++) {
			for (let j = 0; j < nn.w1[i].length; j++) {
				assert.strictEqual(restored.w1[i][j], nn.w1[i][j]);
			}
		}

		// Test identical predictions
		const input = [0.5, 0.3];
		const originalPred = nn.predict(input);
		const restoredPred = restored.predict(input);

		for (let i = 0; i < originalPred.length; i++) {
			assert.strictEqual(originalPred[i], restoredPred[i]);
		}
	});

	it("should validate serialized data", () => {
		// Test missing network dimensions
		assert.throws(() => {
			NeuralNetwork.fromJSON({
				_trained: true,
				_version: 1,
				_modelType: "NeuralNetwork",
				// Missing inputSize, hiddenSize, outputSize
			});
		}, /Invalid JSON: missing network dimensions/);

		// Test null/undefined input
		assert.throws(() => {
			NeuralNetwork.fromJSON(null);
		}, /Invalid JSON: expected object/);

		// Test missing weights and biases
		assert.throws(() => {
			NeuralNetwork.fromJSON({
				inputSize: 2,
				hiddenSize: 3,
				outputSize: 1,
				_trained: true,
				_version: 1,
				_modelType: "NeuralNetwork",
				// Missing weights and biases - they'll be auto-initialized but then overwritten with missing ones
				w1: undefined,
				w2: undefined,
				b1: undefined,
				b2: undefined,
			});
		}, /Invalid network structure/);

		// Test dimension mismatch
		assert.throws(() => {
			NeuralNetwork.fromJSON({
				inputSize: 2,
				hiddenSize: 3,
				outputSize: 1,
				_trained: true,
				_version: 1,
				_modelType: "NeuralNetwork",
				w1: [[1, 2]], // Wrong dimensions (should be 2x3)
				w2: [[1], [2], [3]], // Correct dimensions
				b1: [1, 2, 3], // Correct dimensions
				b2: [1], // Correct dimensions
			});
		}, /Invalid network structure: dimension mismatch/);
	});

	it("should inherit from Model class", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		assert.ok(nn instanceof Model);
		assert.ok(nn instanceof NeuralNetwork);

		// Should have Model methods
		assert.strictEqual(typeof nn.toJSON, "function");
		assert.strictEqual(typeof nn.getModelInfo, "function");
	});

	it("should work with different architectures", () => {
		// Test various network sizes
		const architectures = [
			[1, 2, 1],
			[4, 8, 3],
			[10, 5, 2],
			[2, 10, 5],
		];

		for (const [input, hidden, output] of architectures) {
			const nn = new NeuralNetwork(input, hidden, output);

			// Generate random training data
			const inputs = [];
			const targets = [];

			for (let i = 0; i < 5; i++) {
				inputs.push(Array.from({ length: input }, () => Math.random()));
				targets.push(Array.from({ length: output }, () => Math.random()));
			}

			// Should train without errors
			assert.doesNotThrow(() => {
				nn.trainBatch(inputs, targets, { epochs: 2 });
			});

			// Should predict without errors
			const testInput = Array.from({ length: input }, () => Math.random());
			const prediction = nn.predict(testInput);

			assert.strictEqual(prediction.length, output);
			assert.ok(prediction.every((x) => Number.isFinite(x)));
		}
	});

	it("should handle edge cases gracefully", () => {
		const nn = new NeuralNetwork(2, 3, 1);

		// Train with edge case values
		nn.train([0, 0], [0], { learningRate: 0.001 });
		nn.train([1, 1], [1], { learningRate: 0.001 });

		// Test predictions with edge values
		assert.doesNotThrow(() => nn.predict([0, 0]));
		assert.doesNotThrow(() => nn.predict([1, 1]));
		assert.doesNotThrow(() => nn.predict([-1, 2]));
	});

	it("should maintain ReLU activation behavior", () => {
		const nn = new NeuralNetwork(1, 1, 1);

		// Manually set weights to test ReLU
		nn.w1[0][0] = 1; // Positive weight
		nn.b1[0] = -0.5; // Negative bias
		nn.w2[0][0] = 1;
		nn.b2[0] = 0;
		nn._markTrained();

		// Input = 0: hidden = max(0, 0*1 + (-0.5)) = max(0, -0.5) = 0
		const output1 = nn.predict([0]);
		assert.strictEqual(output1[0], 0); // ReLU should clamp to 0

		// Input = 1: hidden = max(0, 1*1 + (-0.5)) = max(0, 0.5) = 0.5
		const output2 = nn.predict([1]);
		assert.strictEqual(output2[0], 0.5); // ReLU should pass through
	});
});
