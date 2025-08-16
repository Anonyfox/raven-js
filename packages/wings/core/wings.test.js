import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Current } from "./current.js";
import { Feather } from "./feather.js";
import { Wings } from "./wings.js";

describe("Wings", () => {
	it("should handle HTTP methods, routing, middleware, and core functionality", async () => {
		const wings = new Wings();
		const handler = async (ctx) => ctx.json({ success: true });

		// Test all HTTP methods (first route - creates trie)
		wings.get("/users", handler);
		wings.post("/users", handler);
		wings.put("/users/1", handler);
		wings.delete("/users/1", handler);
		wings.patch("/users/1", handler);
		wings.head("/users", handler);
		wings.options("/users", handler);

		// Test second route for each method (trie already exists)
		wings.get("/users2", handler);
		wings.post("/users2", handler);
		wings.put("/users/2", handler);
		wings.delete("/users/2", handler);
		wings.patch("/users/2", handler);
		wings.head("/users2", handler);
		wings.options("/users2", handler);

		// Test route registration and listFeathers
		const feathers = wings.listFeathers();
		assert.equal(feathers.length, 14);
		assert.equal(feathers[0].method, "GET");
		assert.equal(feathers[13].method, "OPTIONS");

		// Test successful route matching
		const current = new Current(
			"GET",
			new URL("https://example.com/users"),
			new Headers(),
			null,
		);
		const result = await wings.handleRequest(current);
		assert.equal(result.responseStatusCode, 200);
		assert.equal(result.responseBody, '{"success":true}');

		// Test route matching with no middleware (empty #coverts array)
		const noMiddlewareWings = new Wings();
		noMiddlewareWings.get("/simple", async (ctx) => ctx.json({ simple: true }));
		const simpleResult = await noMiddlewareWings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/simple"),
				new Headers(),
				null,
			),
		);
		assert.equal(simpleResult.responseStatusCode, 200);

		// Test 404 scenarios
		const notFoundResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/notfound"),
				new Headers(),
				null,
			),
		);
		assert.equal(notFoundResult.responseStatusCode, 404);
		const methodExistsResult = await wings.handleRequest(
			new Current(
				"POST",
				new URL("https://example.com/nonexistent"),
				new Headers(),
				null,
			),
		);
		assert.equal(methodExistsResult.responseStatusCode, 404);
		const trieExistsNoMatchResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/users/nonexistent"),
				new Headers(),
				null,
			),
		);
		assert.equal(trieExistsNoMatchResult.responseStatusCode, 404);

		// Test middleware with identifiers and deduplication
		const order = [];
		const middleware1 = async (ctx) => {
			order.push(1);
			ctx.data.step = 1;
		};
		middleware1.identifier = "auth";
		const middleware2 = async (ctx) => {
			order.push(2);
			ctx.data.step = 2;
		};
		middleware2.identifier = "auth"; // Same identifier - should be ignored
		const middleware3 = async (ctx) => {
			order.push(3);
			ctx.data.step = 3;
		};
		const middleware4 = async (ctx) => {
			order.push(4);
			ctx.data.step = 4;
		};
		middleware4.identifier = "auth"; // Should be ignored
		const middleware5 = async (ctx) => {
			order.push(5);
			ctx.data.step = 5;
		};
		middleware5.identifier = "auth"; // Should be ignored
		const middleware6 = async (ctx) => {
			order.push(6);
			ctx.data.step = 6;
		};
		const middleware7 = async (ctx) => {
			order.push(7);
			ctx.data.step = 7;
		};

		wings.use(middleware1);
		wings.use(middleware2); // Should be ignored
		wings.useEarly(middleware3);
		wings.useEarly(middleware4); // Should be ignored
		wings.use(middleware5); // Should be ignored
		wings.use(middleware6);
		wings.useEarly(middleware7);

		// Test middleware without identifier property
		const noIdentifierMiddleware = async (ctx) => {
			order.push(9);
			ctx.data.noIdentifier = true;
		};
		wings.use(noIdentifierMiddleware);
		wings.useEarly(noIdentifierMiddleware); // Should be added again since no identifier

		// Test route with path parameters
		wings.get("/users/:id/posts/:postId", async (ctx) => {
			order.push(8);
			assert.equal(ctx.pathParams.id, "123");
			assert.equal(ctx.pathParams.postId, "456");
			assert.equal(ctx.data.step, 6);
			return ctx.json({ user: ctx.pathParams.id, post: ctx.pathParams.postId });
		});

		const paramResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/users/123/posts/456"),
				new Headers(),
				null,
			),
		);
		assert.deepEqual(order, [9, 7, 3, 1, 6, 9, 8]);
		assert.equal(paramResult.responseStatusCode, 200);
		assert.equal(paramResult.responseBody, '{"user":"123","post":"456"}');
	});

	it("should handle addFeather, path normalization, errors, and complex scenarios", async () => {
		const wings = new Wings();

		// Test addFeather with different scenarios
		const customFeather = Feather.GET("/custom", async (ctx) =>
			ctx.json({ custom: true }),
		);
		wings.addFeather(customFeather);
		const anotherFeather = Feather.GET("/another", async (ctx) =>
			ctx.json({ another: true }),
		);
		wings.addFeather(anotherFeather);
		const postFeather = Feather.POST("/post-route", async (ctx) =>
			ctx.json({ post: true }),
		);
		wings.addFeather(postFeather);

		// Test path normalization edge cases
		wings.get("/normalized", async (ctx) => ctx.json({ normalized: true }));
		wings.get("no-slash", async (ctx) => ctx.json({ noSlash: true }));
		wings.get("/start-only", async (ctx) => ctx.json({ startOnly: true }));
		wings.get("end-only/", async (ctx) => ctx.json({ endOnly: true }));
		wings.get("neither-slash", async (ctx) => ctx.json({ neitherSlash: true }));
		wings.get("", async (ctx) => ctx.json({ emptyPath: true }));
		wings.get("/root", async (ctx) => ctx.json({ rootPath: true }));

		// Test route matching with normalized paths
		const customResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/custom"),
				new Headers(),
				null,
			),
		);
		assert.equal(customResult.responseStatusCode, 200);
		const postResult = await wings.handleRequest(
			new Current(
				"POST",
				new URL("https://example.com/post-route"),
				new Headers(),
				null,
			),
		);
		assert.equal(postResult.responseStatusCode, 200);
		const normalizedResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/normalized"),
				new Headers(),
				null,
			),
		);
		assert.equal(normalizedResult.responseStatusCode, 200);
		const noSlashResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/no-slash"),
				new Headers(),
				null,
			),
		);
		assert.equal(noSlashResult.responseStatusCode, 200);
		const startOnlyResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/start-only"),
				new Headers(),
				null,
			),
		);
		assert.equal(startOnlyResult.responseStatusCode, 200);
		const endOnlyResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/end-only"),
				new Headers(),
				null,
			),
		);
		assert.equal(endOnlyResult.responseStatusCode, 200);
		const neitherSlashResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/neither-slash"),
				new Headers(),
				null,
			),
		);
		assert.equal(neitherSlashResult.responseStatusCode, 200);
		const emptyPathResult = await wings.handleRequest(
			new Current("GET", new URL("https://example.com/"), new Headers(), null),
		);
		assert.equal(emptyPathResult.responseStatusCode, 200);
		const rootPathResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/root"),
				new Headers(),
				null,
			),
		);
		assert.equal(rootPathResult.responseStatusCode, 200);

		// Test listFeathers with and without method filter
		const getFeathers = wings.listFeathers("GET");
		assert.equal(getFeathers.length, 9);
		const allFeathers = wings.listFeathers();
		assert.equal(allFeathers.length, 10);
		assert.equal(allFeathers[0].method, "GET");
		assert.equal(allFeathers[2].method, "POST");

		// Test security, errors, and complex scenarios
		const longPath = `/${"a/".repeat(101)}`;
		const longPathResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL(`https://example.com${longPath}`),
				new Headers(),
				null,
			),
		);
		assert.equal(longPathResult.responseStatusCode, 500);

		wings.get("/error", async () => {
			throw new Error("Handler error");
		});
		const errorResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/error"),
				new Headers(),
				null,
			),
		);
		assert.equal(errorResult.responseStatusCode, 500);

		wings.use(async (ctx) => {
			ctx.responseStatusCode = 403;
			ctx.responseBody = "Forbidden";
			ctx.responseEnded = true;
		});
		const earlyResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/early"),
				new Headers(),
				null,
			),
		);
		assert.equal(earlyResult.responseStatusCode, 403);
		assert(earlyResult.responseEnded);

		wings.get("/error-ended", async (ctx) => {
			ctx.responseEnded = true;
			throw new Error("Should not set 500");
		});
		const errorEndedResult = await wings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/error-ended"),
				new Headers(),
				null,
			),
		);
		assert(errorEndedResult.responseEnded);

		const errorEndedWings = new Wings();
		errorEndedWings.get("/error-ended-2", async (ctx) => {
			ctx.responseEnded = true;
			ctx.responseStatusCode = 200;
			ctx.responseBody = "OK";
			throw new Error("Should not override response");
		});
		const errorEnded2Result = await errorEndedWings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/error-ended-2"),
				new Headers(),
				null,
			),
		);
		assert(errorEnded2Result.responseEnded);
		assert.equal(errorEnded2Result.responseStatusCode, 200);

		// Test method chaining and complex middleware chain
		const chainingWings = new Wings();
		const steps = [];

		chainingWings
			.get("/users", async (ctx) => ctx.json({ users: [] }))
			.post("/users", async (ctx) => ctx.json({ created: true }))
			.put("/users/1", async (ctx) => ctx.json({ updated: true }))
			.delete("/users/1", async (ctx) => ctx.json({ deleted: true }))
			.use(async (ctx) => {
				steps.push("before1");
				ctx.data.before1 = true;
			})
			.use(async (ctx) => {
				steps.push("before2");
				ctx.data.before2 = true;
			})
			.get("/complex", async (ctx) => {
				steps.push("handler");
				ctx.addAfterCallback(async (ctx) => {
					steps.push("after1");
					ctx.data.after1 = true;
				});
				ctx.addAfterCallback(async (ctx) => {
					steps.push("after2");
					ctx.data.after2 = true;
				});
				return ctx.json({ complex: true });
			});

		assert.equal(chainingWings.listFeathers().length, 5);
		const complexResult = await chainingWings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/complex"),
				new Headers(),
				null,
			),
		);
		assert.deepEqual(steps, [
			"before1",
			"before2",
			"handler",
			"after1",
			"after2",
		]);
		assert.equal(complexResult.responseStatusCode, 200);
		assert(complexResult.data.before1);
		assert(complexResult.data.after1);

		// Test handler that doesn't end response
		chainingWings.get("/continue", async (ctx) => {
			ctx.data.handlerRun = true;
		});
		const continueResult = await chainingWings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/continue"),
				new Headers(),
				null,
			),
		);
		assert(continueResult.data.handlerRun);
		assert(!continueResult.responseEnded);

		// Test handler that doesn't end response and has after callbacks
		const noResponseWings = new Wings();
		const afterCallbackOrder = [];
		noResponseWings.get("/no-response", async (ctx) => {
			ctx.data.handlerRun = true;
			ctx.addAfterCallback(async (ctx) => {
				afterCallbackOrder.push("after1");
				ctx.data.after1 = true;
			});
			ctx.addAfterCallback(async (ctx) => {
				afterCallbackOrder.push("after2");
				ctx.data.after2 = true;
			});
		});
		const noResponseResult = await noResponseWings.handleRequest(
			new Current(
				"GET",
				new URL("https://example.com/no-response"),
				new Headers(),
				null,
			),
		);
		assert(noResponseResult.data.handlerRun);
		assert(noResponseResult.data.after1);
		assert(noResponseResult.data.after2);
		assert.deepEqual(afterCallbackOrder, ["after1", "after2"]);
		assert(!noResponseResult.responseEnded);
	});
});
