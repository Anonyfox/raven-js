/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Module entity model tests - comprehensive validation coverage.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { ModuleEntity } from "./module-entity.js";

test("ModuleEntity - toHTML with comprehensive content", () => {
	const module = new ModuleEntity("test-module", "/path/module.js");
	module.description = "A test module";
	module.lineCount = 100;
	module.addExport("Component");
	module.addExport("utils");
	module.addImport("react");
	module.addImport("lodash");
	module.addImport("./local-utils");

	const html = module.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("test-module"), true);
	strictEqual(html.includes("/path/module.js"), true);
	strictEqual(html.includes("A test module"), true);
	strictEqual(html.includes("100 lines"), true);
	strictEqual(html.includes("Component"), true);
	strictEqual(html.includes("utils"), true);
	strictEqual(html.includes("react"), true);
	strictEqual(html.includes("lodash"), true);
	strictEqual(html.includes("./local-utils"), true);
});

test("ModuleEntity - toHTML without optional content", () => {
	const module = new ModuleEntity("test", "/path");

	const html = module.toHTML();

	strictEqual(typeof html, "string");

	// Should not include export/dependency sections, only stats
	strictEqual(html.includes("<h3>Exports</h3>"), false);
	strictEqual(html.includes("External Dependencies"), false);
	strictEqual(html.includes("Internal Dependencies"), false);

	// But should include stats showing 0 exports
	strictEqual(html.includes("<strong>Exports:</strong> 0"), true);
});

test("ModuleEntity - toMarkdown with comprehensive content", () => {
	const module = new ModuleEntity("test-module", "/path/module.js");
	module.description = "A test module";
	module.lineCount = 100;
	module.addExport("Component");
	module.addExport("utils");
	module.addImport("react");
	module.addImport("lodash");
	module.addImport("./local-utils");

	const markdown = module.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(markdown.includes("## test-module"), true);
	strictEqual(markdown.includes("**Path:** `/path/module.js`"), true);
	strictEqual(markdown.includes("**Lines:** 100"), true);
	strictEqual(markdown.includes("A test module"), true);
	strictEqual(markdown.includes("**Exports:**"), true);
	strictEqual(markdown.includes("- `Component`"), true);
	strictEqual(markdown.includes("- `utils`"), true);
	strictEqual(markdown.includes("**External Dependencies:**"), true);
	strictEqual(markdown.includes("- `react`"), true);
	strictEqual(markdown.includes("- `lodash`"), true);
});

test("ModuleEntity - toMarkdown without optional content", () => {
	const module = new ModuleEntity("test", "/path");
	module.lineCount = 50;

	const markdown = module.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(markdown.includes("## test"), true);
	strictEqual(markdown.includes("**Lines:** 50"), true);
	strictEqual(markdown.includes("**Exports:**"), false);
	strictEqual(markdown.includes("**External Dependencies:**"), false);
});

test("ModuleEntity - edge cases and error conditions", () => {
	// Test with null/undefined values in setMetadata
	const module = new ModuleEntity("test", "/path");
	module.setMetadata({});
	strictEqual(module.size, 0);
	strictEqual(module.lineCount, 0);
	strictEqual(module.lastModified, null);

	// Test import with no specifiers and no isDefault parameter
	module.addImport("./test");
	strictEqual(module.imports[0].type, "named");

	// Test empty getters
	const emptyModule = new ModuleEntity("empty", "/path");
	deepStrictEqual(emptyModule.getImportedModules(), []);
	deepStrictEqual(emptyModule.getExternalDependencies(), []);
	deepStrictEqual(emptyModule.getInternalDependencies(), []);

	// Test statistics with empty module
	const emptyStats = emptyModule.getStatistics();
	strictEqual(emptyStats.entityCount, 0);
	strictEqual(emptyStats.importCount, 0);
	strictEqual(emptyStats.exportCount, 0);
	strictEqual(emptyStats.externalDeps || 0, 0);
});
