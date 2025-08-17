import assert from "node:assert";
import { describe, test } from "node:test";
import { Context } from "../core/context.js";
import { Middleware } from "../core/middleware.js";
import {
	collectLogData,
	createDevelopmentLogLine,
	createStructuredLog,
	formatDuration,
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
	describe("generateRequestId", () => {
		test("should generate unique request IDs", () => {
			const id1 = generateRequestId();
			const id2 = generateRequestId();

			assert.strictEqual(typeof id1, "string");
			assert.strictEqual(typeof id2, "string");
			assert.notStrictEqual(id1, id2);
			assert.match(id1, /^\d+-[a-z0-9]+$/);
			assert.match(id2, /^\d+-[a-z0-9]+$/);
		});

		test("should include timestamp and random string", () => {
			const id = generateRequestId();
			const parts = id.split("-");

			assert.strictEqual(parts.length, 2);
			assert.ok(!Number.isNaN(parseInt(parts[0], 10)));
			assert.strictEqual(parts[1].length, 9);
			assert.match(parts[1], /^[a-z0-9]+$/);
		});
	});

	describe("getStatusColor", () => {
		test("should return green for 2xx status codes", () => {
			assert.strictEqual(getStatusColor(200), "\x1b[32m");
			assert.strictEqual(getStatusColor(201), "\x1b[32m");
			assert.strictEqual(getStatusColor(299), "\x1b[32m");
		});

		test("should return blue for 3xx status codes", () => {
			assert.strictEqual(getStatusColor(300), "\x1b[34m");
			assert.strictEqual(getStatusColor(301), "\x1b[34m");
			assert.strictEqual(getStatusColor(399), "\x1b[34m");
		});

		test("should return yellow for 4xx status codes", () => {
			assert.strictEqual(getStatusColor(400), "\x1b[33m");
			assert.strictEqual(getStatusColor(404), "\x1b[33m");
			assert.strictEqual(getStatusColor(499), "\x1b[33m");
		});

		test("should return red for 5xx status codes", () => {
			assert.strictEqual(getStatusColor(500), "\x1b[31m");
			assert.strictEqual(getStatusColor(502), "\x1b[31m");
			assert.strictEqual(getStatusColor(599), "\x1b[31m");
		});

		test("should return white for other status codes", () => {
			assert.strictEqual(getStatusColor(100), "\x1b[37m");
			assert.strictEqual(getStatusColor(199), "\x1b[37m");
			assert.strictEqual(getStatusColor(600), "\x1b[37m");
		});
	});

	describe("getMethodColor", () => {
		test("should return correct colors for HTTP methods", () => {
			assert.strictEqual(getMethodColor("GET"), "\x1b[32m");
			assert.strictEqual(getMethodColor("POST"), "\x1b[34m");
			assert.strictEqual(getMethodColor("PUT"), "\x1b[33m");
			assert.strictEqual(getMethodColor("DELETE"), "\x1b[31m");
			assert.strictEqual(getMethodColor("PATCH"), "\x1b[35m");
		});

		test("should handle case insensitive methods", () => {
			assert.strictEqual(getMethodColor("get"), "\x1b[32m");
			assert.strictEqual(getMethodColor("Post"), "\x1b[34m");
			assert.strictEqual(getMethodColor("PUT"), "\x1b[33m");
		});

		test("should return white for unknown methods", () => {
			assert.strictEqual(getMethodColor("OPTIONS"), "\x1b[37m");
			assert.strictEqual(getMethodColor("HEAD"), "\x1b[37m");
			assert.strictEqual(getMethodColor("TRACE"), "\x1b[37m");
		});
	});

	describe("formatDuration", () => {
		test("should format microsecond durations", () => {
			const result = formatDuration(0.5);
			assert.match(result, /0\.500ms/);
			assert.match(result, /⚡/);
		});

		test("should format excellent durations", () => {
			const result = formatDuration(5);
			assert.match(result, /5ms/);
			assert.match(result, /🚀/);
		});

		test("should format good durations", () => {
			const result = formatDuration(50);
			assert.match(result, /50ms/);
			assert.match(result, /⚡/);
		});

		test("should format slow durations", () => {
			const result = formatDuration(200);
			assert.match(result, /200ms/);
			assert.match(result, /🐌/);
		});

		test("should format very slow durations", () => {
			const result = formatDuration(1000);
			assert.match(result, /1000ms/);
			assert.match(result, /🐌/);
		});
	});

	describe("formatTimestamp", () => {
		test("should format timestamp to HH:MM:SS", () => {
			const date = new Date("2024-01-15T14:30:45.123Z");
			const result = formatTimestamp(date);
			assert.strictEqual(result, "14:30:45");
		});

		test("should handle different times", () => {
			const date = new Date("2024-01-15T09:05:12.456Z");
			const result = formatTimestamp(date);
			assert.strictEqual(result, "09:05:12");
		});
	});

	describe("formatRequestId", () => {
		test("should extract short ID from full request ID", () => {
			const result = formatRequestId("1234567890-abc123def");
			assert.strictEqual(result, "abc123def");
		});

		test("should handle different ID formats", () => {
			const result = formatRequestId("9999999999-xyz789ghi");
			assert.strictEqual(result, "xyz789ghi");
		});
	});

	describe("collectLogData", () => {
		test("should collect all log data from context", () => {
			const url = new URL("http://localhost/api/users");
			const headers = new Headers({
				"user-agent": "TestAgent/1.0",
				referer: "http://localhost/",
				"x-forwarded-for": "192.168.1.1",
				authorization: "Bearer user123",
			});
			const ctx = new Context("POST", url, headers);
			ctx.responseStatusCode = 201;

			const startTime = performance.now();
			const requestId = "1234567890-abc123def";
			const timestamp = new Date("2024-01-15T14:30:45.123Z");

			// Small delay to ensure duration > 0
			setTimeout(() => {
				const logData = collectLogData(ctx, startTime, requestId, timestamp);

				assert.strictEqual(logData.method, "POST");
				assert.strictEqual(logData.path, "/api/users");
				assert.strictEqual(logData.statusCode, 201);
				assert.ok(logData.duration > 0);
				assert.strictEqual(logData.userAgent, "TestAgent/1.0");
				assert.strictEqual(logData.referrer, "http://localhost/");
				assert.strictEqual(logData.requestId, requestId);
				assert.strictEqual(logData.timestamp, timestamp);
				assert.strictEqual(logData.ip, "192.168.1.1");
				assert.strictEqual(logData.userIdentity, "Bearer user123");
			}, 1);
		});

		test("should handle missing headers", () => {
			const url = new URL("http://localhost/api/users");
			const ctx = new Context("GET", url, new Headers());
			ctx.responseStatusCode = 200;

			const startTime = performance.now();
			const requestId = "1234567890-abc123def";
			const timestamp = new Date();

			const logData = collectLogData(ctx, startTime, requestId, timestamp);

			assert.strictEqual(logData.userAgent, null);
			assert.strictEqual(logData.referrer, null);
			assert.strictEqual(logData.ip, "unknown");
			assert.strictEqual(logData.userIdentity, null);
		});

		test("should prioritize x-forwarded-for over x-real-ip", () => {
			const url = new URL("http://localhost/api/users");
			const headers = new Headers({
				"x-forwarded-for": "10.0.0.1",
				"x-real-ip": "10.0.0.2",
			});
			const ctx = new Context("GET", url, headers);

			const logData = collectLogData(
				ctx,
				performance.now(),
				"test-id",
				new Date(),
			);

			assert.strictEqual(logData.ip, "10.0.0.1");
		});

		test("should fallback to x-real-ip when x-forwarded-for is missing", () => {
			const url = new URL("http://localhost/api/users");
			const headers = new Headers({
				"x-real-ip": "10.0.0.2",
			});
			const ctx = new Context("GET", url, headers);

			const logData = collectLogData(
				ctx,
				performance.now(),
				"test-id",
				new Date(),
			);

			assert.strictEqual(logData.ip, "10.0.0.2");
		});
	});

	describe("createStructuredLog", () => {
		test("should create structured log for successful request", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 15,
				userAgent: "TestAgent/1.0",
				referrer: "http://localhost/",
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1",
				userIdentity: "Bearer user123",
			};

			const result = createStructuredLog(logData);

			assert.strictEqual(result.timestamp, "2024-01-15T14:30:45.123Z");
			assert.strictEqual(result.level, "info");
			assert.strictEqual(result.message, "GET /api/users 200");
			assert.strictEqual(result.user.identity, "Bearer user123");
			assert.strictEqual(result.user.ipAddress, "192.168.1.1");
			assert.strictEqual(result.user.userAgent, "TestAgent/1.0");
			assert.strictEqual(result.action.method, "GET");
			assert.strictEqual(result.action.path, "/api/users");
			assert.strictEqual(result.action.referrer, "http://localhost/");
			assert.strictEqual(result.result.success, true);
			assert.strictEqual(result.result.statusCode, 200);
			assert.strictEqual(result.result.duration, "15ms");
			assert.strictEqual(result.result.performance, "good");
			assert.strictEqual(result.audit.requestId, "1234567890-abc123def");
			assert.strictEqual(result.audit.source, "wings-server");
			assert.ok(result.compliance.soc2.cc5_1);
			assert.ok(result.compliance.soc2.cc5_2);
			assert.ok(result.compliance.iso27001.a12_4_1);
			assert.ok(result.compliance.gdpr.article_30);
			assert.strictEqual(result.metadata.service, "wings-server");
			assert.strictEqual(result.metadata.version, "1.0.0");
			assert.strictEqual(result.metadata.complianceReady, true);
		});

		test("should create structured log for failed request", () => {
			const logData = {
				method: "POST",
				path: "/api/users",
				statusCode: 500,
				duration: 250,
				userAgent: null,
				referrer: null,
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "unknown",
				userIdentity: null,
			};

			const result = createStructuredLog(logData);

			assert.strictEqual(result.level, "error");
			assert.strictEqual(result.message, "POST /api/users 500");
			assert.strictEqual(result.user.identity, "anonymous");
			assert.strictEqual(result.user.ipAddress, "unknown");
			assert.strictEqual(result.user.userAgent, null);
			assert.strictEqual(result.action.referrer, null);
			assert.strictEqual(result.result.success, false);
			assert.strictEqual(result.result.performance, "slow");
		});

		test("should handle empty string user identity", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 15,
				userAgent: "TestAgent/1.0",
				referrer: "http://localhost/",
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1",
				userIdentity: "",
			};

			const result = createStructuredLog(logData);

			assert.strictEqual(result.user.identity, "anonymous");
		});

		test("should handle null IP address", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 15,
				userAgent: "TestAgent/1.0",
				referrer: "http://localhost/",
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: null,
				userIdentity: "Bearer user123",
			};

			const result = createStructuredLog(logData);

			assert.strictEqual(result.user.ipAddress, null);
		});

		test("should categorize performance correctly", () => {
			const baseData = {
				method: "GET",
				path: "/test",
				statusCode: 200,
				userAgent: null,
				referrer: null,
				requestId: "test",
				timestamp: new Date(),
				ip: "127.0.0.1",
				userIdentity: null,
			};

			const excellent = createStructuredLog({ ...baseData, duration: 5 });
			const good = createStructuredLog({ ...baseData, duration: 50 });
			const slow = createStructuredLog({ ...baseData, duration: 150 });

			assert.strictEqual(excellent.result.performance, "excellent");
			assert.strictEqual(good.result.performance, "good");
			assert.strictEqual(slow.result.performance, "slow");
		});

		test("should handle edge cases in performance categorization", () => {
			const baseData = {
				method: "GET",
				path: "/test",
				statusCode: 200,
				userAgent: null,
				referrer: null,
				requestId: "test",
				timestamp: new Date(),
				ip: "127.0.0.1",
				userIdentity: null,
			};

			// Test boundary values
			const excellentBoundary = createStructuredLog({
				...baseData,
				duration: 9,
			});
			const goodBoundary = createStructuredLog({ ...baseData, duration: 99 });
			const slowBoundary = createStructuredLog({ ...baseData, duration: 100 });

			assert.strictEqual(excellentBoundary.result.performance, "excellent");
			assert.strictEqual(goodBoundary.result.performance, "good");
			assert.strictEqual(slowBoundary.result.performance, "slow");
		});
	});

	describe("createDevelopmentLogLine", () => {
		test("should create formatted development log line", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 15,
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
			};

			const result = createDevelopmentLogLine(logData);

			assert.match(result, /14:30:45/);
			assert.match(result, /GET\s{3}/);
			assert.match(result, /\/api\/users/);
			assert.match(result, /200/);
			assert.match(result, /15ms/);
			assert.match(result, /#abc123def/);
		});

		test("should handle different HTTP methods", () => {
			const baseData = {
				path: "/test",
				statusCode: 200,
				duration: 10,
				requestId: "1234567890-test123",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
			};

			const getLine = createDevelopmentLogLine({ ...baseData, method: "GET" });
			const postLine = createDevelopmentLogLine({
				...baseData,
				method: "POST",
			});
			const deleteLine = createDevelopmentLogLine({
				...baseData,
				method: "DELETE",
			});

			assert.match(getLine, /GET\s{3}/);
			assert.match(postLine, /POST\s{2}/);
			assert.match(deleteLine, /DELETE/);
		});
	});

	describe("logProduction", () => {
		test("should log JSON to console", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 15,
				userAgent: "TestAgent/1.0",
				referrer: "http://localhost/",
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1",
				userIdentity: "Bearer user123",
			};

			const originalLog = console.log;
			const logs = [];
			console.log = (...args) => logs.push(args.join(" "));

			try {
				logProduction(logData);
				assert.strictEqual(logs.length, 1);

				const logEntry = JSON.parse(logs[0]);
				assert.strictEqual(logEntry.message, "GET /api/users 200");
				assert.strictEqual(logEntry.level, "info");
			} finally {
				console.log = originalLog;
			}
		});
	});

	describe("logDevelopment", () => {
		test("should log colored output with headers", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 15,
				userAgent: "TestAgent/1.0",
				referrer: "http://localhost/",
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1",
				userIdentity: "Bearer user123",
			};

			const originalLog = console.log;
			const logs = [];
			console.log = (...args) => logs.push(args.join(" "));

			try {
				logDevelopment(logData, true);
				assert.strictEqual(logs.length, 3);
				assert.match(logs[0], /GET\s{3}/);
				assert.match(logs[0], /\/api\/users/);
				assert.match(logs[0], /200/);
				assert.match(logs[1], /User-Agent: TestAgent\/1\.0/);
				assert.match(logs[2], /Referrer: http:\/\/localhost\//);
			} finally {
				console.log = originalLog;
			}
		});

		test("should log colored output without headers", () => {
			const logData = {
				method: "POST",
				path: "/api/users",
				statusCode: 201,
				duration: 25,
				userAgent: "TestAgent/1.0",
				referrer: "http://localhost/",
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1",
				userIdentity: "Bearer user123",
			};

			const originalLog = console.log;
			const logs = [];
			console.log = (...args) => logs.push(args.join(" "));

			try {
				logDevelopment(logData, false);
				assert.strictEqual(logs.length, 1);
				assert.match(logs[0], /POST\s{2}/);
				assert.match(logs[0], /\/api\/users/);
				assert.match(logs[0], /201/);
			} finally {
				console.log = originalLog;
			}
		});

		test("should handle missing user agent and referrer", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 10,
				userAgent: null,
				referrer: null,
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1",
				userIdentity: null,
			};

			const originalLog = console.log;
			const logs = [];
			console.log = (...args) => logs.push(args.join(" "));

			try {
				logDevelopment(logData, true);
				assert.strictEqual(logs.length, 1);
				assert.match(logs[0], /GET\s{3}/);
			} finally {
				console.log = originalLog;
			}
		});

		test("should handle empty string headers", () => {
			const logData = {
				method: "GET",
				path: "/api/users",
				statusCode: 200,
				duration: 10,
				userAgent: "",
				referrer: "",
				requestId: "1234567890-abc123def",
				timestamp: new Date("2024-01-15T14:30:45.123Z"),
				ip: "192.168.1.1",
				userIdentity: null,
			};

			const originalLog = console.log;
			const logs = [];
			console.log = (...args) => logs.push(args.join(" "));

			try {
				logDevelopment(logData, true);
				assert.strictEqual(logs.length, 1);
				assert.match(logs[0], /GET\s{3}/);
			} finally {
				console.log = originalLog;
			}
		});
	});
});

