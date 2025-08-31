/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Feedforward neural network with single hidden layer using Matrix operations.
 *
 * Single hidden layer neural network for classification and regression tasks.
 * Uses ReLU activation, Xavier weight initialization, and backpropagation training.
 * Supports serialization and configurable layer sizes.
 */

import { Matrix } from "../structures/matrix.js";
import { Model } from "./model.js";

/**
 * Single hidden layer neural network implementation using Matrix operations.
 *
 * Feedforward neural network with configurable layer sizes for classification
 * and regression tasks. Uses ReLU activation, Xavier weight initialization,
 * and backpropagation training with Matrix-based operations.
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

		// Weight matrices and bias vectors using Matrix primitives
		/** @type {Matrix} */ this.w1;
		/** @type {Matrix} */ this.b1;
		/** @type {Matrix} */ this.w2;
		/** @type {Matrix} */ this.b2;

		// Pre-allocated matrices for efficient computation
		/** @type {Matrix} */ this._hiddenMatrix;
		/** @type {Matrix} */ this._outputMatrix;
		/** @type {Matrix} */ this._inputMatrix;

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
		this.w1 = Matrix.random(this.inputSize, this.hiddenSize, 0, scale1);

		// B1: biases for hidden layer [1 x hiddenSize]
		this.b1 = Matrix.zeros(1, this.hiddenSize);

		// W2: weights from hidden to output layer [hiddenSize x outputSize]
		this.w2 = Matrix.random(this.hiddenSize, this.outputSize, 0, scale2);

		// B2: biases for output layer [1 x outputSize]
		this.b2 = Matrix.zeros(1, this.outputSize);

		// Pre-allocate working matrices to avoid allocations during forward/backward pass
		this._hiddenMatrix = Matrix.zeros(1, this.hiddenSize);
		this._outputMatrix = Matrix.zeros(1, this.outputSize);
		this._inputMatrix = Matrix.zeros(1, this.inputSize);
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

		// Convert input array to matrix (reuse pre-allocated matrix)
		for (let i = 0; i < this.inputSize; i++) {
			this._inputMatrix.set(0, i, input[i]);
		}

		// Forward pass: input -> hidden -> output
		const output = this._forwardPass(this._inputMatrix);

		// Convert output matrix back to array
		return output.getRow(0).toFlatArray();
	}

	/**
	 * Optimized forward pass implementation using Matrix operations.
	 * @private
	 * @param {Matrix} inputMatrix - Input matrix (1 x inputSize)
	 * @returns {Matrix} Output matrix (1 x outputSize)
	 */
	_forwardPass(inputMatrix) {
		// Input to hidden layer: hidden = input * w1 + b1
		inputMatrix.multiply(this.w1, this._hiddenMatrix);
		this._hiddenMatrix.addInPlace(this.b1);

		// Apply ReLU activation
		this._hiddenMatrix.reluInPlace();

		// Hidden to output layer: output = hidden * w2 + b2
		this._hiddenMatrix.multiply(this.w2, this._outputMatrix);
		this._outputMatrix.addInPlace(this.b2);

		return this._outputMatrix;
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

		// Convert arrays to matrices
		for (let i = 0; i < this.inputSize; i++) {
			this._inputMatrix.set(0, i, input[i]);
		}

		const targetMatrix = new Matrix(1, this.outputSize, target);

		// Forward pass
		const hiddenMatrix = Matrix.zeros(1, this.hiddenSize);
		const outputMatrix = this._forwardPassWithHidden(
			this._inputMatrix,
			hiddenMatrix,
		);

		// Backward pass
		this._backwardPass(
			this._inputMatrix,
			targetMatrix,
			hiddenMatrix,
			outputMatrix,
			learningRate,
		);

		// Mark as trained
		if (!this._trained) {
			this._markTrained();
		}
	}

	/**
	 * Forward pass that returns intermediate hidden layer values.
	 * @private
	 * @param {Matrix} inputMatrix - Input matrix
	 * @param {Matrix} hiddenMatrix - Pre-allocated hidden matrix to write to
	 * @returns {Matrix} Output matrix
	 */
	_forwardPassWithHidden(inputMatrix, hiddenMatrix) {
		// Input to hidden layer: hidden = input * w1 + b1
		inputMatrix.multiply(this.w1, hiddenMatrix);
		hiddenMatrix.addInPlace(this.b1);
		hiddenMatrix.reluInPlace();

		// Hidden to output layer: output = hidden * w2 + b2
		const outputMatrix = Matrix.zeros(1, this.outputSize);
		hiddenMatrix.multiply(this.w2, outputMatrix);
		outputMatrix.addInPlace(this.b2);

		return outputMatrix;
	}

	/**
	 * Backpropagation algorithm to update weights and biases using Matrix operations.
	 * @private
	 * @param {Matrix} inputMatrix - Input matrix
	 * @param {Matrix} targetMatrix - Target output matrix
	 * @param {Matrix} hiddenMatrix - Hidden layer activations
	 * @param {Matrix} outputMatrix - Output layer activations
	 * @param {number} learningRate - Learning rate
	 */
	_backwardPass(
		inputMatrix,
		targetMatrix,
		hiddenMatrix,
		outputMatrix,
		learningRate,
	) {
		// Clamp learning rate to prevent numerical instability
		const clampedLR = Math.max(-10, Math.min(10, learningRate));

		// Calculate output layer gradients (error = output - target)
		const outputGrad = outputMatrix.subtract(targetMatrix);

		// Clamp output gradients
		for (let i = 0; i < outputGrad.size; i++) {
			outputGrad.data[i] = Math.max(-100, Math.min(100, outputGrad.data[i]));
		}

		// Calculate hidden layer gradients (backpropagate through ReLU)
		// hiddenGrad = outputGrad * w2^T, but only where hidden > 0 (ReLU derivative)
		const w2Transposed = this.w2.transpose();
		const hiddenGrad = outputGrad.multiply(w2Transposed);

		// Apply ReLU derivative (zero out gradients where hidden <= 0)
		for (let i = 0; i < this.hiddenSize; i++) {
			if (hiddenMatrix.get(0, i) <= 0) {
				hiddenGrad.set(0, i, 0);
			}
		}

		// Clamp hidden gradients
		for (let i = 0; i < hiddenGrad.size; i++) {
			hiddenGrad.data[i] = Math.max(-100, Math.min(100, hiddenGrad.data[i]));
		}

		// Update W2: w2 -= learningRate * hidden^T * outputGrad
		const hiddenTransposed = hiddenMatrix.transpose();
		const w2Update = hiddenTransposed.multiply(outputGrad);
		w2Update.scaleInPlace(-clampedLR);
		this.w2.addInPlace(w2Update);

		// Update W1: w1 -= learningRate * input^T * hiddenGrad
		const inputTransposed = inputMatrix.transpose();
		const w1Update = inputTransposed.multiply(hiddenGrad);
		w1Update.scaleInPlace(-clampedLR);
		this.w1.addInPlace(w1Update);

		// Update B2: b2 -= learningRate * outputGrad
		const b2Update = outputGrad.clone();
		b2Update.scaleInPlace(-clampedLR);
		this.b2.addInPlace(b2Update);

		// Update B1: b1 -= learningRate * hiddenGrad
		const b1Update = hiddenGrad.clone();
		b1Update.scaleInPlace(-clampedLR);
		this.b1.addInPlace(b1Update);

		// Clamp weights to prevent overflow
		this._clampWeights();
	}

	/**
	 * Clamp all weights and biases to prevent overflow.
	 * @private
	 */
	_clampWeights() {
		const clampRange = 1000;

		// Clamp W1
		for (let i = 0; i < this.w1.size; i++) {
			this.w1.data[i] = Math.max(
				-clampRange,
				Math.min(clampRange, this.w1.data[i]),
			);
		}

		// Clamp W2
		for (let i = 0; i < this.w2.size; i++) {
			this.w2.data[i] = Math.max(
				-clampRange,
				Math.min(clampRange, this.w2.data[i]),
			);
		}

		// Clamp B1
		for (let i = 0; i < this.b1.size; i++) {
			this.b1.data[i] = Math.max(
				-clampRange,
				Math.min(clampRange, this.b1.data[i]),
			);
		}

		// Clamp B2
		for (let i = 0; i < this.b2.size; i++) {
			this.b2.data[i] = Math.max(
				-clampRange,
				Math.min(clampRange, this.b2.data[i]),
			);
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
	 * Serialize neural network to JSON including Matrix weights.
	 *
	 * @returns {Object} JSON representation with Matrix data
	 */
	toJSON() {
		const baseJSON = /** @type {any} */ (super.toJSON());

		// Convert Matrix objects to serializable format
		baseJSON.w1 = this.w1.toJSON();
		baseJSON.b1 = this.b1.toJSON();
		baseJSON.w2 = this.w2.toJSON();
		baseJSON.b2 = this.b2.toJSON();

		return baseJSON;
	}

	/**
	 * Create a new NeuralNetwork instance from serialized state.
	 * Restores the complete network including all Matrix weights.
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

		// Restore Matrix weights from JSON
		if (jsonAny.w1) {
			result.w1 = Matrix.fromJSON(jsonAny.w1);
		}
		if (jsonAny.b1) {
			result.b1 = Matrix.fromJSON(jsonAny.b1);
		}
		if (jsonAny.w2) {
			result.w2 = Matrix.fromJSON(jsonAny.w2);
		}
		if (jsonAny.b2) {
			result.b2 = Matrix.fromJSON(jsonAny.b2);
		}

		// Restore other properties from JSON
		for (const [key, value] of Object.entries(json)) {
			if (key !== "_serializedAt" && !["w1", "b1", "w2", "b2"].includes(key)) {
				/** @type {any} */ (result)[key] = value;
			}
		}

		return result;
	}
}
