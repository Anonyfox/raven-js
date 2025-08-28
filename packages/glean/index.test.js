/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Glean main module (lib2-only) - surgical validation of core functionality.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
	discover,
	extract,
	generateStaticSite,
	getVersion,
	runServerCommand,
	runSsgCommand,
	runValidateCommand,
	showHelp,
	validate,
} from "./index.js";

test("getVersion returns current version", () => {
	const version = getVersion();
	assert.equal(typeof version, "string");
	assert.equal(version, "0.4.8");
});

test("showHelp displays usage information", () => {
	// Test that showHelp doesn't throw - output testing would require mocking console
	assert.doesNotThrow(() => showHelp());
});

test("lib2 functions are exported", () => {
	// Verify all lib2 core functions are exported
	assert.equal(typeof discover, "function");
	assert.equal(typeof extract, "function");
	assert.equal(typeof validate, "function");
	assert.equal(typeof generateStaticSite, "function");
});

test("CLI command functions are exported", () => {
	// Verify all CLI command functions are exported
	assert.equal(typeof runValidateCommand, "function");
	assert.equal(typeof runSsgCommand, "function");
	assert.equal(typeof runServerCommand, "function");
});

test("runValidateCommand validates arguments", async () => {
	// Test that missing source directory throws proper error for ssg command
	await assert.rejects(
		() => runSsgCommand([]),
		/Usage: glean ssg <source-dir> <output-dir>/,
	);

	// Test that missing output directory throws proper error for ssg command
	await assert.rejects(
		() => runSsgCommand(["./src"]),
		/Usage: glean ssg <source-dir> <output-dir>/,
	);
});

test("runServerCommand validates port argument", async () => {
	// Test invalid port handling
	await assert.rejects(
		() => runServerCommand(["--port", "invalid"]),
		/Port must be a valid number between 1 and 65535/,
	);

	await assert.rejects(
		() => runServerCommand(["--port", "0"]),
		/Port must be a valid number between 1 and 65535/,
	);

	await assert.rejects(
		() => runServerCommand(["--port", "99999"]),
		/Port must be a valid number between 1 and 65535/,
	);
});
