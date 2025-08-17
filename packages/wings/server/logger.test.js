import assert from "node:assert";
import { describe, test } from "node:test";
import { Context } from "../core/context.js";
import { Middleware } from "../core/middleware.js";
import {
	collectLogData,
	createDevelopmentLogLine,
	createStructuredLog,
	formatDuration,
	formatErrorForDevelopment,
	formatRequestId,
	formatTimestamp,
	generateRequestId,
	getMethodColor,
	getStatusColor,
	Logger,
	logDevelopment,
	logProduction,
} from "./logger.js";

describe("Logger Helper Functions", () => {
	test("generateRequestId creates unique timestamp-based IDs", () => {
		const id1 = generateRequestId();
		const id2 = generateRequestId();

		assert.notStrictEqual(id1, id2);
		assert.match(id1, /^\d+-[a-z0-9]{9}$/);
		assert.match(id2, /^\d+-[a-z0-9]{9}$/);

		const [timestamp, random] = id1.split("-");
		assert.ok(!Number.isNaN(parseInt(timestamp, 10)));
		assert.strictEqual(random.length, 9);
	});



	test("getStatusColor returns correct colors for all status ranges", () => {
		const cases = [
			[200, "\x1b[92m\x1b[40m"], // 2xx success
			[301, "\x1b[96m\x1b[40m"], // 3xx redirect
			[404, "\x1b[93m\x1b[40m"], // 4xx client error
			[500, "\x1b[91m\x1b[40m"], // 5xx server error
			[100, "\x1b[97m\x1b[40m"], // other
		];

		for (const [code, expected] of cases) {
			assert.strictEqual(getStatusColor(code), expected);
		}
	});

	test("getMethodColor handles all HTTP methods and case insensitivity", () => {
		const cases = [
			["GET", "\x1b[92m\x1b[40m"], ["get", "\x1b[92m\x1b[40m"],
			["POST", "\x1b[94m\x1b[40m"], ["PUT", "\x1b[93m\x1b[40m"],
			["DELETE", "\x1b[91m\x1b[40m"], ["PATCH", "\x1b[95m\x1b[40m"],
			["OPTIONS", "\x1b[97m\x1b[40m"], // unknown method
		];

		for (const [method, expected] of cases) {
			assert.strictEqual(getMethodColor(method), expected);
		}
	});

	test("formatDuration handles all units and performance indicators", () => {
		const cases = [
			[0.5, /⚡ 500 µs/, /\x1b\[92m\x1b\[40m/], // microseconds
			[5, /⚡ {3}5 ms/, /\x1b\[92m\x1b\[40m/],   // excellent ms
			[50, /✓ {2}50 ms/, /\x1b\[96m\x1b\[40m/], // good ms
			[200, /⚠ 200 ms/, /\x1b\[93m\x1b\[40m/], // slow ms
			[1500, /⚠ {3}2 s /, /\x1b\[91m\x1b\[40m/], // seconds
		];

		for (const [duration, textPattern, colorPattern] of cases) {
			const result = formatDuration(duration);
			assert.match(result, textPattern);
			assert.match(result, colorPattern);
		}
	});

	test("formatTimestamp and formatRequestId work correctly", () => {
		const date = new Date("2024-01-15T14:30:45.123Z");
		assert.strictEqual(formatTimestamp(date), "14:30:45");

		assert.strictEqual(formatRequestId("1234567890-abc123def"), "abc123def");
	});

	test("collectLogData extracts all context information", () => {
		const url = new URL("http://localhost/api/users");
		const headers = new Headers({
			"user-agent": "TestAgent/1.0",
			"referer": "http://localhost/",
			"x-forwarded-for": "192.168.1.1",
			"authorization": "Bearer user123",
		});
		const ctx = new Context("POST", url, headers);
		ctx.responseStatusCode = 201;

		const logData = collectLogData(ctx, performance.now(), "test-id", new Date());

		assert.strictEqual(logData.method, "POST");
		assert.strictEqual(logData.path, "/api/users");
		assert.strictEqual(logData.statusCode, 201);
		assert.strictEqual(logData.userAgent, "TestAgent/1.0");
		assert.strictEqual(logData.ip, "192.168.1.1");
		assert.strictEqual(logData.userIdentity, "Bearer user123");
		assert.ok(logData.duration >= 0);
	});

	test("collectLogData handles missing headers", () => {
		const ctx = new Context("GET", new URL("http://localhost/test"), new Headers());
		const logData = collectLogData(ctx, performance.now(), "test-id", new Date());

		assert.strictEqual(logData.userAgent, null);
		assert.strictEqual(logData.referrer, null);
		assert.strictEqual(logData.ip, "unknown");
		assert.strictEqual(logData.userIdentity, null);
	});

	test("createStructuredLog generates complete compliance-ready logs", () => {
		const logData = {
			method: "GET", path: "/api/users", statusCode: 200, duration: 15,
			userAgent: "TestAgent", referrer: "http://localhost/",
			requestId: "test-id", timestamp: new Date("2024-01-15T14:30:45.123Z"),
			ip: "192.168.1.1", userIdentity: "Bearer user123",
		};

		const result = createStructuredLog(logData);

		assert.strictEqual(result.level, "info");
		assert.strictEqual(result.message, "GET /api/users 200");
		assert.strictEqual(result.user.identity, "Bearer user123");
		assert.strictEqual(result.result.success, true);
		assert.strictEqual(result.result.performance, "good");
		assert.ok(result.compliance.soc2.cc5_1);
		assert.ok(result.metadata.complianceReady);
	});

	test("createStructuredLog handles errors and edge cases", () => {
		const errorLog = createStructuredLog({
			method: "POST", path: "/api/users", statusCode: 500, duration: 250,
			userAgent: null, referrer: null, requestId: "test-id", timestamp: new Date(),
			ip: "unknown", userIdentity: "",
		});

		assert.strictEqual(errorLog.level, "error");
		assert.strictEqual(errorLog.user.identity, "anonymous");
		assert.strictEqual(errorLog.result.success, false);
		assert.strictEqual(errorLog.result.performance, "slow");

		// Test microsecond formatting
		const microLog = createStructuredLog({
			method: "GET", path: "/test", statusCode: 200, duration: 0.5,
			userAgent: null, referrer: null, requestId: "test", timestamp: new Date(),
			ip: null, userIdentity: null,
		});
		assert.strictEqual(microLog.result.duration, "500µs");

		// Test with actual errors array
		const errors = [
			new Error("First error"),
			new Error("Second error"),
		];
		const logWithErrors = createStructuredLog({
			method: "GET", path: "/test", statusCode: 500, duration: 10,
			userAgent: null, referrer: null, requestId: "test", timestamp: new Date(),
			ip: "127.0.0.1", userIdentity: null, errors,
		});

		assert.strictEqual(logWithErrors.level, "error");
		assert.strictEqual(logWithErrors.result.success, false);
		assert.strictEqual(logWithErrors.errorCount, 2);
		assert.strictEqual(logWithErrors.errors.length, 2);
		assert.strictEqual(logWithErrors.errors[0].index, 1);
		assert.strictEqual(logWithErrors.errors[0].message, "First error");
		assert.strictEqual(logWithErrors.errors[1].index, 2);
		assert.strictEqual(logWithErrors.errors[1].message, "Second error");
	});

	test("createDevelopmentLogLine formats output correctly", () => {
		const logData = {
			method: "GET", path: "/api/users", statusCode: 200, duration: 15,
			requestId: "1234567890-abc123def", timestamp: new Date("2024-01-15T14:30:45.123Z"),
		};

		const result = createDevelopmentLogLine(logData);

		assert.match(result, /14:30:45/);
		assert.match(result, /\[200\]/); // Just status code, no text
		assert.match(result, /\(.*✓.*15 ms.*\)/); // Performance in tight parentheses with colors
		assert.match(result, /GET/); // Method without extra padding
		assert.match(result, /\/api\/users/);
		assert.doesNotMatch(result, /abc123def/); // No request ID
	});

	test("logProduction outputs JSON", () => {
		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			logProduction({
				method: "GET", path: "/test", statusCode: 200, duration: 10,
				userAgent: null, referrer: null, requestId: "test", timestamp: new Date(),
				ip: "127.0.0.1", userIdentity: null,
			});

			assert.strictEqual(logs.length, 1);
			const logEntry = JSON.parse(logs[0]);
			assert.strictEqual(logEntry.message, "GET /test 200");
		} finally {
			console.log = originalLog;
		}
	});

	test("logDevelopment outputs clean single line", () => {
		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			logDevelopment({
				method: "POST", path: "/api/users", statusCode: 201, duration: 25,
				userAgent: "TestAgent", referrer: "http://localhost/",
				requestId: "test-id", timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1", userIdentity: "Bearer user123",
			});

			assert.strictEqual(logs.length, 1);
			assert.match(logs[0], /\[201\]/); // Just status code
			assert.match(logs[0], /\(.*✓.*25 ms.*\)/); // Performance in tight parentheses with colors
			assert.match(logs[0], /POST/); // Method without extra spacing
			assert.doesNotMatch(logs[0], /User-Agent/); // No clutter
			assert.doesNotMatch(logs[0], /test-id/); // No request ID
		} finally {
			console.log = originalLog;
		}
	});

	test("logDevelopment outputs errors with formatting", () => {
		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			const errors = [
				new Error("First error"),
				new Error("Second error"),
			];

			logDevelopment({
				method: "GET", path: "/test", statusCode: 500, duration: 10,
				userAgent: null, referrer: null, requestId: "test", timestamp: new Date(),
				ip: "127.0.0.1", userIdentity: null,
			}, false, errors);

			assert.strictEqual(logs.length, 3); // 1 main line + 2 error lines
			assert.match(logs[0], /\[500\]/); // Status code in main line
			assert.match(logs[1], /\[Error 1\/2\]/); // First error with index
			assert.match(logs[1], /First error/); // First error message
			assert.match(logs[2], /\[Error 2\/2\]/); // Second error with index
			assert.match(logs[2], /Second error/); // Second error message
		} finally {
			console.log = originalLog;
		}
	});

	test("formatErrorForDevelopment formats errors correctly", () => {
		const error = new Error("Test error message");

		// Test single error
		const singleErrorOutput = formatErrorForDevelopment(error, 0, 1);
		assert.match(singleErrorOutput, /\[Error\]/); // No index for single error
		assert.match(singleErrorOutput, /Test error message/);

		// Test multiple errors
		const multipleErrorOutput = formatErrorForDevelopment(error, 0, 3);
		assert.match(multipleErrorOutput, /\[Error 1\/3\]/); // With index for multiple errors
		assert.match(multipleErrorOutput, /Test error message/);
	});
});

describe("Logger Middleware", () => {
	test("creates middleware with correct defaults and custom options", () => {
		const defaultLogger = new Logger();
		assert.ok(defaultLogger instanceof Middleware);
		assert.strictEqual(defaultLogger.identifier, "@raven-js/wings/logger");
		assert.strictEqual(defaultLogger.production, false);

		const customLogger = new Logger({ production: true, identifier: "custom" });
		assert.strictEqual(customLogger.production, true);
		assert.strictEqual(customLogger.identifier, "custom");
	});

	test("stores request data and logs in development mode", async () => {
		const logger = new Logger({ production: false });
		const ctx = new Context("GET", new URL("http://localhost/test"), new Headers());

		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			await logger.execute(ctx);
			ctx.responseStatusCode = 200;
			await ctx.runAfterCallbacks();

			// Check context data
			assert.ok(ctx.data.requestId);
			assert.ok(ctx.data.loggerStartTime);
			assert.match(ctx.data.requestId, /^\d+-[a-z0-9]+$/);

			// Check log output
			assert.strictEqual(logs.length, 1);
			assert.match(logs[0], /\[200\]/); // Just status code
			assert.match(logs[0], /\(.*[µms ].*\)/); // Performance in tight parentheses
			assert.match(logs[0], /GET/); // Method without extra spacing
			assert.match(logs[0], /\/test/);
		} finally {
			console.log = originalLog;
		}
	});

	test("logs JSON in production mode", async () => {
		const logger = new Logger({ production: true });
		const ctx = new Context("POST", new URL("http://localhost/api/data"), new Headers({
			"authorization": "Bearer token123"
		}));

		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			await logger.execute(ctx);
			ctx.responseStatusCode = 201;
			await ctx.runAfterCallbacks();

			assert.strictEqual(logs.length, 1);
			const logEntry = JSON.parse(logs[0]);
			assert.strictEqual(logEntry.level, "info");
			assert.strictEqual(logEntry.message, "POST /api/data 201");
			assert.strictEqual(logEntry.user.identity, "Bearer token123");
			assert.ok(logEntry.compliance.soc2.cc5_1);
		} finally {
			console.log = originalLog;
		}
	});

	test("integrates with router correctly", async () => {
		const { Router } = await import("../core/router.js");
		const router = new Router();
		const logger = new Logger({ production: true });

		router.useEarly(logger);
		router.get("/test", (ctx) => ctx.json({ success: true }));

		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			const ctx = new Context("GET", new URL("http://localhost/test"), new Headers());
			await router.handleRequest(ctx);

			assert.ok(ctx.data.requestId);
			assert.strictEqual(logs.length, 1);

			const logEntry = JSON.parse(logs[0]);
			assert.strictEqual(logEntry.action.method, "GET");
			assert.strictEqual(logEntry.action.path, "/test");
			assert.strictEqual(logEntry.result.statusCode, 200);
		} finally {
			console.log = originalLog;
		}
	});
});