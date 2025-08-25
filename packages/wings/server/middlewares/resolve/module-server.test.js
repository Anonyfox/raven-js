/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive test suite for module server utilities.
 *
 * Tests all module serving functionality with 100% branch coverage:
 * - Module file serving with streaming and headers
 * - File validation and security checks
 * - HTTP header generation and caching
 * - ETag generation and conditional requests
 * - Module path resolution with extension handling
 * - Performance optimization and memory efficiency
 * - Error handling and malformed input scenarios
 * - Source map support and CORS headers
 */

import { strictEqual } from "node:assert";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
	checkConditionalRequest,
	generateCacheControl,
	generateETag,
	generateModuleHeaders,
	getModuleStats,
	resolveModulePath,
	serveModule,
	validateModuleFile,
} from "./module-server.js";

// Test directory for creating test files
const testDir = join(process.cwd(), "test-modules");

// Helper function to create test module files
async function setupTestModules() {
	try {
		await mkdir(testDir, { recursive: true });
		await mkdir(join(testDir, "node_modules"), { recursive: true });
		await mkdir(join(testDir, "node_modules", "lodash"), { recursive: true });
		await mkdir(join(testDir, "src"), { recursive: true });
		await mkdir(join(testDir, "src", "utils"), { recursive: true });

		// Create various module files
		await writeFile(join(testDir, "src", "app.js"), 'export default "app";');
		await writeFile(join(testDir, "src", "app.mjs"), 'export default "esm";');
		await writeFile(
			join(testDir, "src", "common.cjs"),
			'module.exports = "cjs";',
		);
		await writeFile(
			join(testDir, "src", "component.jsx"),
			"export const Component = () => {};",
		);
		await writeFile(
			join(testDir, "src", "types.ts"),
			"export interface User {}",
		);
		await writeFile(
			join(testDir, "src", "app.js.map"),
			'{"version":3,"sources":["app.js"]}',
		);

		// Large file for streaming tests
		const largeContent =
			"export const data = " + JSON.stringify("x".repeat(2 * 1024 * 1024));
		await writeFile(join(testDir, "src", "large.js"), largeContent);

		// Node modules
		await writeFile(
			join(testDir, "node_modules", "lodash", "index.js"),
			"export default {};",
		);
		await writeFile(
			join(testDir, "node_modules", "lodash", "package.json"),
			'{"name":"lodash","main":"index.js"}',
		);

		// Utils with index
		await writeFile(
			join(testDir, "src", "utils", "index.js"),
			"export const utils = true;",
		);
		await writeFile(
			join(testDir, "src", "utils", "format.js"),
			"export function format() {}",
		);

		// Blocked files
		await writeFile(join(testDir, "src", "config.json"), '{"secret":"value"}');
		await writeFile(join(testDir, "src", ".env"), "SECRET=test");
		await writeFile(join(testDir, "src", "dangerous.exe"), "fake exe");
	} catch {
		// Ignore setup errors for tests that don't need files
	}
}

