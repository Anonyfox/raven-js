import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "./context.js";
import { Route } from "./route.js";
import { Router } from "./router.js";

describe("Router", () => {
	it("should handle HTTP methods, routing, middleware, and core functionality", async () => {
		const router = new Router();
		const handler = async (ctx) => ctx.json({ success: true });

		// Test all HTTP methods (first route - creates trie)
		router.get("/users", handler);
		router.post("/users", handler);
		router.put("/users/1", handler);
		router.delete("/users/1", handler);
		router.patch("/users/1", handler);
		router.head("/users", handler);
		router.options("/users", handler);

		// Test second route for each method (trie already exists)
		router.get("/users2", handler);
		router.post("/users2", handler);
		router.put("/users/2", handler);
		router.delete("/users/2", handler);
		router.patch("/users/2", handler);
		router.head("/users2", handler);
		router.options("/users2", handler);

		// Test route registration and listRoutes
		const routes = router.listRoutes();
		assert.equal(routes.length, 14);
		assert.equal(routes[0].method, "GET");
		assert.equal(routes[13].method, "OPTIONS");

		// Test successful route matching
		const ctx = new Context(
			"GET",
			new URL("https://example.com/users"),
			new Headers(),
			null,
		);
		const result = await router.handleRequest(ctx);
		assert.equal(result.responseStatusCode, 200);
		assert.equal(result.responseBody, '{"success":true}');

		// Test route matching with no middleware (empty #coverts array)
		const noMiddlewareRouter = new Router();
		noMiddlewareRouter.get("/simple", async (ctx) =>
			ctx.json({ simple: true }),
		);
		const simpleResult = await noMiddlewareRouter.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/simple"),
				new Headers(),
				null,
			),
		);
		assert.equal(simpleResult.responseStatusCode, 200);

		// Test 404 scenarios
		const notFoundResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/notfound"),
				new Headers(),
				null,
			),
		);
		assert.equal(notFoundResult.responseStatusCode, 404);
		const methodExistsResult = await router.handleRequest(
			new Context(
				"POST",
				new URL("https://example.com/nonexistent"),
				new Headers(),
				null,
			),
		);
		assert.equal(methodExistsResult.responseStatusCode, 404);
		const trieExistsNoMatchResult = await router.handleRequest(
			new Context(
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

		router.use(middleware1);
		router.use(middleware2); // Should be ignored
		router.useEarly(middleware3);
		router.useEarly(middleware4); // Should be ignored
		router.use(middleware5); // Should be ignored
		router.use(middleware6);
		router.useEarly(middleware7);

		// Test middleware without identifier property
		const noIdentifierMiddleware = async (ctx) => {
			order.push(9);
			ctx.data.noIdentifier = true;
		};
		router.use(noIdentifierMiddleware);
		router.useEarly(noIdentifierMiddleware); // Should be added again since no identifier

		// Test route with path parameters
		router.get("/users/:id/posts/:postId", async (ctx) => {
			order.push(8);
			assert.equal(ctx.pathParams.id, "123");
			assert.equal(ctx.pathParams.postId, "456");
			assert.equal(ctx.data.step, 6);
			return ctx.json({ user: ctx.pathParams.id, post: ctx.pathParams.postId });
		});

		const paramResult = await router.handleRequest(
			new Context(
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

	it("should handle addRoute, path normalization, errors, and complex scenarios", async () => {
		const router = new Router();

		// Test addRoute with different scenarios
		const customRoute = Route.GET("/custom", async (ctx) =>
			ctx.json({ custom: true }),
		);
		router.addRoute(customRoute);
		const anotherRoute = Route.GET("/another", async (ctx) =>
			ctx.json({ another: true }),
		);
		router.addRoute(anotherRoute);
		const postRoute = Route.POST("/post-route", async (ctx) =>
			ctx.json({ post: true }),
		);
		router.addRoute(postRoute);

		// Test path normalization edge cases
		router.get("/normalized", async (ctx) => ctx.json({ normalized: true }));
		router.get("no-slash", async (ctx) => ctx.json({ noSlash: true }));
		router.get("/start-only", async (ctx) => ctx.json({ startOnly: true }));
		router.get("end-only/", async (ctx) => ctx.json({ endOnly: true }));
		router.get("neither-slash", async (ctx) =>
			ctx.json({ neitherSlash: true }),
		);
		router.get("", async (ctx) => ctx.json({ emptyPath: true }));
		router.get("/root", async (ctx) => ctx.json({ rootPath: true }));

		// Test route matching with normalized paths
		const customResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/custom"),
				new Headers(),
				null,
			),
		);
		assert.equal(customResult.responseStatusCode, 200);
		const postResult = await router.handleRequest(
			new Context(
				"POST",
				new URL("https://example.com/post-route"),
				new Headers(),
				null,
			),
		);
		assert.equal(postResult.responseStatusCode, 200);
		const normalizedResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/normalized"),
				new Headers(),
				null,
			),
		);
		assert.equal(normalizedResult.responseStatusCode, 200);
		const noSlashResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/no-slash"),
				new Headers(),
				null,
			),
		);
		assert.equal(noSlashResult.responseStatusCode, 200);
		const startOnlyResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/start-only"),
				new Headers(),
				null,
			),
		);
		assert.equal(startOnlyResult.responseStatusCode, 200);
		const endOnlyResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/end-only"),
				new Headers(),
				null,
			),
		);
		assert.equal(endOnlyResult.responseStatusCode, 200);
		const neitherSlashResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/neither-slash"),
				new Headers(),
				null,
			),
		);
		assert.equal(neitherSlashResult.responseStatusCode, 200);
		const emptyPathResult = await router.handleRequest(
			new Context("GET", new URL("https://example.com/"), new Headers(), null),
		);
		assert.equal(emptyPathResult.responseStatusCode, 200);
		const rootPathResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/root"),
				new Headers(),
				null,
			),
		);
		assert.equal(rootPathResult.responseStatusCode, 200);

		// Test listRoutes with and without method filter
		const getRoutes = router.listRoutes("GET");
		assert.equal(getRoutes.length, 9);
		const allRoutes = router.listRoutes();
		assert.equal(allRoutes.length, 10);
		assert.equal(allRoutes[0].method, "GET");
		assert.equal(allRoutes[2].method, "POST");

		// Test security, errors, and complex scenarios
		const longPath = `/${"a/".repeat(101)}`;
		const longPathResult = await router.handleRequest(
			new Context(
				"GET",
				new URL(`https://example.com${longPath}`),
				new Headers(),
				null,
			),
		);
		assert.equal(longPathResult.responseStatusCode, 500);

		router.get("/error", async () => {
			throw new Error("Handler error");
		});
		const errorResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/error"),
				new Headers(),
				null,
			),
		);
		assert.equal(errorResult.responseStatusCode, 500);

		router.use(async (ctx) => {
			ctx.responseStatusCode = 403;
			ctx.responseBody = "Forbidden";
			ctx.responseEnded = true;
		});
		const earlyResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/early"),
				new Headers(),
				null,
			),
		);
		assert.equal(earlyResult.responseStatusCode, 403);
		assert(earlyResult.responseEnded);

		router.get("/error-ended", async (ctx) => {
			ctx.responseEnded = true;
			throw new Error("Should not set 500");
		});
		const errorEndedResult = await router.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/error-ended"),
				new Headers(),
				null,
			),
		);
		assert(errorEndedResult.responseEnded);

		const errorEndedRouter = new Router();
		errorEndedRouter.get("/error-ended-2", async (ctx) => {
			ctx.responseEnded = true;
			ctx.responseStatusCode = 200;
			ctx.responseBody = "OK";
			throw new Error("Should not override response");
		});
		const errorEnded2Result = await errorEndedRouter.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/error-ended-2"),
				new Headers(),
				null,
			),
		);
		assert(errorEnded2Result.responseEnded);
		assert.equal(errorEnded2Result.responseStatusCode, 200);

		// Test method chaining and complex middleware chain
		const chainingRouter = new Router();
		const steps = [];

		chainingRouter
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

		assert.equal(chainingRouter.listRoutes().length, 5);
		const complexResult = await chainingRouter.handleRequest(
			new Context(
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
		chainingRouter.get("/continue", async (ctx) => {
			ctx.data.handlerRun = true;
		});
		const continueResult = await chainingRouter.handleRequest(
			new Context(
				"GET",
				new URL("https://example.com/continue"),
				new Headers(),
				null,
			),
		);
		assert(continueResult.data.handlerRun);
		assert(!continueResult.responseEnded);

		// Test handler that doesn't end response and has after callbacks
		const noResponseRouter = new Router();
		const afterCallbackOrder = [];
		noResponseRouter.get("/no-response", async (ctx) => {
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
		const noResponseResult = await noResponseRouter.handleRequest(
			new Context(
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
