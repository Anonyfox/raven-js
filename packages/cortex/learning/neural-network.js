/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Neural Network implementation for the Cortex neural center
 *
 * Lightweight feedforward neural network with one hidden layer.
 * Designed for small/medium classification and regression tasks.
 * Uses ReLU activation and Xavier weight initialization.
 * Fully serializable and isomorphic across all JavaScript environments.
 */

import { Model } from "./model.js";

/**
 * A lightweight neural network implementation with one hidden layer.
 *
 * Perfect for classification, regression, and pattern recognition tasks
 * where you need more complexity than linear models but want to avoid
 * the overhead of deep learning frameworks.
 *
 * FEATURES:
 * - Single hidden layer with ReLU activation
 * - Configurable layer sizes
 * - Xavier weight initialization for stable training
 * - Efficient backpropagation training
 * - Complete serialization support
 * - Zero external dependencies
 *
 * @example
 * // XOR problem - classic neural network test
 * const nn = new NeuralNetwork(2, 4, 1); // 2 inputs, 4 hidden, 1 output
 *
 * const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
 * const targets = [[0], [1], [1], [0]];
 *
 * nn.trainBatch(inputs, targets, { learningRate: 0.1, epochs: 1000 });
 *
 * console.log(nn.predict([0, 1])); // Should be close to [1]
 * console.log(nn.predict([1, 1])); // Should be close to [0]
 *
 * @example
 * // Classification task
 * const classifier = new NeuralNetwork(4, 8, 3); // 4 features, 3 classes
 *
 * // Training data: [feature1, feature2, feature3, feature4] -> [class_prob1, class_prob2, class_prob3]
 * const trainingInputs = [[5.1, 3.5, 1.4, 0.2], [7.0, 3.2, 4.7, 1.4]];
 * const trainingTargets = [[1, 0, 0], [0, 1, 0]]; // One-hot encoded classes
 *
 * classifier.trainBatch(trainingInputs, trainingTargets, { learningRate: 0.01, epochs: 500 });
 *
 * const prediction = classifier.predict([6.0, 3.0, 4.0, 1.2]);
 * console.log(`Class probabilities: ${prediction}`);
 */
export class NeuralNetwork extends Model {
	/**
	 * Create a new neural network with specified architecture.
	 * Initializes weights using Xavier initialization for stable training.
	 *
	 * @param {number} inputSize - Number of input features
	 * @param {number} hiddenSize - Number of neurons in hidden layer
	 * @param {number} outputSize - Number of output neurons
	 */
	constructor(inputSize, hiddenSize, outputSize) {
		super();

		if (inputSize <= 0 || hiddenSize <= 0 || outputSize <= 0) {
			throw new Error("All layer sizes must be positive integers");
		}

		// Network architecture
		this.inputSize = inputSize;
		this.hiddenSize = hiddenSize;
		this.outputSize = outputSize;

		// Weight matrices and bias vectors (initialized below)
		/** @type {Array<Array<number>>} */ this.w1;
		/** @type {Array<number>} */ this.b1;
		/** @type {Array<Array<number>>} */ this.w2;
		/** @type {Array<number>} */ this.b2;

		// Initialize weight matrices and bias vectors
		this._initializeWeights();
	}

	/**
	 * Initialize weights using Xavier initialization for stable training dynamics.
	 * @private
	 */
	_initializeWeights() {
		// Xavier initialization scales
		const scale1 = Math.sqrt(2.0 / (this.inputSize + this.hiddenSize));
		const scale2 = Math.sqrt(2.0 / (this.hiddenSize + this.outputSize));

		// W1: weights from input to hidden layer [inputSize x hiddenSize]
		this.w1 = [];
		for (let i = 0; i < this.inputSize; i++) {
			this.w1[i] = [];
			for (let j = 0; j < this.hiddenSize; j++) {
				this.w1[i][j] = this._randomNormal() * scale1;
			}
		}

		// B1: biases for hidden layer [hiddenSize]
		this.b1 = new Array(this.hiddenSize).fill(0);

		// W2: weights from hidden to output layer [hiddenSize x outputSize]
		this.w2 = [];
		for (let i = 0; i < this.hiddenSize; i++) {
			this.w2[i] = [];
			for (let j = 0; j < this.outputSize; j++) {
				this.w2[i][j] = this._randomNormal() * scale2;
			}
		}

		// B2: biases for output layer [outputSize]
		this.b2 = new Array(this.outputSize).fill(0);
	}

