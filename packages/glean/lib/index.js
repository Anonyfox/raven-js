/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Glean documentation generator - complete toolkit for JavaScript project analysis and documentation
 *
 * Provides discovery, extraction, validation, server, and static generation capabilities
 * for creating comprehensive documentation from JavaScript codebases.
 */

export { runAnalyzeCommand } from "./analyze.js";
export { discover } from "./discover/index.js";
export { extract } from "./extract/index.js";
export {
	createDocumentationServer,
	startDocumentationServer,
} from "./server/index.js";
export { generateStaticSite } from "./static-generate.js";
export { validate } from "./validate.js";