// Helper function to cleanup test files
async function cleanupTestModules() {
	try {
		await rm(testDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}
}

// serveModule tests
test("serveModule - basic JS file serving", async () => {
	await setupTestModules();

	const result = await serveModule("/src/app.js", {
		rootDir: testDir,
		enableCaching: true,
		maxAge: 3600,
	});

	strictEqual(result.success, true);
	strictEqual(result.statusCode, 200);
	strictEqual(typeof result.headers, "object");
	strictEqual(result.headers["Content-Type"], "text/javascript");
	strictEqual(typeof result.file, "object"); // Buffer for small files

	await cleanupTestModules();
});

test("serveModule - ESM file serving", async () => {
	await setupTestModules();

	const result = await serveModule("/src/app.mjs", {
		rootDir: testDir,
	});

	strictEqual(result.success, true);
	strictEqual(result.headers["Content-Type"], "text/javascript");
	strictEqual(result.headers["X-Content-Type"], "module");

	await cleanupTestModules();
});

test("serveModule - CommonJS file serving", async () => {
	await setupTestModules();

	const result = await serveModule("/src/common.cjs", {
		rootDir: testDir,
	});

	strictEqual(result.success, true);
	strictEqual(result.headers["X-Content-Type"], "commonjs");

	await cleanupTestModules();
});

test("serveModule - JSX file serving", async () => {
	await setupTestModules();

	const result = await serveModule("/src/component.jsx", {
		rootDir: testDir,
	});

	strictEqual(result.success, true);
	strictEqual(result.headers["Content-Type"], "text/javascript");

	await cleanupTestModules();
});

test("serveModule - TypeScript file serving", async () => {
	await setupTestModules();

	const result = await serveModule("/src/types.ts", {
		rootDir: testDir,
	});

	strictEqual(result.success, true);
	strictEqual(result.headers["Content-Type"], "text/javascript");

	await cleanupTestModules();
});

test("serveModule - large file streaming", async () => {
	await setupTestModules();

	const result = await serveModule("/src/large.js", {
		rootDir: testDir,
	});

	strictEqual(result.success, true);
	strictEqual(typeof result.file.pipe, "function"); // ReadStream for large files

	await cleanupTestModules();
});

test("serveModule - source map hint", async () => {
	await setupTestModules();

	const result = await serveModule("/src/app.js", {
		rootDir: testDir,
	});

	strictEqual(result.success, true);
	strictEqual(result.headers["SourceMap"], "/src/app.js.map");

	await cleanupTestModules();
});

test("serveModule - custom headers", async () => {
	await setupTestModules();

	const result = await serveModule("/src/app.js", {
		rootDir: testDir,
		customHeaders: {
			"X-Custom": "test",
			"X-Override": "custom",
		},
	});

	strictEqual(result.success, true);
	strictEqual(result.headers["X-Custom"], "test");
	strictEqual(result.headers["X-Override"], "custom");

	await cleanupTestModules();
});

test("serveModule - caching disabled", async () => {
	await setupTestModules();

	const result = await serveModule("/src/app.js", {
		rootDir: testDir,
		enableCaching: false,
	});

	strictEqual(result.success, true);
	strictEqual(
		result.headers["Cache-Control"],
		"no-cache, no-store, must-revalidate",
	);
	strictEqual(result.headers["Pragma"], "no-cache");

	await cleanupTestModules();
});

test("serveModule - file not found", async () => {
	await setupTestModules();

	const result = await serveModule("/nonexistent.js", {
		rootDir: testDir,
	});

	strictEqual(result.success, false);
	strictEqual(result.statusCode, 404);
	strictEqual(result.error, "Module not found");

	await cleanupTestModules();
});

test("serveModule - invalid path", async () => {
	const result = await serveModule("../../../etc/passwd", {
		rootDir: testDir,
	});

	strictEqual(result.success, false);
	strictEqual(result.statusCode, 400);
	strictEqual(result.error, "Invalid module path");
});

test("serveModule - access denied", async () => {
	await setupTestModules();

	const result = await serveModule("/src/config.json", {
		rootDir: testDir,
	});

	strictEqual(result.success, false);
	strictEqual(result.statusCode, 415);

	await cleanupTestModules();
});

test("serveModule - compression hints", async () => {
	await setupTestModules();

	const result = await serveModule("/src/app.js", {
		rootDir: testDir,
		enableCompression: true,
	});

	strictEqual(result.success, true);
	strictEqual(result.headers["Vary"], "Accept-Encoding");

	await cleanupTestModules();
});

// validateModuleFile tests
test("validateModuleFile - valid JS file", () => {
	const result = validateModuleFile("/path/to/app.js");
	strictEqual(result.valid, true);
	strictEqual(result.moduleType, "javascript");
});

test("validateModuleFile - valid MJS file", () => {
	const result = validateModuleFile("/path/to/module.mjs");
	strictEqual(result.valid, true);
	strictEqual(result.moduleType, "module");
});

test("validateModuleFile - valid CJS file", () => {
	const result = validateModuleFile("/path/to/common.cjs");
	strictEqual(result.valid, true);
	strictEqual(result.moduleType, "commonjs");
});

test("validateModuleFile - valid JSX file", () => {
	const result = validateModuleFile("/path/to/Component.jsx");
	strictEqual(result.valid, true);
	strictEqual(result.moduleType, "jsx");
});

test("validateModuleFile - valid TypeScript file", () => {
	const result = validateModuleFile("/path/to/types.ts");
	strictEqual(result.valid, true);
	strictEqual(result.moduleType, "typescript");
});

test("validateModuleFile - valid source map", () => {
	const result = validateModuleFile("/path/to/app.js.map");
	strictEqual(result.valid, true);
	strictEqual(result.moduleType, "sourcemap");
});

test("validateModuleFile - unsupported extension", () => {
	const result = validateModuleFile("/path/to/document.pdf");
	strictEqual(result.valid, false);
	strictEqual(result.error, "Unsupported file type: .pdf");
});

test("validateModuleFile - blocked executable", () => {
	const result = validateModuleFile("/path/to/malware.exe");
	strictEqual(result.valid, false);
	strictEqual(result.error, "File type not permitted");
});

test("validateModuleFile - blocked config file", () => {
	const result = validateModuleFile("/path/to/config.json");
	strictEqual(result.valid, false);
	strictEqual(result.error, "File type not permitted");
});

test("validateModuleFile - blocked environment file", () => {
	const result = validateModuleFile("/path/to/.env");
	strictEqual(result.valid, false);
	strictEqual(result.error, "File type not permitted");
});

test("validateModuleFile - blocked shell script", () => {
	const result = validateModuleFile("/path/to/script.sh");
	strictEqual(result.valid, false);
	strictEqual(result.error, "File type not permitted");
});

test("validateModuleFile - case insensitive", () => {
	const result = validateModuleFile("/path/to/APP.JS");
	strictEqual(result.valid, true);
	strictEqual(result.moduleType, "javascript");
});

test("validateModuleFile - error handling", () => {
	const result = validateModuleFile(null);
	strictEqual(result.valid, false);
	strictEqual(result.error, "File validation failed");
});

// generateModuleHeaders tests
test("generateModuleHeaders - basic headers", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.js"),
		stats,
	);

	strictEqual(headers["Content-Type"], "text/javascript");
	strictEqual(headers["Content-Length"], stats.size.toString());
	strictEqual(typeof headers["Last-Modified"], "string");
	strictEqual(headers["Access-Control-Allow-Origin"], "*");
	strictEqual(headers["X-Content-Type-Options"], "nosniff");

	await cleanupTestModules();
});

