/**
 * @fileoverview Tests for security headers functionality
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	DEFAULT_CSP_DIRECTIVES,
	DEFAULT_HEADERS,
	formatCSP,
	formatPermissionsPolicy,
	setSecurityHeaders,
} from "./security-headers.js";

describe("formatCSP", () => {
	it("should format basic CSP directives correctly", () => {
		const directives = {
			"default-src": ["'self'"],
			"script-src": ["'self'", "'unsafe-inline'"],
			"style-src": ["'self'", "https://fonts.googleapis.com"],
		};

		const result = formatCSP(directives);
		assert.strictEqual(
			result,
			"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com",
		);
	});

	it("should handle string values for directives", () => {
		const directives = {
			"default-src": "'none'",
			"script-src": ["'self'"],
		};

		const result = formatCSP(directives);
		assert.strictEqual(result, "default-src 'none'; script-src 'self'");
	});

	it("should skip empty arrays", () => {
		const directives = {
			"default-src": ["'self'"],
			"script-src": [],
			"style-src": ["'self'"],
		};

		const result = formatCSP(directives);
		assert.strictEqual(result, "default-src 'self'; style-src 'self'");
	});

	it("should handle single item arrays", () => {
		const directives = {
			"default-src": ["'none'"],
		};

		const result = formatCSP(directives);
		assert.strictEqual(result, "default-src 'none'");
	});

	it("should handle empty directives object", () => {
		const result = formatCSP({});
		assert.strictEqual(result, "");
	});

	it("should handle null/undefined values gracefully", () => {
		const directives = {
			"default-src": ["'self'"],
			"script-src": null,
			"style-src": undefined,
			"img-src": ["'self'"],
		};

		const result = formatCSP(directives);
		assert.strictEqual(result, "default-src 'self'; img-src 'self'");
	});

	it("should handle special characters in sources", () => {
		const directives = {
			"script-src": ["'self'", "'sha256-abc123'", "'nonce-xyz789'"],
			"connect-src": ["'self'", "wss://example.com"],
		};

		const result = formatCSP(directives);
		assert.strictEqual(
			result,
			"script-src 'self' 'sha256-abc123' 'nonce-xyz789'; connect-src 'self' wss://example.com",
		);
	});

	it("should handle complex directive names", () => {
		const directives = {
			"child-src": ["'self'"],
			"frame-ancestors": ["'none'"],
			"report-uri": ["/csp-report"],
		};

		const result = formatCSP(directives);
		assert.strictEqual(
			result,
			"child-src 'self'; frame-ancestors 'none'; report-uri /csp-report",
		);
	});

	it("should maintain directive order", () => {
		const directives = {
			"default-src": ["'self'"],
			"script-src": ["'self'"],
			"style-src": ["'self'"],
			"img-src": ["'self'"],
		};

		const result = formatCSP(directives);
		const parts = result.split("; ");
		assert.strictEqual(parts[0], "default-src 'self'");
		assert.strictEqual(parts[1], "script-src 'self'");
		assert.strictEqual(parts[2], "style-src 'self'");
		assert.strictEqual(parts[3], "img-src 'self'");
	});
});

describe("formatPermissionsPolicy", () => {
	it("should format basic permissions correctly", () => {
		const permissions = {
			geolocation: [],
			microphone: ["'self'"],
			camera: ["'self'", "https://example.com"],
		};

		const result = formatPermissionsPolicy(permissions);
		assert.strictEqual(
			result,
			'geolocation=(), microphone=("\'self\'"), camera=("\'self\'" "https://example.com")',
		);
	});

	it("should handle empty permissions object", () => {
		const result = formatPermissionsPolicy({});
		assert.strictEqual(result, "");
	});

	it("should handle permissions with no allowlist", () => {
		const permissions = {
			geolocation: [],
			microphone: [],
			camera: [],
		};

		const result = formatPermissionsPolicy(permissions);
		assert.strictEqual(result, "geolocation=(), microphone=(), camera=()");
	});

	it("should handle single origin permissions", () => {
		const permissions = {
			geolocation: ["'self'"],
		};

		const result = formatPermissionsPolicy(permissions);
		assert.strictEqual(result, "geolocation=(\"'self'\")");
	});

	it("should handle complex permission names", () => {
		const permissions = {
			accelerometer: [],
			"ambient-light-sensor": ["'self'"],
			payment: ["'self'", "https://pay.example.com"],
		};

		const result = formatPermissionsPolicy(permissions);
		assert.strictEqual(
			result,
			'accelerometer=(), ambient-light-sensor=("\'self\'"), payment=("\'self\'" "https://pay.example.com")',
		);
	});

	it("should ignore non-array values", () => {
		const permissions = {
			geolocation: [],
			microphone: "'self'", // String instead of array
			camera: null, // Null value
			bluetooth: undefined, // Undefined value
		};

		const result = formatPermissionsPolicy(permissions);
		assert.strictEqual(result, "geolocation=()");
	});

	it("should handle special characters in origins", () => {
		const permissions = {
			microphone: ["'self'", "https://sub.example.com:8080", "*.example.com"],
		};

		const result = formatPermissionsPolicy(permissions);
		assert.strictEqual(
			result,
			'microphone=("\'self\'" "https://sub.example.com:8080" "*.example.com")',
		);
	});
});

describe("setSecurityHeaders", () => {
	const createMockContext = (existingHeaders = {}) => ({
		responseEnded: false,
		responseHeaders: new Map(Object.entries(existingHeaders)),
	});

	it("should set all security headers when none exist", () => {
		const ctx = createMockContext();
		const config = {
			frameOptions: "SAMEORIGIN",
			noSniff: true,
			xssProtection: true,
			referrerPolicy: "strict-origin",
			crossOriginEmbedderPolicy: "require-corp",
			crossOriginOpenerPolicy: "same-origin",
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(
			ctx.responseHeaders.get("x-frame-options"),
			"SAMEORIGIN",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("x-content-type-options"),
			"nosniff",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("x-xss-protection"),
			"1; mode=block",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("referrer-policy"),
			"strict-origin",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cross-origin-embedder-policy"),
			"require-corp",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cross-origin-opener-policy"),
			"same-origin",
		);
	});

	it("should set CSP header correctly", () => {
		const ctx = createMockContext();
		const config = {
			contentSecurityPolicy: {
				"default-src": ["'self'"],
				"script-src": ["'self'", "'unsafe-inline'"],
			},
			contentSecurityPolicyReportOnly: false,
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(
			ctx.responseHeaders.get("content-security-policy"),
			"default-src 'self'; script-src 'self' 'unsafe-inline'",
		);
	});

	it("should set CSP report-only header when reportOnly is true", () => {
		const ctx = createMockContext();
		const config = {
			contentSecurityPolicy: {
				"default-src": ["'self'"],
			},
			contentSecurityPolicyReportOnly: true,
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(
			ctx.responseHeaders.get("content-security-policy-report-only"),
			"default-src 'self'",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("content-security-policy"),
			undefined,
		);
	});

	it("should set HSTS header with all options", () => {
		const ctx = createMockContext();
		const config = {
			httpStrictTransportSecurity: {
				maxAge: 86400,
				includeSubDomains: true,
				preload: true,
			},
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(
			ctx.responseHeaders.get("strict-transport-security"),
			"max-age=86400; includeSubDomains; preload",
		);
	});

	it("should set HSTS header with minimal options", () => {
		const ctx = createMockContext();
		const config = {
			httpStrictTransportSecurity: {
				maxAge: 3600,
				includeSubDomains: false,
				preload: false,
			},
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(
			ctx.responseHeaders.get("strict-transport-security"),
			"max-age=3600",
		);
	});

	it("should set Permissions Policy header", () => {
		const ctx = createMockContext();
		const config = {
			permissionsPolicy: {
				geolocation: [],
				microphone: ["'self'"],
				camera: ["'self'", "https://example.com"],
			},
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(
			ctx.responseHeaders.get("permissions-policy"),
			'geolocation=(), microphone=("\'self\'"), camera=("\'self\'" "https://example.com")',
		);
	});

	it("should not set Permissions Policy header when result is empty", () => {
		const ctx = createMockContext();
		const config = {
			permissionsPolicy: {},
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(
			ctx.responseHeaders.get("permissions-policy"),
			undefined,
		);
	});

	it("should respect existing headers and not overwrite them", () => {
		const ctx = createMockContext({
			"x-frame-options": "ALLOW-FROM https://example.com",
			"content-security-policy": "default-src 'none'",
		});
		const config = {
			frameOptions: "DENY",
			contentSecurityPolicy: {
				"default-src": ["'self'"],
			},
			contentSecurityPolicyReportOnly: false,
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		// Should not overwrite existing headers
		assert.strictEqual(
			ctx.responseHeaders.get("x-frame-options"),
			"ALLOW-FROM https://example.com",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("content-security-policy"),
			"default-src 'none'",
		);
	});

	it("should not set headers when response has ended", () => {
		const ctx = createMockContext();
		ctx.responseEnded = true;
		const config = {
			frameOptions: "DENY",
			noSniff: true,
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(ctx.responseHeaders.size, 0);
	});

	it("should handle header setting errors gracefully", () => {
		const ctx = {
			responseEnded: false,
			responseHeaders: {
				has: () => false,
				set: () => {
					throw new Error("Header setting failed");
				},
			},
		};
		const config = {
			frameOptions: "DENY",
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].name, "SecurityHeaderError");
		assert.ok(errors[0].message.includes("Security header setting failed"));
		assert.ok(errors[0].originalError instanceof Error);
	});

	it("should handle partial header setting errors", () => {
		const ctx = {
			responseEnded: false,
			responseHeaders: {
				has: () => false,
				set: (name) => {
					if (name === "x-frame-options") {
						throw new Error("Frame options failed");
					}
				},
			},
		};
		const config = {
			frameOptions: "DENY",
			noSniff: true,
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].name, "SecurityHeaderError");
	});

	it("should not set headers for false/null/undefined values", () => {
		const ctx = createMockContext();
		const config = {
			frameOptions: null,
			noSniff: false,
			xssProtection: undefined,
			httpStrictTransportSecurity: null,
			referrerPolicy: "",
			permissionsPolicy: null,
			contentSecurityPolicy: false,
		};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(ctx.responseHeaders.size, 0);
	});

	it("should handle missing config properties gracefully", () => {
		const ctx = createMockContext();
		const config = {};

		const errors = setSecurityHeaders(ctx, config);

		assert.strictEqual(errors.length, 0);
		assert.strictEqual(ctx.responseHeaders.size, 0);
	});
});

describe("DEFAULT_CSP_DIRECTIVES", () => {
	it("should have correct default values", () => {
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["default-src"], ["'self'"]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["script-src"], ["'self'"]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["style-src"], [
			"'self'",
			"'unsafe-inline'",
		]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["img-src"], [
			"'self'",
			"data:",
			"https:",
		]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["font-src"], ["'self'"]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["connect-src"], ["'self'"]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["frame-src"], ["'none'"]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["object-src"], ["'none'"]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["base-uri"], ["'self'"]);
		assert.deepStrictEqual(DEFAULT_CSP_DIRECTIVES["form-action"], ["'self'"]);
	});

	it("should be a complete CSP configuration", () => {
		const cspString = formatCSP(DEFAULT_CSP_DIRECTIVES);
		assert.ok(cspString.includes("default-src"));
		assert.ok(cspString.includes("script-src"));
		assert.ok(cspString.includes("style-src"));
		assert.ok(cspString.includes("img-src"));
		assert.ok(cspString.includes("font-src"));
		assert.ok(cspString.includes("connect-src"));
		assert.ok(cspString.includes("frame-src"));
		assert.ok(cspString.includes("object-src"));
		assert.ok(cspString.includes("base-uri"));
		assert.ok(cspString.includes("form-action"));
	});
});

describe("DEFAULT_HEADERS", () => {
	it("should have correct structure and values", () => {
		assert.ok(DEFAULT_HEADERS.contentSecurityPolicy);
		assert.strictEqual(DEFAULT_HEADERS.contentSecurityPolicyReportOnly, false);
		assert.deepStrictEqual(
			DEFAULT_HEADERS.contentSecurityPolicy,
			DEFAULT_CSP_DIRECTIVES,
		);

		assert.strictEqual(DEFAULT_HEADERS.frameOptions, "DENY");
		assert.strictEqual(DEFAULT_HEADERS.noSniff, true);
		assert.strictEqual(DEFAULT_HEADERS.xssProtection, true);
		assert.strictEqual(
			DEFAULT_HEADERS.referrerPolicy,
			"strict-origin-when-cross-origin",
		);
		assert.strictEqual(
			DEFAULT_HEADERS.crossOriginEmbedderPolicy,
			"require-corp",
		);
		assert.strictEqual(DEFAULT_HEADERS.crossOriginOpenerPolicy, "same-origin");

		assert.ok(DEFAULT_HEADERS.httpStrictTransportSecurity);
		assert.strictEqual(
			DEFAULT_HEADERS.httpStrictTransportSecurity.maxAge,
			31536000,
		);
		assert.strictEqual(
			DEFAULT_HEADERS.httpStrictTransportSecurity.includeSubDomains,
			true,
		);
		assert.strictEqual(
			DEFAULT_HEADERS.httpStrictTransportSecurity.preload,
			false,
		);

		assert.ok(DEFAULT_HEADERS.permissionsPolicy);
		assert.deepStrictEqual(DEFAULT_HEADERS.permissionsPolicy.geolocation, []);
		assert.deepStrictEqual(DEFAULT_HEADERS.permissionsPolicy.microphone, []);
		assert.deepStrictEqual(DEFAULT_HEADERS.permissionsPolicy.camera, []);
	});

	it("should work with setSecurityHeaders function", () => {
		const ctx = createMockContext();
		const errors = setSecurityHeaders(ctx, DEFAULT_HEADERS);

		assert.strictEqual(errors.length, 0);
		assert.ok(ctx.responseHeaders.size > 0);
	});

	describe("Branch Coverage Edge Cases", () => {
		it("should handle CSP with string directive sources", () => {
			const directives = {
				"default-src": "'self'", // String instead of array
				"script-src": ["'self'", "'unsafe-inline'"], // Array
			};

			const result = formatCSP(directives);
			assert.ok(result.includes("default-src 'self'"));
			assert.ok(result.includes("script-src 'self' 'unsafe-inline'"));
		});

		it("should handle HSTS without optional flags", () => {
			const ctx = createMockContext();
			const config = {
				httpStrictTransportSecurity: {
					maxAge: 86400,
					// No includeSubDomains or preload
				},
			};

			const errors = setSecurityHeaders(ctx, config);
			assert.strictEqual(errors.length, 0);
			assert.strictEqual(
				ctx.responseHeaders.get("strict-transport-security"),
				"max-age=86400",
			);
		});

		it("should handle HSTS with all optional flags", () => {
			const ctx = createMockContext();
			const config = {
				httpStrictTransportSecurity: {
					maxAge: 31536000,
					includeSubDomains: true,
					preload: true,
				},
			};

			const errors = setSecurityHeaders(ctx, config);
			assert.strictEqual(errors.length, 0);
			assert.strictEqual(
				ctx.responseHeaders.get("strict-transport-security"),
				"max-age=31536000; includeSubDomains; preload",
			);
		});

		it("should handle Permissions Policy with empty allowlists", () => {
			const permissions = {
				geolocation: [], // Empty array
				microphone: ["self"], // Non-empty array
			};

			const result = formatPermissionsPolicy(permissions);
			assert.ok(result.includes("geolocation=()"));
			assert.ok(result.includes('microphone=("self")'));
		});

		it("should skip Permissions Policy when result is empty", () => {
			const ctx = createMockContext();
			const config = {
				permissionsPolicy: {}, // Empty object
			};

			const errors = setSecurityHeaders(ctx, config);
			assert.strictEqual(errors.length, 0);
			assert.strictEqual(
				ctx.responseHeaders.get("permissions-policy"),
				undefined,
			);
		});

		it("should handle CSP report-only mode", () => {
			const ctx = createMockContext();
			const config = {
				contentSecurityPolicy: {
					"default-src": ["'self'"],
				},
				contentSecurityPolicyReportOnly: true,
			};

			const errors = setSecurityHeaders(ctx, config);
			assert.strictEqual(errors.length, 0);
			assert.ok(ctx.responseHeaders.has("content-security-policy-report-only"));
			assert.ok(!ctx.responseHeaders.has("content-security-policy"));
		});
	});
});

// Helper function for tests
function createMockContext(existingHeaders = {}) {
	return {
		responseEnded: false,
		responseHeaders: new Map(Object.entries(existingHeaders)),
	};
}
