/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package container for complete documentation model organization.
 *
 * Pure documentation model optimized for multiple renderer targets:
 * HTML docs, JSON APIs, SSG with SEO optimization.
 */

/**
 * Package container for documentation model organization and module coordination.
 *
 * Designed from renderer requirements - HTML docs, JSON APIs, SSG. Computed properties
 * for common renderer patterns with minimal core data structure.
 *
 * @example
 * // Basic package creation
 * const pkg = new Package('my-package', '1.0.0', 'Description', readme);
 * pkg.addModule(module);
 * console.log(pkg.stats.totalModules);
 *
 * @example
 * // Package entity access and filtering
 * console.log(pkg.getAllEntities());
 * console.log(pkg.getEntitiesByType('function'));
 */
export class Package {
	/**
	 * Create documentation package instance
	 * @param {string} name - Package name from package.json
	 * @param {string} version - Package version
	 * @param {string} description - Package description
	 * @param {string} readme - Package README.md content
	 * @param {Object} [packageJsonData] - Complete package.json data for attribution
	 */
	constructor(name, version, description, readme, packageJsonData) {
		/** @type {string} Package name from package.json */
		this.name = name || "";
		/** @type {string} Package version */
		this.version = version || "";
		/** @type {string} Package description */
		this.description = description || "";
		/** @type {string} Package README.md content */
		this.readme = readme || "";
		/** @type {Object|null} Complete package.json data for attribution */
		this.packageJsonData = packageJsonData || null;
		/** @type {Array<import('./module.js').Module>} Collection of documentation modules */
		this.modules = [];
	}

	/**
	 * Add module to package
	 * @param {import('./module.js').Module} module - Module to add
	 */
	addModule(module) {
		if (module && typeof module === "object") {
			this.modules.push(module);
		}
	}

	/**
	 * Get default module (the "." export)
	 * @returns {import('./module.js').Module|null} Default module or null if not found
	 */
	get defaultModule() {
		return this.modules.find((module) => module.isDefault) || null;
	}

	/**
	 * Get all entities across all modules
	 * @returns {Array<import('./entities/base.js').EntityBase>} Flat array of all entities
	 */
	get allEntities() {
		return this.modules.flatMap((module) => module.entities);
	}

	/**
	 * Get modules by import path prefix
	 * @param {string} prefix - Import path prefix to match
	 * @returns {Array<import('./module.js').Module>} Modules matching prefix
	 */
	getModulesByPrefix(prefix) {
		return this.modules.filter((module) =>
			module.importPath.startsWith(prefix),
		);
	}

	/**
	 * Find module by exact import path
	 * @param {string} importPath - Exact import path to find
	 * @returns {import('./module.js').Module|null} Module or null if not found
	 */
	findModuleByImportPath(importPath) {
		return (
			this.modules.find((module) => module.importPath === importPath) || null
		);
	}

	/**
	 * Get entity count across all modules
	 * @returns {number} Total entity count
	 */
	get entityCount() {
		return this.allEntities.length;
	}

	/**
	 * Get module count
	 * @returns {number} Total module count
	 */
	get moduleCount() {
		return this.modules.length;
	}

	/**
	 * Serialize package to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			name: this.name,
			version: this.version,
			description: this.description,
			readme: this.readme,
			modules: this.modules.map((module) =>
				module.toObject ? module.toObject() : module,
			),
			entityCount: this.entityCount,
			moduleCount: this.moduleCount,
		};
	}
}
