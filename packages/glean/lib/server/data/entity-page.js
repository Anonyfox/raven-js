/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Entity page data extractor for /modules/{moduleName}/{entityName}/ route
 *
 * Implements comprehensive entity documentation extraction including JSDoc processing,
 * cross-references, related entities, and navigation context following WEBAPP.md
 * specification for detailed API documentation pages.
 */

/**
 * Extract entity page data for documentation rendering
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package data
 * @param {string} moduleName - Module name from URL parameter
 * @param {string} entityName - Entity name from URL parameter
 * @returns {Object} Complete entity page data structure
 */
export function extractEntityPageData(packageInstance, moduleName, entityName) {
	/** @type {any} */
	const pkg = packageInstance;
	// STEP 1: Find the target entity
	const packageName = packageInstance.name || "";

	// Find target module using same logic as module overview
	let module = null;
	if (packageInstance.findModuleByImportPath) {
		module = packageInstance.findModuleByImportPath(moduleName);
	} else {
		module = packageInstance.modules.find((m) => m.importPath === moduleName);
	}

	// If not found, try constructing full import path
	if (!module && packageName) {
		const fullImportPath = `${packageName}/${moduleName}`;
		if (packageInstance.findModuleByImportPath) {
			module = packageInstance.findModuleByImportPath(fullImportPath);
		} else {
			module = packageInstance.modules.find(
				(m) => m.importPath === fullImportPath,
			);
		}
	}

	// If still not found, try finding by module name (last part of import path)
	if (!module) {
		module = packageInstance.modules.find(
			(m) => m.importPath.split("/").pop() === moduleName,
		);
	}

	if (!module) {
		throw new Error(
			`Module '${moduleName}' not found in package '${packageName}'`,
		);
	}

	// Find target entity within the module
	/** @type {any} */
	let entity = null;
	/** @type {any} */
	const mod = module;
	if (mod.findEntityByName) {
		entity = mod.findEntityByName(entityName);
	} else if (mod.entities) {
		entity = mod.entities.find(
			/** @param {any} e */ (e) => e.name === entityName,
		);
	}

	if (!entity) {
		throw new Error(
			`Entity '${entityName}' not found in module '${mod.importPath}'`,
		);
	}

	// STEP 2: Core entity information
	const entityData = {
		name: entity.name,
		type: entity.entityType || "unknown",
		description: entity.description || "",
		moduleId: entity.moduleId || mod.importPath,

		// Import statement generation
		importPath: mod.importPath,
		importStatement: `import { ${entity.name} } from '${mod.importPath}';`,
		isDefault: mod.isDefault || false,
	};

	// STEP 3: JSDoc documentation extraction
	const documentation = {
		// Parameters (for functions)
		parameters: extractParameters(entity),

		// Properties (for typedefs and classes)
		properties: extractProperties(entity),

		// Methods (for classes)
		methods: extractMethods(entity),

		// Return information
		returns: extractReturns(entity),

		// Examples
		examples: extractExamples(entity),

		// Other JSDoc tags
		since: extractSinceVersion(entity),
		deprecated: extractDeprecationInfo(entity),
		author: extractAuthorInfo(entity),
		throws: extractThrowsInfo(entity),

		// Type information for TypeScript users
		typeInfo: extractTypeInfo(entity),
	};

	// STEP 4: Related entities and cross-references
	const relatedEntities = {
		// Entities in the same module
		sameModule: getSameModuleEntities(mod, entity),

		// Entities that reference this entity
		referencedBy: getReferencingEntities(pkg, entity),

		// Entities that this entity references
		references: getReferencedEntities(pkg, entity),

		// Similar entities (same type across modules)
		similar: getSimilarEntities(pkg, entity),
	};

	// STEP 5: Navigation context
	const navigationContext = {
		packageName: packageName,
		currentModule: {
			name: moduleName,
			fullImportPath: mod.importPath,
			link: `/modules/${moduleName}/`,
		},
		currentEntity: {
			name: entityName,
			type: entity.entityType || "unknown",
		},
		allModules: pkg.modules.map(
			/** @param {any} m */ (m) => ({
				name: m.importPath.split("/").pop(),
				fullImportPath: m.importPath,
				isCurrent: m.importPath === mod.importPath,
				isDefault: m.isDefault || false,
				link: `/modules/${m.importPath.split("/").pop()}/`,
				entityCount: m.publicEntityCount || 0,
			}),
		),
		moduleEntities: getModuleEntityNavigation(mod, entity),
	};

	// STEP 6: Build complete data structure
	/** @type {any} */
	const docs = documentation;
	return {
		entity: entityData,
		entityInstance: entity, // Pass the real entity instance for attribution
		documentation,
		relatedEntities,
		navigation: navigationContext,
		packageName: packageName,
		moduleName: moduleName,
		packageMetadata: extractPackageMetadata(packageInstance), // Add package metadata
		allModules: packageInstance.modules, // Pass all modules for re-export tracing
		generationTimestamp: new Date().toISOString(), // Generation timestamp for footer

		// Computed flags for conditional rendering
		hasParameters: docs.parameters.length > 0,
		hasProperties: docs.properties.length > 0,
		hasMethods: docs.methods.length > 0,
		hasReturns: Boolean(docs.returns.description),
		hasExamples: docs.examples.length > 0,
		hasRelatedEntities:
			relatedEntities.sameModule.length > 0 ||
			relatedEntities.referencedBy.length > 0 ||
			relatedEntities.references.length > 0,
		hasTypeInfo: Boolean(docs.typeInfo.signature),
		isDeprecated: Boolean(docs.deprecated.isDeprecated),
	};
}