	/**
	 * Generate normally distributed random number using Box-Muller transform.
	 * @private
	 * @returns {number} Random number from standard normal distribution
	 */
	_randomNormal() {
		// Box-Muller transform for normal distribution
		if (this._hasSpareRandom) {
			this._hasSpareRandom = false;
			return this._spareRandom;
		}

		this._hasSpareRandom = true;
		const u = Math.random();
		const v = Math.random();
		const mag = Math.sqrt(-2.0 * Math.log(u));
		this._spareRandom = mag * Math.cos(2.0 * Math.PI * v);
		return mag * Math.sin(2.0 * Math.PI * v);
	}

	/**
	 * Perform forward pass through the network (inference).
	 * Computes output for given input using current weights and biases.
	 *
	 * @param {Array<number>} input - Input vector
	 * @returns {Array<number>} Output vector
	 * @throws {Error} If input size doesn't match network architecture
	 *
	 * @example
	 * const output = nn.predict([0.5, 0.3, 0.8]);
	 * console.log(`Network output: ${output}`);
	 */
	predict(input) {
		this._validateTrained();

		if (!Array.isArray(input) || input.length !== this.inputSize) {
			throw new Error(
				`Expected input size ${this.inputSize}, got ${input.length}`,
			);
		}

		// Forward pass: input -> hidden -> output
		return this._forwardPass(input);
	}

	/**
	 * Optimized forward pass implementation.
	 * @private
	 * @param {Array<number>} input - Input vector
	 * @returns {Array<number>} Output vector
	 */
	_forwardPass(input) {
		// Input to hidden layer with ReLU activation
		const hidden = new Array(this.hiddenSize);
		for (let j = 0; j < this.hiddenSize; j++) {
			let sum = this.b1[j];
			for (let k = 0; k < this.inputSize; k++) {
				sum += input[k] * this.w1[k][j];
			}
			hidden[j] = Math.max(0, sum); // ReLU activation
		}

		// Hidden to output layer (linear activation)
		const output = new Array(this.outputSize);
		for (let j = 0; j < this.outputSize; j++) {
			let sum = this.b2[j];
			for (let k = 0; k < this.hiddenSize; k++) {
				sum += hidden[k] * this.w2[k][j];
			}
			output[j] = sum;
		}

		return output;
	}

	/**
	 * Train the network with a single input-target pair.
	 * Uses backpropagation to update weights and biases.
	 *
	 * @param {Array<number>} input - Input vector
	 * @param {Array<number>} target - Target output vector
	 * @param {Object} options - Training options
	 * @param {number} [options.learningRate=0.01] - Learning rate for weight updates
	 */
	train(input, target, options = {}) {
		const { learningRate = 0.01 } = options;

		if (!Array.isArray(input) || input.length !== this.inputSize) {
			throw new Error(
				`Expected input size ${this.inputSize}, got ${input.length}`,
			);
		}

		if (!Array.isArray(target) || target.length !== this.outputSize) {
			throw new Error(
				`Expected target size ${this.outputSize}, got ${target.length}`,
			);
		}

		// Forward pass
		const { hidden, output } = this._forwardPassWithHidden(input);

		// Backward pass
		this._backwardPass(input, target, hidden, output, learningRate);

		// Mark as trained
		if (!this._trained) {
			this._markTrained();
		}
	}

	/**
	 * Forward pass that returns intermediate hidden layer values.
	 * @private
	 * @param {Array<number>} input - Input vector
	 * @returns {{hidden: Array<number>, output: Array<number>}} Hidden and output layer values
	 */
	_forwardPassWithHidden(input) {
		// Input to hidden layer with ReLU activation
		const hidden = new Array(this.hiddenSize);
		for (let j = 0; j < this.hiddenSize; j++) {
			let sum = this.b1[j];
			for (let k = 0; k < this.inputSize; k++) {
				sum += input[k] * this.w1[k][j];
			}
			hidden[j] = Math.max(0, sum); // ReLU activation
		}

		// Hidden to output layer (linear activation)
		const output = new Array(this.outputSize);
		for (let j = 0; j < this.outputSize; j++) {
			let sum = this.b2[j];
			for (let k = 0; k < this.hiddenSize; k++) {
				sum += hidden[k] * this.w2[k][j];
			}
			output[j] = sum;
		}

		return { hidden, output };
	}

