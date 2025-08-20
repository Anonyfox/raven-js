/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Documentation graph model tests - comprehensive validation coverage.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { AssetEntity } from "./asset-entity.js";
import { DocumentationGraph } from "./documentation-graph.js";
import { ModuleEntity } from "./module-entity.js";
import { PackageEntity } from "./package-entity.js";
import { ReadmeContentEntity } from "./readme-content-entity.js";

// Mock entity for testing
class MockEntity {
	constructor(id, entityType) {
		this.id = id;
		this.entityType = entityType;
		this.validationIssues = [];
		this.isValidated = false;
	}

	getId() {
		return this.id;
	}

	validate() {
		this.isValidated = this.validationIssues.length === 0;
	}

	isValid() {
		return this.isValidated;
	}

	addReference() {}
	addReferencedBy() {}

	getSerializableData() {
		return { id: this.id, entityType: this.entityType };
	}
}

test("DocumentationGraph - constructor initialization", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);

	strictEqual(graph.package, packageEntity);
	strictEqual(graph.modules.size, 0);
	strictEqual(graph.entities.size, 0);
	strictEqual(graph.content.size, 0);
	strictEqual(graph.assets.size, 0);
	strictEqual(typeof graph.generatedAt, "object");
	strictEqual(graph.version, "1.0.0");
	strictEqual(graph.totalSize, 0);
	strictEqual(graph.references.size, 0);
	strictEqual(graph.referencedBy.size, 0);
	strictEqual(graph.isValidated, false);
	deepStrictEqual(graph.validationIssues, []);
});

test("DocumentationGraph - getId returns package name", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);

	strictEqual(graph.getId(), "test-package");
});

test("DocumentationGraph - addModule", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const module = new ModuleEntity("test-module", "/path/module.js");

	graph.addModule(module);

	strictEqual(graph.modules.size, 1);
	strictEqual(graph.modules.get("test-module"), module);
});

test("DocumentationGraph - addEntity", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const entity = new MockEntity("test-entity", "function");

	graph.addEntity(entity);

	strictEqual(graph.entities.size, 1);
	strictEqual(graph.entities.get("test-entity"), entity);
	strictEqual(graph.references.has("test-entity"), true);
	strictEqual(graph.referencedBy.has("test-entity"), true);
});

test("DocumentationGraph - addContent", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const content = new ReadmeContentEntity("readme", "/README.md", "/");

	graph.addContent(content);

	strictEqual(graph.content.size, 1);
	strictEqual(graph.content.get("readme"), content);
});

test("DocumentationGraph - addAsset", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const asset = new AssetEntity("logo", "/logo.png");

	graph.addAsset(asset);

	strictEqual(graph.assets.size, 1);
	strictEqual(graph.assets.get("logo"), asset);
});

test("DocumentationGraph - addReference", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const entity1 = new MockEntity("entity1", "function");
	const entity2 = new MockEntity("entity2", "class");

	graph.addEntity(entity1);
	graph.addEntity(entity2);
	graph.addReference("entity1", "entity2");

	strictEqual(graph.references.get("entity1").has("entity2"), true);
	strictEqual(graph.referencedBy.get("entity2").has("entity1"), true);
});

test("DocumentationGraph - addReference with new entities", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);

	graph.addReference("newEntity1", "newEntity2");

	strictEqual(graph.references.has("newEntity1"), true);
	strictEqual(graph.references.get("newEntity1").has("newEntity2"), true);
	strictEqual(graph.referencedBy.has("newEntity2"), true);
	strictEqual(graph.referencedBy.get("newEntity2").has("newEntity1"), true);
});

test("DocumentationGraph - getEntity", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const entity = new MockEntity("test-entity", "function");

	graph.addEntity(entity);

	strictEqual(graph.getEntity("test-entity"), entity);
	strictEqual(graph.getEntity("nonexistent"), null);
});

test("DocumentationGraph - getModule", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const module = new ModuleEntity("test-module", "/path");

	graph.addModule(module);

	strictEqual(graph.getModule("test-module"), module);
	strictEqual(graph.getModule("nonexistent"), null);
});

test("DocumentationGraph - getContent", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const content = new ReadmeContentEntity("readme", "/README.md", "/");

	graph.addContent(content);

	strictEqual(graph.getContent("readme"), content);
	strictEqual(graph.getContent("nonexistent"), null);
});

test("DocumentationGraph - getAsset", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const asset = new AssetEntity("logo", "/logo.png");

	graph.addAsset(asset);

	strictEqual(graph.getAsset("logo"), asset);
	strictEqual(graph.getAsset("nonexistent"), null);
});