/**
 * Extract package metadata for attribution
 * @param {import('../../extract/models/package.js').Package} packageInstance - Package instance
 * @returns {Object|null} Package metadata for attribution
 */
function extractPackageMetadata(packageInstance) {
	/** @type {any} */
	const pkg = packageInstance;

	// Get package.json data from the package instance
	if (pkg.packageJsonData) {
		return {
			author: pkg.packageJsonData.author,
			homepage: pkg.packageJsonData.homepage,
			repository: pkg.packageJsonData.repository,
			bugs: pkg.packageJsonData.bugs,
			funding: pkg.packageJsonData.funding,
		};
	}

	// Fallback to null if no package data available
	return null;
}

/**
 * Extract parameter information from JSDoc tags
 * @param {Object} entity - Entity instance
 * @returns {Array<Object>} Parameter documentation
 */
function extractParameters(entity) {
	/** @type {any} */
	const ent = entity;
	if (!ent.getJSDocTagsByType) return [];

	return ent.getJSDocTagsByType("param").map(
		/** @param {any} paramTag */ (paramTag) => ({
			name: paramTag.name || "",
			type: paramTag.type || "",
			description: paramTag.description || "",
			isOptional: paramTag.optional || false,
			defaultValue: paramTag.defaultValue || null,
		}),
	);
}

/**
 * Extract property information from JSDoc @property tags (for typedefs) and class properties
 * @param {Object} entity - Entity instance
 * @returns {Array<Object>} Property documentation
 */
function extractProperties(entity) {
	/** @type {any} */
	const ent = entity;
	const properties = [];

	// Extract JSDoc @property tags (for typedefs)
	if (ent.getJSDocTagsByType) {
		properties.push(
			...ent.getJSDocTagsByType("property").map(
				/** @param {any} propertyTag */ (propertyTag) => ({
					name: propertyTag.name || "",
					type: propertyTag.type || "",
					description: propertyTag.description || "",
					isOptional: propertyTag.optional || false,
					defaultValue: propertyTag.defaultValue || null,
				}),
			),
		);
	}

	// Extract class properties (for class entities)
	if (
		ent.entityType === "class" &&
		ent.properties &&
		Array.isArray(ent.properties)
	) {
		properties.push(
			...ent.properties.map(
				/** @param {any} classProp */ (classProp) => ({
					name: classProp.name || "",
					type: inferPropertyType(classProp), // Try to infer better types
					description:
						classProp.description ||
						(classProp.isInstance ? "Instance property" : "Class property"),
					isOptional: false, // Class properties are not optional by default
					defaultValue: classProp.hasInitializer ? "initialized" : null,
					isStatic: classProp.isStatic || false,
					isPrivate: classProp.isPrivate || false,
					isInstance: classProp.isInstance || false,
				}),
			),
		);
	}

	return properties;
}

