/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file README content entity model tests - comprehensive validation coverage.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { ReadmeContentEntity } from "./readme-content-entity.js";

test("ReadmeContentEntity - constructor initialization", () => {
	const content = new ReadmeContentEntity(
		"test-readme",
		"/path/to/README.md",
		"/path/to",
	);

	strictEqual(content.id, "test-readme");
	strictEqual(content.path, "/path/to/README.md");
	strictEqual(content.directory, "/path/to");
	strictEqual(content.content, "");
	strictEqual(content.rawContent, "");
	deepStrictEqual(content.headings, []);
	deepStrictEqual(content.links, []);
	deepStrictEqual(content.images, []);
	deepStrictEqual(content.codeBlocks, []);
	deepStrictEqual(content.assetIds, []);
	deepStrictEqual(content.missingAssets, []);
	strictEqual(content.wordCount, 0);
	strictEqual(content.lineCount, 0);
	strictEqual(content.lastModified, null);
	strictEqual(content.language, "en");
	deepStrictEqual(content.entityReferences, []);
	deepStrictEqual(content.moduleReferences, []);
	strictEqual(content.isValidated, false);
	deepStrictEqual(content.validationIssues, []);
});

test("ReadmeContentEntity - getId returns content ID", () => {
	const content = new ReadmeContentEntity("test-id", "/path", "/dir");
	strictEqual(content.getId(), "test-id");
});

test("ReadmeContentEntity - setContent with comprehensive markdown", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	const markdown = `# Main Heading

This is a paragraph with a [link](https://example.com) and an ![image](./test.png).

## Secondary Heading

Here's a list:
- Item 1
- Item 2

\`\`\`javascript
const test = "hello world";
console.log(test);
\`\`\`

### Third Heading

More content with **bold** and *italic* text.

[Internal link](../other.md) and [anchor link](#main-heading).

![Another image](./assets/logo.svg "Logo")`;

	content.setContent(markdown);

	strictEqual(content.content, markdown);
	strictEqual(content.rawContent, markdown);
	strictEqual(content.lineCount, 22);
	strictEqual(content.wordCount, 51);

	// Verify headings
	strictEqual(content.headings.length, 3);
	strictEqual(content.headings[0].level, 1);
	strictEqual(content.headings[0].title, "Main Heading");
	strictEqual(content.headings[0].id, "main-heading");
	strictEqual(content.headings[1].level, 2);
	strictEqual(content.headings[1].title, "Secondary Heading");
	strictEqual(content.headings[2].level, 3);
	strictEqual(content.headings[2].title, "Third Heading");

	// Verify links
	strictEqual(content.links.length, 3);
	strictEqual(content.links[0].type, "external");
	strictEqual(content.links[0].url, "https://example.com");
	strictEqual(content.links[0].text, "link");
	strictEqual(content.links[1].type, "internal");
	strictEqual(content.links[1].url, "../other.md");
	strictEqual(content.links[2].type, "anchor");
	strictEqual(content.links[2].url, "#main-heading");

	// Verify images
	strictEqual(content.images.length, 2);
	strictEqual(content.images[0].src, "./test.png");
	strictEqual(content.images[0].alt, "image");
	strictEqual(content.images[1].src, './assets/logo.svg "Logo"');
	strictEqual(content.images[1].alt, "Another image");

	// Verify code blocks
	strictEqual(content.codeBlocks.length, 1);
	strictEqual(content.codeBlocks[0].language, "javascript");
	strictEqual(content.codeBlocks[0].content.includes("const test"), true);
});

test("ReadmeContentEntity - setContent with empty content", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	content.setContent("");

	strictEqual(content.content, "");
	strictEqual(content.lineCount, 1);
	strictEqual(content.wordCount, 0);
	deepStrictEqual(content.headings, []);
	deepStrictEqual(content.links, []);
	deepStrictEqual(content.images, []);
	deepStrictEqual(content.codeBlocks, []);
});

test("ReadmeContentEntity - parseContent with no content", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	content.parseContent(); // Should not crash with empty content

	strictEqual(content.lineCount, 1); // Empty string gets parsed as 1 line
	strictEqual(content.wordCount, 0);
});

