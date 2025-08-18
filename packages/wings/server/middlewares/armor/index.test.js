/**
 * @fileoverview Tests for Armor Middleware - Main orchestrator class
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Armor } from "./index.js";

/**
 * Create a mock context for testing
 *
 * @param {Object} options - Context options
 * @param {string} [options.path='/'] - Request path
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Map<string, string>} [options.requestHeaders] - Request headers
 * @param {Map<string, string>} [options.queryParams] - Query parameters
 * @param {Map<string, string>} [options.responseHeaders] - Response headers (will be created if not provided)
 * @param {any} [options.responseBody] - Response body
 * @param {number} [options.responseStatusCode] - Response status code
 * @param {boolean} [options.responseEnded] - Whether response has ended
 * @returns {Object} Mock context
 */
function createMockContext(options = {}) {
	const {
		path = "/",
		method = "GET",
		requestHeaders = new Map(),
		queryParams = new Map(),
		responseHeaders = new Map(),
		responseBody = null,
		responseStatusCode = 200,
		responseEnded = false,
	} = options;

	return {
		path,
		method,
		requestHeaders,
		queryParams,
		responseHeaders,
		responseBody,
		responseStatusCode,
		responseEnded,
		errors: [],
		afterCallbacks: [],
		addAfterCallback(callback) {
			this.afterCallbacks.push(callback);
		},
	};
}

