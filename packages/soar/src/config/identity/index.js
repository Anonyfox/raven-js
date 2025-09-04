/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Resource identity utilities for universal naming across cloud providers.
 *
 * Provides DNS-safe resource naming validation and transformation utilities
 * that work consistently across all deployment targets.
 */

export { RESERVED_NAMES } from "./reserved-names.js";
export { validate } from "./validate.js";
export { isValid } from "./is-valid.js";
export { suggest } from "./suggest.js";
