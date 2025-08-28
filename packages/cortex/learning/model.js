/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Base Model class for machine learning algorithms
 *
 * Provides universal serialization/deserialization capabilities for all ML models.
 * Ensures isomorphic operation across browser and Node.js environments.
 * Foundation for the murder's learning algorithms.
 */

/**
 * Base class for all machine learning models in the Cortex neural network.
 * Provides standardized serialization, validation, and lifecycle management.
 *
 * All learning algorithms inherit from this foundation to ensure consistent
 * behavior across different environments and use cases.
 *
 * @abstract
 * @example
 * class CustomModel extends Model {
 *   constructor() {
 *     super();
 *     this.weights = [];
 *   }
 *
 *   train(data) {
 *     // Training logic
 *   }
 *
 *   predict(input) {
 *     // Prediction logic
 *   }
 * }
 */
export class Model {
	/**
	 * Create a new Model instance.
	 * Initializes the base state tracking and validation.
	 */
	constructor() {
		/** @type {boolean} */
		this._trained = false;
		/** @type {number} */
		this._version = 1;
		/** @type {string} */
		this._modelType = this.constructor.name;
		/** @type {number} */
		this._createdAt = Date.now();
	}

	/**
	 * Serialize the model state to a JSON-friendly object.
	 * Captures all serializable properties while excluding methods and private state.
	 *
	 * @returns {Object} The serialized model state
	 * @example
	 * const serialized = model.toJSON();
	 * const jsonString = JSON.stringify(serialized);
	 */
	toJSON() {
		/** @type {Record<string, any>} */
		const result = {};

		// Capture all enumerable own properties
		for (const key of Object.getOwnPropertyNames(this)) {
			/** @type {any} */
			const value = /** @type {any} */ (this)[key];

			// Skip functions and symbols, capture serializable data
			if (typeof value !== "function" && typeof value !== "symbol") {
				result[key] = value;
			}
		}

		// Ensure metadata is always included
		result._trained = this._trained;
		result._version = this._version;
		result._modelType = this._modelType;
		result._createdAt = this._createdAt;
		result._serializedAt = Date.now();

		return result;
	}

	/**
	 * Create a new model instance from serialized state.
	 * Validates the serialized data and reconstructs the model.
	 *
	 * @param {Record<string, any>} json - The serialized model state
	 * @param {new () => Model} ModelClass - The model class constructor to instantiate
	 * @returns {Model} A new model instance
	 * @throws {Error} If the serialized data is invalid or incompatible
	 *
	 * @example
	 * const modelData = JSON.parse(jsonString);
	 * const model = Model.fromJSON(modelData, LinearRegression);
	 */
	static fromJSON(json, ModelClass) {
		if (!json || typeof json !== "object") {
			throw new Error("Invalid JSON: expected object");
		}

		if (!ModelClass || typeof ModelClass !== "function") {
			throw new Error("Invalid ModelClass: expected constructor function");
		}

		// Validate model type compatibility
		/** @type {any} */
		const jsonAny = json;
		if (jsonAny._modelType && jsonAny._modelType !== ModelClass.name) {
			throw new Error(
				`Model type mismatch: expected ${ModelClass.name}, got ${jsonAny._modelType}`,
			);
		}

		// Create new instance and restore state
		const model = new ModelClass();

		// Restore all serialized properties
		for (const [key, value] of Object.entries(json)) {
			if (key !== "_serializedAt") {
				// Skip serialization timestamp
				/** @type {any} */ (model)[key] = value;
			}
		}

		return model;
	}

	/**
	 * Validate that the model has been trained before making predictions.
	 * Prevents usage of untrained models.
	 *
	 * @throws {Error} If the model has not been trained
	 * @protected
	 */
	_validateTrained() {
		if (!this._trained) {
			throw new Error(
				`${this._modelType} model must be trained before making predictions`,
			);
		}
	}

	/**
	 * Mark the model as trained and update metadata.
	 * Called by subclasses after successful training.
	 *
	 * @protected
	 */
	_markTrained() {
		this._trained = true;
	}

	/**
	 * Get model metadata for introspection and debugging.
	 *
	 * @returns {Object} Model metadata
	 * @example
	 * const info = model.getModelInfo();
	 * console.log(`Model: ${info.type}, trained: ${info.trained}`);
	 */
	getModelInfo() {
		return {
			type: this._modelType,
			trained: this._trained,
			version: this._version,
			createdAt: new Date(this._createdAt),
		};
	}
}
