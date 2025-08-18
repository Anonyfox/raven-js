/**
 * @fileoverview Tests for request validation functionality
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { DEFAULT_VALIDATION, validateRequest } from "./request-validation.js";

describe("validateRequest", () => {
	const createMockContext = (options = {}) => {
		const {
			path = "/test",
			queryParams = new Map(),
			requestHeaders = new Map(),
		} = options;

		return {
			path,
			queryParams,
			requestHeaders,
		};
	};

	const defaultConfig = {
		maxPathLength: 100,
		maxQueryParams: 5,
		maxQueryParamLength: 20,
		maxHeaders: 10,
		maxHeaderSize: 200,
		maxBodySize: 1024,
	};

	describe("path validation", () => {
		it("should accept paths within length limit", () => {
			const ctx = createMockContext({ path: "/short/path" });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should reject paths exceeding length limit", () => {
			const longPath = `/${"a".repeat(200)}`;
			const ctx = createMockContext({ path: longPath });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Path too long"));
			assert.ok(
				result[0].includes(
					`${longPath.length} > ${defaultConfig.maxPathLength}`,
				),
			);
		});

		it("should handle edge case of exact path length limit", () => {
			const exactPath = `/${"a".repeat(99)}`; // Total length = 100
			const ctx = createMockContext({ path: exactPath });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle empty path", () => {
			const ctx = createMockContext({ path: "" });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle root path", () => {
			const ctx = createMockContext({ path: "/" });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});
	});

	describe("query parameter validation", () => {
		it("should accept query params within limits", () => {
			const queryParams = new Map([
				["param1", "value1"],
				["param2", "value2"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should reject too many query parameters", () => {
			const queryParams = new Map([
				["param1", "value1"],
				["param2", "value2"],
				["param3", "value3"],
				["param4", "value4"],
				["param5", "value5"],
				["param6", "value6"], // Exceeds limit of 5
			]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Too many query parameters"));
			assert.ok(result[0].includes(`6 > ${defaultConfig.maxQueryParams}`));
		});

		it("should accept exact query parameter count limit", () => {
			const queryParams = new Map([
				["param1", "value1"],
				["param2", "value2"],
				["param3", "value3"],
				["param4", "value4"],
				["param5", "value5"], // Exactly at limit of 5
			]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should reject query parameter key too long", () => {
			const longKey = "a".repeat(25); // Exceeds limit of 20
			const queryParams = new Map([[longKey, "value"]]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Query parameter key too long"));
			assert.ok(
				result[0].includes(
					`${longKey.length} > ${defaultConfig.maxQueryParamLength}`,
				),
			);
		});

		it("should reject query parameter value too long", () => {
			const longValue = "a".repeat(25); // Exceeds limit of 20
			const queryParams = new Map([["key", longValue]]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Query parameter value too long"));
			assert.ok(
				result[0].includes(
					`${longValue.length} > ${defaultConfig.maxQueryParamLength}`,
				),
			);
		});

		it("should accept query parameters at exact length limit", () => {
			const exactKey = "a".repeat(20); // Exactly at limit
			const exactValue = "b".repeat(20); // Exactly at limit
			const queryParams = new Map([[exactKey, exactValue]]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle empty query parameters", () => {
			const queryParams = new Map();
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle empty query parameter keys and values", () => {
			const queryParams = new Map([
				["", ""],
				["key", ""],
				["", "value"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});
	});

	describe("header validation", () => {
		it("should accept headers within limits", () => {
			const requestHeaders = new Map([
				["content-type", "application/json"],
				["authorization", "Bearer token"],
			]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should reject too many headers", () => {
			const requestHeaders = new Map();
			for (let i = 0; i < 12; i++) {
				// Exceeds limit of 10
				requestHeaders.set(`header${i}`, `value${i}`);
			}
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Too many headers"));
			assert.ok(result[0].includes(`12 > ${defaultConfig.maxHeaders}`));
		});

		it("should accept exact header count limit", () => {
			const requestHeaders = new Map();
			for (let i = 0; i < 10; i++) {
				// Exactly at limit of 10
				requestHeaders.set(`header${i}`, `value${i}`);
			}
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should reject headers too large in total size", () => {
			// Create headers that total more than 200 bytes
			// Each header below is around 100 bytes, totaling ~300 bytes > 200 limit
			const requestHeaders = new Map([
				[
					"very-long-header-name-that-definitely-exceeds-our-limits-when-combined-with-its-value",
					"very-long-header-value-that-also-exceeds-the-total-size-limit-significantly-to-trigger-validation-error-for-sure",
				],
				[
					"another-long-header-to-push-us-over-the-edge",
					"and-another-very-long-value-to-ensure-we-exceed-the-200-byte-total-limit",
				],
			]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Headers too large"));
			assert.ok(result[0].includes(`> ${defaultConfig.maxHeaderSize}`));
		});

		it("should calculate total header size correctly", () => {
			const requestHeaders = new Map([
				["key1", "value1"], // 10 bytes
				["key2", "value2"], // 10 bytes
			]);
			const ctx = createMockContext({ requestHeaders });
			// Total size should be 20 bytes, well under the 200 byte limit
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle empty headers", () => {
			const requestHeaders = new Map();
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle headers with empty keys or values", () => {
			const requestHeaders = new Map([
				["", "value"],
				["key", ""],
				["", ""],
			]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});
	});

	describe("body size validation", () => {
		it("should accept body size within limit", () => {
			const requestHeaders = new Map([["content-length", "512"]]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should reject body size exceeding limit", () => {
			const requestHeaders = new Map([["content-length", "2048"]]); // Exceeds 1024 limit
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Request body too large"));
			assert.ok(result[0].includes(`2048 > ${defaultConfig.maxBodySize}`));
		});

		it("should accept body size at exact limit", () => {
			const requestHeaders = new Map([["content-length", "1024"]]); // Exactly at limit
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle missing content-length header", () => {
			const requestHeaders = new Map([["other-header", "value"]]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle invalid content-length header", () => {
			const requestHeaders = new Map([["content-length", "invalid"]]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0); // Should not fail on invalid content-length
		});

		it("should handle zero content-length", () => {
			const requestHeaders = new Map([["content-length", "0"]]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle negative content-length", () => {
			const requestHeaders = new Map([["content-length", "-1"]]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0); // Should not fail on negative values
		});

		it("should handle floating point content-length", () => {
			const requestHeaders = new Map([["content-length", "512.5"]]);
			const ctx = createMockContext({ requestHeaders });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0); // parseInt will handle this
		});
	});

	describe("complex validation scenarios", () => {
		it("should validate all aspects together", () => {
			const queryParams = new Map([
				["param1", "value1"],
				["param2", "value2"],
			]);
			const requestHeaders = new Map([
				["content-type", "application/json"],
				["content-length", "256"],
				["authorization", "Bearer token"],
			]);
			const ctx = createMockContext({
				path: "/api/test",
				queryParams,
				requestHeaders,
			});
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should return first validation error encountered", () => {
			// Path is too long, but other validations would also fail
			const longPath = `/${"a".repeat(200)}`;
			const queryParams = new Map();
			for (let i = 0; i < 20; i++) {
				// Too many params
				queryParams.set(`param${i}`, `value${i}`);
			}
			const ctx = createMockContext({
				path: longPath,
				queryParams,
			});
			const result = validateRequest(ctx, defaultConfig);
			// Should return both path error and query param errors
			assert.ok(result.length >= 1);
			assert.ok(result.some((err) => err.includes("Path too long")));
		});

		it("should handle unicode characters in validation", () => {
			const queryParams = new Map([
				["测试", "值"],
				["🔥", "🚀"],
			]);
			const requestHeaders = new Map([["用户代理", "测试浏览器"]]);
			const ctx = createMockContext({
				path: "/测试",
				queryParams,
				requestHeaders,
			});
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle special characters and encoding", () => {
			const queryParams = new Map([
				["special", "short & safe"], // 12 chars < 20 limit
				["encoded", "safe%20value"], // 12 chars < 20 limit
			]);
			const ctx = createMockContext({ queryParams });
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});
	});

	describe("edge cases and boundary conditions", () => {
		it("should handle zero limits gracefully", () => {
			const zeroConfig = {
				maxPathLength: 0,
				maxQueryParams: 0,
				maxQueryParamLength: 0,
				maxHeaders: 0,
				maxHeaderSize: 0,
				maxBodySize: 0,
			};

			// Non-empty path should fail with zero limit
			const ctx = createMockContext({ path: "/test" });
			const result = validateRequest(ctx, zeroConfig);
			assert.strictEqual(result.length, 1);
			assert.ok(result[0].includes("Path too long"));
		});

		it("should handle very large limits", () => {
			const largeConfig = {
				maxPathLength: Number.MAX_SAFE_INTEGER,
				maxQueryParams: Number.MAX_SAFE_INTEGER,
				maxQueryParamLength: Number.MAX_SAFE_INTEGER,
				maxHeaders: Number.MAX_SAFE_INTEGER,
				maxHeaderSize: Number.MAX_SAFE_INTEGER,
				maxBodySize: Number.MAX_SAFE_INTEGER,
			};

			const ctx = createMockContext({
				path: "/very/long/path/that/should/be/accepted",
				queryParams: new Map([["key", "value"]]),
				requestHeaders: new Map([["header", "value"]]),
			});
			const result = validateRequest(ctx, largeConfig);
			assert.strictEqual(result.length, 0);
		});

		it("should handle malformed context gracefully", () => {
			// Test with minimal context that might be malformed
			const ctx = {
				path: "",
				queryParams: new Map(),
				requestHeaders: new Map(),
			};
			const result = validateRequest(ctx, defaultConfig);
			assert.strictEqual(result.length, 0);
		});
	});
});

describe("DEFAULT_VALIDATION", () => {
	it("should have reasonable default values", () => {
		assert.strictEqual(DEFAULT_VALIDATION.maxBodySize, 1024 * 1024); // 1MB
		assert.strictEqual(DEFAULT_VALIDATION.maxHeaderSize, 8192); // 8KB
		assert.strictEqual(DEFAULT_VALIDATION.maxHeaders, 100);
		assert.strictEqual(DEFAULT_VALIDATION.maxQueryParams, 100);
		assert.strictEqual(DEFAULT_VALIDATION.maxQueryParamLength, 1000);
		assert.strictEqual(DEFAULT_VALIDATION.maxPathLength, 2048);
	});

	it("should be usable with validateRequest function", () => {
		const ctx = {
			path: "/test",
			queryParams: new Map([["param", "value"]]),
			requestHeaders: new Map([["header", "value"]]),
		};
		const result = validateRequest(ctx, DEFAULT_VALIDATION);
		assert.strictEqual(result.length, 0);
	});

	it("should have positive values for all limits", () => {
		for (const [key, value] of Object.entries(DEFAULT_VALIDATION)) {
			assert.ok(value > 0, `${key} should be positive, got ${value}`);
		}
	});
});
