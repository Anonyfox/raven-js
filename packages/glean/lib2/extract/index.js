/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main extraction orchestrator - predatory discovery to documentation transformation
 *
 * Ravens transform raw discovery data into surgical documentation models.
 * Single-pass transformation leveraging existing entity and JSDoc infrastructure.
 * Zero external dependencies, minimal algorithmic complexity.
 */

import { Module as ExtractModule } from "./models/module.js";
import { Package as ExtractPackage } from "./models/package.js";
import { parseModuleEntities } from "./parse-source.js";

/**
 * Transform discovery package into extraction package
 *
 * Converts discovery models (files + identifiers) into documentation models
 * (entities + JSDoc tags) for rendering. Single-pass transformation with
 * minimal data copying and maximum predatory efficiency.
 *
 * **Algorithm:** Discovery modules → Parse source files → Extract entities → Compose documentation
 *
 * @param {import('../discover/models/package.js').Package} discoveryPackage - Discovery package instance
 * @returns {ExtractPackage} Documentation package ready for rendering
 */
export function extract(discoveryPackage) {
	if (!discoveryPackage || typeof discoveryPackage !== "object") {
		throw new Error("extract() requires a valid discovery package");
	}

	// Create documentation package from discovery metadata
	const extractPackage = new ExtractPackage(
		discoveryPackage.name,
		discoveryPackage.version,
		discoveryPackage.description,
		discoveryPackage.readme,
	);

	// Transform each discovery module into documentation module
	for (const discoveryModule of discoveryPackage.modules) {
		const entities = parseModuleEntities(discoveryModule);

		// Determine if this is the default module (main package export)
		const isDefault =
			discoveryModule.importPath === discoveryModule.package.name;

		const extractModule = new ExtractModule(
			discoveryModule.importPath,
			isDefault,
			discoveryModule.readme || discoveryPackage.readme,
			entities,
		);

		extractPackage.addModule(extractModule);
	}

	return extractPackage;
}
