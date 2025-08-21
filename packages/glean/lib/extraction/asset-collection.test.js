/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok, strictEqual } from "node:assert";
import { mkdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { DocumentationGraph } from "../models/documentation-graph.js";
import { FunctionEntity } from "../models/function-entity.js";
import { PackageEntity } from "../models/package-entity.js";
import { ReadmeContentEntity } from "../models/readme-content-entity.js";
import { discoverDocumentationAssets } from "./asset-collection.js";

// Test setup: Create test files for validation
const testPackagePath = join(process.cwd(), "test-assets-temp");
const testAssetsDir = join(testPackagePath, "assets");
const testDocsDir = join(testPackagePath, "docs");

before(async () => {
	// Create test directory structure
	await mkdir(testPackagePath, { recursive: true });
	await mkdir(testAssetsDir, { recursive: true });
	await mkdir(testDocsDir, { recursive: true });

	// Create test asset files with real headers for metadata extraction testing

	// Create a minimal PNG file (1x1 pixel, transparent)
	const pngData = Buffer.from([
		0x89,
		0x50,
		0x4e,
		0x47,
		0x0d,
		0x0a,
		0x1a,
		0x0a, // PNG signature
		0x00,
		0x00,
		0x00,
		0x0d, // IHDR chunk length
		0x49,
		0x48,
		0x44,
		0x52, // IHDR
		0x00,
		0x00,
		0x00,
		0x64, // Width: 100
		0x00,
		0x00,
		0x00,
		0x32, // Height: 50
		0x08,
		0x06,
		0x00,
		0x00,
		0x00, // Bit depth, color type, etc.
		0x48,
		0xe5,
		0x83,
		0x91, // CRC
		// Minimal data and IEND chunk
		0x00,
		0x00,
		0x00,
		0x00,
		0x49,
		0x45,
		0x4e,
		0x44,
		0xae,
		0x42,
		0x60,
		0x82,
	]);
	await writeFile(join(testAssetsDir, "logo.png"), pngData);

	// Create a minimal JPEG file
	const jpegData = Buffer.from([
		0xff,
		0xd8, // JPEG signature
		0xff,
		0xe0,
		0x00,
		0x10, // JFIF marker
		0x4a,
		0x46,
		0x49,
		0x46,
		0x00,
		0x01,
		0x01,
		0x01,
		0x00,
		0x48,
		0x00,
		0x48,
		0x00,
		0x00,
		0xff,
		0xc0,
		0x00,
		0x11, // SOF0 marker
		0x08, // Precision
		0x00,
		0x96, // Height: 150
		0x00,
		0xc8, // Width: 200
		0x03,
		0x01,
		0x22,
		0x00,
		0x02,
		0x11,
		0x01,
		0x03,
		0x11,
		0x01,
		0xff,
		0xd9, // End of image
	]);
	await writeFile(join(testDocsDir, "diagram.jpg"), jpegData);

	// Create an SVG file with dimensions
	const svgContent = `<svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="50" r="40" fill="red"/>
	</svg>`;
	await writeFile(join(testAssetsDir, "icon.svg"), svgContent);

	// Create other test files
	await writeFile(join(testDocsDir, "tutorial.pdf"), "fake-pdf-data");
	await writeFile(join(testPackagePath, "README.md"), "# Test");
	await writeFile(join(testDocsDir, "config.json"), '{"test": true}');
	await writeFile(join(testAssetsDir, "archive.zip"), "fake-zip-data");
});

after(async () => {
	// Clean up test files
	try {
		await unlink(join(testAssetsDir, "logo.png"));
		await unlink(join(testAssetsDir, "icon.svg"));
		await unlink(join(testAssetsDir, "archive.zip"));
		await unlink(join(testDocsDir, "tutorial.pdf"));
		await unlink(join(testDocsDir, "diagram.jpg"));
		await unlink(join(testDocsDir, "config.json"));
		await unlink(join(testPackagePath, "README.md"));
		await rmdir(testAssetsDir);
		await rmdir(testDocsDir);
		await rmdir(testPackagePath);
	} catch (_error) {
		// Ignore cleanup errors
	}
});

test("discoverDocumentationAssets - basic functionality", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
		description: "Test package for asset discovery",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Test with empty graph
	const assets = await discoverDocumentationAssets(graph, "/test/package");
	strictEqual(Array.isArray(assets), true);
	strictEqual(assets.length, 0);
});

