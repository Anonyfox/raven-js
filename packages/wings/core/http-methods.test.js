import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
	getHttpMethods,
	HTTP_METHODS,
	HTTP_METHODS_LIST,
	isValidHttpMethod,
	isValidHttpMethodFast,
} from "./http-methods.js";

describe("HTTP Methods", () => {
	it("should export all standard HTTP methods", () => {
		assert.deepEqual(HTTP_METHODS, {
			GET: "GET",
			POST: "POST",
			PUT: "PUT",
			DELETE: "DELETE",
			PATCH: "PATCH",
			HEAD: "HEAD",
			OPTIONS: "OPTIONS",
			COMMAND: "COMMAND",
		});
	});

	it("should provide HTTP_METHODS_LIST as array of values", () => {
		assert.deepEqual(HTTP_METHODS_LIST, [
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"PATCH",
			"HEAD",
			"OPTIONS",
			"COMMAND",
		]);
	});

	it("should validate HTTP methods correctly", () => {
		// Valid methods
		assert.equal(isValidHttpMethod("GET"), true);
		assert.equal(isValidHttpMethod("POST"), true);
		assert.equal(isValidHttpMethod("PUT"), true);
		assert.equal(isValidHttpMethod("DELETE"), true);
		assert.equal(isValidHttpMethod("PATCH"), true);
		assert.equal(isValidHttpMethod("HEAD"), true);
		assert.equal(isValidHttpMethod("OPTIONS"), true);
		assert.equal(isValidHttpMethod("COMMAND"), true);

		// Invalid methods
		assert.equal(isValidHttpMethod("get"), false);
		assert.equal(isValidHttpMethod("POSTS"), false);
		assert.equal(isValidHttpMethod(""), false);
		assert.equal(isValidHttpMethod("TRACE"), false);
		assert.equal(isValidHttpMethod("CONNECT"), false);
		assert.equal(isValidHttpMethod("CUSTOM"), false);
	});

	it("should return copy of HTTP methods list", () => {
		const methods = getHttpMethods();
		assert.deepEqual(methods, HTTP_METHODS_LIST);

		// Should be a copy, not the same reference
		assert.notEqual(methods, HTTP_METHODS_LIST);

		// Modifying the returned array shouldn't affect the original
		methods.push("INVALID");
		assert.equal(HTTP_METHODS_LIST.length, 8);
		assert.equal(methods.length, 9);
	});

	it("should have consistent method count", () => {
		assert.equal(HTTP_METHODS_LIST.length, 8);
		assert.equal(Object.keys(HTTP_METHODS).length, 8);
		assert.equal(getHttpMethods().length, 8);
	});

	describe("isValidHttpMethod edge cases", () => {
		it("should handle non-string inputs", () => {
			// Null and undefined
			assert.equal(isValidHttpMethod(null), false);
			assert.equal(isValidHttpMethod(undefined), false);

			// Numbers
			assert.equal(isValidHttpMethod(123), false);
			assert.equal(isValidHttpMethod(0), false);
			assert.equal(isValidHttpMethod(-1), false);
			assert.equal(isValidHttpMethod(NaN), false);
			assert.equal(isValidHttpMethod(Infinity), false);

			// Booleans
			assert.equal(isValidHttpMethod(true), false);
			assert.equal(isValidHttpMethod(false), false);

			// Objects
			assert.equal(isValidHttpMethod({}), false);
			assert.equal(isValidHttpMethod([]), false);
			assert.equal(
				isValidHttpMethod(() => {}),
				false,
			);
			assert.equal(isValidHttpMethod(new Date()), false);

			// Symbols
			assert.equal(isValidHttpMethod(Symbol("GET")), false);
		});

		it("should handle case sensitivity correctly", () => {
			// Lowercase variants
			assert.equal(isValidHttpMethod("get"), false);
			assert.equal(isValidHttpMethod("post"), false);
			assert.equal(isValidHttpMethod("put"), false);
			assert.equal(isValidHttpMethod("delete"), false);
			assert.equal(isValidHttpMethod("patch"), false);
			assert.equal(isValidHttpMethod("head"), false);
			assert.equal(isValidHttpMethod("options"), false);

			// Mixed case variants
			assert.equal(isValidHttpMethod("Get"), false);
			assert.equal(isValidHttpMethod("Post"), false);
			assert.equal(isValidHttpMethod("gET"), false);
			assert.equal(isValidHttpMethod("pOST"), false);
			assert.equal(isValidHttpMethod("GeT"), false);
			assert.equal(isValidHttpMethod("PoSt"), false);
		});

		it("should handle whitespace and special characters", () => {
			// Leading/trailing whitespace
			assert.equal(isValidHttpMethod(" GET"), false);
			assert.equal(isValidHttpMethod("GET "), false);
			assert.equal(isValidHttpMethod("  GET  "), false);
			assert.equal(isValidHttpMethod("\tGET"), false);
			assert.equal(isValidHttpMethod("GET\n"), false);

			// Special characters
			assert.equal(isValidHttpMethod("GET!"), false);
			assert.equal(isValidHttpMethod("GET@"), false);
			assert.equal(isValidHttpMethod("GET#"), false);
			assert.equal(isValidHttpMethod("GET$"), false);
			assert.equal(isValidHttpMethod("GET%"), false);
			assert.equal(isValidHttpMethod("GET^"), false);
			assert.equal(isValidHttpMethod("GET&"), false);
			assert.equal(isValidHttpMethod("GET*"), false);
			assert.equal(isValidHttpMethod("GET("), false);
			assert.equal(isValidHttpMethod("GET)"), false);
		});

		it("should handle boundary conditions", () => {
			// Empty string
			assert.equal(isValidHttpMethod(""), false);

			// Single character strings
			assert.equal(isValidHttpMethod("G"), false);
			assert.equal(isValidHttpMethod("P"), false);
			assert.equal(isValidHttpMethod("D"), false);
			assert.equal(isValidHttpMethod("H"), false);
			assert.equal(isValidHttpMethod("O"), false);

			// Very long strings
			assert.equal(isValidHttpMethod("GET".repeat(100)), false);
			assert.equal(isValidHttpMethod("POST".repeat(50)), false);
			assert.equal(isValidHttpMethod("A".repeat(1000)), false);

			// Strings that are close but not exact
			assert.equal(isValidHttpMethod("GETT"), false);
			assert.equal(isValidHttpMethod("POSTT"), false);
			assert.equal(isValidHttpMethod("PUTT"), false);
			assert.equal(isValidHttpMethod("DELETEE"), false);
			assert.equal(isValidHttpMethod("PATCHH"), false);
			assert.equal(isValidHttpMethod("HEADD"), false);
			assert.equal(isValidHttpMethod("OPTIONSS"), false);

			// Strings that are subsets
			assert.equal(isValidHttpMethod("GE"), false);
			assert.equal(isValidHttpMethod("POS"), false);
			assert.equal(isValidHttpMethod("PU"), false);
			assert.equal(isValidHttpMethod("DELE"), false);
			assert.equal(isValidHttpMethod("PAT"), false);
			assert.equal(isValidHttpMethod("HE"), false);
			assert.equal(isValidHttpMethod("OPT"), false);
		});

		it("should handle common HTTP method variations", () => {
			// Common misspellings
			assert.equal(isValidHttpMethod("GETS"), false);
			assert.equal(isValidHttpMethod("POSTS"), false);
			assert.equal(isValidHttpMethod("PUTS"), false);
			assert.equal(isValidHttpMethod("DELETES"), false);
			assert.equal(isValidHttpMethod("PATCHES"), false);
			assert.equal(isValidHttpMethod("HEADS"), false);
			assert.equal(isValidHttpMethod("OPTIONSS"), false);

			// Common HTTP methods not in our list
			assert.equal(isValidHttpMethod("TRACE"), false);
			assert.equal(isValidHttpMethod("CONNECT"), false);
			assert.equal(isValidHttpMethod("COPY"), false);
			assert.equal(isValidHttpMethod("LINK"), false);
			assert.equal(isValidHttpMethod("UNLINK"), false);
			assert.equal(isValidHttpMethod("PURGE"), false);
			assert.equal(isValidHttpMethod("LOCK"), false);
			assert.equal(isValidHttpMethod("UNLOCK"), false);
			assert.equal(isValidHttpMethod("PROPFIND"), false);
			assert.equal(isValidHttpMethod("VIEW"), false);
		});

		it("should handle unicode and special string cases", () => {
			// Unicode characters
			assert.equal(isValidHttpMethod("GÉT"), false);
			assert.equal(isValidHttpMethod("PÖST"), false);
			assert.equal(isValidHttpMethod("G€T"), false);
			assert.equal(isValidHttpMethod("PØST"), false);

			// Zero-width characters
			assert.equal(isValidHttpMethod("G\u200BET"), false);
			assert.equal(isValidHttpMethod("P\u200BOST"), false);

			// Control characters
			assert.equal(isValidHttpMethod("G\x00ET"), false);
			assert.equal(isValidHttpMethod("P\x1FOST"), false);

			// Non-breaking spaces
			assert.equal(isValidHttpMethod("G\u00A0ET"), false);
			assert.equal(isValidHttpMethod("P\u00A0OST"), false);
		});
	});

	describe("getHttpMethods edge cases", () => {
		it("should return a deep copy that doesn't affect original", () => {
			const methods1 = getHttpMethods();
			const methods2 = getHttpMethods();

			// Should be different arrays
			assert.notEqual(methods1, methods2);
			assert.notEqual(methods1, HTTP_METHODS_LIST);

			// Should have same content
			assert.deepEqual(methods1, methods2);
			assert.deepEqual(methods1, HTTP_METHODS_LIST);

			// Modifying one shouldn't affect others
			methods1[0] = "MODIFIED";
			assert.equal(methods1[0], "MODIFIED");
			assert.equal(methods2[0], "GET");
			assert.equal(HTTP_METHODS_LIST[0], "GET");

			// Array methods should work on copy
			methods1.splice(0, 1);
			assert.equal(methods1.length, 7);
			assert.equal(methods2.length, 8);
			assert.equal(HTTP_METHODS_LIST.length, 8);
		});

		it("should return consistent results across multiple calls", () => {
			const methods1 = getHttpMethods();
			const methods2 = getHttpMethods();
			const methods3 = getHttpMethods();

			assert.deepEqual(methods1, methods2);
			assert.deepEqual(methods2, methods3);
			assert.deepEqual(methods1, methods3);
		});
	});

	describe("HTTP_METHODS object properties", () => {
		it("should have correct property descriptors", () => {
			const descriptors = Object.getOwnPropertyDescriptors(HTTP_METHODS);

			// All properties should be writable, enumerable, and configurable
			for (const [key, descriptor] of Object.entries(descriptors)) {
				assert.equal(
					descriptor.writable,
					true,
					`Property ${key} should be writable`,
				);
				assert.equal(
					descriptor.enumerable,
					true,
					`Property ${key} should be enumerable`,
				);
				assert.equal(
					descriptor.configurable,
					true,
					`Property ${key} should be configurable`,
				);
			}
		});

		it("should have correct property values", () => {
			// Each property should equal its key
			assert.equal(HTTP_METHODS.GET, "GET");
			assert.equal(HTTP_METHODS.POST, "POST");
			assert.equal(HTTP_METHODS.PUT, "PUT");
			assert.equal(HTTP_METHODS.DELETE, "DELETE");
			assert.equal(HTTP_METHODS.PATCH, "PATCH");
			assert.equal(HTTP_METHODS.HEAD, "HEAD");
			assert.equal(HTTP_METHODS.OPTIONS, "OPTIONS");
		});

		it("should maintain object integrity", () => {
			// Object should be extensible
			assert.equal(Object.isExtensible(HTTP_METHODS), true);

			// Should have exactly 7 properties
			assert.equal(Object.keys(HTTP_METHODS).length, 8);
			assert.equal(Object.getOwnPropertyNames(HTTP_METHODS).length, 8);
		});
	});

	describe("HTTP_METHODS_LIST array properties", () => {
		it("should be a proper array", () => {
			assert.equal(Array.isArray(HTTP_METHODS_LIST), true);
			assert.equal(HTTP_METHODS_LIST.constructor, Array);
		});

		it("should have correct length and content", () => {
			assert.equal(HTTP_METHODS_LIST.length, 8);
			assert.deepEqual(HTTP_METHODS_LIST, [
				"GET",
				"POST",
				"PUT",
				"DELETE",
				"PATCH",
				"HEAD",
				"OPTIONS",
				"COMMAND",
			]);
		});

		it("should maintain array integrity", () => {
			// Should be extensible
			assert.equal(Object.isExtensible(HTTP_METHODS_LIST), true);

			// Should be writable
			assert.equal(
				Object.getOwnPropertyDescriptor(HTTP_METHODS_LIST, "length").writable,
				true,
			);
		});
	});

	describe("isValidHttpMethodFast", () => {
		it("should validate standard HTTP methods with bit operations", () => {
			assert.ok(isValidHttpMethodFast("GET"));
			assert.ok(isValidHttpMethodFast("POST"));
			assert.ok(isValidHttpMethodFast("PUT"));
			assert.ok(isValidHttpMethodFast("DELETE"));
			assert.ok(isValidHttpMethodFast("PATCH"));
			assert.ok(isValidHttpMethodFast("HEAD"));
			assert.ok(isValidHttpMethodFast("OPTIONS"));
		});

		it("should validate CLI command method", () => {
			assert.ok(isValidHttpMethodFast("COMMAND"));
		});

		it("should reject invalid methods with bit operations", () => {
			assert.equal(isValidHttpMethodFast("INVALID"), false);
			assert.equal(isValidHttpMethodFast("get"), false); // lowercase
			assert.equal(isValidHttpMethodFast(""), false);
			assert.equal(isValidHttpMethodFast(null), false);
			assert.equal(isValidHttpMethodFast(undefined), false);
			assert.equal(isValidHttpMethodFast(123), false);
		});

		it("should produce identical results to regular validation", () => {
			const testMethods = [
				"GET",
				"POST",
				"PUT",
				"DELETE",
				"PATCH",
				"HEAD",
				"OPTIONS",
				"COMMAND",
				"INVALID",
				"get",
				"",
				null,
				undefined,
				123,
			];

			for (const method of testMethods) {
				const regular = isValidHttpMethod(method);
				const fast = isValidHttpMethodFast(method);
				assert.equal(regular, fast, `Results differ for method: ${method}`);
			}
		});

		it("should handle all edge case inputs consistently", () => {
			const edgeCases = [
				null,
				undefined,
				123,
				0,
				-1,
				NaN,
				Infinity,
				true,
				false,
				{},
				[],
				() => {},
				new Date(),
				"",
				"get",
				"Get",
				"POST ",
				" POST",
				"CONNECT",
				"INVALID",
			];

			for (const input of edgeCases) {
				const regular = isValidHttpMethod(input);
				const fast = isValidHttpMethodFast(input);
				assert.equal(
					regular,
					fast,
					`Results differ for input: ${String(input)}`,
				);
			}

			// Test Symbol separately to avoid conversion issues
			const symbolInput = Symbol("GET");
			const regularSymbol = isValidHttpMethod(symbolInput);
			const fastSymbol = isValidHttpMethodFast(symbolInput);
			assert.equal(
				regularSymbol,
				fastSymbol,
				"Results differ for Symbol input",
			);
		});
	});
});
