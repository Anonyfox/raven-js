/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Refactored extraction module - surgical modular architecture.
 *
 * Reconstructed from 9 specialized modules following RavenJS predatory
 * precision principles. Maintains identical public API with improved
 * maintainability through business-aligned modular design.
 */

// Content integration
export { extractReadmeData } from "./content-integration.js";
// Entity construction
export { buildEntityNode } from "./entity-construction.js";
// Graph orchestration (main entry point)
export {
	buildEntityReferences,
	extractDocumentationGraph,
} from "./graph-orchestration.js";
// ID generation utilities
export { generateModuleId, generateReadmeId } from "./id-generators.js";
// JSDoc processing
export {
	parseJSDocToStructured,
	parseParamTag,
	parseReturnTag,
} from "./jsdoc-processing.js";
// Module processing
export { extractModuleData } from "./module-processing.js";
// Module relationships
export {
	determineExportType,
	extractModuleExports,
	extractModuleImports,
	parseImportClause,
} from "./module-relationships.js";
// Package intelligence
export { buildPackageMetadata } from "./package-metadata.js";
// Source analysis
export { extractSourceSnippet, findClosingBrace } from "./source-analysis.js";

/**
 * Re-export all type definitions for compatibility
 */

/**
 * @typedef {import('./graph-orchestration.js').DocumentationGraph} DocumentationGraph
 */

/**
 * @typedef {import('./graph-orchestration.js').AssetData} AssetData
 */

/**
 * @typedef {import('./package-metadata.js').PackageMetadata} PackageMetadata
 */

/**
 * @typedef {import('./module-processing.js').ModuleData} ModuleData
 */

/**
 * @typedef {import('./module-relationships.js').ModuleImport} ModuleImport
 */

/**
 * @typedef {import('./entity-construction.js').EntityNode} EntityNode
 */

/**
 * @typedef {import('./jsdoc-processing.js').StructuredJSDoc} StructuredJSDoc
 */

/**
 * @typedef {import('./jsdoc-processing.js').ParamTag} ParamTag
 */

/**
 * @typedef {import('./jsdoc-processing.js').ReturnTag} ReturnTag
 */

/**
 * @typedef {import('./content-integration.js').ReadmeData} ReadmeData
 */