test("discoverDocumentationAssets - markdown image discovery", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create README with image references
	const readmeContent = `# Test Package

Here's an image:
![Logo](./assets/logo.png)

And another one:
![Screenshot](./docs/screenshot.jpg "Screenshot title")

External image (should be ignored):
![External](https://example.com/image.png)
`;

	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, "/test/package");

	strictEqual(assets.length, 2);
	strictEqual(assets[0].path, "./assets/logo.png");
	strictEqual(assets[0].altText, "Logo");
	strictEqual(assets[0].referenceType, "image");
	strictEqual(assets[1].path, "./docs/screenshot.jpg");
	strictEqual(assets[1].altText, "Screenshot");
});

test("discoverDocumentationAssets - markdown file links", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const readmeContent = `# Documentation

Download the [configuration file](./config/app.json).
See the [API documentation](./docs/api.md).
Visit our [website](https://example.com) (external link).
Go to [section](#section) (anchor link).
`;

	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, "/test/package");

	strictEqual(assets.length, 2);
	strictEqual(assets[0].path, "./config/app.json");
	strictEqual(assets[0].linkText, "configuration file");
	strictEqual(assets[0].referenceType, "file");
	strictEqual(assets[1].path, "./docs/api.md");
	strictEqual(assets[1].linkText, "API documentation");
});

test("discoverDocumentationAssets - reference-style images", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const readmeContent = `# Test Package

Here's a referenced image: ![Logo][logo-ref]
Another reference: ![Icon][icon]

[logo-ref]: ./assets/logo.png
[icon]: ./assets/icon.svg
[external]: https://example.com/image.png
`;

	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, "/test/package");

	strictEqual(assets.length, 2);
	strictEqual(assets[0].path, "./assets/logo.png");
	strictEqual(assets[0].altText, "Logo");
	strictEqual(assets[0].referenceType, "image-ref");
	strictEqual(assets[1].path, "./assets/icon.svg");
	strictEqual(assets[1].altText, "Icon");
});

test("discoverDocumentationAssets - JSDoc assets", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create function with JSDoc containing assets
	const func = new FunctionEntity("func", "testFunction");
	func.location = { file: "./src/test.js", line: 10, column: 0 };

	// Mock JSDoc tags with asset references
	func.getAllJSDocTags = () => [
		{
			tagType: "example",
			content: "Usage example:\n![Example](./examples/usage.png)",
		},
		{
			tagType: "see",
			reference: "./docs/tutorial.pdf",
		},
		{
			tagType: "see",
			reference: "https://external-docs.com", // Should be ignored
		},
		{
			tagType: "description",
			description: "Function with [diagram](./diagrams/flow.svg)",
		},
	];

	graph.addEntity(func);

	const assets = await discoverDocumentationAssets(graph, "/test/package");

	strictEqual(assets.length, 3);

	// Find assets by path for testing
	const exampleAsset = assets.find((a) => a.path === "./examples/usage.png");
	const tutorialAsset = assets.find((a) => a.path === "./docs/tutorial.pdf");
	const diagramAsset = assets.find((a) => a.path === "./diagrams/flow.svg");

	strictEqual(exampleAsset?.referenceType, "image");
	strictEqual(tutorialAsset?.referenceType, "jsdoc-see");
	strictEqual(diagramAsset?.referenceType, "file");
});

test("discoverDocumentationAssets - duplicate asset handling", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create multiple sources referencing the same asset
	const readme1 = new ReadmeContentEntity("readme1", "./README.md");
	readme1.setContent("![Logo](./assets/logo.png)");
	graph.addContent(readme1);

	const readme2 = new ReadmeContentEntity("readme2", "./docs/README.md");
	readme2.setContent("![Same Logo](./assets/logo.png)");
	graph.addContent(readme2);

	const assets = await discoverDocumentationAssets(graph, "/test/package");

	// Should only have one asset (deduplication)
	strictEqual(assets.length, 1);
	strictEqual(assets[0].path, "./assets/logo.png");
});

test("discoverDocumentationAssets - entities without JSDoc", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create function without JSDoc methods
	const func = new FunctionEntity("func", "plainFunction");
	// No getAllJSDocTags method

	graph.addEntity(func);

	// Should handle gracefully
	const assets = await discoverDocumentationAssets(graph, "/test/package");
	strictEqual(assets.length, 0);
});

test("discoverDocumentationAssets - empty content handling", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create README with no content
	const readme = new ReadmeContentEntity("readme", "./README.md");
	// No content set
	graph.addContent(readme);

	// Create function with empty JSDoc
	const func = new FunctionEntity("func", "testFunction");
	func.getAllJSDocTags = () => [];
	graph.addEntity(func);

	const assets = await discoverDocumentationAssets(graph, "/test/package");
	strictEqual(assets.length, 0);
});

