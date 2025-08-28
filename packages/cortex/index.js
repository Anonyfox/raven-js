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
 * Structured LLM output parsing, statistical analysis, vector calculations, and data transformations
 * using pure JavaScript primitives and Node.js built-ins.
 *
 * **Intelligence over dependencies.** Zero external attack vectors, maximum adaptability.
 * **Platform mastery.** Native Math APIs, TextEncoder/TextDecoder, crypto primitives.
 * **Cognitive processing.** Pattern recognition, memory palace construction, neural interfaces.
 *
 * @example
 * // Basic hello world functionality
 * import { hello } from "@raven-js/cortex";
 *
 * const greeting = hello("World");
 * console.log(greeting); // "Hello, World! The raven's mind awakens."
 *
 * @example
 * // Future AI processing capabilities
 * import { parseStructuredOutput, calculateVectors } from "@raven-js/cortex";
 *
 * // Parse LLM JSON responses with validation
 * const result = parseStructuredOutput(llmResponse, schema);
 *
 * // Calculate similarity between data points
 * const similarity = calculateVectors(vectorA, vectorB);
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
