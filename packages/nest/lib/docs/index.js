/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @packageDocumentation Module exports and main entry point
 */

export { copyFavicon } from "./copy-favicon.js";
export {
	canGenerateBundles,
	generateAllBundles,
	generateCommonJSBundle,
	generateESMBundle,
	generateESMMinifiedBundle,
	getBundleEntryPoint,
} from "./generate-bundle.js";
export { generateContext, generateContextJson } from "./generate-context.js";
export { generateLandingPage } from "./generate-landingpage.js";
export {
	canGenerateTypeDoc,
	generateTypeDoc,
	generateTypeDocConfig,
	getEntryPoints,
} from "./generate-typedoc.js";
export { getDocsPath, getWorkspaceRoot } from "./get-docs-path.js";
