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

const server = new ClusteredServer(router);
await server.listen(${port});
console.log("ready");

// Minimal keep-alive and cleanup
process.on("SIGTERM", async () => {
	await server.close();
	process.exit(0);
});
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
});
