/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Linear Regression implementation for the Cortex neural network
 *
 * Lightweight incremental linear regression that learns from streaming data.
 * Perfect for predicting numerical values based on historical observations.
 * Fully serializable and isomorphic across all JavaScript environments.
 */

import { Model } from "./model.js";

/**
 * A lightweight Linear Regression model implementation using incremental learning.
 *
 * Learns from streaming data points without storing the entire dataset in memory.
 * Uses the least squares method to find the optimal line fit: y = mx + b.
 * Inherits universal serialization capabilities from the base Model class.
 *
 * Perfect for time series prediction, trend analysis, and numerical forecasting
 * where you want to predict a continuous value based on a single input feature.
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
	train({ x, y }) {
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

		// Calculate slope and intercept using least squares method
		// Formula: slope = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)
		// Formula: intercept = (ΣY*ΣX² - ΣX*ΣXY) / (n*ΣX² - (ΣX)²)
		const denominator = this.n * this.sumXX - this.sumX ** 2;

		if (denominator !== 0) {
			this.slope = (this.n * this.sumXY - this.sumX * this.sumY) / denominator;
			this.intercept =
				(this.sumY * this.sumXX - this.sumX * this.sumXY) / denominator;
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

		for (const item of items) {
			this.train(item);
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

		// Calculate mean of actual y values
		const yMean =
			testData.reduce((sum, item) => sum + item.y, 0) / testData.length;

		// Calculate sum of squares
		let ssRes = 0; // Sum of squares of residuals
		let ssTot = 0; // Total sum of squares

		for (const item of testData) {
			const predicted = this.predict({ x: item.x });
			const actual = item.y;

			ssRes += (actual - predicted) ** 2;
			ssTot += (actual - yMean) ** 2;
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