/**
 * Extract method information from class entities
 * @param {Object} entity - Entity instance
 * @returns {Array<Object>} Method documentation
 */
function extractMethods(entity) {
	/** @type {any} */
	const ent = entity;

	// Only extract methods for class entities
	if (
		ent.entityType !== "class" ||
		!ent.methods ||
		!Array.isArray(ent.methods)
	) {
		return [];
	}

	return ent.methods.map(
		/** @param {any} classMethod */ (classMethod) => ({
			name: classMethod.name || "",
			type: classMethod.methodType || "method",
			description: getMethodDescription(classMethod, ent.name),
			returnType: getMethodReturnType(classMethod),
			parameters: getMethodParameters(classMethod),
			isStatic: classMethod.isStatic || false,
			isPrivate: classMethod.isPrivate || false,
			isAsync: classMethod.isAsync || false,
			isGenerator: classMethod.isGenerator || false,
			isDeprecated: classMethod.documentation?.deprecated || false,
			signature: classMethod.signature || "",
			line: classMethod.line || 0,
		}),
	);
}

/**
 * Get method description from JSDoc or generate fallback
 * @param {{documentation?: {description?: string}, methodType?: string, name?: string, isStatic?: boolean}} classMethod - Class method object
 * @param {string} className - Name of the containing class
 * @returns {string} Method description
 */
function getMethodDescription(classMethod, className) {
	// Use JSDoc description if available
	if (classMethod.documentation?.description) {
		return classMethod.documentation.description;
	}

	// Generate fallback description
	const methodType = classMethod.methodType || "method";
	if (methodType === "constructor") {
		return `Creates a new instance of ${className}`;
	} else if (methodType === "getter") {
		return `Gets the value of ${classMethod.name}`;
	} else if (methodType === "setter") {
		return `Sets the value of ${classMethod.name}`;
	} else {
		return `${classMethod.isStatic ? "Static method" : "Method"} of ${className}`;
	}
}

/**
 * Get method return type from JSDoc
 * @param {{documentation?: {returns?: {type?: string}}, methodType?: string}} classMethod - Class method object
 * @returns {string} Return type
 */
function getMethodReturnType(classMethod) {
	if (classMethod.documentation?.returns?.type) {
		return classMethod.documentation.returns.type;
	}

	// Infer return type from method type
	const methodType = classMethod.methodType || "method";
	if (methodType === "constructor") {
		return "void";
	} else if (methodType === "setter") {
		return "void";
	} else if (methodType === "getter") {
		return "any";
	}

	return "any";
}

/**
 * Get method parameters from JSDoc
 * @param {{documentation?: {parameters?: any[]}, signature?: string}} classMethod - Class method object
 * @returns {Array<Object>} Method parameters
 */
function getMethodParameters(classMethod) {
	if (classMethod.documentation?.parameters) {
		return classMethod.documentation.parameters.map(
			/** @param {any} param */ (param) => ({
				name: param.name,
				type: param.type,
				description: param.description,
				isOptional: param.optional || false,
			}),
		);
	}

	// Try to extract parameters from signature
	const signature = classMethod.signature || "";
	const paramMatch = signature.match(/\(([^)]*)\)/);
	if (paramMatch?.[1].trim()) {
		const paramNames = paramMatch[1]
			.split(",")
			.map(/** @param {string} p */ (p) => p.trim().split(/\s+/)[0]);
		return paramNames.map(
			/** @param {string} name */ (name) => ({
				name: name.replace(/[=\s].*$/, ""), // Remove default values
				type: "any",
				description: "",
				isOptional: name.includes("=") || name.includes("null"),
			}),
		);
	}

	return [];
}

/**
 * Try to infer property type from its characteristics
 * @param {{signature?: string, name?: string}} classProp - Class property object
 * @returns {string} Inferred type
 */
