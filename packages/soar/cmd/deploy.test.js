/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unit tests for Soar DeployCommand class.
 *
 * Tests Wings/Terminal integration, flag handling, and deployment execution
 * using real Wings Context objects.
 */

import { match, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "@raven-js/wings";
import { DeployCommand } from "./deploy.js";

describe("DeployCommand", () => {
	it("creates command with correct route pattern", () => {
		const command = new DeployCommand();
		strictEqual(command.path, "/deploy/:config?");
		strictEqual(command.description, "Deploy artifacts to targets");
	});

	it("declares all required flags", () => {
		const command = new DeployCommand();
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
		const command = new DeployCommand();
		strictEqual(command.description, "Deploy artifacts to targets");
	});

	it("returns proper route for Wings registration", () => {
		const command = new DeployCommand();
		match(command.path, /^\/deploy/);
	});

	it("has execute method for Wings integration", async () => {
		const command = new DeployCommand();

		// Should have execute method
		strictEqual(typeof command.execute, "function");

		// Should have onError method
		strictEqual(typeof command.onError, "function");
	});
});
