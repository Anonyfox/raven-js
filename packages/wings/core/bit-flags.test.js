/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	classifyStatusCode,
	combineMethodFlags,
	extractMethodsFromMask,
	flagToMethod,
	HTTP_METHOD_FLAGS,
	isMethodAllowed,
	METHOD_COMBINATIONS,
	methodToFlag,
} from "./bit-flags.js";

describe("bit-flags", () => {
	describe("HTTP_METHOD_FLAGS", () => {
		it("should have unique powers of 2 for each method", () => {
			const flags = Object.values(HTTP_METHOD_FLAGS);
			const uniqueFlags = new Set(flags);

			// All flags should be unique
			assert.equal(flags.length, uniqueFlags.size);

			// All flags should be powers of 2
			for (const flag of flags) {
				assert.equal(flag & (flag - 1), 0, `${flag} is not a power of 2`);
			}
		});

		it("should have expected flag values", () => {
			assert.equal(HTTP_METHOD_FLAGS.GET, 1);
			assert.equal(HTTP_METHOD_FLAGS.POST, 2);
			assert.equal(HTTP_METHOD_FLAGS.PUT, 4);
			assert.equal(HTTP_METHOD_FLAGS.DELETE, 8);
			assert.equal(HTTP_METHOD_FLAGS.PATCH, 16);
			assert.equal(HTTP_METHOD_FLAGS.HEAD, 32);
			assert.equal(HTTP_METHOD_FLAGS.OPTIONS, 64);
			assert.equal(HTTP_METHOD_FLAGS.TRACE, 128);
			assert.equal(HTTP_METHOD_FLAGS.COMMAND, 256);
		});
	});

	describe("methodToFlag", () => {
		it("should convert valid methods to correct flags", () => {
			assert.equal(methodToFlag("GET"), 1);
			assert.equal(methodToFlag("POST"), 2);
			assert.equal(methodToFlag("PUT"), 4);
			assert.equal(methodToFlag("DELETE"), 8);
			assert.equal(methodToFlag("PATCH"), 16);
			assert.equal(methodToFlag("HEAD"), 32);
			assert.equal(methodToFlag("OPTIONS"), 64);
			assert.equal(methodToFlag("TRACE"), 128);
			assert.equal(methodToFlag("COMMAND"), 256);
		});

		it("should return 0 for invalid methods", () => {
			assert.equal(methodToFlag("INVALID"), 0);
			assert.equal(methodToFlag(""), 0);
			assert.equal(methodToFlag(null), 0);
			assert.equal(methodToFlag(undefined), 0);
		});
	});

	describe("flagToMethod", () => {
		it("should convert valid flags to correct methods", () => {
			assert.equal(flagToMethod(1), "GET");
			assert.equal(flagToMethod(2), "POST");
			assert.equal(flagToMethod(4), "PUT");
			assert.equal(flagToMethod(8), "DELETE");
			assert.equal(flagToMethod(16), "PATCH");
			assert.equal(flagToMethod(32), "HEAD");
			assert.equal(flagToMethod(64), "OPTIONS");
			assert.equal(flagToMethod(128), "TRACE");
			assert.equal(flagToMethod(256), "COMMAND");
		});

		it("should return null for invalid flags", () => {
			assert.equal(flagToMethod(0), null);
			assert.equal(flagToMethod(3), null); // Combined flags
			assert.equal(flagToMethod(5), null); // Combined flags
			assert.equal(flagToMethod(-1), null);
			assert.equal(flagToMethod(1000), null);
		});

		it("should return null for valid powers of 2 not in FLAG_TO_METHOD", () => {
			// Test the || null fallback in FLAG_TO_METHOD.get(flag) || null
			// Use powers of 2 that pass the bit validation but aren't in the map
			assert.equal(flagToMethod(512), null); // 2^9, not in FLAG_TO_METHOD
			assert.equal(flagToMethod(1024), null); // 2^10, not in FLAG_TO_METHOD
		});
	});

	describe("isMethodAllowed", () => {
		it("should correctly check single method allowance", () => {
			const getFlag = HTTP_METHOD_FLAGS.GET;

			assert.equal(isMethodAllowed("GET", getFlag), true);
			assert.equal(isMethodAllowed("POST", getFlag), false);
			assert.equal(isMethodAllowed("PUT", getFlag), false);
		});

		it("should correctly check multiple method allowance", () => {
			const allowedMethods = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;

			assert.equal(isMethodAllowed("GET", allowedMethods), true);
			assert.equal(isMethodAllowed("POST", allowedMethods), true);
			assert.equal(isMethodAllowed("PUT", allowedMethods), false);
			assert.equal(isMethodAllowed("DELETE", allowedMethods), false);
		});

		it("should handle invalid methods", () => {
			const allowedMethods = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;

			assert.equal(isMethodAllowed("INVALID", allowedMethods), false);
			assert.equal(isMethodAllowed("", allowedMethods), false);
			assert.equal(isMethodAllowed(null, allowedMethods), false);
		});
	});

	describe("combineMethodFlags", () => {
		it("should combine multiple methods correctly", () => {
			const methods = ["GET", "POST", "PUT"];
			const combined = combineMethodFlags(methods);
			const expected =
				HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST | HTTP_METHOD_FLAGS.PUT;

			assert.equal(combined, expected);
		});

		it("should handle empty array", () => {
			assert.equal(combineMethodFlags([]), 0);
		});

		it("should handle invalid methods by ignoring them", () => {
			const methods = ["GET", "INVALID", "POST"];
			const combined = combineMethodFlags(methods);
			const expected = HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST;

			assert.equal(combined, expected);
		});
	});

	describe("extractMethodsFromMask", () => {
		it("should extract single method correctly", () => {
			const methods = extractMethodsFromMask(HTTP_METHOD_FLAGS.GET);
			assert.deepEqual(methods, ["GET"]);
		});

		it("should extract multiple methods correctly", () => {
			const mask =
				HTTP_METHOD_FLAGS.GET | HTTP_METHOD_FLAGS.POST | HTTP_METHOD_FLAGS.PUT;
			const methods = extractMethodsFromMask(mask);

			assert.equal(methods.length, 3);
			assert.ok(methods.includes("GET"));
			assert.ok(methods.includes("POST"));
			assert.ok(methods.includes("PUT"));
		});

		it("should handle empty mask", () => {
			const methods = extractMethodsFromMask(0);
			assert.deepEqual(methods, []);
		});

		it("should handle all methods", () => {
			const methods = extractMethodsFromMask(METHOD_COMBINATIONS.ALL_METHODS);
			assert.equal(methods.length, 9); // All 9 HTTP methods including COMMAND
		});
	});

	describe("METHOD_COMBINATIONS", () => {
		it("should have correct SAFE_METHODS combination", () => {
			const expected =
				HTTP_METHOD_FLAGS.GET |
				HTTP_METHOD_FLAGS.HEAD |
				HTTP_METHOD_FLAGS.OPTIONS;
			assert.equal(METHOD_COMBINATIONS.SAFE_METHODS, expected);
		});

		it("should have correct MUTATION_METHODS combination", () => {
			const expected =
				HTTP_METHOD_FLAGS.POST |
				HTTP_METHOD_FLAGS.PUT |
				HTTP_METHOD_FLAGS.DELETE |
				HTTP_METHOD_FLAGS.PATCH;
			assert.equal(METHOD_COMBINATIONS.MUTATION_METHODS, expected);
		});

		it("should have correct CRUD_METHODS combination", () => {
			const expected =
				HTTP_METHOD_FLAGS.GET |
				HTTP_METHOD_FLAGS.POST |
				HTTP_METHOD_FLAGS.PUT |
				HTTP_METHOD_FLAGS.DELETE;
			assert.equal(METHOD_COMBINATIONS.CRUD_METHODS, expected);
		});
	});

	describe("classifyStatusCode", () => {
		it("should classify 1xx codes as informational", () => {
			assert.equal(classifyStatusCode(100), "informational");
			assert.equal(classifyStatusCode(101), "informational");
			assert.equal(classifyStatusCode(199), "informational");
		});

		it("should classify 2xx codes as success", () => {
			assert.equal(classifyStatusCode(200), "success");
			assert.equal(classifyStatusCode(201), "success");
			assert.equal(classifyStatusCode(299), "success");
		});

		it("should classify 3xx codes as redirect", () => {
			assert.equal(classifyStatusCode(300), "redirect");
			assert.equal(classifyStatusCode(301), "redirect");
			assert.equal(classifyStatusCode(399), "redirect");
		});

		it("should classify 4xx codes as client_error", () => {
			assert.equal(classifyStatusCode(400), "client_error");
			assert.equal(classifyStatusCode(404), "client_error");
			assert.equal(classifyStatusCode(499), "client_error");
		});

		it("should classify 5xx codes as server_error", () => {
			assert.equal(classifyStatusCode(500), "server_error");
			assert.equal(classifyStatusCode(501), "server_error");
			assert.equal(classifyStatusCode(599), "server_error");
		});

		it("should classify invalid codes as invalid", () => {
			assert.equal(classifyStatusCode(99), "invalid");
			assert.equal(classifyStatusCode(600), "invalid");
			assert.equal(classifyStatusCode(-1), "invalid");
		});

		it("should handle special numeric values that bypass guard clause", () => {
			// Test edge cases that might reach the default switch case
			assert.equal(classifyStatusCode(NaN), "invalid");
			assert.equal(classifyStatusCode(Infinity), "invalid");
			assert.equal(classifyStatusCode(-Infinity), "invalid");

			// Test edge case where (statusCode / 100) | 0 might produce unexpected values
			// For example, numbers that when divided by 100 and truncated don't produce 1-5
			// This tests floating point edge cases in the range 100-599
			assert.equal(classifyStatusCode(99.9), "invalid"); // < 100, caught by guard
			assert.equal(classifyStatusCode(100.1), "informational"); // Should be case 1
			assert.equal(classifyStatusCode(199.9), "informational"); // Should be case 1
			assert.equal(classifyStatusCode(599.9), "server_error"); // Should be case 5
		});
	});

	describe("Performance characteristics", () => {
		it("should demonstrate bitwise operations are consistent", () => {
			// Test that our bit operations maintain mathematical properties
			const flag1 = HTTP_METHOD_FLAGS.GET;
			const flag2 = HTTP_METHOD_FLAGS.POST;
			const combined = flag1 | flag2;

			// Union property: A | B contains both A and B
			assert.equal(combined & flag1, flag1);
			assert.equal(combined & flag2, flag2);

			// Intersection property: A & B is commutative
			assert.equal(flag1 & flag2, flag2 & flag1);

			// Identity property: A | 0 = A
			assert.equal(flag1 | 0, flag1);

			// Complement property: A & A = A
			assert.equal(flag1 & flag1, flag1);
		});

		it("should handle all method combinations efficiently", () => {
			// This tests that our bit operations scale to all methods
			const allMethods = [
				"GET",
				"POST",
				"PUT",
				"DELETE",
				"PATCH",
				"HEAD",
				"OPTIONS",
				"TRACE",
				"COMMAND",
			];
			const combined = combineMethodFlags(allMethods);

			// Each individual method should be present in the combination
			for (const method of allMethods) {
				assert.equal(isMethodAllowed(method, combined), true);
			}

			// The extracted methods should match the input
			const extracted = extractMethodsFromMask(combined);
			assert.equal(extracted.length, allMethods.length);

			for (const method of allMethods) {
				assert.ok(extracted.includes(method));
			}
		});
	});
});
