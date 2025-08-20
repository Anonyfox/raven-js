/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc alias tag model.
 *
 * Ravens test alternative naming documentation with precision.
 * Verifies alias tag parsing, validation, and reference indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocAliasTag } from "./jsdoc-alias-tag.js";

test("JSDocAliasTag - simple alias", () => {
	const tag = new JSDocAliasTag("myFunction");

	strictEqual(tag.aliasName, "myFunction", "Should parse simple alias");
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - namespaced alias", () => {
	const tag = new JSDocAliasTag("MyNamespace.myFunction");

	strictEqual(
		tag.aliasName,
		"MyNamespace.myFunction",
		"Should parse namespaced alias",
	);
	strictEqual(tag.namespace, "MyNamespace", "Should extract namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, true, "Should be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - deeply namespaced alias", () => {
	const tag = new JSDocAliasTag("App.Utils.Data.processor");

	strictEqual(
		tag.aliasName,
		"App.Utils.Data.processor",
		"Should parse deep alias",
	);
	strictEqual(tag.namespace, "App.Utils.Data", "Should extract deep namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, true, "Should be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - module alias", () => {
	const tag = new JSDocAliasTag("module:fs/promises~readFile");

	strictEqual(
		tag.aliasName,
		"module:fs/promises~readFile",
		"Should parse module alias",
	);
	strictEqual(tag.namespace, "", "Should have empty namespace for module");
	strictEqual(tag.isModuleAlias, true, "Should be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - simple module alias", () => {
	const tag = new JSDocAliasTag("module:lodash");

	strictEqual(
		tag.aliasName,
		"module:lodash",
		"Should parse simple module alias",
	);
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, true, "Should be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - scoped package alias", () => {
	const tag = new JSDocAliasTag("@raven-js/beak.html");

	strictEqual(
		tag.aliasName,
		"@raven-js/beak.html",
		"Should parse scoped alias",
	);
	strictEqual(
		tag.namespace,
		"@raven-js/beak",
		"Should extract scoped namespace",
	);
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, true, "Should be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - complex scoped alias", () => {
	const tag = new JSDocAliasTag(
		"@organization/package.Module.SubModule.function",
	);

	strictEqual(
		tag.aliasName,
		"@organization/package.Module.SubModule.function",
		"Should parse complex scoped alias",
	);
	strictEqual(
		tag.namespace,
		"@organization/package.Module.SubModule",
		"Should extract complex namespace",
	);
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, true, "Should be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - camelCase alias", () => {
	const tag = new JSDocAliasTag("myFunctionAlias");

	strictEqual(tag.aliasName, "myFunctionAlias", "Should parse camelCase alias");
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - PascalCase alias", () => {
	const tag = new JSDocAliasTag("MyClassAlias");

	strictEqual(tag.aliasName, "MyClassAlias", "Should parse PascalCase alias");
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - snake_case alias", () => {
	const tag = new JSDocAliasTag("my_function_alias");

	strictEqual(
		tag.aliasName,
		"my_function_alias",
		"Should parse snake_case alias",
	);
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - kebab-case alias", () => {
	const tag = new JSDocAliasTag("my-function-alias");

	strictEqual(
		tag.aliasName,
		"my-function-alias",
		"Should parse kebab-case alias",
	);
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - numeric alias", () => {
	const tag = new JSDocAliasTag("alias123");

	strictEqual(tag.aliasName, "alias123", "Should parse numeric alias");
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - whitespace handling", () => {
	const spacedTag = new JSDocAliasTag("   MyNamespace.myAlias   ");

	strictEqual(
		spacedTag.aliasName,
		"MyNamespace.myAlias",
		"Should trim alias whitespace",
	);
	strictEqual(spacedTag.namespace, "MyNamespace", "Should extract namespace");
	strictEqual(spacedTag.isNamespaced, true, "Should be namespaced");
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - empty content", () => {
	const tag = new JSDocAliasTag("");

	strictEqual(tag.aliasName, "", "Should have empty alias name");
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), false, "Should be invalid without content");
});

test("JSDocAliasTag - only whitespace", () => {
	const tag = new JSDocAliasTag("   \n\t  ");

	strictEqual(tag.aliasName, "", "Should handle whitespace-only content");
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), false, "Should be invalid");
});

test("JSDocAliasTag - single character alias", () => {
	const tag = new JSDocAliasTag("$");

	strictEqual(tag.aliasName, "$", "Should parse single character alias");
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - special characters alias", () => {
	const tag = new JSDocAliasTag("my$special_alias");

	strictEqual(
		tag.aliasName,
		"my$special_alias",
		"Should parse special characters",
	);
	strictEqual(tag.namespace, "", "Should have empty namespace");
	strictEqual(tag.isModuleAlias, false, "Should not be module alias");
	strictEqual(tag.isNamespaced, false, "Should not be namespaced");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - namespace extraction edge cases", () => {
	// Multiple dots
	const multiDotTag = new JSDocAliasTag("A.B.C.D.E.method");
	strictEqual(
		multiDotTag.namespace,
		"A.B.C.D.E",
		"Should extract multi-level namespace",
	);

	// Starts with dot (malformed)
	const dotStartTag = new JSDocAliasTag(".invalidAlias");
	strictEqual(dotStartTag.namespace, "", "Should handle leading dot");
	strictEqual(
		dotStartTag.isNamespaced,
		true,
		"Should still be considered namespaced",
	);

	// Ends with dot (malformed)
	const dotEndTag = new JSDocAliasTag("Namespace.");
	strictEqual(dotEndTag.namespace, "Namespace", "Should handle trailing dot");
	strictEqual(dotEndTag.isNamespaced, true, "Should be namespaced");
});

test("JSDocAliasTag - module alias patterns", () => {
	// Node.js built-in module
	const builtinTag = new JSDocAliasTag("module:fs");
	strictEqual(builtinTag.isModuleAlias, true, "Should detect builtin module");

	// npm package module
	const packageTag = new JSDocAliasTag("module:lodash/fp");
	strictEqual(packageTag.isModuleAlias, true, "Should detect package module");

	// Scoped package module
	const scopedTag = new JSDocAliasTag("module:@babel/core");
	strictEqual(scopedTag.isModuleAlias, true, "Should detect scoped module");

	// Module with tilde
	const tildeTag = new JSDocAliasTag("module:path/to/module~member");
	strictEqual(tildeTag.isModuleAlias, true, "Should detect tilde module");
});

test("JSDocAliasTag - serialization", () => {
	const tag = new JSDocAliasTag("MyNamespace.myAlias");
	const json = tag.toJSON();

	strictEqual(json.__type, "alias", "Should have correct type");
	strictEqual(
		json.__data.aliasName,
		"MyNamespace.myAlias",
		"Should serialize alias name",
	);
	strictEqual(
		json.__data.namespace,
		"MyNamespace",
		"Should serialize namespace",
	);
	strictEqual(json.__data.isModuleAlias, false, "Should serialize module flag");
	strictEqual(
		json.__data.isNamespaced,
		true,
		"Should serialize namespaced flag",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocAliasTag - serialization module alias", () => {
	const tag = new JSDocAliasTag("module:path/to/module");
	const json = tag.toJSON();

	strictEqual(json.__type, "alias", "Should have correct type");
	strictEqual(
		json.__data.aliasName,
		"module:path/to/module",
		"Should serialize module alias",
	);
	strictEqual(json.__data.namespace, "", "Should serialize empty namespace");
	strictEqual(json.__data.isModuleAlias, true, "Should serialize module flag");
	strictEqual(
		json.__data.isNamespaced,
		false,
		"Should serialize namespaced flag",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocAliasTag - HTML output", () => {
	const tag = new JSDocAliasTag("MyClass.myMethod");

	strictEqual(
		tag.toHTML(),
		'<div class="alias-info"><strong class="alias-label">Alias:</strong><code class="alias-name">MyClass.myMethod</code></div>',
		"Should generate correct HTML output",
	);
});

test("JSDocAliasTag - Markdown output", () => {
	const tag = new JSDocAliasTag("Utils.helperFunction");

	strictEqual(
		tag.toMarkdown(),
		"**Alias:** `Utils.helperFunction`",
		"Should generate correct Markdown output",
	);
});

test("JSDocAliasTag - common alias patterns", () => {
	// Library aliases
	const libTag = new JSDocAliasTag("lib.utils.format");
	strictEqual(libTag.namespace, "lib.utils", "Should handle library patterns");
	strictEqual(libTag.isNamespaced, true, "Should be namespaced");
	strictEqual(libTag.isValid(), true, "Should be valid");

	// Framework aliases
	const frameworkTag = new JSDocAliasTag("Framework.Component.render");
	strictEqual(
		frameworkTag.namespace,
		"Framework.Component",
		"Should handle framework patterns",
	);
	strictEqual(frameworkTag.isNamespaced, true, "Should be namespaced");
	strictEqual(frameworkTag.isValid(), true, "Should be valid");

	// API aliases
	const apiTag = new JSDocAliasTag("API.v1.users");
	strictEqual(apiTag.namespace, "API.v1", "Should handle API patterns");
	strictEqual(apiTag.isNamespaced, true, "Should be namespaced");
	strictEqual(apiTag.isValid(), true, "Should be valid");
});

test("JSDocAliasTag - edge cases", () => {
	// Very long alias
	const longTag = new JSDocAliasTag(
		"VeryLongNamespaceWithMultipleWordsAndCamelCasing.AnotherLongModuleName.VeryDescriptiveFunctionNameWithManyWords",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long aliases");
	strictEqual(longTag.isNamespaced, true, "Should be namespaced");

	// Unicode characters
	const unicodeTag = new JSDocAliasTag("Módulo.función");
	strictEqual(
		unicodeTag.aliasName,
		"Módulo.función",
		"Should handle unicode characters",
	);
	strictEqual(
		unicodeTag.namespace,
		"Módulo",
		"Should extract unicode namespace",
	);
	strictEqual(unicodeTag.isValid(), true, "Should be valid");

	// Mixed case with numbers
	const mixedTag = new JSDocAliasTag("API_v2.Module123.function_v1");
	strictEqual(
		mixedTag.aliasName,
		"API_v2.Module123.function_v1",
		"Should handle mixed case with numbers",
	);
	strictEqual(
		mixedTag.namespace,
		"API_v2.Module123",
		"Should extract mixed namespace",
	);
	strictEqual(mixedTag.isValid(), true, "Should be valid");

	// Only dots (malformed)
	const dotsTag = new JSDocAliasTag("...");
	strictEqual(dotsTag.aliasName, "...", "Should handle dots-only alias");
	strictEqual(dotsTag.isValid(), true, "Should be valid even if unusual");
});