describe("Logger Middleware", () => {
	test("should create logger middleware with default options", () => {
		const logger = new Logger();

		assert.ok(logger instanceof Middleware);
		assert.strictEqual(logger.identifier, "@raven-js/wings/logger");
		assert.strictEqual(logger.production, false);
		assert.strictEqual(logger.includeHeaders, true);
		assert.strictEqual(logger.includeBody, false);
	});

	test("should create logger middleware with custom options", () => {
		const logger = new Logger({
			production: true,
			includeHeaders: false,
			includeBody: true,
			identifier: "custom-logger",
		});

		assert.ok(logger instanceof Middleware);
		assert.strictEqual(logger.identifier, "custom-logger");
		assert.strictEqual(logger.production, true);
		assert.strictEqual(logger.includeHeaders, false);
		assert.strictEqual(logger.includeBody, true);
	});

	test("should store request ID and start time in context data", async () => {
		const logger = new Logger();
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await logger.execute(ctx);

		assert.ok(ctx.data.requestId);
		assert.ok(ctx.data.loggerStartTime);
		assert.strictEqual(typeof ctx.data.requestId, "string");
		assert.strictEqual(typeof ctx.data.loggerStartTime, "number");
		assert.match(ctx.data.requestId, /^\d+-[a-z0-9]+$/);
	});

	test("should log colored output in development mode", async () => {
		const logger = new Logger({ production: false });
		const url = new URL("http://localhost/api/users");
		const headers = new Headers({
			"user-agent": "TestAgent/1.0",
			referer: "http://localhost/",
			"x-forwarded-for": "192.168.1.1",
		});
		const ctx = new Context("GET", url, headers);

		const originalLog = console.log;
		const logs = [];
		console.log = (...args) => logs.push(args.join(" "));

		try {
			await logger.execute(ctx);
			ctx.responseStatusCode = 200;
			await ctx.runAfterCallbacks();

			assert.strictEqual(logs.length, 3);
			const logLine = logs[0];
			assert.match(logLine, /\d{2}:\d{2}:\d{2}/);
			assert.match(logLine, /GET\s+/);
			assert.match(logLine, /\/api\/users/);
			assert.match(logLine, /200/);
			assert.match(logLine, /\d+ms/);
			assert.match(logLine, /#[a-z0-9]+/);
			assert.strictEqual(logs[1], "\x1b[2m  User-Agent: TestAgent/1.0\x1b[0m");
			assert.strictEqual(
				logs[2],
				"\x1b[2m  Referrer: http://localhost/\x1b[0m",
			);
		} finally {
			console.log = originalLog;
		}
	});

	test("should log JSON output in production mode", async () => {
		const logger = new Logger({ production: true });
		const url = new URL("http://localhost/api/users");
		const headers = new Headers({
			"user-agent": "TestAgent/1.0",
			referer: "http://localhost/",
			"x-forwarded-for": "192.168.1.1",
			authorization: "Bearer user123",
		});
		const ctx = new Context("GET", url, headers);

		const originalLog = console.log;
		const logs = [];
		console.log = (...args) => logs.push(args.join(" "));

		try {
			await logger.execute(ctx);
			ctx.responseStatusCode = 200;
			await ctx.runAfterCallbacks();

			assert.strictEqual(logs.length, 1);
			const logEntry = JSON.parse(logs[0]);
			assert.strictEqual(logEntry.level, "info");
			assert.strictEqual(logEntry.message, "GET /api/users 200");
			assert.strictEqual(logEntry.user.identity, "Bearer user123");
			assert.strictEqual(logEntry.user.ipAddress, "192.168.1.1");
			assert.strictEqual(logEntry.user.userAgent, "TestAgent/1.0");
			assert.strictEqual(logEntry.action.method, "GET");
			assert.strictEqual(logEntry.action.path, "/api/users");
			assert.strictEqual(logEntry.action.referrer, "http://localhost/");
			assert.strictEqual(logEntry.result.success, true);
			assert.strictEqual(logEntry.result.statusCode, 200);
			assert.match(logEntry.result.duration, /\d+ms/);
			assert.ok(
				["excellent", "good", "slow"].includes(logEntry.result.performance),
			);
			assert.ok(logEntry.audit.requestId);
			assert.strictEqual(logEntry.audit.source, "wings-server");
			assert.ok(logEntry.compliance.soc2.cc5_1);
			assert.ok(logEntry.compliance.soc2.cc5_2);
			assert.ok(logEntry.compliance.iso27001.a12_4_1);
			assert.ok(logEntry.compliance.gdpr.article_30);
			assert.ok(logEntry.metadata.complianceReady);
		} finally {
			console.log = originalLog;
		}
	});

	test("should work with useEarly in router", async () => {
		const { Router } = await import("../core/router.js");
		const router = new Router();

		const logger = new Logger({ production: true });
		router.useEarly(logger);

		router.get("/test", (ctx) => {
			ctx.json({ message: "Hello World" });
		});

		const originalLog = console.log;
		const logs = [];
		console.log = (...args) => logs.push(args.join(" "));

		try {
			const url = new URL("http://localhost/test");
			const ctx = new Context("GET", url, new Headers());
			await router.handleRequest(ctx);

			assert.ok(ctx.data.requestId);
			assert.ok(ctx.data.loggerStartTime);
			assert.strictEqual(logs.length, 1);

			const logEntry = JSON.parse(logs[0]);
			assert.strictEqual(logEntry.action.method, "GET");
			assert.strictEqual(logEntry.action.path, "/test");
			assert.strictEqual(logEntry.result.statusCode, 200);
		} finally {
			console.log = originalLog;
		}
	});

	test("should handle environment fallback", () => {
		const logData = {
			method: "GET",
			path: "/api/users",
			statusCode: 200,
			duration: 15,
			userAgent: "TestAgent/1.0",
			referrer: "http://localhost/",
			requestId: "1234567890-abc123def",
			timestamp: new Date("2024-01-15T14:30:45.123Z"),
			ip: "192.168.1.1",
			userIdentity: "Bearer user123",
		};

		// Save original NODE_ENV
		const originalEnv = process.env.NODE_ENV;
		delete process.env.NODE_ENV;

		try {
			const result = createStructuredLog(logData);
			assert.strictEqual(result.audit.environment, "development");
		} finally {
			// Restore original NODE_ENV
			if (originalEnv) {
				process.env.NODE_ENV = originalEnv;
			}
		}
	});
});
