/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Module entity model - surgical module intelligence.
 *
 * Ravens dissect JavaScript modules with predatory precision.
 * Tracks imports, exports, contained entities, and module relationships
 * for comprehensive documentation graph construction.
 */

import { html } from "@raven-js/beak";

/**
 * Module entity implementation
 *
 * **Represents:** Individual JavaScript file/module with complete metadata
 *
 * **Core Functionality:**
 * - Module path and ID management
 * - Import/export statement tracking
 * - Entity containment (functions, classes, variables)
 * - Module dependency relationships
 * - File-level documentation
 *
 * **Serialization:** Clean JSON output for documentation graphs
 */
export class ModuleEntity {
	/**
	 * Create module entity instance
	 * @param {string} id - Module identifier
	 * @param {string} path - Relative path to module file
	 */
	constructor(id, path) {
		// Module identification
		this.id = id;
		this.path = path;

		// Module relationships
		/** @type {Array<{source: string, specifiers: Array<{type: string, imported: string, local: string}>, isDefault: boolean}>} */
		this.imports = [];
		/** @type {string[]} */
		this.exports = [];

		// Contained entities
		/** @type {string[]} */
		this.entityIds = []; // IDs of entities contained in this module

		// Module metadata
		this.fileSize = 0;
		this.lineCount = 0;
		this.lastModified = null;

		// Documentation
		this.description = "";
		this.fileDocComment = "";

		// Validation state
		this.isValidated = false;
		/** @type {Array<{type: string, message: string}>} */
		this.validationIssues = [];
	}

	/**
	 * Get module identifier
	 * @returns {string} Module ID
	 */
	getId() {
		return this.id;
	}

	/**
	 * Add import statement to module
	 * @param {string} source - Import source path
	 * @param {Array<{type: string, imported: string, local: string}>} specifiers - Import specifiers
	 * @param {boolean} isDefault - Whether this is a default import
	 */
	addImport(source, specifiers = [], isDefault = false) {
		// Check if import from this source already exists
		const existingImport = this.imports.find((imp) => imp.source === source);

		if (existingImport) {
			// Merge specifiers
			for (const spec of specifiers) {
				const existing = existingImport.specifiers.find(
					(s) => s.imported === spec.imported && s.local === spec.local,
				);
				if (!existing) {
					existingImport.specifiers.push(spec);
				}
			}
			existingImport.isDefault = existingImport.isDefault || isDefault;
		} else {
			this.imports.push({
				source,
				specifiers,
				isDefault,
			});
		}
	}

	/**
	 * Add export to module
	 * @param {string} exportName - Name of exported entity
	 */
	addExport(exportName) {
		if (!this.exports.includes(exportName)) {
			this.exports.push(exportName);
		}
	}

	/**
	 * Add entity to module
	 * @param {string} entityId - Entity identifier
	 */
	addEntity(entityId) {
		if (!this.entityIds.includes(entityId)) {
			this.entityIds.push(entityId);
		}
	}

	/**
	 * Set module metadata
	 * @param {{fileSize?: number, lineCount?: number, lastModified?: Date}} metadata - Module metadata
	 */
	setMetadata(metadata) {
		if (metadata.fileSize !== undefined) {
			this.fileSize = metadata.fileSize;
		}
		if (metadata.lineCount !== undefined) {
			this.lineCount = metadata.lineCount;
		}
		if (metadata.lastModified !== undefined) {
			this.lastModified = metadata.lastModified;
		}
	}

	/**
	 * Set module documentation
	 * @param {string} description - Module description
	 * @param {string} fileDocComment - File-level JSDoc comment
	 */
	setDocumentation(description = "", fileDocComment = "") {
		this.description = description;
		this.fileDocComment = fileDocComment;
	}

	/**
	 * Get all imported modules
	 * @returns {string[]} Array of imported module sources
	 */
	getImportedModules() {
		return this.imports.map((imp) => imp.source);
	}

	/**
	 * Get external dependencies (non-relative imports)
	 * @returns {string[]} Array of external dependency names
	 */
	getExternalDependencies() {
		return this.imports
			.filter(
				(imp) => !imp.source.startsWith(".") && !imp.source.startsWith("/"),
			)
			.map((imp) => imp.source);
	}

	/**
	 * Get internal module dependencies (relative imports)
	 * @returns {string[]} Array of internal module paths
	 */
	getInternalDependencies() {
		return this.imports
			.filter((imp) => imp.source.startsWith(".") || imp.source.startsWith("/"))
			.map((imp) => imp.source);
	}

