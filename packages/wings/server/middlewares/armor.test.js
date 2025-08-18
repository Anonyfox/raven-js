/**
 * @fileoverview Armor Middleware Tests
 *
 * Comprehensive test suite for the Armor security middleware covering all
 * security features, configuration options, and edge cases to ensure 100%
 * code coverage and bulletproof security functionality.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Context } from "../../core/context.js";
import {
	Armor,
	checkSQLInjection,
	checkSuspiciousPatterns,
	formatCSP,
	formatPermissionsPolicy,
	getClientIP,
	isIPAllowed,
	isIPInCIDR,
	parseCIDR,
	RateLimitStore,
	validateRequest,
} from "./armor.js";

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
	ctx.data = {};

	return ctx;
}

/**
 * Execute middleware and any after callbacks
 *
 * @param {Armor} middleware - Armor middleware instance
 * @param {Context} ctx - Request context
 */
async function executeMiddleware(middleware, ctx) {
	// Execute the main middleware
	await middleware.execute(ctx);

	// Execute any after callbacks
	await ctx.runAfterCallbacks();
}

// ===== Utility Functions Tests =====

test("parseCIDR - Valid IPv4 CIDR", () => {
	const result = parseCIDR("192.168.1.0/24");
	assert.deepEqual(result, { network: "192.168.1.0", prefix: 24 });
});

test("parseCIDR - Valid IPv6 CIDR", () => {
	const result = parseCIDR("2001:db8::/32");
	assert.deepEqual(result, { network: "2001:db8::", prefix: 32 });
});

test("parseCIDR - Invalid formats", () => {
	assert.equal(parseCIDR("192.168.1.0"), null); // Missing prefix
	assert.equal(parseCIDR("192.168.1.0/"), null); // Empty prefix
	assert.equal(parseCIDR("192.168.1.0/33"), null); // Invalid IPv4 prefix
	assert.equal(parseCIDR("invalid/24"), null); // Invalid IP
	assert.equal(parseCIDR(""), null); // Empty string
	assert.equal(parseCIDR(null), null); // Null input
	assert.equal(parseCIDR(123), null); // Non-string input
});

test("isIPInCIDR - IPv4 ranges", () => {
	assert.equal(isIPInCIDR("192.168.1.100", "192.168.1.0/24"), true);
	assert.equal(isIPInCIDR("192.168.1.255", "192.168.1.0/24"), true);
	assert.equal(isIPInCIDR("192.168.2.1", "192.168.1.0/24"), false);
	assert.equal(isIPInCIDR("10.0.0.1", "192.168.1.0/24"), false);
});

test("isIPInCIDR - IPv6 ranges", () => {
	assert.equal(isIPInCIDR("2001:db8::1", "2001:db8::/32"), true);
	assert.equal(isIPInCIDR("2001:db8:1::1", "2001:db8::/32"), true);
	assert.equal(isIPInCIDR("2001:db9::1", "2001:db8::/32"), false);
});

test("isIPInCIDR - Mixed IP versions", () => {
	assert.equal(isIPInCIDR("192.168.1.1", "2001:db8::/32"), false);
	assert.equal(isIPInCIDR("2001:db8::1", "192.168.1.0/24"), false);
});

test("isIPInCIDR - Invalid inputs", () => {
	assert.equal(isIPInCIDR("invalid", "192.168.1.0/24"), false);
	assert.equal(isIPInCIDR("192.168.1.1", "invalid/24"), false);
	assert.equal(isIPInCIDR("", "192.168.1.0/24"), false);
});

test("getClientIP - Direct connection", () => {
	const ctx = createMockContext("GET", "http://localhost/test");
	ctx.requestHeaders.set("remote-addr", "192.168.1.100");

	const ip = getClientIP(ctx, false);
	assert.equal(ip, "192.168.1.100");
});

test("getClientIP - Proxy headers trusted", () => {
	const ctx = createMockContext("GET", "http://localhost/test", {
		"x-forwarded-for": "203.0.113.195, 192.168.1.100",
		"x-real-ip": "203.0.113.195",
		"remote-addr": "192.168.1.100",
	});

	const ip = getClientIP(ctx, true);
	assert.equal(ip, "203.0.113.195"); // First IP from X-Forwarded-For
});

