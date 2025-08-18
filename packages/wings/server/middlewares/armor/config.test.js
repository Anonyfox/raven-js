/**
 * @fileoverview Tests for armor configuration management
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	ConfigValidationError,
	createConfig,
	DEFAULT_CONFIG,
	mergeConfig,
	validateConfig,
} from "./config.js";

describe("Armor Configuration", () => {
	describe("DEFAULT_CONFIG", () => {
		it("should have all required configuration sections", () => {
			assert.ok(DEFAULT_CONFIG);
			assert.strictEqual(typeof DEFAULT_CONFIG, "object");

			// Check main sections exist
			assert.ok("enabled" in DEFAULT_CONFIG);
			assert.ok("ipAccess" in DEFAULT_CONFIG);
			assert.ok("rateLimiting" in DEFAULT_CONFIG);
			assert.ok("requestValidation" in DEFAULT_CONFIG);
			assert.ok("attackDetection" in DEFAULT_CONFIG);
			assert.ok("securityHeaders" in DEFAULT_CONFIG);
		});

		it("should have sensible default values", () => {
			assert.strictEqual(DEFAULT_CONFIG.enabled, true);
			assert.strictEqual(DEFAULT_CONFIG.ipAccess.mode, "disabled");
			assert.strictEqual(DEFAULT_CONFIG.rateLimiting.enabled, false);
			assert.strictEqual(DEFAULT_CONFIG.requestValidation.enabled, true);
			assert.strictEqual(DEFAULT_CONFIG.attackDetection.sqlInjection, true);
			assert.strictEqual(DEFAULT_CONFIG.securityHeaders.enabled, true);
		});

		it("should have valid types for all configuration values", () => {
			assert.strictEqual(typeof DEFAULT_CONFIG.enabled, "boolean");
			assert.strictEqual(typeof DEFAULT_CONFIG.ipAccess, "object");
			assert.strictEqual(typeof DEFAULT_CONFIG.rateLimiting, "object");
			assert.strictEqual(typeof DEFAULT_CONFIG.requestValidation, "object");
			assert.strictEqual(typeof DEFAULT_CONFIG.attackDetection, "object");
			assert.strictEqual(typeof DEFAULT_CONFIG.securityHeaders, "object");
		});
	});

	describe("ConfigValidationError", () => {
		it("should create error with message and path", () => {
			const error = new ConfigValidationError("Test error", "test.path");
			assert.strictEqual(error.name, "ConfigValidationError");
			assert.strictEqual(error.message, "Test error");
			assert.strictEqual(error.path, "test.path");
			assert.ok(error instanceof Error);
		});

		it("should handle missing path", () => {
			const error = new ConfigValidationError("Test error");
			assert.strictEqual(error.message, "Test error");
			assert.strictEqual(error.path, undefined);
		});
	});

	describe("validateConfig", () => {
		describe("basic validation", () => {
			it("should accept valid configuration", () => {
				assert.doesNotThrow(() => {
					validateConfig(DEFAULT_CONFIG);
				});
			});

			it("should reject non-object configuration", () => {
				assert.throws(() => {
					validateConfig(null);
				}, ConfigValidationError);

				assert.throws(() => {
					validateConfig("not an object");
				}, ConfigValidationError);
			});

			it("should reject invalid enabled value", () => {
				assert.throws(() => {
					validateConfig({ enabled: "not a boolean" });
				}, ConfigValidationError);
			});
		});

		describe("IP access validation", () => {
			it("should accept valid IP access configuration", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						ipAccess: {
							mode: "whitelist",
							whitelist: ["192.168.1.1", "10.0.0.0/8"],
							blacklist: [],
							trustProxy: true,
						},
					});
				});
			});

			it("should reject invalid IP access mode", () => {
				assert.throws(() => {
					validateConfig({
						ipAccess: { mode: "invalid" },
					});
				}, ConfigValidationError);
			});

			it("should reject non-array whitelist", () => {
				assert.throws(() => {
					validateConfig({
						ipAccess: { whitelist: "not an array" },
					});
				}, ConfigValidationError);
			});

			it("should reject non-array blacklist", () => {
				assert.throws(() => {
					validateConfig({
						ipAccess: { blacklist: "not an array" },
					});
				}, ConfigValidationError);
			});

			it("should reject non-boolean trustProxy", () => {
				assert.throws(() => {
					validateConfig({
						ipAccess: { trustProxy: "not a boolean" },
					});
				}, ConfigValidationError);
			});

			it("should reject empty strings in IP lists", () => {
				assert.throws(() => {
					validateConfig({
						ipAccess: { whitelist: ["192.168.1.1", "", "10.0.0.1"] },
					});
				}, ConfigValidationError);
			});

			it("should reject non-strings in IP lists", () => {
				assert.throws(() => {
					validateConfig({
						ipAccess: { blacklist: ["192.168.1.1", 123, "10.0.0.1"] },
					});
				}, ConfigValidationError);
			});

			it("should reject non-object IP access config", () => {
				assert.throws(() => {
					validateConfig({
						ipAccess: "not an object",
					});
				}, ConfigValidationError);
			});
		});

		describe("rate limiting validation", () => {
			it("should accept valid rate limiting configuration", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						rateLimiting: {
							enabled: true,
							global: {
								windowMs: 60000,
								max: 100,
							},
							perRoute: new Map(),
							keyGenerator: () => "key",
						},
					});
				});
			});

			it("should reject non-boolean enabled", () => {
				assert.throws(() => {
					validateConfig({
						rateLimiting: { enabled: "not a boolean" },
					});
				}, ConfigValidationError);
			});

			it("should reject non-object global config", () => {
				assert.throws(() => {
					validateConfig({
						rateLimiting: { global: "not an object" },
					});
				}, ConfigValidationError);
			});

			it("should reject invalid windowMs", () => {
				assert.throws(() => {
					validateConfig({
						rateLimiting: { global: { windowMs: -1 } },
					});
				}, ConfigValidationError);

				assert.throws(() => {
					validateConfig({
						rateLimiting: { global: { windowMs: "not a number" } },
					});
				}, ConfigValidationError);
			});

			it("should reject invalid max", () => {
				assert.throws(() => {
					validateConfig({
						rateLimiting: { global: { max: -1 } },
					});
				}, ConfigValidationError);

				assert.throws(() => {
					validateConfig({
						rateLimiting: { global: { max: "not a number" } },
					});
				}, ConfigValidationError);
			});

			it("should accept zero max", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						rateLimiting: { global: { max: 0 } },
					});
				});
			});

			it("should reject invalid keyGenerator", () => {
				assert.throws(() => {
					validateConfig({
						rateLimiting: { keyGenerator: "not a function" },
					});
				}, ConfigValidationError);
			});

			it("should accept null keyGenerator", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						rateLimiting: { keyGenerator: null },
					});
				});
			});
		});

		describe("request validation", () => {
			it("should accept valid request validation configuration", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						requestValidation: {
							enabled: true,
							maxPathLength: 2048,
							maxQueryParams: 100,
							maxQueryParamLength: 1000,
							maxHeaders: 100,
							maxHeaderSize: 8192,
							maxBodySize: 1048576,
						},
					});
				});
			});

			it("should reject non-boolean enabled", () => {
				assert.throws(() => {
					validateConfig({
						requestValidation: { enabled: "not a boolean" },
					});
				}, ConfigValidationError);
			});

			it("should reject non-positive numeric values", () => {
				const fields = [
					"maxPathLength",
					"maxQueryParams",
					"maxQueryParamLength",
					"maxHeaders",
					"maxHeaderSize",
					"maxBodySize",
				];

				for (const field of fields) {
					assert.throws(() => {
						validateConfig({
							requestValidation: { [field]: 0 },
						});
					}, ConfigValidationError);

					assert.throws(() => {
						validateConfig({
							requestValidation: { [field]: -1 },
						});
					}, ConfigValidationError);

					assert.throws(() => {
						validateConfig({
							requestValidation: { [field]: "not a number" },
						});
					}, ConfigValidationError);
				}
			});
		});

		describe("attack detection validation", () => {
			it("should accept valid attack detection configuration", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						attackDetection: {
							enableSQLInjectionDetection: true,
							enableXSSDetection: false,
							enablePathTraversalDetection: true,
							enableSuspiciousPatternDetection: false,
						},
					});
				});
			});

			it("should reject non-boolean detection flags", () => {
				const flags = [
					"sqlInjection",
					"xss",
					"pathTraversal",
					"suspiciousPatterns",
				];

				for (const flag of flags) {
					assert.throws(() => {
						validateConfig({
							attackDetection: { [flag]: "not a boolean" },
						});
					}, ConfigValidationError);
				}
			});
		});

		describe("security headers validation", () => {
			it("should accept valid security headers configuration", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						securityHeaders: {
							enabled: true,
							contentSecurityPolicy: {
								"default-src": ["'self'"],
							},
							httpStrictTransportSecurity: {
								maxAge: 31536000,
								includeSubDomains: true,
								preload: false,
							},
						},
					});
				});
			});

			it("should reject non-boolean enabled", () => {
				assert.throws(() => {
					validateConfig({
						securityHeaders: { enabled: "not a boolean" },
					});
				}, ConfigValidationError);
			});

			it("should reject non-object CSP", () => {
				assert.throws(() => {
					validateConfig({
						securityHeaders: { contentSecurityPolicy: "not an object" },
					});
				}, ConfigValidationError);
			});

			it("should reject non-object HSTS", () => {
				assert.throws(() => {
					validateConfig({
						securityHeaders: { httpStrictTransportSecurity: "not an object" },
					});
				}, ConfigValidationError);
			});

			it("should reject invalid HSTS maxAge", () => {
				assert.throws(() => {
					validateConfig({
						securityHeaders: {
							httpStrictTransportSecurity: { maxAge: -1 },
						},
					});
				}, ConfigValidationError);

				assert.throws(() => {
					validateConfig({
						securityHeaders: {
							httpStrictTransportSecurity: { maxAge: "not a number" },
						},
					});
				}, ConfigValidationError);
			});

			it("should accept zero HSTS maxAge", () => {
				assert.doesNotThrow(() => {
					validateConfig({
						securityHeaders: {
							httpStrictTransportSecurity: { maxAge: 0 },
						},
					});
				});
			});

			it("should reject non-boolean HSTS flags", () => {
				assert.throws(() => {
					validateConfig({
						securityHeaders: {
							httpStrictTransportSecurity: {
								includeSubDomains: "not a boolean",
							},
						},
					});
				}, ConfigValidationError);

				assert.throws(() => {
					validateConfig({
						securityHeaders: {
							httpStrictTransportSecurity: { preload: "not a boolean" },
						},
					});
				}, ConfigValidationError);
			});
		});
	});

	describe("mergeConfig", () => {
		it("should merge two configuration objects", () => {
			const target = {
				enabled: true,
				ipAccess: {
					mode: "disabled",
					whitelist: [],
				},
				rateLimiting: {
					enabled: false,
				},
			};

			const source = {
				enabled: false,
				ipAccess: {
					mode: "whitelist",
					blacklist: ["192.168.1.1"],
				},
				attackDetection: {
					sqlInjection: true,
				},
			};

			const result = mergeConfig(target, source);

			assert.strictEqual(result.enabled, false);
			assert.strictEqual(result.ipAccess.mode, "whitelist");
			assert.deepStrictEqual(result.ipAccess.whitelist, []);
			assert.deepStrictEqual(result.ipAccess.blacklist, ["192.168.1.1"]);
			assert.strictEqual(result.rateLimiting.enabled, false);
			assert.strictEqual(result.attackDetection.sqlInjection, true);
		});

		it("should handle arrays without deep merging", () => {
			const target = {
				list: ["a", "b"],
			};

			const source = {
				list: ["c", "d"],
			};

			const result = mergeConfig(target, source);
			assert.deepStrictEqual(result.list, ["c", "d"]);
		});

		it("should handle Maps without deep merging", () => {
			const target = {
				map: new Map([["key1", "value1"]]),
			};

			const source = {
				map: new Map([["key2", "value2"]]),
			};

			const result = mergeConfig(target, source);
			assert.strictEqual(result.map.get("key2"), "value2");
			assert.strictEqual(result.map.get("key1"), undefined);
		});

		it("should skip undefined values", () => {
			const target = {
				enabled: true,
				value: "original",
			};

			const source = {
				enabled: false,
				value: undefined,
				newValue: undefined,
			};

			const result = mergeConfig(target, source);
			assert.strictEqual(result.enabled, false);
			assert.strictEqual(result.value, "original");
			assert.strictEqual("newValue" in result, false);
		});

		it("should handle null values", () => {
			const target = {
				value: "original",
			};

			const source = {
				value: null,
			};

			const result = mergeConfig(target, source);
			assert.strictEqual(result.value, null);
		});

		it("should not mutate original objects", () => {
			const target = {
				ipAccess: {
					mode: "disabled",
				},
			};

			const source = {
				ipAccess: {
					mode: "whitelist",
				},
			};

			const originalTargetMode = target.ipAccess.mode;
			const result = mergeConfig(target, source);

			assert.strictEqual(target.ipAccess.mode, originalTargetMode);
			assert.strictEqual(result.ipAccess.mode, "whitelist");
		});
	});

	describe("createConfig", () => {
		it("should create config with defaults when no user config provided", () => {
			const config = createConfig();
			assert.strictEqual(config.enabled, DEFAULT_CONFIG.enabled);
			assert.strictEqual(config.ipAccess.mode, DEFAULT_CONFIG.ipAccess.mode);
		});

		it("should merge user config with defaults", () => {
			const userConfig = {
				enabled: false,
				ipAccess: {
					mode: "whitelist",
					whitelist: ["192.168.1.1"],
				},
			};

			const config = createConfig(userConfig);
			assert.strictEqual(config.enabled, false);
			assert.strictEqual(config.ipAccess.mode, "whitelist");
			assert.deepStrictEqual(config.ipAccess.whitelist, ["192.168.1.1"]);
			// Should keep defaults for other values
			assert.strictEqual(
				config.rateLimiting.enabled,
				DEFAULT_CONFIG.rateLimiting.enabled,
			);
		});

		it("should validate user config before merging", () => {
			assert.throws(() => {
				createConfig({ enabled: "not a boolean" });
			}, ConfigValidationError);
		});

		it("should validate final merged config", () => {
			// This test ensures validation happens on the final result
			const config = createConfig({
				ipAccess: {
					mode: "whitelist",
				},
			});

			// Should not throw - the merged config should be valid
			assert.ok(config);
		});

		it("should handle empty user config", () => {
			const config = createConfig({});
			assert.deepStrictEqual(config, DEFAULT_CONFIG);
		});

		it("should handle partial configuration sections", () => {
			const userConfig = {
				rateLimiting: {
					enabled: true,
					// global settings not provided - should use defaults
				},
			};

			const config = createConfig(userConfig);
			assert.strictEqual(config.rateLimiting.enabled, true);
			assert.strictEqual(
				config.rateLimiting.global.windowMs,
				DEFAULT_CONFIG.rateLimiting.global.windowMs,
			);
		});

		it("should throw descriptive errors with paths", () => {
			try {
				createConfig({
					ipAccess: {
						mode: "invalid",
					},
				});
				assert.fail("Should have thrown");
			} catch (error) {
				assert.ok(error instanceof ConfigValidationError);
				assert.ok(error.path.includes("ipAccess"));
				assert.ok(error.path.includes("mode"));
			}
		});
	});

	describe("edge cases", () => {
		it("should handle deeply nested configuration", () => {
			const userConfig = {
				securityHeaders: {
					httpStrictTransportSecurity: {
						maxAge: 86400,
					},
				},
			};

			const config = createConfig(userConfig);
			assert.strictEqual(
				config.securityHeaders.httpStrictTransportSecurity.maxAge,
				86400,
			);
			assert.strictEqual(
				config.securityHeaders.httpStrictTransportSecurity.includeSubDomains,
				DEFAULT_CONFIG.securityHeaders.httpStrictTransportSecurity
					.includeSubDomains,
			);
		});

		it("should handle function values correctly", () => {
			const keyGenerator = () => "custom-key";
			const userConfig = {
				rateLimiting: {
					keyGenerator,
				},
			};

			const config = createConfig(userConfig);
			assert.strictEqual(config.rateLimiting.keyGenerator, keyGenerator);
		});

		it("should handle very large configuration objects", () => {
			const largeConfig = {
				securityHeaders: {
					contentSecurityPolicy: {},
				},
			};

			// Add many CSP directives
			for (let i = 0; i < 100; i++) {
				largeConfig.securityHeaders.contentSecurityPolicy[`directive-${i}`] = [
					`value-${i}`,
				];
			}

			assert.doesNotThrow(() => {
				createConfig(largeConfig);
			});
		});

		it("should maintain reference equality for unchanged nested objects", () => {
			const config = createConfig({
				enabled: false, // Only change top-level
			});

			// These should be the same object references since they weren't modified
			assert.strictEqual(config.ipAccess, DEFAULT_CONFIG.ipAccess);
		});
	});
});
