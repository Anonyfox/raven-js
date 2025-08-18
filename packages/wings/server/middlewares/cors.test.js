/**
 * @fileoverview CORS Middleware Tests
 *
 * Comprehensive test suite for the CORS middleware covering all configuration
 * options, request types, and edge cases to ensure 100% code coverage and
 * standards compliance.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Context } from "../../core/context.js";
import { CORS } from "./cors.js";

/**
 * Create a mock Context for testing
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Object} headers - Request headers
 * @returns {Context} Mock context instance
 */
function createMockContext(
	method = "GET",
	url = "http://localhost/test",
	headers = {},
) {
	const mockUrl = new URL(url);
	const mockHeaders = new Headers(headers);
	const ctx = new Context(method, mockUrl, mockHeaders);

	// Initialize response properties
	ctx.responseStatusCode = 200;
	ctx.responseBody = "test response";
	ctx.responseHeaders = new Headers();
	ctx.responseEnded = false;
	ctx.errors = [];

	return ctx;
}

/**
 * Execute middleware and any after callbacks
 *
 * @param {CORS} middleware - CORS middleware instance
 * @param {Context} ctx - Request context
 */
async function executeMiddleware(middleware, ctx) {
	// Execute the main middleware
	await middleware.execute(ctx);

	// Execute any after callbacks (for non-OPTIONS requests)
	await ctx.runAfterCallbacks();
}

test("CORS Middleware - Configuration Validation", async (t) => {
	await t.test("should create with default options", () => {
		const cors = new CORS();
		assert.equal(cors.origin, "*");
		assert.deepEqual(cors.methods, [
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"PATCH",
			"OPTIONS",
		]);
		assert.deepEqual(cors.allowedHeaders, ["Content-Type", "Authorization"]);
		assert.deepEqual(cors.exposedHeaders, []);
		assert.equal(cors.credentials, false);
		assert.equal(cors.maxAge, 86400);
	});

	await t.test("should create with custom options", () => {
		const options = {
			origin: "https://example.com",
			methods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
			exposedHeaders: ["X-Total-Count"],
			credentials: true,
			maxAge: 3600,
		};

		const cors = new CORS(options);
		assert.equal(cors.origin, "https://example.com");
		assert.deepEqual(cors.methods, ["GET", "POST"]);
		assert.deepEqual(cors.allowedHeaders, ["Content-Type"]);
		assert.deepEqual(cors.exposedHeaders, ["X-Total-Count"]);
		assert.equal(cors.credentials, true);
		assert.equal(cors.maxAge, 3600);
	});

	await t.test("should throw error for invalid methods", () => {
		assert.throws(
			() => new CORS({ methods: [] }),
			/CORS: methods must be a non-empty array/,
		);

		assert.throws(
			() => new CORS({ methods: "invalid" }),
			/CORS: methods must be a non-empty array/,
		);
	});

	await t.test("should throw error for invalid allowedHeaders", () => {
		assert.throws(
			() => new CORS({ allowedHeaders: "invalid" }),
			/CORS: allowedHeaders must be an array/,
		);
	});

	await t.test("should throw error for invalid exposedHeaders", () => {
		assert.throws(
			() => new CORS({ exposedHeaders: "invalid" }),
			/CORS: exposedHeaders must be an array/,
		);
	});

	await t.test("should throw error for invalid credentials", () => {
		assert.throws(
			() => new CORS({ credentials: "invalid" }),
			/CORS: credentials must be a boolean/,
		);
	});

	await t.test("should throw error for invalid maxAge", () => {
		assert.throws(
			() => new CORS({ maxAge: -1 }),
			/CORS: maxAge must be a non-negative number/,
		);

		assert.throws(
			() => new CORS({ maxAge: "invalid" }),
			/CORS: maxAge must be a non-negative number/,
		);
	});

	await t.test(
		"should throw error for wildcard origin with credentials",
		() => {
			assert.throws(
				() => new CORS({ origin: "*", credentials: true }),
				/CORS: Cannot use wildcard origin with credentials/,
			);

			assert.throws(
				() => new CORS({ origin: true, credentials: true }),
				/CORS: Cannot use wildcard origin with credentials/,
			);
		},
	);
});

