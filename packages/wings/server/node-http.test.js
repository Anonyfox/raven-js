import assert from "node:assert";
import http from "node:http";
import net from "node:net";
import { describe, test } from "node:test";
import { Router } from "../core/index.js";
import { NodeHttp } from "./node-http.js";

describe("NodeHttp", () => {
	test("should create server with options", () => {
		const router = new Router();

		// Test default options
		const server1 = new NodeHttp(router);
		assert.deepStrictEqual(server1.options, {
			timeout: 30000,
			keepAlive: true,
			keepAliveTimeout: 5000,
			maxHeadersCount: 2000,
		});

		// Test custom options
		const customOptions = { timeout: 60000, keepAlive: false };
		const server2 = new NodeHttp(router, customOptions);
		assert.strictEqual(server2.options.timeout, 60000);
		assert.strictEqual(server2.options.keepAlive, false);
		assert.strictEqual(server2.options.keepAliveTimeout, 5000); // Default preserved

		// Test getter methods
		assert.ok(server1.server);
		assert.strictEqual(server1.router, router);

		// Test options immutability
		const originalOptions = server1.options;
		originalOptions.timeout = 99999;
		assert.strictEqual(server1.options.timeout, 30000);
	});

	test("should handle basic HTTP requests", async () => {
		const router = new Router();
		router
			.get("/test", (ctx) => ctx.json({ message: "Hello World" }))
			.post("/users", (ctx) => {
				const userData = ctx.requestBody();
				ctx.json({ id: 1, ...userData });
			})
			.get("/users/:id", (ctx) => {
				const userId = ctx.pathParams.id;
				if (userId === "999") {
					ctx.notFound("User not found");
				} else {
					ctx.json({ id: userId, name: "User" });
				}
			});

		const server = new NodeHttp(router);
		await server.listen(0);

		try {
			// Test GET request
			const getResponse = await makeRequest(
				server.server.address().port,
				"/test",
			);
			assert.strictEqual(getResponse.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(getResponse.body), {
				message: "Hello World",
			});

			// Test POST request with JSON body
			const postResponse = await makeRequest(
				server.server.address().port,
				"/users",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "John", email: "john@example.com" }),
				},
			);
			assert.strictEqual(postResponse.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(postResponse.body), {
				id: 1,
				name: "John",
				email: "john@example.com",
			});

			// Test path parameters and 404
			const userResponse = await makeRequest(
				server.server.address().port,
				"/users/123",
			);
			assert.strictEqual(userResponse.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(userResponse.body), {
				id: "123",
				name: "User",
			});

			const notFoundResponse = await makeRequest(
				server.server.address().port,
				"/users/999",
			);
			assert.strictEqual(notFoundResponse.statusCode, 404);
			assert.strictEqual(notFoundResponse.body, "User not found");

			// Test 404 for non-existent route
			const missingResponse = await makeRequest(
				server.server.address().port,
				"/missing",
			);
			assert.strictEqual(missingResponse.statusCode, 404);
		} finally {
			await server.close();
		}
	});

	test("should handle different HTTP methods and response types", async () => {
		const router = new Router();
		router
			.get("/resource", (ctx) => ctx.json({ method: "GET" }))
			.post("/resource", (ctx) => ctx.json({ method: "POST" }))
			.put("/resource", (ctx) => ctx.json({ method: "PUT" }))
			.delete("/resource", (ctx) => ctx.json({ method: "DELETE" }))
			.get("/text", (ctx) => ctx.text("Hello World"))
			.get("/html", (ctx) => ctx.html("<h1>Hello</h1>"))
			.get("/redirect", (ctx) => ctx.redirect("/target", 301));

		const server = new NodeHttp(router);
		await server.listen(0);

		try {
			// Test different HTTP methods
			const methods = ["GET", "POST", "PUT", "DELETE"];
			for (const method of methods) {
				const response = await makeRequest(
					server.server.address().port,
					"/resource",
					{ method },
				);
				assert.strictEqual(response.statusCode, 200);
				assert.deepStrictEqual(JSON.parse(response.body), { method });
			}

			// Test different response types
			const textResponse = await makeRequest(
				server.server.address().port,
				"/text",
			);
			assert.strictEqual(textResponse.statusCode, 200);
			assert.strictEqual(textResponse.headers["content-type"], "text/plain");
			assert.strictEqual(textResponse.body, "Hello World");

			const htmlResponse = await makeRequest(
				server.server.address().port,
				"/html",
			);
			assert.strictEqual(htmlResponse.statusCode, 200);
			assert.strictEqual(htmlResponse.headers["content-type"], "text/html");
			assert.strictEqual(htmlResponse.body, "<h1>Hello</h1>");

			// Test redirect
			const redirectResponse = await makeRequest(
				server.server.address().port,
				"/redirect",
			);
			assert.strictEqual(redirectResponse.statusCode, 301);
			assert.strictEqual(redirectResponse.headers.location, "/target");
		} finally {
			await server.close();
		}
	});

	test("should handle request bodies and headers", async () => {
		const router = new Router();
		router
			.post("/form", (ctx) => {
				const formData = ctx.requestBody();
				ctx.json(formData);
			})
			.post("/binary", (ctx) => {
				const body = ctx.requestBody();
				ctx.json({
					isBuffer: Buffer.isBuffer(body),
					size: body ? body.length : 0,
				});
			})
			.get("/headers", (ctx) => {
				ctx.responseHeaders.set("X-Custom-Header", "test-value");
				ctx.json({ message: "Headers set" });
			})
			.get("/query", (ctx) => {
				const query = ctx.queryParams.get("q");
				const page = ctx.queryParams.get("page") || "1";
				ctx.json({ query, page });
			});

		const server = new NodeHttp(router);
		await server.listen(0);

		try {
			// Test form data
			const formResponse = await makeRequest(
				server.server.address().port,
				"/form",
				{
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: "name=John&email=john@example.com",
				},
			);
			assert.strictEqual(formResponse.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(formResponse.body), {
				name: "John",
				email: "john@example.com",
			});

			// Test binary data
			const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
			const binaryResponse = await makeRequest(
				server.server.address().port,
				"/binary",
				{
					method: "POST",
					headers: { "Content-Type": "application/octet-stream" },
					body: binaryData,
				},
			);
			assert.strictEqual(binaryResponse.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(binaryResponse.body), {
				isBuffer: true,
				size: 4,
			});

			// Test response headers
			const headersResponse = await makeRequest(
				server.server.address().port,
				"/headers",
			);
			assert.strictEqual(headersResponse.statusCode, 200);
			assert.strictEqual(
				headersResponse.headers["x-custom-header"],
				"test-value",
			);

			// Test query parameters
			const queryResponse = await makeRequest(
				server.server.address().port,
				"/query?q=test&page=2",
			);
			assert.strictEqual(queryResponse.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(queryResponse.body), {
				query: "test",
				page: "2",
			});
		} finally {
			await server.close();
		}
	});

	test("should handle edge cases and errors", async () => {
		const router = new Router();
		router
			.get("/error", (_ctx) => {
				throw new Error("Something went wrong");
			})
			.get("/empty-error", (_ctx) => {
				const error = new Error("");
				throw error;
			})
			.get("/null-error", (_ctx) => {
				const error = new Error("Some message");
				error.message = null;
				throw error;
			})
			.post("/empty-body", (ctx) => {
				const body = ctx.requestBody();
				ctx.json({ hasBody: body !== null });
			})
			.get("/no-headers", (ctx) => {
				ctx.responseStatusCode = 200;
				ctx.responseBody = "No headers";
			});

		const server = new NodeHttp(router);
		await server.listen(0);

		try {
			// Test error handling
			const errorResponse = await makeRequest(
				server.server.address().port,
				"/error",
			);
			assert.strictEqual(errorResponse.statusCode, 500);
			assert.strictEqual(errorResponse.body, "Internal Server Error");

			const emptyErrorResponse = await makeRequest(
				server.server.address().port,
				"/empty-error",
			);
			assert.strictEqual(emptyErrorResponse.statusCode, 500);
			assert.strictEqual(emptyErrorResponse.body, "Internal Server Error");

			const nullErrorResponse = await makeRequest(
				server.server.address().port,
				"/null-error",
			);
			assert.strictEqual(nullErrorResponse.statusCode, 500);
			assert.strictEqual(nullErrorResponse.body, "Internal Server Error");

			// Test empty body
			const emptyBodyResponse = await makeRequest(
				server.server.address().port,
				"/empty-body",
				{ method: "POST" },
			);
			assert.strictEqual(emptyBodyResponse.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(emptyBodyResponse.body), {
				hasBody: false,
			});

			// Test response with no headers
			const noHeadersResponse = await makeRequest(
				server.server.address().port,
				"/no-headers",
			);
			assert.strictEqual(noHeadersResponse.statusCode, 200);
			assert.strictEqual(noHeadersResponse.body, "No headers");
			assert.ok(Object.keys(noHeadersResponse.headers).length > 0);
		} finally {
			await server.close();
		}
	});

	test("should handle server lifecycle and network edge cases", async () => {
		const router = new Router();
		router.post("/stream-error", (ctx) => {
			const body = ctx.requestBody();
			ctx.json({ body: body ? "has-body" : "no-body" });
		});

		const server = new NodeHttp(router);

		// Test listen with callback
		let callbackCalled = false;
		await server.listen(0, "localhost", () => {
			callbackCalled = true;
		});
		assert.ok(callbackCalled);

		try {
			// Test stream error handling
			const streamErrorResponse = await makeRequestWithActualStreamError(
				server.server.address().port,
				"/stream-error",
			);
			assert.ok(streamErrorResponse.statusCode);

			// Test server close with error
			await server.close();
			try {
				await server.close();
				assert.fail(
					"Should have thrown an error when closing already closed server",
				);
			} catch (error) {
				assert.ok(error instanceof Error);
			}
		} finally {
			// Ensure server is closed
			try {
				await server.close();
			} catch {
				// Ignore if already closed
			}
		}
	});

	test("should handle URL and host edge cases", async () => {
		const router = new Router();
		router.get("/host-test", (ctx) => {
			ctx.json({ host: ctx.requestHeaders.get("host") });
		});

		const server = new NodeHttp(router);
		await server.listen(0);

		try {
			// Test with explicit host header
			const response1 = await makeRequest(
				server.server.address().port,
				"/host-test",
				{
					headers: { Host: "example.com:3000" },
				},
			);
			assert.strictEqual(response1.statusCode, 200);
			assert.deepStrictEqual(JSON.parse(response1.body), {
				host: "example.com:3000",
			});

			// Test without host header (fallback)
			const response2 = await makeRequest(
				server.server.address().port,
				"/host-test",
				{
					headers: {},
				},
			);
			assert.strictEqual(response2.statusCode, 200);
			const result = JSON.parse(response2.body);
			assert.ok(result.host.startsWith("localhost:"));

			// Test with special characters in URL
			const response3 = await makeRequest(
				server.server.address().port,
				"/host-test?param=value%20with%20spaces",
			);
			assert.strictEqual(response3.statusCode, 200);
		} finally {
			await server.close();
		}
	});

	test("should handle router errors", async () => {
		// Create a mock router that throws an error
		const mockRouter = {
			handleRequest: async () => {
				throw new Error("Router error");
			},
		};

		const server = new NodeHttp(mockRouter);
		await server.listen(0);

		try {
			const response = await makeRequest(server.server.address().port, "/test");
			assert.strictEqual(response.statusCode, 500);
			assert.strictEqual(response.body, "Router error");
		} finally {
			await server.close();
		}
	});
});