function inferPropertyType(classProp) {
	// If signature contains type hints, try to extract
	if (classProp.signature) {
		const signature = classProp.signature;

		// Look for common patterns
		if (signature.includes("new Float32Array")) return "Float32Array";
		if (signature.includes("new Array")) return "Array";
		if (signature.includes("[]")) return "Array";
		if (signature.includes('"') || signature.includes("'")) return "string";
		if (signature.includes("true") || signature.includes("false"))
			return "boolean";
		if (/= \d+/.test(signature)) return "number";
		if (signature.includes("null")) return "null";
		if (signature.includes("{}")) return "Object";
	}

	// Try to infer from property name patterns
	const name = classProp.name;
	if (
		name.includes("count") ||
		name.includes("length") ||
		name.includes("size") ||
		name === "rows" ||
		name === "cols"
	) {
		return "number";
	}
	if (name.includes("is") || name.includes("has") || name.includes("enabled")) {
		return "boolean";
	}
	if (name.includes("data") || name.includes("buffer")) {
		return "TypedArray";
	}

	return "any"; // fallback
}

/**
 * Extract return information from JSDoc tags
 * @param {Object} entity - Entity instance
 * @returns {Object} Return documentation
 */
function extractReturns(entity) {
	/** @type {any} */
	const ent = entity;
	if (!ent.getJSDocTag) return { type: "", description: "" };

	const returnsTag = ent.getJSDocTag("returns") || ent.getJSDocTag("return");
	return {
		type: returnsTag?.type || "",
		description: returnsTag?.description || "",
	};
}

/**
 * Extract code examples from JSDoc tags
 * @param {Object} entity - Entity instance
 * @returns {Array<Object>} Example code blocks
 */
function extractExamples(entity) {
	/** @type {any} */
	const ent = entity;
	if (!ent.getJSDocTagsByType) return [];

	return ent
		.getJSDocTagsByType("example")
		.map((/** @type {any} */ exampleTag, /** @type {any} */ index) => ({
			code: exampleTag.description || exampleTag.code || "",
			title: exampleTag.title || `Example ${index + 1}`,
			language: exampleTag.language || "javascript",
		}));
}

/**
 * Extract version information from JSDoc tags
 * @param {Object} entity - Entity instance
 * @returns {string} Version information
 */
function extractSinceVersion(entity) {
	/** @type {any} */
	const ent = entity;
	if (!ent.getJSDocTag) return "";
	const sinceTag = ent.getJSDocTag("since");
	return sinceTag?.description || "";
}

/**
 * Extract deprecation information from JSDoc tags
 * @param {Object} entity - Entity instance
 * @returns {Object} Deprecation details
 */
function extractDeprecationInfo(entity) {
	/** @type {any} */
	const ent = entity;
	if (!ent.hasJSDocTag || !ent.getJSDocTag) {
		return { isDeprecated: false, reason: "", since: "" };
	}

	const isDeprecated = ent.hasJSDocTag("deprecated");
	if (!isDeprecated) {
		return { isDeprecated: false, reason: "", since: "" };
	}

	const deprecatedTag = ent.getJSDocTag("deprecated");
	return {
		isDeprecated: true,
		reason: deprecatedTag?.description || "This API is deprecated",
		since: deprecatedTag?.since || "",
	};
}

/**
 * Extract author information from JSDoc tags
 * @param {Object} entity - Entity instance
 * @returns {Array<string>} Author information
 */
function extractAuthorInfo(entity) {
	/** @type {any} */
	const ent = entity;
	if (!ent.getJSDocTagsByType) return [];
	return ent
		.getJSDocTagsByType("author")
		.map(/** @param {any} tag */ (tag) => tag.description || "");
}

/**
 * Extract exception/error information from JSDoc tags
 * @param {Object} entity - Entity instance
 * @returns {Array<Object>} Exception documentation
 */
function extractThrowsInfo(entity) {
	/** @type {any} */
	const ent = entity;
	if (!ent.getJSDocTagsByType) return [];

	return ent
		.getJSDocTagsByType("throws")
		.concat(ent.getJSDocTagsByType("exception") || [])
		.map(
			/** @param {any} throwsTag */ (throwsTag) => ({
				type: throwsTag.type || "Error",
				description: throwsTag.description || "",
			}),
		);
}

/**
 * Extract TypeScript type information
 * @param {Object} entity - Entity instance
 * @returns {Object} Type information for TS users
 */
function extractTypeInfo(entity) {
	/** @type {any} */
	const ent = entity;
	return {
		signature: ent.signature || "",
		typeParameters: ent.typeParameters || [],
		namespace: ent.namespace || "",
	};
}

