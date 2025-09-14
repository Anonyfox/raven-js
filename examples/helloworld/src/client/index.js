/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Islands bootloader – auto-hydrate all islands on page load.
 */

import { hydrateIslands } from "@raven-js/reflex/dom";

// Auto-hydrate islands when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", hydrateIslands);
} else {
	hydrateIslands();
}
