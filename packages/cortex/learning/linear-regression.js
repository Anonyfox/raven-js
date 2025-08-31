/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Incremental linear regression implementation using least squares method.
 *
 * Learns from streaming data points without storing entire datasets in memory.
 * Supports batch training, serialization, and coefficient of determination calculation.
 */

import { Model } from "./model.js";

/**
 * Incremental Linear Regression model using least squares method for streaming data.
 *
 * Learns from individual data points without storing the entire dataset in memory.
 * Calculates optimal line fit (y = mx + b) and inherits serialization from Model class.
 *
 * Suitable for time series prediction and numerical forecasting with single input features.
 *
 * @example
 * // Create and train the model incrementally
 * const model = new LinearRegression();
 * model.train({ x: 1, y: 2 });
 * model.train({ x: 2, y: 4 });
 * model.train({ x: 3, y: 5 });
 *
 * // Make predictions
 * console.log(model.predict({ x: 4 })); // ~6.33
 *
 * @example
 * // Batch training for convenience
 * const model = new LinearRegression();
 * model.trainBatch([
 *   { x: 1, y: 2 },
 *   { x: 2, y: 4 },
 *   { x: 3, y: 5 }
 * ]);
 *
 * // Serialize and restore
 * const serialized = model.toJSON();
 * const restored = LinearRegression.fromJSON(serialized);
 * console.log(restored.predict({ x: 5 })); // Same prediction
 *
 * @example
 * // Real-world usage: predict website traffic
 * const traffic = new LinearRegression();
 * traffic.trainBatch([
 *   { x: 1, y: 100 },  // Week 1: 100 visitors
 *   { x: 2, y: 150 },  // Week 2: 150 visitors
 *   { x: 3, y: 200 },  // Week 3: 200 visitors
 * ]);
 *
 * const nextWeekTraffic = traffic.predict({ x: 4 });
 * console.log(`Expected visitors next week: ${Math.round(nextWeekTraffic)}`);
 */
export class LinearRegression extends Model {
	/**
	 * Create a new LinearRegression model.
	 * Initializes with zero slope and intercept, ready for incremental learning.
	 */
	constructor() {
		super();

		/** @type {number} - The slope (m) of the linear equation y = mx + b */
		this.slope = 0;

		/** @type {number} - The y-intercept (b) of the linear equation y = mx + b */
		this.intercept = 0;

		// Internal state for incremental least squares calculation
		/** @type {number} @private */
		this.sumX = 0;
		/** @type {number} @private */
		this.sumY = 0;
		/** @type {number} @private */
		this.sumXY = 0;
		/** @type {number} @private */
		this.sumXX = 0;
		/** @type {number} @private */
		this.n = 0;
	}

	/**
	 * Train the model with a single data point using incremental learning.
	 * Updates the slope and intercept immediately using the least squares method.
	 *
	 * This method is perfect for streaming data where you want to update
	 * the model as new observations arrive.
	 *
	 * @param {{ x: number, y: number }} item - The training data item
	 *
	 * @example
	 * const model = new LinearRegression();
	 * model.train({ x: 1, y: 2 });
	 * model.train({ x: 2, y: 4 });
	 * // Model is immediately updated and ready for predictions
	 */
	train(item) {
		const x = item.x;
		const y = item.y;

		if (typeof x !== "number" || typeof y !== "number") {
			throw new TypeError("Training data must contain numeric x and y values");
		}

		if (!Number.isFinite(x) || !Number.isFinite(y)) {
			throw new Error("Training data must contain finite numeric values");
		}

		// Accumulate statistics for least squares calculation
		this.n++;
		this.sumX += x;
		this.sumY += y;
		this.sumXY += x * y;
		this.sumXX += x * x;

		// OPTIMIZED: Single denominator calculation with cached inverse
		const denominator = this.n * this.sumXX - this.sumX * this.sumX;

		if (denominator !== 0) {
			// OPTIMIZED: Reuse denominator, eliminate second division
			const invDenominator = 1 / denominator;
			this.slope =
				(this.n * this.sumXY - this.sumX * this.sumY) * invDenominator;
			this.intercept =
				(this.sumY * this.sumXX - this.sumX * this.sumXY) * invDenominator;
		}

		// Mark as trained after first data point
		if (this.n === 1) {
			this._markTrained();
		}
	}

	/**
	 * Train the model with a batch of data points.
	 * Convenience method for training with multiple observations at once.
	 *
	 * @param {Array<{ x: number, y: number }>} items - An array of training data items
	 * @throws {Error} If the items array is empty
	 *
	 * @example
	 * const model = new LinearRegression();
	 * model.trainBatch([
	 *   { x: 1, y: 2 },
	 *   { x: 2, y: 4 },
	 *   { x: 3, y: 6 }
	 * ]);
	 */
	trainBatch(items) {
		if (!Array.isArray(items) || items.length === 0) {
			throw new Error("Training batch must be a non-empty array");
		}

		// OPTIMIZED: Inline training logic, eliminate function call overhead
		let localSumX = this.sumX;
		let localSumY = this.sumY;
		let localSumXY = this.sumXY;
		let localSumXX = this.sumXX;
		let localN = this.n;

		// Cache variables to avoid property access in tight loop
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const x = item.x;
			const y = item.y;

			localN++;
			localSumX += x;
			localSumY += y;
			localSumXY += x * y;
			localSumXX += x * x;
		}