test("ReadmeContentEntity - parseContent with null content", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.content = null;

	content.parseContent(); // Should not crash with null content

	strictEqual(content.lineCount, 0); // Should remain 0, not parsed
	strictEqual(content.wordCount, 0);
});

test("ReadmeContentEntity - parseContent with undefined content", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.content = undefined;

	content.parseContent(); // Should not crash with undefined content

	strictEqual(content.lineCount, 0); // Should remain 0, not parsed
	strictEqual(content.wordCount, 0);
});

test("ReadmeContentEntity - addAssetReference", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	content.addAssetReference("asset1");
	content.addAssetReference("asset2");
	content.addAssetReference("asset1"); // Duplicate

	deepStrictEqual(content.assetIds, ["asset1", "asset2"]);
});

test("ReadmeContentEntity - addMissingAsset", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	content.addMissingAsset("./missing1.png");
	content.addMissingAsset("./missing2.jpg");
	content.addMissingAsset("./missing1.png"); // Duplicate

	deepStrictEqual(content.missingAssets, ["./missing1.png", "./missing2.jpg"]);
});

test("ReadmeContentEntity - addEntityReference", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	content.addEntityReference("entity1");
	content.addEntityReference("entity2");
	content.addEntityReference("entity1"); // Duplicate

	deepStrictEqual(content.entityReferences, ["entity1", "entity2"]);
});

test("ReadmeContentEntity - addModuleReference", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	content.addModuleReference("module1");
	content.addModuleReference("module2");
	content.addModuleReference("module1"); // Duplicate

	deepStrictEqual(content.moduleReferences, ["module1", "module2"]);
});

test("ReadmeContentEntity - setMetadata", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	const lastModified = new Date();

	content.setMetadata({
		lastModified,
		language: "fr",
	});

	strictEqual(content.lastModified, lastModified);
	strictEqual(content.language, "fr");
});

test("ReadmeContentEntity - setMetadata with partial values", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	content.setMetadata({ language: "es" });
	strictEqual(content.language, "es");
	strictEqual(content.lastModified, null);

	const date = new Date();
	content.setMetadata({ lastModified: date });
	strictEqual(content.lastModified, date);
	strictEqual(content.language, "es");
});

test("ReadmeContentEntity - getStatistics", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.setContent(`# Heading
[Link](https://example.com)
![Image](./test.png)
\`\`\`js
code
\`\`\``);
	content.addAssetReference("asset1");
	content.addAssetReference("asset2");

	const stats = content.getStatistics();

	strictEqual(stats.headingCount, 1);
	strictEqual(stats.linkCount, 1);
	strictEqual(stats.imageCount, 1);
	strictEqual(stats.codeBlockCount, 1);
	strictEqual(stats.assetCount, 2);
});

test("ReadmeContentEntity - getTableOfContents", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.setContent(`# Introduction
## Getting Started
### Installation
## Configuration
# Advanced Usage`);

	const toc = content.getTableOfContents();

	strictEqual(toc.length, 5);
	strictEqual(toc[0].level, 1);
	strictEqual(toc[0].title, "Introduction");
	strictEqual(toc[0].id, "introduction");
	strictEqual(toc[1].level, 2);
	strictEqual(toc[1].title, "Getting Started");
	strictEqual(toc[1].id, "getting-started");
	strictEqual(toc[2].level, 3);
	strictEqual(toc[2].title, "Installation");
	strictEqual(toc[2].id, "installation");
});

test("ReadmeContentEntity - validate with missing ID", () => {
	const content = new ReadmeContentEntity("", "/path", "/dir");

	content.validate();

	strictEqual(content.isValidated, false);
	strictEqual(
		content.validationIssues.some((issue) => issue.type === "missing_id"),
		true,
	);
	strictEqual(content.isValid(), false);
});

test("ReadmeContentEntity - validate with missing path", () => {
	const content = new ReadmeContentEntity("test", "", "/dir");

	content.validate();

	strictEqual(content.isValidated, false);
	strictEqual(
		content.validationIssues.some((issue) => issue.type === "missing_path"),
		true,
	);
});

