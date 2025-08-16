import assert from "node:assert";
import { spawn } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

describe("ClusteredServer", () => {
	let childProcess;
	let tempScriptPath;
	const port = 3457;

	beforeEach(async () => {
		// Create a minimal server script for faster startup
		tempScriptPath = join(process.cwd(), "server", "temp-clustered-test.mjs");
		const serverScript = `
import { Router } from "../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

const router = new Router();
router.get("/", (ctx) => {
	ctx.html("<html><body><h1>Hello Clustered</h1></body></html>");
});

// Add a route that will trigger worker restart logic by throwing an error
router.get("/crash", (ctx) => {
	// This will cause the worker to crash with a non-zero exit code
	throw new Error("Intentional worker crash for testing restart logic");
});

const server = new ClusteredServer(router);
await server.listen(${port});
console.log("ready");

// Keep the process alive
process.on("SIGTERM", async () => {
	await server.close();
	process.exit(0);
});

// Keep the process running
setInterval(() => {}, 1000);
`;

		writeFileSync(tempScriptPath, serverScript);

		// Start server with minimal stdio for faster startup
		childProcess = spawn("node", [tempScriptPath], {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"],
		});

		// Wait for server to be ready with shorter timeout
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Server startup timeout"));
			}, 3000);

			childProcess.stdout.on("data", (data) => {
				if (data.toString().includes("ready")) {
					clearTimeout(timeout);
					resolve();
				}
			});

			childProcess.on("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});
		});
	});

	afterEach(async () => {
		if (childProcess) {
			childProcess.kill("SIGTERM");
			// Shorter timeout for cleanup
			await Promise.race([
				new Promise((resolve) => childProcess.on("exit", resolve)),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		}

		// Clean up temp file
		try {
			unlinkSync(tempScriptPath);
		} catch (_error) {
			// Ignore if file doesn't exist
		}
	});

	test("should handle basic HTTP request and return HTML response", async () => {
		const response = await fetch(`http://localhost:${port}/`);
		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.headers.get("content-type"), "text/html");

		const html = await response.text();
		assert.ok(html.includes("<h1>Hello Clustered</h1>"));
	});

	test("should handle worker restart logic and edge cases", async () => {
		// Test worker restart logic by triggering a crash
		try {
			await fetch(`http://localhost:${port}/crash`);
		} catch (_error) {
			// Expected - the worker crashed and should restart
		}

		// Wait a moment for worker restart
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Verify the server is still working after restart
		const response = await fetch(`http://localhost:${port}/`);
		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.headers.get("content-type"), "text/html");

		const html = await response.text();
		assert.ok(html.includes("<h1>Hello Clustered</h1>"));
	});

	test("should handle close method edge cases", async () => {
		// Create a separate test for close method edge cases
		const closeTestScript = `
import { Router } from "../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

const router = new Router();
router.get("/", (ctx) => {
	ctx.html("<html><body><h1>Close Test</h1></body></html>");
});

const server = new ClusteredServer(router);
await server.listen(${port + 1});
console.log("close-test-ready");

// Test close method edge cases
await server.close();
console.log("close-completed");
process.exit(0);
`;

		const closeTestPath = join(process.cwd(), "server", "temp-close-test.mjs");
		writeFileSync(closeTestPath, closeTestScript);

		const closeChildProcess = spawn("node", [closeTestPath], {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"],
		});

		// Wait for close test to complete
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Close test timeout"));
			}, 3000);

			closeChildProcess.stdout.on("data", (data) => {
				if (data.toString().includes("close-completed")) {
					clearTimeout(timeout);
					resolve();
				}
			});

			closeChildProcess.on("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});

			closeChildProcess.on("exit", (code) => {
				if (code === 0) {
					clearTimeout(timeout);
					resolve();
				}
			});
		});

		// Clean up
		try {
			unlinkSync(closeTestPath);
		} catch (_error) {
			// Ignore if file doesn't exist
		}
	});

	test("should handle primary process edge cases", async () => {
		// Create a test that specifically targets primary process logic
		const primaryTestScript = `
import { Router } from "../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

const router = new Router();
router.get("/", (ctx) => {
	ctx.html("<html><body><h1>Primary Test</h1></body></html>");
});

const server = new ClusteredServer(router);

// Test the listen method which runs primary process logic
await server.listen(${port + 2});
console.log("primary-test-ready");

// Test the close method which also runs primary process logic
await server.close();
console.log("primary-close-completed");

// Test edge case: close when no workers exist
await server.close();
console.log("primary-edge-case-completed");

process.exit(0);
`;

		const primaryTestPath = join(
			process.cwd(),
			"server",
			"temp-primary-test.mjs",
		);
		writeFileSync(primaryTestPath, primaryTestScript);

		const primaryChildProcess = spawn("node", [primaryTestPath], {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"],
		});

		// Wait for primary test to complete
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Primary test timeout"));
			}, 5000);

			primaryChildProcess.stdout.on("data", (data) => {
				if (data.toString().includes("primary-edge-case-completed")) {
					clearTimeout(timeout);
					resolve();
				}
			});

			primaryChildProcess.on("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});

			primaryChildProcess.on("exit", (code) => {
				if (code === 0) {
					clearTimeout(timeout);
					resolve();
				}
			});
		});

		// Clean up
		try {
			unlinkSync(primaryTestPath);
		} catch (_error) {
			// Ignore if file doesn't exist
		}
	});
});