	/**
	 * Backpropagation algorithm to update weights and biases.
	 * @private
	 * @param {Array<number>} input - Input vector
	 * @param {Array<number>} target - Target output vector
	 * @param {Array<number>} hidden - Hidden layer activations
	 * @param {Array<number>} output - Output layer activations
	 * @param {number} learningRate - Learning rate
	 */
	_backwardPass(input, target, hidden, output, learningRate) {
		// Clamp learning rate to prevent numerical instability
		const clampedLR = Math.max(-10, Math.min(10, learningRate));

		// Calculate output layer gradients (error = output - target)
		const outputGrad = new Array(this.outputSize);
		for (let j = 0; j < this.outputSize; j++) {
			outputGrad[j] = output[j] - target[j];
			// Clamp gradients to prevent explosion
			outputGrad[j] = Math.max(-100, Math.min(100, outputGrad[j]));
		}

		// Calculate hidden layer gradients (backpropagate through ReLU)
		const hiddenGrad = new Array(this.hiddenSize);
		for (let j = 0; j < this.hiddenSize; j++) {
			hiddenGrad[j] = 0;
			if (hidden[j] > 0) {
				// ReLU derivative: 1 if x > 0, else 0
				for (let k = 0; k < this.outputSize; k++) {
					hiddenGrad[j] += outputGrad[k] * this.w2[j][k];
				}
				// Clamp hidden gradients to prevent explosion
				hiddenGrad[j] = Math.max(-100, Math.min(100, hiddenGrad[j]));
			}
		}

		// Update W2 (hidden to output weights)
		for (let j = 0; j < this.hiddenSize; j++) {
			for (let k = 0; k < this.outputSize; k++) {
				const update = clampedLR * outputGrad[k] * hidden[j];
				if (Number.isFinite(update)) {
					this.w2[j][k] -= update;
					// Clamp weights to prevent overflow
					this.w2[j][k] = Math.max(-1000, Math.min(1000, this.w2[j][k]));
				}
			}
		}

		// Update W1 (input to hidden weights)
		for (let j = 0; j < this.inputSize; j++) {
			for (let k = 0; k < this.hiddenSize; k++) {
				const update = clampedLR * hiddenGrad[k] * input[j];
				if (Number.isFinite(update)) {
					this.w1[j][k] -= update;
					// Clamp weights to prevent overflow
					this.w1[j][k] = Math.max(-1000, Math.min(1000, this.w1[j][k]));
				}
			}
		}

		// Update B2 (output biases)
		for (let j = 0; j < this.outputSize; j++) {
			const update = clampedLR * outputGrad[j];
			if (Number.isFinite(update)) {
				this.b2[j] -= update;
				this.b2[j] = Math.max(-1000, Math.min(1000, this.b2[j]));
			}
		}

		// Update B1 (hidden biases)
		for (let j = 0; j < this.hiddenSize; j++) {
			const update = clampedLR * hiddenGrad[j];
			if (Number.isFinite(update)) {
				this.b1[j] -= update;
				this.b1[j] = Math.max(-1000, Math.min(1000, this.b1[j]));
			}
		}
	}

	/**
	 * Train the network with multiple input-target pairs.
	 * Performs multiple epochs of training over the dataset.
	 *
	 * @param {Array<Array<number>>} inputs - Array of input vectors
	 * @param {Array<Array<number>>} targets - Array of target output vectors
	 * @param {Object} options - Training options
	 * @param {number} [options.learningRate=0.01] - Learning rate for weight updates
	 * @param {number} [options.epochs=100] - Number of training epochs
	 * @param {boolean} [options.shuffle=true] - Whether to shuffle data each epoch
	 *
	 * @example
	 * const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
	 * const targets = [[0], [1], [1], [0]]; // XOR function
	 *
	 * nn.trainBatch(inputs, targets, {
	 *   learningRate: 0.1,
	 *   epochs: 1000,
	 *   shuffle: true
	 * });
	 */
	trainBatch(inputs, targets, options = {}) {
		const { learningRate = 0.01, epochs = 100, shuffle = true } = options;

		if (!Array.isArray(inputs) || !Array.isArray(targets)) {
			throw new Error("Inputs and targets must be arrays");
		}

		if (inputs.length === 0 || targets.length === 0) {
			throw new Error("Training data cannot be empty");
		}

		if (inputs.length !== targets.length) {
			throw new Error("Inputs and targets must have the same length");
		}

		// Validate data dimensions
		if (inputs[0].length !== this.inputSize) {
			throw new Error(
				`Expected input size ${this.inputSize}, got ${inputs[0].length}`,
			);
		}

		if (targets[0].length !== this.outputSize) {
			throw new Error(
				`Expected target size ${this.outputSize}, got ${targets[0].length}`,
			);
		}

		// Create training indices for shuffling
		const indices = Array.from({ length: inputs.length }, (_, i) => i);

		// Training loop
		for (let epoch = 0; epoch < epochs; epoch++) {
			// Shuffle data each epoch if requested
			if (shuffle) {
				this._shuffleArray(indices);
			}

			// Train on each example
			for (let idx = 0; idx < indices.length; idx++) {
				const i = indices[idx];
				this.train(inputs[i], targets[i], { learningRate });
			}
		}
	}