test("ReadmeContentEntity - validateContentStructure with heading hierarchy issues", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.setContent(`# H1
### H3 (skipped H2)
## H2`);

	content.validate();

	strictEqual(content.isValidated, false);
	strictEqual(
		content.validationIssues.some(
			(issue) => issue.type === "heading_hierarchy",
		),
		true,
	);
});

test("ReadmeContentEntity - validateContentStructure with duplicate heading IDs", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.setContent(`# Test
## Test`); // Both generate "test" ID

	content.validate();

	strictEqual(content.isValidated, false);
	strictEqual(
		content.validationIssues.some(
			(issue) => issue.type === "duplicate_heading_ids",
		),
		true,
	);
});

test("ReadmeContentEntity - validateReferences with broken anchor links", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.setContent(`# Valid Heading
[Good link](#valid-heading)
[Broken link](#nonexistent)`);

	content.validate();

	strictEqual(content.isValidated, false);
	strictEqual(
		content.validationIssues.some((issue) => issue.type === "broken_anchor"),
		true,
	);

	// Find the specific broken anchor issue
	const brokenAnchor = content.validationIssues.find(
		(issue) => issue.type === "broken_anchor",
	);
	strictEqual(brokenAnchor.message.includes("#nonexistent"), true);
});

test("ReadmeContentEntity - validateReferences with missing assets", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.addMissingAsset("./missing.png");
	content.addMissingAsset("./another-missing.jpg");

	content.validate();

	strictEqual(content.isValidated, false);
	strictEqual(
		content.validationIssues.filter((issue) => issue.type === "missing_asset")
			.length,
		2,
	);
});

test("ReadmeContentEntity - validate with all valid content", () => {
	const content = new ReadmeContentEntity("test", "/path/README.md", "/path");
	content.setContent(`# Valid Heading
This is [a link](#valid-heading) that works.
No missing assets or broken references.`);

	content.validate();

	strictEqual(content.isValidated, true);
	strictEqual(content.validationIssues.length, 0);
	strictEqual(content.isValid(), true);
});

test("ReadmeContentEntity - getSerializableData", () => {
	const content = new ReadmeContentEntity("test", "/path/README.md", "/path");
	content.setContent("# Test\nContent here");
	content.addAssetReference("asset1");
	content.addEntityReference("entity1");
	content.addModuleReference("module1");
	content.setMetadata({ language: "en" });

	const data = content.getSerializableData();

	strictEqual(data.id, "test");
	strictEqual(data.path, "/path/README.md");
	strictEqual(data.directory, "/path");
	strictEqual(data.content, "# Test\nContent here");
	strictEqual(Array.isArray(data.headings), true);
	strictEqual(Array.isArray(data.links), true);
	strictEqual(Array.isArray(data.images), true);
	strictEqual(Array.isArray(data.codeBlocks), true);
	deepStrictEqual(data.assetIds, ["asset1"]);
	deepStrictEqual(data.entityReferences, ["entity1"]);
	deepStrictEqual(data.moduleReferences, ["module1"]);
	strictEqual(data.language, "en");
	strictEqual(typeof data.statistics, "object");
});

test("ReadmeContentEntity - toJSON", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	const json = content.toJSON();

	strictEqual(json.__type, "readme-content");
	strictEqual(typeof json.__data, "object");
	strictEqual(json.__data.id, "test");
});

test("ReadmeContentEntity - toHTML with comprehensive content", () => {
	const content = new ReadmeContentEntity("test", "/path/README.md", "/path");
	content.setContent(`# Main Title
## Section 1
Content with [link](https://example.com) and ![image](./test.png).
\`\`\`js
console.log("test");
\`\`\``);
	content.addAssetReference("asset1");
	content.addAssetReference("asset2");

	const html = content.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("README.md"), true);
	strictEqual(html.includes("/path"), true);
	strictEqual(html.includes("words"), true);
	strictEqual(html.includes("lines"), true);
	strictEqual(html.includes("Table of Contents"), true);
	strictEqual(html.includes("Main Title"), true);
	strictEqual(html.includes("Section 1"), true);
	strictEqual(html.includes("Referenced Assets"), true);
	strictEqual(html.includes("asset1"), true);
	strictEqual(html.includes("asset2"), true);
});

