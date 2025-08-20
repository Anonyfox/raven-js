/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { NamespaceEntity } from "./namespace-entity.js";

// Mock JSDoc tag objects for testing
function createMockNamespaceTag(name, description = "") {
	return {
		tagType: "namespace",
		name,
		description,
		toJSON: () => ({ __type: "namespace", __data: { name, description } }),
		toHTML: () => `<span>@namespace ${name}</span>`,
		toMarkdown: () => `@namespace ${name}`,
	};
}

function createMockMemberofTag(namespace) {
	return {
		tagType: "memberof",
		name: namespace,
		namespace,
		toJSON: () => ({ __type: "memberof", __data: { namespace } }),
		toHTML: () => `<span>@memberof ${namespace}</span>`,
		toMarkdown: () => `@memberof ${namespace}`,
	};
}

function createMockExampleTag(description) {
	return {
		tagType: "example",
		description,
		toJSON: () => ({ __type: "example", __data: { description } }),
		toHTML: () => `<pre><code>${description}</code></pre>`,
		toMarkdown: () => `\`\`\`javascript\n${description}\n\`\`\``,
	};
}

test("NamespaceEntity - basic namespace entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const namespace = new NamespaceEntity("TestNamespace", location);

	strictEqual(namespace.entityType, "namespace");
	strictEqual(namespace.name, "TestNamespace");
	deepStrictEqual(namespace.location, location);
	strictEqual(namespace.description, "");
	strictEqual(namespace.fullName, "TestNamespace");
	strictEqual(namespace.parentNamespace, null);
	strictEqual(namespace.nestedLevel, 0);
	strictEqual(namespace.isModuleNamespace, false);
	strictEqual(namespace.moduleName, null);
	deepStrictEqual(namespace.members, []);
});

test("NamespaceEntity - valid JSDoc tags", () => {
	const namespace = new NamespaceEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid namespace tags
	strictEqual(namespace.isValidJSDocTag("namespace"), true);
	strictEqual(namespace.isValidJSDocTag("memberof"), true);
	strictEqual(namespace.isValidJSDocTag("example"), true);
	strictEqual(namespace.isValidJSDocTag("since"), true);
	strictEqual(namespace.isValidJSDocTag("deprecated"), true);
	strictEqual(namespace.isValidJSDocTag("see"), true);
	strictEqual(namespace.isValidJSDocTag("author"), true);

	// Invalid tags
	strictEqual(namespace.isValidJSDocTag("param"), false);
	strictEqual(namespace.isValidJSDocTag("returns"), false);
	strictEqual(namespace.isValidJSDocTag("throws"), false);
	strictEqual(namespace.isValidJSDocTag("typedef"), false);
	strictEqual(namespace.isValidJSDocTag("callback"), false);
});

test("NamespaceEntity - simple namespace parsing", () => {
	const namespace = new NamespaceEntity("Utils", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"Utils",
		"Utility functions namespace",
	);
	namespace.parseFromJSDoc(namespaceTag);

	strictEqual(namespace.fullName, "Utils");
	strictEqual(namespace.description, "Utility functions namespace");
	strictEqual(namespace.parentNamespace, null);
	strictEqual(namespace.nestedLevel, 0);
	strictEqual(namespace.isModuleNamespace, false);
	strictEqual(namespace.getSignature(), "@namespace Utils");
});

test("NamespaceEntity - nested namespace parsing", () => {
	const namespace = new NamespaceEntity("Data", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"App.Utils.Data",
		"Data processing utilities",
	);
	namespace.parseFromJSDoc(namespaceTag);

	strictEqual(namespace.fullName, "App.Utils.Data");
	strictEqual(namespace.name, "Data");
	strictEqual(namespace.parentNamespace, "App.Utils");
	strictEqual(namespace.nestedLevel, 2);
	strictEqual(namespace.isModuleNamespace, false);
	strictEqual(namespace.getSignature(), "@namespace App.Utils.Data");
});

test("NamespaceEntity - module namespace parsing", () => {
	const namespace = new NamespaceEntity("myModule", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"module:my-awesome-module",
		"Module namespace",
	);
	namespace.parseFromJSDoc(namespaceTag);

	strictEqual(namespace.fullName, "module:my-awesome-module");
	strictEqual(namespace.name, "my-awesome-module");
	strictEqual(namespace.moduleName, "my-awesome-module");
	strictEqual(namespace.isModuleNamespace, true);
	strictEqual(namespace.nestedLevel, 0);
	strictEqual(namespace.getSignature(), "@namespace module:my-awesome-module");
});