test("discoverDocumentationAssets - asset metadata", async () => {
	const packageData = {
		name: "@test/asset-discovery",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const readmeContent = `![Logo](./logo.png)`;
	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, "/test/package");

	strictEqual(assets.length, 1);
	const asset = assets[0];

	// Check metadata
	strictEqual(asset.sourceFile, "./README.md");
	strictEqual(asset.contexts.includes("./README.md"), true);
	strictEqual(typeof asset.getId(), "string");
	strictEqual(asset.getId().startsWith("asset_"), true);
});

test("discoverDocumentationAssets - path resolution and validation", async () => {
	const packageData = {
		name: "@test/path-resolution",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create README with references to real test files
	const readmeContent = `# Test Package

Existing assets:
![Logo](./assets/logo.png)
![Icon](./assets/icon.svg)
[Tutorial](./docs/tutorial.pdf)

Non-existing assets:
![Missing](./assets/missing.png)
[Missing Doc](./docs/missing.pdf)
`;

	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, testPackagePath);

	strictEqual(assets.length, 5);

	// Check valid assets
	const logoAsset = assets.find((a) => a.path === "./assets/logo.png");
	const iconAsset = assets.find((a) => a.path === "./assets/icon.svg");
	const tutorialAsset = assets.find((a) => a.path === "./docs/tutorial.pdf");

	// Check invalid assets
	const missingImageAsset = assets.find(
		(a) => a.path === "./assets/missing.png",
	);
	const missingDocAsset = assets.find((a) => a.path === "./docs/missing.pdf");

	// Validate existing assets
	strictEqual(logoAsset.isValidated, true);
	strictEqual(logoAsset.resolvedPath.includes("logo.png"), true);
	strictEqual(logoAsset.size > 0, true);
	ok(logoAsset.lastModified instanceof Date);
	strictEqual(logoAsset.validationIssues.length, 0);

	strictEqual(iconAsset.isValidated, true);
	strictEqual(iconAsset.resolvedPath.includes("icon.svg"), true);

	strictEqual(tutorialAsset.isValidated, true);
	strictEqual(tutorialAsset.resolvedPath.includes("tutorial.pdf"), true);

	// Validate missing assets
	strictEqual(missingImageAsset.isValidated, false);
	strictEqual(missingImageAsset.validationIssues.length, 1);
	strictEqual(missingImageAsset.validationIssues[0].type, "file_not_found");

	strictEqual(missingDocAsset.isValidated, false);
	strictEqual(missingDocAsset.validationIssues.length, 1);
	strictEqual(missingDocAsset.validationIssues[0].type, "file_not_found");
});