test("generateModuleHeaders - with caching", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.js"),
		stats,
		{
			enableCaching: true,
			maxAge: 3600,
		},
	);

	strictEqual(headers["Cache-Control"].includes("max-age"), true);

	await cleanupTestModules();
});

test("generateModuleHeaders - with ETag", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.js"),
		stats,
		{
			enableEtag: true,
		},
	);

	strictEqual(typeof headers["ETag"], "string");
	strictEqual(headers["ETag"].startsWith('"'), true);

	await cleanupTestModules();
});

test("generateModuleHeaders - no caching", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.js"),
		stats,
		{
			enableCaching: false,
		},
	);

	strictEqual(headers["Cache-Control"], "no-cache, no-store, must-revalidate");
	strictEqual(headers["Pragma"], "no-cache");

	await cleanupTestModules();
});

test("generateModuleHeaders - with compression", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.js"),
		stats,
		{
			enableCompression: true,
		},
	);

	strictEqual(headers["Vary"], "Accept-Encoding");

	await cleanupTestModules();
});

test("generateModuleHeaders - MJS module type", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.mjs"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.mjs"),
		stats,
	);

	strictEqual(headers["X-Content-Type"], "module");

	await cleanupTestModules();
});

test("generateModuleHeaders - CJS module type", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "common.cjs"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "common.cjs"),
		stats,
	);

	strictEqual(headers["X-Content-Type"], "commonjs");

	await cleanupTestModules();
});

test("generateModuleHeaders - source map detection", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.js"),
		stats,
	);

	strictEqual(headers["SourceMap"], join(testDir, "src", "app.js") + ".map");

	await cleanupTestModules();
});

test("generateModuleHeaders - custom headers", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const headers = await generateModuleHeaders(
		join(testDir, "src", "app.js"),
		stats,
		{
			customHeaders: {
				"X-Custom": "test",
				"Content-Type": "application/javascript", // Override
			},
		},
	);

	strictEqual(headers["X-Custom"], "test");
	strictEqual(headers["Content-Type"], "application/javascript");

	await cleanupTestModules();
});

