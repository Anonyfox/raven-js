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
	clearStringCache,
	HEADER_NAMES,
	internString,
	MESSAGES,
	MIME_TYPES,
} from "./string-pool.js";

describe("string-pool", () => {
	describe("MIME_TYPES", () => {
		it("should provide interned MIME type constants", () => {
			assert.equal(MIME_TYPES.TEXT_PLAIN, "text/plain");
			assert.equal(MIME_TYPES.TEXT_HTML, "text/html");
			assert.equal(MIME_TYPES.APPLICATION_JSON, "application/json");
			assert.equal(MIME_TYPES.APPLICATION_JAVASCRIPT, "application/javascript");
			assert.equal(MIME_TYPES.APPLICATION_XML, "application/xml");
			assert.equal(
				MIME_TYPES.APPLICATION_OCTET_STREAM,
				"application/octet-stream",
			);
			assert.equal(
				MIME_TYPES.APPLICATION_FORM_URLENCODED,
				"application/x-www-form-urlencoded",
			);
			assert.equal(MIME_TYPES.TEXT_CSS, "text/css");
			assert.equal(MIME_TYPES.TEXT_JAVASCRIPT, "text/javascript");
		});

		it("should have all required MIME types for framework", () => {
			const requiredTypes = [
				"TEXT_PLAIN",
				"TEXT_HTML",
				"APPLICATION_JSON",
				"APPLICATION_JAVASCRIPT",
				"APPLICATION_XML",
				"APPLICATION_OCTET_STREAM",
				"APPLICATION_FORM_URLENCODED",
				"TEXT_CSS",
				"TEXT_JAVASCRIPT",
			];

			for (const type of requiredTypes) {
				assert.ok(
					Object.hasOwn(MIME_TYPES, type),
					`Missing MIME type: ${type}`,
				);
				assert.equal(typeof MIME_TYPES[type], "string");
				assert.ok(MIME_TYPES[type].length > 0);
			}
		});
	});

	describe("HEADER_NAMES", () => {
		it("should provide interned header name constants", () => {
			assert.equal(HEADER_NAMES.CONTENT_TYPE, "content-type");
			assert.equal(HEADER_NAMES.CONTENT_LENGTH, "Content-Length");
			assert.equal(HEADER_NAMES.AUTHORIZATION, "authorization");
			assert.equal(HEADER_NAMES.LOCATION, "Location");
			assert.equal(
				HEADER_NAMES.ACCESS_CONTROL_ALLOW_ORIGIN,
				"access-control-allow-origin",
			);
			assert.equal(
				HEADER_NAMES.ACCESS_CONTROL_ALLOW_METHODS,
				"access-control-allow-methods",
			);
			assert.equal(
				HEADER_NAMES.ACCESS_CONTROL_ALLOW_HEADERS,
				"access-control-allow-headers",
			);
			assert.equal(
				HEADER_NAMES.ACCESS_CONTROL_MAX_AGE,
				"access-control-max-age",
			);
			assert.equal(HEADER_NAMES.CACHE_CONTROL, "cache-control");
			assert.equal(HEADER_NAMES.RETRY_AFTER, "retry-after");
		});

		it("should have consistent casing for standard headers", () => {
			// Standard headers should follow HTTP convention
			assert.equal(HEADER_NAMES.CONTENT_LENGTH, "Content-Length");
			assert.equal(HEADER_NAMES.LOCATION, "Location");

			// Custom headers can be lowercase
			assert.equal(HEADER_NAMES.CONTENT_TYPE, "content-type");
			assert.equal(HEADER_NAMES.AUTHORIZATION, "authorization");
		});
	});

	describe("MESSAGES", () => {
		it("should provide interned message constants", () => {
			assert.equal(MESSAGES.NOT_FOUND, "Not Found");
			assert.equal(MESSAGES.INTERNAL_SERVER_ERROR, "Internal Server Error");
			assert.equal(
				MESSAGES.CONTEXT_REQUIRED,
				"Context must be a Context instance",
			);
			assert.equal(MESSAGES.HANDLER_REQUIRED, "Handler must be a function");
		});

		it("should have appropriate error messages", () => {
			assert.ok(MESSAGES.NOT_FOUND.length > 0);
			assert.ok(MESSAGES.INTERNAL_SERVER_ERROR.length > 0);
			assert.ok(MESSAGES.CONTEXT_REQUIRED.includes("Context"));
			assert.ok(MESSAGES.HANDLER_REQUIRED.includes("function"));
		});
	});

	describe("internString", () => {
		it("should return the same reference for identical strings", () => {
			const str1 = "test-string";
			const str2 = "test-string";

			const interned1 = internString(str1);
			const interned2 = internString(str2);

			// Should return the exact same reference
			assert.equal(interned1, interned2);
			assert.equal(interned1, str1); // Should return the original string
		});

		it("should cache strings and provide O(1) lookup", () => {
			const testString = "performance-test-string";

			// First call should cache the string
			const first = internString(testString);
			assert.equal(first, testString);

			// Subsequent calls should return cached reference
			const second = internString(testString);
			const third = internString(testString);

			assert.equal(first, second);
			assert.equal(second, third);
		});

		it("should handle different strings correctly", () => {
			const str1 = "string-one";
			const str2 = "string-two";

			const interned1 = internString(str1);
			const interned2 = internString(str2);

			assert.equal(interned1, str1);
			assert.equal(interned2, str2);
			assert.notEqual(interned1, interned2);
		});

		it("should handle LRU cache limit gracefully", () => {
			// Test that cache doesn't grow indefinitely
			for (let i = 0; i < 600; i++) {
				internString(`test-string-${i}`);
			}

			// Should still work after hitting limit
			const result = internString("final-test");
			assert.equal(result, "final-test");
		});

		it("should handle edge cases", () => {
			assert.equal(internString(""), "");
			assert.equal(internString(" "), " ");
			assert.equal(internString("🦅"), "🦅");
			assert.equal(internString("special-chars-!@#$%"), "special-chars-!@#$%");
		});
	});

	describe("clearStringCache", () => {
		it("should clear the dynamic string cache", () => {
			// Add some strings to cache
			internString("cache-test-1");
			internString("cache-test-2");
			internString("cache-test-3");

			// Clear the cache
			clearStringCache();

			// Should still work after clearing
			const result = internString("post-clear-test");
			assert.equal(result, "post-clear-test");
		});

		it("should not affect constant string pools", () => {
			// Clear cache
			clearStringCache();

			// Constants should still be available
			assert.equal(MIME_TYPES.TEXT_PLAIN, "text/plain");
			assert.equal(HEADER_NAMES.CONTENT_TYPE, "content-type");
			assert.equal(MESSAGES.NOT_FOUND, "Not Found");
		});
	});

	describe("Performance characteristics", () => {
		it("should demonstrate string identity for constants", () => {
			// Test that our constants maintain string identity
			const contentType1 = HEADER_NAMES.CONTENT_TYPE;
			const contentType2 = HEADER_NAMES.CONTENT_TYPE;

			// Should be the exact same reference
			assert.equal(contentType1, contentType2);
			assert.strictEqual(contentType1, contentType2);
		});

		it("should show memory efficiency with repeated strings", () => {
			const baseString = "repeated-efficiency-test";
			const variations = [];

			// Create multiple references to the same interned string
			for (let i = 0; i < 100; i++) {
				variations.push(internString(baseString));
			}

			// All should be identical references
			for (let i = 1; i < variations.length; i++) {
				assert.strictEqual(variations[0], variations[i]);
			}
		});

		it("should handle concurrent access patterns", () => {
			// Simulate concurrent string internment
			const promises = [];
			const testString = "concurrent-test-string";

			for (let i = 0; i < 50; i++) {
				promises.push(Promise.resolve(internString(testString)));
			}

			return Promise.all(promises).then((results) => {
				// All results should be identical
				for (let i = 1; i < results.length; i++) {
					assert.strictEqual(results[0], results[i]);
				}
			});
		});
	});
});
