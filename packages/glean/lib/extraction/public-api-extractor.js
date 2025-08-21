/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Public API extraction that follows package.json exports
 *
 * Extracts documentation only for publicly exported entities, starting from
 * package.json entry points and following re-exports. Internal implementation
 * details are filtered out to provide a clean API surface.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { extractEntryPoints } from "../discovery/package-metadata.js";
import { ClassEntity } from "../models/class-entity.js";
import { FunctionEntity } from "../models/function-entity.js";
import { ModuleEntity } from "../models/module-entity.js";
import { VariableEntity } from "../models/variable-entity.js";
import { extractCodeEntities } from "./entity-extraction.js";

/**
 * Extract modules and entities for public API documentation
 * @param {string} packagePath - Path to package directory
 * @param {any} packageJson - Parsed package.json content
 * @returns {Promise<{modules: Map<string, any>, entities: Map<string, any>}>} Public API data
 */
export async function extractPublicAPI(packagePath, packageJson) {
	const modules = new Map();
	const entities = new Map();

	// Get entry points from package.json exports
	const entryPoints = extractEntryPoints(packageJson);

	for (const entryPoint of entryPoints) {
		try {
			const result = await extractEntryPointAPI(packagePath, entryPoint);

			// Add module
			modules.set(result.module.getId(), result.module);

			// Add entities
			for (const [entityId, entity] of result.entities.entries()) {
				entities.set(entityId, entity);
			}
		} catch (error) {
			console.warn(
				`Warning: Could not extract from entry point ${entryPoint}:`,
				error.message,
			);
		}
	}

	return { modules, entities };
}

/**
 * Extract API from a single entry point
 * @param {string} packagePath - Package directory path
 * @param {string} entryPoint - Entry point file path (relative to package)
 * @returns {Promise<{module: any, entities: Map<string, any>}>} Module and entities
 */
async function extractEntryPointAPI(packagePath, entryPoint) {
	const entryFilePath = resolve(packagePath, entryPoint);
	const content = await readFile(entryFilePath, "utf-8");

	// Create module ID from entry point path
	const moduleId = createModuleId(entryPoint);

	// Extract exports from the entry point file
	const exports = await extractExportsFromFile(entryFilePath, content);

	// Extract only exported entities
	const entities = new Map();
	for (const exportInfo of exports) {
		const entity = await createEntityFromExport(
			exportInfo,
			moduleId,
			packagePath,
		);
		if (entity) {
			entities.set(entity.getId(), entity);
		}
	}

	// Create module
	const module = createModuleFromEntryPoint(
		moduleId,
		entryPoint,
		entities,
		content,
	);

	return { module, entities };
}

/**
 * Create module ID from entry point path
 * @param {string} entryPoint - Entry point file path
 * @returns {string} Module ID
 */
