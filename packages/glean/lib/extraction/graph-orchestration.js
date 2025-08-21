/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Graph orchestration for complete documentation extraction.
 *
 * Surgical coordination of the entire documentation extraction pipeline,
 * assembling all modules into comprehensive documentation graphs with
 * predatory precision and zero-waste efficiency.
 */

import { DocumentationGraph } from "../models/documentation-graph.js";
import { PackageEntity } from "../models/package-entity.js";
import { discoverDocumentationAssets } from "./asset-collection.js";
import { extractReadmeData } from "./content-integration.js";

import { extractPublicAPI } from "./public-api-extractor.js";
import { buildEntityReferences as resolveEntityReferences } from "./reference-resolution.js";

/**
 * Apply Index File Rule: Create modules for directories containing index.js files
 * @param {string} packagePath - Path to package directory
 * @param {{files: string[], readmes: string[], packageJson: any, entryPoints: string[]}} discovery - Discovery results
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph to add modules to
 */
async function applyIndexFileRule(packagePath, discovery, graph) {
	const { relative } = await import("node:path");
	const { readFile } = await import("node:fs/promises");
	const { ModuleEntity } = await import("../models/module-entity.js");
	const { extractCodeEntities } = await import("./entity-extraction.js");

	// Find all index.js files
	const indexFiles = discovery.files.filter((filePath) => {
		const relativePath = relative(packagePath, filePath);
		return relativePath.endsWith("/index.js") || relativePath === "index.js";
	});

	for (const indexFilePath of indexFiles) {
		const relativePath = relative(packagePath, indexFilePath);

		// Create module ID using dash format (consistent with public-api-extractor.js)
		const moduleId = relativePath.replace(/\.js$/, "").replace(/\//g, "-");

		// Skip if module already exists (from package.json exports)
		if (graph.modules.has(moduleId)) {
			continue;
		}

		try {
			const content = await readFile(indexFilePath, "utf-8");
			const entities = extractCodeEntities(content);

			// Create module for this index file
			const module = new ModuleEntity(moduleId, relativePath);

			// Extract exports from the content
			module.exports = entities.map((entity) => entity.name);

			graph.addModule(module);

			// Create entities from the extracted data
			for (const rawEntity of entities) {
				const entity = await createEntityInstanceFromRaw(
					rawEntity,
					moduleId,
					indexFilePath,
				);
				if (entity) {
					// Parse JSDoc for the entity from file content
					await parseEntityJSDocFromContent(entity, rawEntity, content);
					graph.addEntity(entity);
				}
			}
		} catch (error) {
			console.warn(
				`Warning: Could not process index file ${indexFilePath}:`,
				error.message,
			);
		}
	}
}

/**
 * Extract complete documentation graph from package
 * @param {string} packagePath - Path to package directory
 * @param {{files: string[], readmes: string[], packageJson: any, entryPoints: string[]}} discovery - Discovery results
 * @returns {Promise<import('../models/documentation-graph.js').DocumentationGraph>} Complete documentation graph
 */
export async function extractDocumentationGraph(packagePath, discovery) {
	const packageEntity = new PackageEntity(discovery.packageJson);
	packageEntity.validate();

	// Create documentation graph with package entity
	const graph = new DocumentationGraph(packageEntity);

	// Extract public API from package.json entry points only
	const publicAPI = await extractPublicAPI(packagePath, discovery.packageJson);

	// Add public modules and entities to graph
	for (const [_moduleId, module] of publicAPI.modules.entries()) {
		graph.addModule(module);
	}

	for (const [_entityId, entity] of publicAPI.entities.entries()) {
		graph.addEntity(entity);
	}

	// Apply Index File Rule: Create modules for directories with index.js files
	await applyIndexFileRule(packagePath, discovery, graph);

	// If no entities were extracted from package.json entry points,
	// fall back to extracting from all discovered files
	if (publicAPI.entities.size === 0 && discovery.files.length > 0) {
		const { extractCodeEntities } = await import("./entity-extraction.js");
		const { readFile } = await import("node:fs/promises");
		const { ModuleEntity } = await import("../models/module-entity.js");
		const { relative } = await import("node:path");

		for (const filePath of discovery.files) {
			try {
				const content = await readFile(filePath, "utf-8");
				const entities = extractCodeEntities(content);

				// Create module for this file
				const relativePath = relative(packagePath, filePath);
				// Create module ID for fallback logic (using slashes for consistency with test expectations)
				const moduleId = relativePath.replace(/\.js$/, "");
				const module = new ModuleEntity(moduleId, relativePath);
				graph.addModule(module);

				// Create entities from the extracted data
				for (const rawEntity of entities) {
					const entity = await createEntityInstanceFromRaw(
						rawEntity,
						moduleId,
						filePath,
					);
					if (entity) {
						// Parse JSDoc for the entity from file content
						await parseEntityJSDocFromContent(entity, rawEntity, content);
						graph.addEntity(entity);
					}
				}
			} catch (error) {
				console.warn(
					`Warning: Could not extract from file ${filePath}:`,
					error.message,
				);
			}
		}
	}

	// Process README files in parallel for predatory efficiency
	const readmePromises = discovery.readmes.map((readmePath) =>
		extractReadmeData(readmePath, packagePath),
	);

	const readmeResults = await Promise.all(readmePromises);

	// Add all content to graph - batch operations
	for (const readmeData of readmeResults) {
		graph.addContent(readmeData);
	}

	// Build cross-references between entities (Phase 3: Reference Resolution)
	// TODO: Enable when reference resolution is implemented
	// resolveEntityReferences(graph);

	// Resolve all string references to direct object references (raven optimization)
	graph.resolveEntityReferences();

	// Discover and validate assets (Phase 4: Asset Collection)
	const discoveredAssets = await discoverDocumentationAssets(
		graph,
		packagePath,
	);
	for (const asset of discoveredAssets) {
		graph.addAsset(asset);
	}

	// Validate the complete graph
	graph.validate();

	return graph;
}

/**
 * Build cross-references between entities (legacy export - implementation moved to reference-resolution.js)
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @deprecated Use buildEntityReferences from reference-resolution.js instead
 */
export function buildEntityReferences(graph) {
	// Delegate to the new implementation
	resolveEntityReferences(graph);
}

/**
 * Create entity instance from raw entity data (helper for fallback extraction)
 * @param {any} rawEntity - Raw entity from extractCodeEntities
 * @param {string} moduleId - Module ID
 * @param {string} filePath - Source file path
 * @returns {Promise<any|null>} Entity instance or null
 */
async function createEntityInstanceFromRaw(rawEntity, moduleId, filePath) {
	const { FunctionEntity } = await import("../models/function-entity.js");
	const { VariableEntity } = await import("../models/variable-entity.js");
	const { ClassEntity } = await import("../models/class-entity.js");

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

	// Copy export-related properties from raw entity
	if (rawEntity.exported !== undefined && rawEntity.exported) {
		// Entities use an exports array, not an exported boolean
		entity.exports = ["named"]; // Default to named export
	}
	if (rawEntity.isDefault !== undefined && rawEntity.isDefault) {
		// Add default export to the exports array
		if (!entity.exports.includes("default")) {
			entity.exports.push("default");
		}
	}

	return entity;
}

/**
 * Parse and attach JSDoc to an entity from file content (helper for fallback extraction)
 * @param {any} entity - Entity instance
 * @param {any} rawEntity - Raw entity data
 * @param {string} content - File content
 */
async function parseEntityJSDocFromContent(entity, rawEntity, content) {
	try {
		// Find JSDoc comment before the entity definition
		const lines = content.split("\n");
		const entityLine = rawEntity.line - 1; // Convert to 0-based

		// Look backwards from the entity line to find JSDoc comment
		const jsdocLines = [];
		let foundJSDoc = false;

		for (let i = entityLine - 1; i >= 0; i--) {
			const line = lines[i].trim();

			if (line === "*/") {
				// End of JSDoc comment (searching backwards)
				foundJSDoc = true;
				jsdocLines.unshift(line);
			} else if (line.startsWith("*") || line.startsWith("/**")) {
				// JSDoc comment line
				jsdocLines.unshift(line);
				if (line.startsWith("/**")) {
					// Start of JSDoc comment
					break;
				}
			} else if (foundJSDoc && line !== "") {
				// Non-empty line after JSDoc - stop
				break;
			} else if (!foundJSDoc && line !== "") {
				// Non-empty line before JSDoc - no JSDoc for this entity
				break;
			}
		}

		if (jsdocLines.length > 0 && jsdocLines[0].startsWith("/**")) {
			// Parse the JSDoc comment
			const jsdocComment = jsdocLines.join("\n");

			const { parseJSDocComment } = await import("./jsdoc-parsing.js");
			const { parseJSDocToStructured } = await import("./jsdoc-processing.js");

			// First parse the raw JSDoc string into an object
			const jsdocCommentLines = jsdocComment.split("\n");
			const jsdocObject = parseJSDocComment(
				jsdocCommentLines,
				rawEntity.line - jsdocCommentLines.length,
			);
			if (!jsdocObject) {
				return;
			}

			// Then convert to structured format
			const jsdocData = parseJSDocToStructured(jsdocObject);

			// Add description as a JSDoc tag if it exists
			if (jsdocData?.description) {
				const descriptionTag = await createJSDocTagInstance({
					tag: "description",
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
					// Handle different tag formats
					const valuesToProcess = Array.isArray(tagValues)
						? tagValues
						: [tagValues];

					for (const tagValue of valuesToProcess) {
						// Create appropriate JSDoc tag instance
						let tagData;
						if (typeof tagValue === "string") {
							// Simple string tag (like @example, @since, @deprecated)
							tagData = { tag: tagName, description: tagValue };
						} else if (typeof tagValue === "object" && tagValue !== null) {
							// Structured tag (like @param, @returns)
							tagData = { tag: tagName, ...tagValue };
						} else {
							continue; // Skip invalid tag values
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
		// Import the appropriate JSDoc tag class based on tag type
		const tagType = tagData.tag;

		// Create simple tag objects for all tag types to avoid constructor issues
		return {
			tagType,
			description: tagData.description || "",
			type: tagData.type || "",
			name: tagData.name || "",
			value: tagData.value || tagData.description || tagData.type || "",
		};
	} catch (error) {
		console.warn(
			`Error creating JSDoc tag instance for ${tagData.tag}:`,
			error.message,
		);
		return null;
	}
}

/**
 * @typedef {import('./entity-construction.js').EntityNode} EntityNode
 */

/**
 * @typedef {Object} AssetData
 * @property {string} path - Asset file path
 * @property {string} content - Base64 encoded content
 * @property {string} type - MIME type
 */
