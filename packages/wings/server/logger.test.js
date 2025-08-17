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
	test("core functions work correctly", () => {
		// generateRequestId
		const id1 = generateRequestId();
		const id2 = generateRequestId();
		assert.notStrictEqual(id1, id2);
		assert.match(id1, /^\d+-[a-z0-9]{9}$/);

		// getStatusColor
		assert.strictEqual(getStatusColor(200), "\x1b[92m\x1b[40m"); // 2xx
		assert.strictEqual(getStatusColor(301), "\x1b[96m\x1b[40m"); // 3xx
		assert.strictEqual(getStatusColor(404), "\x1b[93m\x1b[40m"); // 4xx
		assert.strictEqual(getStatusColor(500), "\x1b[91m\x1b[40m"); // 5xx
		assert.strictEqual(getStatusColor(100), "\x1b[97m\x1b[40m"); // other

		// getMethodColor - test all methods
		assert.strictEqual(getMethodColor("GET"), "\x1b[92m\x1b[40m");
		assert.strictEqual(getMethodColor("get"), "\x1b[92m\x1b[40m"); // case insensitive
		assert.strictEqual(getMethodColor("POST"), "\x1b[94m\x1b[40m");
		assert.strictEqual(getMethodColor("PUT"), "\x1b[93m\x1b[40m");
		assert.strictEqual(getMethodColor("DELETE"), "\x1b[91m\x1b[40m");
		assert.strictEqual(getMethodColor("PATCH"), "\x1b[95m\x1b[40m");
		assert.strictEqual(getMethodColor("UNKNOWN"), "\x1b[97m\x1b[40m");

		// formatDuration - test all performance ranges
		assert.match(formatDuration(0.5), /⚡ 500 µs/); // microseconds
		assert.match(formatDuration(5), /⚡ {3}5 ms/);  // excellent (<10ms)
		assert.match(formatDuration(50), /✓ {2}50 ms/); // good (10-100ms)
		assert.match(formatDuration(200), /⚠ 200 ms/); // slow (>100ms)
		assert.match(formatDuration(1500), /⚠ {3}2 s /); // seconds

		// formatTimestamp and formatRequestId
		assert.strictEqual(formatTimestamp(new Date("2024-01-15T14:30:45.123Z")), "14:30:45");
		assert.strictEqual(formatRequestId("1234567890-abc123def"), "abc123def");
	});

	test("collectLogData extracts context information", () => {
		// Test with full headers
		const fullCtx = new Context("POST", new URL("http://localhost/api/users"), new Headers({
			"user-agent": "TestAgent/1.0",
			"referer": "http://localhost/",
			"x-forwarded-for": "192.168.1.1",
			"authorization": "Bearer user123",
		}));
		fullCtx.responseStatusCode = 201;
		const fullLog = collectLogData(fullCtx, performance.now(), "test-id", new Date());

		assert.strictEqual(fullLog.method, "POST");
		assert.strictEqual(fullLog.statusCode, 201);
		assert.strictEqual(fullLog.userAgent, "TestAgent/1.0");
		assert.strictEqual(fullLog.ip, "192.168.1.1");
		assert.strictEqual(fullLog.userIdentity, "Bearer user123");

		// Test with missing headers
		const emptyCtx = new Context("GET", new URL("http://localhost/test"), new Headers());
		const emptyLog = collectLogData(emptyCtx, performance.now(), "test-id", new Date());
		assert.strictEqual(emptyLog.userAgent, null);
		assert.strictEqual(emptyLog.ip, "unknown");
		assert.strictEqual(emptyLog.userIdentity, null);

		// Test x-real-ip fallback (when x-forwarded-for is missing)
		const realIpCtx = new Context("GET", new URL("http://localhost/test"), new Headers({
			"x-real-ip": "10.0.0.1"
		}));
		const realIpLog = collectLogData(realIpCtx, performance.now(), "test-id", new Date());
		assert.strictEqual(realIpLog.ip, "10.0.0.1");
	});

	test("createStructuredLog generates compliance logs", () => {
		// Store original NODE_ENV
		const originalNodeEnv = process.env.NODE_ENV;

		const logData = {
			method: "GET", path: "/api/users", statusCode: 200, duration: 15,
			userAgent: "TestAgent", requestId: "test-id", timestamp: new Date(),
			ip: "192.168.1.1", userIdentity: "Bearer user123",
		};

		// Test with NODE_ENV set
		process.env.NODE_ENV = "production";
		const result = createStructuredLog(logData);

		assert.strictEqual(result.level, "info");
		assert.strictEqual(result.user.identity, "Bearer user123");
		assert.strictEqual(result.result.success, true);
		assert.ok(result.compliance.soc2.cc5_1);

		// Test errors and edge cases
		const errors = [new Error("Test error")];
		const errorLog = createStructuredLog({
			...logData, statusCode: 500, duration: 0.5, userIdentity: "", errors
		});
		assert.strictEqual(errorLog.level, "error");
		assert.strictEqual(errorLog.user.identity, "anonymous");
		assert.strictEqual(errorLog.result.duration, "500µs");
		assert.strictEqual(errorLog.errorCount, 1);

		// Test success status code but with errors (should be level: "error" due to errors)
		const successWithErrorsLog = createStructuredLog({
			...logData, statusCode: 200, errors
		});
		assert.strictEqual(successWithErrorsLog.level, "error");
		assert.strictEqual(successWithErrorsLog.result.success, false);

		// Test with NODE_ENV undefined (to hit || "development" branch)
		delete process.env.NODE_ENV;
		const devLog = createStructuredLog(logData);
		assert.strictEqual(devLog.metadata.environment, "development");

		// Restore original NODE_ENV
		if (originalNodeEnv !== undefined) {
			process.env.NODE_ENV = originalNodeEnv;
		}
	});

	test("development output functions", () => {
		const logData = {
			method: "GET", path: "/test", statusCode: 200, duration: 15,
			requestId: "1234567890-abc123def", timestamp: new Date("2024-01-15T14:30:45.123Z"),
		};

		// createDevelopmentLogLine
		const result = createDevelopmentLogLine(logData);
		assert.match(result, /14:30:45/);
		assert.match(result, /\[200\]/);
		assert.match(result, /GET/);
		assert.doesNotMatch(result, /abc123def/); // No request ID

		// logProduction
		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			logProduction(logData);
			assert.strictEqual(logs.length, 1);
			const logEntry = JSON.parse(logs[0]);
			assert.strictEqual(logEntry.message, "GET /test 200");

			// logDevelopment
			logs.length = 0;
			logDevelopment(logData);
			assert.strictEqual(logs.length, 1);
			assert.match(logs[0], /\[200\]/);

			// logDevelopment with errors
			logs.length = 0;
			const errors = [new Error("Test error")];
			logDevelopment({...logData, statusCode: 500}, false, errors);
			assert.ok(logs.length > 2); // Main line + error details
			assert.match(logs[0], /\[500\]/);
		} finally {
			console.log = originalLog;
		}
	});

	test("formatErrorForDevelopment comprehensive formatting", () => {
		// Mock stack trace lines to test all path formatting scenarios
		const mockError = {
			name: "ValidationError",
			message: "Test validation failed",
			stack: [
				"ValidationError: Test validation failed",
				// User code - first line (should get relative path and arrow)
				`    at validateInput (file:///${process.cwd()}/src/validators/input.js:42:15)`,
				// User code - second line (should get relative path, no arrow)
				`    at checkInput (file:///${process.cwd()}/src/utils/checker.js:15:20)`,
				// Framework code (should stay as-is, dimmed)
				"    at processTicksAndRejections (node:internal/process/task_queues:95:5)",
				// External package - regular (should get [package] formatting)
				"    at someFunction (file:///Users/test/project/node_modules/express/lib/router/index.js:123:45)",
				// External package - scoped (should get [@scope/package] formatting)
				"    at handler (file:///Users/test/project/node_modules/@babel/core/lib/transform.js:67:89)",
				// Direct match without parentheses (covers missing lines 452-453)
				"    at async file:///Users/test/project/node_modules/lodash/index.js:234:12",
				// Line without proper line:column format (covers missing line 472)
				"    at malformedLine (file:///invalid-path-no-numbers)",
				// Path without leading slash (to test normalization ternary)
				"    at testFunc (file:///relative/path/file.js:10:5)",
				// Absolute path that's neither CWD nor node_modules (should remain as fullPath)
				"    at someLib (file:///usr/local/lib/somelib.js:20:3)",

			].join('\n'),
			code: 'VALIDATION_ERROR',
			field: 'email'
		};

		// Test single error
		const singleOutput = formatErrorForDevelopment(mockError, 0, 1);
		assert.ok(Array.isArray(singleOutput));
		const joinedOutput = singleOutput.join('\n');

		// Check main error formatting (accounting for ANSI color codes)
		assert.match(joinedOutput, /\[Error\] ValidationError.*: Test validation failed/);
		assert.match(joinedOutput, /Stack trace:/);

		// Check relative path formatting for user code (first line should have arrow)
		assert.match(joinedOutput, /→.*\.\/src\/validators\/input\.js line:42/);
		// Check second user code line (should not have arrow)
		assert.match(joinedOutput, / {2}at checkInput.*\.\/src\/utils\/checker\.js line:15/);

		// Check external package formatting (regular and scoped)
		assert.match(joinedOutput, /\[express\] lib\/router\/index\.js line:123/);
		assert.match(joinedOutput, /\[@babel\/core\] lib\/transform\.js line:67/);

		// Check direct match formatting
		assert.match(joinedOutput, /lodash.*index\.js line:234/);

		// Check path normalization (relative path without leading slash)
		assert.match(joinedOutput, /file\.js line:10/);

		// Check absolute path that's neither CWD nor node_modules (should keep full path without leading slash)
		assert.match(joinedOutput, /usr\/local\/lib\/somelib\.js line:20/);

		// Check custom properties (accounting for ANSI color codes and reset sequences)
		assert.match(joinedOutput, /Additional properties:/);
		assert.match(joinedOutput, /code:.*VALIDATION_ERROR/);
		assert.match(joinedOutput, /field:.*email/);

		// Test multiple errors (to get index formatting)
		const multipleOutput = formatErrorForDevelopment(mockError, 1, 3);
		assert.match(multipleOutput.join('\n'), /\[Error 2\/3\]/);

		// Test error without custom properties (should not show "Additional properties" section)
		const simpleError = new Error("Simple error");
		const simpleOutput = formatErrorForDevelopment(simpleError, 0, 1);
		const simpleJoined = simpleOutput.join('\n');
		assert.doesNotMatch(simpleJoined, /Additional properties:/);

		// Test error without stack trace (to hit the no-stack branch)
		const noStackError = { name: "CustomError", message: "No stack available" };
		const noStackOutput = formatErrorForDevelopment(noStackError, 0, 1);
		const noStackJoined = noStackOutput.join('\n');
		assert.match(noStackJoined, /\[Error\] CustomError.*: No stack available/);
		assert.doesNotMatch(noStackJoined, /Stack trace:/);
		assert.doesNotMatch(noStackJoined, /Additional properties:/);

		// Test empty stack trace array (to hit the empty relevantStack branch)
		const emptyStackError = {
			name: "EmptyStackError",
			message: "Empty stack",
			stack: "EmptyStackError: Empty stack"
		};
		const emptyStackOutput = formatErrorForDevelopment(emptyStackError, 0, 1);
		const emptyStackJoined = emptyStackOutput.join('\n');
		assert.match(emptyStackJoined, /\[Error\] EmptyStackError.*: Empty stack/);
		assert.doesNotMatch(emptyStackJoined, /Stack trace:/);

		// Test error with missing name (to hit error.name || 'Error' branch)
		const noNameError = { message: "No name error" };
		const noNameOutput = formatErrorForDevelopment(noNameError, 0, 1);
		const noNameJoined = noNameOutput.join('\n');
		assert.match(noNameJoined, /\[Error\] Error.*: No name error/);

		// Test error with missing message (to hit error.message || 'Unknown error' branch)
		const noMessageError = { name: "TestError" };
		const noMessageOutput = formatErrorForDevelopment(noMessageError, 0, 1);
		const noMessageJoined = noMessageOutput.join('\n');
		assert.match(noMessageJoined, /\[Error\] TestError.*: Unknown error/);
	});
});

