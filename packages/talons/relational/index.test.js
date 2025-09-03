/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for relational database module
 */

import { strictEqual, ok } from "node:assert";
import { describe, it } from "node:test";
import {
	connect,
	createCluster,
	createDiagnostics,
	createHealthChecker,
	createAnalyzer,
	createIntrospector,
	ERROR_CODES,
} from "./index.js";

describe("@raven-js/talons/relational", () => {
	it("exports connect function", () => {
		strictEqual(typeof connect, "function");
	});

	it("exports cluster utilities", () => {
		strictEqual(typeof createCluster, "function");
	});

	it("exports diagnostics utilities", () => {
		strictEqual(typeof createDiagnostics, "function");
		strictEqual(typeof createHealthChecker, "function");
		strictEqual(typeof createAnalyzer, "function");
	});

	it("exports introspection utilities", () => {
		strictEqual(typeof createIntrospector, "function");
	});

	it("exports error codes", () => {
		ok(ERROR_CODES);
		ok(ERROR_CODES.CONNECTION_FAILED);
		ok(ERROR_CODES.SYNTAX_ERROR);
		ok(ERROR_CODES.DUPLICATE_KEY);
	});
});