/**
 * Get entities in the same module (excluding current entity)
 * @param {Object} module - Module instance
 * @param {Object} currentEntity - Current entity
 * @returns {Array<Object>} Same module entities
 */
function getSameModuleEntities(module, currentEntity) {
	/** @type {any} */
	const mod = module;
	/** @type {any} */
	const curr = currentEntity;
	if (!mod.entities) return [];

	return mod.entities
		.filter(/** @param {any} e */ (e) => e.name !== curr.name)
		.filter(
			/** @param {any} e */ (e) =>
				!e.hasJSDocTag?.("private") && !e.name?.startsWith("_"),
		)
		.slice(0, 10) // Limit for performance
		.map(
			/** @param {any} entity */ (entity) => ({
				name: entity.name,
				type: entity.entityType || "unknown",
				description: (entity.description || "").slice(0, 100),
				link: `/modules/${mod.importPath.split("/").pop()}/${entity.name}/`,
			}),
		);
}

/**
 * Get entities that reference this entity
 * @param {Object} packageInstance - Package instance
 * @param {Object} _entity - Current entity (unused in current implementation)
 * @returns {Array<Object>} Referencing entities
 */
function getReferencingEntities(packageInstance, /** @type {any} */ _entity) {
	/** @type {any} */
	const pkg = packageInstance;
	if (!pkg.allEntities) return [];

	// This would require more sophisticated analysis in a real implementation
	// For now, return empty array as this needs dependency graph analysis
	return [];
}

/**
 * Get entities that this entity references
 * @param {Object} packageInstance - Package instance
 * @param {Object} entity - Current entity
 * @returns {Array<Object>} Referenced entities
 */
function getReferencedEntities(packageInstance, entity) {
	/** @type {any} */
	const pkg = packageInstance;
	/** @type {any} */
	const ent = entity;
	if (!pkg.allEntities || !ent.source) return [];

	// This would require parsing the source code for references
	// For now, return empty array as this needs AST analysis
	return [];
}

/**
 * Get similar entities (same type across other modules)
 * @param {Object} packageInstance - Package instance
 * @param {Object} entity - Current entity
 * @returns {Array<Object>} Similar entities
 */
function getSimilarEntities(packageInstance, entity) {
	/** @type {any} */
	const pkg = packageInstance;
	/** @type {any} */
	const ent = entity;
	if (!pkg.allEntities) return [];

	const currentType = ent.entityType || "unknown";
	const currentModulePath = ent.moduleId;

	return pkg.allEntities
		.filter(/** @param {any} e */ (e) => e.entityType === currentType)
		.filter(/** @param {any} e */ (e) => e.moduleId !== currentModulePath)
		.filter(
			/** @param {any} e */ (e) =>
				!e.hasJSDocTag?.("private") && !e.name?.startsWith("_"),
		)
		.slice(0, 5) // Limit for performance
		.map(
			/** @param {any} similarEntity */ (similarEntity) => {
				// Find the module for this entity
				const parentModule = pkg.modules.find(
					/** @param {any} m */ (m) => m.entities?.includes(similarEntity),
				);

				return {
					name: similarEntity.name,
					type: similarEntity.entityType || "unknown",
					description: (similarEntity.description || "").slice(0, 100),
					moduleName: parentModule?.importPath?.split("/").pop() || "unknown",
					link: `/modules/${parentModule?.importPath?.split("/").pop()}/${similarEntity.name}/`,
				};
			},
		);
}

/**
 * Get navigation data for entities within the current module
 * @param {Object} module - Module instance
 * @param {Object} currentEntity - Current entity
 * @returns {Array<Object>} Module entity navigation
 */
function getModuleEntityNavigation(module, currentEntity) {
	/** @type {any} */
	const mod = module;
	/** @type {any} */
	const curr = currentEntity;
	if (!mod.entities) return [];

	return mod.entities
		.filter(
			/** @param {any} e */ (e) =>
				!e.hasJSDocTag?.("private") && !e.name?.startsWith("_"),
		)
		.map(
			/** @param {any} entity */ (entity) => ({
				name: entity.name,
				type: entity.entityType || "unknown",
				isCurrent: entity.name === curr.name,
				link: `/modules/${mod.importPath.split("/").pop()}/${entity.name}/`,
			}),
		);
}
