/**
 * @fileoverview Tests for attack detection functionality
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	checkPathTraversal,
	checkSQLInjection,
	checkSuspiciousPatterns,
	checkXSSAttempt,
	detectAttacks,
	PATH_TRAVERSAL_PATTERNS,
	SQL_INJECTION_PATTERNS,
	SUSPICIOUS_PATTERNS,
	XSS_PATTERNS,
} from "./attack-detection.js";

describe("Attack Detection", () => {
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

	describe("checkSQLInjection", () => {
		it("should detect SQL injection in query parameters", () => {
			const queryParams = new Map([
				["id", "1' OR '1'='1"],
				["name", "test"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should detect UNION-based SQL injection", () => {
			const queryParams = new Map([
				["id", "1 UNION SELECT password FROM users"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should detect SQL injection in path", () => {
			const ctx = createMockContext({
				path: "/users/1' OR 1=1 --",
			});
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should detect SQL injection in headers", () => {
			const requestHeaders = new Map([
				["user-agent", "Mozilla' UNION SELECT * FROM users --"],
			]);
			const ctx = createMockContext({ requestHeaders });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should detect time-based SQL injection", () => {
			const queryParams = new Map([["id", "1; WAITFOR DELAY '00:00:05'"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should detect boolean-based blind SQL injection", () => {
			const queryParams = new Map([["id", "1 AND 1=1"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should detect SQL comments", () => {
			const queryParams = new Map([
				["comment", "Some text /* comment */ more text"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should not detect SQL injection in clean requests", () => {
			const queryParams = new Map([
				["id", "123"],
				["name", "John Doe"],
				["email", "john@example.com"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle empty context gracefully", () => {
			const ctx = createMockContext({
				path: "",
				queryParams: new Map(),
				requestHeaders: new Map(),
			});
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle missing queryParams gracefully", () => {
			const ctx = {
				path: "/test",
				requestHeaders: new Map(),
			};
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle non-string values gracefully", () => {
			const queryParams = new Map([
				["number", 123],
				["boolean", true],
				["null", null],
				["undefined", undefined],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});
	});

	describe("checkXSSAttempt", () => {
		it("should detect script tag injection", () => {
			const queryParams = new Map([
				["message", "<script>alert('xss')</script>"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkXSSAttempt(ctx);
			assert.ok(result);
			assert.ok(result.includes("XSS attempt detected"));
		});

		it("should detect event handler injection", () => {
			const queryParams = new Map([
				["input", "<img src=x onerror=alert('xss')>"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkXSSAttempt(ctx);
			assert.ok(result);
			assert.ok(result.includes("XSS attempt detected"));
		});

		it("should detect javascript protocol", () => {
			const queryParams = new Map([["url", "javascript:alert('xss')"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkXSSAttempt(ctx);
			assert.ok(result);
			assert.ok(result.includes("XSS attempt detected"));
		});

		it("should detect data URL with HTML", () => {
			const queryParams = new Map([
				["content", "data:text/html<script>alert('xss')</script>"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkXSSAttempt(ctx);
			assert.ok(result);
			assert.ok(result.includes("XSS attempt detected"));
		});

		it("should detect CSS expression injection", () => {
			const queryParams = new Map([
				["style", "background: expression(alert('xss'))"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkXSSAttempt(ctx);
			assert.ok(result);
			assert.ok(result.includes("XSS attempt detected"));
		});

		it("should not detect XSS in clean content", () => {
			const queryParams = new Map([
				["message", "Hello, world!"],
				["name", "John Doe"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkXSSAttempt(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle empty context gracefully", () => {
			const ctx = createMockContext({
				path: "",
				queryParams: new Map(),
			});
			const result = checkXSSAttempt(ctx);
			assert.strictEqual(result, null);
		});
	});

	describe("checkPathTraversal", () => {
		it("should detect directory traversal in path", () => {
			const ctx = createMockContext({
				path: "/files/../../etc/passwd",
			});
			const result = checkPathTraversal(ctx);
			assert.ok(result);
			assert.ok(result.includes("Path traversal attempt detected"));
		});

		it("should detect directory traversal in query params", () => {
			const queryParams = new Map([["file", "../../../secret.txt"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkPathTraversal(ctx);
			assert.ok(result);
			assert.ok(result.includes("Path traversal attempt detected"));
		});

		it("should detect URL encoded traversal", () => {
			const queryParams = new Map([["path", "%2e%2e%2f%2e%2e%2fetc%2fpasswd"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkPathTraversal(ctx);
			assert.ok(result);
			assert.ok(result.includes("Path traversal attempt detected"));
		});

		it("should detect double URL encoding", () => {
			const queryParams = new Map([["path", "%252e%252e%252f"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkPathTraversal(ctx);
			assert.ok(result);
			assert.ok(result.includes("Path traversal attempt detected"));
		});

		it("should not detect traversal in clean paths", () => {
			const queryParams = new Map([
				["file", "document.pdf"],
				["folder", "uploads"],
			]);
			const ctx = createMockContext({
				path: "/api/files/download",
				queryParams,
			});
			const result = checkPathTraversal(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle backslash traversal", () => {
			const ctx = createMockContext({
				path: "/files/..\\..\\windows\\system32",
			});
			const result = checkPathTraversal(ctx);
			assert.ok(result);
			assert.ok(result.includes("Path traversal attempt detected"));
		});
	});

	describe("checkSuspiciousPatterns", () => {
		it("should detect command injection attempts", () => {
			const queryParams = new Map([["cmd", "ls -la; rm -rf /"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkSuspiciousPatterns(ctx);
			assert.ok(result);
			assert.ok(result.includes("Suspicious pattern detected"));
		});

		it("should detect server-side template injection", () => {
			const queryParams = new Map([["template", "{{7*7}}"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkSuspiciousPatterns(ctx);
			assert.ok(result);
			assert.ok(result.includes("Suspicious pattern detected"));
		});

		it("should detect LDAP injection characters", () => {
			const queryParams = new Map([["filter", "(&(cn=*)(userPassword=*))"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkSuspiciousPatterns(ctx);
			assert.ok(result);
			assert.ok(result.includes("Suspicious pattern detected"));
		});

		it("should detect XML injection", () => {
			const queryParams = new Map([
				["xml", "<!ENTITY xxe SYSTEM 'file:///etc/passwd'>"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSuspiciousPatterns(ctx);
			assert.ok(result);
			assert.ok(result.includes("Suspicious pattern detected"));
		});

		it("should not detect patterns in clean requests", () => {
			const queryParams = new Map([
				["message", "Hello world"],
				["number", "123"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSuspiciousPatterns(ctx);
			assert.strictEqual(result, null);
		});

		it("should detect bash variable expansion", () => {
			const queryParams = new Map([["input", "$" + "{HOME}/secret"]]);
			const ctx = createMockContext({ queryParams });
			const result = checkSuspiciousPatterns(ctx);
			assert.ok(result);
			assert.ok(result.includes("Suspicious pattern detected"));
		});
	});

	describe("detectAttacks", () => {
		it("should detect SQL injection when enabled", () => {
			const queryParams = new Map([["id", "1' OR '1'='1"]]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx, {
				enableSQLInjectionDetection: true,
			});
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should not detect SQL injection when disabled", () => {
			const queryParams = new Map([["id", "1' OR '1'='1"]]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx, {
				sqlInjection: false,
				xss: false,
				pathTraversal: false,
				suspiciousPatterns: false,
			});
			assert.strictEqual(result, null);
		});

		it("should detect XSS when enabled", () => {
			const queryParams = new Map([
				["content", "<script>alert('xss')</script>"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx, {
				enableXSSDetection: true,
				enableSQLInjectionDetection: false,
			});
			assert.ok(result);
			assert.ok(result.includes("XSS attempt detected"));
		});

		it("should detect path traversal when enabled", () => {
			const ctx = createMockContext({
				path: "/files/../../etc/passwd",
			});
			const result = detectAttacks(ctx, {
				enablePathTraversalDetection: true,
				enableSQLInjectionDetection: false,
				enableXSSDetection: false,
			});
			assert.ok(result);
			assert.ok(result.includes("Path traversal attempt detected"));
		});

		it("should detect suspicious patterns when enabled", () => {
			const queryParams = new Map([["cmd", "ls; rm -rf /"]]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx, {
				enableSuspiciousPatternDetection: true,
				enableSQLInjectionDetection: false,
				enableXSSDetection: false,
				enablePathTraversalDetection: false,
			});
			assert.ok(result);
			assert.ok(result.includes("Suspicious pattern detected"));
		});

		it("should return first detection result in priority order", () => {
			const queryParams = new Map([
				["id", "1' OR '1'='1"], // SQL injection
				["content", "<script>alert('xss')</script>"], // XSS
			]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx);
			// Should detect SQL injection first (higher priority)
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should return null for clean requests", () => {
			const queryParams = new Map([
				["name", "John Doe"],
				["email", "john@example.com"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx);
			assert.strictEqual(result, null);
		});

		it("should use default configuration when no config provided", () => {
			const queryParams = new Map([["id", "1' OR '1'='1"]]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx); // No config provided
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
		});

		it("should handle partial configuration", () => {
			const queryParams = new Map([
				["content", "<script>alert('xss')</script>"],
			]);
			const ctx = createMockContext({ queryParams });
			const result = detectAttacks(ctx, {
				enableSQLInjectionDetection: false, // Only disable SQL injection
			});
			assert.ok(result);
			assert.ok(result.includes("XSS attempt detected"));
		});
	});

	describe("Pattern Constants", () => {
		it("should have SQL injection patterns", () => {
			assert.ok(Array.isArray(SQL_INJECTION_PATTERNS));
			assert.ok(SQL_INJECTION_PATTERNS.length > 0);
			assert.ok(
				SQL_INJECTION_PATTERNS.every((pattern) => pattern instanceof RegExp),
			);
		});

		it("should have XSS patterns", () => {
			assert.ok(Array.isArray(XSS_PATTERNS));
			assert.ok(XSS_PATTERNS.length > 0);
			assert.ok(XSS_PATTERNS.every((pattern) => pattern instanceof RegExp));
		});

		it("should have path traversal patterns", () => {
			assert.ok(Array.isArray(PATH_TRAVERSAL_PATTERNS));
			assert.ok(PATH_TRAVERSAL_PATTERNS.length > 0);
			assert.ok(
				PATH_TRAVERSAL_PATTERNS.every((pattern) => pattern instanceof RegExp),
			);
		});

		it("should have suspicious patterns", () => {
			assert.ok(Array.isArray(SUSPICIOUS_PATTERNS));
			assert.ok(SUSPICIOUS_PATTERNS.length > 0);
			assert.ok(
				SUSPICIOUS_PATTERNS.every((pattern) => pattern instanceof RegExp),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle extremely long attack strings", () => {
			const longAttack = `1' OR '1'='1${"A".repeat(10000)}`;
			const queryParams = new Map([["id", longAttack]]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection attempt detected"));
			// Should truncate the displayed string
			assert.ok(result.length < longAttack.length + 100);
		});

		it("should handle null and undefined contexts gracefully", () => {
			const result1 = checkSQLInjection({});
			const result2 = checkXSSAttempt({});
			const result3 = checkPathTraversal({});
			const result4 = checkSuspiciousPatterns({});
			assert.strictEqual(result1, null);
			assert.strictEqual(result2, null);
			assert.strictEqual(result3, null);
			assert.strictEqual(result4, null);
		});

		it("should handle malformed query parameters", () => {
			const ctx = {
				path: "/test",
				queryParams: "not a map",
				requestHeaders: new Map(),
			};
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle case sensitivity in patterns", () => {
			const queryParams = new Map([
				["id", "1' OR '1'='1"], // Lowercase
				["content", "1' Or '1'='1"], // Mixed case
			]);
			const ctx = createMockContext({ queryParams });
			const result = checkSQLInjection(ctx);
			assert.ok(result);
		});
	});

	describe("Error Handling Coverage", () => {
		it("should handle queryParams.entries() errors in checkSQLInjection", () => {
			const ctx = createMockContext({
				queryParams: {
					entries: () => {
						throw new Error("Malformed queryParams");
					},
				},
			});
			// Should not throw, should return null
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle requestHeaders.get() errors in checkSQLInjection", () => {
			const ctx = createMockContext({
				requestHeaders: {
					get: (header) => {
						if (header === "user-agent") {
							throw new Error("Malformed header");
						}
						return null;
					},
				},
			});
			// Should not throw, should return null
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle queryParams.entries() errors in checkXSSAttempt", () => {
			const ctx = createMockContext({
				queryParams: {
					entries: () => {
						throw new Error("Malformed queryParams");
					},
				},
			});
			// Should not throw, should return null
			const result = checkXSSAttempt(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle queryParams.entries() errors in checkPathTraversal", () => {
			const ctx = createMockContext({
				queryParams: {
					entries: () => {
						throw new Error("Malformed queryParams");
					},
				},
			});
			// Should not throw, should return null
			const result = checkPathTraversal(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle queryParams.entries() errors in checkSuspiciousPatterns", () => {
			const ctx = createMockContext({
				queryParams: {
					entries: () => {
						throw new Error("Malformed queryParams");
					},
				},
			});
			// Should not throw, should return null
			const result = checkSuspiciousPatterns(ctx);
			assert.strictEqual(result, null);
		});

		it("should handle multiple header errors in checkSQLInjection", () => {
			const ctx = createMockContext({
				requestHeaders: {
					get: (header) => {
						// Throw errors for all suspicious headers
						if (["user-agent", "referer", "x-forwarded-for"].includes(header)) {
							throw new Error(`Malformed ${header} header`);
						}
						return null;
					},
				},
			});
			// Should not throw, should return null
			const result = checkSQLInjection(ctx);
			assert.strictEqual(result, null);
		});

		it("should still detect attacks even with some header errors", () => {
			const ctx = createMockContext({
				path: "/test?id=1' OR 1=1",
				requestHeaders: {
					get: (header) => {
						if (header === "user-agent") {
							throw new Error("Malformed header");
						}
						return null;
					},
				},
			});
			// Should still detect SQL injection in path despite header errors
			const result = checkSQLInjection(ctx);
			assert.ok(result);
			assert.ok(result.includes("SQL injection"));
		});
	});
});