test("getClientIP - Proxy headers not trusted", () => {
	const ctx = createMockContext("GET", "http://localhost/test", {
		"x-forwarded-for": "203.0.113.195",
		"remote-addr": "192.168.1.100",
	});

	const ip = getClientIP(ctx, false);
	assert.equal(ip, "192.168.1.100"); // Ignores proxy headers
});

test("getClientIP - X-Real-IP fallback", () => {
	const ctx = createMockContext("GET", "http://localhost/test", {
		"x-real-ip": "203.0.113.195",
	});

	const ip = getClientIP(ctx, true);
	assert.equal(ip, "203.0.113.195");
});

test("getClientIP - Unknown fallback", () => {
	const ctx = createMockContext("GET", "http://localhost/test");

	const ip = getClientIP(ctx, false);
	assert.equal(ip, "unknown");
});

test("isIPAllowed - Disabled mode", () => {
	const config = { mode: "disabled", whitelist: [], blacklist: [] };
	assert.equal(isIPAllowed("192.168.1.1", config), true);
	assert.equal(isIPAllowed("any-ip", config), true);
});

test("isIPAllowed - Whitelist mode", () => {
	const config = {
		mode: "whitelist",
		whitelist: ["192.168.1.1", "10.0.0.0/8"],
		blacklist: [],
	};

	assert.equal(isIPAllowed("192.168.1.1", config), true); // Exact match
	assert.equal(isIPAllowed("10.0.0.100", config), true); // CIDR match
	assert.equal(isIPAllowed("203.0.113.1", config), false); // Not in whitelist
});

test("isIPAllowed - Blacklist mode", () => {
	const config = {
		mode: "blacklist",
		whitelist: [],
		blacklist: ["192.168.1.1", "203.0.113.0/24"],
	};

	assert.equal(isIPAllowed("10.0.0.1", config), true); // Not in blacklist
	assert.equal(isIPAllowed("192.168.1.1", config), false); // Exact match
	assert.equal(isIPAllowed("203.0.113.100", config), false); // CIDR match
});

test("isIPAllowed - Unknown mode", () => {
	const config = { mode: "unknown", whitelist: [], blacklist: [] };
	assert.equal(isIPAllowed("192.168.1.1", config), true); // Default allow
});

test("formatCSP - Basic directives", () => {
	const directives = {
		"default-src": ["'self'"],
		"script-src": ["'self'", "'unsafe-inline'"],
		"style-src": ["'self'"],
	};

	const result = formatCSP(directives);
	assert.equal(
		result,
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'",
	);
});

test("formatCSP - String values", () => {
	const directives = {
		"default-src": "'self'",
		"script-src": "'none'",
	};

	const result = formatCSP(directives);
	assert.equal(result, "default-src 'self'; script-src 'none'");
});

test("formatCSP - Empty arrays", () => {
	const directives = {
		"default-src": ["'self'"],
		"script-src": [], // Empty array should be skipped
		"style-src": ["'self'"],
	};

	const result = formatCSP(directives);
	assert.equal(result, "default-src 'self'; style-src 'self'");
});

test("formatPermissionsPolicy - Basic permissions", () => {
	const permissions = {
		geolocation: [],
		microphone: ["self"],
		camera: ["self", "https://trusted.com"],
	};

	const result = formatPermissionsPolicy(permissions);
	assert.equal(
		result,
		'geolocation=(), microphone=("self"), camera=("self" "https://trusted.com")',
	);
});

test("formatPermissionsPolicy - Empty object", () => {
	const result = formatPermissionsPolicy({});
	assert.equal(result, "");
});

test("checkSQLInjection - Detects patterns in query params", () => {
	const ctx = createMockContext("GET", "http://localhost/test?id=1' OR '1'='1");
	assert.equal(checkSQLInjection(ctx), true);
});

test("checkSQLInjection - Detects patterns in path", () => {
	const ctx = createMockContext(
		"GET",
		"http://localhost/test'; DROP TABLE users;--",
	);
	assert.equal(checkSQLInjection(ctx), true);
});

test("checkSQLInjection - Clean request", () => {
	const ctx = createMockContext(
		"GET",
		"http://localhost/test?id=123&name=john",
	);
	assert.equal(checkSQLInjection(ctx), false);
});

test("checkSuspiciousPatterns - Path traversal", () => {
	const ctx = createMockContext(
		"GET",
		"http://localhost/file?path=../etc/passwd",
	);
	assert.equal(checkSuspiciousPatterns(ctx), true);
});

