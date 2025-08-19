import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ArgsToUrl, UrlToArgs } from "./transform-pattern.js";

describe("ArgsToUrl", () => {
	describe("basic functionality", () => {
		it("should return '/' for empty or invalid input", () => {
			assert.equal(ArgsToUrl([]), "/");
			assert.equal(ArgsToUrl(null), "/");
			assert.equal(ArgsToUrl(undefined), "/");
		});

		it("should handle simple commands without flags", () => {
			assert.equal(ArgsToUrl(["git", "status"]), "/git/status");
			assert.equal(ArgsToUrl(["npm", "install"]), "/npm/install");
			assert.equal(
				ArgsToUrl(["docker", "container", "list"]),
				"/docker/container/list",
			);
		});

		it("should handle commands with positional arguments", () => {
			assert.equal(
				ArgsToUrl(["git", "checkout", "main"]),
				"/git/checkout/main",
			);
			assert.equal(
				ArgsToUrl(["npm", "install", "express"]),
				"/npm/install/express",
			);
			assert.equal(
				ArgsToUrl(["docker", "run", "nginx:latest"]),
				"/docker/run/nginx%3Alatest",
			);
		});
	});

	describe("flag handling", () => {
		it("should handle boolean flags", () => {
			assert.equal(
				ArgsToUrl(["git", "commit", "--amend"]),
				"/git/commit?amend=true",
			);
			assert.equal(
				ArgsToUrl(["npm", "install", "--save-dev"]),
				"/npm/install?save-dev=true",
			);
			assert.equal(ArgsToUrl(["ls", "-l"]), "/ls?l=true");
		});

		it("should handle flags with values", () => {
			assert.equal(
				ArgsToUrl(["git", "commit", "--message", "Initial commit"]),
				"/git/commit?message=Initial+commit",
			);
			assert.equal(
				ArgsToUrl([
					"npm",
					"install",
					"--registry",
					"https://registry.npmjs.org",
				]),
				"/npm/install?registry=https%3A%2F%2Fregistry.npmjs.org",
			);
			assert.equal(
				ArgsToUrl(["curl", "-H", "Content-Type: application/json"]),
				"/curl?H=Content-Type%3A+application%2Fjson",
			);
		});

		it("should handle --flag=value format", () => {
			assert.equal(
				ArgsToUrl(["git", "commit", "--message=Initial commit"]),
				"/git/commit?message=Initial+commit",
			);
			assert.equal(
				ArgsToUrl([
					"npm",
					"config",
					"set",
					"--registry=https://registry.npmjs.org",
				]),
				"/npm/config/set?registry=https%3A%2F%2Fregistry.npmjs.org",
			);
		});

		it("should handle multiple flags", () => {
			const result = ArgsToUrl([
				"git",
				"commit",
				"--message",
				"Test commit",
				"--amend",
				"--no-verify",
			]);
			assert.ok(result.includes("message=Test+commit"));
			assert.ok(result.includes("amend=true"));
			assert.ok(result.includes("no-verify=true"));
			assert.ok(result.startsWith("/git/commit?"));
		});

		it("should handle repeated flags", () => {
			const result = ArgsToUrl([
				"eslint",
				"--ext",
				".js",
				"--ext",
				".ts",
				"--fix",
			]);
			assert.ok(result.includes("ext=.js"));
			assert.ok(result.includes("ext=.ts"));
			assert.ok(result.includes("fix=true"));
			assert.ok(result.startsWith("/eslint?"));
		});
	});

	describe("complex scenarios", () => {
		it("should handle commands with positional args and flags", () => {
			const result = ArgsToUrl([
				"git",
				"log",
				"main",
				"--oneline",
				"--since",
				"2 days ago",
			]);
			assert.ok(result.startsWith("/git/log/main?"));
			assert.ok(result.includes("oneline=true"));
			assert.ok(result.includes("since=2+days+ago"));
		});

		it("should handle special characters in arguments", () => {
			assert.equal(ArgsToUrl(["echo", "hello world"]), "/echo/hello%20world");
			assert.equal(
				ArgsToUrl([
					"git",
					"commit",
					"--message",
					"fix: handle special chars & symbols",
				]),
				"/git/commit?message=fix%3A+handle+special+chars+%26+symbols",
			);
		});

		it("should handle edge cases with dashes", () => {
			assert.equal(ArgsToUrl(["command", "-"]), "/command/-");
			assert.equal(ArgsToUrl(["command", "--"]), "/command/--");
		});
	});
});