	/**
	 * Fisher-Yates shuffle algorithm for array shuffling.
	 * @private
	 * @param {Array<number>} array - Array to shuffle in place
	 */
	_shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	/**
	 * Calculate the mean squared error loss for given data.
	 * Useful for monitoring training progress.
	 *
	 * @param {Array<Array<number>>} inputs - Input vectors
	 * @param {Array<Array<number>>} targets - Target vectors
	 * @returns {number} Mean squared error
	 *
	 * @example
	 * const loss = nn.calculateLoss(testInputs, testTargets);
	 * console.log(`Test loss: ${loss.toFixed(4)}`);
	 */
	calculateLoss(inputs, targets) {
		this._validateTrained();

		if (inputs.length !== targets.length) {
			throw new Error("Inputs and targets must have the same length");
		}

		let totalError = 0;
		let totalSamples = 0;

		for (let i = 0; i < inputs.length; i++) {
			const predicted = this.predict(inputs[i]);
			const target = targets[i];

			for (let j = 0; j < predicted.length; j++) {
				const error = predicted[j] - target[j];
				totalError += error * error;
				totalSamples++;
			}
		}

		return totalError / totalSamples;
	}

	/**
	 * Get network parameters and statistics for introspection.
	 *
	 * @returns {Object} Network parameters and metadata
	 * @example
	 * const params = nn.getParameters();
	 * console.log(`Architecture: ${params.inputSize}→${params.hiddenSize}→${params.outputSize}`);
	 * console.log(`Total parameters: ${params.totalParameters}`);
	 */
	getParameters() {
		const totalParameters =
			this.inputSize * this.hiddenSize + // W1
			this.hiddenSize + // B1
			this.hiddenSize * this.outputSize + // W2
			this.outputSize; // B2

		return {
			inputSize: this.inputSize,
			hiddenSize: this.hiddenSize,
			outputSize: this.outputSize,
			totalParameters,
			architecture: `${this.inputSize}→${this.hiddenSize}→${this.outputSize}`,
			trained: this._trained,
		};
	}

	/**
	 * Create a new NeuralNetwork instance from serialized state.
	 * Restores the complete network including all weights and biases.
	 *
	 * @param {Record<string, any>} json - The serialized network state
	 * @returns {NeuralNetwork} A new NeuralNetwork instance
	 * @throws {Error} If the serialized data is invalid
	 *
	 * @example
	 * const networkData = JSON.parse(jsonString);
	 * const nn = NeuralNetwork.fromJSON(networkData);
	 * console.log(nn.predict([1, 0])); // Ready to use
	 */
	static fromJSON(json) {
		// First validate the JSON has required properties
		if (!json || typeof json !== "object") {
			throw new Error("Invalid JSON: expected object");
		}

		const jsonAny = /** @type {any} */ (json);
		if (!jsonAny.inputSize || !jsonAny.hiddenSize || !jsonAny.outputSize) {
			throw new Error("Invalid JSON: missing network dimensions");
		}

		// Create a new instance with proper dimensions
		const result = new NeuralNetwork(
			jsonAny.inputSize,
			jsonAny.hiddenSize,
			jsonAny.outputSize,
		);

		// Restore all properties from JSON
		for (const [key, value] of Object.entries(json)) {
			if (key !== "_serializedAt") {
				/** @type {any} */ (result)[key] = value;
			}
		}

		// Validate network structure after deserialization
		if (!result.w1 || !result.w2 || !result.b1 || !result.b2) {
			throw new Error("Invalid network structure: missing weights or biases");
		}

		// Validate dimensions match declared sizes
		if (
			result.w1.length !== result.inputSize ||
			result.w1[0].length !== result.hiddenSize ||
			result.w2.length !== result.hiddenSize ||
			result.w2[0].length !== result.outputSize ||
			result.b1.length !== result.hiddenSize ||
			result.b2.length !== result.outputSize
		) {
			throw new Error("Invalid network structure: dimension mismatch");
		}

		return result;
	}
}
