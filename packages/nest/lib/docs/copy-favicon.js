/**
 * @fileoverview Copy favicon to docs directory
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Copy favicon to docs directory
 * @param {string} docsPath - Path to the docs directory
 * @param {string} workspaceRoot - Path to the workspace root (where media folder is located)
 * @returns {boolean} True if favicon was copied successfully, false otherwise
 */
export function copyFavicon(docsPath, workspaceRoot) {
	try {
		const faviconSource = join(workspaceRoot, "media", "favicon.ico");
		const faviconDest = join(docsPath, "favicon.ico");

		// Check if source favicon exists
		if (!existsSync(faviconSource)) {
			console.log("  ⚠️  Favicon not found at media/favicon.ico");
			return false;
		}

		// Ensure docs directory exists
		if (!existsSync(docsPath)) {
			mkdirSync(docsPath, { recursive: true });
		}

		// Copy favicon to docs directory
		copyFileSync(faviconSource, faviconDest);
		console.log("  ✅ Favicon copied to docs directory");
		return true;
	} catch (error) {
		console.log(
			`  ⚠️  Failed to copy favicon: ${error instanceof Error ? error.message : String(error)}`,
		);
		return false;
	}
}