test("checkSuspiciousPatterns - XSS attempt", () => {
	const ctx = createMockContext(
		"GET",
		"http://localhost/test?content=<script>alert('xss')</script>",
	);
	assert.equal(checkSuspiciousPatterns(ctx), true);
});

test("checkSuspiciousPatterns - Clean request", () => {
	const ctx = createMockContext(
		"GET",
		"http://localhost/test?page=1&sort=name",
	);
	assert.equal(checkSuspiciousPatterns(ctx), false);
});

test("validateRequest - Valid request", () => {
	const ctx = createMockContext("GET", "http://localhost/test?page=1");
	ctx.requestHeaders.set("content-length", "100");

	const config = {
		maxBodySize: 1000,
		maxHeaderSize: 8192,
		maxHeaders: 100,
		maxQueryParams: 100,
		maxQueryParamLength: 1000,
		maxPathLength: 2048,
	};

	const result = validateRequest(ctx, config);
	assert.equal(result, null);
});

test("validateRequest - Path too long", () => {
	const longPath = `/test/${"a".repeat(2000)}`;
	const ctx = createMockContext("GET", `http://localhost${longPath}`);

	const config = { maxPathLength: 100 };
	const result = validateRequest(ctx, config);
	assert(result?.includes("Path too long"));
});

test("validateRequest - Too many query params", () => {
	let url = "http://localhost/test?";
	for (let i = 0; i < 150; i++) {
		url += `param${i}=value${i}&`;
	}

	const ctx = createMockContext("GET", url);
	const config = { maxQueryParams: 100 };
	const result = validateRequest(ctx, config);
	assert(result?.includes("Too many query parameters"));
});

test("validateRequest - Query param too long", () => {
	const longValue = "a".repeat(2000);
	const ctx = createMockContext(
		"GET",
		`http://localhost/test?long=${longValue}`,
	);

	const config = { maxQueryParamLength: 1000 };
	const result = validateRequest(ctx, config);
	assert(result?.includes("Query parameter value too long"));
});

test("validateRequest - Too many headers", () => {
	const headers = {};
	for (let i = 0; i < 150; i++) {
		headers[`header-${i}`] = `value-${i}`;
	}

	const ctx = createMockContext("GET", "http://localhost/test", headers);
	const config = { maxHeaders: 100 };
	const result = validateRequest(ctx, config);
	assert(result?.includes("Too many headers"));
});

test("validateRequest - Headers too large", () => {
	const largeValue = "a".repeat(10000);
	const ctx = createMockContext("GET", "http://localhost/test", {
		"large-header": largeValue,
	});

	const config = { maxHeaderSize: 1000 };
	const result = validateRequest(ctx, config);
	assert(result?.includes("Headers too large"));
});

test("validateRequest - Body too large", () => {
	const ctx = createMockContext("GET", "http://localhost/test");
	ctx.requestHeaders.set("content-length", "2000000"); // 2MB

	const config = { maxBodySize: 1000000 }; // 1MB limit
	const result = validateRequest(ctx, config);
	assert(result?.includes("Request body too large"));
});

// ===== RateLimitStore Tests =====

test("RateLimitStore - Allows requests under limit", () => {
	const store = new RateLimitStore();

	assert.equal(store.isAllowed("test-key", 5, 60000), true);
	assert.equal(store.isAllowed("test-key", 5, 60000), true);
	assert.equal(store.isAllowed("test-key", 5, 60000), true);
});

test("RateLimitStore - Blocks requests over limit", () => {
	const store = new RateLimitStore();

	// Fill up the limit
	for (let i = 0; i < 5; i++) {
		assert.equal(store.isAllowed("test-key", 5, 60000), true);
	}

	// Next request should be blocked
	assert.equal(store.isAllowed("test-key", 5, 60000), false);
});

test("RateLimitStore - Different keys are independent", () => {
	const store = new RateLimitStore();

	// Fill up one key
	for (let i = 0; i < 5; i++) {
		store.isAllowed("key1", 5, 60000);
	}

	// Different key should still work
	assert.equal(store.isAllowed("key2", 5, 60000), true);
});

