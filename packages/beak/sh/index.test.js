/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Surgical test suite for shell command template literal - TEST DOCTRINE compliant
 *
 * SURGICAL ARCHITECTURE: Exactly 3 major test groups targeting distinct behavioral territories.
 * PREDATORY PRECISION: Each test validates multiple aspects simultaneously.
 * MATHEMATICAL COVERAGE: 100% across all metrics with minimal assertions.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { sh } from "./index.js";

describe("Core Template Processing", () => {
	test("static templates and basic interpolation with whitespace normalization", () => {
		// Empty and static templates
		strictEqual(sh``, "");
		strictEqual(sh`ls -la`, "ls -la");
		strictEqual(sh`ls    -la`, "ls -la"); // Multiple spaces collapsed
		strictEqual(sh`  ls -la  `, "ls -la"); // Edges trimmed
		strictEqual(sh`   `, ""); // Only whitespace
		strictEqual(sh`\n\t\r`, ""); // Various whitespace types

		// Single and multiple interpolations
		strictEqual(sh`ls ${"-la"}`, "ls -la");
		strictEqual(sh`git commit -m ${"fix: bug"}`, "git commit -m fix: bug");
		const flags = "-la";
		const directory = "/home/user";
		strictEqual(sh`ls ${flags} ${directory}`, "ls -la /home/user");

		// Template formatting cleanup
		const cmd = sh`docker run
			-v /data:/app
			-p 3000:3000
			nginx`;
		strictEqual(cmd, "docker run -v /data:/app -p 3000:3000 nginx");
	});

	test("data type processing and conversion", () => {
		// String handling
		strictEqual(sh`echo ${"hello world"}`, "echo hello world");
		strictEqual(sh`echo ${""}`, "echo");
		strictEqual(sh`${""}`, "");
		strictEqual(sh`ls ${""}`, "ls");
		strictEqual(sh`${""}ls${""}`, "ls");

		// Number conversion
		strictEqual(
			sh`node --max-old-space-size=${4096}`,
			"node --max-old-space-size=4096",
		);
		strictEqual(sh`echo ${0}`, "echo 0");

		// Boolean handling
		strictEqual(sh`echo ${true}`, "echo true");
		strictEqual(sh`echo ${false}`, "echo");

		// Null and undefined filtering
		strictEqual(sh`echo ${null}`, "echo");
		strictEqual(sh`echo ${undefined}`, "echo");
		strictEqual(sh`ls ${null} file.txt`, "ls file.txt");

		// Object conversion
		const obj = { toString: () => "custom" };
		strictEqual(sh`echo ${obj}`, "echo custom");
		const plain = { key: "value" };
		strictEqual(sh`echo ${plain}`, "echo [object Object]");
	});

	test("template caching and static optimization", () => {
		// Template caching for repeated calls
		const template1 = sh`ls ${"-la"}`;
		const template2 = sh`ls ${"-la"}`;
		strictEqual(template1, template2);
		strictEqual(template1, "ls -la");

		// Different templates cache separately
		const ls = sh`ls ${"-la"}`;
		const git = sh`git ${"status"}`;
		strictEqual(ls, "ls -la");
		strictEqual(git, "git status");

		// Static-only optimization (no interpolations)
		strictEqual(sh`docker run -it ubuntu`, "docker run -it ubuntu");
	});
});

