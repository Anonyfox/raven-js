import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Context } from "./context.js";
import { getHttpMethods, HTTP_METHODS } from "./http-methods.js";
import { Middleware } from "./middleware.js";
import { Route } from "./route.js";
import { Router } from "./router.js";

describe("Router", () => {
	let router;

	beforeEach(() => {
		router = new Router();
	});

	afterEach(() => {
		router = null;
	});

	describe("constructor", () => {
		it("should initialize with all HTTP method tries", () => {
			const router = new Router();
			const methods = getHttpMethods();

			// Check that all HTTP methods have tries initialized
			methods.forEach((method) => {
				assert.ok(router.listRoutes(method));
				assert.strictEqual(router.listRoutes(method).length, 0);
			});
		});
	});

	describe("HTTP method shortcuts", () => {
		const testMethods = [
			{ method: "get", httpMethod: HTTP_METHODS.GET },
			{ method: "post", httpMethod: HTTP_METHODS.POST },
			{ method: "put", httpMethod: HTTP_METHODS.PUT },
			{ method: "delete", httpMethod: HTTP_METHODS.DELETE },
			{ method: "patch", httpMethod: HTTP_METHODS.PATCH },
			{ method: "head", httpMethod: HTTP_METHODS.HEAD },
			{ method: "options", httpMethod: HTTP_METHODS.OPTIONS },
		];

		testMethods.forEach(({ method, httpMethod }) => {
			it(`should add ${method.toUpperCase()} route and return router for chaining`, () => {
				const handler = async (ctx) => {
					ctx.body = "test";
				};

				const result = router[method]("/test", handler);

				assert.strictEqual(result, router);
				assert.strictEqual(router.listRoutes(httpMethod).length, 1);
				assert.strictEqual(router.listRoutes(httpMethod)[0].method, httpMethod);
				assert.strictEqual(router.listRoutes(httpMethod)[0].path, "/test");
			});

			it(`should handle ${method.toUpperCase()} route with leading/trailing slashes`, () => {
				const handler = async (ctx) => {
					ctx.body = "test";
				};

				router[method]("///test///", handler);

				assert.strictEqual(router.listRoutes(httpMethod).length, 1);
				assert.strictEqual(router.listRoutes(httpMethod)[0].path, "///test///");
			});
		});
	});

	describe("addRoute", () => {
		it("should add a valid route and return router for chaining", () => {
			const route = Route.GET("/test", async (ctx) => {
				ctx.body = "test";
			});

			const result = router.addRoute(route);

			assert.strictEqual(result, router);
			assert.strictEqual(router.listRoutes(HTTP_METHODS.GET).length, 1);
			assert.strictEqual(router.listRoutes(HTTP_METHODS.GET)[0], route);
		});

		it("should throw error for unsupported HTTP method", () => {
			const invalidRoute = {
				method: "INVALID",
				path: "/test",
				handler: async (ctx) => {
					ctx.body = "test";
				},
			};

			assert.throws(() => {
				router.addRoute(invalidRoute);
			}, /Unsupported HTTP method: INVALID/);
		});

		it("should handle route with normalized path", () => {
			const route = Route.POST("/test/path", async (ctx) => {
				ctx.body = "test";
			});

			router.addRoute(route);

			assert.strictEqual(router.listRoutes(HTTP_METHODS.POST).length, 1);
			assert.strictEqual(router.listRoutes(HTTP_METHODS.POST)[0], route);
		});
	});

	describe("use", () => {
		it("should add middleware and return router for chaining", () => {
			const middleware = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "test");

			const result = router.use(middleware);

			assert.strictEqual(result, router);
		});

		it("should not add duplicate middleware with same identifier", () => {
			const middleware1 = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "test");
			const middleware2 = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "test");

			router.use(middleware1);
			const result = router.use(middleware2);

			assert.strictEqual(result, router);
			// Should only have one middleware
			assert.strictEqual(router.listRoutes().length, 0);
		});

		it("should add middleware without identifier", () => {
			const middleware = new Middleware(async (_ctx) => {
				// Middleware logic
			}, null);

			const result = router.use(middleware);

			assert.strictEqual(result, router);
		});
	});

	describe("useEarly", () => {
		it("should prepend middleware and return router for chaining", () => {
			const middleware = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "test");

			const result = router.useEarly(middleware);

			assert.strictEqual(result, router);
		});

		it("should not prepend duplicate middleware with same identifier", () => {
			const middleware1 = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "test");
			const middleware2 = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "test");

			router.useEarly(middleware1);
			const result = router.useEarly(middleware2);

			assert.strictEqual(result, router);
		});

		it("should prepend middleware without identifier", () => {
			const middleware = new Middleware(async (_ctx) => {
				// Middleware logic
			}, null);

			const result = router.useEarly(middleware);

			assert.strictEqual(result, router);
		});
	});

	describe("handleRequest", () => {
		it("should handle request with matching route", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = "test response";
			};

			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseBody, "test response");
		});

		it("should handle request with path parameters", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = `User ID: ${ctx.pathParams.id}`;
			};

			router.get("/users/:id", handler);

			const url = new URL("http://localhost/users/123");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(ctx.pathParams.id, "123");
			assert.strictEqual(ctx.responseBody, "User ID: 123");
		});

		it("should return 404 for non-matching route", async () => {
			const url = new URL("http://localhost/nonexistent");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseStatusCode, 404);
		});

		it("should handle request with unsupported HTTP method", async () => {
			// Create a context with a valid method first
			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			// Manually set an invalid method to test Router's handling
			Object.defineProperty(ctx, "method", {
				get: () => "INVALID",
			});

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseStatusCode, 404);
		});

		it("should run middleware before handler", async () => {
			let middlewareCalled = false;
			let handlerCalled = false;

			const middleware = new Middleware(async (_ctx) => {
				middlewareCalled = true;
			}, "test");

			const handler = async (ctx) => {
				handlerCalled = true;
				ctx.responseBody = "test";
			};

			router.use(middleware);
			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(middlewareCalled, true);
			assert.strictEqual(handlerCalled, true);
		});

		it("should stop execution if middleware ends response", async () => {
			let handlerCalled = false;

			const middleware = new Middleware(async (ctx) => {
				ctx.responseStatusCode = 403;
				ctx.responseBody = "Forbidden";
				ctx.responseEnded = true; // Mark response as ended
			}, "test");

			const handler = async (ctx) => {
				handlerCalled = true;
				ctx.responseBody = "test";
			};

			router.use(middleware);
			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(handlerCalled, false);
			assert.strictEqual(ctx.responseStatusCode, 403);
			assert.strictEqual(ctx.responseBody, "Forbidden");
		});

		it("should handle handler errors gracefully", async () => {
			const handler = async (_ctx) => {
				throw new Error("Handler error");
			};

			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseStatusCode, 500);
		});

		it("should not call error handler if response already ended", async () => {
			const handler = async (ctx) => {
				ctx.responseStatusCode = 200;
				ctx.responseBody = "Success";
				ctx.responseEnded = true; // Mark response as ended
				throw new Error("Handler error");
			};

			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseStatusCode, 200);
			assert.strictEqual(ctx.responseBody, "Success");
		});

		it("should run after callbacks if response not ended", async () => {
			let afterCallbackCalled = false;

			const middleware = new Middleware(async (_ctx) => {
				afterCallbackCalled = true;
			}, "after");

			const handler = async (ctx) => {
				ctx.responseBody = "test";
			};

			router.use(middleware);
			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(afterCallbackCalled, true);
		});

		it("should not run after callbacks if response ended", async () => {
			let afterCallbackCalled = false;

			// Add an after callback directly to the context
			const afterMiddleware = new Middleware(async (_ctx) => {
				afterCallbackCalled = true;
			}, "after");

			const handler = async (ctx) => {
				ctx.responseStatusCode = 200;
				ctx.responseBody = "Success";
				ctx.responseEnded = true; // End response
				// Add after callback
				ctx.addAfterCallback(afterMiddleware);
			};

			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(afterCallbackCalled, false);
		});

		it("should normalize path with leading/trailing slashes", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = "test";
			};

			router.get("test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(ctx.responseBody, "test");
		});
	});

	describe("listRoutes", () => {
		it("should return all routes when no method specified", () => {
			router.get("/test1", async (_ctx) => {});
			router.post("/test2", async (_ctx) => {});
			router.put("/test3", async (_ctx) => {});

			const routes = router.listRoutes();

			assert.strictEqual(routes.length, 3);
		});

		it("should return filtered routes for specific method", () => {
			router.get("/test1", async (_ctx) => {});
			router.get("/test2", async (_ctx) => {});
			router.post("/test3", async (_ctx) => {});

			const getRoutes = router.listRoutes(HTTP_METHODS.GET);
			const postRoutes = router.listRoutes(HTTP_METHODS.POST);

			assert.strictEqual(getRoutes.length, 2);
			assert.strictEqual(postRoutes.length, 1);
			assert.strictEqual(getRoutes[0].method, HTTP_METHODS.GET);
			assert.strictEqual(postRoutes[0].method, HTTP_METHODS.POST);
		});

		it("should return empty array for non-existent method", () => {
			const routes = router.listRoutes("INVALID");

			assert.strictEqual(routes.length, 0);
		});

		it("should return empty array when no routes exist", () => {
			const routes = router.listRoutes();

			assert.strictEqual(routes.length, 0);
		});
	});

	describe("path normalization", () => {
		it("should handle empty path", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = "root";
			};

			router.get("", handler);

			const url = new URL("http://localhost/");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(ctx.responseBody, "root");
		});

		it("should handle single slash path", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = "root";
			};

			router.get("/", handler);

			const url = new URL("http://localhost/");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(ctx.responseBody, "root");
		});

		it("should handle multiple leading/trailing slashes", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = "test";
			};

			router.get("///test///", handler);

			const url = new URL("http://localhost///test///");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(ctx.responseBody, "test");
		});
	});

	describe("complex routing scenarios", () => {
		it("should handle multiple routes with different methods", async () => {
			router.get("/users", async (ctx) => {
				ctx.responseBody = "GET users";
			});
			router.post("/users", async (ctx) => {
				ctx.responseBody = "POST users";
			});
			router.put("/users/:id", async (ctx) => {
				ctx.responseBody = `PUT user ${ctx.pathParams.id}`;
			});

			// Test GET
			const getUrl = new URL("http://localhost/users");
			const getCtx = new Context(HTTP_METHODS.GET, getUrl, new Headers());
			await router.handleRequest(getCtx);
			assert.strictEqual(getCtx.responseBody, "GET users");

			// Test POST
			const postUrl = new URL("http://localhost/users");
			const postCtx = new Context(HTTP_METHODS.POST, postUrl, new Headers());
			await router.handleRequest(postCtx);
			assert.strictEqual(postCtx.responseBody, "POST users");

			// Test PUT with params
			const putUrl = new URL("http://localhost/users/123");
			const putCtx = new Context(HTTP_METHODS.PUT, putUrl, new Headers());
			await router.handleRequest(putCtx);
			assert.strictEqual(putCtx.responseBody, "PUT user 123");
		});

		it("should handle chaining of route methods", () => {
			const result = router
				.get("/test1", async (_ctx) => {})
				.post("/test2", async (_ctx) => {})
				.put("/test3", async (_ctx) => {});

			assert.strictEqual(result, router);
			assert.strictEqual(router.listRoutes().length, 3);
		});

		it("should handle chaining of middleware methods", () => {
			const middleware1 = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "m1");
			const middleware2 = new Middleware(async (_ctx) => {
				// Middleware logic
			}, "m2");

			const result = router.use(middleware1).useEarly(middleware2);

			assert.strictEqual(result, router);
		});

		it("should handle complex middleware chain", async () => {
			const executionOrder = [];

			const middleware1 = new Middleware(async (_ctx) => {
				executionOrder.push("before1");
				executionOrder.push("after1");
			}, "m1");

			const middleware2 = new Middleware(async (_ctx) => {
				executionOrder.push("before2");
				executionOrder.push("after2");
			}, "m2");

			const handler = async (ctx) => {
				executionOrder.push("handler");
				ctx.responseBody = "test";
			};

			router.use(middleware1);
			router.use(middleware2);
			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.deepStrictEqual(executionOrder, [
				"before1",
				"after1",
				"before2",
				"after2",
				"handler",
			]);
		});
	});

	describe("edge cases and error handling", () => {
		it("should handle async handler that throws", async () => {
			const handler = async (_ctx) => {
				throw new Error("Async error");
			};

			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseStatusCode, 500);
		});

		it("should handle sync handler that throws", async () => {
			const handler = (_ctx) => {
				throw new Error("Sync error");
			};

			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseStatusCode, 500);
		});

		it("should handle middleware that throws", async () => {
			const middleware = new Middleware(async (_ctx) => {
				throw new Error("Middleware error");
			}, "error");

			const handler = async (ctx) => {
				ctx.responseBody = "test";
			};

			router.use(middleware);
			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			assert.strictEqual(ctx.responseStatusCode, 500);
		});

		it("should handle context with null/undefined values", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = "test";
			};

			router.get("/test", handler);

			const url = new URL("http://localhost/test");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			const result = await router.handleRequest(ctx);

			assert.strictEqual(result, ctx);
			// The route exists, so it should be 200, not 404
			assert.strictEqual(ctx.responseStatusCode, 200);
		});

		it("should handle route with empty path segments", async () => {
			const handler = async (ctx) => {
				ctx.responseBody = "test";
			};

			router.get("//", handler);

			const url = new URL("http://localhost//");
			const ctx = new Context(HTTP_METHODS.GET, url, new Headers());

			await router.handleRequest(ctx);

			assert.strictEqual(ctx.responseBody, "test");
		});
	});
});