test("RateLimitStore - Sliding window works", () => {
	const store = new RateLimitStore();

	// Use a very short window for testing
	const windowMs = 100;

	// Fill up the limit
	for (let i = 0; i < 3; i++) {
		assert.equal(store.isAllowed("test-key", 3, windowMs), true);
	}

	// Should be blocked
	assert.equal(store.isAllowed("test-key", 3, windowMs), false);

	// Wait for window to expire
	return new Promise((resolve) => {
		setTimeout(() => {
			// Should be allowed again
			assert.equal(store.isAllowed("test-key", 3, windowMs), true);
			resolve();
		}, windowMs + 10);
	});
});

test("RateLimitStore - Cleanup works", () => {
	const store = new RateLimitStore(50); // Very short cleanup interval

	store.isAllowed("test-key", 5, 60000);
	assert.equal(store.store.size, 1);

	// Force cleanup with old cutoff time
	store.cleanup(Date.now() + 100000);
	assert.equal(store.store.size, 0);
});

test("RateLimitStore - getStats", () => {
	const store = new RateLimitStore();

	store.isAllowed("key1", 5, 60000);
	store.isAllowed("key2", 5, 60000);

	const stats = store.getStats();
	assert.equal(stats.totalKeys, 2);
	assert.equal(stats.totalRequests, 2);
});

test("RateLimitStore - clear", () => {
	const store = new RateLimitStore();

	store.isAllowed("test-key", 5, 60000);
	assert.equal(store.store.size, 1);

	store.clear();
	assert.equal(store.store.size, 0);
});

// ===== Armor Middleware Tests =====

test("Armor - Default configuration", async () => {
	const armor = new Armor();
	const ctx = createMockContext();

	await executeMiddleware(armor, ctx);

	// Should set default security headers
	assert(ctx.responseHeaders.has("x-frame-options"));
	assert(ctx.responseHeaders.has("x-content-type-options"));
	assert(ctx.responseHeaders.has("content-security-policy"));
	assert.equal(ctx.responseEnded, false); // Request should continue
});

test("Armor - Invalid configuration throws error", () => {
	assert.throws(() => {
		new Armor({
			rateLimit: { windowMs: -1 }, // Invalid
		});
	}, /Rate limit windowMs must be positive/);

	assert.throws(() => {
		new Armor({
			rateLimit: { maxRequests: 0 }, // Invalid
		});
	}, /Rate limit maxRequests must be positive/);

	assert.throws(() => {
		new Armor({
			ipControl: { mode: "invalid" }, // Invalid
		});
	}, /IP control mode must be/);

	assert.throws(() => {
		new Armor({
			headers: {
				hsts: { maxAge: -1 }, // Invalid
			},
		});
	}, /HSTS maxAge must be a non-negative number/);
});

test("Armor - IP whitelist blocks unauthorized IPs", async () => {
	const armor = new Armor({
		ipControl: {
			mode: "whitelist",
			whitelist: ["192.168.1.0/24"],
			trustProxy: true,
		},
	});

	const ctx = createMockContext("GET", "http://localhost/test", {
		"x-forwarded-for": "203.0.113.1", // Not in whitelist
	});

	await executeMiddleware(armor, ctx);

	assert.equal(ctx.responseStatusCode, 403);
	assert.equal(ctx.responseEnded, true);
	assert(ctx.errors.some((e) => e.name === "IPBlocked"));
});

test("Armor - IP whitelist allows authorized IPs", async () => {
	const armor = new Armor({
		ipControl: {
			mode: "whitelist",
			whitelist: ["192.168.1.0/24"],
			trustProxy: true,
		},
	});

	const ctx = createMockContext("GET", "http://localhost/test", {
		"x-forwarded-for": "192.168.1.100", // In whitelist
	});

	await executeMiddleware(armor, ctx);

	assert.equal(ctx.responseStatusCode, 200);
	assert.equal(ctx.responseEnded, false);
});

test("Armor - IP blacklist blocks banned IPs", async () => {
	const armor = new Armor({
		ipControl: {
			mode: "blacklist",
			blacklist: ["203.0.113.0/24"],
			trustProxy: true,
		},
	});

	const ctx = createMockContext("GET", "http://localhost/test", {
		"x-forwarded-for": "203.0.113.100", // In blacklist
	});

	await executeMiddleware(armor, ctx);

	assert.equal(ctx.responseStatusCode, 403);
	assert.equal(ctx.responseEnded, true);
});

