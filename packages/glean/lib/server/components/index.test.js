/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for component exports
 *
 * Validates all components are properly exported and accessible.
 * Ensures component library interface remains stable.
 */

import { ok, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import * as components from "./index.js";

describe("component exports", () => {
	test("exports page structure components", () => {
		ok(typeof components.pageHeader === "function");
		ok(typeof components.statsCard === "function");
		ok(typeof components.statsGrid === "function");
	});

	test("exports content components", () => {
		ok(typeof components.entityCard === "function");
		ok(typeof components.moduleCard === "function");
		ok(typeof components.contentSection === "function");
		ok(typeof components.codeBlock === "function");
		ok(typeof components.tableSection === "function");
		ok(typeof components.cardGrid === "function");
		ok(typeof components.gettingStarted === "function");
	});

	test("exports navigation components", () => {
		ok(typeof components.moduleNavigation === "function");
		ok(typeof components.entityNavigation === "function");
		ok(typeof components.quickActions === "function");
		ok(typeof components.statsSidebar === "function");
	});

	test("exports alert components", () => {
		ok(typeof components.alert === "function");
		ok(typeof components.deprecationAlert === "function");
		ok(typeof components.emptyState === "function");
	});

	test("all exports are functions", () => {
		const exportedFunctions = Object.values(components);
		strictEqual(exportedFunctions.length, 18);

		exportedFunctions.forEach((fn) => {
			strictEqual(typeof fn, "function");
		});
	});
});