describe("UrlToArgs", () => {
	describe("basic functionality", () => {
		it("should return empty array for invalid input", () => {
			assert.deepEqual(UrlToArgs(""), []);
			assert.deepEqual(UrlToArgs(null), []);
			assert.deepEqual(UrlToArgs(undefined), []);
		});

		it("should handle simple paths without query parameters", () => {
			assert.deepEqual(UrlToArgs("/git/status"), ["git", "status"]);
			assert.deepEqual(UrlToArgs("/npm/install"), ["npm", "install"]);
			assert.deepEqual(UrlToArgs("/docker/container/list"), [
				"docker",
				"container",
				"list",
			]);
		});

		it("should handle paths with positional arguments", () => {
			assert.deepEqual(UrlToArgs("/git/checkout/main"), [
				"git",
				"checkout",
				"main",
			]);
			assert.deepEqual(UrlToArgs("/npm/install/express"), [
				"npm",
				"install",
				"express",
			]);
			assert.deepEqual(UrlToArgs("/docker/run/nginx%3Alatest"), [
				"docker",
				"run",
				"nginx:latest",
			]);
		});
	});

	describe("query parameter handling", () => {
		it("should handle boolean flags", () => {
			assert.deepEqual(UrlToArgs("/git/commit?amend=true"), [
				"git",
				"commit",
				"--amend",
			]);
			assert.deepEqual(UrlToArgs("/npm/install?save-dev=true"), [
				"npm",
				"install",
				"--save-dev",
			]);
			assert.deepEqual(UrlToArgs("/ls?l=true"), ["ls", "-l"]);
		});

		it("should handle flags with values", () => {
			assert.deepEqual(UrlToArgs("/git/commit?message=Initial+commit"), [
				"git",
				"commit",
				"--message",
				"Initial commit",
			]);
			assert.deepEqual(
				UrlToArgs("/npm/install?registry=https%3A%2F%2Fregistry.npmjs.org"),
				["npm", "install", "--registry", "https://registry.npmjs.org"],
			);
		});

		it("should handle multiple query parameters", () => {
			const result = UrlToArgs(
				"/git/commit?message=Test+commit&amend=true&no-verify=true",
			);
			assert.ok(result.includes("git"));
			assert.ok(result.includes("commit"));
			assert.ok(result.includes("--message"));
			assert.ok(result.includes("Test commit"));
			assert.ok(result.includes("--amend"));
			assert.ok(result.includes("--no-verify"));
		});

		it("should handle repeated query parameters", () => {
			const result = UrlToArgs("/eslint?ext=.js&ext=.ts&fix=true");
			assert.ok(result.includes("eslint"));
			assert.ok(result.includes("--ext"));
			assert.ok(result.includes(".js"));
			assert.ok(result.includes(".ts"));
			assert.ok(result.includes("--fix"));
		});
	});

	describe("special character handling", () => {
		it("should decode URL-encoded characters", () => {
			assert.deepEqual(UrlToArgs("/echo/hello%20world"), [
				"echo",
				"hello world",
			]);
			assert.deepEqual(
				UrlToArgs(
					"/git/commit?message=fix%3A+handle+special+chars+%26+symbols",
				),
				["git", "commit", "--message", "fix: handle special chars & symbols"],
			);
		});
	});
});

describe("bidirectional transformation", () => {
	describe("round-trip conversion", () => {
		it("should maintain consistency for simple commands", () => {
			const original = ["git", "status"];
			const url = ArgsToUrl(original);
			const converted = UrlToArgs(url);
			assert.deepEqual(converted, original);
		});

		it("should maintain consistency for commands with boolean flags", () => {
			const original = ["git", "commit", "--amend"];
			const url = ArgsToUrl(original);
			const converted = UrlToArgs(url);
			assert.deepEqual(converted, original);
		});

		it("should maintain consistency for commands with value flags", () => {
			const original = ["git", "commit", "--message", "Initial commit"];
			const url = ArgsToUrl(original);
			const converted = UrlToArgs(url);
			assert.deepEqual(converted, original);
		});

		it("should maintain consistency for complex commands", () => {
			const original = ["npm", "install", "express", "--save-dev", "--verbose"];
			const url = ArgsToUrl(original);
			const converted = UrlToArgs(url);
			// Note: Order of flags might change due to URLSearchParams, but content should be preserved
			assert.ok(converted.includes("npm"));
			assert.ok(converted.includes("install"));
			assert.ok(converted.includes("express"));
			assert.ok(converted.includes("--save-dev"));
			assert.ok(converted.includes("--verbose"));
		});
	});

	describe("edge cases", () => {
		it("should handle special characters consistently", () => {
			const original = [
				"git",
				"commit",
				"--message",
				"fix: handle special chars & symbols",
			];
			const url = ArgsToUrl(original);
			const converted = UrlToArgs(url);
			assert.deepEqual(converted, original);
		});

		it("should handle empty arguments gracefully", () => {
			assert.equal(ArgsToUrl([]), "/");
			assert.deepEqual(UrlToArgs("/"), []);
		});
	});
});