test("Armor - Rate limiting blocks excessive requests", async () => {
	const armor = new Armor({
		rateLimit: {
			maxRequests: 2,
			windowMs: 60000,
		},
	});

	const ctx1 = createMockContext();
	const ctx2 = createMockContext();
	const ctx3 = createMockContext();

	// First two requests should pass
	await executeMiddleware(armor, ctx1);
	assert.equal(ctx1.responseEnded, false);

	await executeMiddleware(armor, ctx2);
	assert.equal(ctx2.responseEnded, false);

	// Third request should be blocked
	await executeMiddleware(armor, ctx3);
	assert.equal(ctx3.responseStatusCode, 429);
	assert.equal(ctx3.responseEnded, true);
	assert(ctx3.responseHeaders.has("retry-after"));
	assert(ctx3.errors.some((e) => e.name === "RateLimitExceeded"));
});

test("Armor - Route-specific rate limiting", async () => {
	const armor = new Armor({
		rateLimit: {
			maxRequests: 100, // Global limit
			routes: {
				"/api/auth/": { maxRequests: 1, windowMs: 60000 },
			},
			keyGenerator: (ctx) => ctx.requestHeaders.get("x-test-key") || "default",
		},
		ipControl: {
			trustProxy: true, // Enable proxy header reading
		},
	});

	// Regular route should use global limit
	const ctx1 = createMockContext("GET", "http://localhost/api/data", {
		"x-test-key": "user1",
	});
	await executeMiddleware(armor, ctx1);
	assert.equal(ctx1.responseEnded, false);

	// Auth route should use specific limit
	const ctx2 = createMockContext("POST", "http://localhost/api/auth/login", {
		"x-test-key": "user2",
	});
	const ctx3 = createMockContext("POST", "http://localhost/api/auth/login", {
		"x-test-key": "user2",
	});

	await executeMiddleware(armor, ctx2);
	assert.equal(ctx2.responseEnded, false);

	await executeMiddleware(armor, ctx3);
	assert.equal(ctx3.responseStatusCode, 429); // Blocked by route-specific limit
});

test("Armor - Request validation blocks oversized requests", async () => {
	const armor = new Armor({
		validation: {
			maxPathLength: 50,
		},
	});

	const longPath = `/test/${"a".repeat(100)}`;
	const ctx = createMockContext("GET", `http://localhost${longPath}`);

	await executeMiddleware(armor, ctx);

	assert.equal(ctx.responseStatusCode, 400);
	assert.equal(ctx.responseEnded, true);
	assert(ctx.errors.some((e) => e.name === "RequestValidationError"));
});

test("Armor - SQL injection detection", async () => {
	const armor = new Armor({
		protection: {
			sqlInjectionCheck: true,
		},
	});

	const ctx = createMockContext("GET", "http://localhost/test?id=1' OR '1'='1");

	await executeMiddleware(armor, ctx);

	// Request continues but error is logged
	assert.equal(ctx.responseEnded, false);
	assert(ctx.errors.some((e) => e.name === "SQLInjectionDetected"));
});

test("Armor - Suspicious pattern detection", async () => {
	const armor = new Armor({
		protection: {
			suspiciousPatterns: true,
		},
	});

	const ctx = createMockContext(
		"GET",
		"http://localhost/file?path=../etc/passwd",
	);

	await executeMiddleware(armor, ctx);

	// Request continues but error is logged
	assert.equal(ctx.responseEnded, false);
	assert(ctx.errors.some((e) => e.name === "SuspiciousPatternDetected"));
});

test("Armor - Disabled features don't interfere", async () => {
	const armor = new Armor({
		headers: {
			contentSecurityPolicy: false,
			hsts: false,
		},
		protection: {
			sqlInjectionCheck: false,
			suspiciousPatterns: false,
		},
	});

	const ctx = createMockContext("GET", "http://localhost/test?id=1' OR '1'='1");

	await executeMiddleware(armor, ctx);

	// No CSP or HSTS headers
	assert.equal(ctx.responseHeaders.has("content-security-policy"), false);
	assert.equal(ctx.responseHeaders.has("strict-transport-security"), false);

	// No security errors logged
	assert.equal(
		ctx.errors.filter((e) => e.name === "SQLInjectionDetected").length,
		0,
	);
});