function createModuleId(entryPoint) {
	// Convert ./core/index.js -> core-index
	// Convert ./seo/index.js -> seo-index
	// Convert ./index.js -> index

	let id = entryPoint.replace(/^\.\//, "").replace(/\.js$/, "");
	id = id.replace(/\//g, "-");

	return id;
}

/**
 * Extract import statements from file content
 * @param {string} content - File content
 * @returns {Array<Object>} Import declarations
 */
function extractImportsFromContent(content) {
	const imports = [];
	const lines = content.split("\n");

	for (const line of lines) {
		const trimmed = line.trim();

		// Match various import patterns
		const importMatch = trimmed.match(
			/^import\s+(.+?)\s+from\s+["'](.+?)["'];?$/,
		);
		if (importMatch) {
			const importClause = importMatch[1].trim();
			const source = importMatch[2];

			const specifiers = [];

			// Handle named imports: { name1, name2 }
			const namedMatch = importClause.match(/\{\s*(.+?)\s*\}/);
			if (namedMatch) {
				const names = namedMatch[1].split(",").map((n) => n.trim());
				for (const name of names) {
					specifiers.push({
						type: "named",
						local: name,
						imported: name,
					});
				}
			}
			// Handle default imports: defaultName
			else if (!importClause.includes("*")) {
				specifiers.push({
					type: "default",
					local: importClause,
				});
			}
			// Handle namespace imports: * as name
			else {
				const namespaceMatch = importClause.match(/\*\s+as\s+(\w+)/);
				if (namespaceMatch) {
					specifiers.push({
						type: "namespace",
						local: namespaceMatch[1],
					});
				}
			}

			// Determine the import type based on specifiers
			let importType = "named";
			if (specifiers.length === 1) {
				if (specifiers[0].type === "default") {
					importType = "default";
				} else if (specifiers[0].type === "namespace") {
					importType = "namespace";
				}
			}

			imports.push({
				source,
				specifiers,
				type: importType,
			});
		}
	}

	return imports;
}

/**
 * Parse JSDoc comments for an entity from file content
 * @param {any} entity - Entity instance
 * @param {any} rawEntity - Raw entity data with line number
 * @param {string} content - File content
 */
async function parseEntityJSDocFromFile(entity, rawEntity, content) {
	try {
		const lines = content.split("\n");
		const entityLine = rawEntity.line || 1;

		// Look backwards from entity line to find JSDoc comment
		const jsdocLines = [];
		for (let i = entityLine - 1; i >= 0; i--) {
			const line = lines[i];
			if (line.trim().endsWith("*/")) {
				jsdocLines.unshift(line);

				// Find the start of the JSDoc comment
				for (let j = i - 1; j >= 0; j--) {
					const prevLine = lines[j];
					jsdocLines.unshift(prevLine);
					if (prevLine.trim().startsWith("/**")) {
						break;
					}
				}
				break;
			}
		}

		if (jsdocLines.length > 0 && jsdocLines[0].includes("/**")) {
			// Parse the JSDoc comment
			const { parseJSDocComment } = await import("./jsdoc-parsing.js");
			const { parseJSDocToStructured } = await import("./jsdoc-processing.js");

			const jsdocObject = parseJSDocComment(
				jsdocLines,
				entityLine - jsdocLines.length,
			);
			if (!jsdocObject) return;

			// Convert to structured format
			const jsdocData = parseJSDocToStructured(jsdocObject);

			// Add description as a JSDoc tag if it exists
			if (jsdocData?.description) {
				const descriptionTag = await createJSDocTagInstance({
					tagType: "description",
					description: jsdocData.description,
					content: jsdocData.description,
				});
				if (descriptionTag) {
					entity.addJSDocTag(descriptionTag);
				}
			}

			// Add JSDoc tags to entity if they exist
			if (jsdocData?.tags) {
				for (const [tagName, tagValues] of Object.entries(jsdocData.tags)) {
					const valuesToProcess = Array.isArray(tagValues)
						? tagValues
						: [tagValues];

					for (const tagValue of valuesToProcess) {
						let tagData;
						if (typeof tagValue === "string") {
							tagData = { tagType: tagName, description: tagValue };
						} else if (typeof tagValue === "object" && tagValue !== null) {
							tagData = { tagType: tagName, ...tagValue };
						} else {
							continue;
						}

						const tagInstance = await createJSDocTagInstance(tagData);
						if (tagInstance) {
							entity.addJSDocTag(tagInstance);
						}
					}
				}
			}
		}
	} catch (error) {
		console.warn(
			`Warning: Could not parse JSDoc for entity ${entity.name}:`,
			error.message,
		);
	}
}

/**
 * Create JSDoc tag instance from tag data
 * @param {any} tagData - Tag data from JSDoc parsing
 * @returns {Promise<any|null>} JSDoc tag instance or null
 */
async function createJSDocTagInstance(tagData) {
	try {
		console.log("DEBUG: createJSDocTagInstance called with tagData:", tagData);

		if (!tagData.tagType) {
			console.log("ERROR: Missing tagType in tagData:", tagData);
			throw new Error("Invalid JSDoc tag: missing tagType");
		}

		// Create simple tag objects for all tag types to avoid constructor issues
		const tag = /** @type {any} */ ({
			tagType: tagData.tagType,
			description: tagData.description || tagData.content || "",
			content: tagData.content || tagData.description || "",
			type: tagData.type || "",
			name: tagData.name || "",
			value: tagData.value || "",
		});

		// Add required methods for rendering
		tag.toHTML = function () {
			return `<span class="jsdoc-tag">@${this.tagType} ${this.description}</span>`;
		};

		tag.toMarkdown = function () {
			return `@${this.tagType} ${this.description}`;
		};

		tag.toJSON = function () {
			return {
				__type: this.tagType,
				__data: {
					description: this.description,
					content: this.content,
					type: this.type,
					name: this.name,
					value: this.value,
				},
			};
		};

		return tag;
	} catch (error) {
		console.warn("Error creating JSDoc tag instance:", error.message);
		return null;
	}
}

/**
 * Extract export statements from a file
 * @param {string} filePath - Absolute path to file
 * @param {string} content - File content
 * @returns {Promise<Array<{type: string, name: string, source?: string, localName?: string}>>} Export info
 */
async function extractExportsFromFile(filePath, content) {
	const exports = [];

	// Match export statements
	const exportPatterns = [
		// export function name() {}
		/export\s+(?:async\s+)?function\s+(\w+)/g,
		// export const name =
		/export\s+const\s+(\w+)\s*=/g,
		// export let name =
		/export\s+let\s+(\w+)\s*=/g,
		// export var name =
		/export\s+var\s+(\w+)\s*=/g,
		// export class Name
		/export\s+class\s+(\w+)/g,
		// export { name } from "./module"
		/export\s*\{\s*([^}]+)\s*\}\s*from\s*["']([^"']+)["']/g,
		// export { name }
		/export\s*\{\s*([^}]+)\s*\}/g,
	];

	// Process direct exports (function, const, etc.)
	for (let i = 0; i < 5; i++) {
		let match = exportPatterns[i].exec(content);
		while (match !== null) {
			exports.push({
				type: "direct",
				name: match[1].trim(),
				filePath,
			});
			match = exportPatterns[i].exec(content);
		}
	}

	// Process re-exports
	let reExportMatch = exportPatterns[5].exec(content);
	while (reExportMatch !== null) {
		const names = reExportMatch[1].split(",").map((n) => {
			const parts = n.trim().split(" as ");
			return {
				local: parts[0].trim(),
				exported: parts[1] ? parts[1].trim() : parts[0].trim(),
			};
		});
		const source = reExportMatch[2];

		for (const nameInfo of names) {
			exports.push({
				type: "reexport",
				name: nameInfo.exported,
				localName: nameInfo.local,
				source,
				filePath,
			});
		}
		reExportMatch = exportPatterns[5].exec(content);
	}

	// Process local re-exports (export { name })
	let localExportMatch = exportPatterns[6].exec(content);
	while (localExportMatch !== null) {
		const names = localExportMatch[1].split(",").map((n) => {
			const parts = n.trim().split(" as ");
			return {
				local: parts[0].trim(),
				exported: parts[1] ? parts[1].trim() : parts[0].trim(),
			};
		});

		for (const nameInfo of names) {
			exports.push({
				type: "local",
				name: nameInfo.exported,
				localName: nameInfo.local,
				filePath,
			});
		}
		localExportMatch = exportPatterns[6].exec(content);
	}

	return exports;
}

/**
 * Create entity from export information
 * @param {any} exportInfo - Export information
 * @param {string} moduleId - Module ID
 * @param {string} _packagePath - Package path (unused)
 * @returns {Promise<any|null>} Entity or null
 */
async function createEntityFromExport(exportInfo, moduleId, _packagePath) {
	try {
		if (exportInfo.type === "direct" || exportInfo.type === "local") {
			// For direct exports, extract from the current file
			const content = await readFile(exportInfo.filePath, "utf-8");
			const entities = extractCodeEntities(content);
			const rawEntity = entities.find(
				(e) => e.name === exportInfo.name || e.name === exportInfo.localName,
			);

			if (rawEntity) {
				// Convert to proper entity instance
				const entity = await createEntityInstance(
					rawEntity,
					moduleId,
					exportInfo.filePath,
				);
				return entity;
			}
		} else if (exportInfo.type === "reexport") {
			// For re-exports, extract from the source file
			const sourceFilePath = resolveImportPath(
				exportInfo.source,
				dirname(exportInfo.filePath),
			);
			const sourceContent = await readFile(sourceFilePath, "utf-8");
			const entities = extractCodeEntities(sourceContent);
			const rawEntity = entities.find((e) => e.name === exportInfo.localName);

			if (rawEntity) {
				// Convert to proper entity instance with exported name
				const entity = await createEntityInstance(
					rawEntity,
					moduleId,
					sourceFilePath,
				);
				entity.name = exportInfo.name; // Use the exported name
				return entity;
			}
		}
	} catch (error) {
		console.warn(
			`Warning: Could not extract entity ${exportInfo.name}:`,
			error.message,
		);
	}

	return null;
}

/**
 * Create proper entity instance from raw entity data
 * @param {any} rawEntity - Raw entity from extractCodeEntities
 * @param {string} moduleId - Module ID
 * @param {string} filePath - Source file path
 * @returns {Promise<any>} Proper entity instance
 */
async function createEntityInstance(rawEntity, moduleId, filePath) {
	// Entity ID would be `${moduleId}-${rawEntity.name}` but we use getId() method instead

	// Create location object as expected by entity constructors
	const location = {
		file: filePath,
		line: rawEntity.line || 1,
		column: rawEntity.column || 1,
	};

	let entity;
	switch (rawEntity.type) {
		case "function":
			entity = new FunctionEntity(rawEntity.name, location);
			break;
		case "variable":
		case "const":
		case "let":
			entity = new VariableEntity(rawEntity.name, location);
			break;
		case "class":
			entity = new ClassEntity(rawEntity.name, location);
			break;
		default:
			// Fallback to function entity for unknown types
			entity = new FunctionEntity(rawEntity.name, location);
			break;
	}

	// Set the module ID after creation
	entity.moduleId = moduleId;

	// Add JSDoc parsing
	try {
		const content = await readFile(filePath, "utf-8");
		await parseEntityJSDocFromFile(entity, rawEntity, content);
	} catch (error) {
		console.warn(
			`Warning: Could not parse JSDoc for entity ${entity.name}:`,
			error.message,
		);
	}

	return entity;
}

/**
 * Resolve import path to absolute file path
 * @param {string} importPath - Import path like "./css/index.js"
 * @param {string} fromDir - Directory of importing file
 * @returns {string} Absolute file path
 */
function resolveImportPath(importPath, fromDir) {
	if (importPath.startsWith(".")) {
		return resolve(fromDir, importPath);
	}
	// For absolute imports, would need node_modules resolution
	// For now, just handle relative imports
	return resolve(fromDir, importPath);
}

/**
 * Create module from entry point
 * @param {string} moduleId - Module ID
 * @param {string} entryPoint - Entry point path
 * @param {Map<string, any>} entities - Module entities
 * @param {string} content - File content
 * @returns {ModuleEntity} Module entity
 */
function createModuleFromEntryPoint(moduleId, entryPoint, entities, content) {
	// Create ModuleEntity instance
	// Normalize path by removing ./ prefix
	const normalizedPath = entryPoint.replace(/^\.\//, "");
	const module = new ModuleEntity(moduleId, normalizedPath);

	// Extract module-level JSDoc if present
	const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
	module.description = jsdocMatch
		? jsdocMatch[1].replace(/^\s*\*\s?/gm, "").trim()
		: `Module documentation for ${entryPoint}`;

	// Set entity IDs
	module.entities = Array.from(entities.keys());

	// Add exports to module based on entities
	for (const [_entityId, entity] of entities.entries()) {
		module.addExport(entity.name);
	}

	// Extract imports from file content
	const imports = extractImportsFromContent(content);
	for (const importDecl of imports) {
		module.addImport(importDecl);
	}

	return module;
}