test("CORS Middleware - Origin Validation", async (t) => {
	await t.test("should handle string origin configuration", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		// Allowed origin
		const ctx1 = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		await executeMiddleware(cors, ctx1);
		assert.equal(
			ctx1.responseHeaders.get("access-control-allow-origin"),
			"https://example.com",
		);

		// Disallowed origin
		const ctx2 = createMockContext("GET", "http://localhost/test", {
			origin: "https://malicious.com",
		});
		await executeMiddleware(cors, ctx2);
		assert.equal(ctx2.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should handle array origin configuration", async () => {
		const cors = new CORS({ origin: ["https://app1.com", "https://app2.com"] });

		// First allowed origin
		const ctx1 = createMockContext("GET", "http://localhost/test", {
			origin: "https://app1.com",
		});
		await executeMiddleware(cors, ctx1);
		assert.equal(
			ctx1.responseHeaders.get("access-control-allow-origin"),
			"https://app1.com",
		);

		// Second allowed origin
		const ctx2 = createMockContext("GET", "http://localhost/test", {
			origin: "https://app2.com",
		});
		await executeMiddleware(cors, ctx2);
		assert.equal(
			ctx2.responseHeaders.get("access-control-allow-origin"),
			"https://app2.com",
		);

		// Disallowed origin
		const ctx3 = createMockContext("GET", "http://localhost/test", {
			origin: "https://malicious.com",
		});
		await executeMiddleware(cors, ctx3);
		assert.equal(ctx3.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should handle regex origin configuration", async () => {
		const cors = new CORS({ origin: /^https:\/\/.*\.example\.com$/ });

		// Matching subdomain
		const ctx1 = createMockContext("GET", "http://localhost/test", {
			origin: "https://api.example.com",
		});
		await executeMiddleware(cors, ctx1);
		assert.equal(
			ctx1.responseHeaders.get("access-control-allow-origin"),
			"https://api.example.com",
		);

		// Non-matching origin
		const ctx2 = createMockContext("GET", "http://localhost/test", {
			origin: "https://malicious.com",
		});
		await executeMiddleware(cors, ctx2);
		assert.equal(ctx2.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should handle function origin configuration", async () => {
		const cors = new CORS({
			origin: (origin) => origin?.includes("localhost"),
		});

		// Function returns true
		const ctx1 = createMockContext("GET", "http://localhost/test", {
			origin: "http://localhost:3000",
		});
		await executeMiddleware(cors, ctx1);
		assert.equal(
			ctx1.responseHeaders.get("access-control-allow-origin"),
			"http://localhost:3000",
		);

		// Function returns false
		const ctx2 = createMockContext("GET", "http://localhost/test", {
			origin: "https://production.com",
		});
		await executeMiddleware(cors, ctx2);
		assert.equal(ctx2.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should handle function origin with errors", async () => {
		const cors = new CORS({
			origin: () => {
				throw new Error("Validation error");
			},
		});

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "http://localhost:3000",
		});
		await executeMiddleware(cors, ctx);
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should handle boolean origin configuration", async () => {
		// Test true (wildcard)
		const corsTrue = new CORS({ origin: true, credentials: false });
		const ctx1 = createMockContext("GET", "http://localhost/test", {
			origin: "https://any-origin.com",
		});
		await executeMiddleware(corsTrue, ctx1);
		assert.equal(ctx1.responseHeaders.get("access-control-allow-origin"), "*");

		// Test false (disabled)
		const corsFalse = new CORS({ origin: false });
		const ctx2 = createMockContext("GET", "http://localhost/test", {
			origin: "https://any-origin.com",
		});
		await executeMiddleware(corsFalse, ctx2);
		assert.equal(ctx2.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should handle wildcard origin configuration", async () => {
		const cors = new CORS({ origin: "*", credentials: false });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://any-origin.com",
		});
		await executeMiddleware(cors, ctx);
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), "*");
	});

	await t.test(
		"should handle same-origin requests (no origin header)",
		async () => {
			const cors = new CORS({ origin: "https://example.com" });

			// No origin header = same-origin request
			const ctx = createMockContext("GET", "http://localhost/test", {});
			await executeMiddleware(cors, ctx);
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);
});

