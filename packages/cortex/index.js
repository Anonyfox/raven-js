/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Zero-dependency machine learning, AI, and data processing library for modern JavaScript
 *
 * The raven's neural nexus: intelligence distillation through platform-native algorithms.
 * Machine learning, data structures, temporal computation, and cognitive processing
 * using pure JavaScript primitives and Node.js built-ins.
 *
 * **Intelligence over dependencies.** Zero external attack vectors, maximum adaptability.
 * **Platform mastery.** Native Math APIs, precise temporal algorithms, structural validation.
 * **Cognitive processing.** Pattern recognition, memory palace construction, chronological computation.
 *
 * @example
 * // Neural computation and data structures
 * import { Matrix, Schema, NeuralNetwork } from "@raven-js/cortex";
 *
 * const matrix = Matrix.random(3, 3);
 * const network = new NeuralNetwork([2, 4, 1]);
 *
 * @example
 * // Temporal computation with surgical precision
 * import { calculateEasterSunday } from "@raven-js/cortex";
 *
 * const easter2024 = calculateEasterSunday(2024);
 * console.log(easter2024); // 2024-03-31 (March 31, 2024)
 */

/**
 * A simple hello world function to establish the Cortex neural interface.
 * Demonstrates the foundational pattern for all Cortex cognitive functions.
 *
 * @param {string} name - The entity to greet
 * @returns {string} A greeting message that acknowledges the raven's awakening intelligence
 *
 * @example
 * const greeting = hello("Developer");
 * console.log(greeting); // "Hello, Developer! The raven's mind awakens."
 *
 * @example
 * const greeting = hello("AI");
 * console.log(greeting); // "Hello, AI! The raven's mind awakens."
 */
export function hello(name) {
	if (typeof name !== "string") {
		throw new TypeError("Expected name to be a string");
	}

	return `Hello, ${name}! The raven's mind awakens.`;
}

// Export learning algorithms
export { LinearRegression, Model, NeuralNetwork } from "./learning/index.js";

// Export structural primitives
export { Matrix, Schema } from "./structures/index.js";

// Export temporal functions
export { calculateEasterSunday } from "./temporal/index.js";