test("ReadmeContentEntity - toHTML without optional content", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.setContent("Simple content without headings or assets");

	const html = content.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("Table of Contents"), false);
	strictEqual(html.includes("Referenced Assets"), false);
	strictEqual(html.includes("Missing Assets"), false);
});

test("ReadmeContentEntity - toHTML with missing assets", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.addMissingAsset("./missing1.png");
	content.addMissingAsset("./missing2.jpg");

	const html = content.toHTML();

	strictEqual(html.includes("Missing Assets"), true);
	strictEqual(html.includes("missing1.png"), true);
	strictEqual(html.includes("missing2.jpg"), true);
});

test("ReadmeContentEntity - toMarkdown comprehensive", () => {
	const content = new ReadmeContentEntity("test", "/path/README.md", "/docs");
	content.setContent(`# Title
## Section
Content here.`);
	content.addAssetReference("asset1");

	const markdown = content.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(markdown.includes("## /path/README.md"), true);
	strictEqual(markdown.includes("**Directory:** `/docs`"), true);
	strictEqual(markdown.includes("**Words:**"), true);
	strictEqual(markdown.includes("**Lines:**"), true);
	strictEqual(markdown.includes("**Statistics:**"), true);
	strictEqual(markdown.includes("**Table of Contents:**"), true);
	strictEqual(markdown.includes("- [Title](#title)"), true);
	strictEqual(markdown.includes("- [Section](#section)"), true);
	strictEqual(markdown.includes("**Referenced Assets:**"), true);
	strictEqual(markdown.includes("- `asset1`"), true);
});

test("ReadmeContentEntity - toMarkdown without optional content", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");
	content.setContent("No headings or assets");

	const markdown = content.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(markdown.includes("**Table of Contents:**"), false);
	strictEqual(markdown.includes("**Referenced Assets:**"), false);
});

test("ReadmeContentEntity - edge cases and complex scenarios", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	// Test with complex markdown that might break parsers
	const complexMarkdown = `# Main Title

This has [multiple](http://one.com) [links](http://two.com) in [one](http://three.com) paragraph.

![Image 1](./img1.png) and ![Image 2](./img2.png "With title")

\`\`\`javascript
// Code with complex syntax
const obj = {
  prop: "value",
  method() { return this.prop; }
};
\`\`\`

\`\`\`
// No language specified
plain code block
\`\`\`

## Section with "Quotes" and 'Apostrophes'

### Sub-section with special chars: !@#$%^&*()

#### Deep nesting level 4

##### Even deeper level 5

###### Maximum depth level 6

Links: [relative](./file.md), [absolute](/abs/path), [protocol](ftp://example.com)

Images: ![no-alt](./test.png), ![](./no-alt-text.png), ![with space](./file name.png)`;

	content.setContent(complexMarkdown);

	// Should handle complex content without crashing
	strictEqual(content.headings.length, 6);
	strictEqual(content.links.length, 6);
	strictEqual(content.images.length, 5);
	strictEqual(content.codeBlocks.length, 2);
	strictEqual(content.wordCount > 0, true);
	strictEqual(content.lineCount > 0, true);

	// Test validation doesn't crash
	content.validate();

	// Test serialization works
	const data = content.getSerializableData();
	strictEqual(typeof data, "object");

	// Test HTML generation works
	const html = content.toHTML();
	strictEqual(typeof html, "string");
	strictEqual(html.length > 0, true);

	// Test markdown generation works
	const markdown = content.toMarkdown();
	strictEqual(typeof markdown, "string");
	strictEqual(markdown.length > 0, true);
});

test("ReadmeContentEntity - metadata edge cases", () => {
	const content = new ReadmeContentEntity("test", "/path", "/dir");

	// Test with empty metadata object
	content.setMetadata({});
	strictEqual(content.lastModified, null);
	strictEqual(content.language, "en");

	// Test with undefined values
	content.setMetadata({ lastModified: undefined, language: undefined });
	strictEqual(content.lastModified, null);
	strictEqual(content.language, "en");
});