test("CORS Middleware - Preflight OPTIONS Requests", async (t) => {
	await t.test("should handle valid preflight request", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			methods: ["GET", "POST", "PUT"],
			allowedHeaders: ["Content-Type", "Authorization"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			"access-control-request-headers": "Content-Type, Authorization",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseBody, "");
		assert.equal(ctx.responseEnded, true);
		assert.equal(
			ctx.responseHeaders.get("access-control-allow-origin"),
			"https://example.com",
		);
		assert.equal(
			ctx.responseHeaders.get("access-control-allow-methods"),
			"GET, POST, PUT",
		);
		assert.equal(
			ctx.responseHeaders.get("access-control-allow-headers"),
			"Content-Type, Authorization",
		);
		assert.equal(ctx.responseHeaders.get("access-control-max-age"), "86400");
	});

	await t.test("should reject preflight with invalid origin", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://malicious.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Origin not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should reject preflight with invalid method", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			methods: ["GET", "POST"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "DELETE",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Method not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should reject preflight with invalid headers", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			allowedHeaders: ["Content-Type"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			"access-control-request-headers": "Content-Type, X-Custom-Header",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Headers not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle preflight without requested method", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			// No access-control-request-method header
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test(
		"should handle preflight without requested headers",
		async () => {
			const cors = new CORS({ origin: "https://example.com" });

			const ctx = createMockContext("OPTIONS", "http://localhost/test", {
				origin: "https://example.com",
				"access-control-request-method": "GET",
				// No access-control-request-headers header
			});

			await executeMiddleware(cors, ctx);

			assert.equal(ctx.responseStatusCode, 204);
			assert.equal(ctx.responseEnded, true);
		},
	);

	await t.test("should handle preflight with allowed method", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			methods: ["GET", "POST", "PUT"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST", // Method IS allowed
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle preflight with allowed headers", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			"access-control-request-headers": "Content-Type, Authorization", // Headers ARE allowed
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test(
		"should handle preflight with method that causes toUpperCase error",
		async () => {
			const cors = new CORS({ origin: "https://example.com" });

			const ctx = createMockContext("OPTIONS", "http://localhost/test", {
				origin: "https://example.com",
			});

			// Mock requestHeaders.get to return an object that will error on toUpperCase
			const originalGet = ctx.requestHeaders.get;
			ctx.requestHeaders.get = (name) => {
				if (name === "access-control-request-method") {
					return {
						toString: () => {
							throw new Error("toString error");
						},
					}; // Will error on string conversion
				}
				return originalGet.call(ctx.requestHeaders, name);
			};

			await executeMiddleware(cors, ctx);

			assert.equal(ctx.responseStatusCode, 500);
			assert.equal(ctx.responseBody, "CORS: Internal error during preflight");
			assert.equal(ctx.responseEnded, true);
		},
	);

	await t.test("should handle preflight errors gracefully", async () => {
		// Create a CORS instance that will throw an error during processing
		const cors = new CORS({
			origin: () => {
				throw new Error("Test error");
			},
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 500);
		assert.equal(ctx.responseBody, "CORS: Internal error during preflight");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle preflight without origin header", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			"access-control-request-method": "POST",
			// No origin header (same-origin request)
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Origin not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test(
		"should handle wildcard origin security constraint in preflight",
		async () => {
			// Create CORS with wildcard but manually enable credentials to test runtime check
			const cors = new CORS({ origin: "*", credentials: false });
			cors.credentials = true; // Enable credentials after creation

			const ctx = createMockContext("OPTIONS", "http://localhost/test", {
				origin: "https://example.com",
				"access-control-request-method": "POST",
			});

			await executeMiddleware(cors, ctx);

			assert.equal(ctx.responseStatusCode, 500);
			assert.equal(ctx.responseBody, "CORS: Internal error during preflight");
			assert.equal(ctx.responseEnded, true);
			assert.equal(ctx.errors.length, 1);
			assert.equal(ctx.errors[0].name, "CORSError");
			assert.equal(
				ctx.errors[0].message.includes("wildcard origin with credentials"),
				true,
			);
		},
	);

	await t.test("should handle wildcard origin in preflight", async () => {
		const cors = new CORS({ origin: "*", credentials: false });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), "*");
	});

	await t.test("should handle disabled CORS in preflight", async () => {
		const cors = new CORS({ origin: false });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Origin not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle array origin in preflight", async () => {
		const cors = new CORS({ origin: ["https://app1.com", "https://app2.com"] });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://app1.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
		assert.equal(
			ctx.responseHeaders.get("access-control-allow-origin"),
			"https://app1.com",
		);
	});

	await t.test("should handle regex origin in preflight", async () => {
		const cors = new CORS({ origin: /^https:\/\/.*\.example\.com$/ });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://api.example.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
		assert.equal(
			ctx.responseHeaders.get("access-control-allow-origin"),
			"https://api.example.com",
		);
	});

	await t.test("should handle unknown origin type in preflight", async () => {
		const cors = new CORS({ origin: "https://example.com" });
		// Manually set origin to an unknown type
		cors.origin = 123; // Number type, not supported

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Origin not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test(
		"should handle string origin mismatch in preflight",
		async () => {
			const cors = new CORS({ origin: "https://allowed.com" });

			const ctx = createMockContext("OPTIONS", "http://localhost/test", {
				origin: "https://disallowed.com",
				"access-control-request-method": "POST",
			});

			await executeMiddleware(cors, ctx);

			assert.equal(ctx.responseStatusCode, 403);
			assert.equal(ctx.responseBody, "CORS: Origin not allowed");
			assert.equal(ctx.responseEnded, true);
		},
	);

	await t.test("should handle array origin mismatch in preflight", async () => {
		const cors = new CORS({ origin: ["https://app1.com", "https://app2.com"] });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://disallowed.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Origin not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle regex origin mismatch in preflight", async () => {
		const cors = new CORS({ origin: /^https:\/\/.*\.example\.com$/ });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://malicious.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 403);
		assert.equal(ctx.responseBody, "CORS: Origin not allowed");
		assert.equal(ctx.responseEnded, true);
	});

	await t.test(
		"should handle function origin returning false in preflight",
		async () => {
			const cors = new CORS({
				origin: (origin) => {
					// Explicitly return false for this test case
					if (origin === "https://disallowed.com") return false;
					return true;
				},
			});

			const ctx = createMockContext("OPTIONS", "http://localhost/test", {
				origin: "https://disallowed.com",
				"access-control-request-method": "POST",
			});

			await executeMiddleware(cors, ctx);

			assert.equal(ctx.responseStatusCode, 403);
			assert.equal(ctx.responseBody, "CORS: Origin not allowed");
			assert.equal(ctx.responseEnded, true);
		},
	);
});

test("CORS Middleware - Regular Request Headers", async (t) => {
	await t.test("should set basic CORS headers for allowed origin", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(
			ctx.responseHeaders.get("access-control-allow-origin"),
			"https://example.com",
		);
		assert.equal(ctx.responseHeaders.get("vary"), "Origin");
	});

	await t.test("should set credentials header when enabled", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			credentials: true,
		});

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(
			ctx.responseHeaders.get("access-control-allow-credentials"),
			"true",
		);
	});

	await t.test("should set exposed headers when configured", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			exposedHeaders: ["X-Total-Count", "X-RateLimit-Remaining"],
		});

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(
			ctx.responseHeaders.get("access-control-expose-headers"),
			"X-Total-Count, X-RateLimit-Remaining",
		);
	});

	await t.test("should handle existing Vary header", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		ctx.responseHeaders.set("Vary", "Accept-Encoding");

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseHeaders.get("vary"), "Accept-Encoding, Origin");
	});

	await t.test(
		"should set headers when no exposed headers configured",
		async () => {
			const cors = new CORS({
				origin: "https://example.com",
				exposedHeaders: [], // Explicitly empty array
			});

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://example.com",
			});

			await executeMiddleware(cors, ctx);

			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				"https://example.com",
			);
			// Should not set exposed headers when length is 0
			assert.equal(
				ctx.responseHeaders.get("access-control-expose-headers"),
				null,
			);
			assert.equal(ctx.responseHeaders.get("vary"), "Origin");
		},
	);

	await t.test(
		"should handle response body with truthy non-string value",
		async () => {
			const cors = new CORS({ origin: "https://example.com" });

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://example.com",
			});
			ctx.responseBody = 42; // Truthy non-falsy value
			ctx.responseEnded = false;

			await executeMiddleware(cors, ctx);

			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				"https://example.com",
			);
			assert.equal(ctx.responseHeaders.get("vary"), "Origin");
		},
	);

	await t.test("should not set headers for disallowed origin", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://malicious.com",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
		assert.equal(ctx.responseHeaders.get("vary"), null);
	});

	await t.test("should handle header setting errors gracefully", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});

		// Mock responseHeaders.set to throw an error
		ctx.responseHeaders.set = () => {
			throw new Error("Header error");
		};

		await executeMiddleware(cors, ctx);

		// Should not crash, error should be added to ctx.errors
		assert.equal(ctx.errors.length, 1);
		assert.equal(ctx.errors[0].name, "CORSError");
	});

	await t.test(
		"should handle unknown origin type in regular requests",
		async () => {
			const cors = new CORS({ origin: "https://example.com" });
			// Manually set origin to an unknown type
			cors.origin = Symbol("unknown"); // Symbol type, not supported

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://example.com",
			});

			await executeMiddleware(cors, ctx);

			// Should not set CORS headers for unknown origin type
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);

	await t.test(
		"should handle string origin mismatch in regular requests",
		async () => {
			const cors = new CORS({ origin: "https://allowed.com" });

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://disallowed.com",
			});

			await executeMiddleware(cors, ctx);

			// Should not set CORS headers for disallowed string origin
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);

	await t.test(
		"should handle array origin mismatch in regular requests",
		async () => {
			const cors = new CORS({
				origin: ["https://app1.com", "https://app2.com"],
			});

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://disallowed.com",
			});

			await executeMiddleware(cors, ctx);

			// Should not set CORS headers for disallowed array origin
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);

	await t.test(
		"should handle regex origin mismatch in regular requests",
		async () => {
			const cors = new CORS({ origin: /^https:\/\/.*\.example\.com$/ });

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://malicious.com",
			});

			await executeMiddleware(cors, ctx);

			// Should not set CORS headers for disallowed regex origin
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);

	await t.test(
		"should handle function origin returning false in regular requests",
		async () => {
			const cors = new CORS({
				origin: (origin) => {
					// Explicitly return false for this test case
					if (origin === "https://disallowed.com") return false;
					return true;
				},
			});

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://disallowed.com",
			});

			await executeMiddleware(cors, ctx);

			// Should not set CORS headers when function returns false
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);

	await t.test(
		"should handle boolean origin false in regular requests",
		async () => {
			const cors = new CORS({ origin: false });

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://example.com",
			});

			await executeMiddleware(cors, ctx);

			// Should not set CORS headers when origin is false
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);
});

