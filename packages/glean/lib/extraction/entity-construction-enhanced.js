/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Enhanced entity construction with intelligent entity classes.
 *
 * Revolutionary upgrade from plain objects to surgical entity intelligence.
 * Creates specialized entity class instances with validation, consistency
 * checking, and multi-format output capabilities.
 */

import { relative } from "node:path";
import { ClassEntity } from "../models/class-entity.js";
// Import all entity classes
import { FunctionEntity } from "../models/function-entity.js";
import { JSDocAuthorTag } from "../models/jsdoc-author-tag.js";
import { JSDocDeprecatedTag } from "../models/jsdoc-deprecated-tag.js";
import { JSDocExampleTag } from "../models/jsdoc-example-tag.js";
import { JSDocFileTag } from "../models/jsdoc-file-tag.js";
import { JSDocLicenseTag } from "../models/jsdoc-license-tag.js";
// Import JSDoc tag classes for processing
import { JSDocParamTag } from "../models/jsdoc-param-tag.js";
import { JSDocReturnsTag } from "../models/jsdoc-returns-tag.js";
import { JSDocSeeTag } from "../models/jsdoc-see-tag.js";
import { JSDocSinceTag } from "../models/jsdoc-since-tag.js";
import { MethodEntity } from "../models/method-entity.js";
import { PropertyEntity } from "../models/property-entity.js";
import { TypedefEntity } from "../models/typedef-entity.js";
import { VariableEntity } from "../models/variable-entity.js";
import { findPrecedingJSDoc } from "../validation/index.js";
import { determineExportType } from "./module-relationships.js";
import { extractSourceSnippet } from "./source-analysis.js";

/**
 * Build a specialized entity instance from code entity
 * @param {any} codeEntity - Basic code entity from validation
 * @param {string} content - Full file content
 * @param {string[]} lines - File lines array
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @param {string} moduleId - Module identifier
 * @returns {Promise<import('../models/entity-base.js').EntityBase>} Specialized entity instance
 */
export async function buildEnhancedEntity(
	codeEntity,
	content,
	lines,
	filePath,
	packagePath,
	moduleId,
) {
	const relativePath = relative(packagePath, filePath);
	const location = {
		file: relativePath,
		line: codeEntity.line,
		column: 0, // TODO: Extract column info in future enhancement
	};

	// Create the appropriate entity class instance
	let entity;
	switch (codeEntity.type) {
		case "function":
			entity = new FunctionEntity(codeEntity.name, location);
			break;
		case "variable":
			entity = new VariableEntity(codeEntity.name, location);
			break;
		case "class":
			entity = new ClassEntity(codeEntity.name, location);
			break;
		default:
			throw new Error(`Unknown entity type: ${codeEntity.type}`);
	}

	// Set module context
	const exportType = determineExportType(codeEntity, content);
	entity.setModuleContext(moduleId, exportType);

	// Parse the entity from source content
	entity.parseEntity(codeEntity, content);

	// Extract and attach JSDoc documentation
	const jsDocComment = findPrecedingJSDoc(lines, codeEntity.line - 1);
	if (jsDocComment) {
		await attachJSDocToEntity(entity, jsDocComment);
	}

	// Set source snippet
	const sourceSnippet = extractSourceSnippet(
		lines,
		codeEntity.line,
		codeEntity.type,
	);
	entity.source = sourceSnippet;

	// Validate the complete entity
	entity.validate();

	return entity;
}

/**
 * Build specialized method entities from class method data
 * @param {any[]} classMethods - Method data from ClassEntity
 * @param {string} className - Parent class name
 * @param {string} content - Full file content
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @param {string} moduleId - Module identifier
 * @returns {Promise<MethodEntity[]>} Array of method entities
 */
export async function buildMethodEntities(
	classMethods,
	className,
	content,
	filePath,
	packagePath,
	moduleId,
) {
	const relativePath = relative(packagePath, filePath);
	const lines = content.split("\n");
	const methods = [];

	for (const methodData of classMethods) {
		const location = {
			file: relativePath,
			line: methodData.line,
			column: 0,
		};

		const method = new MethodEntity(methodData.name, location);
		method.setModuleContext(moduleId, []); // Methods are not directly exported
		method.setParentClass(className);
		method.parseEntity(methodData, content);

		// Look for JSDoc before the method
		const jsDocComment = findPrecedingJSDoc(lines, methodData.line - 1);
		if (jsDocComment) {
			await attachJSDocToEntity(method, jsDocComment);
		}

		method.validate();
		methods.push(method);
	}

	return methods;
}

