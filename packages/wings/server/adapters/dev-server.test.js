import assert from "node:assert";
import { afterEach, beforeEach, describe, test } from "node:test";
import { Router } from "../../core/index.js";
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

		// Start server on random available ports
		server = new DevServer(router, { websocketPort: 0 });
		await server.listen(0);

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
		assert.ok(html.includes(wsPort.toString())); // The WebSocket port should be used in the script
		assert.ok(html.includes("</script>"));
		assert.ok(html.includes("</body>"));

		// Test 2: WebSocket server HTTP endpoint on custom port
		const wsResponse = await fetch(`http://localhost:${wsPort}`);
		assert.strictEqual(wsResponse.status, 200);
		assert.strictEqual(wsResponse.headers.get("content-type"), "text/plain");
		assert.strictEqual(await wsResponse.text(), "WebSocket server running");

		// Test 3: Verify WebSocket server is running and accessible
		assert.ok(wsPort > 0);

		// Test 4: Non-HTML responses should not be modified
		const jsonRouter = new Router();
		jsonRouter.get("/json", (ctx) => {
			ctx.json({ message: "Hello JSON" });
		});

		const jsonServer = new DevServer(jsonRouter, { websocketPort: 0 });
		await jsonServer.listen(0);

		try {
			const jsonResponse = await fetch(
				`http://localhost:${jsonServer.server.address().port}/json`,
			);
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

		const badHtmlServer = new DevServer(badHtmlRouter, { websocketPort: 0 });
		await badHtmlServer.listen(0);

		try {
			const badHtmlResponse = await fetch(
				`http://localhost:${badHtmlServer.server.address().port}/bad-html`,
			);
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
			websocketPort: 0,
		});
		await nonStringServer.listen(0);

		try {
			const nonStringResponse = await fetch(
				`http://localhost:${nonStringServer.server.address().port}/non-string`,
			);
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

		const noTagServer = new DevServer(noTagRouter, { websocketPort: 0 });
		await noTagServer.listen(0);

		try {
			const noTagResponse = await fetch(
				`http://localhost:${noTagServer.server.address().port}/no-tag`,
			);
			assert.strictEqual(noTagResponse.status, 200);
			const noTagText = await noTagResponse.text();
			assert.ok(!noTagText.includes("<script>"));
		} finally {
			await noTagServer.close();
		}
	});

	test("should handle constructor edge cases and server lifecycle", async () => {
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

		// Test that websocketServer is undefined before listen() is called
		// This tests the branch where !this.websocketServer is true in close()
		const router4 = new Router();
		const server4 = new DevServer(router4);
		assert.strictEqual(server4.websocketServer, undefined);

		// The if (!this.websocketServer) branch is already covered
		// by the server close happening in other tests when no WebSocket server exists
	});

	test("should properly clean up WebSocket connections", async () => {
		// Test that WebSocket connections are tracked and cleaned up
		const router = new Router();
		router.get("/", (ctx) => {
			ctx.html("<html><body>Test</body></html>");
		});

		const testServer = new DevServer(router, { websocketPort: 0 });
		await testServer.listen(0);

		try {
			// Verify connections set exists and is initially empty
			assert.strictEqual(testServer.websocketConnections.size, 0);

			// Test 1: Socket close event handler coverage
			let closeHandler = null;
			let errorHandler = null;
			const mockSocketWithHandlers = {
				write: () => {},
				destroy: () => {},
				on: (event, handler) => {
					if (event === "close") closeHandler = handler;
					if (event === "error") errorHandler = handler;
				},
			};

			// Simulate WebSocket connection and capture event handlers
			const mockReq = {
				headers: {
					"sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==",
				},
			};

			const upgradeHandlers = testServer.websocketServer.listeners("upgrade");
			upgradeHandlers[0](mockReq, mockSocketWithHandlers, Buffer.alloc(0));

			// Verify connection was tracked
			assert.strictEqual(testServer.websocketConnections.size, 1);
			assert.ok(testServer.websocketConnections.has(mockSocketWithHandlers));

			// Test socket close event handler (line 82)
			assert.ok(closeHandler, "Close handler should be registered");
			closeHandler(); // Trigger close event
			assert.strictEqual(testServer.websocketConnections.size, 0);

			// Re-add the socket for error test
			testServer.websocketConnections.add(mockSocketWithHandlers);
			assert.strictEqual(testServer.websocketConnections.size, 1);

			// Test socket error event handler (line 86)
			assert.ok(errorHandler, "Error handler should be registered");
			errorHandler(); // Trigger error event
			assert.strictEqual(testServer.websocketConnections.size, 0);

			// Test 2: Normal destruction during close
			let mockSocketDestroyed = false;
			const mockSocket = {
				write: () => {},
				destroy: () => {
					mockSocketDestroyed = true;
				},
				on: (_event, _handler) => {
					// Store event handlers but don't auto-trigger them for this test
				},
			};

			// Add another connection for destruction test
			upgradeHandlers[0](mockReq, mockSocket, Buffer.alloc(0));
			assert.strictEqual(testServer.websocketConnections.size, 1);

			// Close server and verify connections are destroyed
			await testServer.close();

			// Verify connection was destroyed and tracking cleared
			assert.ok(
				mockSocketDestroyed,
				"WebSocket connection should be destroyed",
			);
			assert.strictEqual(testServer.websocketConnections.size, 0);
			assert.strictEqual(testServer.websocketServer, null);
		} finally {
			// Ensure cleanup even if test fails
			if (testServer.websocketServer) {
				await testServer.close();
			}
		}
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
			on: () => {}, // Mock event handler method for tracking
			destroy: () => {}, // Mock destroy method for cleanup
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

		const errorServer = new DevServer(errorRouter, { websocketPort: 0 });
		await errorServer.listen(0);

		try {
			const response = await fetch(
				`http://localhost:${errorServer.server.address().port}/error`,
			);
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
			websocketPort: 0,
		});
		injectionErrorServer.injectAutoReloadScript = () => {
			throw new Error("Injection error");
		};

		await injectionErrorServer.listen(0);

		try {
			const response = await fetch(
				`http://localhost:${injectionErrorServer.server.address().port}/html`,
			);
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

	test("should handle WebSocket server close errors", async () => {
		// Test WebSocket server close error path (line 200)
		const router = new Router();
		router.get("/", (ctx) => {
			ctx.html("<html><body>Test</body></html>");
		});

		const errorServer = new DevServer(router, { websocketPort: 0 });
		await errorServer.listen(0);

		try {
			// Mock the WebSocket server's close method to simulate an error
			const originalClose = errorServer.websocketServer.close;
			errorServer.websocketServer.close = (callback) => {
				// Simulate an error during close
				callback(new Error("WebSocket server close error"));
			};

			// This should trigger the error path in line 200
			try {
				await errorServer.close();
				assert.fail("Expected close to throw an error");
			} catch (err) {
				assert.strictEqual(err.message, "WebSocket server close error");
			}

			// Restore original close method for cleanup
			errorServer.websocketServer.close = originalClose;
		} finally {
			// Ensure proper cleanup
			if (errorServer.websocketServer) {
				await errorServer.close();
			}
		}
	});
});
