/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for metrics collection
 */

import { ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	createConsoleCollector,
	recordConnection,
	recordError,
	recordQuery,
	setMetricsCollector,
} from "./metrics.js";

describe("metrics recording", () => {
	it("records query metrics", () => {
		let recorded = null;
		setMetricsCollector({
			recordQuery: (...args) => {
				recorded = args;
			},
		});

		recordQuery("SELECT 1", 100, 1, "pg", "query");

		ok(recorded);
		strictEqual(recorded[0], "SELECT 1");
		strictEqual(recorded[1], 100);
		strictEqual(recorded[2], 1);
		strictEqual(recorded[3], "pg");
		strictEqual(recorded[4], "query");
	});

	it("records connection metrics", () => {
		let recorded = null;
		setMetricsCollector({
			recordConnection: (...args) => {
				recorded = args;
			},
		});

		recordConnection("create", "pg", "localhost", 50, true);

		ok(recorded);
		strictEqual(recorded[0], "create");
		strictEqual(recorded[1], "pg");
		strictEqual(recorded[2], "localhost");
		strictEqual(recorded[3], 50);
		strictEqual(recorded[4], true);
	});

	it("records error metrics", () => {
		let recorded = null;
		setMetricsCollector({
			recordError: (...args) => {
				recorded = args;
			},
		});

		const error = new Error("Test error");
		recordError(error, "pg", "query");

		ok(recorded);
		strictEqual(recorded[0], error);
		strictEqual(recorded[1], "pg");
		strictEqual(recorded[2], "query");
	});

	it("handles missing collector gracefully", () => {
		setMetricsCollector(null);

		// These should not throw
		recordQuery("SELECT 1", 100, 1, "pg", "query");
		recordConnection("create", "pg", "localhost", 50, true);
		recordError(new Error("Test"), "pg", "query");
	});
});

describe("createConsoleCollector", () => {
	it("creates console collector", () => {
		const collector = createConsoleCollector();

		strictEqual(typeof collector.recordQuery, "function");
		strictEqual(typeof collector.recordConnection, "function");
		strictEqual(typeof collector.recordError, "function");
	});

	it("console collector methods work without throwing", () => {
		const collector = createConsoleCollector();

		// These should not throw (they log to console)
		collector.recordQuery("SELECT 1", 100, 1, "pg", "query");
		collector.recordConnection("create", "pg", "localhost", 50, true);
		collector.recordError(new Error("Test"), "pg", "query");
	});
});
