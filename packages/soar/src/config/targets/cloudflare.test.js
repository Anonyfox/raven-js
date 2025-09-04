/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for Cloudflare provider base class.
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { Cloudflare } from "./cloudflare.js";

describe("Cloudflare", () => {
	let cloudflare;
	let fetchMock;

	beforeEach(() => {
		cloudflare = new Cloudflare();
		// Mock global fetch
		fetchMock = mock.fn();
		globalThis.fetch = fetchMock;
	});

	afterEach(() => {
		mock.restoreAll();
	});

	describe("constructor", () => {
		it("should create instance extending Base", () => {
			assert.strictEqual(cloudflare instanceof Cloudflare, true);
		});
	});

	describe("request", () => {
		it("should make successful GET request", async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ success: true, result: { test: "data" } }),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			const result = await cloudflare.request("GET", "/test", "test-token");

			assert.strictEqual(fetchMock.mock.callCount(), 1);
			const [url, options] = fetchMock.mock.calls[0].arguments;
			assert.strictEqual(url, "https://api.cloudflare.com/client/v4/test");
			assert.strictEqual(options.method, "GET");
			assert.strictEqual(
				options.headers.get("Authorization"),
				"Bearer test-token",
			);
			assert.deepStrictEqual(result, {
				success: true,
				result: { test: "data" },
			});
		});

		it("should make successful POST request with JSON body", async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ success: true, result: {} }),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			const body = { key: "value" };
			await cloudflare.request("POST", "/test", "test-token", body);

			assert.strictEqual(fetchMock.mock.callCount(), 1);
			const [, options] = fetchMock.mock.calls[0].arguments;
			assert.strictEqual(options.method, "POST");
			assert.strictEqual(
				options.headers.get("Content-Type"),
				"application/json",
			);
			assert.strictEqual(options.body, JSON.stringify(body));
		});

		it("should make successful POST request with FormData body", async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ success: true, result: {} }),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			const formData = new FormData();
			formData.append("file", "content");

			await cloudflare.request("POST", "/test", "test-token", formData);

			assert.strictEqual(fetchMock.mock.callCount(), 1);
			const [, options] = fetchMock.mock.calls[0].arguments;
			assert.strictEqual(options.method, "POST");
			assert.strictEqual(options.headers.get("Content-Type"), null);
			assert.strictEqual(options.body, formData);
		});

		it("should include additional headers", async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ success: true, result: {} }),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			const headers = { "X-Custom": "header" };
			await cloudflare.request("GET", "/test", "test-token", null, headers);

			assert.strictEqual(fetchMock.mock.callCount(), 1);
			const [, options] = fetchMock.mock.calls[0].arguments;
			// Headers is now a Headers object
			assert.strictEqual(options.headers.get("X-Custom"), "header");
			assert.strictEqual(
				options.headers.get("Authorization"),
				"Bearer test-token",
			);
		});

		it("should throw error for missing API token", async () => {
			await assert.rejects(
				() => cloudflare.request("GET", "/test", ""),
				/Cloudflare API token is required/,
			);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", null),
				/Cloudflare API token is required/,
			);
		});

		it("should throw error for HTTP error status", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					success: false,
					errors: [{ code: 1000, message: "Bad request" }],
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/Cloudflare API error \(400\): 1000: Bad request/,
			);
		});

		it("should throw error for Cloudflare API success: false", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				json: async () => ({
					success: false,
					errors: [{ code: 2000, message: "Unauthorized" }],
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/Cloudflare API error \(200\): 2000: Unauthorized/,
			);
		});

		it("should handle network errors", async () => {
			fetchMock.mock.mockImplementation(async () => {
				throw new TypeError("fetch failed");
			});

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/Network error: fetch failed/,
			);
		});

		it("should handle JSON parsing errors", async () => {
			const mockResponse = {
				ok: true,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/Invalid JSON/,
			);
		});
	});

	describe("authenticate", () => {
		it("should return true for valid API token", async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ success: true, result: {} }),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			const result = await cloudflare.authenticate("valid-token");
			assert.strictEqual(result, true);

			assert.strictEqual(fetchMock.mock.callCount(), 1);
			const [url] = fetchMock.mock.calls[0].arguments;
			assert.strictEqual(
				url,
				"https://api.cloudflare.com/client/v4/user/tokens/verify",
			);
		});

		it("should throw error for invalid API token", async () => {
			const mockResponse = {
				ok: false,
				status: 401,
				json: async () => ({
					success: false,
					errors: [{ code: 6003, message: "Invalid request headers" }],
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.authenticate("invalid-token"),
				/Cloudflare authentication failed: Cloudflare API error \(401\): 6003: Invalid request headers/,
			);
		});
	});

	describe("getCredentials", () => {
		it("should throw error - must be implemented by subclasses", async () => {
			await assert.rejects(
				() => cloudflare.getCredentials(),
				/getCredentials\(\) must be implemented by concrete product classes/,
			);
		});
	});

	describe("error formatting", () => {
		it("should format single error", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					success: false,
					errors: [{ code: 1000, message: "Single error" }],
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/1000: Single error/,
			);
		});

		it("should format multiple errors", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					success: false,
					errors: [
						{ code: 1000, message: "First error" },
						{ code: 2000, message: "Second error" },
					],
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/1000: First error, 2000: Second error/,
			);
		});

		it("should format messages when no errors", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					success: false,
					messages: ["Warning message", "Info message"],
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/Warning message, Info message/,
			);
		});

		it("should handle unknown error format", async () => {
			const mockResponse = {
				ok: false,
				status: 500,
				json: async () => ({
					success: false,
					error: "Custom error message",
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/Custom error message/,
			);
		});

		it("should handle completely unknown error format", async () => {
			const mockResponse = {
				ok: false,
				status: 500,
				json: async () => ({
					success: false,
				}),
			};
			fetchMock.mock.mockImplementation(async () => mockResponse);

			await assert.rejects(
				() => cloudflare.request("GET", "/test", "test-token"),
				/Unknown Cloudflare API error/,
			);
		});
	});
});