		// Update instance state once after batch processing
		this.sumX = localSumX;
		this.sumY = localSumY;
		this.sumXY = localSumXY;
		this.sumXX = localSumXX;
		this.n = localN;

		// OPTIMIZED: Single final calculation instead of per-point calculations
		const denominator = this.n * this.sumXX - this.sumX * this.sumX;

		if (denominator !== 0) {
			const invDenominator = 1 / denominator;
			this.slope =
				(this.n * this.sumXY - this.sumX * this.sumY) * invDenominator;
			this.intercept =
				(this.sumY * this.sumXX - this.sumX * this.sumXY) * invDenominator;
		}

		// Mark as trained if this was the first batch
		if (!this._trained) {
			this._markTrained();
		}
	}

	/**
	 * Make a prediction based on the trained model.
	 * Uses the linear equation y = mx + b where m is slope and b is intercept.
	 *
	 * @param {{ x: number }} item - The input object containing the x value
	 * @returns {number} The predicted y value
	 * @throws {Error} If the model has not been trained yet
	 *
	 * @example
	 * const prediction = model.predict({ x: 5 });
	 * console.log(`Predicted y value: ${prediction}`);
	 */
	predict({ x }) {
		this._validateTrained();

		if (typeof x !== "number" || !Number.isFinite(x)) {
			throw new TypeError("Prediction input must be a finite number");
		}

		return this.slope * x + this.intercept;
	}

	/**
	 * Get the current model parameters and statistics.
	 * Useful for model introspection and debugging.
	 *
	 * @returns {Object} Model parameters and training statistics
	 * @example
	 * const params = model.getParameters();
	 * console.log(`Slope: ${params.slope}, Intercept: ${params.intercept}`);
	 * console.log(`Trained on ${params.dataPoints} points`);
	 */
	getParameters() {
		return {
			slope: this.slope,
			intercept: this.intercept,
			dataPoints: this.n,
			equation: `y = ${this.slope.toFixed(4)}x + ${this.intercept.toFixed(4)}`,
		};
	}

	/**
	 * Calculate the coefficient of determination (R²) if you have test data.
	 * Measures how well the model fits the data (1.0 = perfect fit, 0.0 = no correlation).
	 *
	 * @param {Array<{ x: number, y: number }>} testData - Array of test data points
	 * @returns {number} R² value between 0 and 1
	 * @throws {Error} If model is not trained or test data is invalid
	 *
	 * @example
	 * const r2 = model.calculateR2([
	 *   { x: 1, y: 2 },
	 *   { x: 2, y: 4 }
	 * ]);
	 * console.log(`Model explains ${(r2 * 100).toFixed(1)}% of variance`);
	 */
	calculateR2(testData) {
		this._validateTrained();

		if (!Array.isArray(testData) || testData.length === 0) {
			throw new Error("Test data must be a non-empty array");
		}

		const length = testData.length;

		// OPTIMIZED: Single pass to calculate mean
		let ySum = 0;
		for (let i = 0; i < length; i++) {
			ySum += testData[i].y;
		}
		const yMean = ySum / length;

		// OPTIMIZED: Cache slope/intercept for tight loop, inline prediction
		const slope = this.slope;
		const intercept = this.intercept;

		let ssRes = 0;
		let ssTot = 0;

		// OPTIMIZED: Single loop with inlined prediction calculation
		for (let i = 0; i < length; i++) {
			const item = testData[i];
			const actual = item.y;

			// INLINED: Prediction calculation (eliminated function call)
			const predicted = slope * item.x + intercept;

			const residual = actual - predicted;
			const totalDev = actual - yMean;

			ssRes += residual * residual;
			ssTot += totalDev * totalDev;
		}

		// R² = 1 - (SS_res / SS_tot)
		return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
	}

	/**
	 * Create a new LinearRegression instance from serialized state.
	 * Restores the complete model including all training data and parameters.
	 *
	 * @param {Record<string, any>} json - The serialized model state
	 * @returns {LinearRegression} A new LinearRegression instance
	 * @throws {Error} If the serialized data is invalid
	 *
	 * @example
	 * const modelData = JSON.parse(jsonString);
	 * const model = LinearRegression.fromJSON(modelData);
	 * console.log(model.predict({ x: 10 })); // Ready to use
	 */
	static fromJSON(json) {
		/** @type {LinearRegression} */
		const result = /** @type {LinearRegression} */ (
			Model.fromJSON(json, LinearRegression)
		);
		return result;
	}
}
