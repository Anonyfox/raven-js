import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidScripts } from "./has-valid-scripts.js";

describe("HasValidScripts", () => {
	test("should return true for valid scripts configuration", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "valid-scripts-test-"));
		const packageJson = {
			name: "test-package",
			scripts: {
				"nest:validate": "some command",
				"nest:docs": "another command",
				test: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
				"test:code": "node --no-warnings --test --test-reporter=dot",
				"test:coverage":
					"node --no-warnings --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js'",
				"test:style": "biome check",
				"test:types": "tsc --noEmit --project jsconfig.json",
			},
		};
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			const result = HasValidScripts(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for missing scripts object", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-scripts-test-"));
		const packageJson = { name: "test-package" };
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidScripts(tempDir),
				/Scripts field must be an object/,
				"Should throw for missing scripts object",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid scripts type", () => {
		const invalidScriptsTypes = [null, "string", 123, [], true];

		invalidScriptsTypes.forEach((scripts) => {
			const tempDir = mkdtempSync(join(tmpdir(), "invalid-scripts-type-test-"));
			const packageJson = { name: "test-package", scripts };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidScripts(tempDir),
					/Scripts field must be an object|Script ".*" must be a non-empty string/,
					`Should throw for invalid scripts type: ${typeof scripts}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for missing required scripts", () => {
		const requiredScripts = [
			"nest:validate",
			"nest:docs",
			"test",
			"test:code",
			"test:coverage",
			"test:style",
			"test:types",
		];

		requiredScripts.forEach((missingScript) => {
			const tempDir = mkdtempSync(join(tmpdir(), "missing-script-test-"));
			const scripts = {
				"nest:validate": "command",
				"nest:docs": "command",
				test: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
				"test:code": "node --no-warnings --test --test-reporter=dot",
				"test:coverage":
					"node --no-warnings --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js'",
				"test:style": "command",
				"test:types": "tsc --noEmit --project jsconfig.json",
			};
			delete scripts[missingScript];

			const packageJson = { name: "test-package", scripts };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidScripts(tempDir),
					new RegExp(
						`Script "${missingScript.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}".*required|must be a non-empty string`,
					),
					`Should throw for missing script: ${missingScript}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for empty script values", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "empty-script-test-"));
		const packageJson = {
			name: "test-package",
			scripts: {
				"nest:validate": "",
				"nest:docs": "command",
				test: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
				"test:code": "node --no-warnings --test --test-reporter=dot",
				"test:coverage":
					"node --no-warnings --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js'",
				"test:style": "command",
				"test:types": "tsc --noEmit --project jsconfig.json",
			},
		};
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidScripts(tempDir),
				/Script "nest:validate" must be a non-empty string/,
				"Should throw for empty script value",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for incorrect exact script values", () => {
		const exactScripts = [
			{
				name: "test",
				expected:
					"npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
			},
			{ name: "test:types", expected: "tsc --noEmit --project jsconfig.json" },
		];

		exactScripts.forEach(({ name, expected }) => {
			const tempDir = mkdtempSync(join(tmpdir(), "wrong-script-value-test-"));
			const scripts = {
				"nest:validate": "command",
				"nest:docs": "command",
				test: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
				"test:code": "node --no-warnings --test --test-reporter=dot",
				"test:coverage":
					"node --no-warnings --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js'",
				"test:style": "command",
				"test:types": "tsc --noEmit --project jsconfig.json",
			};
			scripts[name] = "wrong value";

			const packageJson = { name: "test-package", scripts };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidScripts(tempDir),
					new RegExp(
						`Script "${name}" must be "${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
					),
					`Should throw for incorrect ${name} script value`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for test:code without dot reporter", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "test-code-no-dot-reporter-"));
		const packageJson = {
			name: "test-package",
			scripts: {
				"nest:validate": "some command",
				"nest:docs": "another command",
				test: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
				"test:code": "node --no-warnings --test",
				"test:coverage":
					"node --no-warnings --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js'",
				"test:style": "biome check",
				"test:types": "tsc --noEmit --project jsconfig.json",
			},
		};
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidScripts(tempDir),
				/Script "test:code" must use --test-reporter=dot/,
				"Should throw for test:code without dot reporter",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for test:code with coverage options", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "test-code-with-coverage-"));
		const packageJson = {
			name: "test-package",
			scripts: {
				"nest:validate": "some command",
				"nest:docs": "another command",
				test: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
				"test:code":
					"node --no-warnings --test --test-reporter=dot --experimental-test-coverage",
				"test:coverage":
					"node --no-warnings --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js'",
				"test:style": "biome check",
				"test:types": "tsc --noEmit --project jsconfig.json",
			},
		};
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidScripts(tempDir),
				/Script "test:code" must not include coverage options/,
				"Should throw for test:code with coverage options",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for test:coverage without coverage options", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "test-coverage-no-coverage-"));
		const packageJson = {
			name: "test-package",
			scripts: {
				"nest:validate": "some command",
				"nest:docs": "another command",
				test: "npm run nest:validate && npm run test:types && npm run test:style && npm run test:code",
				"test:code": "node --no-warnings --test --test-reporter=dot",
				"test:coverage": "node --no-warnings --test",
				"test:style": "biome check",
				"test:types": "tsc --noEmit --project jsconfig.json",
			},
		};
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidScripts(tempDir),
				/Script "test:coverage" must include --experimental-test-coverage/,
				"Should throw for test:coverage without coverage options",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle nest package correctly (no nest:validate/nest:docs required)", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nest-package-test-"));
		const packageJson = {
			name: "@raven-js/nest",
			scripts: {
				test: "npm run test:types && npm run test:style && npm run test:code",
				"test:code": "node --no-warnings --test --test-reporter=dot",
				"test:coverage":
					"node --no-warnings --test --experimental-test-coverage --test-coverage-exclude='**/*.test.js'",
				"test:style": "biome check",
				"test:types": "tsc --noEmit --project jsconfig.json",
			},
		};
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			const result = HasValidScripts(tempDir);
			assert.equal(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid input types", () => {
		const invalidInputs = [null, undefined, 123, {}, []];

		invalidInputs.forEach((input) => {
			assert.throws(
				() => HasValidScripts(input),
				/Package path must be a non-empty string/,
				`Should throw for invalid input: ${typeof input}`,
			);
		});
	});
});