/**
 * Build specialized property entities from class property data
 * @param {any[]} classProperties - Property data from ClassEntity
 * @param {string} className - Parent class name
 * @param {string} content - Full file content
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @param {string} moduleId - Module identifier
 * @returns {Promise<PropertyEntity[]>} Array of property entities
 */
export async function buildPropertyEntities(
	classProperties,
	className,
	content,
	filePath,
	packagePath,
	moduleId,
) {
	const relativePath = relative(packagePath, filePath);
	const lines = content.split("\n");
	const properties = [];

	for (const propertyData of classProperties) {
		const location = {
			file: relativePath,
			line: propertyData.line,
			column: 0,
		};

		const property = new PropertyEntity(propertyData.name, location);
		property.setModuleContext(moduleId, []); // Properties are not directly exported
		property.setParentClass(className);
		property.parseEntity(propertyData, content);

		// Look for JSDoc before the property
		const jsDocComment = findPrecedingJSDoc(lines, propertyData.line - 1);
		if (jsDocComment) {
			await attachJSDocToEntity(property, jsDocComment);
		}

		property.validate();
		properties.push(property);
	}

	return properties;
}

/**
 * Process JSDoc typedef tags to create TypedefEntity instances
 * @param {any} jsDocComment - JSDoc comment containing typedef
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @param {string} moduleId - Module identifier
 * @returns {Promise<TypedefEntity[]>} Array of typedef entities
 */
export async function buildTypedefEntities(
	jsDocComment,
	filePath,
	packagePath,
	moduleId,
) {
	const relativePath = relative(packagePath, filePath);
	const typedefs = [];

	// Look for typedef tags
	const typedefTags = jsDocComment.tags?.typedef || [];

	for (const typedefTag of typedefTags) {
		// Parse typedef tag to extract name and type
		const typedefMatch = typedefTag.match(
			/^\{([^}]+)\}\s*(\w+)(?:\s+-\s*(.*))?/,
		);
		if (!typedefMatch) continue;

		const [, type, name, description = ""] = typedefMatch;
		const location = {
			file: relativePath,
			line: jsDocComment.line || 1,
			column: 0,
		};

		const typedef = new TypedefEntity(name, location);
		typedef.setModuleContext(moduleId, []); // Typedefs are documentation constructs

		// Create mock typedef tag object
		const mockTypedefTag = {
			tagType: "typedef",
			type,
			name,
			description,
			toJSON: () => ({
				__type: "typedef",
				__data: { type, name, description },
			}),
			toHTML: () => `<span>typedef {${type}} ${name}</span>`,
			toMarkdown: () => `typedef {${type}} ${name}`,
		};

		// Collect related tags (property, param, returns)
		const relatedTags = [];
		if (jsDocComment.tags?.property) {
			for (const propTag of jsDocComment.tags.property) {
				relatedTags.push(await createJSDocTag("property", propTag));
			}
		}
		if (jsDocComment.tags?.param) {
			for (const paramTag of jsDocComment.tags.param) {
				relatedTags.push(await createJSDocTag("param", paramTag));
			}
		}
		if (jsDocComment.tags?.returns || jsDocComment.tags?.return) {
			const returnTags = jsDocComment.tags.returns || jsDocComment.tags.return;
			for (const returnTag of returnTags) {
				relatedTags.push(await createJSDocTag("returns", returnTag));
			}
		}

		typedef.parseFromJSDoc(mockTypedefTag, relatedTags);
		typedef.validate();
		typedefs.push(typedef);
	}

	return typedefs;
}

/**
 * Simple description tag implementation
 */
class DescriptionTag {
	/**
	 * @param {string} content - Description content
	 */
	constructor(content) {
		this.tagType = "description";
		this.rawContent = content;
		this.content = content;
		this.isValidated = true;
	}

	/**
	 * @protected
	 */
	parseContent() {
		// No parsing needed for simple description
	}

	/**
	 * @protected
	 */
	validate() {
		this.isValidated = this.content && this.content.length > 0;
	}

	isValid() {
		return this.isValidated;
	}

	/**
	 * @protected
	 */
	getSerializableData() {
		return { content: this.content };
	}

	toJSON() {
		return {
			__type: "description",
			__data: { content: this.content },
		};
	}

	toHTML() {
		return `<p>${this.content}</p>`;
	}

	toMarkdown() {
		return this.content;
	}
}

/**
 * Attach JSDoc tags to an entity instance
 * @param {import('../models/entity-base.js').EntityBase} entity - Entity instance
 * @param {any} jsDocComment - JSDoc comment object
 */