	/**
	 * Validate module configuration
	 */
	validate() {
		this.validationIssues = [];

		// Validate required fields
		if (!this.id || this.id.length === 0) {
			this.validationIssues.push({
				type: "missing_id",
				message: "Module ID is missing or empty",
			});
		}

		if (!this.path || this.path.length === 0) {
			this.validationIssues.push({
				type: "missing_path",
				message: "Module path is missing or empty",
			});
		}

		// Validate import/export consistency
		this.validateImportExports();

		this.isValidated = this.validationIssues.length === 0;
	}

	/**
	 * Validate import and export statements
	 */
	validateImportExports() {
		// Check for circular imports (basic detection)
		const selfReferences = this.imports.filter(
			(imp) => imp.source === `./${this.id}` || imp.source === this.path,
		);

		if (selfReferences.length > 0) {
			this.validationIssues.push({
				type: "circular_import",
				message: "Module imports itself (circular dependency)",
			});
		}

		// Validate import specifiers
		for (const imp of this.imports) {
			for (const spec of imp.specifiers) {
				if (!spec.imported || !spec.local) {
					this.validationIssues.push({
						type: "invalid_import_specifier",
						message: `Invalid import specifier in ${imp.source}`,
					});
				}
			}
		}
	}

	/**
	 * Check if module is valid
	 * @returns {boolean} True if module is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Get module statistics
	 * @returns {{entityCount: number, importCount: number, exportCount: number, externalDeps: number}} Module statistics
	 */
	getStatistics() {
		return {
			entityCount: this.entityIds.length,
			importCount: this.imports.length,
			exportCount: this.exports.length,
			externalDeps: this.getExternalDependencies().length,
		};
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Module-specific serializable data
	 */
	getSerializableData() {
		return {
			id: this.id,
			path: this.path,
			imports: this.imports,
			exports: this.exports,
			entityIds: this.entityIds,
			fileSize: this.fileSize,
			lineCount: this.lineCount,
			lastModified: this.lastModified,
			description: this.description,
			fileDocComment: this.fileDocComment,
			statistics: this.getStatistics(),
			validationIssues: this.validationIssues,
		};
	}

	/**
	 * Serialize module to JSON format
	 * @returns {Object} JSON representation
	 */
	toJSON() {
		return {
			__type: "module",
			__data: this.getSerializableData(),
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for module documentation
	 */
	toHTML() {
		const stats = this.getStatistics();
		const extDeps = this.getExternalDependencies();
		const intDeps = this.getInternalDependencies();

		return html`
			<div class="module-entity">
				<h2>${this.id}</h2>
				<div class="module-meta">
					<span class="module-path">${this.path}</span>
					<span class="module-size">${this.lineCount} lines</span>
				</div>
				${this.description ? html`<p class="module-description">${this.description}</p>` : ""}

				<div class="module-stats">
					<div class="stat"><strong>Entities:</strong> ${stats.entityCount}</div>
					<div class="stat"><strong>Imports:</strong> ${stats.importCount}</div>
					<div class="stat"><strong>Exports:</strong> ${stats.exportCount}</div>
					<div class="stat"><strong>Dependencies:</strong> ${stats.externalDeps}</div>
				</div>

				${
					this.exports.length > 0
						? html`
					<div class="module-exports">
						<h3>Exports</h3>
						<ul class="export-list">
							${this.exports.map((exp) => html`<li><code>${exp}</code></li>`).join("\n")}
						</ul>
					</div>
				`
						: ""
				}

				${
					extDeps.length > 0
						? html`
					<div class="external-dependencies">
						<h3>External Dependencies</h3>
						<ul class="dependency-list">
							${extDeps.map((dep) => html`<li><code>${dep}</code></li>`).join("\n")}
						</ul>
					</div>
				`
						: ""
				}

				${
					intDeps.length > 0
						? html`
					<div class="internal-dependencies">
						<h3>Internal Dependencies</h3>
						<ul class="dependency-list">
							${intDeps.map((dep) => html`<li><code>${dep}</code></li>`).join("\n")}
						</ul>
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for module documentation
	 */
	toMarkdown() {
		const stats = this.getStatistics();

		let output = `## ${this.id}\n\n`;
		output += `**Path:** \`${this.path}\`\n`;
		output += `**Lines:** ${this.lineCount}\n\n`;

		if (this.description) {
			output += `${this.description}\n\n`;
		}

		output += `**Statistics:**\n`;
		output += `- Entities: ${stats.entityCount}\n`;
		output += `- Imports: ${stats.importCount}\n`;
		output += `- Exports: ${stats.exportCount}\n`;
		output += `- Dependencies: ${stats.externalDeps}\n\n`;

		if (this.exports.length > 0) {
			output += `**Exports:**\n`;
			for (const exp of this.exports) {
				output += `- \`${exp}\`\n`;
			}
			output += `\n`;
		}

		const extDeps = this.getExternalDependencies();
		if (extDeps.length > 0) {
			output += `**External Dependencies:**\n`;
			for (const dep of extDeps) {
				output += `- \`${dep}\`\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
