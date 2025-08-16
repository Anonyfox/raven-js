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

		// Test 4: Non-HTML responses should not be modified
		const jsonRouter = new Router();
		jsonRouter.get("/json", (ctx) => {
			ctx.json({ message: "Hello JSON" });
		});

		const jsonServer = new DevServer(jsonRouter, { websocketPort: 8083 });
		await jsonServer.listen(3003);

		try {
			const jsonResponse = await fetch(`http://localhost:3003/json`);
			assert.strictEqual(jsonResponse.status, 200);
			assert.strictEqual(
				jsonResponse.headers.get("content-type"),
				"application/json",
			);
			const jsonText = await jsonResponse.text();
			assert.strictEqual(jsonText, '{"message":"Hello JSON"}');
			assert.ok(!jsonText.includes("<script>"));
		} finally {
			await jsonServer.close();
		}

		// Test 5: HTML without proper content-type should not be modified
		const badHtmlRouter = new Router();
		badHtmlRouter.get("/bad-html", (ctx) => {
			ctx.html("<html><body>Hello</body></html>");
			ctx.responseHeaders.set("content-type", "text/plain"); // Override to non-HTML
		});

		const badHtmlServer = new DevServer(badHtmlRouter, { websocketPort: 8084 });
		await badHtmlServer.listen(3004);

		try {
			const badHtmlResponse = await fetch(`http://localhost:3004/bad-html`);
			assert.strictEqual(badHtmlResponse.status, 200);
			assert.strictEqual(
				badHtmlResponse.headers.get("content-type"),
				"text/plain",
			);
			const badHtmlText = await badHtmlResponse.text();
			assert.ok(!badHtmlText.includes("<script>"));
		} finally {
			await badHtmlServer.close();
		}

		// Test 6: Non-string response body should not be modified
		const nonStringRouter = new Router();
		nonStringRouter.get("/non-string", (ctx) => {
			ctx.html(123); // Non-string body
		});

		const nonStringServer = new DevServer(nonStringRouter, {
			websocketPort: 8085,
		});
		await nonStringServer.listen(3005);

		try {
			const nonStringResponse = await fetch(`http://localhost:3005/non-string`);
			assert.strictEqual(nonStringResponse.status, 500); // Should error due to invalid type
			const nonStringText = await nonStringResponse.text();
			assert.ok(nonStringText.includes("Internal Server Error"));
		} finally {
			await nonStringServer.close();
		}

		// Test 7: HTML that doesn't start with '<' should not be modified
		const noTagRouter = new Router();
		noTagRouter.get("/no-tag", (ctx) => {
			ctx.html("This is not HTML"); // Doesn't start with '<'
		});

		const noTagServer = new DevServer(noTagRouter, { websocketPort: 8086 });
		await noTagServer.listen(3006);

		try {
			const noTagResponse = await fetch(`http://localhost:3006/no-tag`);
			assert.strictEqual(noTagResponse.status, 200);
			const noTagText = await noTagResponse.text();
			assert.ok(!noTagText.includes("<script>"));
		} finally {
			await noTagServer.close();
		}
	});

	test("should handle constructor edge cases and server lifecycle", () => {
		// Test constructor with undefined websocketPort (should use default)
		const router1 = new Router();
		const server1 = new DevServer(router1, { websocketPort: undefined });
		assert.strictEqual(server1.websocketServerPort, 3456);

		// Test constructor with null websocketPort (should use default)
		const router2 = new Router();
		const server2 = new DevServer(router2, { websocketPort: null });
		assert.strictEqual(server2.websocketServerPort, 3456);

		// Test constructor with no options (should use default)
		const router3 = new Router();
		const server3 = new DevServer(router3);
		assert.strictEqual(server3.websocketServerPort, 3456);
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
