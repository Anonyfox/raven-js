/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for code-aware tokenization functionality.
 */

import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";
import { tokenizeCode } from "./tokenize-code.js";

describe("tokenizeCode", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("splits camel/Pascal/snake/kebab/dot and preserves casing", () => {
			// camelCase / PascalCase
			deepStrictEqual(tokenizeCode("camelCase"), ["camel", "Case"]);
			deepStrictEqual(tokenizeCode("getUserData"), ["get", "User", "Data"]);
			deepStrictEqual(tokenizeCode("PascalCase"), ["Pascal", "Case"]);
			// snake / screaming snake
			deepStrictEqual(tokenizeCode("snake_case"), ["snake", "case"]);
			deepStrictEqual(tokenizeCode("SCREAMING_SNAKE_CASE"), [
				"SCREAMING",
				"SNAKE",
				"CASE",
			]);
			// kebab / dot
			deepStrictEqual(tokenizeCode("kebab-case"), ["kebab", "case"]);
			deepStrictEqual(tokenizeCode("dot.notation"), ["dot", "notation"]);
			// casing preserved
			deepStrictEqual(tokenizeCode("XMLHttpRequest"), [
				"XML",
				"Http",
				"Request",
			]);
			deepStrictEqual(tokenizeCode("getElementById"), [
				"get",
				"Element",
				"By",
				"Id",
			]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles numbers, caps runs, invalids, and whitespace", () => {
			// numbers in identifiers
			deepStrictEqual(tokenizeCode("version2API"), ["version2", "API"]);
			deepStrictEqual(tokenizeCode("parseHTML5Document"), [
				"parse",
				"HTML5",
				"Document",
			]);
			deepStrictEqual(tokenizeCode("api_v2_endpoint"), [
				"api",
				"v2",
				"endpoint",
			]);
			// consecutive capitals
			deepStrictEqual(tokenizeCode("XMLParser"), ["XML", "Parser"]);
			deepStrictEqual(tokenizeCode("HTTPSConnection"), ["HTTPS", "Connection"]);
			deepStrictEqual(tokenizeCode("JSONAPIResponse"), ["JSONAPI", "Response"]);
			// invalids and whitespace-only
			deepStrictEqual(tokenizeCode(null), []);
			deepStrictEqual(tokenizeCode(undefined), []);
			deepStrictEqual(tokenizeCode(""), []);
			deepStrictEqual(tokenizeCode("   "), []);
			deepStrictEqual(tokenizeCode("\t\n"), []);
			// multiple separators and mixed conventions
			deepStrictEqual(tokenizeCode("user__profile"), ["user", "profile"]);
			deepStrictEqual(tokenizeCode("api--v2"), ["api", "v2"]);
			deepStrictEqual(tokenizeCode("data...source"), ["data", "source"]);
			deepStrictEqual(tokenizeCode("mixedConvention_example"), [
				"mixed",
				"Convention",
				"example",
			]);
		});
	});

	describe("integration scenarios", () => {
		it("handles real-world chained and spaced identifiers", () => {
			deepStrictEqual(tokenizeCode("user.profile.settings"), [
				"user",
				"profile",
				"settings",
			]);
			deepStrictEqual(tokenizeCode("React.createElement"), [
				"React",
				"create",
				"Element",
			]);
			deepStrictEqual(tokenizeCode("document.getElementById"), [
				"document",
				"get",
				"Element",
				"By",
				"Id",
			]);
			deepStrictEqual(tokenizeCode("user_profile-component.getData"), [
				"user",
				"profile",
				"component",
				"get",
				"Data",
			]);
			deepStrictEqual(tokenizeCode("camelCase snake_case"), [
				"camel",
				"Case",
				"snake",
				"case",
			]);
			deepStrictEqual(tokenizeCode("getUserData createUser"), [
				"get",
				"User",
				"Data",
				"create",
				"User",
			]);
		});
	});
});