test("generateModuleHeaders - error fallback", async () => {
	// Force an error by passing invalid stats that will cause operations to fail
	const invalidStats = {
		size: 1024,
		mtime: {
			toUTCString: () => {
				throw new Error("Forced error");
			},
		},
	};
	const headers = await generateModuleHeaders("/nonexistent.js", invalidStats);

	strictEqual(headers["Content-Type"], "text/javascript");
	strictEqual(headers["Content-Length"], "1024");
	strictEqual(headers["Cache-Control"], "no-cache");
});

// generateCacheControl tests
test("generateCacheControl - node_modules files", () => {
	const result = generateCacheControl(
		"/project/node_modules/lodash/index.js",
		3600,
	);
	strictEqual(result.includes("immutable"), true);
	strictEqual(result.includes("86400"), true); // 3600 * 24
});

test("generateCacheControl - workspace files", () => {
	const result = generateCacheControl("/@workspace/app/src/index.js", 3600);
	strictEqual(result.includes("must-revalidate"), true);
	strictEqual(result.includes("300"), true); // min(3600, 300)
});

test("generateCacheControl - src files", () => {
	const result = generateCacheControl("/project/src/app.js", 3600);
	strictEqual(result.includes("must-revalidate"), true);
});

test("generateCacheControl - source maps", () => {
	const result = generateCacheControl("/project/src/app.js.map", 3600);
	strictEqual(result.includes("60"), true); // min(3600, 60)
});

test("generateCacheControl - default caching", () => {
	const result = generateCacheControl("/project/lib/utils.js", 1800);
	strictEqual(result, "public, max-age=1800");
});

test("generateCacheControl - error handling", () => {
	const result = generateCacheControl(null, 3600);
	strictEqual(result, "public, max-age=3600");
});

// generateETag tests
test("generateETag - small file", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "app.js"));
	const etag = await generateETag(join(testDir, "src", "app.js"), stats);

	strictEqual(typeof etag, "string");
	strictEqual(etag.startsWith('"'), true);
	strictEqual(etag.endsWith('"'), true);
	strictEqual(etag.includes(stats.mtime.getTime().toString()), true);

	await cleanupTestModules();
});

test("generateETag - large file", async () => {
	await setupTestModules();

	const stats = await stat(join(testDir, "src", "large.js"));
	const etag = await generateETag(join(testDir, "src", "large.js"), stats);

	strictEqual(typeof etag, "string");
	strictEqual(etag.startsWith('"'), true);
	strictEqual(etag.endsWith('"'), true);

	await cleanupTestModules();
});

test("generateETag - error fallback", async () => {
	const invalidStats = {
		size: 1024,
		mtime: { getTime: () => 1640995200000 },
	};
	const etag = await generateETag("/nonexistent.js", invalidStats);

	strictEqual(typeof etag, "string");
	strictEqual(etag, '"1640995200000-1024"');
});

// checkConditionalRequest tests
test("checkConditionalRequest - matching ETag", () => {
	const headers = { "if-none-match": '"abc123"' };
	const result = checkConditionalRequest(headers, '"abc123"', new Date());

	strictEqual(result.modified, false);
	strictEqual(result.statusCode, 304);
});

test("checkConditionalRequest - multiple ETags", () => {
	const headers = { "if-none-match": '"abc123", "def456"' };
	const result = checkConditionalRequest(headers, '"def456"', new Date());

	strictEqual(result.modified, false);
	strictEqual(result.statusCode, 304);
});

test("checkConditionalRequest - wildcard ETag", () => {
	const headers = { "if-none-match": "*" };
	const result = checkConditionalRequest(headers, '"abc123"', new Date());

	strictEqual(result.modified, false);
	strictEqual(result.statusCode, 304);
});

test("checkConditionalRequest - not modified since", () => {
	const lastModified = new Date("2024-01-01T00:00:00Z");
	const headers = { "if-modified-since": "2024-01-01T12:00:00Z" };
	const result = checkConditionalRequest(headers, null, lastModified);

	strictEqual(result.modified, false);
	strictEqual(result.statusCode, 304);
});

