/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs\}
 * @see {@link https://ravenjs.dev\}
 * @see {@link https://anonyfox.com\}
 */

/**
 * @file Module entity model for documentation generation.
 */

import { html } from "@raven-js/beak";

export class ModuleEntity {
	/**
	 * @param {string} id - Module identifier
	 * @param {string} path - Module file path
	 */
	constructor(id, path) {
		this.id = id;
		this.path = path;
		this.description = "";
		/** @type {Array<any>} */
		this.imports = [];
		/** @type {Array<any>} */
		this.exports = [];
		/** @type {Array<string>} */
		this.entities = [];
		this.size = 0;
		this.lineCount = 0;
		this.complexity = 0;
		this.lastModified = null;
		this.isValidated = false;
		/** @type {Array<any>} */
		this.validationIssues = [];
	}

	getId() {
		return this.id;
	}

	isValid() {
		return this.isValidated;
	}

	getExternalDependencies() {
		return this.imports
			.filter((imp) => !imp.source?.startsWith("."))
			.map((imp) => imp.source || imp)
			.filter((dep) => typeof dep === "string");
	}

	getInternalDependencies() {
		return this.imports
			.filter((imp) => imp.source?.startsWith("."))
			.map((imp) => imp.source || imp)
			.filter((dep) => typeof dep === "string");
	}

	getImportedModules() {
		return this.imports
			.map((imp) => imp.source || imp)
			.filter((source) => typeof source === "string");
	}

	/**
	 * @param {Object} importDecl - Import declaration
	 */
	addImport(importDecl) {
		// Handle simple string imports
		if (typeof importDecl === "string") {
			this.imports.push({
				type: "named",
				source: importDecl,
				specifiers: [],
			});
		} else {
			this.imports.push(importDecl);
		}
	}

	/**
	 * @param {Object} exportDecl - Export declaration
	 */
	addExport(exportDecl) {
		this.exports.push(exportDecl);
	}

	/**
	 * @param {string} entityId - Entity identifier
	 */
	addEntity(entityId) {
		if (!this.entities.includes(entityId)) {
			this.entities.push(entityId);
		}
	}

	/**
	 * @param {any} metadata - Module metadata
	 */
	setMetadata(metadata) {
		if (metadata.size !== undefined) this.size = metadata.size;
		if (metadata.lineCount !== undefined) this.lineCount = metadata.lineCount;
		if (metadata.complexity !== undefined)
			this.complexity = metadata.complexity;
		if (metadata.lastModified !== undefined)
			this.lastModified = metadata.lastModified;
	}

	validate() {
		this.validationIssues = [];
		if (!this.id?.trim()) {
			this.validationIssues.push({
				type: "missing_id",
				message: "Module must have a valid ID",
			});
		}
		if (!this.path?.trim()) {
			this.validationIssues.push({
				type: "missing_path",
				message: "Module must have a valid path",
			});
		}
		this.isValidated = this.validationIssues.length === 0;
		return this.isValidated;
	}

	getStatistics() {
		return {
			id: this.id,
			path: this.path,
			size: this.size,
			lineCount: this.lineCount,
			complexity: this.complexity,
			importCount: this.imports.length,
			exportCount: this.exports.length,
			entityCount: this.entities.length,
			isValidated: this.isValidated,
			issueCount: this.validationIssues.length,
		};
	}

	toHTML() {
		const stats = /** @type {any} */ (this.getStatistics());
		const externalDeps = this.getExternalDependencies();
		const internalDeps = this.getInternalDependencies();

		return html`
			<div class="module-entity">
				<h2>${this.id}</h2>
				<p><strong>Path:</strong> ${this.path}</p>
				${this.description ? html`<p><strong>Description:</strong> ${this.description}</p>` : ""}
				<p>${stats.lineCount} lines</p>
				<p><strong>Exports:</strong> ${stats.exportCount}</p>
				<p><strong>Imports:</strong> ${stats.importCount}</p>
				${
					this.exports.length > 0
						? html`
							<h3>Exports</h3>
							<ul>
								${this.exports.map((exp) => html`<li><code>${exp.name || exp}</code></li>`).join("")}
							</ul>
						`
						: ""
				}
				${
					externalDeps.length > 0
						? html`
							<h3>External Dependencies</h3>
							<ul>
								${externalDeps.map((dep) => html`<li><code>${dep}</code></li>`).join("")}
							</ul>
						`
						: ""
				}
				${
					internalDeps.length > 0
						? html`
							<h3>Internal Dependencies</h3>
							<ul>
								${internalDeps.map((dep) => html`<li><code>${dep}</code></li>`).join("")}
							</ul>
						`
						: ""
				}
			</div>
		`;
	}

	toMarkdown() {
		const stats = /** @type {any} */ (this.getStatistics());
		const externalDeps = this.getExternalDependencies();
		const internalDeps = this.getInternalDependencies();

		let output = `## ${this.id}\n\n`;
		output += `**Path:** \`${this.path}\`\n\n`;

		if (this.description) {
			output += `**Description:** ${this.description}\n\n`;
		}

		output += `**Lines:** ${stats.lineCount}\n\n`;

		if (this.exports.length > 0) {
			output += `**Exports:**\n`;
			for (const exp of this.exports) {
				output += `- \`${exp.name || exp}\`\n`;
			}
			output += `\n`;
		}

		if (externalDeps.length > 0) {
			output += `**External Dependencies:**\n`;
			for (const dep of externalDeps) {
				output += `- \`${dep}\`\n`;
			}
			output += `\n`;
		}

		if (internalDeps.length > 0) {
			output += `**Internal Dependencies:**\n`;
			for (const dep of internalDeps) {
				output += `- \`${dep}\`\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
