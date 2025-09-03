/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for diagnostics utilities
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	createAnalyzer,
	createDiagnostics,
	createHealthChecker,
	DiagnosticsCollector,
	HealthChecker,
	QueryAnalyzer,
} from "./diagnostics.js";

describe("createDiagnostics", () => {
	it("creates diagnostics collector", () => {
		const collector = createDiagnostics();
		ok(collector instanceof DiagnosticsCollector);
	});

	it("accepts options", () => {
		const collector = createDiagnostics({ slowQueryThreshold: 500 });
		strictEqual(collector.options.slowQueryThreshold, 500);
	});
});

describe("DiagnosticsCollector", () => {
	it("records query metrics", () => {
		const collector = new DiagnosticsCollector();

		collector.recordQuery("SELECT 1", [], 100, 1, "pg", "query");

		const stats = collector.getStats();
		strictEqual(stats.totalQueries, 1);
		strictEqual(stats.successfulQueries, 1);
	});

	it("tracks slow queries", () => {
		const collector = new DiagnosticsCollector({ slowQueryThreshold: 50 });

		collector.recordQuery("SELECT 1", [], 100, 1, "pg", "query");
		collector.recordQuery("SELECT 2", [], 25, 1, "pg", "query");

		const slowQueries = collector.getSlowQueries();
		strictEqual(slowQueries.length, 1);
		strictEqual(slowQueries[0].sql, "SELECT 1");
	});

	it("records connection metrics", () => {
		const collector = new DiagnosticsCollector();

		collector.recordConnection("create", "pg", "localhost", 50, true);
		collector.recordConnection("close", "pg", "localhost");

		const stats = collector.getStats();
		strictEqual(stats.connectionMetrics.totalConnections, 1);
	});

	it("can be cleared", () => {
		const collector = new DiagnosticsCollector();

		collector.recordQuery("SELECT 1", [], 100, 1, "pg", "query");
		collector.clear();

		const stats = collector.getStats();
		strictEqual(stats.totalQueries, 0);
	});

	it("can export and import data", () => {
		const collector = new DiagnosticsCollector();
		collector.recordQuery("SELECT 1", [], 100, 1, "pg", "query");

		const exported = collector.export();
		ok(exported.stats);
		ok(exported.recentQueries);

		const newCollector = new DiagnosticsCollector();
		newCollector.import(exported);

		// Should have imported data
		ok(newCollector.profiles.length > 0);
	});
});

describe("createHealthChecker", () => {
	it("creates health checker", () => {
		const mockClient = { query: () => Promise.resolve() };
		const checker = createHealthChecker(mockClient);

		ok(checker instanceof HealthChecker);
	});
});

describe("HealthChecker", () => {
	it("provides health status", () => {
		const mockClient = { query: () => Promise.resolve() };
		const checker = new HealthChecker(mockClient);

		const status = checker.getStatus();
		strictEqual(typeof status.healthy, "boolean");
		strictEqual(typeof status.lastCheck, "number");
	});

	it("can start and stop monitoring", () => {
		const mockClient = { query: () => Promise.resolve() };
		const checker = new HealthChecker(mockClient, { interval: 1000 });

		checker.start();
		ok(checker.checkInterval);

		checker.stop();
		strictEqual(checker.checkInterval, null);
	});
});

describe("createAnalyzer", () => {
	it("creates query analyzer", () => {
		const collector = new DiagnosticsCollector();
		const analyzer = createAnalyzer(collector);

		ok(analyzer instanceof QueryAnalyzer);
	});
});

describe("QueryAnalyzer", () => {
	it("analyzes query performance", () => {
		const collector = new DiagnosticsCollector();
		collector.recordQuery("SELECT 1", [], 100, 1, "pg", "query");
		collector.recordQuery("INSERT INTO users", [], 200, 1, "pg", "query");

		const analyzer = new QueryAnalyzer(collector);
		const analysis = analyzer.analyze();

		ok(analysis.summary);
		ok(analysis.performance);
		ok(analysis.patterns);
		ok(Array.isArray(analysis.recommendations));
	});
});