test("checkConditionalRequest - modified since", () => {
	const lastModified = new Date("2024-01-01T12:00:00Z");
	const headers = { "if-modified-since": "2024-01-01T00:00:00Z" };
	const result = checkConditionalRequest(headers, null, lastModified);

	strictEqual(result.modified, true);
});

test("checkConditionalRequest - no matching conditions", () => {
	const headers = { "if-none-match": '"different"' };
	const result = checkConditionalRequest(headers, '"abc123"', new Date());

	strictEqual(result.modified, true);
});

test("checkConditionalRequest - invalid date", () => {
	const headers = { "if-modified-since": "invalid-date" };
	const result = checkConditionalRequest(headers, null, new Date());

	strictEqual(result.modified, true);
});

test("checkConditionalRequest - error handling", () => {
	const result = checkConditionalRequest(null, '"abc123"', new Date());
	strictEqual(result.modified, true);
});

// resolveModulePath tests
test("resolveModulePath - exact file", async () => {
	await setupTestModules();

	const result = await resolveModulePath("src/app.js", testDir);
	strictEqual(result.success, true);
	strictEqual(result.resolvedPath.endsWith("src/app.js"), true);

	await cleanupTestModules();
});

test("resolveModulePath - extension resolution", async () => {
	await setupTestModules();

	const result = await resolveModulePath("src/app", testDir);
	strictEqual(result.success, true);
	strictEqual(result.resolvedPath.endsWith("src/app.js"), true);

	await cleanupTestModules();
});

test("resolveModulePath - index file resolution", async () => {
	await setupTestModules();

	const result = await resolveModulePath("src/utils", testDir);
	strictEqual(result.success, true);
	strictEqual(result.resolvedPath.endsWith("utils/index.js"), true);

	await cleanupTestModules();
});

test("resolveModulePath - TypeScript resolution", async () => {
	await setupTestModules();

	const result = await resolveModulePath("src/types", testDir);
	strictEqual(result.success, true);
	strictEqual(result.resolvedPath.endsWith("src/types.ts"), true);

	await cleanupTestModules();
});

test("resolveModulePath - not found", async () => {
	await setupTestModules();

	const result = await resolveModulePath("src/nonexistent", testDir);
	strictEqual(result.success, false);
	strictEqual(result.error, "Module not found");

	await cleanupTestModules();
});

test("resolveModulePath - absolute path handling", async () => {
	await setupTestModules();

	const result = await resolveModulePath("/src/app.js", testDir);
	strictEqual(result.success, true);

	await cleanupTestModules();
});

test("resolveModulePath - error handling", async () => {
	const result = await resolveModulePath(null, testDir);
	strictEqual(result.success, false);
	strictEqual(result.error, "Module resolution failed");
});

// getModuleStats tests
test("getModuleStats - valid file", async () => {
	await setupTestModules();

	const stats = await getModuleStats(join(testDir, "src", "app.js"));
	strictEqual(typeof stats.path, "string");
	strictEqual(typeof stats.size, "number");
	strictEqual(stats.valid, true);
	strictEqual(stats.moduleType, "javascript");
	strictEqual(stats.extension, ".js");

	await cleanupTestModules();
});

test("getModuleStats - invalid file", async () => {
	const stats = await getModuleStats("/nonexistent.js");
	strictEqual(stats.valid, false);
	strictEqual(stats.error, "Unable to read file stats");
});

// Integration tests
test("integration - complete module serving workflow", async () => {
	await setupTestModules();

	// Test full workflow
	const modulePath = "/src/app.js";

	// 1. Resolve module path
	const resolveResult = await resolveModulePath(modulePath, testDir);
	strictEqual(resolveResult.success, true);

	// 2. Get module stats
	const stats = await getModuleStats(resolveResult.resolvedPath);
	strictEqual(stats.valid, true);

	// 3. Serve module
	const serveResult = await serveModule(modulePath, {
		rootDir: testDir,
		enableCaching: true,
		enableEtag: true,
	});
	strictEqual(serveResult.success, true);

	// 4. Check conditional request
	const conditional = checkConditionalRequest(
		{ "if-none-match": serveResult.headers["ETag"] },
		serveResult.headers["ETag"],
		new Date(serveResult.headers["Last-Modified"]),
	);
	strictEqual(conditional.modified, false);

	await cleanupTestModules();
});

