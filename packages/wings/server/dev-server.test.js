import assert from "node:assert";
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
		server = new DevServer(router, { websocketPort: 8080 });
		await server.listen(3000);

		mainPort = server.server.address().port;
		wsPort = server.websocketServer.address().port;
	});

	afterEach(async () => {
		if (server) {
			await server.close();
		}
	});

	test("should handle HTML injection and WebSocket HTTP endpoint", async () => {
		// Test 1: HTML injection with custom WebSocket port
		const response = await fetch(`http://localhost:${mainPort}/`);
		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.headers.get("content-type"), "text/html");

		const html = await response.text();
		assert.ok(html.includes("<script>"));
		assert.ok(html.includes("WebSocket"));
		assert.ok(html.includes("location.reload()"));
		assert.ok(html.includes("8080")); // The custom port should be used in the script
		assert.ok(html.includes("</script>"));
		assert.ok(html.includes("</body>"));

		// Test 2: WebSocket server HTTP endpoint on custom port
		const wsResponse = await fetch(`http://localhost:${wsPort}`);
		assert.strictEqual(wsResponse.status, 200);
		assert.strictEqual(wsResponse.headers.get("content-type"), "text/plain");
		assert.strictEqual(await wsResponse.text(), "WebSocket server running");

		// Test 3: Verify WebSocket server is running on the configured port
		assert.strictEqual(wsPort, 8080);
	});

	test("should handle WebSocket upgrade and various error scenarios", async () => {
		// Test 1: WebSocket upgrade handler
		const mockReq = {
			headers: {
				"sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==",
			},
		};

		const mockSocket = {
			write: (data) => {
				// Verify the upgrade response format
				assert.ok(data.includes("HTTP/1.1 101 Switching Protocols"));
				assert.ok(data.includes("Upgrade: websocket"));
				assert.ok(data.includes("Connection: Upgrade"));
				assert.ok(data.includes("Sec-WebSocket-Accept:"));
			},
			end: () => {}, // Mock end method
		};

		// Get the upgrade handler and call it directly
		const upgradeHandlers = server.websocketServer.listeners("upgrade");
		assert.ok(upgradeHandlers.length > 0);

		// Call the upgrade handler
		upgradeHandlers[0](mockReq, mockSocket, Buffer.alloc(0));

		// Test 2: Router-level errors
		const errorRouter = new Router();
		errorRouter.get("/error", (_ctx) => {
			throw new Error("Test error");
		});

		const errorServer = new DevServer(errorRouter, { websocketPort: 8081 });
		await errorServer.listen(3001);

		try {
			const response = await fetch(`http://localhost:3001/error`);
			assert.strictEqual(response.status, 500);
			assert.strictEqual(response.headers.get("content-type"), "text/plain");
			const errorText = await response.text();
			assert.ok(
				errorText.includes("Test error") ||
					errorText.includes("Internal Server Error"),
			);
		} finally {
			await errorServer.close();
		}

		// Test 3: DevServer-specific errors (HTML injection)
		const htmlRouter = new Router();
		htmlRouter.get("/html", (ctx) => {
			ctx.html("<html><body>Hello</body></html>");
		});

		const injectionErrorServer = new DevServer(htmlRouter, {
			websocketPort: 8082,
		});
		injectionErrorServer.injectAutoReloadScript = () => {
			throw new Error("Injection error");
		};

		await injectionErrorServer.listen(3002);

		try {
			const response = await fetch(`http://localhost:3002/html`);
			assert.strictEqual(response.status, 500);
			assert.strictEqual(response.headers.get("content-type"), "text/plain");
			const errorText = await response.text();
			assert.ok(
				errorText.includes("Injection error") ||
					errorText.includes("Internal Server Error"),
			);
		} finally {
			await injectionErrorServer.close();
		}
	});
});