test("DocumentationGraph - getReferences", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);

	graph.addReference("entity1", "entity2");
	graph.addReference("entity1", "entity3");

	const refs = graph.getReferences("entity1");
	strictEqual(refs.length, 2);
	strictEqual(refs.includes("entity2"), true);
	strictEqual(refs.includes("entity3"), true);

	// Test entity with no references
	const emptyRefs = graph.getReferences("nonexistent");
	deepStrictEqual(emptyRefs, []);
});

test("DocumentationGraph - getReferencedBy", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);

	graph.addReference("entity1", "target");
	graph.addReference("entity2", "target");

	const refs = graph.getReferencedBy("target");
	strictEqual(refs.length, 2);
	strictEqual(refs.includes("entity1"), true);
	strictEqual(refs.includes("entity2"), true);

	// Test entity with no references
	const emptyRefs = graph.getReferencedBy("nonexistent");
	deepStrictEqual(emptyRefs, []);
});

test("DocumentationGraph - getEntitiesByType", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const entity1 = new MockEntity("entity1", "function");
	const entity2 = new MockEntity("entity2", "function");
	const entity3 = new MockEntity("entity3", "class");

	graph.addEntity(entity1);
	graph.addEntity(entity2);
	graph.addEntity(entity3);

	const functions = graph.getEntitiesByType("function");
	strictEqual(functions.length, 2);
	strictEqual(functions.includes(entity1), true);
	strictEqual(functions.includes(entity2), true);

	const classes = graph.getEntitiesByType("class");
	strictEqual(classes.length, 1);
	strictEqual(classes.includes(entity3), true);

	const none = graph.getEntitiesByType("nonexistent");
	strictEqual(none.length, 0);
});

test("DocumentationGraph - getEntitiesInModule", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const entity1 = new MockEntity("entity1", "function");
	const entity2 = new MockEntity("entity2", "function");
	const entity3 = new MockEntity("entity3", "class");

	entity1.moduleId = "module1";
	entity2.moduleId = "module1";
	entity3.moduleId = "module2";

	graph.addEntity(entity1);
	graph.addEntity(entity2);
	graph.addEntity(entity3);

	const module1Entities = graph.getEntitiesInModule("module1");
	strictEqual(module1Entities.length, 2);
	strictEqual(module1Entities.includes(entity1), true);
	strictEqual(module1Entities.includes(entity2), true);

	const module2Entities = graph.getEntitiesInModule("module2");
	strictEqual(module2Entities.length, 1);
	strictEqual(module2Entities.includes(entity3), true);

	const none = graph.getEntitiesInModule("nonexistent");
	strictEqual(none.length, 0);
});

test("DocumentationGraph - getStatistics", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const module = new ModuleEntity("module1", "/path");
	const entity = new MockEntity("entity1", "function");
	const content = new ReadmeContentEntity("readme", "/README.md", "/");
	const asset = new AssetEntity("logo", "/logo.png");

	graph.addModule(module);
	graph.addEntity(entity);
	graph.addContent(content);
	graph.addAsset(asset);
	graph.addReference("entity1", "entity2");

	const stats = graph.getStatistics();

	strictEqual(stats.entityCount, 1);
	strictEqual(stats.moduleCount, 1);
	strictEqual(stats.contentCount, 1);
	strictEqual(stats.assetCount, 1);
	strictEqual(stats.referenceCount, 1);
});

test("DocumentationGraph - getEntityTypeDistribution", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const entity1 = new MockEntity("entity1", "function");
	const entity2 = new MockEntity("entity2", "function");
	const entity3 = new MockEntity("entity3", "class");

	graph.addEntity(entity1);
	graph.addEntity(entity2);
	graph.addEntity(entity3);

	const distribution = graph.getEntityTypeDistribution();

	strictEqual(distribution.function, 2);
	strictEqual(distribution.class, 1);
});

test("DocumentationGraph - calculateSize", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);
	const content = new ReadmeContentEntity("readme", "/README.md", "/");
	const asset = new AssetEntity("logo", "/logo.png");

	content.content = "This is test content";
	asset.fileSize = 1024;

	graph.addContent(content);
	graph.addAsset(asset);

	const totalSize = graph.calculateSize();

	strictEqual(totalSize, 20 + 1024); // content length + asset size
	strictEqual(graph.totalSize, totalSize);
});

test("DocumentationGraph - validate with valid graph", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const module = new ModuleEntity("module1", "/path/module.js");
	const entity = new MockEntity("entity1", "function");
	const content = new ReadmeContentEntity("readme", "/README.md", "/");
	const asset = new AssetEntity("logo", "/logo.png");

	graph.addModule(module);
	graph.addEntity(entity);
	graph.addContent(content);
	graph.addAsset(asset);

	graph.validate();

	strictEqual(graph.isValidated, true);
	strictEqual(graph.validationIssues.length, 0);
	strictEqual(graph.isValid(), true);
});