test("CORS Middleware - Security Constraints", async (t) => {
	await t.test(
		"should prevent wildcard origin with credentials in runtime",
		async () => {
			// This tests the runtime check when getAllowedOrigin is called
			const cors = new CORS({ origin: "*", credentials: false });

			// Manually set credentials to true to test runtime check
			cors.credentials = true;

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://example.com",
			});

			await executeMiddleware(cors, ctx);

			// Should have error in ctx.errors
			assert.equal(ctx.errors.length, 1);
			assert.equal(
				ctx.errors[0].message.includes(
					"Cannot use wildcard origin with credentials",
				),
				true,
			);
		},
	);
});

test("CORS Middleware - Header Parsing", async (t) => {
	await t.test("should parse comma-separated headers correctly", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			allowedHeaders: ["content-type", "authorization", "x-api-key"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			"access-control-request-headers":
				"Content-Type, Authorization, X-API-Key",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle malformed header values", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			allowedHeaders: ["Content-Type"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			"access-control-request-headers": ",,, Content-Type ,,,  ",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle empty header values", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			"access-control-request-headers": "",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle falsy header values", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
		});

		// Mock the get method to return undefined
		const originalGet = ctx.requestHeaders.get;
		ctx.requestHeaders.get = (name) => {
			if (name === "access-control-request-headers") {
				return undefined; // Falsy value
			}
			return originalGet.call(ctx.requestHeaders, name);
		};

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle null header values", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			// No access-control-request-headers header (null)
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle non-string header values", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
		});

		// Mock the get method to return a non-string value
		const originalGet = ctx.requestHeaders.get;
		ctx.requestHeaders.get = (name) => {
			if (name === "access-control-request-headers") {
				return 123; // Non-string value
			}
			return originalGet.call(ctx.requestHeaders, name);
		};

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});
});

