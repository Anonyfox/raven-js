/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for statistics card components
 *
 * Validates Bootstrap responsive grid and utility class usage.
 * Ensures 100% branch coverage for statistical displays.
 */

import { ok } from "node:assert";
import { describe, test } from "node:test";
import { statsCard, statsGrid } from "./stats-card.js";

describe("statsCard component", () => {
	test("generates stats card with default light variant", () => {
		const stats = [
			{ value: 42, label: "Total Items" },
			{ value: "100%", label: "Coverage" },
		];

		const result = statsCard({ stats });

		ok(result.includes('class="card bg-light border-0"'));
		ok(result.includes('class="row text-center g-4"'));
		ok(result.includes('<div class="h4 fw-bold text-primary mb-1">42</div>'));
		ok(result.includes('<div class="text-muted ">Total Items</div>'));
	});

	test("generates stats card with title", () => {
		const stats = [{ value: 5, label: "Modules" }];
		const result = statsCard({ stats, title: "Package Statistics" });

		ok(result.includes("Package Statistics"));
		ok(result.includes('class="card-header bg-transparent border-bottom-0"'));
	});

	test("generates stats card with custom variant", () => {
		const stats = [{ value: 10, label: "APIs" }];
		const result = statsCard({ stats, variant: "primary" });

		ok(result.includes('class="card bg-primary"'));
		ok(result.includes("text-white"));
	});

	test("handles stats with custom variants", () => {
		const stats = [
			{ value: 5, label: "Success", variant: "success" },
			{ value: 1, label: "Warning", variant: "warning" },
		];

		const result = statsCard({ stats });

		ok(result.includes("text-success"));
		ok(result.includes("text-warning"));
	});

	test("calculates responsive column classes correctly", () => {
		const twoStats = [
			{ value: 1, label: "One" },
			{ value: 2, label: "Two" },
		];
		const result = statsCard({ stats: twoStats });

		// Should use col-md-6 for 2 stats (12/2=6)
		ok(result.includes("col-md-6"));

		const fourStats = [
			{ value: 1, label: "One" },
			{ value: 2, label: "Two" },
			{ value: 3, label: "Three" },
			{ value: 4, label: "Four" },
		];
		const result2 = statsCard({ stats: fourStats });

		// Should use col-md-3 for 4 stats (12/4=3)
		ok(result2.includes("col-md-3"));
	});
});

describe("statsGrid component", () => {
	test("generates simple stats grid without card wrapper", () => {
		const stats = [
			{ value: 100, label: "Tests", variant: "success" },
			{ value: 95, label: "Coverage", variant: "info" },
		];

		const result = statsGrid(stats);

		ok(result.includes('class="row text-center g-4"'));
		ok(result.includes('<div class="h4 fw-bold text-success mb-1">100</div>'));
		ok(result.includes('<div class="text-muted">Tests</div>'));
		ok(!result.includes("card"));
	});

	test("uses default primary variant when none specified", () => {
		const stats = [{ value: 42, label: "Default" }];
		const result = statsGrid(stats);

		ok(result.includes("text-primary"));
	});

	test("handles single stat properly", () => {
		const stats = [{ value: 1, label: "Single" }];
		const result = statsGrid(stats);

		// Should use col-md-12 for single stat
		ok(result.includes("col-md-12"));
	});
});