test("DocumentationGraph - validate with invalid package", () => {
	const packageEntity = new PackageEntity(); // Invalid - no name
	const graph = new DocumentationGraph(packageEntity);

	graph.validate();

	strictEqual(graph.isValidated, false);
	strictEqual(
		graph.validationIssues.some((issue) => issue.type === "invalid_package"),
		true,
	);
});

test("DocumentationGraph - validate with invalid module", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const module = new ModuleEntity("", "/path"); // Invalid - no ID

	graph.addModule(module);
	graph.validate();

	strictEqual(graph.isValidated, false);
	strictEqual(
		graph.validationIssues.some((issue) => issue.type === "invalid_module"),
		true,
	);
});

test("DocumentationGraph - validate with invalid entity", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const entity = new MockEntity("entity1", "function");
	entity.validationIssues.push({ type: "test_error", message: "Test error" });

	graph.addEntity(entity);
	graph.validate();

	strictEqual(graph.isValidated, false);
	strictEqual(
		graph.validationIssues.some((issue) => issue.type === "invalid_entity"),
		true,
	);
});

test("DocumentationGraph - validate with invalid content", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const content = new ReadmeContentEntity("", "/README.md", "/"); // Invalid - no ID

	graph.addContent(content);
	graph.validate();

	strictEqual(graph.isValidated, false);
	strictEqual(
		graph.validationIssues.some((issue) => issue.type === "invalid_content"),
		true,
	);
});

test("DocumentationGraph - validate with invalid asset", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const asset = new AssetEntity("", "/logo.png"); // Invalid - no ID

	graph.addAsset(asset);
	graph.validate();

	strictEqual(graph.isValidated, false);
	strictEqual(
		graph.validationIssues.some((issue) => issue.type === "invalid_asset"),
		true,
	);
});

test("DocumentationGraph - validateReferences with dangling reference", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const entity = new MockEntity("entity1", "function");

	graph.addEntity(entity);
	graph.addReference("entity1", "nonexistent");
	graph.validate();

	strictEqual(graph.isValidated, false);
	strictEqual(
		graph.validationIssues.some((issue) => issue.type === "dangling_reference"),
		true,
	);
});

test("DocumentationGraph - validateReferences with inconsistent reference", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);

	// Manually create inconsistent reference state
	graph.referencedBy.set("entity1", new Set(["entity2"]));
	// Don't set the forward reference

	graph.validate();

	strictEqual(graph.isValidated, false);
	strictEqual(
		graph.validationIssues.some(
			(issue) => issue.type === "inconsistent_reference",
		),
		true,
	);
});

test("DocumentationGraph - getSerializableData", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const module = new ModuleEntity("module1", "/path");
	const entity = new MockEntity("entity1", "function");
	const content = new ReadmeContentEntity("readme", "/README.md", "/");
	const asset = new AssetEntity("logo", "/logo.png");

	graph.addModule(module);
	graph.addEntity(entity);
	graph.addContent(content);
	graph.addAsset(asset);
	graph.addReference("entity1", "entity2");

	const data = graph.getSerializableData();

	strictEqual(typeof data.package, "object");
	strictEqual(typeof data.modules, "object");
	strictEqual(typeof data.entities, "object");
	strictEqual(typeof data.content, "object");
	strictEqual(typeof data.assets, "object");
	strictEqual(typeof data.references, "object");
	strictEqual(typeof data.referencedBy, "object");
	strictEqual(typeof data.generatedAt, "object");
	strictEqual(data.version, "1.0.0");
	strictEqual(typeof data.totalSize, "number");
	strictEqual(typeof data.statistics, "object");
	strictEqual(typeof data.entityTypeDistribution, "object");
	strictEqual(Array.isArray(data.validationIssues), true);

	// Verify references are arrays
	strictEqual(Array.isArray(data.references.entity1), true);
	strictEqual(data.references.entity1.includes("entity2"), true);
});

test("DocumentationGraph - toJSON", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);

	const json = graph.toJSON();

	strictEqual(json.__type, "documentation-graph");
	strictEqual(typeof json.__data, "object");
	strictEqual(typeof json.__data.package, "object");
});

test("DocumentationGraph - toHTML", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "2.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const entity1 = new MockEntity("entity1", "function");
	const entity2 = new MockEntity("entity2", "class");

	graph.addEntity(entity1);
	graph.addEntity(entity2);

	const html = graph.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("test-package"), true);
	strictEqual(html.includes("2.0.0"), true);
	strictEqual(html.includes("function"), true);
	strictEqual(html.includes("class"), true);
	strictEqual(html.includes("Entities"), true);
	strictEqual(html.includes("Entity Distribution"), true);
});