describe("Logger Middleware", () => {
	test("middleware configuration and integration", () => {
		// Test defaults
		const defaultLogger = new Logger();
		assert.ok(defaultLogger instanceof Middleware);
		assert.strictEqual(defaultLogger.production, false);
		assert.strictEqual(defaultLogger.identifier, "@raven-js/wings/logger");

		// Test custom options
		const customLogger = new Logger({
			production: true,
			includeHeaders: false,
			includeBody: true,
			identifier: "custom"
		});
		assert.strictEqual(customLogger.production, true);
		assert.strictEqual(customLogger.includeHeaders, false);
		assert.strictEqual(customLogger.includeBody, true);
		assert.strictEqual(customLogger.identifier, "custom");
	});

	test("complete request lifecycle with error collection", async () => {
		const logger = new Logger({ production: false });
		const ctx = new Context("GET", new URL("http://localhost/test"), new Headers());

		// Add some errors to context to test error consumption
		ctx.errors.push(new Error("Test error 1"));
		ctx.errors.push(new Error("Test error 2"));

		const logs = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.join(" "));

		try {
			await logger.execute(ctx);
			ctx.responseStatusCode = 500; // Set error status
			await ctx.runAfterCallbacks();

			// Check that errors were consumed (cleared from context)
			assert.strictEqual(ctx.errors.length, 0);

			// Check that error details were logged
			assert.ok(logs.length > 2); // Main line + error details
			assert.match(logs[0], /\[500\]/);
			const allOutput = logs.join('\n');
			assert.match(allOutput, /Test error 1/);
			assert.match(allOutput, /Test error 2/);
		} finally {
			console.log = originalLog;
		}
	});

	test("production mode structured logging", async () => {
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
});