test("Armor - Custom CSP configuration", async () => {
	const armor = new Armor({
		headers: {
			contentSecurityPolicy: {
				directives: {
					"default-src": ["'self'"],
					"script-src": ["'self'", "https://trusted.com"],
				},
				reportOnly: true,
			},
		},
	});

	const ctx = createMockContext();

	await executeMiddleware(armor, ctx);

	// Should use report-only header
	assert(ctx.responseHeaders.has("content-security-policy-report-only"));
	assert.equal(ctx.responseHeaders.has("content-security-policy"), false);

	const cspValue = ctx.responseHeaders.get(
		"content-security-policy-report-only",
	);
	assert(cspValue?.includes("default-src 'self'"));
	assert(cspValue?.includes("script-src 'self' https://trusted.com"));
});

test("Armor - HSTS configuration", async () => {
	const armor = new Armor({
		headers: {
			hsts: {
				maxAge: 31536000,
				includeSubDomains: true,
				preload: true,
			},
		},
	});

	const ctx = createMockContext();

	await executeMiddleware(armor, ctx);

	const hstsValue = ctx.responseHeaders.get("strict-transport-security");
	assert(hstsValue?.includes("max-age=31536000"));
	assert(hstsValue?.includes("includeSubDomains"));
	assert(hstsValue?.includes("preload"));
});

test("Armor - Permissions Policy", async () => {
	const armor = new Armor({
		headers: {
			permissionsPolicy: {
				geolocation: [],
				microphone: ["self"],
				camera: ["self", "https://trusted.com"],
			},
		},
	});

	const ctx = createMockContext();

	await executeMiddleware(armor, ctx);

	const permissionsValue = ctx.responseHeaders.get("permissions-policy");
	assert(permissionsValue?.includes("geolocation=()"));
	assert(permissionsValue?.includes('microphone=("self")'));
	assert(permissionsValue?.includes('camera=("self" "https://trusted.com")'));
});

test("Armor - Respects existing headers", async () => {
	const armor = new Armor();
	const ctx = createMockContext();

	// Set header before middleware
	ctx.responseHeaders.set("x-frame-options", "ALLOWALL");

	await executeMiddleware(armor, ctx);

	// Should not override existing header
	assert.equal(ctx.responseHeaders.get("x-frame-options"), "ALLOWALL");
});

test("Armor - Error handling in header setting", async () => {
	const armor = new Armor();
	const ctx = createMockContext();

	// Mock a broken responseHeaders object
	const originalSet = ctx.responseHeaders.set;
	ctx.responseHeaders.set = () => {
		throw new Error("Header setting failed");
	};

	await executeMiddleware(armor, ctx);

	// Should handle error gracefully
	assert(ctx.errors.some((e) => e.name === "SecurityHeaderError"));

	// Restore original method
	ctx.responseHeaders.set = originalSet;
});

test("Armor - Error handling in processing", async () => {
	const armor = new Armor();
	const ctx = createMockContext();

	// Mock a broken method to trigger error handling
	const originalMethod = ctx.requestHeaders.get;
	ctx.requestHeaders.get = () => {
		throw new Error("Header access failed");
	};

	await executeMiddleware(armor, ctx);

	// Should handle error gracefully
	assert(ctx.errors.some((e) => e.name === "ArmorError"));

	// Restore original method
	ctx.requestHeaders.get = originalMethod;
});

test("Armor - getStats method", () => {
	const armor = new Armor({
		rateLimit: { maxRequests: 10 },
	});

	const stats = armor.getStats();
	assert(typeof stats.rateLimit === "object");
	assert(typeof stats.config === "object");
	assert.equal(stats.config.rateLimitEnabled, true);
});

test("Armor - clearRateLimits method", async () => {
	const armor = new Armor({
		rateLimit: { maxRequests: 2 },
	});

	// Make some requests to populate rate limit store
	const ctx1 = createMockContext();
	const ctx2 = createMockContext();

	await executeMiddleware(armor, ctx1);
	await executeMiddleware(armor, ctx2);

	// Clear rate limits
	armor.clearRateLimits();

	// Should be able to make requests again
	const ctx3 = createMockContext();
	await executeMiddleware(armor, ctx3);
	assert.equal(ctx3.responseEnded, false);
});

test("Armor - Rate limiting disabled by default", async () => {
	const armor = new Armor(); // Default config has no rate limiting

	const stats = armor.getStats();
	assert.equal(stats.config.rateLimitEnabled, false);
	assert.equal(stats.rateLimit, null);
});