describe("Array Processing and Value Filtering", () => {
	test("array joining and flattening", () => {
		// Simple array joining
		const flags = ["-la", "--color=always"];
		strictEqual(sh`ls ${flags}`, "ls -la --color=always");

		// Multiple arrays in sequence
		const flags2 = ["-v", "--debug"];
		const files = ["src/", "test/"];
		strictEqual(sh`ls ${flags2} ${files}`, "ls -v --debug src/ test/");

		// Empty arrays
		strictEqual(sh`ls ${[]}`, "ls");
		strictEqual(sh`ls ${[]} file.txt`, "ls file.txt");

		// Mixed array types
		const mixed = ["--port", 3000, true, "--verbose"];
		strictEqual(
			sh`node ${mixed} app.js`,
			"node --port 3000 true --verbose app.js",
		);

		// Nested arrays flatten (but as comma-separated strings)
		const nested = [
			["docker", "run"],
			["-it", "--rm"],
		];
		strictEqual(sh`${nested} ubuntu`, "docker,run -it,--rm ubuntu");
	});

	test("falsy value filtering and edge cases", () => {
		// Falsy filtering in arrays
		const flags = ["-v", null, "--debug", undefined, false, "", "--color"];
		strictEqual(sh`ls ${flags}`, "ls -v --debug --color");

		// Arrays with only falsy values
		const falsy = [null, undefined, false, ""];
		strictEqual(sh`ls ${falsy}`, "ls");

		// Large array performance
		const largeArray = Array(1000)
			.fill()
			.map((_, i) => `item${i}`);
		const cmd = sh`command ${largeArray}`;
		strictEqual(cmd.startsWith("command item0"), true);
		strictEqual(cmd.endsWith("item999"), true);
		strictEqual(cmd.split(" ").length, 1001); // command + 1000 items

		// Many flags performance
		const manyFlags = Array(50)
			.fill()
			.map((_, i) => `--flag${i}`);
		const cmd2 = sh`command ${manyFlags}`;
		strictEqual(cmd2.split(" ").length, 51); // command + 50 flags
		strictEqual(cmd2.startsWith("command --flag0"), true);
		strictEqual(cmd2.endsWith("--flag49"), true);
	});
});

describe("Real-World Integration Scenarios", () => {
	test("complex command assembly patterns", () => {
		// Docker command with multiple arrays
		const runFlags = ["-it", "--rm", "--name", "myapp"];
		const volumes = ["-v", "/host:/container"];
		const image = "nginx:alpine";
		strictEqual(
			sh`docker run ${runFlags} ${volumes} ${image}`,
			"docker run -it --rm --name myapp -v /host:/container nginx:alpine",
		);

		// Git with conditional flags
		const verbose = true;
		const quiet = false;
		const flags = [verbose && "--verbose", quiet && "--quiet", "--oneline"];
		strictEqual(sh`git log ${flags}`, "git log --verbose --oneline");

		// Environment variables with node args
		const env = ["NODE_ENV=production", "PORT=3000"];
		const nodeArgs = ["--max-old-space-size=4096"];
		strictEqual(
			sh`${env} node ${nodeArgs} server.js`,
			"NODE_ENV=production PORT=3000 node --max-old-space-size=4096 server.js",
		);
	});

	test("whitespace normalization in complex scenarios", () => {
		// Mixed newlines and spaces with interpolation
		const volume = "/data:/app";
		const port = "3000:3000";
		const cmd = sh`docker run
			-v ${volume}
			-p ${port}
			nginx`;
		strictEqual(cmd, "docker run -v /data:/app -p 3000:3000 nginx");

		// Multiple spaces collapsed
		strictEqual(sh`ls    -la     file.txt`, "ls -la file.txt");
		strictEqual(sh`docker   run  -it   ubuntu`, "docker run -it ubuntu");

		// Leading/trailing whitespace
		strictEqual(sh`   ls -la   `, "ls -la");
		strictEqual(sh`\n  git status  \t`, "git status");

		// Preserves intentional single spaces in quotes
		strictEqual(sh`echo "hello world"`, `echo "hello world"`);
		strictEqual(sh`grep "search term" file.txt`, `grep "search term" file.txt`);
	});

	test("special characters and production commands", () => {
		// rsync with complex flags
		const flags = ["-avz", "--progress", "--exclude=node_modules"];
		const source = "/local/path/";
		const dest = "user@server:/remote/path/";
		strictEqual(
			sh`rsync ${flags} ${source} ${dest}`,
			"rsync -avz --progress --exclude=node_modules /local/path/ user@server:/remote/path/",
		);

		// find with multiple conditions
		const paths = ["src/", "test/"];
		const patterns = ["-name", "*.js", "-o", "-name", "*.ts"];
		strictEqual(
			sh`find ${paths} ${patterns}`,
			"find src/ test/ -name *.js -o -name *.ts",
		);

		// Special characters pass through
		strictEqual(sh`echo '$HOME'`, "echo '$HOME'");
		strictEqual(
			sh`grep "pattern" file.txt | wc -l`,
			'grep "pattern" file.txt | wc -l',
		);
		strictEqual(sh`cmd && echo "success"`, 'cmd && echo "success"');

		// Unicode support
		const file = "测试文件.txt";
		const message = "ñáéíóú commit message";
		strictEqual(sh`ls "${file}"`, `ls "${file}"`);
		strictEqual(sh`git commit -m "${message}"`, `git commit -m "${message}"`);
	});
});
