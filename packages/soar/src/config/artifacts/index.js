/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Artifacts module exports.
 *
 * Exports the concrete artifact classes and their config types.
 * Base class is internal abstraction and not exported.
 */

export { BinaryArtifact } from "./binary.js";
export { ScriptArtifact } from "./script.js";
export { selectArtifact } from "./select.js";
export { StaticArtifact } from "./static.js";

/**
 * @typedef {import('./binary.js').BinaryArtifactConfig} BinaryArtifactConfig
 */

/**
 * @typedef {import('./script.js').ScriptArtifactConfig} ScriptArtifactConfig
 */

/**
 * @typedef {import('./static.js').StaticArtifactConfig} StaticArtifactConfig
 */