test("Armor - Cross-Origin headers", async () => {
	const armor = new Armor({
		headers: {
			crossOriginEmbedderPolicy: "require-corp",
			crossOriginOpenerPolicy: "same-origin",
		},
	});

	const ctx = createMockContext();

	await executeMiddleware(armor, ctx);

	assert.equal(
		ctx.responseHeaders.get("cross-origin-embedder-policy"),
		"require-corp",
	);
	assert.equal(
		ctx.responseHeaders.get("cross-origin-opener-policy"),
		"same-origin",
	);
});

test("Armor - Custom rate limit key generator", async () => {
	const armor = new Armor({
		rateLimit: {
			maxRequests: 1,
			windowMs: 60000,
			keyGenerator: (ctx) => ctx.requestHeaders.get("user-id") || "anonymous",
		},
	});

	const ctx1 = createMockContext("GET", "http://localhost/test", {
		"user-id": "user1",
	});
	const ctx2 = createMockContext("GET", "http://localhost/test", {
		"user-id": "user2",
	});
	const ctx3 = createMockContext("GET", "http://localhost/test", {
		"user-id": "user1",
	});

	// First request for user1
	await executeMiddleware(armor, ctx1);
	assert.equal(ctx1.responseEnded, false);

	// First request for user2 (different key)
	await executeMiddleware(armor, ctx2);
	assert.equal(ctx2.responseEnded, false);

	// Second request for user1 (should be blocked)
	await executeMiddleware(armor, ctx3);
	assert.equal(ctx3.responseStatusCode, 429);
});

test("Armor - Validates IP whitelist/blacklist configuration", () => {
	assert.throws(() => {
		new Armor({
			ipControl: {
				mode: "whitelist",
				whitelist: ["invalid-ip"],
			},
		});
	}, /Invalid IP address in IP whitelist/);

	assert.throws(() => {
		new Armor({
			ipControl: {
				mode: "blacklist",
				blacklist: ["192.168.1.0/33"], // Invalid CIDR
			},
		});
	}, /Invalid CIDR notation in IP blacklist/);

	assert.throws(() => {
		new Armor({
			ipControl: {
				mode: "whitelist",
				whitelist: 123, // Not an array
			},
		});
	}, /IP whitelist must be an array/);
});

// Edge case and IPv6 tests
test("IPv6 CIDR parsing and matching", () => {
	// Test various IPv6 formats
	assert.equal(isIPInCIDR("2001:db8::1", "2001:db8::/32"), true);
	assert.equal(isIPInCIDR("2001:db8:ffff::1", "2001:db8::/32"), true);
	assert.equal(isIPInCIDR("2001:db9::1", "2001:db8::/32"), false);

	// Test compressed IPv6
	assert.equal(isIPInCIDR("::1", "::/0"), true);
	assert.equal(isIPInCIDR("2001:db8::1", "2001:db8::/64"), true);
});

test("Armor - Complex security scenario", async () => {
	const armor = new Armor({
		rateLimit: {
			maxRequests: 5,
			windowMs: 60000,
			routes: {
				"/admin/": { maxRequests: 1, windowMs: 60000 },
			},
		},
		ipControl: {
			mode: "blacklist",
			blacklist: ["203.0.113.0/24"],
			trustProxy: true,
		},
		validation: {
			maxPathLength: 100,
			maxQueryParams: 10,
		},
		protection: {
			sqlInjectionCheck: true,
			suspiciousPatterns: true,
		},
	});

	// Test SQL injection with rate limiting
	const ctx = createMockContext(
		"GET",
		"http://localhost/test?id=1' OR '1'='1",
		{
			"x-forwarded-for": "192.168.1.100", // Not blacklisted
		},
	);

	await executeMiddleware(armor, ctx);

	// Request should continue but log security warning
	assert.equal(ctx.responseEnded, false);
	assert(ctx.errors.some((e) => e.name === "SQLInjectionDetected"));
	assert(ctx.responseHeaders.has("content-security-policy"));
});

test("Armor - Response already ended", async () => {
	const armor = new Armor();
	const ctx = createMockContext();

	// End response before middleware
	ctx.responseEnded = true;

	await executeMiddleware(armor, ctx);

	// Headers should not be set for ended responses
	assert.equal(ctx.responseHeaders.has("x-frame-options"), false);
});
