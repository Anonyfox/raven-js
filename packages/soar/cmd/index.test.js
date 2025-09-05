/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unit tests for Soar command exports.
 *
 * Validates that all command classes are properly exported
 * for Wings/Terminal registration.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { DeployCommand, PlanCommand } from "./index.js";

describe("Command exports", () => {
	it("exports DeployCommand class", () => {
		strictEqual(typeof DeployCommand, "function");
		const instance = new DeployCommand();
		strictEqual(instance.path, "/deploy/:config?");
	});

	it("exports PlanCommand class", () => {
		strictEqual(typeof PlanCommand, "function");
		const instance = new PlanCommand();
		strictEqual(instance.path, "/plan/:config?");
	});
});