async function attachJSDocToEntity(entity, jsDocComment) {
	// Handle description as a simple content tag
	if (jsDocComment.description) {
		const descriptionTag = new DescriptionTag(jsDocComment.description);
		entity.addJSDocTag(/** @type {any} */ (descriptionTag));
	}

	if (!jsDocComment.tags) return;

	for (const [tagName, tagValues] of Object.entries(jsDocComment.tags)) {
		// Handle arrays of tags
		const values = Array.isArray(tagValues) ? tagValues : [tagValues];

		for (const tagValue of values) {
			const jsDocTag = await createJSDocTag(tagName, tagValue);
			if (jsDocTag && entity.isValidJSDocTag(tagName)) {
				entity.addJSDocTag(jsDocTag);
			}
		}
	}
}

/**
 * Create appropriate JSDoc tag instance from tag data
 * @param {string} tagType - JSDoc tag type
 * @param {string} tagContent - Tag content string
 * @returns {Promise<any|null>} JSDoc tag instance or null
 */
async function createJSDocTag(tagType, tagContent) {
	try {
		switch (tagType) {
			case "param":
				return new JSDocParamTag(tagContent);
			case "returns":
			case "return":
				return new JSDocReturnsTag(tagContent);
			case "author":
				return new JSDocAuthorTag(tagContent);
			case "see":
				return new JSDocSeeTag(tagContent);
			case "example":
				return new JSDocExampleTag(tagContent);
			case "since":
				return new JSDocSinceTag(tagContent);
			case "deprecated":
				return new JSDocDeprecatedTag(tagContent);
			case "file":
				return new JSDocFileTag(tagContent);
			case "license":
				return new JSDocLicenseTag(tagContent);
			default:
				// For unrecognized tags, create a simple tag object
				return {
					tagType,
					content: tagContent,
					toJSON: () => ({ __type: tagType, __data: { content: tagContent } }),
					toHTML: () => `<span>@${tagType} ${tagContent}</span>`,
					toMarkdown: () => `@${tagType} ${tagContent}`,
				};
		}
	} catch (error) {
		// If tag parsing fails, return a simple fallback
		return {
			tagType,
			content: tagContent,
			error: error.message,
			toJSON: () => ({
				__type: tagType,
				__data: { content: tagContent, error: error.message },
			}),
			toHTML: () => `<span>@${tagType} ${tagContent} (parse error)</span>`,
			toMarkdown: () => `@${tagType} ${tagContent}`,
		};
	}
}

/**
 * Build complete entity graph with specialized instances
 * @param {any[]} codeEntities - Basic code entities from validation
 * @param {string} content - Full file content
 * @param {string[]} lines - File lines array
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @param {string} moduleId - Module identifier
 * @returns {Promise<{entities: import('../models/entity-base.js').EntityBase[], methods: MethodEntity[], properties: PropertyEntity[], typedefs: TypedefEntity[]}>} Complete entity collection
 */
export async function buildEntityGraph(
	codeEntities,
	content,
	lines,
	filePath,
	packagePath,
	moduleId,
) {
	const entities = [];
	const methods = [];
	const properties = [];
	const typedefs = [];

	// Build main entities
	for (const codeEntity of codeEntities) {
		const entity = await buildEnhancedEntity(
			codeEntity,
			content,
			lines,
			filePath,
			packagePath,
			moduleId,
		);
		entities.push(entity);

		// For classes, also extract methods and properties
		if (entity instanceof ClassEntity) {
			const classMethods = await buildMethodEntities(
				entity.methods,
				entity.name,
				content,
				filePath,
				packagePath,
				moduleId,
			);
			methods.push(...classMethods);

			const classProperties = await buildPropertyEntities(
				entity.properties,
				entity.name,
				content,
				filePath,
				packagePath,
				moduleId,
			);
			properties.push(...classProperties);
		}
	}

	// Extract standalone typedef definitions
	const allJSDocComments = [];
	for (let i = 0; i < lines.length; i++) {
		const jsDocComment = findPrecedingJSDoc(lines, i);
		if (jsDocComment?.tags?.typedef) {
			allJSDocComments.push({ ...jsDocComment, line: i + 1 });
		}
	}

	for (const jsDocComment of allJSDocComments) {
		const typedefEntities = await buildTypedefEntities(
			jsDocComment,
			filePath,
			packagePath,
			moduleId,
		);
		typedefs.push(...typedefEntities);
	}

	return { entities, methods, properties, typedefs };
}
