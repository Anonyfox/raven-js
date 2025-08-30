/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Test suite for shell command template literal
 *
 * Validates array joining, whitespace normalization, and transparent value processing
 * for shell command assembly without security interference.
 */

import { strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { sh } from "./index.js";

describe("Basic Shell Template Functionality", () => {
	test("empty template produces empty string", () => {
		strictEqual(sh``, "");
	});

	test("static template passes through with whitespace normalization", () => {
		strictEqual(sh`ls -la`, "ls -la");
		strictEqual(sh`ls    -la`, "ls -la"); // Multiple spaces collapsed
		strictEqual(sh`  ls -la  `, "ls -la"); // Edges trimmed
	});

	test("single interpolation without arrays", () => {
		strictEqual(sh`ls ${"-la"}`, "ls -la");
		strictEqual(sh`git commit -m ${"fix: bug"}`, "git commit -m fix: bug");
	});

	test("multiple interpolations", () => {
		const flags = "-la";
		const directory = "/home/user";
		strictEqual(sh`ls ${flags} ${directory}`, "ls -la /home/user");
	});
});

describe("Array Processing", () => {
	test("simple array joining with spaces", () => {
		const flags = ["-la", "--color=always"];
		strictEqual(sh`ls ${flags}`, "ls -la --color=always");
	});

	test("multiple arrays in sequence", () => {
		const flags = ["-v", "--debug"];
		const files = ["src/", "test/"];
		strictEqual(sh`ls ${flags} ${files}`, "ls -v --debug src/ test/");
	});

	test("empty array produces no output", () => {
		strictEqual(sh`ls ${[]}`, "ls");
		strictEqual(sh`ls ${[]} file.txt`, "ls file.txt");
	});

	test("mixed array types", () => {
		const mixed = ["--port", 3000, true, "--verbose"];
		strictEqual(
			sh`node ${mixed} app.js`,
			"node --port 3000 true --verbose app.js",
		);
	});

	test("falsy value filtering in arrays", () => {
		const flags = ["-v", null, "--debug", undefined, false, "", "--color"];
		strictEqual(sh`ls ${flags}`, "ls -v --debug --color");
	});

	test("nested arrays flatten", () => {
		const nested = [
			["docker", "run"],
			["-it", "--rm"],
		];
		strictEqual(sh`${nested} ubuntu`, "docker,run -it,--rm ubuntu");
	});
});

describe("Data Type Handling", () => {
	test("string values pass through unchanged", () => {
		strictEqual(sh`echo ${"hello world"}`, "echo hello world");
		strictEqual(sh`echo ${""}`, "echo");
	});

	test("number values convert to strings", () => {
		strictEqual(
			sh`node --max-old-space-size=${4096}`,
			"node --max-old-space-size=4096",
		);
		strictEqual(sh`echo ${0}`, "echo 0");
	});

	test("boolean handling", () => {
		strictEqual(sh`echo ${true}`, "echo true");
		strictEqual(sh`echo ${false}`, "echo");
	});

	test("null and undefined produce empty output", () => {
		strictEqual(sh`echo ${null}`, "echo");
		strictEqual(sh`echo ${undefined}`, "echo");
		strictEqual(sh`ls ${null} file.txt`, "ls file.txt");
	});

	test("object conversion", () => {
		const obj = { toString: () => "custom" };
		strictEqual(sh`echo ${obj}`, "echo custom");

		const plain = { key: "value" };
		strictEqual(sh`echo ${plain}`, "echo [object Object]");
	});
});

describe("Whitespace Normalization", () => {
	test("multiple spaces collapsed to single space", () => {
		strictEqual(sh`ls    -la     file.txt`, "ls -la file.txt");
		strictEqual(sh`docker   run  -it   ubuntu`, "docker run -it ubuntu");
	});

	test("leading and trailing whitespace trimmed", () => {
		strictEqual(sh`   ls -la   `, "ls -la");
		strictEqual(sh`\n  git status  \t`, "git status");
	});

	test("template formatting cleanup", () => {
		const cmd = sh`docker run
			-v /data:/app
			-p 3000:3000
			nginx`;
		strictEqual(cmd, "docker run -v /data:/app -p 3000:3000 nginx");
	});

	test("mixed newlines and spaces", () => {
		const volume = "/data:/app";
		const port = "3000:3000";
		const cmd = sh`docker run
			-v ${volume}
			-p ${port}
			nginx`;
		strictEqual(cmd, "docker run -v /data:/app -p 3000:3000 nginx");
	});

	test("preserves intentional single spaces", () => {
		strictEqual(sh`echo "hello world"`, `echo "hello world"`);
		strictEqual(sh`grep "search term" file.txt`, `grep "search term" file.txt`);
	});
});

describe("Real-World Command Patterns", () => {
	test("docker command with arrays", () => {
		const runFlags = ["-it", "--rm", "--name", "myapp"];
		const volumes = ["-v", "/host:/container"];
		const image = "nginx:alpine";
		const cmd = sh`docker run ${runFlags} ${volumes} ${image}`;
		strictEqual(
			cmd,
			"docker run -it --rm --name myapp -v /host:/container nginx:alpine",
		);
	});

	test("git command with conditional flags", () => {
		const verbose = true;
		const quiet = false;
		const flags = [verbose && "--verbose", quiet && "--quiet", "--oneline"];
		const cmd = sh`git log ${flags}`;
		strictEqual(cmd, "git log --verbose --oneline");
	});

	test("npm command with environment variables", () => {
		const env = ["NODE_ENV=production", "PORT=3000"];
		const nodeArgs = ["--max-old-space-size=4096"];
		const cmd = sh`${env} node ${nodeArgs} server.js`;
		strictEqual(
			cmd,
			"NODE_ENV=production PORT=3000 node --max-old-space-size=4096 server.js",
		);
	});

	test("rsync with complex flags", () => {
		const flags = ["-avz", "--progress", "--exclude=node_modules"];
		const source = "/local/path/";
		const dest = "user@server:/remote/path/";
		const cmd = sh`rsync ${flags} ${source} ${dest}`;
		strictEqual(
			cmd,
			"rsync -avz --progress --exclude=node_modules /local/path/ user@server:/remote/path/",
		);
	});

	test("find command with multiple conditions", () => {
		const paths = ["src/", "test/"];
		const patterns = ["-name", "*.js", "-o", "-name", "*.ts"];
		const cmd = sh`find ${paths} ${patterns}`;
		strictEqual(cmd, "find src/ test/ -name *.js -o -name *.ts");
	});
});

describe("Edge Cases and Boundary Conditions", () => {
	test("empty strings in various contexts", () => {
		strictEqual(sh`${""}`, "");
		strictEqual(sh`ls ${""}`, "ls");
		strictEqual(sh`${""}ls${""}`, "ls");
	});

	test("only whitespace template", () => {
		strictEqual(sh`   `, "");
		strictEqual(sh`\n\t\r`, "");
	});

	test("arrays with only falsy values", () => {
		const falsy = [null, undefined, false, ""];
		strictEqual(sh`ls ${falsy}`, "ls");
	});

	test("very long command assembly", () => {
		const manyFlags = Array(50)
			.fill()
			.map((_, i) => `--flag${i}`);
		const cmd = sh`command ${manyFlags}`;
		strictEqual(cmd.split(" ").length, 51); // command + 50 flags
		strictEqual(cmd.startsWith("command --flag0"), true);
		strictEqual(cmd.endsWith("--flag49"), true);
	});

	test("special characters pass through unchanged", () => {
		strictEqual(sh`echo '$HOME'`, "echo '$HOME'");
		strictEqual(
			sh`grep "pattern" file.txt | wc -l`,
			'grep "pattern" file.txt | wc -l',
		);
		strictEqual(sh`cmd && echo "success"`, 'cmd && echo "success"');
	});

	test("unicode and international characters", () => {
		const file = "测试文件.txt";
		const message = "ñáéíóú commit message";
		strictEqual(sh`ls "${file}"`, `ls "${file}"`);
		strictEqual(sh`git commit -m "${message}"`, `git commit -m "${message}"`);
	});
});

describe("Performance and Caching", () => {
	test("template caching works for repeated calls", () => {
		const template1 = sh`ls ${"-la"}`;
		const template2 = sh`ls ${"-la"}`;
		strictEqual(template1, template2);
		strictEqual(template1, "ls -la");
	});

	test("different templates cache separately", () => {
		const ls = sh`ls ${"-la"}`;
		const git = sh`git ${"status"}`;
		strictEqual(ls, "ls -la");
		strictEqual(git, "git status");
	});

	test("handles large arrays efficiently", () => {
		const largeArray = Array(1000)
			.fill()
			.map((_, i) => `item${i}`);
		const cmd = sh`command ${largeArray}`;
		strictEqual(cmd.startsWith("command item0"), true);
		strictEqual(cmd.endsWith("item999"), true);
		strictEqual(cmd.split(" ").length, 1001); // command + 1000 items
	});
});
