/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive test suite for path security utilities.
 *
 * Tests all security functions with 100% branch coverage including:
 * - Normal operation scenarios
 * - Edge cases and malformed inputs
 * - Security attack vectors
 * - Performance characteristics
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import {
	getFileExtension,
	isValidJSExtension,
	normalizePath,
	preventTraversal,
	sanitizePath,
	validatePath,
} from "./path-security.js";

// normalizePath tests
test("normalizePath - basic normalization", () => {
	strictEqual(
		normalizePath("/node_modules/lodash/index.js"),
		"/node_modules/lodash/index.js",
	);
	strictEqual(normalizePath("./lib/utils.js"), "lib/utils.js");
	strictEqual(normalizePath("lib/utils.js"), "lib/utils.js");
	strictEqual(normalizePath("/"), "/");
});

test("normalizePath - multiple slashes", () => {
	strictEqual(
		normalizePath("/node_modules//lodash/index.js"),
		"/node_modules/lodash/index.js",
	);
	strictEqual(normalizePath("///multiple///slashes"), "/multiple/slashes");
	strictEqual(normalizePath("./lib///utils.js"), "lib/utils.js");
	strictEqual(normalizePath("//leading//slashes"), "/leading/slashes");
});

test("normalizePath - backslash conversion", () => {
	strictEqual(normalizePath("lib\\utils.js"), "lib/utils.js");
	strictEqual(normalizePath("C:\\Windows\\System32"), "C:/Windows/System32");
	strictEqual(normalizePath("mixed/\\slashes\\types"), "mixed/slashes/types");
});

test("normalizePath - relative path resolution", () => {
	strictEqual(normalizePath("./lib/utils.js"), "lib/utils.js");
	strictEqual(normalizePath("lib/./utils.js"), "lib/utils.js");
	strictEqual(normalizePath("./lib/./utils.js"), "lib/utils.js");
	strictEqual(normalizePath("."), "");
	strictEqual(normalizePath("./"), "");
});

test("normalizePath - parent directory resolution", () => {
	strictEqual(normalizePath("lib/../index.js"), "index.js");
	strictEqual(normalizePath("../shared/utils.js"), "../shared/utils.js");
	strictEqual(normalizePath("../../shared/utils.js"), "../../shared/utils.js");
	strictEqual(normalizePath("lib/sub/../index.js"), "lib/index.js");
});

test("normalizePath - absolute path parent resolution", () => {
	strictEqual(normalizePath("/lib/../index.js"), "/index.js");
	strictEqual(normalizePath("/node_modules/../package.json"), "/package.json");
	strictEqual(normalizePath("/../../etc/passwd"), "/");
	strictEqual(normalizePath("/../root"), "/");
});

test("normalizePath - complex scenarios", () => {
	strictEqual(normalizePath("./lib/../src/./index.js"), "src/index.js");
	strictEqual(
		normalizePath("/node_modules/./lodash/../underscore/index.js"),
		"/node_modules/underscore/index.js",
	);
	strictEqual(
		normalizePath("../../../shared/../../utils.js"),
		"../../../../utils.js",
	);
});

test("normalizePath - edge cases", () => {
	strictEqual(normalizePath(""), "");
	strictEqual(normalizePath(null), "");
	strictEqual(normalizePath(undefined), "");
	strictEqual(normalizePath(123), "");
	strictEqual(normalizePath(".."), "..");
	strictEqual(normalizePath("../"), "..");
});

// validatePath tests
test("validatePath - valid paths", () => {
	strictEqual(validatePath("/node_modules/lodash/index.js"), true);
	strictEqual(validatePath("lib/utils.js"), true);
	strictEqual(validatePath("../shared/utils.js"), true);
	strictEqual(validatePath("/package.json"), true);
	strictEqual(validatePath("simple-file.js"), true);
});

test("validatePath - null byte attacks", () => {
	strictEqual(validatePath("/etc/passwd\x00.txt"), false);
	strictEqual(validatePath("file\x00name.js"), false);
	strictEqual(validatePath("\x00malicious"), false);
	strictEqual(validatePath("path/with\x00null.js"), false);
});

test("validatePath - control character attacks", () => {
	strictEqual(validatePath("file\x01name.js"), false);
	strictEqual(validatePath("path\x0a.js"), false);
	strictEqual(validatePath("file\x7f.js"), false);
	strictEqual(validatePath("tab\x09file.js"), false);
});

test("validatePath - directory traversal patterns", () => {
	strictEqual(validatePath("../../../etc/passwd"), false);
	strictEqual(validatePath("path/../../../secrets"), false);
	strictEqual(validatePath("file..name.js"), false);
	strictEqual(validatePath("..file.js"), false);
});

test("validatePath - suspicious protocols", () => {
	strictEqual(validatePath("//malicious.com/file.js"), false);
	strictEqual(validatePath("http://evil.com"), false);
	strictEqual(validatePath("/path://scheme"), false);
});