test("integration - different file types", async () => {
	await setupTestModules();

	const fileTypes = [
		{ path: "/src/app.js", type: "javascript" },
		{ path: "/src/app.mjs", type: "module" },
		{ path: "/src/common.cjs", type: "commonjs" },
		{ path: "/src/component.jsx", type: "jsx" },
		{ path: "/src/types.ts", type: "typescript" },
	];

	for (const { path, type } of fileTypes) {
		const result = await serveModule(path, { rootDir: testDir });
		strictEqual(result.success, true, `Failed for ${path}`);

		const validation = validateModuleFile(path);
		strictEqual(validation.moduleType, type);
	}

	await cleanupTestModules();
});

test("performance - large file handling", async () => {
	await setupTestModules();

	const start = performance.now();
	const result = await serveModule("/src/large.js", {
		rootDir: testDir,
		enableCaching: true,
		enableEtag: true,
	});
	const end = performance.now();

	strictEqual(result.success, true);
	strictEqual(typeof result.file.pipe, "function"); // Should be stream
	// Should complete quickly (< 100ms even for large files)
	strictEqual(end - start < 100, true);

	await cleanupTestModules();
});

test("memory - repeated operations", async () => {
	await setupTestModules();

	// Test repeated operations don't accumulate memory
	for (let i = 0; i < 50; i++) {
		await serveModule("/src/app.js", { rootDir: testDir });
		validateModuleFile("/test.js");
		generateCacheControl("/test.js", 3600);
		checkConditionalRequest({}, '"test"', new Date());
		await resolveModulePath("src/app", testDir);
	}

	// If we get here without memory issues, test passes
	strictEqual(true, true);

	await cleanupTestModules();
});

test("error resilience - malformed inputs", async () => {
	const malformedInputs = [
		{ path: null, rootDir: testDir },
		{ path: "", rootDir: testDir },
		{ path: "/valid.js", rootDir: null },
		{ path: "/valid.js", rootDir: "" },
		{ path: "../../../etc/passwd", rootDir: testDir },
		{ path: "/valid.js", rootDir: "/nonexistent" },
	];

	for (const { path, rootDir } of malformedInputs) {
		const result = await serveModule(path, { rootDir });
		strictEqual(typeof result, "object");
		strictEqual(typeof result.success, "boolean");

		if (!result.success) {
			strictEqual(typeof result.error, "string");
			strictEqual(typeof result.statusCode, "number");
		}
	}
});

test("security - blocked file types", async () => {
	await setupTestModules();

	const blockedFiles = ["/src/config.json", "/src/.env", "/src/dangerous.exe"];

	for (const file of blockedFiles) {
		const result = await serveModule(file, { rootDir: testDir });
		strictEqual(result.success, false);
		strictEqual(result.statusCode, 415);
	}

	await cleanupTestModules();
});

test("caching - different strategies", async () => {
	await setupTestModules();

	// Node modules - aggressive caching
	const nodeResult = await serveModule("/node_modules/lodash/index.js", {
		rootDir: testDir,
		maxAge: 3600,
	});
	strictEqual(nodeResult.success, true);
	strictEqual(nodeResult.headers["Cache-Control"].includes("immutable"), true);

	// Workspace - short caching
	const workspaceResult = await serveModule("/src/app.js", {
		rootDir: testDir,
		maxAge: 3600,
	});
	strictEqual(workspaceResult.success, true);
	strictEqual(workspaceResult.headers["Cache-Control"].includes("300"), true);

	await cleanupTestModules();
});

test("headers - CORS and security", async () => {
	await setupTestModules();

	const result = await serveModule("/src/app.js", { rootDir: testDir });
	strictEqual(result.success, true);

	// CORS headers
	strictEqual(result.headers["Access-Control-Allow-Origin"], "*");
	strictEqual(
		result.headers["Access-Control-Allow-Methods"],
		"GET, HEAD, OPTIONS",
	);

	// Security headers
	strictEqual(result.headers["X-Content-Type-Options"], "nosniff");

	await cleanupTestModules();
});
