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
	it("tokenizes camelCase", () => {
		deepStrictEqual(tokenizeCode("camelCase"), ["camel", "Case"]);
		deepStrictEqual(tokenizeCode("getUserData"), ["get", "User", "Data"]);
		deepStrictEqual(tokenizeCode("getElementById"), [
			"get",
			"Element",
			"By",
			"Id",
		]);
	});

	it("tokenizes PascalCase", () => {
		deepStrictEqual(tokenizeCode("PascalCase"), ["Pascal", "Case"]);
		deepStrictEqual(tokenizeCode("XMLHttpRequest"), ["XML", "Http", "Request"]);
		deepStrictEqual(tokenizeCode("HTMLElement"), ["HTML", "Element"]);
	});

	it("tokenizes snake_case", () => {
		deepStrictEqual(tokenizeCode("snake_case"), ["snake", "case"]);
		deepStrictEqual(tokenizeCode("user_profile_data"), [
			"user",
			"profile",
			"data",
		]);
		deepStrictEqual(tokenizeCode("create_user_account"), [
			"create",
			"user",
			"account",
		]);
	});

	it("tokenizes SCREAMING_SNAKE_CASE", () => {
		deepStrictEqual(tokenizeCode("SCREAMING_SNAKE_CASE"), [
			"SCREAMING",
			"SNAKE",
			"CASE",
		]);
		deepStrictEqual(tokenizeCode("API_KEY_SECRET"), ["API", "KEY", "SECRET"]);
		deepStrictEqual(tokenizeCode("MAX_RETRY_COUNT"), ["MAX", "RETRY", "COUNT"]);
	});

	it("tokenizes kebab-case", () => {
		deepStrictEqual(tokenizeCode("kebab-case"), ["kebab", "case"]);
		deepStrictEqual(tokenizeCode("user-profile-component"), [
			"user",
			"profile",
			"component",
		]);
		deepStrictEqual(tokenizeCode("vue-router-link"), ["vue", "router", "link"]);
	});

	it("tokenizes dot.notation", () => {
		deepStrictEqual(tokenizeCode("dot.notation"), ["dot", "notation"]);
		deepStrictEqual(tokenizeCode("user.profile.settings"), [
			"user",
			"profile",
			"settings",
		]);
		deepStrictEqual(tokenizeCode("api.v2.endpoint"), ["api", "v2", "endpoint"]);
	});

	it("handles mixed conventions", () => {
		deepStrictEqual(tokenizeCode("mixedConvention_example"), [
			"mixed",
			"Convention",
			"example",
		]);
		deepStrictEqual(tokenizeCode("getUserData_fromAPI"), [
			"get",
			"User",
			"Data",
			"from",
			"API",
		]);
		deepStrictEqual(tokenizeCode("user-profile.getData"), [
			"user",
			"profile",
			"get",
			"Data",
		]);
	});

	it("handles numbers in identifiers", () => {
		deepStrictEqual(tokenizeCode("version2API"), ["version2", "API"]);
		deepStrictEqual(tokenizeCode("parseHTML5Document"), [
			"parse",
			"HTML5",
			"Document",
		]);
		deepStrictEqual(tokenizeCode("api_v2_endpoint"), ["api", "v2", "endpoint"]);
	});

	it("handles consecutive capitals", () => {
		deepStrictEqual(tokenizeCode("XMLParser"), ["XML", "Parser"]);
		deepStrictEqual(tokenizeCode("HTTPSConnection"), ["HTTPS", "Connection"]);
		deepStrictEqual(tokenizeCode("JSONAPIResponse"), ["JSONAPI", "Response"]);
	});

	it("handles single words", () => {
		deepStrictEqual(tokenizeCode("word"), ["word"]);
		deepStrictEqual(tokenizeCode("WORD"), ["WORD"]);
		deepStrictEqual(tokenizeCode("Word"), ["Word"]);
	});

	it("handles invalid and edge case inputs gracefully", () => {
		// Null/undefined inputs
		deepStrictEqual(tokenizeCode(null), []);
		deepStrictEqual(tokenizeCode(undefined), []);

		// Empty and whitespace-only strings
		deepStrictEqual(tokenizeCode(""), []);
		deepStrictEqual(tokenizeCode("   "), []);
		deepStrictEqual(tokenizeCode("\t\n"), []);
	});

	it("handles complex real-world examples", () => {
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
	});

	it("handles multiple separators", () => {
		deepStrictEqual(tokenizeCode("user__profile"), ["user", "profile"]);
		deepStrictEqual(tokenizeCode("api--v2"), ["api", "v2"]);
		deepStrictEqual(tokenizeCode("data...source"), ["data", "source"]);
	});

	it("handles whitespace-separated code", () => {
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

	it("preserves original casing", () => {
		deepStrictEqual(tokenizeCode("XMLHttpRequest"), ["XML", "Http", "Request"]);
		deepStrictEqual(tokenizeCode("getElementById"), [
			"get",
			"Element",
			"By",
			"Id",
		]);
		deepStrictEqual(tokenizeCode("API_KEY_SECRET"), ["API", "KEY", "SECRET"]);
	});
});