test("validatePath - suspicious patterns", () => {
	strictEqual(validatePath("///"), false);
	strictEqual(validatePath("///////"), false);
	strictEqual(validatePath("/./hidden/.file"), false);
	strictEqual(validatePath("file<script>.js"), false);
	strictEqual(validatePath("file>output.js"), false);
	strictEqual(validatePath("file|pipe.js"), false);
	strictEqual(validatePath("file?.js"), false);
	strictEqual(validatePath("file*.js"), false);
});

test("validatePath - invalid inputs", () => {
	strictEqual(validatePath(""), false);
	strictEqual(validatePath(null), false);
	strictEqual(validatePath(undefined), false);
	strictEqual(validatePath(123), false);
	strictEqual(validatePath({}), false);
});

// isValidJSExtension tests
test("isValidJSExtension - valid extensions", () => {
	strictEqual(isValidJSExtension("module.js"), true);
	strictEqual(isValidJSExtension("module.mjs"), true);
	strictEqual(isValidJSExtension("path/to/file.js"), true);
	strictEqual(isValidJSExtension("complex.path.file.mjs"), true);
});

test("isValidJSExtension - invalid extensions", () => {
	strictEqual(isValidJSExtension("config.json"), false);
	strictEqual(isValidJSExtension("script.php"), false);
	strictEqual(isValidJSExtension("style.css"), false);
	strictEqual(isValidJSExtension("template.html"), false);
	strictEqual(isValidJSExtension("data.xml"), false);
});

test("isValidJSExtension - no extension", () => {
	strictEqual(isValidJSExtension("filename"), false);
	strictEqual(isValidJSExtension("path/to/file"), false);
	strictEqual(isValidJSExtension("file."), false);
});

test("isValidJSExtension - hidden files and edge cases", () => {
	strictEqual(isValidJSExtension(".hidden"), false);
	strictEqual(isValidJSExtension(".hidden.js"), true);
	strictEqual(isValidJSExtension("file.backup.js"), true);
	strictEqual(isValidJSExtension("a.b.c.mjs"), true);
});

test("isValidJSExtension - invalid inputs", () => {
	strictEqual(isValidJSExtension(""), false);
	strictEqual(isValidJSExtension(null), false);
	strictEqual(isValidJSExtension(undefined), false);
	strictEqual(isValidJSExtension(123), false);
});

// preventTraversal tests
test("preventTraversal - valid absolute paths", () => {
	strictEqual(preventTraversal("/node_modules/lodash/index.js"), true);
	strictEqual(preventTraversal("/@workspace/package/file.js"), true);
	strictEqual(preventTraversal("/package.json"), true);
	strictEqual(preventTraversal("/"), true);
});

test("preventTraversal - valid relative paths within limits", () => {
	strictEqual(preventTraversal("../shared/utils.js", 5), true);
	strictEqual(preventTraversal("../../config/app.js", 5), true);
	strictEqual(preventTraversal("../../../lib/helper.js", 5), true);
	strictEqual(preventTraversal("file.js", 5), true);
	strictEqual(preventTraversal("lib/file.js", 5), true);
});

test("preventTraversal - excessive traversal depth", () => {
	strictEqual(preventTraversal("../../../../../etc/passwd", 3), false);
	strictEqual(preventTraversal("../../../../../../root", 5), false);
	strictEqual(preventTraversal("../../../../../../../evil", 2), false);
});

test("preventTraversal - custom depth limits", () => {
	strictEqual(preventTraversal("../file.js", 0), false);
	strictEqual(preventTraversal("../file.js", 1), true);
	strictEqual(preventTraversal("../../file.js", 1), false);
	strictEqual(preventTraversal("../../file.js", 2), true);
});

test("preventTraversal - invalid absolute paths", () => {
	strictEqual(preventTraversal("/etc/passwd"), false);
	strictEqual(preventTraversal("/usr/bin/node"), false);
	strictEqual(preventTraversal("/home/user/secrets"), false);
	strictEqual(preventTraversal("/var/log/app.log"), false);
});

test("preventTraversal - invalid inputs", () => {
	strictEqual(preventTraversal("", 5), false);
	strictEqual(preventTraversal(null, 5), false);
	strictEqual(preventTraversal("path", -1), false);
	strictEqual(preventTraversal("path", "invalid"), false);
	strictEqual(preventTraversal("path", 3.14), false);
});

// sanitizePath tests
test("sanitizePath - successful sanitization", () => {
	strictEqual(
		sanitizePath("/node_modules//lodash/index.js"),
		"/node_modules/lodash/index.js",
	);
	strictEqual(sanitizePath("../shared/utils.js"), "../shared/utils.js");
	strictEqual(sanitizePath("./lib/helper.js"), "lib/helper.js");
	strictEqual(
		sanitizePath("/@workspace/package/file.js"),
		"/@workspace/package/file.js",
	);
});

test("sanitizePath - failed sanitization returns null", () => {
	strictEqual(sanitizePath(""), null);
	strictEqual(sanitizePath(null), null);
	strictEqual(sanitizePath("../../../etc/passwd"), null);
	strictEqual(sanitizePath("file\x00.js"), null);
	strictEqual(sanitizePath("//malicious.com"), null);
});

