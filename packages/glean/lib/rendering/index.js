/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static documentation site generation using Beak templating.
 *
 * Transform JSON documentation graphs into beautiful HTML documentation
 * sites. Uses Beak for templating and generates complete static sites
 * with navigation, cross-references, and embedded assets.
 */

// Asset management (CSS and static files)
export { generateAssets } from "./asset-management.js";
// Content rendering (HTML components)
export {
	generateEntityDetails,
	generateEntityList,
	generateJSDocSection,
	generateReadmeSection,
} from "./content-rendering.js";
// Page generation (complete pages)
export {
	generateEntityPage,
	generateIndexPage,
	generateModulePage,
} from "./page-generation.js";
// Site orchestration (main pipeline)
export { generateStaticSite } from "./site-orchestration.js";
