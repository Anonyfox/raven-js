import assert from "node:assert";
import { describe, test } from "node:test";
import { Router } from "../core/index.js";
import { DevServer } from "./dev-server.js";

describe("DevServer", () => {
	test("should create dev server with router", () => {
		const router = new Router();
		const server = new DevServer(router);

		assert.ok(server instanceof DevServer);
		assert.strictEqual(server.websocketServerPort, 3456);
		// WebSocket server is created when listen() is called
	});

	test("should use default websocket port when not specified", () => {
		const router = new Router();
		const server = new DevServer(router, {});

		assert.ok(server instanceof DevServer);
		assert.strictEqual(server.websocketServerPort, 3456);
	});

	test("should create dev server with options", () => {
		const router = new Router();
		const server = new DevServer(router, {
			timeout: 60000,
			keepAlive: true,
			websocketPort: 8080,
		});

		assert.ok(server instanceof DevServer);
		assert.strictEqual(server.options.timeout, 60000);
		assert.strictEqual(server.options.keepAlive, true);
		assert.strictEqual(server.websocketServerPort, 8080);
	});

	test("should inject auto-reload script into HTML", () => {
		const router = new Router();
		const server = new DevServer(router);

		const html = "<html><head></head><body><h1>Hello</h1></body></html>";
		const result = server.injectAutoReloadScript(html);

		assert.ok(result.includes("<script>"));
		assert.ok(result.includes("WebSocket"));
		assert.ok(result.includes("location.reload()"));
		assert.ok(result.includes("</script>"));
		assert.ok(result.includes("</body>"));
	});

	test("should handle server lifecycle", async () => {
		const router = new Router();
		router.get("/", (ctx) => {
			ctx.html("<html><body>Hello</body></html>");
		});

		const server = new DevServer(router);

		// WebSocket server should not exist initially
		assert.strictEqual(server.websocketServer, undefined);

		// Start server
		await server.listen(0); // Use port 0 for auto-assign
		assert.ok(server.server.listening);
		assert.ok(server.websocketServer); // WebSocket server should be created

		// Close server
		await server.close();
		assert.strictEqual(server.server.listening, false);
	});
});
