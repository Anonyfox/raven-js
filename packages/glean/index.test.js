/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Glean main module - surgical validation of core functionality.
 */

import { strict as assert } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	getVersion,
	parseArguments,
	processCodebase,
	runExtractCommand,
	showBanner,
	showHelp,
} from "./index.js";

test("getVersion returns current version", () => {
	const version = getVersion();
	assert.equal(typeof version, "string");
	assert.equal(version, "0.1.0");
});

test("parseArguments handles flags and target", () => {
	// Basic parsing
	const args1 = parseArguments(["src/"]);
	assert.equal(args1.target, "src/");
	assert.equal(args1.verbose, false);

	// With verbose flag
	const args2 = parseArguments(["--verbose", "lib/"]);
	assert.equal(args2.target, "lib/");
	assert.equal(args2.verbose, true);

	// Short verbose flag
	const args3 = parseArguments(["-v"]);
	assert.equal(args3.target, ".");
	assert.equal(args3.verbose, true);

	// No arguments
	const args4 = parseArguments([]);
	assert.equal(args4.target, ".");
	assert.equal(args4.validate, true);
	assert.equal(args4.format, "html");
});

test("showBanner displays version information", () => {
	// Test that showBanner doesn't throw - output testing would require mocking console
	assert.doesNotThrow(() => showBanner());
});

test("showHelp displays usage information", () => {
	// Test that showHelp doesn't throw - output testing would require mocking console
	assert.doesNotThrow(() => showHelp());
});

test("processCodebase completes without errors", async () => {
	const options = {
		target: ".",
		format: "html",
		validate: true,
		verbose: false,
	};

	// Should complete without throwing
	await assert.doesNotReject(async () => {
		await processCodebase(options);
	});

	// Test verbose mode
	const verboseOptions = { ...options, verbose: true };
	await assert.doesNotReject(async () => {
		await processCodebase(verboseOptions);
	});
});

// Analyze command tests moved to lib/analyze.test.js

test("runExtractCommand extracts documentation graph", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create package.json
		await writeFile(
			join(tempDir, "package.json"),
			JSON.stringify({
				name: "test-extract",
				version: "1.0.0",
				description: "Test package for extraction",
			}),
		);

		// Create test JavaScript file
		const testFile = join(tempDir, "test.js");
		await writeFile(
			testFile,
			`
/**
 * Test function for extraction
 * @param {string} input - Input parameter
 * @returns {string} Processed output
 */
export function testFunc(input) {
	return input.toUpperCase();
}
		`,
		);

		// Create README
		await writeFile(join(tempDir, "README.md"), "# Test Extract Package");

		// Test basic extract command (output to stdout)
		await assert.doesNotReject(async () => {
			await runExtractCommand([tempDir]);
		});

		// Test verbose mode
		await assert.doesNotReject(async () => {
			await runExtractCommand([tempDir, "--verbose"]);
		});

		// Test with output file
		const outputFile = join(tempDir, "output.json");
		await assert.doesNotReject(async () => {
			await runExtractCommand([tempDir, "--output", outputFile]);
		});

		// Verify output file was created
		const { readFile } = await import("node:fs/promises");
		const outputContent = await readFile(outputFile, "utf-8");
		const graph = JSON.parse(outputContent);

		// Verify graph structure
		assert.ok(graph.__data.package);
		assert.equal(graph.__data.package.name, "test-extract");
		assert.ok(graph.__data.modules);
		assert.ok(graph.__data.entities);
		assert.ok(graph.__data.content);
	} finally {
		await rm(tempDir, { recursive: true });
	}
});

test("runExtractCommand handles extraction errors gracefully", async () => {
	// Test with inaccessible path - should throw informative error
	await assert.rejects(async () => {
		await runExtractCommand(["/nonexistent/deeply/nested/path"]);
	}, /Extraction failed/);
});

test("runExtractCommand parses arguments correctly", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		await writeFile(join(tempDir, "test.js"), "export function test() {}");

		// Test default target
		await assert.doesNotReject(async () => {
			await runExtractCommand(["--verbose"]);
		});

		// Test explicit target with flags
		await assert.doesNotReject(async () => {
			await runExtractCommand([tempDir, "--verbose"]);
		});

		// Test output flag variations
		const outputFile = join(tempDir, "test-output.json");
		await assert.doesNotReject(async () => {
			await runExtractCommand([tempDir, "-o", outputFile]);
		});
	} finally {
		await rm(tempDir, { recursive: true });
	}
});