test("DocumentationGraph - toHTML with validation issues", () => {
	const packageEntity = new PackageEntity(); // Invalid package
	const graph = new DocumentationGraph(packageEntity);

	graph.validate(); // Will create validation issues

	const html = graph.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("Validation Issues"), true);
	strictEqual(html.includes("invalid_package"), true);
});

test("DocumentationGraph - toHTML with validation issues including entity ID", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);
	const entity = new MockEntity("problematic-entity", "function");
	entity.validationIssues.push({ type: "test_error", message: "Test error" });

	graph.addEntity(entity);
	graph.validate(); // Will create validation issues with entity ID

	const html = graph.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("Validation Issues"), true);
	strictEqual(html.includes("invalid_entity"), true);
	strictEqual(html.includes("(problematic-entity)"), true); // Entity ID in parentheses
});

test("DocumentationGraph - toMarkdown", () => {
	const packageEntity = new PackageEntity({
		name: "awesome-package",
		version: "3.1.4",
	});
	const graph = new DocumentationGraph(packageEntity);
	const entity1 = new MockEntity("entity1", "function");
	const entity2 = new MockEntity("entity2", "class");

	graph.addEntity(entity1);
	graph.addEntity(entity2);

	const markdown = graph.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(
		markdown.includes("# Documentation Graph: awesome-package"),
		true,
	);
	strictEqual(markdown.includes("**Version:** 3.1.4"), true);
	strictEqual(markdown.includes("## Statistics"), true);
	strictEqual(markdown.includes("**Entities:** 2"), true);
	strictEqual(markdown.includes("## Entity Distribution"), true);
	strictEqual(markdown.includes("**function:** 1"), true);
	strictEqual(markdown.includes("**class:** 1"), true);
});

test("DocumentationGraph - edge cases and complex scenarios", () => {
	const packageEntity = new PackageEntity({
		name: "complex-package",
		version: "1.0.0",
	});
	const graph = new DocumentationGraph(packageEntity);

	// Test with empty graph
	const stats = graph.getStatistics();
	strictEqual(stats.entityCount, 0);
	strictEqual(stats.moduleCount, 0);
	strictEqual(stats.contentCount, 0);
	strictEqual(stats.assetCount, 0);
	strictEqual(stats.referenceCount, 0);

	// Test entity type distribution with no entities
	const distribution = graph.getEntityTypeDistribution();
	deepStrictEqual(distribution, {});

	// Test calculate size with no content/assets
	const size = graph.calculateSize();
	strictEqual(size, 0);

	// Test serialization with empty graph
	const data = graph.getSerializableData();
	strictEqual(typeof data, "object");

	// Test HTML/Markdown generation with empty graph
	const html = graph.toHTML();
	strictEqual(typeof html, "string");
	strictEqual(html.length > 0, true);

	const markdown = graph.toMarkdown();
	strictEqual(typeof markdown, "string");
	strictEqual(markdown.length > 0, true);

	// Test validation with empty graph
	graph.validate();
	strictEqual(graph.isValidated, true); // Should be valid when empty
});

test("DocumentationGraph - addReference with entities that have methods", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);

	// Create entities with reference methods
	class MockEntityWithMethods {
		constructor(id) {
			this.id = id;
			this.references = [];
			this.referencedBy = [];
		}

		getId() {
			return this.id;
		}

		addReference(id) {
			if (!this.references.includes(id)) {
				this.references.push(id);
			}
		}

		addReferencedBy(id) {
			if (!this.referencedBy.includes(id)) {
				this.referencedBy.push(id);
			}
		}
	}

	const entity1 = new MockEntityWithMethods("entity1");
	const entity2 = new MockEntityWithMethods("entity2");

	graph.addEntity(entity1);
	graph.addEntity(entity2);
	graph.addReference("entity1", "entity2");

	// Verify both graph-level and entity-level references
	strictEqual(graph.references.get("entity1").has("entity2"), true);
	strictEqual(graph.referencedBy.get("entity2").has("entity1"), true);
	strictEqual(entity1.references.includes("entity2"), true);
	strictEqual(entity2.referencedBy.includes("entity1"), true);
});

test("DocumentationGraph - addReference without entity methods", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	const graph = new DocumentationGraph(packageEntity);

	// Create entities without reference methods
	class MockEntityNoMethods {
		constructor(id) {
			this.id = id;
		}

		getId() {
			return this.id;
		}
	}

	const entity1 = new MockEntityNoMethods("entity1");
	const entity2 = new MockEntityNoMethods("entity2");

	graph.addEntity(entity1);
	graph.addEntity(entity2);

	// Should not crash when entities don't have reference methods
	graph.addReference("entity1", "entity2");

	// Graph-level references should still work
	strictEqual(graph.references.get("entity1").has("entity2"), true);
	strictEqual(graph.referencedBy.get("entity2").has("entity1"), true);
});
