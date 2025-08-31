/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for the Fledge CLI executable.
 *
 * Validates argument parsing, configuration handling, and basic CLI functionality.
 */

import { match, strictEqual } from "node:assert";
import { spawn } from "node:child_process";
import { describe, it } from "node:test";

/**
 * Run CLI command and capture output
 * @param {string[]} args - Command arguments
 * @param {string} [input] - Stdin input
 * @returns {Promise<{code: number, stdout: string, stderr: string}>} Result
 */
async function runCli(args, input = "") {
	return new Promise((resolve, reject) => {
		const child = spawn("node", ["bin/fledge.js", ...args], {
			cwd: process.cwd(),
			stdio: ["pipe", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		child.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		child.on("close", (code) => {
			resolve({ code, stdout, stderr });
		});

		child.on("error", (error) => {
			reject(error);
		});

		if (input) {
			child.stdin.write(input);
		}
		child.stdin.end();

		// Timeout after 3 seconds
		setTimeout(() => {
			child.kill();
			reject(new Error("CLI test timeout"));
		}, 3000);
	});
}

describe("CLI executable", () => {
	it("shows help when no arguments given", async () => {
		const result = await runCli([]);
		strictEqual(result.code, 1);
		match(result.stdout, /Fledge CLI - From nestling to flight-ready/);
		match(result.stdout, /USAGE:/);
		match(result.stdout, /EXAMPLES:/);
	});

	it("shows help with --help flag", async () => {
		const result = await runCli(["--help"]);
		strictEqual(result.code, 0);
		match(result.stdout, /Fledge CLI - From nestling to flight-ready/);
		match(result.stdout, /fledge static \[config\.js\] \[options\]/);
	});

	it("validates simple server config", async () => {
		const result = await runCli([
			"static",
			"--server",
			"http://localhost:8080",
			"--validate",
		]);
		strictEqual(result.code, 0);
		match(result.stdout, /✅ Configuration validation successful!/);
		match(result.stdout, /Server: http:\/\/localhost:8080/);
		match(result.stdout, /Routes: \//);
	});

	it("validates piped config", async () => {
		const config =
			'export default {server: "http://localhost:3000", routes: ["/", "/about"]}';
		const result = await runCli(["static", "--validate"], config);
		strictEqual(result.code, 0);
		match(result.stdout, /✅ Configuration validation successful!/);
		match(result.stdout, /Server: http:\/\/localhost:3000/);
		match(result.stdout, /Routes: \/, \/about/);
	});

	it("handles missing config gracefully", async () => {
		const result = await runCli(["static", "--validate"]);
		strictEqual(result.code, 1);
		match(result.stderr, /No configuration provided/);
	});

	it("handles unknown commands gracefully", async () => {
		const result = await runCli(["unknown"]);
		strictEqual(result.code, 1);
		match(result.stderr, /Unknown command: unknown/);
		match(result.stderr, /Currently supported commands: static/);
	});

	it("handles malformed piped config gracefully", async () => {
		const config = "this is not valid javascript";
		const result = await runCli(["static", "--validate"], config);
		strictEqual(result.code, 1);
		match(result.stderr, /Configuration error:/);
	});
});