test("discoverDocumentationAssets - relative path resolution", async () => {
	const packageData = {
		name: "@test/relative-paths",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create content with relative path from subdirectory
	const docsReadmeContent = `![Diagram](../assets/logo.png)`;
	const docsReadme = new ReadmeContentEntity("docs-readme", "./docs/README.md");
	docsReadme.setContent(docsReadmeContent);
	graph.addContent(docsReadme);

	const assets = await discoverDocumentationAssets(graph, testPackagePath);

	strictEqual(assets.length, 1);
	const diagramAsset = assets[0];

	// Should resolve ../assets/logo.png from ./docs/README.md to the correct file
	strictEqual(diagramAsset.path, "../assets/logo.png");
	strictEqual(diagramAsset.isValidated, true);
	strictEqual(diagramAsset.resolvedPath.includes("logo.png"), true);
});

test("discoverDocumentationAssets - absolute path handling", async () => {
	const packageData = {
		name: "@test/absolute-paths",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create content with absolute path to existing test file
	const absolutePath = join(testAssetsDir, "logo.png");
	const readmeContent = `![Logo](${absolutePath})`;
	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, testPackagePath);

	strictEqual(assets.length, 1);
	const logoAsset = assets[0];

	// Should handle absolute paths correctly
	strictEqual(logoAsset.path, absolutePath);
	strictEqual(logoAsset.resolvedPath, absolutePath);
	strictEqual(logoAsset.isValidated, true);
});

test("discoverDocumentationAssets - validation error handling", async () => {
	const packageData = {
		name: "@test/error-handling",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create content with problematic path (should cause validation error)
	const readmeContent = `![Test](./\x00invalid\x00path.png)`;
	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, testPackagePath);

	strictEqual(assets.length, 1);
	const asset = assets[0];

	// Should handle validation errors gracefully
	strictEqual(asset.isValidated, false);
	strictEqual(asset.validationIssues.length, 1);
	strictEqual(asset.validationIssues[0].type, "file_not_found");
});

test("discoverDocumentationAssets - enhanced metadata extraction", async () => {
	const packageData = {
		name: "@test/enhanced-metadata",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create README with various asset types
	const readmeContent = `# Enhanced Metadata Test

Images with dimensions:
![PNG Logo](./assets/logo.png)
![SVG Icon](./assets/icon.svg)
![JPEG Diagram](./docs/diagram.jpg)

Documents and archives:
[PDF Tutorial](./docs/tutorial.pdf)
[JSON Config](./docs/config.json)
[ZIP Archive](./assets/archive.zip)
`;

	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, testPackagePath);

	strictEqual(assets.length, 6);

	// Test PNG image metadata
	const pngAsset = assets.find((a) => a.path === "./assets/logo.png");
	strictEqual(pngAsset.isValidated, true);
	strictEqual(pngAsset.mimeType, "image/png");
	strictEqual(pngAsset.contentCategory, "image");
	strictEqual(pngAsset.width, 100);
	strictEqual(pngAsset.height, 50);

	// Test SVG image metadata
	const svgAsset = assets.find((a) => a.path === "./assets/icon.svg");
	strictEqual(svgAsset.isValidated, true);
	strictEqual(svgAsset.mimeType, "image/svg+xml");
	strictEqual(svgAsset.contentCategory, "image");
	strictEqual(svgAsset.width, 300);
	strictEqual(svgAsset.height, 150);

	// Test JPEG image metadata
	const jpegAsset = assets.find((a) => a.path === "./docs/diagram.jpg");
	strictEqual(jpegAsset.isValidated, true);
	strictEqual(jpegAsset.mimeType, "image/jpeg");
	strictEqual(jpegAsset.contentCategory, "image");
	strictEqual(jpegAsset.width, 200);
	strictEqual(jpegAsset.height, 150);

	// Test PDF document metadata
	const pdfAsset = assets.find((a) => a.path === "./docs/tutorial.pdf");
	strictEqual(pdfAsset.isValidated, true);
	strictEqual(pdfAsset.mimeType, "application/pdf");
	strictEqual(pdfAsset.contentCategory, "document");
	strictEqual(pdfAsset.width, null);
	strictEqual(pdfAsset.height, null);

	// Test JSON file metadata
	const jsonAsset = assets.find((a) => a.path === "./docs/config.json");
	strictEqual(jsonAsset.isValidated, true);
	strictEqual(jsonAsset.mimeType, "application/json");
	strictEqual(jsonAsset.contentCategory, "text");

	// Test ZIP archive metadata
	const zipAsset = assets.find((a) => a.path === "./assets/archive.zip");
	strictEqual(zipAsset.isValidated, true);
	strictEqual(zipAsset.mimeType, "application/zip");
	strictEqual(zipAsset.contentCategory, "archive");
});

test("discoverDocumentationAssets - content categorization", async () => {
	const packageData = {
		name: "@test/content-categories",
		version: "1.0.0",
	};
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Test existing files with various categories
	const readmeContent = `# Content Category Test

Images:
![PNG Logo](./assets/logo.png)
![SVG Icon](./assets/icon.svg)

Documents:
[PDF Tutorial](./docs/tutorial.pdf)

Text/Data:
[JSON Config](./docs/config.json)

Archives:
[ZIP Archive](./assets/archive.zip)
`;

	const readme = new ReadmeContentEntity("readme", "./README.md");
	readme.setContent(readmeContent);
	graph.addContent(readme);

	const assets = await discoverDocumentationAssets(graph, testPackagePath);

	// Verify content categories are correctly assigned
	const imageAssets = assets.filter((a) => a.contentCategory === "image");
	const documentAssets = assets.filter((a) => a.contentCategory === "document");
	const textAssets = assets.filter((a) => a.contentCategory === "text");
	const archiveAssets = assets.filter((a) => a.contentCategory === "archive");

	strictEqual(imageAssets.length, 2); // PNG and SVG
	strictEqual(documentAssets.length, 1); // PDF
	strictEqual(textAssets.length, 1); // JSON
	strictEqual(archiveAssets.length, 1); // ZIP

	// Verify specific category assignments
	const pngAsset = assets.find((a) => a.path === "./assets/logo.png");
	strictEqual(pngAsset.contentCategory, "image");

	const pdfAsset = assets.find((a) => a.path === "./docs/tutorial.pdf");
	strictEqual(pdfAsset.contentCategory, "document");

	const jsonAsset = assets.find((a) => a.path === "./docs/config.json");
	strictEqual(jsonAsset.contentCategory, "text");

	const zipAsset = assets.find((a) => a.path === "./assets/archive.zip");
	strictEqual(zipAsset.contentCategory, "archive");
});
