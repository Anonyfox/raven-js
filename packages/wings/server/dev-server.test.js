import assert from "node:assert";
import http from "node:http";
import { afterEach, beforeEach, describe, test } from "node:test";
import { Router } from "../core/index.js";
import { DevServer } from "./dev-server.js";

describe("DevServer", () => {
	let server;
	let mainPort;
	let wsPort;

	beforeEach(async () => {
		// Create router with HTML route
		const router = new Router();
		router.get("/", (ctx) => {
			ctx.html("<html><head></head><body><h1>Hello</h1></body></html>");
		});

		// Start server on non-privileged ports (above 1024)
		server = new DevServer(router, { websocketPort: 3456 });
		await server.listen(3000);

		mainPort = server.server.address().port;
		wsPort = server.websocketServer.address().port;

		// Update the websocket port to the actual assigned port
		server.websocketServerPort = wsPort;
	});

	afterEach(async () => {
		if (server) {
			await server.close();
		}
	});

	test("should handle HTML injection and WebSocket HTTP endpoint", async () => {
		// Test 1: HTML injection
		const response = await fetch(`http://localhost:${mainPort}/`);
		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.headers.get("content-type"), "text/html");

		const html = await response.text();
		assert.ok(html.includes("<script>"));
		assert.ok(html.includes("WebSocket"));
		assert.ok(html.includes("location.reload()"));
		assert.ok(html.includes("3456")); // The port is hardcoded in the script
		assert.ok(html.includes("</script>"));
		assert.ok(html.includes("</body>"));

		// Test 2: WebSocket server HTTP endpoint
		const wsResponse = await fetch(`http://localhost:${wsPort}`);
		assert.strictEqual(wsResponse.status, 200);
		assert.strictEqual(wsResponse.headers.get("content-type"), "text/plain");
		assert.strictEqual(await wsResponse.text(), "WebSocket server running");
	});
});
