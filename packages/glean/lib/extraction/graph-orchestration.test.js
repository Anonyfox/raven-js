/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
	buildEntityReferences,
	extractDocumentationGraph,
} from "./graph-orchestration.js";

test("extractDocumentationGraph - comprehensive branch coverage", async () => {
	// Create temporary test package
	const testPackage = "/tmp/glean-graph-test";
	await rm(testPackage, { recursive: true, force: true });
	await mkdir(testPackage, { recursive: true });

	try {
		// Create package.json
		const packageJson = {
			name: "@test/package",
			version: "1.0.0",
			description: "Test package for graph orchestration",
			exports: {
				".": "./index.js",
				"./utils": "./src/utils/index.js",
			},
			main: "./index.js",
		};
		await writeFile(
			join(testPackage, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);

		// Create main index.js
		const indexContent = `/**
 * Main entry point
 * @returns {string} Welcome message
 */
export function welcome() {
  return "Welcome to test package";
}

export const VERSION = "1.0.0";
`;
		await writeFile(join(testPackage, "index.js"), indexContent);

		// Create utils module
		const utilsDir = join(testPackage, "src", "utils");
		await mkdir(utilsDir, { recursive: true });

		const utilsContent = `import { VERSION } from "../../index.js";

/**
 * Utility helper function
 * @param {string} input - Input to process
 * @returns {string} Processed input
 */
export function processInput(input) {
  return \`Processed: \${input} (v\${VERSION})\`;
}

export class UtilsClass {
  constructor(value) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}
`;
		await writeFile(join(utilsDir, "index.js"), utilsContent);

		// Create README files
		const rootReadme = `# Test Package

This is a test package for graph orchestration.

## Features

- Welcome function
- Utility processing
- Version tracking
`;
		await writeFile(join(testPackage, "README.md"), rootReadme);

		const utilsReadme = `# Utils Module

Utility functions and classes for processing data.
`;
		await writeFile(join(utilsDir, "README.md"), utilsReadme);

		// Create discovery data
		const discovery = {
			files: [join(testPackage, "index.js"), join(utilsDir, "index.js")],
			readmes: [join(testPackage, "README.md"), join(utilsDir, "README.md")],
			packageJson,
			entryPoints: [join(testPackage, "index.js")],
		};

		// Extract documentation graph
		const graph = await extractDocumentationGraph(testPackage, discovery);

		// Verify package metadata is now a PackageEntity
		strictEqual(graph.package.constructor.name, "PackageEntity");
		strictEqual(graph.package.name, "@test/package");
		strictEqual(graph.package.version, "1.0.0");
		strictEqual(
			graph.package.description,
			"Test package for graph orchestration",
		);
		deepStrictEqual(graph.package.exports, {
			".": "./index.js",
			"./utils": "./src/utils/index.js",
		});
		strictEqual(graph.package.main, "./index.js");
		strictEqual(graph.package.module, undefined);
		strictEqual(graph.package.isValidated, true);
		strictEqual(graph.package.validationIssues.length, 0);

		// Verify modules
		strictEqual(graph.modules.size, 2);
		strictEqual(graph.modules.has("index"), true);
		strictEqual(graph.modules.has("src/utils/index"), true);

		// Verify index module
		const indexModule = graph.modules.get("index");
		strictEqual(indexModule.id, "index");
		strictEqual(indexModule.path, "index.js");
		deepStrictEqual(indexModule.exports.sort(), ["VERSION", "welcome"]);
		strictEqual(indexModule.imports.length, 0);

		// Verify utils module
		const utilsModule = graph.modules.get("src/utils/index");
		strictEqual(utilsModule.id, "src/utils/index");
		strictEqual(utilsModule.path, "src/utils/index.js");
		deepStrictEqual(utilsModule.exports.sort(), ["UtilsClass", "processInput"]);
		strictEqual(utilsModule.imports.length, 1);
		deepStrictEqual(utilsModule.imports[0], {
			source: "../../index.js",
			specifiers: [
				{
					type: "named",
					imported: "VERSION",
					local: "VERSION",
				},
			],
			isDefault: false,
		});

		// Verify entities
		const entityIds = Array.from(graph.entities.keys()).sort();
		strictEqual(entityIds.length >= 4, true); // At least welcome, VERSION, processInput, UtilsClass

		// Check specific entities
		const welcomeEntity = graph.entities.get("index/welcome");
		strictEqual(welcomeEntity?.entityType, "function");
		strictEqual(welcomeEntity?.name, "welcome");
		strictEqual(welcomeEntity?.moduleId, "index");
		strictEqual(
			welcomeEntity?.jsdocTags?.find((tag) => tag.tagType === "description")
				?.content,
			"Main entry point",
		);

		const versionEntity = graph.entities.get("index/VERSION");
		strictEqual(versionEntity?.entityType, "variable");
		strictEqual(versionEntity?.name, "VERSION");
		strictEqual(versionEntity?.moduleId, "index");

		const processInputEntity = graph.entities.get(
			"src/utils/index/processInput",
		);
		strictEqual(processInputEntity?.entityType, "function");
		strictEqual(processInputEntity?.name, "processInput");
		strictEqual(processInputEntity?.moduleId, "src/utils/index");
		strictEqual(
			processInputEntity?.jsdocTags?.find(
				(tag) => tag.tagType === "description",
			)?.content,
			"Utility helper function",
		);

		const utilsClassEntity = graph.entities.get("src/utils/index/UtilsClass");
		strictEqual(utilsClassEntity?.entityType, "class");
		strictEqual(utilsClassEntity?.name, "UtilsClass");
		strictEqual(utilsClassEntity?.moduleId, "src/utils/index");

		// Verify README data
		strictEqual(graph.readmes.size, 2);
		strictEqual(graph.readmes.has("root"), true);
		strictEqual(graph.readmes.has("src/utils"), true);

		const rootReadmeData = graph.readmes.get("root");
		strictEqual(rootReadmeData.path, "README.md");
		strictEqual(rootReadmeData.content, rootReadme);
		strictEqual(rootReadmeData.directory, ".");
		deepStrictEqual(rootReadmeData.assetIds, []);

		const utilsReadmeData = graph.readmes.get("src/utils");
		strictEqual(utilsReadmeData.path, "src/utils/README.md");
		strictEqual(utilsReadmeData.content, utilsReadme);
		strictEqual(utilsReadmeData.directory, "src/utils");
		deepStrictEqual(utilsReadmeData.assetIds, []);

		// Verify assets (should be empty for now)
		strictEqual(graph.assets.size, 0);

		// Test empty package
		const emptyPackage = "/tmp/glean-empty-test";
		await rm(emptyPackage, { recursive: true, force: true });
		await mkdir(emptyPackage, { recursive: true });

		const emptyPackageJson = {
			name: "empty-package",
			version: "0.0.1",
		};

		const emptyDiscovery = {
			files: [],
			readmes: [],
			packageJson: emptyPackageJson,
			entryPoints: [],
		};

		const emptyGraph = await extractDocumentationGraph(
			emptyPackage,
			emptyDiscovery,
		);

		strictEqual(emptyGraph.package.name, "empty-package");
		strictEqual(emptyGraph.package.version, "0.0.1");
		strictEqual(emptyGraph.modules.size, 0);
		strictEqual(emptyGraph.entities.size, 0);
		strictEqual(emptyGraph.readmes.size, 0);
		strictEqual(emptyGraph.assets.size, 0);

		await rm(emptyPackage, { recursive: true, force: true });

		// Test package with no package.json
		const noPackageJsonDiscovery = {
			files: [],
			readmes: [],
			packageJson: null,
			entryPoints: [],
		};

		const noPackageJsonGraph = await extractDocumentationGraph(
			testPackage,
			noPackageJsonDiscovery,
		);

		// Verify package metadata with null packageJson
		strictEqual(noPackageJsonGraph.package.constructor.name, "PackageEntity");
		strictEqual(noPackageJsonGraph.package.name, "unknown");
		strictEqual(noPackageJsonGraph.package.version, "0.0.0");
		strictEqual(noPackageJsonGraph.package.description, "");
		deepStrictEqual(noPackageJsonGraph.package.exports, {});
		strictEqual(noPackageJsonGraph.package.main, undefined);
		strictEqual(noPackageJsonGraph.package.module, undefined);
	} finally {
		// Cleanup
		await rm(testPackage, { recursive: true, force: true });
	}
});

test("buildEntityReferences - comprehensive branch coverage", () => {
	// Test the placeholder function
	const mockGraph = {
		package: { name: "test" },
		modules: {},
		entities: {},
		readmes: {},
		assets: {},
	};

	// Should not throw and should handle gracefully
	buildEntityReferences(mockGraph);

	// Since it's a placeholder, the graph should remain unchanged
	deepStrictEqual(mockGraph, {
		package: { name: "test" },
		modules: {},
		entities: {},
		readmes: {},
		assets: {},
	});

	// Test with populated graph
	const populatedGraph = {
		package: { name: "test" },
		modules: {
			"test-module": { id: "test-module" },
		},
		entities: {
			entity1: { id: "entity1", references: [], referencedBy: [] },
			entity2: { id: "entity2", references: [], referencedBy: [] },
		},
		readmes: {},
		assets: {},
	};

	buildEntityReferences(populatedGraph);

	// References should remain empty since it's a placeholder implementation
	deepStrictEqual(populatedGraph.entities.entity1.references, []);
	deepStrictEqual(populatedGraph.entities.entity1.referencedBy, []);
	deepStrictEqual(populatedGraph.entities.entity2.references, []);
	deepStrictEqual(populatedGraph.entities.entity2.referencedBy, []);
});