test("NamespaceEntity - namespace with memberof tag", () => {
	const namespace = new NamespaceEntity("Helpers", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag("Helpers", "Helper functions");
	const relatedTags = [createMockMemberofTag("App.Core")];

	namespace.parseFromJSDoc(namespaceTag, relatedTags);

	strictEqual(namespace.fullName, "Helpers");
	strictEqual(namespace.parentNamespace, "App.Core"); // Overridden by @memberof
	strictEqual(namespace.nestedLevel, 0); // Not based on dot notation since memberof overrides
});

test("NamespaceEntity - member management", () => {
	const namespace = new NamespaceEntity("Utils", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Mock member entities
	const functionMember = {
		name: "formatDate",
		entityType: "function",
		id: "Utils.formatDate",
	};
	const classMember = {
		name: "DataProcessor",
		entityType: "class",
		id: "Utils.DataProcessor",
	};

	namespace.addMember(functionMember);
	namespace.addMember(classMember);

	strictEqual(namespace.members.length, 2);

	const addedFunction = namespace.members[0];
	strictEqual(addedFunction.name, "formatDate");
	strictEqual(addedFunction.type, "function");
	strictEqual(addedFunction.id, "Utils.formatDate");

	const addedClass = namespace.members[1];
	strictEqual(addedClass.name, "DataProcessor");
	strictEqual(addedClass.type, "class");
	strictEqual(addedClass.id, "Utils.DataProcessor");
});

test("NamespaceEntity - validation with valid namespace", () => {
	const namespace = new NamespaceEntity("MyNamespace", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"MyNamespace",
		"A well-documented namespace",
	);
	namespace.parseFromJSDoc(namespaceTag);
	namespace.validate();

	strictEqual(namespace.isValid(), true);
	strictEqual(namespace.validationIssues.length, 0);
});

test("NamespaceEntity - validation with missing description", () => {
	const namespace = new NamespaceEntity("EmptyNamespace", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag("EmptyNamespace", ""); // Empty description
	namespace.parseFromJSDoc(namespaceTag);
	namespace.validate();

	strictEqual(namespace.isValid(), true);
	strictEqual(namespace.validationIssues.length, 1);
	strictEqual(namespace.validationIssues[0].type, "missing_description");
});

test("NamespaceEntity - validation with invalid namespace name", () => {
	const namespace = new NamespaceEntity("badNamespace", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"badNamespace",
		"Invalid naming convention",
	);
	namespace.parseFromJSDoc(namespaceTag);
	namespace.validate();

	strictEqual(namespace.validationIssues.length, 1);
	strictEqual(namespace.validationIssues[0].type, "invalid_namespace_name");
});

test("NamespaceEntity - validation with circular reference", () => {
	const namespace = new NamespaceEntity("CircularNamespace", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"CircularNamespace",
		"Circular reference test",
	);
	const relatedTags = [
		createMockMemberofTag("CircularNamespace"), // Same as itself
	];

	namespace.parseFromJSDoc(namespaceTag, relatedTags);
	namespace.validate();

	strictEqual(namespace.validationIssues.length, 1);
	strictEqual(
		namespace.validationIssues[0].type,
		"circular_namespace_reference",
	);
});

test("NamespaceEntity - validation with deep nesting warning", () => {
	const namespace = new NamespaceEntity("VeryDeep", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"App.Core.Utils.Data.Processing.VeryDeep",
		"Deeply nested namespace",
	);
	namespace.parseFromJSDoc(namespaceTag);
	namespace.validate();

	strictEqual(namespace.nestedLevel, 5);
	strictEqual(namespace.validationIssues.length, 1);
	strictEqual(namespace.validationIssues[0].type, "deep_nesting_warning");
});

test("NamespaceEntity - module namespace validation", () => {
	const namespace = new NamespaceEntity("badModule", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"module:BadModule123!",
		"Invalid module name",
	);
	namespace.parseFromJSDoc(namespaceTag);
	namespace.validate();

	strictEqual(namespace.isModuleNamespace, true);
	strictEqual(namespace.validationIssues.length, 1);
	strictEqual(namespace.validationIssues[0].type, "invalid_module_name");
});

test("NamespaceEntity - summary generation", () => {
	const namespace = new NamespaceEntity("TestNamespace", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"App.Utils.TestNamespace",
		"Test namespace with members",
	);
	namespace.parseFromJSDoc(namespaceTag);

	// Add some members
	namespace.addMember({ name: "func1", entityType: "function" });
	namespace.addMember({ name: "Class1", entityType: "class" });

	const summary = namespace.getSummary();
	strictEqual(summary.isModuleNamespace, false);
	strictEqual(summary.nestedLevel, 2);
	strictEqual(summary.hasParent, true);
	strictEqual(summary.memberCount, 2);
	strictEqual(summary.hasMembers, true);
	strictEqual(summary.hasDescription, true);
});

test("NamespaceEntity - module namespace summary", () => {
	const namespace = new NamespaceEntity("myModule", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"module:my-module",
		"Module namespace",
	);
	namespace.parseFromJSDoc(namespaceTag);

	const summary = namespace.getSummary();
	strictEqual(summary.isModuleNamespace, true);
	strictEqual(summary.nestedLevel, 0);
	strictEqual(summary.hasParent, false);
	strictEqual(summary.memberCount, 0);
	strictEqual(summary.hasMembers, false);
});

test("NamespaceEntity - serialization", () => {
	const namespace = new NamespaceEntity("SerializeNamespace", {
		file: "test.js",
		line: 10,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"App.SerializeNamespace",
		"Namespace for serialization test",
	);
	namespace.parseFromJSDoc(namespaceTag);
	namespace.setModuleContext("testModule", []);

	// Add a member
	namespace.addMember({ name: "testFunc", entityType: "function" });

	const serialized = namespace.getSerializableData();

	strictEqual(serialized.entityType, "namespace");
	strictEqual(serialized.name, "SerializeNamespace");
	strictEqual(serialized.fullName, "App.SerializeNamespace");
	strictEqual(serialized.description, "Namespace for serialization test");
	strictEqual(serialized.parentNamespace, "App");
	strictEqual(serialized.nestedLevel, 1);
	strictEqual(serialized.isModuleNamespace, false);
	strictEqual(serialized.members.length, 1);
	strictEqual(serialized.moduleId, "testModule");
	strictEqual(typeof serialized.summary, "object");
	strictEqual(serialized.signature, "@namespace App.SerializeNamespace");
});

test("NamespaceEntity - HTML output", () => {
	const namespace = new NamespaceEntity("HTMLNamespace", {
		file: "test.js",
		line: 15,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"App.HTMLNamespace",
		"Namespace for HTML generation",
	);
	const relatedTags = [
		createMockExampleTag("const result = App.HTMLNamespace.process(data);"),
	];

	namespace.parseFromJSDoc(namespaceTag, relatedTags);

	// Add some members
	namespace.addMember({ name: "process", entityType: "function" });
	namespace.addMember({ name: "Helper", entityType: "class" });

	const html = namespace.toHTML();

	strictEqual(html.includes("App.HTMLNamespace"), true);
	strictEqual(html.includes("@namespace"), true);
	strictEqual(html.includes("Namespace for HTML generation"), true);
	strictEqual(html.includes("nested (1)"), true);
	strictEqual(html.includes("Parent"), true);
	strictEqual(html.includes("App"), true);
	strictEqual(html.includes("Members (2)"), true);
	strictEqual(html.includes("process"), true);
	strictEqual(html.includes("function"), true);
	strictEqual(html.includes("Helper"), true);
	strictEqual(html.includes("class"), true);
	strictEqual(html.includes("Examples"), true);
});

test("NamespaceEntity - HTML output for module namespace", () => {
	const namespace = new NamespaceEntity("myModule", {
		file: "test.js",
		line: 20,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"module:awesome-module",
		"An awesome module",
	);
	namespace.parseFromJSDoc(namespaceTag);

	const html = namespace.toHTML();

	strictEqual(html.includes("module:awesome-module"), true);
	strictEqual(html.includes("module"), true);
	strictEqual(html.includes("An awesome module"), true);
});

test("NamespaceEntity - Markdown output", () => {
	const namespace = new NamespaceEntity("MarkdownNamespace", {
		file: "test.js",
		line: 25,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"Core.MarkdownNamespace",
		"Namespace for markdown generation",
	);
	namespace.parseFromJSDoc(namespaceTag);

	// Add some members
	namespace.addMember({ name: "render", entityType: "function" });
	namespace.addMember({ name: "Parser", entityType: "class" });

	const markdown = namespace.toMarkdown();

	strictEqual(markdown.includes("### Core.MarkdownNamespace"), true);
	strictEqual(markdown.includes("**Type:** @namespace (nested: 1)"), true);
	strictEqual(markdown.includes("**Location:** test.js:25"), true);
	strictEqual(markdown.includes("Namespace for markdown generation"), true);
	strictEqual(markdown.includes("**Parent Namespace:** `Core`"), true);
	strictEqual(markdown.includes("**Members (2):**"), true);
	strictEqual(markdown.includes("- `render` *(function)*"), true);
	strictEqual(markdown.includes("- `Parser` *(class)*"), true);
});

test("NamespaceEntity - Markdown output for module namespace", () => {
	const namespace = new NamespaceEntity("moduleTest", {
		file: "test.js",
		line: 30,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag(
		"module:test-module",
		"Test module namespace",
	);
	namespace.parseFromJSDoc(namespaceTag);

	const markdown = namespace.toMarkdown();

	strictEqual(markdown.includes("### module:test-module"), true);
	strictEqual(markdown.includes("**Type:** @namespace (module)"), true);
	strictEqual(markdown.includes("Test module namespace"), true);
	strictEqual(markdown.includes("@namespace module:test-module"), true);
});

test("NamespaceEntity - empty namespace", () => {
	const namespace = new NamespaceEntity("EmptyNamespace", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const namespaceTag = createMockNamespaceTag("EmptyNamespace", "");
	namespace.parseFromJSDoc(namespaceTag);

	strictEqual(namespace.members.length, 0);
	strictEqual(namespace.parentNamespace, null);
	strictEqual(namespace.nestedLevel, 0);
	strictEqual(namespace.getSignature(), "@namespace EmptyNamespace");

	const summary = namespace.getSummary();
	strictEqual(summary.hasMembers, false);
	strictEqual(summary.hasParent, false);
	strictEqual(summary.hasDescription, false);
});