/**
 * Helper function to make HTTP requests to the test server.
 */
async function makeRequest(port, path, options = {}) {
	return new Promise((resolve, reject) => {
		const req = http.request(
			{
				hostname: "localhost",
				port,
				path,
				method: options.method || "GET",
				headers: options.headers || {},
			},
			(res) => {
				let body = "";
				res.on("data", (chunk) => {
					body += chunk;
				});
				res.on("end", () => {
					resolve({
						statusCode: res.statusCode,
						headers: res.headers,
						body,
					});
				});
			},
		);

		req.on("error", reject);

		if (options.body) {
			req.write(options.body);
		}

		req.end();
	});
}

/**
 * Helper function to create a request that triggers a stream error.
 */
async function makeRequestWithActualStreamError(port, path) {
	return new Promise((resolve) => {
		const socket = net.connect(port, "localhost", () => {
			socket.write(`POST ${path} HTTP/1.1\r\n`);
			socket.write(`Host: localhost:${port}\r\n`);
			socket.write(`Content-Length: 10\r\n`);
			socket.write(`Content-Type: application/json\r\n`);
			socket.write(`\r\n`);
			socket.write(Buffer.from([0xff, 0xfe, 0xfd])); // Invalid UTF-8
			socket.end();
		});

		let responseData = "";
		socket.on("data", (chunk) => {
			responseData += chunk.toString();
		});

		socket.on("end", () => {
			const lines = responseData.split("\r\n");
			const statusLine = lines[0];
			const statusCode = parseInt(statusLine.split(" ")[1], 10);

			const headerEndIndex = responseData.indexOf("\r\n\r\n");
			const headers = {};
			const body = responseData.substring(headerEndIndex + 4);

			for (let i = 1; i < lines.length; i++) {
				const line = lines[i];
				if (line === "") break;
				const colonIndex = line.indexOf(":");
				if (colonIndex > 0) {
					const key = line.substring(0, colonIndex).toLowerCase();
					const value = line.substring(colonIndex + 1).trim();
					headers[key] = value;
				}
			}

			resolve({
				statusCode,
				headers,
				body,
			});
		});

		socket.on("error", () => {
			resolve({
				statusCode: 500,
				headers: {},
				body: "Connection error",
			});
		});
	});
}
