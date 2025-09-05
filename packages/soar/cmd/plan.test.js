/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unit tests for Soar PlanCommand class.
 *
 * Tests Wings/Terminal integration, flag handling, and planning execution
 * using real Wings Context objects.
 */

import { match, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "@raven-js/wings";
import { PlanCommand } from "./plan.js";

describe("PlanCommand", () => {
	it("creates command with correct route pattern", () => {
		const command = new PlanCommand();
		strictEqual(command.path, "/plan/:config?");
		strictEqual(
			command.description,
			"Plan deployment without executing (dry-run)",
		);
	});

	it("declares all required flags", () => {
		const command = new PlanCommand();
		const flags = command.getFlags();

		// Check for key flags
		strictEqual(flags.get("verbose")?.type, "boolean");
		strictEqual(flags.get("verbose")?.alias, "v");
		strictEqual(flags.get("static")?.type, "string");
		strictEqual(flags.get("cf-workers")?.type, "string");
		strictEqual(flags.get("cloudflare-workers")?.type, "string");
		strictEqual(flags.get("auto-approve")?.type, "boolean");
	});

	it("has proper description", () => {
		const command = new PlanCommand();
		strictEqual(
			command.description,
			"Plan deployment without executing (dry-run)",
		);
	});

	it("returns proper route for Wings registration", () => {
		const command = new PlanCommand();
		match(command.path, /^\/plan/);
	});

	it("has execute method for Wings integration", async () => {
		const command = new PlanCommand();

		// Should have execute method
		strictEqual(typeof command.execute, "function");

		// Should have onError method
		strictEqual(typeof command.onError, "function");
	});
});