test("CORS Middleware - Edge Cases", async (t) => {
	await t.test("should handle case-insensitive method validation", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			methods: ["GET", "POST"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "post", // lowercase
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test("should handle case-insensitive header validation", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			allowedHeaders: ["Content-Type", "Authorization"],
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
			"access-control-request-headers": "content-type, AUTHORIZATION",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseStatusCode, 204);
		assert.equal(ctx.responseEnded, true);
	});

	await t.test(
		"should handle empty requested headers array in validation",
		async () => {
			const cors = new CORS({
				origin: "https://example.com",
				allowedHeaders: ["Content-Type", "Authorization"],
			});

			const ctx = createMockContext("OPTIONS", "http://localhost/test", {
				origin: "https://example.com",
				"access-control-request-method": "POST",
				"access-control-request-headers": ",,,", // This should parse to empty array
			});

			await executeMiddleware(cors, ctx);

			assert.equal(ctx.responseStatusCode, 204);
			assert.equal(ctx.responseEnded, true);
		},
	);

	await t.test("should skip CORS for already ended responses", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		ctx.responseEnded = true; // Response already ended

		await executeMiddleware(cors, ctx);

		// Should not set CORS headers on already ended response
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should skip CORS for responses without body", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		ctx.responseBody = null; // No response body

		await executeMiddleware(cors, ctx);

		// Should not set CORS headers on responses without body
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should skip CORS for responses with empty body", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		ctx.responseBody = ""; // Empty response body

		await executeMiddleware(cors, ctx);

		// Should not set CORS headers on responses with empty body
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test(
		"should skip CORS for responses with undefined body",
		async () => {
			const cors = new CORS({ origin: "https://example.com" });

			const ctx = createMockContext("GET", "http://localhost/test", {
				origin: "https://example.com",
			});
			ctx.responseBody = undefined; // Undefined response body

			await executeMiddleware(cors, ctx);

			// Should not set CORS headers on responses with undefined body
			assert.equal(
				ctx.responseHeaders.get("access-control-allow-origin"),
				null,
			);
		},
	);

	await t.test("should skip CORS for responses with 0 body", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		ctx.responseBody = 0; // Zero response body

		await executeMiddleware(cors, ctx);

		// Should not set CORS headers on responses with 0 body
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should skip CORS for responses with false body", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		ctx.responseBody = false; // False response body

		await executeMiddleware(cors, ctx);

		// Should not set CORS headers on responses with false body
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should skip CORS for responses with NaN body", async () => {
		const cors = new CORS({ origin: "https://example.com" });

		const ctx = createMockContext("GET", "http://localhost/test", {
			origin: "https://example.com",
		});
		ctx.responseBody = NaN; // NaN response body

		await executeMiddleware(cors, ctx);

		// Should not set CORS headers on responses with NaN body
		assert.equal(ctx.responseHeaders.get("access-control-allow-origin"), null);
	});

	await t.test("should handle custom identifier", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			identifier: "custom-cors-identifier",
		});

		assert.equal(cors.identifier, "custom-cors-identifier");
	});

	await t.test("should handle maxAge configuration", async () => {
		const cors = new CORS({
			origin: "https://example.com",
			maxAge: 3600,
		});

		const ctx = createMockContext("OPTIONS", "http://localhost/test", {
			origin: "https://example.com",
			"access-control-request-method": "POST",
		});

		await executeMiddleware(cors, ctx);

		assert.equal(ctx.responseHeaders.get("access-control-max-age"), "3600");
	});
});

test("CORS Middleware - Integration", async (t) => {
	await t.test("should work as middleware with identifier", () => {
		const cors = new CORS();
		assert.equal(typeof cors.handler, "function");
		assert.equal(cors.identifier, "@raven-js/wings/cors");
	});

	await t.test("should clone configuration arrays to prevent mutation", () => {
		const methods = ["GET", "POST"];
		const allowedHeaders = ["Content-Type"];
		const exposedHeaders = ["X-Total-Count"];

		const cors = new CORS({
			methods,
			allowedHeaders,
			exposedHeaders,
		});

		// Mutate original arrays
		methods.push("DELETE");
		allowedHeaders.push("Authorization");
		exposedHeaders.push("X-RateLimit");

		// CORS instance should have original values
		assert.deepEqual(cors.methods, ["GET", "POST"]);
		assert.deepEqual(cors.allowedHeaders, ["Content-Type"]);
		assert.deepEqual(cors.exposedHeaders, ["X-Total-Count"]);
	});

	await t.test("should have correct middleware inheritance", () => {
		const cors = new CORS();
		assert.equal(cors.constructor.name, "CORS");
		assert.equal(Object.getPrototypeOf(cors.constructor).name, "Middleware");
	});
});
