import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "./context.js";
import { HTTP_METHODS } from "./http-methods.js";
import { Route } from "./route.js";

describe("Route", () => {
	it("should create routes with all HTTP methods and handle options", () => {
		const handler = () => {};
		const middleware = [() => {}];
		const constraints = { id: "\\d+" };
		const description = "Get user by ID";

		// Test all HTTP methods
		const getRoute = Route.GET("/users", handler);
		const postRoute = Route.POST("/users", handler);
		const putRoute = Route.PUT("/users/1", handler);
		const deleteRoute = Route.DELETE("/users/1", handler);
		const patchRoute = Route.PATCH("/users/1", handler);
		const headRoute = Route.HEAD("/users", handler);
		const optionsRoute = Route.OPTIONS("/users", handler);

		[
			getRoute,
			postRoute,
			putRoute,
			deleteRoute,
			patchRoute,
			headRoute,
			optionsRoute,
		].forEach((route) => {
			assert.equal(route.handler, handler);
			assert.deepEqual(route.middleware, []);
			assert.deepEqual(route.constraints, {});
			assert.equal(route.description, "");
		});

		assert.equal(getRoute.method, HTTP_METHODS.GET);
		assert.equal(postRoute.method, HTTP_METHODS.POST);
		assert.equal(putRoute.method, HTTP_METHODS.PUT);
		assert.equal(deleteRoute.method, HTTP_METHODS.DELETE);
		assert.equal(patchRoute.method, HTTP_METHODS.PATCH);
		assert.equal(headRoute.method, HTTP_METHODS.HEAD);
		assert.equal(optionsRoute.method, HTTP_METHODS.OPTIONS);

		// Test with options
		const routeWithOptions = Route.GET("/users/:id", handler, {
			middleware,
			constraints,
			description,
		});

		assert.equal(routeWithOptions.method, HTTP_METHODS.GET);
		assert.equal(routeWithOptions.path, "/users/:id");
		assert.equal(routeWithOptions.handler, handler);
		assert.deepEqual(routeWithOptions.middleware, middleware);
		assert.deepEqual(routeWithOptions.constraints, constraints);
		assert.equal(routeWithOptions.description, description);

		// Test partial options
		const routePartial = Route.POST("/users", handler, { middleware });
		assert.deepEqual(routePartial.middleware, middleware);
		assert.deepEqual(routePartial.constraints, {});
		assert.equal(routePartial.description, "");

		// Test empty options
		const routeEmpty = Route.GET("/users", handler, {});
		assert.deepEqual(routeEmpty.middleware, []);
		assert.deepEqual(routeEmpty.constraints, {});
		assert.equal(routeEmpty.description, "");
	});

	it("should handle instance properties and edge cases", () => {
		// Test constructor and defaults
		const route = new Route();
		assert(route instanceof Route);
		assert.equal(route.method, HTTP_METHODS.GET);
		assert.equal(route.path, "");
		assert.equal(typeof route.handler, "function");
		assert.deepEqual(route.middleware, []);
		assert.deepEqual(route.constraints, {});
		assert.equal(route.description, "");

		// Test default handler
		const mockCtx = new Context(
			"GET",
			new URL("https://example.com/"),
			new Headers(),
			null,
		);
		const result = route.handler(mockCtx);
		assert.equal(result, undefined);

		// Test property modification
		const handler = () => {};
		route.method = HTTP_METHODS.POST;
		route.path = "/custom";
		route.handler = handler;
		route.middleware = [() => {}];
		route.constraints = { custom: "value" };
		route.description = "Custom route";

		assert.equal(route.method, HTTP_METHODS.POST);
		assert.equal(route.path, "/custom");
		assert.equal(route.handler, handler);
		assert.equal(route.middleware.length, 1);
		assert.deepEqual(route.constraints, { custom: "value" });
		assert.equal(route.description, "Custom route");

		// Test edge cases
		const emptyPath = Route.GET("", handler);
		assert.equal(emptyPath.path, "");
		assert.equal(emptyPath.handler, handler);

		const complexPath = Route.GET("/users/:id/posts/:postId/comments", handler);
		assert.equal(complexPath.path, "/users/:id/posts/:postId/comments");
		assert.equal(complexPath.handler, handler);
	});

	it("should handle null and undefined options gracefully", () => {
		const handler = () => {};

		// Test with null options
		const routeWithNull = Route.GET("/test", handler, null);
		assert.deepEqual(routeWithNull.middleware, []);
		assert.deepEqual(routeWithNull.constraints, {});
		assert.equal(routeWithNull.description, "");

		// Test with undefined options
		const routeWithUndefined = Route.GET("/test", handler, undefined);
		assert.deepEqual(routeWithUndefined.middleware, []);
		assert.deepEqual(routeWithUndefined.constraints, {});
		assert.equal(routeWithUndefined.description, "");

		// Test with partial null/undefined in options
		const routePartialNull = Route.GET("/test", handler, {
			middleware: null,
			constraints: undefined,
			description: null,
		});
		assert.deepEqual(routePartialNull.middleware, []);
		assert.deepEqual(routePartialNull.constraints, {});
		assert.equal(routePartialNull.description, "");
	});

	it("should handle edge case paths", () => {
		const handler = () => {};

		// Test various path edge cases
		const paths = [
			"",
			"/",
			"//",
			"/users/",
			"/users//posts",
			"/users/:id",
			"/users/:id/",
			"/users/:id//posts",
			"/users/:id/posts/:postId",
			"/users/:id/posts/:postId/",
			"/users/:id/posts/:postId//comments",
			"/users/:id/posts/:postId/comments/:commentId",
			"/users/:id/posts/:postId/comments/:commentId/",
			"/users/:id/posts/:postId/comments/:commentId//replies",
			"/users/:id/posts/:postId/comments/:commentId/replies/:replyId",
			"/users/:id/posts/:postId/comments/:commentId/replies/:replyId/",
			"/users/:id/posts/:postId/comments/:commentId/replies/:replyId//likes",
			"/users/:id/posts/:postId/comments/:commentId/replies/:replyId/likes/:likeId",
			"/users/:id/posts/:postId/comments/:commentId/replies/:replyId/likes/:likeId/",
		];

		paths.forEach((path) => {
			const route = Route.GET(path, handler);
			assert.equal(route.path, path);
			assert.equal(route.handler, handler);
			assert.equal(route.method, HTTP_METHODS.GET);
		});
	});

	it("should handle various middleware configurations", () => {
		const handler = () => {};

		// Test empty middleware array
		const routeEmptyMiddleware = Route.GET("/test", handler, {
			middleware: [],
		});
		assert.deepEqual(routeEmptyMiddleware.middleware, []);

		// Test single middleware function
		const singleMiddleware = () => {};
		const routeSingle = Route.GET("/test", handler, {
			middleware: [singleMiddleware],
		});
		assert.deepEqual(routeSingle.middleware, [singleMiddleware]);

		// Test multiple middleware functions
		const middleware1 = () => {};
		const middleware2 = () => {};
		const middleware3 = () => {};
		const routeMultiple = Route.GET("/test", handler, {
			middleware: [middleware1, middleware2, middleware3],
		});
		assert.deepEqual(routeMultiple.middleware, [
			middleware1,
			middleware2,
			middleware3,
		]);

		// Test middleware with null/undefined values (should be filtered out)
		const routeWithNulls = Route.GET("/test", handler, {
			middleware: [middleware1, null, middleware2, undefined, middleware3],
		});
		assert.deepEqual(routeWithNulls.middleware, [
			middleware1,
			middleware2,
			middleware3,
		]);
	});

	it("should handle various constraints configurations", () => {
		const handler = () => {};

		// Test empty constraints
		const routeEmptyConstraints = Route.GET("/test", handler, {
			constraints: {},
		});
		assert.deepEqual(routeEmptyConstraints.constraints, {});

		// Test simple constraints
		const simpleConstraints = { id: "\\d+", name: "[a-zA-Z]+" };
		const routeSimple = Route.GET("/test", handler, {
			constraints: simpleConstraints,
		});
		assert.deepEqual(routeSimple.constraints, simpleConstraints);

		// Test complex constraints
		const complexConstraints = {
			id: "\\d+",
			name: "[a-zA-Z]+",
			email: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
			date: "\\d{4}-\\d{2}-\\d{2}",
			uuid: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
		};
		const routeComplex = Route.GET("/test", handler, {
			constraints: complexConstraints,
		});
		assert.deepEqual(routeComplex.constraints, complexConstraints);

		// Test constraints with null/undefined values (should be filtered out)
		const constraintsWithNulls = {
			id: "\\d+",
			name: null,
			email: undefined,
			date: "\\d{4}-\\d{2}-\\d{2}",
		};
		const routeWithNulls = Route.GET("/test", handler, {
			constraints: constraintsWithNulls,
		});
		assert.deepEqual(routeWithNulls.constraints, constraintsWithNulls);
	});

	it("should handle description edge cases", () => {
		const handler = () => {};

		// Test empty description
		const routeEmptyDesc = Route.GET("/test", handler, { description: "" });
		assert.equal(routeEmptyDesc.description, "");

		// Test long description
		const longDescription =
			"This is a very long description that might be used for documentation purposes. It could contain multiple sentences and various characters like !@#$%^&*()_+-=[]{}|;':\",./<>?";
		const routeLongDesc = Route.GET("/test", handler, {
			description: longDescription,
		});
		assert.equal(routeLongDesc.description, longDescription);

		// Test description with special characters
		const specialDesc =
			"Route with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";
		const routeSpecial = Route.GET("/test", handler, {
			description: specialDesc,
		});
		assert.equal(routeSpecial.description, specialDesc);

		// Test description with unicode characters
		const unicodeDesc = "Route with unicode: 🚀🌟🎉中文日本語한국어";
		const routeUnicode = Route.GET("/test", handler, {
			description: unicodeDesc,
		});
		assert.equal(routeUnicode.description, unicodeDesc);
	});

	it("should handle handler edge cases", () => {
		// Test async handler
		const asyncHandler = async () => {
			return "async result";
		};
		const routeAsync = Route.GET("/test", asyncHandler);
		assert.equal(routeAsync.handler, asyncHandler);

		// Test handler that returns a value
		const returningHandler = () => {
			return "return value";
		};
		const routeReturning = Route.GET("/test", returningHandler);
		assert.equal(routeReturning.handler, returningHandler);

		// Test handler with parameters
		const paramHandler = (_ctx, param1, param2) => {
			return param1 + param2;
		};
		const routeParam = Route.GET("/test", paramHandler);
		assert.equal(routeParam.handler, paramHandler);

		// Test arrow function handler
		const arrowHandler = (ctx) => {
			ctx.status = 200;
		};
		const routeArrow = Route.GET("/test", arrowHandler);
		assert.equal(routeArrow.handler, arrowHandler);
	});

	it("should handle property mutation after creation", () => {
		const handler = () => {};
		const route = Route.GET("/original", handler);

		// Test modifying all properties
		const testMiddleware = () => {};
		route.method = HTTP_METHODS.POST;
		route.path = "/modified";
		route.handler = () => "modified";
		route.middleware = [testMiddleware];
		route.constraints = { modified: "value" };
		route.description = "Modified description";

		assert.equal(route.method, HTTP_METHODS.POST);
		assert.equal(route.path, "/modified");
		assert.equal(typeof route.handler, "function");
		assert.equal(route.middleware.length, 1);
		assert.equal(route.middleware[0], testMiddleware);
		assert.deepEqual(route.constraints, { modified: "value" });
		assert.equal(route.description, "Modified description");

		// Test setting properties to null/undefined
		route.middleware = null;
		route.constraints = undefined;
		route.description = null;

		assert.deepEqual(route.middleware, []);
		assert.deepEqual(route.constraints, {});
		assert.equal(route.description, "");
	});

	it("should handle all HTTP methods consistently", () => {
		const handler = () => {};
		const options = {
			middleware: [() => {}],
			constraints: { id: "\\d+" },
			description: "Test route",
		};

		// Test all HTTP methods with the same options
		const methods = [
			{ method: "GET", factory: Route.GET },
			{ method: "POST", factory: Route.POST },
			{ method: "PUT", factory: Route.PUT },
			{ method: "DELETE", factory: Route.DELETE },
			{ method: "PATCH", factory: Route.PATCH },
			{ method: "HEAD", factory: Route.HEAD },
			{ method: "OPTIONS", factory: Route.OPTIONS },
		];

		methods.forEach(({ method, factory }) => {
			const route = factory("/test", handler, options);
			assert.equal(route.method, HTTP_METHODS[method]);
			assert.equal(route.path, "/test");
			assert.equal(route.handler, handler);
			assert.deepEqual(route.middleware, options.middleware);
			assert.deepEqual(route.constraints, options.constraints);
			assert.equal(route.description, options.description);
		});
	});

	it("should handle default handler execution", () => {
		const route = new Route();
		const mockCtx = new Context(
			"GET",
			new URL("https://example.com/"),
			new Headers(),
			null,
		);

		// Test that default handler doesn't throw
		assert.doesNotThrow(() => {
			const result = route.handler(mockCtx);
			assert.equal(result, undefined);
		});

		// Test that default handler can be called multiple times
		assert.doesNotThrow(() => {
			route.handler(mockCtx);
			route.handler(mockCtx);
			route.handler(mockCtx);
		});
	});

	it("should handle route instantiation edge cases", () => {
		// Test creating multiple instances
		const route1 = new Route();
		const route2 = new Route();
		const route3 = new Route();

		assert(route1 instanceof Route);
		assert(route2 instanceof Route);
		assert(route3 instanceof Route);

		// Test that instances are independent
		route1.method = HTTP_METHODS.POST;
		route2.path = "/different";
		route3.handler = () => "custom";

		assert.equal(route1.method, HTTP_METHODS.POST);
		assert.equal(route2.path, "/different");
		assert.equal(typeof route3.handler, "function");

		// Test that other instances remain unchanged
		assert.equal(route2.method, HTTP_METHODS.GET);
		assert.equal(route3.method, HTTP_METHODS.GET);
		assert.equal(route1.path, "");
		assert.equal(route3.path, "");
		assert.equal(typeof route1.handler, "function");
		assert.equal(typeof route2.handler, "function");
	});

	it("should handle falsy options values for complete branch coverage", () => {
		const handler = () => {};

		// Test with falsy but not null/undefined middleware
		const routeWithFalsyMiddleware = Route.GET("/test", handler, {
			middleware: false,
		});
		assert.deepEqual(routeWithFalsyMiddleware.middleware, []);

		// Test with falsy but not null/undefined constraints
		const routeWithFalsyConstraints = Route.GET("/test", handler, {
			constraints: 0,
		});
		assert.deepEqual(routeWithFalsyConstraints.constraints, {});

		// Test with falsy but not null/undefined description
		const routeWithFalsyDescription = Route.GET("/test", handler, {
			description: 0,
		});
		assert.equal(routeWithFalsyDescription.description, "");

		// Test with empty string middleware
		const routeWithEmptyStringMiddleware = Route.GET("/test", handler, {
			middleware: "",
		});
		assert.deepEqual(routeWithEmptyStringMiddleware.middleware, []);

		// Test with zero constraints
		const routeWithZeroConstraints = Route.GET("/test", handler, {
			constraints: 0,
		});
		assert.deepEqual(routeWithZeroConstraints.constraints, {});

		// Test with empty string description
		const routeWithEmptyStringDescription = Route.GET("/test", handler, {
			description: "",
		});
		assert.equal(routeWithEmptyStringDescription.description, "");
	});

	it("should handle non-array middleware for complete branch coverage", () => {
		const route = new Route();

		// Test setting non-array middleware
		route.middleware = "not an array";
		assert.deepEqual(route.middleware, []);

		route.middleware = 123;
		assert.deepEqual(route.middleware, []);

		route.middleware = {};
		assert.deepEqual(route.middleware, []);

		route.middleware = null;
		assert.deepEqual(route.middleware, []);

		route.middleware = undefined;
		assert.deepEqual(route.middleware, []);

		route.middleware = false;
		assert.deepEqual(route.middleware, []);

		route.middleware = true;
		assert.deepEqual(route.middleware, []);

		route.middleware = () => {};
		assert.deepEqual(route.middleware, []);
	});

	it("should handle non-object constraints for complete branch coverage", () => {
		const route = new Route();

		// Test setting non-object constraints
		route.constraints = "not an object";
		assert.deepEqual(route.constraints, {});

		route.constraints = 123;
		assert.deepEqual(route.constraints, {});

		route.constraints = [];
		assert.deepEqual(route.constraints, []); // Arrays are objects

		route.constraints = null;
		assert.deepEqual(route.constraints, {});

		route.constraints = undefined;
		assert.deepEqual(route.constraints, {});

		route.constraints = false;
		assert.deepEqual(route.constraints, {});

		route.constraints = true;
		assert.deepEqual(route.constraints, {});

		route.constraints = () => {};
		assert.deepEqual(route.constraints, {});

		// Test with actual object
		const testConstraints = { id: "\\d+" };
		route.constraints = testConstraints;
		assert.deepEqual(route.constraints, testConstraints);
	});

	it("should handle non-string descriptions for complete branch coverage", () => {
		const route = new Route();

		// Test setting non-string descriptions
		route.description = 123;
		assert.equal(route.description, "");

		route.description = {};
		assert.equal(route.description, "");

		route.description = [];
		assert.equal(route.description, "");

		route.description = null;
		assert.equal(route.description, "");

		route.description = undefined;
		assert.equal(route.description, "");

		route.description = false;
		assert.equal(route.description, "");

		route.description = true;
		assert.equal(route.description, "");

		route.description = () => {};
		assert.equal(route.description, "");

		// Test with actual string
		route.description = "Test description";
		assert.equal(route.description, "Test description");
	});

	it("should handle falsy internal properties for complete branch coverage", () => {
		const route = new Route();

		// Test with falsy _middleware
		route._middleware = false;
		assert.deepEqual(route.middleware, []);

		route._middleware = 0;
		assert.deepEqual(route.middleware, []);

		route._middleware = "";
		assert.deepEqual(route.middleware, []);

		// Test with falsy _constraints
		route._constraints = false;
		assert.deepEqual(route.constraints, {});

		route._constraints = 0;
		assert.deepEqual(route.constraints, {});

		route._constraints = "";
		assert.deepEqual(route.constraints, {});

		// Test with falsy _description
		route._description = false;
		assert.equal(route.description, "");

		route._description = 0;
		assert.equal(route.description, "");

		route._description = null;
		assert.equal(route.description, "");

		// Test with actual values
		const testMiddleware = () => {};
		route._middleware = [testMiddleware];
		assert.equal(route.middleware.length, 1);
		assert.equal(route.middleware[0], testMiddleware);

		route._constraints = { test: "value" };
		assert.deepEqual(route.constraints, { test: "value" });

		route._description = "Test";
		assert.equal(route.description, "Test");
	});

	it("should handle edge cases in static methods for complete branch coverage", () => {
		const handler = () => {};

		// Test all HTTP methods with falsy options
		const methods = [
			{ method: "GET", factory: Route.GET },
			{ method: "POST", factory: Route.POST },
			{ method: "PUT", factory: Route.PUT },
			{ method: "DELETE", factory: Route.DELETE },
			{ method: "PATCH", factory: Route.PATCH },
			{ method: "HEAD", factory: Route.HEAD },
			{ method: "OPTIONS", factory: Route.OPTIONS },
		];

		methods.forEach(({ method: _method, factory }) => {
			// Test with falsy middleware
			const route1 = factory("/test", handler, { middleware: false });
			assert.deepEqual(route1.middleware, []);

			// Test with falsy constraints
			const route2 = factory("/test", handler, { constraints: 0 });
			assert.deepEqual(route2.constraints, {});

			// Test with falsy description
			const route3 = factory("/test", handler, { description: 0 });
			assert.equal(route3.description, "");

			// Test with empty string middleware
			const route4 = factory("/test", handler, { middleware: "" });
			assert.deepEqual(route4.middleware, []);

			// Test with zero constraints
			const route5 = factory("/test", handler, { constraints: 0 });
			assert.deepEqual(route5.constraints, {});

			// Test with empty string description
			const route6 = factory("/test", handler, { description: "" });
			assert.equal(route6.description, "");
		});
	});
});