describe("Armor Middleware", () => {
	describe("Constructor", () => {
		test("should create with default configuration", () => {
			const armor = new Armor();
			assert.ok(armor instanceof Armor);
			assert.strictEqual(armor.identifier, "@raven-js/wings/armor");
			assert.ok(armor.config);
			assert.strictEqual(armor.config.enabled, true);
		});

		test("should create with custom configuration", () => {
			const armor = new Armor({
				enabled: false,
				rateLimiting: {
					enabled: true,
					global: { max: 50, windowMs: 30000 },
				},
			});

			assert.strictEqual(armor.config.enabled, false);
			assert.strictEqual(armor.config.rateLimiting.global.max, 50);
		});

		test("should create with custom identifier", () => {
			const armor = new Armor({}, "custom-armor");
			assert.strictEqual(armor.identifier, "custom-armor");
		});

		test("should initialize rate limit store when enabled", () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: true,
					global: { max: 100, windowMs: 60000 },
				},
			});

			assert.ok(armor.rateLimitStore);
		});

		test("should not initialize rate limit store when disabled", () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: false,
				},
			});

			assert.strictEqual(armor.rateLimitStore, null);
		});

		test("should throw error for invalid configuration", () => {
			assert.throws(() => {
				new Armor({
					ipAccess: {
						mode: "invalid-mode",
					},
				});
			});
		});
	});

	describe("IP Access Control", () => {
		test("should allow all IPs when IP control is disabled", async () => {
			const armor = new Armor({
				ipAccess: { mode: "disabled" },
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.100"]]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseEnded, false);
		});

		test("should allow IPs in whitelist", async () => {
			const armor = new Armor({
				ipAccess: {
					mode: "whitelist",
					whitelist: ["192.168.1.100", "10.0.0.0/8"],
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.100"]]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseEnded, false);
		});

		test("should block IPs not in whitelist", async () => {
			const armor = new Armor({
				ipAccess: {
					mode: "whitelist",
					whitelist: ["192.168.1.0/24"],
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "10.0.0.1"]]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 403);
			assert.strictEqual(ctx.responseBody, "Forbidden: IP access denied");
			assert.strictEqual(ctx.responseEnded, true);
			assert.ok(ctx.errors.some((e) => e.name === "IPBlocked"));
		});

		test("should block IPs in blacklist", async () => {
			const armor = new Armor({
				ipAccess: {
					mode: "blacklist",
					blacklist: ["192.168.1.0/24"],
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.100"]]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 403);
			assert.strictEqual(ctx.responseBody, "Forbidden: IP access denied");
			assert.strictEqual(ctx.responseEnded, true);
		});

		test("should respect proxy headers when trustProxy is enabled", async () => {
			const armor = new Armor({
				ipAccess: {
					mode: "whitelist",
					whitelist: ["203.0.113.10"],
					trustProxy: true,
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([
					["x-forwarded-for", "203.0.113.10, 192.168.1.1"],
					["remote-addr", "192.168.1.1"],
				]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseEnded, false);
		});
	});

	describe("Rate Limiting", () => {
		test("should allow requests under rate limit", async () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: true,
					global: { max: 5, windowMs: 60000 },
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.1"]]),
			});

			// Make multiple requests under the limit
			for (let i = 0; i < 3; i++) {
				await armor.handler(ctx);
				assert.strictEqual(ctx.responseStatusCode, 200);
				assert.strictEqual(ctx.responseEnded, false);
			}
		});

		test("should block requests over rate limit", async () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: true,
					global: { max: 2, windowMs: 60000 },
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.1"]]),
			});

			// First two requests should pass
			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 200);

			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 200);

			// Third request should be blocked
			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 429);
			assert.strictEqual(ctx.responseBody, "Too Many Requests");
			assert.strictEqual(ctx.responseEnded, true);
			assert.ok(ctx.responseHeaders.has("Retry-After"));
			assert.ok(ctx.errors.some((e) => e.name === "RateLimitExceeded"));
		});

		test("should use route-specific rate limits", async () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: true,
					global: { max: 100, windowMs: 60000 },
					routes: {
						"/api/auth/": { max: 1, windowMs: 60000 },
					},
				},
			});

			const ctx = createMockContext({
				path: "/api/auth/login",
				requestHeaders: new Map([["remote-addr", "192.168.1.1"]]),
			});

			// First request should pass
			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 200);

			// Second request should be blocked due to route-specific limit
			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 429);
		});

		test("should use custom key generator", async () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: true,
					global: { max: 1, windowMs: 60000 },
					keyGenerator: (ctx) =>
						ctx.requestHeaders.get("user-id") || "anonymous",
				},
			});

			const ctx1 = createMockContext({
				requestHeaders: new Map([["user-id", "user123"]]),
			});

			const ctx2 = createMockContext({
				requestHeaders: new Map([["user-id", "user456"]]),
			});

			// Each user should have independent rate limits
			await armor.handler(ctx1);
			assert.strictEqual(ctx1.responseStatusCode, 200);

			await armor.handler(ctx2);
			assert.strictEqual(ctx2.responseStatusCode, 200);

			// Second request from same user should be blocked
			await armor.handler(ctx1);
			assert.strictEqual(ctx1.responseStatusCode, 429);
		});
	});

	describe("Request Validation", () => {
		test("should allow valid requests", async () => {
			const armor = new Armor({
				requestValidation: {
					enabled: true,
				},
			});

			const ctx = createMockContext({
				path: "/api/data",
				queryParams: new Map([["param", "value"]]),
				requestHeaders: new Map([["content-type", "application/json"]]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseEnded, false);
		});

		test("should reject requests with path too long", async () => {
			const armor = new Armor({
				requestValidation: {
					enabled: true,
					maxPathLength: 10,
				},
			});

			const ctx = createMockContext({
				path: "/very/long/path/that/exceeds/the/limit",
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 400);
			assert.strictEqual(
				ctx.responseBody,
				"Bad Request: Invalid request format",
			);
			assert.strictEqual(ctx.responseEnded, true);
			assert.ok(ctx.errors.some((e) => e.name === "RequestValidationError"));
		});

		test("should reject requests with too many query parameters", async () => {
			const armor = new Armor({
				requestValidation: {
					enabled: true,
					maxQueryParams: 2,
				},
			});

			const ctx = createMockContext({
				queryParams: new Map([
					["param1", "value1"],
					["param2", "value2"],
					["param3", "value3"],
				]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 400);
			assert.strictEqual(ctx.responseEnded, true);
		});
	});

	describe("Attack Detection", () => {
		test("should detect SQL injection attempts", async () => {
			const armor = new Armor({
				attackDetection: {
					sqlInjection: true,
				},
			});

			const ctx = createMockContext({
				path: "/api/users",
				queryParams: new Map([["id", "1 OR 1=1"]]),
			});

			await armor.handler(ctx);

			// Attack detection is non-blocking, so request continues
			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseEnded, false);

			// But error should be logged
			const attackError = ctx.errors.find(
				(e) => e.name === "AttackPatternDetected",
			);
			assert.ok(attackError);
			assert.ok(attackError.attackDescription.includes("SQL injection"));
		});

		test("should detect XSS attempts", async () => {
			const armor = new Armor({
				attackDetection: {
					xss: true,
				},
			});

			const ctx = createMockContext({
				queryParams: new Map([["comment", "<script>alert('xss')</script>"]]),
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 200);
			const attackError = ctx.errors.find(
				(e) => e.name === "AttackPatternDetected",
			);
			assert.ok(attackError);
			assert.ok(attackError.attackDescription.includes("XSS"));
		});

		test("should detect path traversal attempts", async () => {
			const armor = new Armor({
				attackDetection: {
					pathTraversal: true,
				},
			});

			const ctx = createMockContext({
				path: "/api/files/../../../etc/passwd",
			});

			await armor.handler(ctx);

			assert.strictEqual(ctx.responseStatusCode, 200);
			const attackError = ctx.errors.find(
				(e) => e.name === "AttackPatternDetected",
			);
			assert.ok(attackError);
			assert.ok(attackError.attackDescription.includes("Path traversal"));
		});

		test("should handle attack detection errors gracefully", async () => {
			const armor = new Armor({
				attackDetection: {
					sqlInjection: true,
				},
			});

			// Create context that might cause detection error
			const ctx = createMockContext({
				queryParams: null, // This should cause an error
			});

			await armor.handler(ctx);

			// Request should continue despite detection error
			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.ok(ctx.errors.some((e) => e.name === "PatternDetectionError"));
		});
	});

	describe("Security Headers", () => {
		test("should set security headers on response", async () => {
			const armor = new Armor({
				securityHeaders: {
					enabled: true,
					hsts: { maxAge: 31536000 },
					noSniff: true,
				},
			});

			const ctx = createMockContext();

			await armor.handler(ctx);

			// Execute after callbacks to set headers
			for (const callback of ctx.afterCallbacks) {
				await callback.handler(ctx);
			}

			assert.ok(ctx.responseHeaders.has("strict-transport-security"));
			assert.ok(ctx.responseHeaders.has("x-content-type-options"));
		});

		test("should not overwrite existing headers", async () => {
			const armor = new Armor({
				securityHeaders: {
					enabled: true,
					hsts: { maxAge: 31536000 },
				},
			});

			const ctx = createMockContext({
				responseHeaders: new Map([
					["strict-transport-security", "max-age=3600"],
				]),
			});

			await armor.handler(ctx);

			// Execute after callbacks
			for (const callback of ctx.afterCallbacks) {
				await callback.handler(ctx);
			}

			// Should not overwrite existing header
			assert.strictEqual(
				ctx.responseHeaders.get("strict-transport-security"),
				"max-age=3600",
			);
		});

		test("should skip header setting if response ended", async () => {
			const armor = new Armor({
				securityHeaders: {
					enabled: true,
					hsts: { maxAge: 31536000 },
				},
			});

			const ctx = createMockContext({
				responseEnded: true,
			});

			await armor.handler(ctx);

			// Execute after callbacks
			for (const callback of ctx.afterCallbacks) {
				await callback.handler(ctx);
			}

			// No headers should be set
			assert.strictEqual(ctx.responseHeaders.size, 0);
		});
	});

	describe("Global Configuration", () => {
		test("should respect global enabled flag", async () => {
			const armor = new Armor({
				enabled: false,
				ipAccess: {
					mode: "whitelist",
					whitelist: [],
				},
				rateLimiting: {
					enabled: true,
					global: { max: 1, windowMs: 60000 },
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.1"]]),
			});

			// Make multiple requests - should all pass since armor is disabled
			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 200);

			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 200);
		});
	});

	describe("Error Handling", () => {
		test("should handle middleware errors gracefully", async () => {
			const armor = new Armor();

			// Create context that might cause processing error
			const ctx = createMockContext();
			// Remove required methods to trigger error
			ctx.addAfterCallback = undefined;

			await armor.handler(ctx);

			// Request should continue despite processing error
			assert.ok(ctx.errors.some((e) => e.name === "ArmorError"));
		});
	});

	describe("Statistics", () => {
		test("should return current statistics", () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: true,
					global: { max: 100, windowMs: 60000 },
				},
			});

			const stats = armor.getStats();

			assert.ok(stats.rateLimit);
			assert.strictEqual(stats.config.enabled, true);
			assert.strictEqual(stats.config.rateLimitEnabled, true);
			assert.strictEqual(stats.config.ipControlMode, "disabled");
			assert.strictEqual(stats.config.headersEnabled, true);
		});

		test("should return null rate limit stats when disabled", () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: false,
				},
			});

			const stats = armor.getStats();

			assert.strictEqual(stats.rateLimit, null);
			assert.strictEqual(stats.config.rateLimitEnabled, false);
		});
	});

	describe("Rate Limit Management", () => {
		test("should clear rate limits", async () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: true,
					global: { max: 1, windowMs: 60000 },
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.1"]]),
			});

			// Make request to hit rate limit
			await armor.handler(ctx);
			await armor.handler(ctx);
			assert.strictEqual(ctx.responseStatusCode, 429);

			// Clear rate limits and try again
			armor.clearRateLimits();

			const newCtx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.1"]]),
			});

			await armor.handler(newCtx);
			assert.strictEqual(newCtx.responseStatusCode, 200);
		});

		test("should handle clearRateLimits when rate limiting disabled", () => {
			const armor = new Armor({
				rateLimiting: {
					enabled: false,
				},
			});

			// Should not throw error
			assert.doesNotThrow(() => {
				armor.clearRateLimits();
			});
		});
	});

	describe("Integration", () => {
		test("should process requests through all security layers", async () => {
			const armor = new Armor({
				ipAccess: {
					mode: "whitelist",
					whitelist: ["192.168.1.0/24"],
					trustProxy: true,
				},
				rateLimiting: {
					enabled: true,
					global: { max: 10, windowMs: 60000 },
				},
				requestValidation: {
					enabled: true,
					maxPathLength: 100,
				},
				attackDetection: {
					sqlInjection: true,
					xss: true,
				},
				securityHeaders: {
					enabled: true,
					hsts: { maxAge: 31536000 },
				},
			});

			const ctx = createMockContext({
				path: "/api/data",
				requestHeaders: new Map([
					["x-forwarded-for", "192.168.1.100"],
					["content-type", "application/json"],
				]),
				queryParams: new Map([["id", "123"]]),
			});

			await armor.handler(ctx);

			// Request should pass all security checks
			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseEnded, false);

			// Should register after callback for headers
			assert.strictEqual(ctx.afterCallbacks.length, 1);

			// Execute after callback to set headers
			await ctx.afterCallbacks[0].handler(ctx);

			// Headers should be set
			assert.ok(ctx.responseHeaders.has("strict-transport-security"));
		});

		test("should fail early on first security violation", async () => {
			const armor = new Armor({
				ipAccess: {
					mode: "whitelist",
					whitelist: ["10.0.0.0/8"],
				},
				rateLimiting: {
					enabled: true,
					global: { max: 1, windowMs: 60000 },
				},
			});

			const ctx = createMockContext({
				requestHeaders: new Map([["remote-addr", "192.168.1.1"]]),
			});

			await armor.handler(ctx);

			// Should fail on IP check, not reach rate limiting
			assert.strictEqual(ctx.responseStatusCode, 403);
			assert.ok(ctx.errors.some((e) => e.name === "IPBlocked"));
			assert.ok(!ctx.errors.some((e) => e.name === "RateLimitExceeded"));
		});
	});
});