test("sanitizePath - with JS extension requirement", () => {
	strictEqual(
		sanitizePath("module.js", { requireJSExtension: true }),
		"module.js",
	);
	strictEqual(
		sanitizePath("module.mjs", { requireJSExtension: true }),
		"module.mjs",
	);
	strictEqual(sanitizePath("config.json", { requireJSExtension: true }), null);
	strictEqual(sanitizePath("no-extension", { requireJSExtension: true }), null);
});

test("sanitizePath - with custom max depth", () => {
	strictEqual(sanitizePath("../file.js", { maxDepth: 0 }), null);
	strictEqual(sanitizePath("../file.js", { maxDepth: 1 }), "../file.js");
	strictEqual(sanitizePath("../../file.js", { maxDepth: 1 }), null);
	strictEqual(sanitizePath("../../file.js", { maxDepth: 2 }), "../../file.js");
});

test("sanitizePath - combined options", () => {
	strictEqual(
		sanitizePath("../shared/utils.js", {
			maxDepth: 2,
			requireJSExtension: true,
		}),
		"../shared/utils.js",
	);
	strictEqual(
		sanitizePath("../shared/config.json", {
			maxDepth: 2,
			requireJSExtension: true,
		}),
		null,
	);
	strictEqual(
		sanitizePath("../../../../file.js", {
			maxDepth: 2,
			requireJSExtension: true,
		}),
		null,
	);
});

// getFileExtension tests
test("getFileExtension - standard extensions", () => {
	strictEqual(getFileExtension("file.js"), ".js");
	strictEqual(getFileExtension("module.mjs"), ".mjs");
	strictEqual(getFileExtension("style.css"), ".css");
	strictEqual(getFileExtension("data.json"), ".json");
});

test("getFileExtension - complex filenames", () => {
	strictEqual(getFileExtension("complex.file.name.js"), ".js");
	strictEqual(getFileExtension("version.1.2.3.min.js"), ".js");
	strictEqual(getFileExtension("path/to/file.mjs"), ".mjs");
	strictEqual(getFileExtension("../relative/path.js"), ".js");
});

test("getFileExtension - no extension cases", () => {
	strictEqual(getFileExtension("filename"), "");
	strictEqual(getFileExtension("path/to/file"), "");
	strictEqual(getFileExtension("directory/"), "");
	strictEqual(getFileExtension("/usr/bin/node"), "");
});

test("getFileExtension - edge cases", () => {
	strictEqual(getFileExtension(".hidden"), "");
	strictEqual(getFileExtension(".hidden.js"), ".js");
	strictEqual(getFileExtension("file."), "");
	strictEqual(getFileExtension("path/.hidden"), "");
	strictEqual(getFileExtension("dir.name/file"), "");
	strictEqual(getFileExtension("dir.name/file.js"), ".js");
});

test("getFileExtension - invalid inputs", () => {
	strictEqual(getFileExtension(""), "");
	strictEqual(getFileExtension(null), "");
	strictEqual(getFileExtension(undefined), "");
	strictEqual(getFileExtension(123), "");
});

// Integration and security tests
test("security - comprehensive attack vector testing", () => {
	const attackVectors = [
		"../../../etc/passwd",
		"..\\..\\..\\windows\\system32\\config\\sam",
		"/etc/passwd\x00.txt",
		"file\x00injection.js",
		"//evil.com/malware.js",
		"http://attacker.com/payload",
		"<script>alert('xss')</script>.js",
		"file|pipe>output.js",
		"path/../../../secrets",
		".\\.\\..\\..\\windows",
		"\x01\x02\x03malicious.js",
		"file\nname.js",
		"file\rname.js",
		"file\tname.js",
	];

	for (const attack of attackVectors) {
		strictEqual(
			sanitizePath(attack),
			null,
			`Attack vector should be blocked: ${attack}`,
		);
	}
});

test("security - legitimate paths should pass", () => {
	const legitimatePaths = [
		"/node_modules/lodash/index.js",
		"/@workspace/shared/utils.js",
		"../shared/components/Button.js",
		"./lib/helper.mjs",
		"src/components/App.js",
		"/package.json",
		"README.md",
	];

	for (const path of legitimatePaths) {
		const result = sanitizePath(path);
		strictEqual(result !== null, true, `Legitimate path should pass: ${path}`);
	}
});

test("performance - normalization handles large inputs", () => {
	// Test with very long path to ensure no exponential behavior
	const longPath = "a/".repeat(1000) + "file.js";
	const normalized = normalizePath(longPath);
	strictEqual(normalized.endsWith("file.js"), true);
	strictEqual(normalized.split("/").length, 1001); // 1000 segments + file
});

test("performance - validation handles complex patterns", () => {
	// Test with patterns that could cause backtracking in naive implementations
	const complexPath = "a".repeat(100) + "/" + "b".repeat(100) + ".js";
	strictEqual(validatePath(complexPath), true);

	const complexPathWithNulls = "a".repeat(50) + "\x00" + "b".repeat(50);
	strictEqual(validatePath(complexPathWithNulls), false);
});
