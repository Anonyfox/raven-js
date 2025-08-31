/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Component library exports for Glean documentation templates
 *
 * Clean component architecture eliminating custom CSS through
 * Bootstrap utility classes and semantic markup patterns.
 */

// Alert components
export { alert, deprecationAlert, emptyState } from "./alert.js";

// Attribution components
export { attributionBar } from "./attribution-bar.js";
export {
	applySyntaxHighlighting,
	cardGrid,
	codeBlock,
	contentSection,
	gettingStarted,
	tableSection,
} from "./content-section.js";
// Content components
export { entityCard, moduleCard } from "./entity-card.js";
// Navigation components
export {
	entityNavigation,
	moduleNavigation,
	quickActions,
	statsSidebar,
} from "./navigation-sidebar.js";
export { inlinePackageLinks, packageFooter } from "./package-footer.js";
// Page structure components
export { pageHeader } from "./page-header.js";
export { seeAlsoLinks } from "./see-links.js";
export { statsCard, statsGrid } from "./stats-card.js";
