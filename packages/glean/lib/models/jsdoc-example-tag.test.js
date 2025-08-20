/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc example tag model
 *
 * Ravens validate demonstration precision with predatory focus.
 * Comprehensive test coverage for example parsing, validation, and output.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocExampleTag } from "./jsdoc-example-tag.js";

test("JSDocExampleTag - basic code example", () => {
	const tag = new JSDocExampleTag(
		"const result = add(2, 3);\nconsole.log(result); // 5",
	);

	strictEqual(tag.tagType, "example", "Should have correct tag type");
	strictEqual(tag.caption, "", "Should have empty caption");
	strictEqual(
		tag.code,
		"const result = add(2, 3);\nconsole.log(result); // 5",
		"Should parse code correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid with code");
});

test("JSDocExampleTag - example with caption", () => {
	const tag = new JSDocExampleTag(
		"<caption>Basic usage</caption>\nconst result = add(2, 3);\nconsole.log(result);",
	);

	strictEqual(tag.caption, "Basic usage", "Should parse caption correctly");
	strictEqual(
		tag.code,
		"const result = add(2, 3);\nconsole.log(result);",
		"Should parse code correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - multi-line example with caption", () => {
	const tag = new JSDocExampleTag(
		'<caption>Creating and using a user object</caption>\nconst user = {\n  name: "John",\n  age: 30\n};\nconsole.log(user.name);',
	);

	strictEqual(
		tag.caption,
		"Creating and using a user object",
		"Should parse caption correctly",
	);
	strictEqual(
		tag.code,
		'const user = {\n  name: "John",\n  age: 30\n};\nconsole.log(user.name);',
		"Should parse multi-line code correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - function example", () => {
	const tag = new JSDocExampleTag(
		"function calculate(a, b) {\n  return a + b;\n}\nconst sum = calculate(5, 10);",
	);

	strictEqual(tag.caption, "", "Should have empty caption");
	strictEqual(
		tag.code,
		"function calculate(a, b) {\n  return a + b;\n}\nconst sum = calculate(5, 10);",
		"Should parse function code correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - async/await example", () => {
	const tag = new JSDocExampleTag(
		'<caption>Async function usage</caption>\nasync function fetchData() {\n  const response = await fetch("/api/data");\n  return response.json();\n}\nfetchData().then(console.log);',
	);

	strictEqual(
		tag.caption,
		"Async function usage",
		"Should parse caption correctly",
	);
	strictEqual(
		tag.code,
		'async function fetchData() {\n  const response = await fetch("/api/data");\n  return response.json();\n}\nfetchData().then(console.log);',
		"Should parse async code correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - class example", () => {
	const tag = new JSDocExampleTag(
		'<caption>Class instantiation</caption>\nclass User {\n  constructor(name) {\n    this.name = name;\n  }\n}\nconst user = new User("Alice");',
	);

	strictEqual(
		tag.caption,
		"Class instantiation",
		"Should parse caption correctly",
	);
	strictEqual(
		tag.code,
		'class User {\n  constructor(name) {\n    this.name = name;\n  }\n}\nconst user = new User("Alice");',
		"Should parse class code correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - error handling example", () => {
	const tag = new JSDocExampleTag(
		'<caption>Error handling</caption>\ntry {\n  const result = riskyOperation();\n  console.log(result);\n} catch (error) {\n  console.error("Operation failed:", error.message);\n}',
	);

	strictEqual(tag.caption, "Error handling", "Should parse caption correctly");
	strictEqual(
		tag.code,
		'try {\n  const result = riskyOperation();\n  console.log(result);\n} catch (error) {\n  console.error("Operation failed:", error.message);\n}',
		"Should parse error handling code correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - single line example", () => {
	const tag = new JSDocExampleTag("const x = 42;");

	strictEqual(tag.caption, "", "Should have empty caption");
	strictEqual(tag.code, "const x = 42;", "Should parse single line correctly");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - example with comments", () => {
	const tag = new JSDocExampleTag(
		"// Initialize the configuration\nconst config = { debug: true };\n// Use the configuration\napp.init(config);",
	);

	strictEqual(
		tag.code,
		"// Initialize the configuration\nconst config = { debug: true };\n// Use the configuration\napp.init(config);",
		"Should preserve comments in code",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - example with special characters", () => {
	const tag = new JSDocExampleTag(
		'<caption>Special characters</caption>\nconst regex = /[a-zA-Z0-9]+/g;\nconst text = "Hello, World! @#$%";\nconst matches = text.match(regex);',
	);

	strictEqual(
		tag.caption,
		"Special characters",
		"Should parse caption correctly",
	);
	strictEqual(
		tag.code,
		'const regex = /[a-zA-Z0-9]+/g;\nconst text = "Hello, World! @#$%";\nconst matches = text.match(regex);',
		"Should handle special characters correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - empty content validation", () => {
	const emptyTag = new JSDocExampleTag("");
	strictEqual(
		emptyTag.isValid(),
		false,
		"Should be invalid with empty content",
	);

	const whitespaceTag = new JSDocExampleTag("   ");
	strictEqual(
		whitespaceTag.isValid(),
		false,
		"Should be invalid with whitespace only",
	);
});

test("JSDocExampleTag - caption only without code", () => {
	const tag = new JSDocExampleTag("<caption>Example title</caption>");

	strictEqual(tag.caption, "Example title", "Should parse caption correctly");
	strictEqual(tag.code, "", "Should have empty code");
	strictEqual(tag.isValid(), false, "Should be invalid without code content");
});

test("JSDocExampleTag - malformed caption handling", () => {
	const malformedTag = new JSDocExampleTag(
		"<caption>Incomplete caption\nconst x = 1;",
	);

	strictEqual(malformedTag.caption, "", "Should have empty caption");
	strictEqual(
		malformedTag.code,
		"<caption>Incomplete caption\nconst x = 1;",
		"Should treat malformed content as code",
	);
	strictEqual(malformedTag.isValid(), true, "Should be valid with code");
});

test("JSDocExampleTag - whitespace handling", () => {
	const spacedTag = new JSDocExampleTag(
		"  <caption>  Test Example  </caption>  \n  const test = true;  ",
	);

	strictEqual(
		spacedTag.caption,
		"Test Example",
		"Should trim caption whitespace",
	);
	strictEqual(
		spacedTag.code,
		"const test = true;",
		"Should trim code whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocExampleTag - serialization", () => {
	const tag = new JSDocExampleTag(
		"<caption>Basic usage</caption>\nconst result = add(2, 3);",
	);
	const json = tag.toJSON();

	deepStrictEqual(
		json,
		{
			__type: "example",
			__data: {
				tagType: "example",
				rawContent: "<caption>Basic usage</caption>\nconst result = add(2, 3);",
				caption: "Basic usage",
				code: "const result = add(2, 3);",
			},
		},
		"Should serialize correctly",
	);
});

test("JSDocExampleTag - HTML output", () => {
	const withCaption = new JSDocExampleTag(
		"<caption>Basic usage</caption>\nconst x = 1;",
	);
	strictEqual(
		withCaption.toHTML(),
		'<div class="example-info"><div class="example-caption">Basic usage</div><pre class="example-code"><code>const x = 1;</code></pre></div>',
		"Should generate correct HTML with caption",
	);

	const withoutCaption = new JSDocExampleTag("const x = 1;");
	strictEqual(
		withoutCaption.toHTML(),
		'<div class="example-info"><pre class="example-code"><code>const x = 1;</code></pre></div>',
		"Should generate correct HTML without caption",
	);

	const emptyExample = new JSDocExampleTag("");
	strictEqual(
		emptyExample.toHTML(),
		'<div class="example-info"><pre class="example-code"><code></code></pre></div>',
		"Should handle empty content gracefully",
	);
});

test("JSDocExampleTag - Markdown output", () => {
	const withCaption = new JSDocExampleTag(
		"<caption>Basic usage</caption>\nconst x = 1;",
	);
	strictEqual(
		withCaption.toMarkdown(),
		"**Basic usage**\n\n```javascript\nconst x = 1;\n```",
		"Should generate correct Markdown with caption",
	);

	const withoutCaption = new JSDocExampleTag("const x = 1;");
	strictEqual(
		withoutCaption.toMarkdown(),
		"```javascript\nconst x = 1;\n```",
		"Should generate correct Markdown without caption",
	);

	const emptyExample = new JSDocExampleTag("");
	strictEqual(
		emptyExample.toMarkdown(),
		"```javascript\n\n```",
		"Should handle empty content gracefully",
	);
});

test("JSDocExampleTag - complex code examples", () => {
	// React component example
	const reactTag = new JSDocExampleTag(
		"<caption>React component</caption>\nfunction Button({ label, onClick }) {\n  return (\n    <button onClick={onClick}>\n      {label}\n    </button>\n  );\n}",
	);
	strictEqual(
		reactTag.caption,
		"React component",
		"Should parse React example",
	);
	strictEqual(reactTag.isValid(), true, "Should be valid");

	// API usage example
	const apiTag = new JSDocExampleTag(
		'<caption>API call with error handling</caption>\nfetch("/api/users")\n  .then(response => {\n    if (!response.ok) {\n      throw new Error("Network error");\n    }\n    return response.json();\n  })\n  .then(users => console.log(users))\n  .catch(error => console.error(error));',
	);
	strictEqual(
		apiTag.caption,
		"API call with error handling",
		"Should parse API example",
	);
	strictEqual(apiTag.isValid(), true, "Should be valid");
});
